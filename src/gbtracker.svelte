<div class="embed-window">
    <span
        class="checkbox"
        class:checkbox--off={!thisPlugin.isFocused}
        data-tooltip={`Picker focuses on the ${title} plugin.`}
        on:click={focus}>&nbsp;</span
    >
    <span
        on:click={() => {
            showInfo(name);
            focus(); // not sure if opening the info,  should focus the picker,  but seems to make sense intuitively
        }}
        style:cursor="pointer">Show Gordon Bennett Teams</span
    >
    <!--<span data-icon=""></span>-->
    <div data-ref="messageDiv" class="hidden"></div>
</div>

<div bind:this={mainDiv} id={`${name}-info`} class="bg-transparent dark-content">
    <div
        class="closing-x"
        on:click={() => {
            document.body.classList.remove(`on${name}-info`);
        }}
    ></div>
    <div bind:this={cornerHandle} data-ref="cornerHandle" class="corner-handle"></div>
    <div bind:this={cornerHandleTop} data-ref="cornerHandleTop" class="corner-handle-top"></div>
    <div class="flex-container">
        <div class="plugin__title">Gordon Bennett</div>
        <div style:margin-bottom="10px" on:click={refreshPositions}>
            Positions are not live. Click here to refresh.
        </div>
        <div class="scrollable">
            <div data-ref="teams">
                {#each teams as tm}
                    <div
                        class="team"
                        class:selected={selected == tm.id}
                        on:click={() => {
                            selectPath(tm.id);
                            selected = tm.id;
                            placePickerAtEnd(tm.id);
                        }}
                    >
                        <div class="bullet" style:background-color={'#' + tm.colour}></div>
                        <div class={'fi fis fi-' + tm.flag.toLowerCase()}></div>
                        <div>{tm.name}</div>
                        <div>Pilot: {tm.captain}</div>
                    </div>
                {/each}
            </div>
        </div>
        <div data-ref="ads">
            <img src={ads[adIx]?.url} />
        </div>

        <Footer onFooterClick={onFooter} />
    </div>
</div>

<script lang="ts">
    // @ts-nocheck

    import { onDestroy, onMount } from 'svelte';
    import plugins from '@windy/plugins';
    import { map } from '@windy/map';
    import bcast from '@windy/broadcast';

    import Footer from './utils/Footer.svelte';

    import {
        init,
        closeCompletely,
        getRaceSetup,
        selectPath,
        placePickerAtEnd,
        refreshPositions,
    } from './gbtracker_main.js';
    import {
        addDrag,
        showInfo,
        getWrapDiv,
        makeBottomRightHandle,
        makeTopLeftHandle,
        embedForTablet,
        toggleFullscreen,
    } from './utils/infoWinUtils.js';
    import { getPickerMarker } from 'custom-windy-picker';

    import config from './pluginConfig.js';

    const { title, name } = config;
    const { log } = console;

    const thisPlugin = plugins[name];
    let node;
    let mainDiv;
    let cornerHandle, cornerHandleTop;
    let closeButtonClicked;
    let marker;

    let interv;
    let adIx = 0;

    let ads = [];
    let teams = [];
    let selected;

    function selectTeam(id) {
        selected = id;
    }

    // the checkbox on the left of the embed-window allows the user to activate the picker for this plugin (focus).
    // The picker will then display info in the left or right picker divs for this plugin.
    function focus() {
        for (let p in plugins) {
            if (p.includes('windy-plugin') && p !== name && plugins[p].defocus) {
                plugins[p].defocus();
            }
        }
        thisPlugin.isFocused = true;

        // The pickerCtrl module maintains a list of plugins (LIFO) which uses either the left or right divs.
        // If you plan to use the left or right div,  add the name of this plugin to the picker,  with the following function:
        // Here I am only using the left Div,  so use .addLeftPlugin(name)
        marker = getPickerMarker();
        marker?.addRightPlugin(name);
        if (marker?.getParams()) {
            marker.openMarker(marker.getParams());
        }
    }

    function defocus() {
        thisPlugin.isFocused = false;
    }

    const onFooter = open => {
        if (open) log('Footer open');
        else log('footer closed');
    };

    onMount(() => {
        init(thisPlugin, selectTeam);
        node = thisPlugin.window.node;

        getRaceSetup().then(js => {
            ads = js.adverts;
            teams = js.teams;
            interv = setInterval(() => {
                adIx++;
                if (adIx >= ads.length) adIx = 0;
            }, 3000);
        });

        //  Info for this plugin is placed in a div appended to document.body,  get wrapDiv gets this div and creates it if needed.
        const wrapDiv = getWrapDiv();
        wrapDiv.appendChild(mainDiv);

        // Add handles to the Info div,  can be resized
        makeBottomRightHandle(cornerHandle, mainDiv);
        makeTopLeftHandle(cornerHandleTop, mainDiv);

        // At the moment,  tablets do not show embedded plugins correctly,  this is a fix
        embedForTablet(thisPlugin);

        //// Should not be needed later
        // register if the user closed the plugin with button.  This will allow the plugin to be closed completely.
        // if the plugin is closed programatically by another plugin,  it will be reopened.
        node.querySelector(':scope > .closing-x').addEventListener(
            'click',
            () => (closeButtonClicked = true),
        );
        //

        focus();
        thisPlugin.focus = focus;
        thisPlugin.defocus = defocus;
    });

    export const onopen = _params => {
        log(_params);
        if (_params && 'lon' in _params && !isNaN(_params.lat) && !isNaN(_params.lon)) {
            // Important:  onopen may actually occur before onmount (race condition).   So getPickerMarker here also.
            marker = getPickerMarker();
            marker.openMarker(_params);
            map.setView(_params);
        }
    };

    onDestroy(() => {
        mainDiv.remove();
        document.body.classList.remove(`on${name}-info`);

        //// This reopens the plugin if it is closed by another embedded plugin.
        //   It should not be needed later,   then the whole plugin can then be moved into svelte,
        //   open() requires an object
        if (!closeButtonClicked) setTimeout(() => thisPlugin.open({}));
        else closeCompletely();
        ////
    });
</script>

<style lang="less">
    @import 'gbtracker.less?1757160995862';
</style>
