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
                showMsg("red", "No items selected: [EXIT DELETE MODE]");
                exitDeleteMode();
                return;
        }

        if(!confirmDelete) {
                showMsg("blue", `sure to delete ${marked.length} items(s)? Click delete again to confirm!`);
                confirmDelete = true;
                return;
        }

        if(confirmDelete) {
                confirmDelete = false;
                marked.forEach(li => li.remove());
                showMsg("red", `DELETED: ${marked.length} item(s) and EXIT DELETE MODE`);
                exitDeleteMode();
                return;
        }
        return;
    }

function exitDeleteMode() {

        root.querySelectorAll('li').forEach(li => {
        li.dataset.marked = "false";
        li.style.color = "black";
        });

        isInDeleteMode = false;
        confirmDelete = false;
    }