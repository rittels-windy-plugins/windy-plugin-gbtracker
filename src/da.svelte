<div class="plugin__mobile-header">
    {title}
</div>
<section class="plugin__content">
    <div style="font-weight:bold; font-size:15px;">Elevation and Density Altitude</div>
    <div on:click={()=> bcast.fire("rqstClose",name,"using my own close btn")}>Close completely</div>
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
            <div class="checkbox off">Cloudbase</div>
            <div class="checkbox off">Wx code</div>
            <div class="checkbox off">Wind</div>
            <div class="checkbox off">Gust</div>
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
    import bcast from '@windy/broadcast';
    import { onDestroy, onMount } from 'svelte';
    import plugins from '@windy/plugins';

    import config from './pluginConfig';

    import { installExternalPlugin } from '@windy/externalPlugins';

    import { globalCssNode, insertGlobalCss, removeGlobalCss } from './globalCss.js';

    const { title, name } = config;

    let world;

    let refs = {};

    const promises = [
        installExternalPlugin('https://localhost:9998/plugin.js').then(()=> plugins['windy-plugin-picker-tools'].open())
    ];

    export const onopen = _params => {
        console.log(_params);
        console.log('receivd params');
        // Your plugin was opened with parameters parsed from URL
        // or with LatLon object if opened from contextmenu
    };

    export const onclose = message => {
        console.log("Closed with message",message);
    };
    
    onMount(() => {
        insertGlobalCss();
        console.log(refs);
        console.log('mounted');
        Promise.all(promises).then(() => {
            console.log(plugins['windy-plugin-picker-tools']);
            ({ world } = plugins['windy-plugin-picker-tools'].exports);
            console.log('all plugins loaded');
            world();
        });
    });

    onDestroy((message) => {
        console.log(message);
        removeGlobalCss();
    });

    const showNodeName = () => {
        console.log('name', name, 'title', title);
    };

    plugins[name].exports = {
        showNodeName,
    };
</script>

<style lang="less">
    @import 'da.less';
</style>
