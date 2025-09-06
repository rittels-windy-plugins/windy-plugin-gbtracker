import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-gbtracker',
    version: '0.0.3',
    icon: 'GB',
    title: 'Gordon Bennett tracker',
    description: 'Gordon Bennett for 2025',
    author: 'Rittels',
    repository: 'https://www.github.com/rittels-windy-plugins/windy-plugin-gbtracker',
    desktopUI: 'embedded',
    mobileUI: 'small',
    listenToSingleclick: true,
    routerPath: '/gbtracker/',
    addToContextmenu: true,
    private: true
};

export default config;
