
class NodeExternalOpener {
    constructor() {

    }

    spawnWorkspaceFromUrl(workspaceUrl) {
        const {ipcRenderer} = require('electron');
        let data = {
            "workspaceUrl": workspaceUrl
        }
        ipcRenderer.send('request-open-workspace',data);
    }

    openWebLink(url) {
        try {
            let shell = require("electron").shell;
            shell.openExternal(url);
        }
        catch(error) {
            let errorMsg = error.message ? error.message : error.toString();
            if(error.stack) console.error(error.stack);
            apogeeUserAlert("Error opeing web link: " + errorMsg);
        }
    }
}

module.exports = NodeExternalOpener;