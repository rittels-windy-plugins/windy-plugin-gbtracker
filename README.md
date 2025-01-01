# Demo Plugin

This is a demo plugin,  provides a structure for most of my plugins:

My plugins are generally embedded,  with very minimal information in the `embed` box,  or `small` box in mobile.   I provide a button to open an info window,  which is larger,  and contains information and settings and so on.   This info window can be resized.   Closing the `embed box` or `small box`,  closes the plugin completely,  and removes all listeners and map elements.   Closing the info window,  just hides it.  

I also made a custom-picker,  for which I created a npm module https://www.npmjs.com/package/custom-windy-picker.   This allows me to add stuff to the picker,  and adds a drag listener for the picker.  In the past I attached stuff directly to the internal windy picker,  but Ivo asked that I NOT do that,  and rather make a clone of the picker,  so that if the DOM is changed,  it does not break this picker.  

To start a new plugin (this is mostly for myself):

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
- (For myself):  Delete contents of utils,  and run makeLinks.sh.   
- I think that is about it,  start building!!!

After pushing to repo.   Actions may not always be visible,  then a small change must be edited to publish-plugin.yml,  like adding an empty line at then end,  so that github sees it.  For the next version just force push,  it does not matter,  gh is now aware of it.

(This demo plugin just shows the elevation and model elevation for the picker position). 