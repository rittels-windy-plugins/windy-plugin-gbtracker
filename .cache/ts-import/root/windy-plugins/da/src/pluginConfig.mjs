const config = {
    name: 'windy-plugin-da',
    version: '0.2.5',
    icon: '⛰',
    title: 'Density Alt',
    description: 'The picker shows the density altitude and other information,  provides a multi-picker.',
    author: 'Rittels',
    repository: 'github.com/rittels-windy-plugins/windy-plugin-da.git',
    desktopUI: 'embedded',
    mobileUI: 'small',
    listenToSingleclick: true,
    routerPath: '/density-alt/:lat?/:lon?',
    addToContextmenu: true
    //routerPath: '/my-plugin',
};
export default config;
