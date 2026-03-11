// ─── RENDER ──────────────────────────────────────────────────────────────────
//
// render() is the single place where the DOM is updated.
// It is called by dispatch() after every state change, with a snapshot
// of the previous state and the current state as arguments.
//
// Why compare prevState and currState?
//   We only update the parts of the DOM that actually changed.
//   This avoids unnecessary redraws and makes the render logic
//   easy to follow — each block answers: "did this specific thing change?"
//
// Why is render() separate from the reducer?
//   The reducer only cares about data (state).
//   render() only cares about the DOM (visuals).
//   Keeping them separate means you can reason about each independently.
//   This is the same principle React is built on.
//
// Structure:
//   Each section handles one visual concern:
//   1. List items      — the <li> elements inside <ol#root>
//   2. Edit mode       — the editRow visibility and input value
//   3. Delete mode     — item colors and cursor styles
//   4. Status message  — the feedback text shown to the user
// ─────────────────────────────────────────────────────────────────────────────

function render(prevState, currState) {
    renderList(prevState, currState);
    renderEditMode(prevState, currState);
    renderDeleteMode(prevState, currState);
}

// ─── 1. LIST ─────────────────────────────────────────────────────────────────
//
// Rebuilds the <li> elements whenever the items array changes.
//
// Why check array length and content with JSON.stringify?
//   items[] is replaced entirely in the reducer (never mutated in place),
//   so a reference check (prevState.items === currState.items) would always
//   be false even if the content is identical. stringify lets us compare
//   the actual content cheaply for a simple list like this.
//
// Why rebuild all <li> elements instead of patching the changed one?
//   For a list this size, a full rebuild is simpler and fast enough.
//   React's virtual DOM does a more sophisticated version of this diffing —
//   this is the manual equivalent.
//
// Why preserve editRow before clearing?
//   editRow lives inside root during edit mode. Clearing innerHTML would
//   destroy it. We detach it first, rebuild the list, then let
//   renderEditMode() reattach it to the correct <li>.
// ─────────────────────────────────────────────────────────────────────────────

function renderList(prevState, currState) {
    if (JSON.stringify(prevState.items) === JSON.stringify(currState.items)) return;

    // Detach editRow before wiping root so it isn't destroyed
    if (currState.isInEditMode) {
        root.appendChild(editRow);
    }

    // Remove all existing <li> elements
    root.querySelectorAll('li').forEach(li => li.remove());

    // Rebuild <li> elements from state
    currState.items.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item.text;
        li.dataset.id = item.id;
        li.title = "Edit";
        li.style.cursor = "pointer";
        root.appendChild(li);
    });
}

// ─── 2. EDIT MODE ────────────────────────────────────────────────────────────
//
// Shows or hides the editRow and populates the input with the item's text.
//
// Entering edit mode:
//   - currState.editingElement is the <li> the user clicked.
//   - We clear its visible text (the editRow takes its place visually).
//   - editRow is appended inside the <li> so it appears inline.
//   - editInput is populated with originalText so the user sees what they're editing.
//
// Exiting edit mode (cancel or save):
//   - The <li>'s text is restored from currState.items (already updated by reducer).
//   - editRow is moved back to root (parked safely, hidden).
//   - editInput is cleared.
//
// Why read the updated text from currState.items instead of editInput.value?
//   On SAVE_EDIT the reducer already updated items[] with the new text.
//   On DISABLE_EDIT_MODE (cancel) the text stays as originalText.
//   Either way, the source of truth is state, not the DOM input.
// ─────────────────────────────────────────────────────────────────────────────

function renderEditMode(prevState, currState) {
    const editModeChanged = prevState.isInEditMode !== currState.isInEditMode;
    const editingItemChanged = prevState.editingItem?.id !== currState.editingItem?.id;

    if (!editModeChanged && !editingItemChanged) return;

    if (currState.isInEditMode && currState.editingElement) {
        // Entering edit mode — attach editRow inside the clicked <li>
        currState.editingElement.textContent = "";
        editInput.value = currState.originalText;
        editRow.classList.remove("hide-edit-mode");
        currState.editingElement.appendChild(editRow);
        editInput.focus();
        return;
    }

    // Exiting edit mode — restore the <li> and park editRow back in root
    if (prevState.editingElement) {
        const restoredItem = currState.items.find(
            item => item.id === prevState.editingItem?.id
        );

        // On cancel, restoredItem still exists with original text.
        // On save, restoredItem has the updated text.
        // Either way we read from state, not from the DOM.
        if (restoredItem) {
            prevState.editingElement.textContent = restoredItem.text;
            prevState.editingElement.title = "Edit";
            prevState.editingElement.style.cursor = "pointer";
        }

        editRow.classList.add("hide-edit-mode");
        root.appendChild(editRow);
        editInput.value = "";
    }
}

// ─── 3. DELETE MODE ──────────────────────────────────────────────────────────
//
// Applies and removes the visual delete mode styling on <li> elements.
//
// Entering delete mode:
//   - All <li> elements turn purple and get data-marked="false"
//   - Cursor changes to pointer to signal they are clickable/selectable
//
// Exiting delete mode:
//   - All <li> elements are reset to black with data-marked="false"
//
// Note: the toggling of individual items (red when marked, purple when
//   unmarked) is handled in the event listener directly since it is a
//   user interaction response, not a state-driven render concern.
//   Only the mode entry/exit is handled here.
// ─────────────────────────────────────────────────────────────────────────────

function renderDeleteMode(prevState, currState) {
    if (prevState.isInDeleteMode === currState.isInDeleteMode) return;

    if (currState.isInDeleteMode) {
        root.querySelectorAll('li').forEach(li => {
            li.dataset.marked = "false";
            li.style.color = "purple";
            li.style.cursor = "pointer";
        });
        return;
    }

    // Exiting delete mode — reset all items to default styling
    root.querySelectorAll('li').forEach(li => {
        li.dataset.marked = "false";
        li.style.color = "black";
        li.style.cursor = "pointer";
    });
}
