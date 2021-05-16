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

            case "installAndLoadNpmModule": 
                this.installAndLoadNpmModuleCommand(event.data.value);
                break;

            case "installNpmModule": 
                this.installNpmModuleCommand(event.data.value);
                break;

            case "uninstallNpmModule": 
                this.uninstallModuleCommand(event.data.value);
                break;

            case "uninstallNpmModuleAndOpenWorkspace":
                this.installNpmModuleAndOpenWorkspaceCommand(event.data.value);
                break;

            default:
                super.receiveMessage(event);
        }
    }

    async installAndLoadNpmModuleCommand(commandData) {
        if(!commandData.moduleName) {
            apogeeUserAlert("Install and add module failed: missing module name.");
            return;
        }
        try {
            await this.installNpmModule(commandData.moduleName,commandData.moduleVersion);
            this.loadModule(commandData.moduleName,commandData.moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing and adding module: " + errorMsg);
        }
    }

    async installNpmModuleCommand(commandData) {
        if(!commandData.moduleName) {
            apogeeUserAlert("Install module failed: missing module name.");
            return;
        }

        try {
            await this.installNpmModule(commandData.moduleName,commandData.moduleVersion);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing module: " + errorMsg);
        }
    }

    uninstallNpmModuleCommand(commandData) {
        if(!commandData.moduleName) {
            apogeeUserAlert("Uninstall module failed: missing module name.");
            return;
        }

        try {
            await this.uninstallNpmModule(commandData.moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error uninstalling module: " + errorMsg);
        }
    }

    async installNpmModuleAndOpenWorkspaceCommand(commandData) {
        if(!commandData.moduleName) {
            apogeeUserAlert("Install Module and open workspace failed: missing module name.");
            return;
        }
        if(!commandData.workspaceUrl) {
            apogeeUserAlert("Install Module and open workspace failed: missing workspace URL.");
            return;
        }

        try {
            await this.installNpmModule(commandData.moduleName,commandData.moduleVersion);
            apogeeplatform.spawnWorkspaceFromUrl(commandData.workspaceUrl);
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

    async installNpmModule(npmModuleName,npmModuleVersion) {
        let text = "npm install " + npmModuleName;
        if(npmModuleVersion !== undefined) text += "@" + npmModuleVersion;
        return this.getShellCommandPromise(text);
    }

    async uninstallNpmModule(npmModuleName) {
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