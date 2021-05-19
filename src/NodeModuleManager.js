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

    async getAppModulesData() {
        let referenceManager = this.app.getWorkspaceManager().getReferenceManager();
        let moduleList = referenceManager.getModuleList(this.getModuleType());
        let installedModules = await this.getInstalledModules();
        let appModuleData = {
            app: "TBD",
            version: "TBD",
            moduleType: this.getModuleType(),
            npmModules: {
                installed: installedModules,
                loaded: moduleList,
            }
        }
        return appModuleData;
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
            let cmdDone = this.loadModule(commandData.moduleName,commandData.moduleName);
            if(cmdDone) {
                this.sendModulesUpdate();
            }
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
            this.sendModulesUpdate();
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
            this.sendModulesUpdate();
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
            this.sendModulesUpdate();
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

    //========================
    // Private Methods
    //========================

    async getInstalledModules() {
        try {
            const fsPromises = require('fs/promises');
            let packageLockText = await fsPromises.readFile("package-lock.json");

            let packageLockJson = JSON.parse(packageLockText);
            
            let installedModules = {};
            if(packageLockJson.dependencies) {
                for(let module in packageLockJson.dependencies) {
                    installedModules[module] = packageLockJson.dependencies[module].version;
                }   
            }
            return installedModules;
        }
        catch(loadError) {
            console.log(loadError.toString());
            if(loadError.stack) console.error(loadError.stack);
            throw new Error("Error loading workspace file " + fileName);
        }
    }
}

const NODE_MODULE_TYPE = "npm module";

module.exports = NodeModuleManager;