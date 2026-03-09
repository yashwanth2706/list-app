
/**
 * Displays a message on the page with the given color and text.
 * 
 * @param {string} colorName - The color to display the message in.
 * @param {string} messageText - The text to display in the message.
 */
function showMsg(colorName, messageText) {
        message.style.color = colorName;
        message.textContent = messageText;
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

function resetEditingItem() {
        editingItem = null;
        return;
    }

/**
 * Resets the previously edited <li> element to its original state.
 * If there is no previously edited element, this function does nothing.
 * 
 * This function is used when the user clicks away from the edited <li> element,
 * effectively cancelling the edit.
 */
function restorePreviousItem(textToShow) {
        // RESTORE previous state for editingItem
        if(!editingItem) return;

        // Restore the <li>'s visible text and styling
        editingItem.textContent = textToShow;
        editingItem.title = "Edit";
        editingItem.style.cursor = "pointer";

        editRow.classList.add("hide-edit-mode");
        // move editRow back into root after every edit so it is never
        // stranded inside a <li> that could get removed by the clear button.
        root.appendChild(editRow);

        resetEditingItem();
        disableEditMode();
        return;
    }

/**
 * Resets the value of the itemname input field to an empty string.
 * This function is used to clear the input field after adding a new item to the list.
 * itemname is DOM refference.
 */
function resetInputField() {
        itemname.value = "";
    }

/**
 * Adds a new <li> element to the main list container with the given text.
 * Sets the title attribute of the new <li> element to "Edit".
 * Sets the style cursor of the new <li> element to "pointer".
 * Appends the new <li> element to the main list container.
 * Resets input field after adding the new item.
 * 
 * @param {string} name - The text to display in the new <li> element.
 */
function addItemToList(name) {
        const listItem = document.createElement('li');
        listItem.textContent = name;
        listItem.title = "Edit";
        listItem.style.cursor = "pointer";
        root.append(listItem);
        resetInputField();
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