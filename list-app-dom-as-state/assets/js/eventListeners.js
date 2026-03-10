// ADD to List
addToListBtn.addEventListener("click", () => {

    if(isInDeleteModeActive()){
        disableDeleteMode();
        showMsg("green", "DELETE MODE: EXITED");
        return;
    }

    const listItemName = itemname.value.trim();

    if(isConfirmClearActive()){
        resetClearState();
    }

    if(!listItemName){
        showMsg("red", "Add an Item to list");
        return;
    }

    // 1. Split the string into an array first
    let listItemArray = listItemName.split(', ');
    let cleanItem = "";
    let count = 0;

    // 2. Loop through each item
    for (let item of listItemArray){
        cleanItem = item.replace(/[^A-Za-z0-9 ]/g, "").trim();

        // 3. Only add if the item isn't empty after cleaning
        if (cleanItem.length > 0) {
            addItemToList(cleanItem);
            count++;
        }
    }

    if(count === 1) {
        showMsg("green", `Added ${cleanItem}`);
    } 
    else {
        showMsg("green", `Added +${count} item(s)`);
    }
    return;
});

// CLEAR list
clearBtn.addEventListener("click", () => {

    // Remove only <li> elements, leaving the editRow <span> untouched in root.
    const listItems = root.querySelectorAll('li');

    // if clearing while in edit mode, safely exit first so editRow
    // is moved back to root before we start removing children.
    if(isInEditModeActive()) {
        showMsg("blue", `Complete cancel/edit for [${textStoredInListItem()}] (to) => [${inputTextInEditMode()}] and try again, [CANNOT ENTER CLEAR MODE]`);
        return;
    }

    if(isInDeleteModeActive()) {
        showMsg("red", "Unable to enter clear state: [DELETE MODE ENABLED - EXIT DELETE MODE FIRST]");
        resetConfirmDelete();
        return;
    }

    if(listItems.length === 0) {
        showMsg("red","Nothing to clear");
        return;
    }

    if(!isConfirmClearActive()) {
        showMsg("blue", "Are you sure to clear the list? (Click again to proceed!)");
        setConfirmClear();
        return;
    }

    listItems.forEach(li => root.removeChild(li));

    resetClearState();
    showMsg("green", "Cleared!");
    return;
});

// ROOT <ol>
root.addEventListener("click", (event) => {

    // clicks from inside editRow (the input, Edit btn, Cancel btn) bubble up
    // to root and would re-trigger enableEditMode. Guard against that here.
    if(isConfirmClearActive()) {
        resetClearState();
    }
    
    if(event.target.closest('#editRow')) return;

    const listItemClicked = event.target.closest('li');
            
    if(isInDeleteModeActive()) {
        if(!listItemClicked) {
            return;
        }
        if (listItemClicked.dataset.marked === "true") {
            listItemClicked.dataset.marked = "false";
            listItemClicked.style.color = "purple";
            updateDeleteConfirmationMsg(root.querySelectorAll('li[data-marked="true"]'));
        } else {
            listItemClicked.dataset.marked = "true";
            listItemClicked.style.color = "red";
            updateDeleteConfirmationMsg(root.querySelectorAll('li[data-marked="true"]'));
        }
        return;
    }

    if(!listItemClicked) {
        showMsg("red", `Nothing to edit: ${listItemClicked}`);
        return;
    }

    if(!isInEditModeActive()) {
        enableEditMode(listItemClicked);
        return;
    }

    if(isInEditModeActive()) {
        restorePreviousItem(textStoredInListItem());
        enableEditMode(listItemClicked);
        return;
    }

    return;
});

// CANCEL
cancelBtn.addEventListener("click", () => {
    restorePreviousItem(textStoredInListItem());
    showMsg("green", `Restored: ${textStoredInListItem()} - [CANCELED EDIT]`);
    return;
});

// EDIT
editBtn.addEventListener("click", () => {

    if(!inputTextInEditMode().trim()) {
        showMsg("red", `Update the ${textStoredInListItem()} item to edit`);
        return;
    }

    // Save both values before calling restorePreviousItem, because that
    // function sets editingItem = null and isInEditMode = false, and the message
    // needs the old textStoredInListItem() captured first.
    const oldText = textStoredInListItem();
    const newText = inputTextInEditMode().trim();

    restorePreviousItem(newText);
    showMsg("green", `Updated: [${oldText}] to [${newText}]`);
    return;
});

// DELETE
deleteBtn.addEventListener("click", () => {

    if(isInEditModeActive()) {
        showMsg("blue", `Complete cancel/edit for [${textStoredInListItem()}] (to) => [${inputTextInEditMode()}] and try again, [CANNOT ENTER DELETE MODE]`);
        return;
    }
            
    if(!isInDeleteModeActive()) {
        enableDeleteMode();
        return;
    }

    if(isInDeleteModeActive()) {
        confirmDeletion();
    }

    if(isConfirmClearActive()) {
        resetClearState();
    }
    return;
});
