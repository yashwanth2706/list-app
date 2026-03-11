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

function inputTextInEditMode() {
    return editInput.value;
}

function resetInputField() {
    itemname.value = "";
}