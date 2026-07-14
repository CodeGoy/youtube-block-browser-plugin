let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("starting background service", appName, version)

console.log("installing contextMenu")
browser.contextMenus.remove("blockuser")
browser.contextMenus.create({
    id: "blockuser",
    title: "BlockUser",
    contexts: ["link"],
    documentUrlPatterns: ["https://*.youtube.com/*"]
}, () => {
    console.log("context menu status");
    if (browser.runtime.lastError) {
        console.log(`Error: ${browser.runtime.lastError}`);
    } else {
        console.log("Item created successfully");
    }
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("context onclick");
    if (info.menuItemId === "blockuser") {
        browser.tabs.sendMessage(tab.id, {
            action: "target",
            targetElementId: info.targetElementId
        });
    }
});
