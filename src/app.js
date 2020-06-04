const {apogeeutil,apogee,apogeeapp,apogeeui,apogeeview} = require("./lib/apogeeAppBundle.cjs.js");
const ElectronNodeAppConfigManager = require("./ElectronNodeAppConfigManager.js");

const { ApogeeView, initIncludePath } = apogeeview;

//expose these apogee libraries globally so plugins can use them
__globals__.apogeeutil = apogeeutil;
__globals__.apogee = apogee;
__globals__.apogeeapp = apogeeapp;
__globals__.apogeeui = apogeeui;
__globals__.apogeeview = apogeeview;

let appView;

function appInit() {

    //initialize the include paths separately
    const includePathInfo = {
        "resources": "./lib/resources",
        "aceIncludes": "./lib/ace_includes"
    };
    initIncludePath(includePathInfo);
    
    //use cutnpaste file access
    let appConfigManager = new ElectronNodeAppConfigManager();
    
    //create the application
    appView = new ApogeeView("appContainer",appConfigManager);
}

function getWorkspaceIsDirty() {
    return appView.getApp().getWorkspaceIsDirty();
}

module.exports.appInit = appInit;
module.exports.getWorkspaceIsDirty = getWorkspaceIsDirty
