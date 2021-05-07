/** This class manages addition and removal of apogee modules from the NODE apogee platform. */
export default class NodeModuleManager {
    constructor(app) {
        this.app = app;
        this.remoteWindow = null;
        this.messageListener = event => this._receiveMessage(event);
    }

    /** This opens the module manager window and sets up communication with it. */
    openModuleManager() {
        try {
            window.addEventListener(this.messageListener);
            this.remoteWindow = window.open(REMOTE_MODULE_MANAGER_URL, 'Module Manager', 'width=512,height=512,left=200,top=100');
            return true;
        }
        catch(error) {
            this.remoteWindow.removeEventListener("message",this.messageListener);
            this.remoteWindow = null;
            
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error opening module manager: " + errorMsg);
            return false;
        }
    }

    //==========================
    // Private Methods
    //==========================

    _receiveMessage(event) {
        switch(event.data.message) {
            case "addModule": 
                this._addModuleCommand(event.data.value);
                break;

            case "installAndAddModule": 
                this._installAndAddModuleCommand(event.data.value);
                break;

            case "installModule": 
                this._installModuleCommand(event.data.value);
                break;

            case "removeModule": 
                this._removeModuleCommand(event.data.value);
                break;

            case "uninstallModule": 
                this._uninstallModuleCommand(event.data.value);
                break;

            case "openWorkspace": 
                this._openWorkspaceCommand(event.data.value);
                break;

            case "installModuleAndOpenWorkspace":
                this._installModuleAndOpenWorkspaceCommand(event.data.value);
                break;

            case "openLink": 
                this._openLinkCommand(event.data.value);
                break;

            case "closeModuleManager":
                this._closeModuleManager();
                break;
        }
    }

    _addModuleCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Add module failed: missing module name.");
            return;
        }

        try {
            this._addModule(moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error adding module: " + errorMsg);
        }
    }

    async _installAndAddModuleCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Install and add module failed: missing module name.");
            return;
        }

        try {
            await this._installModule(moduleName);
            this._addModule(moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing and adding module: " + errorMsg);
        }
    }

    async _installModuleCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Install module failed: missing module name.");
            return;
        }

        try {
            await this._installModule(moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing module: " + errorMsg);
        }
    }

    _removeModuleCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Remove module failed: missing module name.");
            return;
        }

        try {
            this._removeModule(moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error removing module: " + errorMsg);
        }
    }

    _uninstallModuleCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Uninstall module failed: missing module name.");
            return;
        }

        try {
            await this._uninstallModule(moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error uninstalling module: " + errorMsg);
        }
    }

    async _installModuleAndOpenWorkspaceCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Install Module and open workspace failed: missing module name.");
            return;
        }
        let workspaceUrl = commandData.workspaceUrl;
        if(!workspaceUrl) {
            apogeeUserAlert("Install Module and open workspace failed: missing workspace URL.");
            return;
        }

        try {
            await this._installModule(moduleName);
            apogeeplatform.spawnWorkspaceFromUrl(workspaceUrl);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing module and opening workspace: " + errorMsg);
        }
    }

    _openWorkspaceCommand(commandData) {
        let workspaceUrl = commandData.workspaceUrl;
        if(!workspaceUrl) {
            apogeeUserAlert("Open workspace failed: missing workspace URL.");
            return;
        }

        try {
            apogeeplatform.spawnWorkspaceFromUrl(workspaceUrl);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error opening workspace: " + errorMsg);
        }
    }

    _openLinkCommand(commandData) {
        let linkUrl = commandData.linkUrl;
        if(!linkUrl) {
            apogeeUserAlert("Open link failed: missing link URL.");
            return;
        }

        try {
            apogeeplatform.openWebLink(linkUrl);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error opening link: " + errorMsg);
        }
    }

    _closeModuleManager() {
        window.removeEventListener("message",this.messageListener);
        this.remoteWindow = null;
    }

    //--------------------------
    // Command Execution Functions
    //--------------------------


    _addModule(npmModuleName,apogeeName) {
        let commandData = {};
        commandData.type = "addLink";
        commandData.data = {
            entryType: "npm module",
            url: npmModuleName,
            nickname: apogeeName
        };
        return this.app.executeCommand(commandData);
    }

    _removeModule(npmModuleName) {
        let commandData = {};
        commandData.type = "removeLink";
        commandData.data = {
            entryType: "npm module",
            url: npmModuleName
        };
        return this.app.executeCommand(commandData);
    }

    async _installModule(npmModuleName) {
        return this.getShellCommandPromise("npm install " + npmModuleName);
    }

    async _uninstallModule(npmModuleName) {
        return this.getShellCommandPromise("npm uninstall " + npmModuleName);
    }

    /** This method asynchronously executes the command */
    _getShellCommandPromise(cmdText) {
        return new Promise( (resolve,reject) => {
            const { exec } = require('child_process'); 
            exec(cmdText,null,(error,stdout,stderr) => {
                if(error) {
                    reject(error)
                }
                else if(stdout) {
                    resolve(stdout)
                }
                else if(stderr) {
                    reject(stderr)
                }
                else {
                    reject("no response")
                }
            })
        })
    }

}


const REMOTE_MODULE_MANAGER_URL = "http://localhost:8888/test/modules/moduleMgrNode.html";