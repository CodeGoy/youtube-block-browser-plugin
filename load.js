console.log("starting load.js:", browser.runtime.getManifest().name, browser.runtime.getManifest().version)

const blockDataKey = "block_data";

document.getElementById('file_picker').addEventListener('input', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            browser.storage.local.set({[blockDataKey]: JSON.parse(e.target.result)})
            window.close()
        } catch (error) {
            console.error('Invalid JSON structure. Please check the file formatting.', error);
        }
    };
    reader.readAsText(file);
});

