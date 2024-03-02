
const globalCss = "<style id='stylesheet-for-windy-plugin-da'>.onwindy-plugin-da #plugin-rhpane-top .rhcircle__main-menu__animated-icon span:nth-child(2){transform:rotate(45deg);top:.3em;left:.5em;width:80%}.onwindy-plugin-da #plugin-rhpane-top .rhcircle__main-menu__animated-icon span:nth-child(3){transform:rotate(-45deg);top:2.2em;left:.5em;width:80%}</style>";
let globalCssNode;
function insertGlobalCss(){
    if(!document.querySelector("#stylesheet-for-windy-plugin-no-ex")){
        document.head.insertAdjacentHTML('beforeend', globalCss);
        globalCssNode = document.querySelector("#stylesheet-for-windy-plugin-no-ex");
    }
}
function removeGlobalCss(){
    if(globalCssNode){
        globalCssNode.remove();
    }
}
export { globalCssNode, insertGlobalCss, removeGlobalCss };
