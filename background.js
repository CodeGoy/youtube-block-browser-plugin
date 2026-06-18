console.log("starting background service")
browser.contextMenus.remove("blockuser")
browser.contextMenus.create({
    id: "blockuser",
    title: "BlockUser",
    contexts: ["link"]
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
            action: "find_element",
            targetElementId: info.targetElementId
        });
    }
});

browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.action === "BLOCK_DATA" && sender.origin === "https://www.youtube.com") {
        let userToBlock = message.data;
        if (userToBlock == null) {
            console.error("username is null");
            return;
        }
        console.log("Adding user to block list:", userToBlock);
        const result = await browser.storage.local.get({ ["blocked_users"]: [] });
        const currentArray = result["blocked_users"];
        if (!currentArray.includes(userToBlock)) {
            currentArray.push(userToBlock);
            await browser.storage.local.set({ ["blocked_users"]: currentArray });
            console.log(`"${userToBlock}" was added.`);
        } else {
            console.log(`"${userToBlock}" already exists in the array.`);
        }
    }
});