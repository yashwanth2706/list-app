// ─── REDUCER ─────────────────────────────────────────────────────────────────
//
// The reducer is the single place where appState is allowed to change.
// Nothing else in the codebase should mutate appState directly.
//
// How it works:
//   1. An event happens (user clicks a button)
//   2. The event listener calls dispatch({ type: "ACTION_NAME", payload: ... })
//   3. dispatch() snapshots the current state, then passes it to reducer()
//   4. reducer() mutates appState based on the action type
//   5. dispatch() then calls render(prevState, appState) to update the DOM
//
// Why a switch statement?
//   Each case represents one thing that can happen in the app.
//   This makes it easy to find exactly where a state change occurs —
//   instead of hunting across multiple files for setter functions.
//
// Why mutate appState directly instead of returning a new object?
//   This is vanilla JS, not React. We don't need immutability here.
//   Mutating directly keeps the code simple and readable without
//   sacrificing the benefits of centralized state management.
// ─────────────────────────────────────────────────────────────────────────────

function reducer(state, action) {
    switch (action.type) {

        // ADD_ITEM now stores an object instead of a plain string.
        // id is generated once at creation and never changes —
        // this is what we use to find, update, and delete items
        // instead of matching by text (which breaks on duplicates).
        // crypto.randomUUID() is built into modern browsers — no library needed.
        case "ADD_ITEM":
            state.items.push({
                id: crypto.randomUUID(),
                text: action.payload.text
            });
            break;

        // User clicked Clear and the list had items.
        // First click sets confirmClear = true (waiting for confirmation).
        // Second click (handled as CONFIRM_CLEAR) actually clears the list.
        case "SET_CONFIRM_CLEAR":
            state.confirmClear = true;
            break;

        // User clicked Clear a second time, confirming they want to clear.
        case "CONFIRM_CLEAR":
            state.items = [];
            state.confirmClear = false;
            break;

        // User navigated away or the clear confirmation was no longer relevant.
        // Resets the pending confirmation without clearing the list.
        case "RESET_CLEAR":
            state.confirmClear = false;
            break;

        // User clicked a list item to edit it.
        // payload: { element: <li>, item: { id, text } }
        // editingItem holds the actual <li> DOM reference so render()
        // knows which element to attach the editRow to.
        // originalText holds the text before edits, used by cancel and restore.
        case "ENABLE_EDIT_MODE":
            state.isInEditMode = true;
            state.editingItem = action.payload.item;      // { id, text } for logic
            state.editingElement = action.payload.element; // <li> for render
            state.originalText = action.payload.item.text;
            break;

        // User clicked Cancel or finished editing.
        // Clears both editingItem and originalText since edit session is over.
        case "DISABLE_EDIT_MODE":
            state.isInEditMode = false;
            state.editingItem = null;
            state.originalText = null;
            state.editingElement = null;
            break;

        // payload: { newText: "updated text" }
        // Finds the item by its stable id, not by its text.
        case "SAVE_EDIT":
            state.items = state.items.map(item =>
                item.id === state.editingItem.id
                    ? { ...item, text: action.payload.newText }
                    : item
            );
            state.isInEditMode = false;
            state.editingItem = null;
            state.originalText = null;
            state.editingElement = null;
            break;

        // User clicked the Delete button while not in delete mode.
        // Marks all items as candidates for deletion (marked: false by default).
        case "ENABLE_DELETE_MODE":
            state.isInDeleteMode = true;
            state.confirmDelete = false;
            break;

        // User exited delete mode (via cancel, after deletion, or via add button).
        // Resets all delete-related state.
        case "DISABLE_DELETE_MODE":
            state.isInDeleteMode = false;
            state.confirmDelete = false;
            break;

        // User clicked Delete button once while in delete mode with items selected.
        // Sets confirmDelete = true, waiting for a second click to confirm.
        case "SET_CONFIRM_DELETE":
            state.confirmDelete = true;
            break;

        // payload: { idsToDelete: ["uuid1", "uuid2"] }
        case "CONFIRM_DELETE":
            state.items = state.items.filter(
                item => !action.payload.idsToDelete.includes(item.id)
            );
            state.isInDeleteMode = false;
            state.confirmDelete = false;
            break;

        default:
            console.warn(`reducer: unknown action type "${action.type}"`);
    }
}

// ─── DISPATCH ─────────────────────────────────────────────────────────────────
//
// dispatch() is the only way to trigger a state change.
// Event listeners call dispatch() — they never touch appState directly.
//
// Why snapshot prevState with spread?
//   render() needs to compare what changed between the old and new state.
//   Without a snapshot, prevState and currState would point to the same
//   object and render() would see no difference.
//
// Note: spread { ...appState } is a shallow copy. This is fine here because
//   appState's nested values (like items[]) are replaced entirely in each
//   case rather than mutated in place — so the snapshot stays accurate.
// ─────────────────────────────────────────────────────────────────────────────

function dispatch(action) {
    const prevState = { 
        ...appState,
        items: [...appState.items]
    };
    reducer(appState, action);
    render(prevState, appState);
}