function resetEditingItem() {
    appState.editingItem = null;
}

function resetConfirmDelete() {
    appState.confirmDelete = false;
}

function setConfirmDelete() {
    appState.confirmDelete = true;
}

function setConfirmClear() {
    appState.confirmClear = true;
}

function resetClearState() {
    appState.confirmClear = false;
}

function setIsInEditMode() {
    appState.isInEditMode = true;
}    

function isConfirmClearActive() {
    return appState.confirmClear;
}

function isInEditModeActive() {
    return appState.isInEditMode;
}

function textStoredInListItem() {
    return appState.originalText;
}

function isInDeleteModeActive() {
    return appState.isInDeleteMode;
}

function isConfirmDeleteActive() {
    return appState.confirmDelete;
}
