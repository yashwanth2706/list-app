/**
 * Enables edit mode for the given <li> element.
 * If the user is currently editing another <li> element, that element is restored to its original state.
 * The given <li> element is then cleared of its visible text and the edit mode row is appended to it.
 * The user is then shown a message indicating that they are now editing the given <li> element.
 * The user's focus is set to the edit mode text input field.
 * 
 * @param {HTMLLIElement} item - The <li> element to enable edit mode for.
 */
function enableEditMode(item) {
    
        if(item === editRow) return;

        if(editingItem !== item){
            restorePreviousItem(originalText);
        }

        originalText = item.textContent.trim();

        item.textContent = "";

        editInput.value = originalText;
        editRow.classList.remove("hide-edit-mode");

        item.appendChild(editRow);

        showMsg("orange", `Editing: ${originalText}`);

        editingItem = item;
        editInput.focus();
        return;
    }

/**
 * Enables delete mode for the list.
 * If the list is empty, a message is displayed and this function does nothing.
 * Otherwise, the user is shown a message indicating that delete mode is enabled,
 * and all <li> elements in the list are set to a purple color and their dataset.marked attribute is set to "false".
 */
function enableDeleteMode() {
        if (root.querySelectorAll('li').length === 0) {
            showMsg("red", "No items in the list: [CANNOT ENTER DELETE MODE]");
            return;
        }

        isInDeleteMode = true;

        showMsg("red", "Now you can select items to delete: [ENABLED DELETE MODE]");

        root.querySelectorAll('li').forEach(li => {
            li.dataset.marked = "false";
            li.style.color = "purple";
        });
        return;
    }

function confirmDeletion() {

        const marked = root.querySelectorAll('li[data-marked="true"]');

        if (marked.length === 0) {
                showMsg("red", "No items selected: [DELETE MODE: EXITED]");
                disableDeleteMode();
                return;
        }

        if(!isConfirmDeleteActive()) {
                showMsg("blue", `sure to delete ${marked.length} items(s)? Click delete again to confirm!/ Deselect all items to cancel!`);
                setConfirmDelete();
                return;
        }

        if(isConfirmDeleteActive()) {
                marked.forEach(li => li.remove());
                showMsg("red", `DELETED: ${marked.length} item(s) and DELETE MODE: EXITED`);
                disableDeleteMode();
                return;
        }
        return;
    }

function disableDeleteMode() {

        root.querySelectorAll('li').forEach(li => {
        li.dataset.marked = "false";
        li.style.color = "black";
        });

        isInDeleteMode = false;
        confirmDelete = false;
    }

function disableEditMode() {
    isInEditMode = false;
}