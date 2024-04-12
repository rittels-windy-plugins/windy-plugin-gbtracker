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
    import bcast from '@windy/broadcast';
    import { onDestroy, onMount } from 'svelte';
    import plugins from '@windy/plugins';

    import { init, closeCompletely } from './da_main.js';

    import config from './pluginConfig.js';

    const { title, name } = config;

    const thisPlugin = plugins[name]; // needed here?

    onMount(() => {
        //local variable is reactive,  but not rings,  imported object is const cannot be set
        init(thisPlugin);
    });

    export const onopen = _params => {};

    onDestroy(() => {});
</script>

<style lang="less">
    @import 'da.less';
</style>
