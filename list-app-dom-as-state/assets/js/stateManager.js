function resetEditingItem() {
        editingItem = null;
        return;
    }

/**
 * Resets the value of the itemname input field to an empty string.
 * This function is used to clear the input field after adding a new item to the list.
 * itemname is DOM refference.
 */
function resetInputField() {
        itemname.value = "";
        return;
    }

function resetConfirmDelete() {
    confirmDelete = false;
    return;
}

function setConfirmDelete() {
    confirmDelete = true;
    return;
}

function isConfirmDeleteActive() {
    return confirmDelete;
}

function setConfirmClear() {
    confirmClear = true;
    return;
}

/**
 * Resets the confirmClear state variable to false.
 * This function is used after the user confirms clearing the list or cancels the clear list action.
 */
function resetClearState(){
        confirmClear = false;
        return;
    }

function isConfirmClearActive() {
    return confirmClear;
}

function setIsInEditMode() {
    isInEditMode = true;
    return;
}

function isInEditModeActive() {
    return isInEditMode;
}

function textStoredInListItem() {
    return originalText;
}

function inputTextInEditMode() {
    return editInput.value;
}

function isInDeleteModeActive() {
    return isInDeleteMode;
}