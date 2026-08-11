let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("Starting background service:", appName, version)

const blockDataKey = "block_data";
const whitelistDataKey = "whitelist";

console.log("Installing contextMenu:", appName)
browser.contextMenus.remove("blockuser")
browser.contextMenus.create({
    id: "blockuser",
    title: "BlockUser",
    contexts: ["link"],
    documentUrlPatterns: [
        "https://www.youtube.com/",
        "https://www.youtube.com/results*",
    ],
}, () => {
    console.log("blockuser context menu");
    if (browser.runtime.lastError) {
        console.log(`Error: ${browser.runtime.lastError}`);
    } else {
        console.log("Item created successfully");
    }
});

browser.contextMenus.remove("Whitelist")
browser.contextMenus.create({
    id: "Whitelist",
    title: "Whitelist",
    contexts: ["link"],
    documentUrlPatterns: [
        "https://www.youtube.com/",
        "https://www.youtube.com/results*",
    ],
}, () => {
    console.log("whitelist context menu");
    if (browser.runtime.lastError) {
        console.log(`Error: ${browser.runtime.lastError}`);
    } else {
        console.log("Item created successfully");
    }
});

let sendMessage = async (text) => {
    try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            console.error("No active tab found.");
            return;
        }
        await browser.tabs.sendMessage(tab.id, {action: "notification", text: text});
    } catch (error) {
        console.error("Error messaging tab:", error);
    }
};

browser.contextMenus.onClicked.addListener(async (info, tab) => {
    let channelLink = info.linkUrl.replaceAll("https://www.youtube.com", "");
    if (channelLink.startsWith("/@") || channelLink.startsWith("/channel/")) {
        let channelTitle = info.linkText;
        const channelData = channelTitle+":|:"+channelLink;
        switch (info.menuItemId) {
            case "Whitelist":
                console.log("adding channel to whitelist");
                const whitelistDataMapResult = await browser.storage.local.get({[whitelistDataKey]: []});
                const whitelistDataArray = whitelistDataMapResult[whitelistDataKey];
                if (!whitelistDataArray.includes(channelData)) {
                    await sendMessage(`"${channelTitle}" whitelisted!!`);
                    whitelistDataArray.push(channelData);
                    await browser.storage.local.set({[whitelistDataKey]: whitelistDataArray});
                } else {
                    await sendMessage(`"${channelTitle}" is already whitelisted`);
                    console.log("Channel is already whitelisted");
                }
                break;
            case "blockuser":
                const blockDataMapResult = await browser.storage.local.get({[blockDataKey]: []});
                const blockDataArray = blockDataMapResult[blockDataKey];
                if (!blockDataArray.includes(channelData)) {
                    await sendMessage(`"${channelTitle}" blocked!!`);
                    blockDataArray.push(channelData);
                    await browser.storage.local.set({[blockDataKey]: blockDataArray});
                } else {
                    await sendMessage(`"${channelTitle}" is already blocked`);
                    console.log("Channel is already blocked");
                }
                break;
        }
    } else {
        console.log("unknown url pattern:" + info.linkUrl);
    }
});
