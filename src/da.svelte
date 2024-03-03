<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content">
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={() => bcast.emit('rqstOpen', 'menu')}
    >
        Elevation and Density Altitude
    </div>
    <div class="closing-x" on:click={closeCompletely}></div>
    <div>
        <br />
        Shows elevation at picker position.<br /><br />
        The temperature, pressure (QNH) and dew point are loaded for the picker position.<br />
        <br />
        The pressure altitude (PA), density altitude (DA) and DA corrected for dew point(DA_dp) are then
        calculated.<br /><br />
        Elevation (1km resolution) is obtained from:
        <a href=" https://topex.ucsd.edu/WWW_html/srtm30_plus.html"
            >&nbsphttps://topex.ucsd.edu/WWW_html/srtm30_plus.html&nbsp</a
        ><br /><br />
        Calculations:<br /><br />
        &nbsp;&nbsp;PA = elev + 27 x (1013-QNH)<br />
        &nbsp;&nbsp;DA = PA + 118.8 x (temp-ISA)<br />
        &nbsp;&nbsp;where ISA = 15 - 1.98 x PA/1000<br />
        &nbsp;&nbsp;DA_dp = DA + 20 x Dew Point<br /><br />
        <span style="font-size:8px">https://en.wikipedia.org/wiki/Density_altitude</span>
    </div>
    <br /><br />
    <div>
        <div class="header">Choose what to display on the left side of the picker (max&nbsp5):</div>
        <div data-ref="choose">
            <div class="checkbox">QNH</div>
            <div class="checkbox">Temp</div>
            <div class="checkbox">Dew point</div>
            <div class="checkbox">Wet bulb (Calculated from Stull formula)</div>
            <div class="checkbox">&Delta;T = Temp - Wet bulb</div>
            <div class="checkbox">Humidity</div>
            <div class="checkbox">Rain</div>
            <div class="checkbox checkbox--off">Cloudbase</div>
            <div class="checkbox checkbox--off">Wx code</div>
            <div class="checkbox checkbox--off">Wind</div>
            <div class="checkbox checkbox--off">Gust</div>
        </div>
    </div>
    <br /><br />
    <div>
        <div
            class="toggle-section checkbox header off"
            onclick="console.log(this); this.classList.toggle('off');"
        >
            Weather codes (not comprehensive):
        </div>
        <div>
            <div>
                <b>Sky conditions:</b> SKC:&nbsp0/8, FEW:&nbsp1-2/8, SCT:&nbsp3-4/8, BKN:&nbsp5-7/8,
                OVC:&nbsp8/8.
            </div>
            <div>
                <b>Clouds:</b> CU:&nbspCumulus, CB:&nbspCumulonimbus, ST:&nbspStratus, SC:&nbspStratocumulus,
                AC:&nbspAltocumulus, AS:&nbspAltostratus, NS:&nbspNimbostratus, CI:&nbspCirrus, CC:&nbspCirrocumulus,
                CS:&nbspCirrostratus
            </div>
            <div>
                <b>Obscuration:</b> BR:&nbspMist&nbsp(viz&#62;5/8sm), FG:&nbspFog&nbsp(viz&#60;5/8sm)
            </div>
            <div><b>Precip quantifier:</b> <b>-</b>&nbsp:&nbspLight, <b>+</b>&nbsp:&nbspHeavy</div>
            <div>
                <b>Precipitation:</b> RA:&nbspRain, DZ:&nbspDrizzle, SN:&nbspSnow, FZ:&nbspFreezing,
                SH:&nbspShowers, TS:&nbspThundershowers
            </div>
        </div>
    </div>
</section>

<script>
    import { onDestroy, onMount } from 'svelte';

    import plugins from '@windy/plugins';
    import utils from '@windy/utils';
    import { map } from '@windy/map';
    import store from '@windy/store';
    import bcast from '@windy/broadcast';
    import { emitter as picker } from '@windy/picker';
    import http from '@windy/http';
    import rs from '@windy/rootScope';
    //import pluginDataLoader from '@plugins/plugin-data-loader';
    import ftch from '@windy/fetch';
    import interpolator from '@windy/interpolator';

    import config from './pluginConfig';

    import { installExternalPlugin } from '@windy/externalPlugins';

    import { globalCssNode, insertGlobalCss, removeGlobalCss } from './globalCss.js';

    const { title, name } = config;
    const { $: u$ } = utils;

    const thisPlugin = plugins[name];
    let refs = {};
    let node;

    let pickerT, embedbox;

    let pressure, temp, dewP, rh, pa, da, da_corr_dp, da_dp;
    let wxdata;
    let prod = 'ecmwf';
    let lastpos;
    let lefta = 1,
        righta = 1;
    let elp = {};
    let datafnd = true,
        elevfnd = true,
        airfnd = true;
    let thermal;
    let query;
    let hasHooks = false;
    const K = -273.15;

    let ibox;
    let nVals = 11;

    let choices = [];

    let timer = Date.now();
    console.log(timer);

    function loadReqPlugin(url, name) {
        if (plugins[name] && (plugins[name].isActive || plugins[name].isOpen))
            return plugins[name].exports;
        // .open(),  does not remove other plugins from embed window
        return installExternalPlugin(url)
            .then(() => plugins[name].open())
            .then(() => plugins[name].exports);
    }

    const moduleLoadPromises = [
        loadReqPlugin(
            //   'https://localhost:9998/plugin.js',
            'https://www.flymap.org.za/windy_plugins/pickertools/plugin.min.js?'+Date.now(),
            'windy-plugin-picker-tools',
        ),
        loadReqPlugin('https://localhost:9997/plugin.js', 'windy-plugin-embedbox'),
    ];

    onMount(() => {
        //grab node and refs
        node = thisPlugin.window.node;
        for (let e of node.querySelectorAll('[data-ref]')) {
            refs[e.dataset.ref] = e;
        }

        insertGlobalCss();

        Promise.all(moduleLoadPromises).then(mods => {
            [pickerT, embedbox] = mods;
            console.log(Date.now() - timer);
            //pickerT = plugins['windy-plugin-picker-tools'].exports;

            console.log('all plugins loaded', pickerT, embedbox);

            embedbox.setHTML(
                `<div>
                    The <span class='open-plugin' style='color:red; cursor:pointer;'>Density Altitude</span> 
                    plugin is still <b>Active</b>, despite the right hand pane being closed.   
                    To completely close the Density Alt plugin,  
                    you can click the closing-x of the embedded window. 
                </div>`,
                name,
            );

            console.log(embedbox);
            console.log(u$('.open-plugin', embedbox.node));
            setTimeout(() => {
                console.log(u$('.open-plugin', embedbox.node));
                u$('.open-plugin', embedbox.node)?.addEventListener('click', () =>
                    bcast.fire('rqstOpen', name),
                );
            });

            if (pickerT && pickerT.getActivePlugin() != name) {
                console.log('removing previous plugin stuff from picker');
                pickerT.removeElements();
                pickerT.setActivePlugin(name);
            }

            if (hasHooks) return;
            pickerT.drag(fetchData);
            picker.on('pickerOpened', fetchData);
            picker.on('pickerMoved', pickerMoved);
            store.on('timestamp', setTs);
            store.on('product', setProd);
            bcast.on('metricChanged', onMetricChanged);
            hasHooks = true;
        });

        let choices = getChoices();
        for (let c = refs.choose.children, i = 0; i < c.length; i++) {
            c[i].classList[choices[i] == 0 ? 'add' : 'remove']('checkbox--off');
        }

        refs.choose.addEventListener('click', onChoose);
    });

    store.insert('plugin-da-selected-vals', {
        def: 480,
        allowed: v => v >= 0 && v < Math.pow(2, nVals),
        save: true,
    });

    //dont think needed
    /*
    function initModules() {
        //they may have been closed,  so reopen them. This is to mount the css and html.
        return Promise.all(pluginsNeeded.map(p => plugins[p].open())).then(() => {
            ibox = infobox(
                "<div id='about-da-plugin' style='background-color:rgba(0,0,0,0.6); border:1px solid black; display:inline-block; padding:3px;  border-radius:3px;'><span class='iconfont'>d</span> Density Alt</div>",
                'about-da-plugin',
                name,
                true,
            );

            if (pickerT && pickerT.getActivePlugin() != name) {
                console.log('removing previous plugin stuff from picker');
                pickerT.removeElements();
                pickerT.setActivePlugin(name);
            }

            
        //let pparams = pickerT?.getParams();
        //if (pparams) {//check if picker already open
        //    console.log("yes open", pparams);
        //    lastpos = pparams;
        //    console.log(lastpos);
        //    fetchData(lastpos);
        //}
        
        });
    }
    */

    function getChoices() {
        let sv = store.get('plugin-da-selected-vals');
        if (!(sv || sv === 0)) return Array(11).fill(0).fill(1, 0, 4);
        let choices = ('0000000000000' + store.get('plugin-da-selected-vals').toString(2))
            .slice(-nVals)
            .split('')
            .map(Number);
        return choices;
    }

    export const onopen = params => {
        if (params && params.query) {
            console.log(params);
            query = params.query;
            useQuery(query);
        }
    };

    onDestroy(() => {
        //rhpane is closed,  but nothing else happens.
    });

    const closeCompletely = function () {
        console.log('close completely');
        
        pickerT.dragOff(fetchData);
        
        pickerT.closeCompletely();
        bcast.fire('rqstClose','windy-plugin-embedbox');

        bcast.off('metricChanged', onMetricChanged);
        picker.off('pickerOpened', fetchData);
        picker.off('pickerMoved', pickerMoved);

        store.off('timestamp', setTs);
        store.off('product', setProd);
        bcast.fire('rqstClose', name);
        hasHooks = false;
    };

    thisPlugin.closeCompletely = closeCompletely;

    //const load = pluginDataLoader({
    //    key: 'tqBdvHJjtNrGq4TrFzt9D5NDz9fIZSC8',
    //    plugin: 'windy-plugin-da',
    //});

    //if tablet,  then move logo to a better position.
    if (rs.isTablet) {
        u$('#logo').style.left = '100%';
        u$('#logo').style.marginLeft = '-150px';
    }

    let ts = store.get('timestamp');

    //read query data

    function useQuery(query) {
        let { lat, lng } = map.getCenter();
        if (query) {
            let q = query;

            for (let p in q) {
                switch (p.toUpperCase()) {
                    case 'DATE':
                        let d = new Date(q[p]);
                        if (d != 'Invalid Date') ts = d.getTime();
                        else console.log('INVALID date');
                        break;
                    case 'LAT':
                        if (!isNaN(Number(q[p]))) lat = Number(q[p]);
                        break;
                    case 'LNG':
                    case 'LON':
                        if (!isNaN(Number(q[p]))) lng = Number(q[p]);
                        break;
                }
            }
            lastpos = { lat, lon: lng };
            map.setView(lastpos);
            setTimeout(() => bcast.fire('rqstOpen', whichPicker(), lastpos), 1000);
            store.set('timestamp', ts);
            //setURL();
        }
    }

    function setURL() {
        W.location.setUrl(
            `plugins/windy-plugin-da?lat=${lastpos.lat.toFixed(5)}&lng=${lastpos.lon.toFixed(5)}&date=${new Date(ts).toISOString().slice(0, 16)}`,
        );
    }

    function pickerMoved(e) {
        if (pickerT.getActivePlugin() != name) return;
        elevfnd = datafnd = true;
        setTimeout(fetchData, 500, e);
    }

    function onMetricChanged(e) {
        let c = pickerT.getParams();
        console.log(c);
        if (c) {
            fetchData(c);
        }
    }

    function setTs(t) {
        ts = t;
    }

    function setProd(e) {
        prod = e;
        if (lastpos) fetchData(lastpos);
    }

    function parseWxCode(c) {
        let wc = c.replace(/,/g, ' ');
        return wc;
    }

    function readChoices(lastClick) {
        console.log('lastclick', lastClick);
        let choices = [...refs.choose.children].map(e => !e.classList.contains('checkbox--off'));
        if (choices.filter(e => e).length > 5) {
            let i;
            for (i = choices.length - 1; i > 0 && (choices[i] == false || i == lastClick); i--);
            choices[i] = false;
            [...refs.choose.children][i].classList.add('checkbox--off');
        }
        console.log(choices, parseInt(choices.map(Number).join(''), 2));
        store.set('plugin-da-selected-vals', parseInt(choices.map(Number).join(''), 2));
    }

    function onChoose(e) {
        let tg = e.target;
        let ix;
        if (tg.classList.contains('checkbox')) {
            tg.classList.toggle('checkbox--off');
            if (!tg.classList.contains('checkbox--off'))
                ix = [...refs.choose.children].findIndex(e => tg == e);
        }
        readChoices(ix);
        calculate();
    }

    function calculate() {
        if (wxdata) {
            let elev = Math.round(elp.elev * 3.28084);
            if (elev < 0) elev = 0;
            let d = wxdata.data.data;
            let ix = 0;
            for (let i = 0; i < d.ts.length; i++) {
                if (d.ts[i] > ts) {
                    if (i == 0) break;
                    else {
                        ix = (d.ts[i] - ts) / (d.ts[i] - d.ts[i - 1].ts) < 0.5 ? i : i - 1;
                        break;
                    }
                }
            }
            let wind = d.wind[ix],
                gust = d.gust[ix],
                windDir = d.windDir[ix],
                rain = d.rain[ix],
                cbase = d.cbase[ix],
                rh = d.rh[ix],
                pressure = d.pressure[ix],
                dewPoint = d.dewPoint[ix],
                temp = d.temp[ix],
                weathercode = d.weathercode[ix];

            let pressureC = Math.round(pressure) / 100;
            let tempC = Math.round((temp + K) * 10) / 10;
            let dewPC = Math.round((dewPoint + K) * 10) / 10;
            let da_corr_dp = dewPC * 20;

            let wetBulb =
                tempC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
                Math.atan(tempC + rh) -
                Math.atan(rh - 1.676331) +
                0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
                4.686035 -
                K;

            console.log('temp', temp, 'wetBulb', wetBulb);

            let deltaT = temp - wetBulb - K;

            let vals = [
                { metric: 'pressure', txt: 'QNH: ', v: pressure },
                { metric: 'temp', txt: 'Temp: ', v: temp },
                { metric: 'temp', txt: 'Dew Point: ', v: dewPoint },
                { metric: 'temp', txt: 'Wet Bulb: ', v: wetBulb },
                { metric: 'temp', txt: '&Delta;T: ', v: deltaT },
                { metric: 'rh', txt: 'Humidity: ', v: rh },
                { metric: 'rain', txt: 'Rain: ', v: rain },
                { metric: 'altitude', txt: 'Cloudbase: ', v: cbase },
                { metric: '', txt: 'Wx code: ' },
                { metric: 'wind', txt: 'Wind: ', v: wind },
                { metric: 'wind', txt: 'Gust: ', v: gust },
            ];

            let pa = elev + 27 * (1013 - pressureC);
            let isa = 15 - (1.98 * pa) / 1000;
            let da = pa + 118.8 * (tempC - isa);
            let da_dp = da + da_corr_dp;

            let thermalspan =
                thermal && elp.elev !== void 0
                    ? `<span style="width:60px;font-size:16px;display:inline-block;margin-bottom:5px;">&nbsp;${Math.round(thermal - elev)} AGL</span><br>`
                    : '';

            let ldiv = '';
            let choices = getChoices();
            vals.forEach(({ metric, txt, v }, i) => {
                if (!choices[i]) return;
                if (txt.includes('Wx code')) {
                    ldiv += 'Wx code: ' + parseWxCode(weathercode) + '<br>';
                    return;
                }
                let m = store.get('metric_' + metric);
                ldiv += `${txt} ${Math.round(W.metrics[metric].conv[m].conversion(v))}${m}`;
                if (txt.includes('Wind')) ldiv += `, ${windDir}°`;
                ldiv += '<br>';
            });

            console.log('left div', ldiv);

            pickerT.fillLeftDiv(ldiv, true, { 'flex-basis': '50%' });
            //pickerT.showLeftDiv();

            pickerT.fillRightDiv(
                `
        <div>
            ${thermalspan}
            <span style="width:45px;display:inline-block;">${elp.elev > 0 ? 'Elev:' : 'Depth'}</span>${
                elp.elev > 0 ? elev + '&nbspft' : Math.round(elp.elev) + '&nbspm'
            }<br>
            <span style="width:45px;display:inline-block;">PA:</span>${Math.round(pa)}&nbspft<br>
            <span style="width:45px;display:inline-block;">DA:</span>${Math.round(da)}&nbspft<br>
            <span style="color:white">
            <span style="width:45px;display:inline-block;">DA_dp:</span>${Math.round(da_dp)}&nbspft
            </span>
        <div>`,
                { 'flex-basis': '50%' },
            );
            //pickerT.showRightDiv();
            //setURL();
        }
    }

    function fetchData(c) {
        console.log('now in fetch', pickerT.getActivePlugin(), name);
        console.log(pickerT.getActivePlugin());
        if (pickerT.getActivePlugin() != name) return;
        lastpos = c;
        c.model = prod;
        lefta -= 0.05;
        righta -= 0.05;
        if (lefta < 0.6) lefta = 0.6;
        if (righta < 0.6) righta = 0.6;
        if (u$('#picker-div-left'))
            u$('#picker-div-left').style.color = `rgba(255,255,255,${lefta})`;
        if (u$('#picker-div-right'))
            u$('#picker-div-right').style.color = `rgba(255,255,255,${righta})`;
        if (elevfnd) {
            elevfnd = false;
            fetch(`https://www.flymap.co.za/srtm30/elev.php?lat=${c.lat}&lng=${c.lng || c.lon}`, {
                method: 'GET',
            })
                .then(r => r.json())
                .then(r => {
                    //http.get(`/services/elevation/${c.lat}/${c.lon}`).then(d =>{
                    //console.log(d.data);
                    //elp.elev = d.data;

                    elp.elev = r[0];
                    elp.pos = c;
                    setTimeout(() => (elevfnd = true), 100);
                    righta = 1;
                    calculate();
                })
                .catch(er => {
                    console.log(er);
                    elevfnd = true;
                });
        }

        console.log(store.get('overlay'));

        if (store.get('overlay') == 'ccl') {
            interpolator(ip => {
                thermal = ip(c)[0] * 3.28084;
                console.log('thermal', thermal);
            });
        } else thermal = null;

        if (datafnd) {
            datafnd = false;
            ftch.getPointForecastData(store.get('product'), c)
                .then(data => {
                    console.log('DATA', data);
                    wxdata = data;
                    wxdata.pos = c;
                    lefta = 1;
                    setTimeout(() => (datafnd = true), 150);
                    calculate();
                })
                .catch(er => {
                    console.log(er);
                    datafnd = true;
                });

            ftch.getMeteogramForecastData(store.get('product'), c)
                .then(data => {
                    console.log(data);
                })
                .catch(er => {
                    console.log(er);
                });
        }
    }
</script>

<style lang="less">
    @import 'da.less';
</style>

