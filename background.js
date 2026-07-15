let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("starting background service", appName, version)

const blockedUsersKey = "blocked_users";

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
    if (info.menuItemId === "blockuser") {
        // TODO :  check if event.info is a channel link
        let userToBlock = "/" + info.linkUrl.replaceAll(info.pageUrl, "");
        const result = await browser.storage.local.get({[blockedUsersKey]: []});
        const currentArray = result[blockedUsersKey];
        if (!currentArray.includes(userToBlock)) {
            currentArray.push(userToBlock);
            await browser.storage.local.set({[blockedUsersKey]: currentArray});
        } else {
            console.log("Channel is already blocked");
        }
    }
});
