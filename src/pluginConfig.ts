import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-da',
    version: '0.2.21',
    icon: '⛰',
    title: 'Density Alt',
    description:'The picker shows the density altitude and other information,  provides a multi-picker.',
    author: 'Rittels',
    repository: 'github.com/rittels-windy-plugins/windy-plugin-da.git',
    desktopUI: 'embedded',
    mobileUI: 'small',
    listenToSingleclick: true
    //routerPath: '/my-plugin',
};


export default config;
