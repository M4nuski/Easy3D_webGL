
// Easy3D_WebGL
// Polyfill and handler classes for fullscreen
// Emmanuel Charette 2017-2019

"use strict"

document.exitFullscreen = document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;

document.addEventListener("webkitfullscreenchange", _fullscreenChange);
document.addEventListener("mozfullscreenchange", _fullscreenChange);
document.addEventListener("MSFullscreenChange", _fullscreenChange);

var fullscreenChangeCallback;
var fullscreenlastelement;

function fullscreenActive() {
    document.fullscreenElement = document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    return !(!document.fullscreenElement);  
}

function _fullscreenChange() {
    if (fullscreenChangeCallback) fullscreenChangeCallback(fullscreenActive(), fullscreenlastelement);  
}

function fullscreenToggle (elem){
    fullscreenlastelement = elem;    
    elem.requestFullscreen = elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;

    if (fullscreenActive()) {
        document.exitFullscreen();        
    } else {
        elem.requestFullscreen();
    }
}

function fullscreenEnable (elem){
    fullscreenlastelement = elem;
    elem.requestFullscreen = elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;

    if (!fullscreenActive())  elem.requestFullscreen();
}

function fullscreenDisable () {
    fullscreenlastelement = undefined;
    document.exitFullscreen();
}
