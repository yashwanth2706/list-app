
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
