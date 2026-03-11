# Refactoring: DOM-as-State → State-First Architecture

This document explains every meaningful change made during the refactor of the list app from a DOM-as-state approach to a state-first approach. It covers what changed, why it changed, the pain points that were eliminated, and how the diffing algorithm works.

---

## The Core Problem: DOM-as-State

In the original codebase, the DOM was the source of truth. To know how many items were in the list, you queried the DOM:

```javascript
const listItems = root.querySelectorAll('li');
```

To know which item was being edited, you held a reference to a live `<li>` element:

```javascript
let editingItem = null; // assigned to a <li> DOM element
```

To know whether an item was marked for deletion, you read a `data-*` attribute off the element:

```javascript
listItemClicked.dataset.marked === "true"
```

This works — but it creates a tight coupling between your logic and your DOM structure. Your functions needed to touch the DOM not just to display things, but to *know* things. State and presentation were tangled together.

### Pain Points This Created

**1. Logic was scattered across files.**
`enableEditMode()` in `modes.js` was doing three jobs at once: updating state variables, manipulating the DOM, and triggering messages. To understand what happened when a user clicked a list item, you had to trace through `eventListeners.js` → `modes.js` → `functions.js`. There was no single place to look.

**2. State was implicit and fragile.**
The app's condition at any moment was spread across six `let` variables (`editingItem`, `originalText`, `isInEditMode`, `isInDeleteMode`, `confirmClear`, `confirmDelete`) defined at the top of a file. Any function anywhere could mutate them. There was no contract around when or how they changed.

**3. Resetting state required remembering to call multiple functions.**
Exiting edit mode meant calling `resetEditingItem()`, `disableEditMode()`, moving `editRow` back to root, restoring the `<li>`'s text, and resetting cursor styles — all in the right order, across multiple functions. Missing one step caused subtle bugs.

**4. DOM queries were used as state checks.**
`root.querySelectorAll('li').length === 0` to check if the list was empty. `root.querySelectorAll('li[data-marked="true"]')` to know what was selected. The DOM was being used as a database — which means your logic only worked if the DOM was in sync, and there was no single place that guaranteed that.

---

## The Solution: One Source of Truth

The refactor introduces `appState` as the single object that describes everything meaningful about the app at any moment:

```javascript
const appState = {
    editingItem: null,      // { id, text } — the item object being edited
    editingElement: null,   // the actual <li> DOM element being edited
    originalText: null,     // text before editing began, used by cancel
    isInEditMode: false,
    isInDeleteMode: false,
    confirmClear: false,
    confirmDelete: false,
    items: []               // [{ id, text }, ...] — the list itself
}
```

The DOM now reflects state. It is no longer the source of it.

---

## What Changed and Why

### `appState.js` — Items Are Now Objects

The most important structural change: list items are no longer plain strings stored in the DOM. They are objects with a stable unique id stored in state:

```javascript
// Before: item lived only in the DOM as <li> text content
listItem.textContent = name;

// After: item lives in state as an object
{ id: crypto.randomUUID(), text: "Buy groceries" }
```

`crypto.randomUUID()` generates a unique string like `"a1b2c3d4-..."` at creation time. This id never changes. It is the stable identity of an item — used to find it, update it, and delete it without ever relying on its text content matching.

This matters because text-based matching breaks on duplicates. If you have two items both named "Milk" and you edit one, a `find` by text would match the wrong one. The id eliminates this problem entirely.

---

### `reducer.js` — Centralized State Changes

The reducer is the single place where `appState` is allowed to change. Nothing else in the codebase mutates state directly.

**Before:** state changes were scattered across setter functions in `stateManager.js` and inside mode functions in `modes.js`:

```javascript
function setIsInEditMode() { isInEditMode = true; }
function resetEditingItem() { editingItem = null; }
// called from multiple places in multiple files
```

**After:** every possible state change is a named case in one switch statement:

```javascript
function reducer(state, action) {
    switch (action.type) {
        case "ENABLE_EDIT_MODE":
            state.isInEditMode = true;
            state.editingItem = action.payload.item;
            state.editingElement = action.payload.element;
            state.originalText = action.payload.item.text;
            break;
        // ...
    }
}
```

To understand what happens when a user clicks a list item, you look at one case. Everything that changes is listed there, in one place, in order.

**Why mutate `appState` directly instead of returning a new object?**
This is vanilla JS, not React. Returning a new object on every action would require reassigning `appState` everywhere it's referenced. Mutating directly is simpler here without sacrificing the benefits of centralized state management. The immutability discipline is enforced by convention — only the reducer touches `appState`.

---

### `dispatch()` — The Only Entry Point for State Changes

```javascript
function dispatch(action) {
    const prevState = {
        ...appState,
        items: [...appState.items]  // snapshot items as a new array
    };
    reducer(appState, action);
    render(prevState, appState);
}
```

Every state change flows through `dispatch()`. Event listeners call `dispatch()` — they never touch `appState` directly.

**Why snapshot `prevState` before calling the reducer?**
`render()` needs to compare the old state with the new state to know what changed. Without a snapshot, `prevState` and `currState` would point to the same object, and `render()` would see no difference.

**Why is `items` spread separately with `[...appState.items]`?**
`{ ...appState }` is a shallow copy — it copies primitive values (`boolean`, `string`, `null`) by value, but copies arrays and objects by reference. This means `prevState.items` and `appState.items` would point to the same array. When the reducer calls `state.items.push(...)`, it mutates that shared array — and by the time `render()` runs, both `prevState.items` and `currState.items` look identical. The list would never re-render.

Spreading `items` separately creates a new array reference for the snapshot, so the comparison works correctly.

This is a classic shallow copy pitfall. React avoids it entirely by requiring the reducer to always return a new object — which is why that convention exists there.

---

### `render.js` — DOM Updates Driven by State

The render function is called after every dispatch. It compares `prevState` and `currState` and updates only the parts of the DOM that changed.

```javascript
function render(prevState, currState) {
    renderList(prevState, currState);
    renderEditMode(prevState, currState);
    renderDeleteMode(prevState, currState);
}
```

Each sub-function handles one visual concern independently.

---

## The Diffing Algorithm

A diffing algorithm compares two snapshots of state and determines the minimum set of DOM updates needed to reflect the change. This app implements a simple manual version of what React's virtual DOM does automatically.

### How It Works Here

**`renderList` — content diffing:**

```javascript
function renderList(prevState, currState) {
    if (JSON.stringify(prevState.items) === JSON.stringify(currState.items)) return;
    // rebuild list...
}
```

`JSON.stringify` serializes both arrays to strings and compares them. If the strings are identical, nothing changed and the function returns immediately — no DOM work done.

If they differ, the list is rebuilt from scratch: all existing `<li>` elements are removed and new ones are created from `currState.items`. Each `<li>` gets `data-id` stamped onto it:

```javascript
li.dataset.id = item.id;
```

This is the bridge between the DOM and state. When a user clicks a `<li>`, the event listener reads `listItemClicked.dataset.id` and looks up the matching object in `appState.items` — connecting a DOM event back to a state item without relying on text content.

**`renderEditMode` — mode transition diffing:**

```javascript
const editModeChanged = prevState.isInEditMode !== currState.isInEditMode;
const editingItemChanged = prevState.editingItem?.id !== currState.editingItem?.id;

if (!editModeChanged && !editingItemChanged) return;
```

Two conditions are checked: did the mode turn on/off, or did the user switch to editing a different item? If neither changed, no DOM update is needed.

On entering edit mode, `currState.editingElement` (the `<li>`) has its text cleared and `editRow` is appended inside it. On exiting, the `<li>`'s text is restored by reading from `currState.items` — not from the DOM input. State is the source of truth, not the input field.

**`renderDeleteMode` — boolean diffing:**

```javascript
if (prevState.isInDeleteMode === currState.isInDeleteMode) return;
```

The simplest case — a single boolean comparison. If delete mode didn't change, nothing visual needs to change either.

### Why This Matters

Before the refactor, DOM updates were scattered and imperative:

```javascript
listItem.style.cursor = "pointer";
listItem.style.color = "purple";
editRow.classList.add("hide-edit-mode");
root.appendChild(editRow);
```

These calls were spread across `enableEditMode`, `restorePreviousItem`, `disableDeleteMode`, and `addItemToList`. There was no guarantee they were called in the right order or at the right time.

After the refactor, every DOM update flows from one trigger — `render(prevState, currState)` — and only runs when the relevant piece of state actually changed. The DOM is always a direct reflection of `appState`. There is no way for them to get out of sync.

---

### What Is Intentionally Left Outside the Reducer

**Marked/unmarked item toggling in delete mode** is handled directly in the `root` event listener and not dispatched through the reducer:

```javascript
listItemClicked.dataset.marked = "true";
listItemClicked.style.color = "red";
```

This is intentional. Marked/unmarked is temporary visual selection — it only matters at the moment the user confirms deletion. Storing it in `appState` would mean treating ephemeral UI interaction as persistent app state, which is the wrong trade-off. When deletion is confirmed, the listener collects the marked ids from the DOM at that moment and sends them as a payload:

```javascript
const idsToDelete = [...markedItems].map(li => li.dataset.id);
dispatch({ type: "CONFIRM_DELETE", payload: { idsToDelete } });
```

The DOM holds the selection. State holds the data. They are reconciled only at the moment of action.

---

### Capturing State Before Dispatch

In `cancelBtn` and `editBtn`, values are captured before dispatching:

```javascript
// cancelBtn
const canceledText = appState.originalText;
dispatch({ type: "DISABLE_EDIT_MODE" });
showMsg("green", `Restored: ${canceledText} - [CANCELED EDIT]`);

// editBtn
const oldText = appState.originalText;
dispatch({ type: "SAVE_EDIT", payload: { newText } });
showMsg("green", `Updated: [${oldText}] to [${newText}]`);
```

After `dispatch` runs, the reducer has already cleared `appState.originalText` to `null`. Reading it after dispatch would produce a broken message. This is a general principle: if you need a value for a side effect (like a status message) that the reducer will clear, capture it before dispatching.

---

## Final File Structure and Responsibilities

```
appState.js         → single source of truth, never mutated outside reducer
reducer.js          → all state changes + dispatch()
render.js           → all DOM updates, driven by state diff
functions.js        → showMsg(), resetInputField() — slim DOM helpers
domReferences.js    → all getElementById references, grabbed once on load
eventListeners.js   → user events → dispatch() calls only, no state logic
```

Each file has one clear responsibility. To find where state changes: `reducer.js`. To find where the DOM updates: `render.js`. To find what triggers a change: `eventListeners.js`. No hunting across files.

---

## Connection to React

This refactor is not just a cleanup — it is the mental model React is built on.

| This app | React equivalent |
|---|---|
| `appState` | `useState` / `useReducer` |
| `dispatch()` | `dispatch` from `useReducer` |
| `reducer()` | reducer function in `useReducer` |
| `render(prevState, currState)` | React's reconciler / virtual DOM diff |
| `appState.items[]` | state array mapped to JSX elements |
| `data-id` on `<li>` | `key` prop on list elements |
| `renderList` full rebuild | React re-rendering a component |

The `key` prop in React serves exactly the same purpose as `data-id` here — it gives React a stable identity for each list element so it can diff correctly. The reason React warns you when you use array index as a key is the same reason text-based matching broke here: it's not a stable identity.

You have now built the state-first mental model by hand. React automates the diffing and re-rendering parts — but the concepts are identical.
