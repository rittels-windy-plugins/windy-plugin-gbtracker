import utils from '@windy/utils';
import store from '@windy/store';
import bcast from '@windy/broadcast';
import { emitter as picker } from '@windy/picker';
import windyFetch from '@windy/fetch';
import loc from '@windy/location';
import { map } from '@windy/map';

import * as singleclick from '@windy/singleclick';

import config from './pluginConfig.js';

import { insertGlobalCss, removeGlobalCss } from './globalCss.js';

import { getPickerMarker } from 'custom-windy-picker';

// check version now done by windy
//import { checkVersion, showMsg } from './utils/infoWinUtils.js';

const { name } = config;
const { $, getRefs } = utils;
const { log } = console;

let thisPlugin, refs, node;

let hasHooks;
let pickerT;

/** logger timeout */
let loggerTO;
function logMessage(msg) {
    if (!store.get('consent')) return; // store.get('consent') sometimes returns null and nog an object
    if (!store.get('consent').analytics) return;
    fetch(`https://www.flymap.org.za/windy-logger/logger.htm?name=${name}&message=${msg}`, {
        cache: 'no-store',
    }).then(console.log);
}

function init(plgn, selectTeamFun) {
    selectTeam = selectTeamFun;
    loadFlags();

    refreshPositions();

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
    pickerT.onDrag(pickerEvent, 300);
    picker.on('pickerOpened', pickerEvent);
    picker.on('pickerMoved', pickerEvent);

    // This is not needed anymore,  but allows you to close this plugin completely from somewhere else
    thisPlugin.closeCompletely = closeCompletely;

    //  Message to say if plugin is outdated --   Now done by WIndy client
    //  checkVersion(refs.messageDiv);

    hasHooks = true;
}

// Closes the plugin completely.  It is not closed by onDestroy in svelte,  as it can be opened again.
//  It is closed only when the user closes it with the close button in the embedded window.

const closeCompletely = function () {
    flagsSheet.remove();

    positions.forEach(p => {
        p.line.remove();
        p.ghostLine.remove();
    });

    clearTimeout(loggerTO);

    removeGlobalCss();

    pickerT.offDrag(pickerEvent);
    picker.off('pickerOpened', pickerEvent);
    picker.off('pickerMoved', pickerEvent);
    pickerT.remLeftPlugin(name);
    pickerT.remRightPlugin(name); // We are not using the right div,  not needed,  but nothing will happend if you try to remove it

    // click stuff,  IMPORTANT
    singleclick.release(name, 'high');
    singleclick.singleclick.off(name, pickerT.openMarker);
    bcast.off('pluginOpened', onPluginOpened);
    bcast.off('pluginClosed', onPluginClosed);

    // finally close the plugin
    bcast.fire('rqstClose', name);

    // other plugins will try to defocus this plugin,  if these functions are still present
    delete thisPlugin.focus;
    delete thisPlugin.defocus;

    pickerT = null; // in case plugin re-opened
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
        console.log('on plugin closed:', p, '  This plugin gets priority:', name);
        singleclick.register(name, 'high');
    }
}

export { init, closeCompletely };

//// end of boiler plate

let teams,
    ads,
    positions = [];
let minmax = [
    [90, 180],
    [-90, -180],
];
let flagsSheet;
let selectTeam;

function loadFlags() {
    flagsSheet = document.createElement('link');
    flagsSheet.rel = 'stylesheet';
    flagsSheet.href = 'https://cdn.jsdelivr.net/npm/flag-icons/css/flag-icons.min.css';
    document.head.appendChild(flagsSheet);
}

function getRaceSetup() {
    return fetch('https://cf.yb.tl/JSON/gb2025/RaceSetup')
        .then(r => r.json())
        .then(js => {
            teams = js.teams;
            ads = js.adverts;
            return js;
        });
}

function getPositions() {
    return fetch('https://cf.yb.tl/BIN/gb2025/AllsPositions3')
        .then(e => e.arrayBuffer())
        .then(d => {
            let result = parse(d);
            positions = result;
        });
}

function selectPath(id) {
    let selected = positions.find(p => p.id == id);
    positions.forEach(p2 => p2.line.setStyle({ weight: 2, opacity: 0.8 }));
    selected.line.setStyle({ weight: 6, opacity: 1.0 });
}

function placePickerAtEnd(id) {
    let p = positions.find(p => p.id == id);
    let fnd = Object.assign({}, p.moments[0], { team: p.team });
    pickerT.openMarker(fnd);
}

function showPositions() {
    minmax = [
        [90, 180],
        [-90, -180],
    ];
    positions.forEach(p => {
        let latlngs = p.moments.map(m => [m.lat, m.lon]);
        latlngs.forEach(ll => {
            if (ll[0] < minmax[0][0]) minmax[0][0] = ll[0];
            if (ll[0] > minmax[1][0]) minmax[1][0] = ll[0];
            if (ll[1] < minmax[0][1]) minmax[0][1] = ll[1];
            if (ll[1] > minmax[1][1]) minmax[1][1] = ll[1];
        });
        let team = teams.find(tm => tm.id == p.id);
        p.team = team;
        let color = '#' + team.colour;
        p.line = L.polyline(latlngs, { color, weight: 2, opacity: 0.8 }).addTo(map);

        p.ghostLine = L.polyline(latlngs, { color: 'transparent', weight: 10 })
            .addTo(map)
            .on('click', ev => {
                L.DomEvent.stopPropagation(ev);
                selectPath(p.id);
                selectTeam(p.id);

                let found = p.moments.reduce(
                    (a, el, i) => {
                        let r = (ev.latlng.lat - el.lat) ** 2 + (ev.latlng.lng - el.lon) ** 2;
                        if (r < a.r) {
                            a.r = r;
                            a.i = i;
                        }
                        return a;
                    },
                    { r: Infinity, i: 0 },
                );

                let fnd = Object.assign({}, p.moments[found.i], { team: p.team });
                pickerT.openMarker(fnd);
            });
    });

    map.fitBounds(minmax);
}

function refreshPositions() {
    // 1st remove all lines in case of refresh
    positions.forEach(p => {
        p.line?.remove();
        p.ghostLine?.remove();
    });
    Promise.all([getRaceSetup(), getPositions()]).then(showPositions);
}

function pickerEvent(e) {
    
    if (pickerT.getRightPlugin() !== name) return;

    if (e.alt) {
        pickerT.fillRightDiv(
            `${e.team.name}<br>Alt: ${e.alt}<br>At: ${new Date(e.at * 1000).toISOString().replace(':00.000', '')}`,
        );
    } else {
        pickerT.fillRightDiv('');
    }
}

function parse(e) {
    for (
        var t = new DataView(e),
            i = t.getUint8(0),
            a = 1 === (1 & i),
            s = 2 === (2 & i),
            n = 4 === (4 & i),
            r = 8 === (8 & i),
            o = t.getUint32(1),
            l = 5,
            c = [];
        l < e.byteLength;

    ) {
        var u = t.getUint16(l);
        l += 2;
        var h = t.getUint16(l),
            d = new Array(h);
        l += 2;
        for (var g = void 0, v = 0; v < h; v++) {
            var p = t.getUint8(l),
                m = {};
            if (128 === (128 & p)) {
                var w = t.getUint16(l);
                l += 2;
                var y = t.getInt16(l);
                l += 2;
                var M = t.getInt16(l);
                if (((l += 2), a && ((m.alt = t.getInt16(l)), (l += 2)), s)) {
                    var f = t.getInt16(l);
                    (l += 2), (m.dtf = g.dtf + f), n && ((m.lap = t.getUint8(l)), l++);
                }
                r && ((m.pc = t.getInt16(l) / 32e3), (l += 2)),
                    (w = 32767 & w),
                    (m.lat = g.lat + y),
                    (m.lon = g.lon + M),
                    (m.at = g.at - w),
                    (m.pc = g.pc + m.pc);
            } else {
                var b = t.getUint32(l);
                l += 4;
                var T = t.getInt32(l);
                l += 4;
                var L = t.getInt32(l);
                if (((l += 4), a && ((m.alt = t.getInt16(l)), (l += 2)), s)) {
                    var x = t.getInt32(l);
                    (l += 4), (m.dtf = x), n && ((m.lap = t.getUint8(l)), l++);
                }
                r && ((m.pc = t.getInt32(l) / 21e6), (l += 4)),
                    (m.lat = T),
                    (m.lon = L),
                    (m.at = o + b);
            }
            (d[v] = m), (g = m);
        }
        d.forEach(function (e) {
            (e.lat /= 1e5), (e.lon /= 1e5);
        }),
            c.push({
                id: u,
                moments: d,
            });
    }
    return c;
}

export { getRaceSetup, selectPath, placePickerAtEnd, refreshPositions };
