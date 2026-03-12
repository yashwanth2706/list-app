const appState = {
    editingItem : null,     // { id, text } — the item object being edited.
    editingElement : null,  // the actual <li> DOM element being edited.
    originalText : null,
    isInEditMode : false,
    isInDeleteMode : false,
    confirmClear : false,
    confirmDelete : false,
    items : []
}
