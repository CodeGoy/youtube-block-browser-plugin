// load saved list
console.log("starting load.js:", browser.runtime.getManifest().name, browser.runtime.getManifest().version)

const blockDataKey = "block_data";
const whitelistDataKey = "whitelist";

let getBlockedList = async () => {
    let bul = await browser.storage.local.get({ [blockDataKey]: [] });
    return Object.values(bul)[0]
}

let getWhitelist = async () => {
    let bul = await browser.storage.local.get({ [whitelistDataKey]: [] });
    return Object.values(bul)[0]
}

let merge = async (array0, array1) => {
    return [...new Set([...array0, ...array1])];
}

document.getElementById('file_picker').addEventListener('input', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            let jsonResult = JSON.parse(e.target.result);
            let currentBlocklist = await getBlockedList();
            let newBlockList = await merge(currentBlocklist, jsonResult[blockDataKey]);
            let currentWhitelist = await getWhitelist();
            let newWhitelist = await merge(currentWhitelist, jsonResult[whitelistDataKey]);
            browser.storage.local.set({[blockDataKey]: newBlockList});
            browser.storage.local.set({[whitelistDataKey]: newWhitelist});
            window.close()
        } catch (error) {
            console.error('Invalid JSON structure. Please check the file formatting.', error);
        }
    };
    reader.readAsText(file);
});

