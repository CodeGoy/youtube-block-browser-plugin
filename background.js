let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("Starting background service:", appName, version)

const blockDataKey = "block_data";

console.log("Installing contextMenu:", appName)
browser.contextMenus.remove("blockuser")
browser.contextMenus.create({
    id: "blockuser",
    title: "BlockUser",
    contexts: ["link"],
    documentUrlPatterns: [
        "https://www.youtube.com/",
        "https://www.youtube.com/watch*",
        "https://www.youtube.com/results*",
    ],
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
        let userToBlock = info.linkUrl.replaceAll("https://www.youtube.com", "");
        if (userToBlock.startsWith("/@") || userToBlock.startsWith("/channel/")) {
            let channelTitle = info.linkText;
            const blockDataMapResult = await browser.storage.local.get({[blockDataKey]: []});
            const blockDataArray = blockDataMapResult[blockDataKey];
            if (!blockDataArray.includes(userToBlock)) {
                blockDataArray.push(channelTitle+"|"+userToBlock);
                await browser.storage.local.set({[blockDataKey]: blockDataArray});
            } else {
                console.log("Channel is already blocked");
            }
        } else {
            console.log("unknown url pattern:" + info.linkUrl);
        }
    }
});
