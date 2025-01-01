import utils from '@windy/utils';
import store from '@windy/store';
import bcast from '@windy/broadcast';
import { emitter as picker } from '@windy/picker';
import windyFetch from '@windy/fetch';
import loc from '@windy/location';

import * as  singleclick from '@windy/singleclick';

import config from './pluginConfig.js';

import { insertGlobalCss, removeGlobalCss } from './globalCss.js';

import { getPickerMarker } from 'custom-windy-picker';
import { checkVersion, showMsg } from './utils/infoWinUtils.js';

const { name } = config;
const { $, getRefs } = utils;

let thisPlugin, refs, node;

let hasHooks;
let pickerT;

/** logger timeout */
let loggerTO;
function logMessage(msg) {
    if (!store.get('consent').analytics) return;
    fetch(`https://www.flymap.org.za/windy-logger/logger.htm?name=${name}&message=${msg}`, { cache: 'no-store' })
        .then(console.log);
}

function init(plgn) {
    thisPlugin = plgn;

    ({ node } = plgn.window);
    ({ refs } = getRefs(node));

    // important to close the windy picker
    bcast.fire('rqstClose', 'picker');

    //??? should I open my picker if windy picker was open,  for the moment not.   

    pickerT = getPickerMarker();

    // add[Right|Left]Plugin is done by focus in demo.svelte.   Not needed here.   

    if (hasHooks) return;

    // log message -  this is to track usage of the plugin
    let devMode = loc.getURL().includes('windy.com/dev');
    logMessage(devMode ? 'open_dev' : 'open_user');
    if (!devMode) loggerTO = setTimeout(logMessage, 1000 * 60 * 3, '3min');
    //

    // click stuff, IMPORTANT
    singleclick.singleclick.on(name, pickerT.openMarker);
    bcast.on('pluginOpened', onPluginOpened);
    bcast.on('pluginClosed', onPluginClosed);

    insertGlobalCss();

    // the custom picker broadcasts when opened, moved or closed to the same eventer as the internal picker.    
    // picker onDrag is added, it is not native to internal picker,  the second parameter is how much the function is throttled in millisecs
    pickerT.onDrag(someFunction, 300);
    picker.on('pickerOpened', someFunction);
    picker.on('pickerMoved', someFunction);

    // This is not needed anymore,  but allows you to close this plugin completely from somewhere else
    thisPlugin.closeCompletely = closeCompletely;

    //  Message to say if plugin is outdated.
    checkVersion(refs.messageDiv);

    hasHooks = true;
};

// Closes the plugin completely.  It is not closed by onDestroy in svelte,  as it can be opened again.  
//  It is closed only when the user closes it with the close button in the embedded window.

const closeCompletely = function () {

    clearTimeout(loggerTO);

    removeGlobalCss();

    pickerT.offDrag(someFunction);
    picker.off('pickerOpened', someFunction);
    picker.off('pickerMoved', someFunction);
    pickerT.remLeftPlugin(name);
    pickerT.remRightPlugin(name);   // We are not using the right div,  not needed,  but nothing will happend if you try to remove it

    // click stuff,  IMPORTANT
    singleclick.release(name, "high");
    singleclick.singleclick.off(name, pickerT.openMarker);
    bcast.off('pluginOpened', onPluginOpened);
    bcast.off('pluginClosed', onPluginClosed);

    // finally close the plugin
    bcast.fire('rqstClose', name);

    // other plugins will try to defocus this plugin,  if these functions are still present
    delete thisPlugin.focus;
    delete thisPlugin.defocus;

    pickerT = null;  // in case plugin re-opened
    hasHooks = false;
};


// VERY important and rather complicated.
// If another plugin is opened while this one is still open,  give that plugin singleclick priority, if listenToSingleclick and singleclickPriority is high
// It should happen anyway,  but does not always,  especially if the other plugin is later reopened.
function onPluginOpened(p) {
    if (W.plugins[p].listenToSingleclick && W.plugins[p].singleclickPriority == 'high') {
        singleclick.register(p, 'high');
    }
}

// When another plugin closes and has high singleclickpriority,  it returns single click to the default picker (not here as it should),
// so instead register this plugin as priority high,  (take back priority).
function onPluginClosed(p) {
    if (p !== name && W.plugins[p].singleclickPriority == 'high') {
        console.log("on plugin closed:", p, "  This plugin gets priority:", name);
        singleclick.register(name, 'high');
    }
}

export { init, closeCompletely };

//// end of boiler plate

function someFunction(e) {
    // IMPORTANT:  check if picker has focus,   thus it is the 1st of the leftDivPlugins,  with getLeftPlugin().   If another embedded plugin has been opened it will have priority
    // Perhaps this check should be included in the picker module,  but for now I am leaving it out.    
    if (pickerT.getLeftPlugin() !== name) return;
    let product = store.get('product');
    if (product=='topoMap') product = 'ecmwf';  // getPointforecast does not work with topoMap
    windyFetch.getPointForecastData(product, e).then(({ data }) => {
        console.log(data);
        pickerT.fillLeftDiv(
            `Elev: ${data.header.elevation}m<br>Model elev: ${data.header.modelElevation}m`, true);
    });
}
