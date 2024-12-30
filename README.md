# Demo Plugin

This is a demo plugin,  provides a structure for most of my plugins:

It shows the elevation and model elevation in the picker.   

To start a new plugin:

- copy this dir
- set git remote:  git remote set-url xxx xxxx
- Change the pluginConfig
- Change all the `demo`s to this plugin name:
    - Change the name of `demo.svelte`.   In this file,  change:  import .... `demo_main.js` and `demo.less` in the style part.
    - Change the name of `demo-main.js`.  
    - Change the name of `demo.less`.
    - Change `@name  : windy-plugin-demo;` in global.less and demo.less.
- Make the screenshot.jpg in ./src
- Write the README.me
- I think that is about it,  start building!!!
