// listen for clicks on the extension icon and tells content.js to show the pop-up
// chrome is an object provided by Chrome that gives extensions access to Chrome-specific APIs
// chrome.action refers to the extenion's toolbar action
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;

    try {
        // send a message to the content.js to show the pop-up panel
        await chrome.tabs.sendMessage(tab.id, {
            action: "showPanel"
        });
    } catch (error) {
        console.log(
            "Contrast Assistant: No active panel available.", error
        );
    }
});
