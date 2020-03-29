// Easy3D_WebGL
// String padding and justify methods
// Polyfill and handler classes for "on pointer hover" css switching supporting mobile touch
// Emmanuel Charette 2017-2019

"use strict"


// Strings
function padStart(str, pad, len) {
    if (pad.length < 1) return str;
    while (str.length < len) str = pad[0] + str; 
    return str;
}
function padEnd(str, pad, len) {
    if (pad.length < 1) return str;
    while (str.length < len) str = str + pad[0]; 
    return str;
}
function justify(str1, str2, len) {
    str1 = str1.toString();
    str2 = str2.toString();
    var delta = len - str1.length - str2.length;    
    return str1 + ( (delta >=0) ? (" ".repeat(delta) + str2) : ("#".repeat(len - str1.length))) ;
}


// Hover support for touch
var hover2elements;
const _hoverclassMarker = ".hover2";
const _hoverclassSuffixOn = "_hover2on";
const _hoverclassSuffixOff = "_hover2off";

document.addEventListener("DOMContentLoaded", function () {

    hover2elements = document.querySelectorAll(_hoverclassMarker);

    for (var i = 0; i < hover2elements.length; ++i) {
        hover2elements[i].addEventListener("touchstart", hover2onTouch);
        hover2elements[i].addEventListener("touchcancel",hover2onTouchCancel);
        hover2elements[i].addEventListener("touchend",hover2onTouchCancel);
        hover2elements[i].addEventListener("mouseenter", hover2onMouseEnter);
        hover2elements[i].addEventListener("mouseleave", hover2OnMouseLeave);
        hover2elements[i].classList.add(hover2elements[i].id + _hoverclassSuffixOff);
    }
});


function hover2CollapseAll(){
    for (var i = 0; i < hover2elements.length; ++i) {
        hover2elements[i].classList.replace( hover2elements[i].id + _hoverclassSuffixOn, hover2elements[i].id + _hoverclassSuffixOff);
    }
}


function hover2DisableAll(){
    //remove hover class from all elements
    //remove event handlers
}
function hover2Disable(elem){
    //find elem in list, remove events
    //remove elem from list
}

function hover2onTouch(event){
    event.target.classList.replace( event.target.id + _hoverclassSuffixOff, event.target.id + _hoverclassSuffixOn);
    console.log("touch start");
}
function hover2onTouchCancel(event){
    event.target.classList.replace( event.target.id + _hoverclassSuffixOn, event.target.id + _hoverclassSuffixOff);
    console.log("touch cancel");
}
function hover2onMouseEnter(event){
    event.target.classList.replace( event.target.id + _hoverclassSuffixOff, event.target.id + _hoverclassSuffixOn);
    console.log("mouse enter");
}
function hover2OnMouseLeave(event){
    event.target.classList.replace( event.target.id + _hoverclassSuffixOn, event.target.id + _hoverclassSuffixOff);
    console.log("mouse leave");
}