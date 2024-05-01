const globalCss = `<style id='stylesheet-for-windy-plugin-da'>.onwindy-plugin-da.onwindy-plugin-da-info #search{display:none}.onwindy-plugin-da.onwindy-plugin-da-info #plugin-developer-mode{left:400px}#windy-plugin-da-info{display:none}.onwindy-plugin-da.onwindy-plugin-da-info #windy-plugin-da-info{display:block}.ondetail #windy-plugin-da-info{display:none !important}.onrplanner #windy-plugin-da-info{display:none !important}</style>`;
let globalCssNode;
function insertGlobalCss(){
    if(!document.querySelector("#stylesheet-for-windy-plugin-da")){
        document.head.insertAdjacentHTML('beforeend', globalCss);
        globalCssNode = document.querySelector("#stylesheet-for-windy-plugin-da");
    }
}
function removeGlobalCss(){
    if(globalCssNode){
        globalCssNode.remove();
    }
}
export { globalCssNode, insertGlobalCss, removeGlobalCss };
