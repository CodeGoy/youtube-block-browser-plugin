// load saved list
console.log("starting load.js:", browser.runtime.getManifest().name, browser.runtime.getManifest().version)

const blockDataKey = "block_data";
const whitelistDataKey = "whitelist";

document.getElementById('file_picker').addEventListener('input', (event) => {
    // TODO : add list to existing list, loop over lists and merge
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let jsonResult = JSON.parse(e.target.result);
            browser.storage.local.set({[blockDataKey]: jsonResult[blockDataKey]});
            browser.storage.local.set({[whitelistDataKey]: jsonResult[whitelistDataKey]});
            window.close()
        } catch (error) {
            console.error('Invalid JSON structure. Please check the file formatting.', error);
        }
    };
    reader.readAsText(file);
});

