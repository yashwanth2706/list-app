addToListBtn.addEventListener("click", () => {

    // If delete mode is active, exit it first before doing anything else.
    // The user clicking Add is a signal they want to leave delete mode.
    if(appState.isInDeleteMode){
        dispatch({type: "DISABLE_DELETE_MODE"});
        showMsg("green", "DELETE MODE: EXITED");
        return;
    }

    // If a clear confirmation is pending, cancel it.
    // Clicking Add is a signal the user changed their mind.
    if (appState.confirmClear) {
        dispatch({ type: "RESET_CLEAR" });
    }

    const listItemName = itemname.value.trim();

    if (!listItemName) {
        showMsg("red", "Add an Item to list");
        return;
    }

    // Split, clean, and dispatch one ADD_ITEM per valid item.
    // Cleaning happens here because it's input preparation —
    // the reducer receives already-clean text and doesn't need to know
    // where it came from or how it was sanitized.
    const listItemArray = listItemName.split(', ');
    let count = 0;
    let lastAdded = "";

    for (let item of listItemArray) {
        const cleanItem = item.replace(/[^A-Za-z0-9 ]/g, "").trim();
        if (cleanItem.length > 0) {
            dispatch({ type: "ADD_ITEM", payload: { text: cleanItem } });
            lastAdded = cleanItem;
            count++;
        }
    }

    resetInputField();

    if (count === 1) {
        showMsg("green", `Added: ${lastAdded}`);
    } else {
        showMsg("green", `Added +${count} item(s)`);
    }
});


clearBtn.addEventListener("click", () => {

    // Cannot clear while editing — user must finish or cancel the edit first.
    if (appState.isInEditMode) {
        showMsg("blue", `Complete cancel/edit for [${appState.originalText}] (to) => [${editInput.value}] and try again, [CANNOT ENTER CLEAR MODE]`);
        return;
    }

    // Cannot clear while in delete mode — modes conflict.
    if (appState.isInDeleteMode) {
        showMsg("red", "Unable to enter clear state: [DELETE MODE ENABLED - EXIT DELETE MODE FIRST]");
        return;
    }

    // Nothing in state means nothing to clear.
    if (appState.items.length === 0) {
        showMsg("red", "Nothing to clear");
        return;
    }

    // First click — ask for confirmation.
    if (!appState.confirmClear) {
        dispatch({ type: "SET_CONFIRM_CLEAR" });
        showMsg("blue", "Are you sure to clear the list? (Click again to proceed!)");
        return;
    }

    // Second click — confirmed, clear the list.
    dispatch({ type: "CONFIRM_CLEAR" });
    showMsg("green", "Cleared!");
});


root.addEventListener("click", (event) => {

    // Any click inside root cancels a pending clear confirmation.
    // The user is clearly doing something else.
    if (appState.confirmClear) {
        dispatch({ type: "RESET_CLEAR" });
    }

    // Clicks bubbling up from inside editRow (the input, Edit btn, Cancel btn)
    // should not trigger list item logic. Guard against that here.
    if (event.target.closest('#editRow')) return;

    const listItemClicked = event.target.closest('li');

    // ── DELETE MODE BRANCH ────────────────────────────────────────────────────
    // In delete mode, clicks toggle items as marked/unmarked.
    // Clicking outside a <li> does nothing.
    if (appState.isInDeleteMode) {
        if (!listItemClicked) return;

        // Toggle the marked state directly on the DOM element.
        // This is intentionally not dispatched through the reducer because
        // marked/unmarked is a temporary visual selection, not persistent app state.
        // It only becomes meaningful when the user confirms deletion,
        // at which point the listener collects the marked ids and dispatches CONFIRM_DELETE.
        if (listItemClicked.dataset.marked === "true") {
            listItemClicked.dataset.marked = "false";
            listItemClicked.style.color = "purple";
        } else {
            listItemClicked.dataset.marked = "true";
            listItemClicked.style.color = "red";
        }

        const markedItems = root.querySelectorAll('li[data-marked="true"]');
        showMsg("blue", `Sure to delete ${markedItems.length} item(s)? Click delete again to confirm! / Deselect all to cancel!`);
        return;
    }

    // ── EDIT MODE BRANCH ──────────────────────────────────────────────────────
    // Clicking outside a <li> while not in delete mode does nothing.
    if (!listItemClicked) {
        showMsg("red", "Nothing to edit");
        return;
    }

    // Read the item object from state by matching the <li>'s data-id attribute.
    // This is how we bridge the DOM click event back to the state item.
    const itemId = listItemClicked.dataset.id;
    const itemInState = appState.items.find(item => item.id === itemId);

    // If already editing a different item, the reducer will handle
    // cleaning up the previous edit session before starting the new one.
    dispatch({
        type: "ENABLE_EDIT_MODE",
        payload: {
            item: itemInState,       // { id, text } — for reducer logic
            element: listItemClicked // <li> — for render to attach editRow
        }
    });

    showMsg("orange", `Editing: ${itemInState.text}`);
});


// CANCEL
cancelBtn.addEventListener("click", () => {
    const canceledText = appState.originalText;
    dispatch({ type: "DISABLE_EDIT_MODE" });
    showMsg("green", `Restored: ${canceledText} - [CANCELED EDIT]`);
});

// EDIT (Save)
editBtn.addEventListener("click", () => {
    const newText = editInput.value.trim();

    if (!newText) {
        showMsg("red", `Update the [${appState.originalText}] item to edit`);
        return;
    }

    const oldText = appState.originalText;
    dispatch({ type: "SAVE_EDIT", payload: { newText } });
    showMsg("green", `Updated: [${oldText}] to [${newText}]`);
});

// DELETE
deleteBtn.addEventListener("click", () => {

    // Cannot enter delete mode while editing.
    if (appState.isInEditMode) {
        showMsg("blue", `Complete cancel/edit for [${appState.originalText}] (to) => [${editInput.value}] and try again, [CANNOT ENTER DELETE MODE]`);
        return;
    }

    // Not in delete mode yet — enter it.
    if (!appState.isInDeleteMode) {
        dispatch({ type: "ENABLE_DELETE_MODE" });
        showMsg("red", "Now you can select items to delete: [ENABLED DELETE MODE]");
        return;
    }

    // Already in delete mode — check if any items are marked.
    const markedItems = root.querySelectorAll('li[data-marked="true"]');

    if (markedItems.length === 0) {
        dispatch({ type: "DISABLE_DELETE_MODE" });
        showMsg("red", "No items selected: [DELETE MODE: EXITED]");
        return;
    }

    // Items are marked but not yet confirmed — ask for confirmation.
    if (!appState.confirmDelete) {
        dispatch({ type: "SET_CONFIRM_DELETE" });
        showMsg("blue", `Sure to delete ${markedItems.length} item(s)? Click delete again to confirm!`);
        return;
    }

    // Confirmed — collect ids from marked <li> elements and delete.
    // ids are read from data-id attributes stamped by renderList.
    const idsToDelete = [...markedItems].map(li => li.dataset.id);
    dispatch({ type: "CONFIRM_DELETE", payload: { idsToDelete } });
    showMsg("red", `DELETED: ${idsToDelete.length} item(s) - [DELETE MODE: EXITED]`);
});
