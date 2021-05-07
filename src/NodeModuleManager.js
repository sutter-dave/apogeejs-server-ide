const SimpleModuleManager = require("../apogeejs-simple-module-manager/src/SimpleModuleManager.js");

/** This class manages addition and removal of apogee modules from the NODE apogee platform. It extends
 * the simple (web) module manager to add functions for installing and uninstalling modules. */
export default class NodeModuleManager extends SimpleModuleManager {
    constructor(app) {
        super(app);
    }

    //==========================
    // Protected Methods
    //==========================

    getModuleManagerUrl() {
        return REMOTE_NODE_MODULE_MANAGER_URL;
    }

    getModuleType() {
        return NODE_MODULE_TYPE;
    }

    receiveMessage(event) {
        switch(event.data.message) {

            case "installAndAddModule": 
                this.installAndAddModuleCommand(event.data.value);
                break;

            case "installModule": 
                this.installModuleCommand(event.data.value);
                break;

            case "uninstallModule": 
                this.uninstallModuleCommand(event.data.value);
                break;

            case "installModuleAndOpenWorkspace":
                this.installModuleAndOpenWorkspaceCommand(event.data.value);
                break;

            default:
                super.receiveMessage(event);
        }
    }

    async installAndAddModuleCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Install and add module failed: missing module name.");
            return;
        }

        try {
            await this.installModule(moduleName);
            this.addModule(moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing and adding module: " + errorMsg);
        }
    }

    async installModuleCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Install module failed: missing module name.");
            return;
        }

        try {
            await this.installModule(moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing module: " + errorMsg);
        }
    }

    uninstallModuleCommand(commandData) {
        let moduleName = commandData.moduleName;
        if(!moduleName) {
            apogeeUserAlert("Uninstall module failed: missing module name.");
            return;
        }

        try {
            await this.uninstallModule(moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error uninstalling module: " + errorMsg);
        }
    }

    async installModuleAndOpenWorkspaceCommand(commandData) {
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
            await this.installModule(moduleName);
            apogeeplatform.spawnWorkspaceFromUrl(workspaceUrl);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing module and opening workspace: " + errorMsg);
        }
    }

    //--------------------------
    // Command Execution Functions
    //--------------------------

    async installModule(npmModuleName) {
        return this.getShellCommandPromise("npm install " + npmModuleName);
    }

    async uninstallModule(npmModuleName) {
        return this.getShellCommandPromise("npm uninstall " + npmModuleName);
    }

    /** This method asynchronously executes the command */
    getShellCommandPromise(cmdText) {
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


const REMOTE_NODE_MODULE_MANAGER_URL = "http://localhost:8888/test/modules/moduleMgrNode.html";
const NODE_MODULE_TYPE = "npm module";