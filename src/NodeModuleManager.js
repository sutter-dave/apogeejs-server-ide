const SimpleModuleManager = require("../apogeejs-simple-module-manager/src/SimpleModuleManager.js");

/** This class manages addition and removal of apogee modules from the NODE apogee platform. It extends
 * the simple (web) module manager to add functions for installing and uninstalling modules. */
class NodeModuleManager extends SimpleModuleManager {
    constructor(app) {
        super(app);
    }

    //==========================
    // Protected Methods
    //==========================

    getAppModulesData() {
        let referenceManager = this.app.getWorkspaceManager().getReferenceManager();
        let moduleList = referenceManager.getModuleList(this.getModuleType());
        let appModuleData = {
            app: "TBD",
            version: "TBD",
            moduleType: this.getModuleType(),
            npmModules: {
                installed: {
                    "apogeejs-module-csv": "1.3.4-p1"
                },
                loaded: moduleList,
            }
        }
        return appModuleData;
    }

    getModuleManagerUrl(appModulesData) {
        return REMOTE_NODE_MODULE_MANAGER_URL + `?appModules=${JSON.stringify(appModulesData)}&windowId=${this.childWindowId}&moduleType=${this.getModuleType()}`;
    }

    getModuleType() {
        return NODE_MODULE_TYPE;
    }

    receiveMessage(event) {
        //make sure this is from the right window
        if(!this.isMyMessage(event)) return;

        let commandData = event.data.value.commandData;
        switch(event.data.message) {

            case "installAndLoadNpmModule": 
                this.installAndLoadNpmModuleCommand(commandData);
                break;

            case "installNpmModule": 
                this.installNpmModuleCommand(commandData);
                break;

            case "uninstallNpmModule": 
                this.uninstallNpmModuleCommand(commandData);
                break;

            case "uninstallNpmModuleAndOpenWorkspace":
                this.installNpmModuleAndOpenWorkspaceCommand(commandData);
                break;

            default:
                super.receiveMessage(event);
        }
    }

    async installAndLoadNpmModuleCommand(commandData) {
        if(!commandData.installArg) {
            apogeeUserAlert("Install and add module failed: missing module install data.");
            return;
        }
        try {
            await this.installNpmModule(commandData.installArg);
            this.loadModule(commandData.moduleName,commandData.moduleName);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing and adding module: " + errorMsg);
        }
    }

    async installNpmModuleCommand(commandData) {
        if(!commandData.installArg) {
            apogeeUserAlert("Install module failed: missing module install data.");
            return;
        }

        try {
            await this.installNpmModule(commandData.installArg);
        }
        catch(error) {
            if(error.stack) console.error(error.stack);
            let errorMsg = error.message ? error.message : error.toString();
            apogeeUserAlert("Error installing module: " + errorMsg);
        }
    }

    async uninstallNpmModuleCommand(commandData) {
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
        if(!commandData.installArg) {
            apogeeUserAlert("Install Module and open workspace failed: missing module install data.");
            return;
        }
        if(!commandData.workspaceUrl) {
            apogeeUserAlert("Install Module and open workspace failed: missing workspace URL.");
            return;
        }

        try {
            await this.installNpmModule(commandData.installArg);
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

    async installNpmModule(npmInstallArg) {
        let text = "npm install " + npmInstallArg;
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


const REMOTE_NODE_MODULE_MANAGER_URL = "http://localhost:8888/apogeejs-admin/dev/moduleManager/moduleMgr.html";
const NODE_MODULE_TYPE = "npm module";

module.exports = NodeModuleManager;