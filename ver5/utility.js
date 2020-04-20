// Easy3D_WebGL
// String padding and justify methods
// Polyfill and handler classes for "on pointer hover" css switching supporting mobile touch
// Emmanuel Charette 2017-2020

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



// DOM helpers
function getElem(id) {
    var elem = document.getElementById(id);
    if (elem) return elem;
    return false;
}

function onClick(elemOrID, callback) {
    if (typeof(elemOrID) == "string") elemOrID = getElem(elemOrID);
    if (elemOrID) elemOrID.addEventListener("click", callback);
}

function onEvent(elemOrID, event, callback) {
    if (typeof(elemOrID) == "string") elemOrID = getElem(elemOrID);
    if (elemOrID) elemOrID.addEventListener(event, callback);
}

var __$elementMap = new Map();
function $(elem) {
    var res = __$elementMap.get(elem);
    if (res == undefined) {
        res = document.getElementById(elem);
        if (res != undefined) __$elementMap.set(elem, res);
    }
    return res;
}

function $remove(elem) {
    if ($(elem) != undefined) {
        try { 
            $(elem).parentElement.removeChild($(elem));
        } catch (ex) {};
        __$elementMap.delete(elem);
    }
}

function $forEach(selector, lambda) {
    document.querySelectorAll(selector).forEach(lambda);
}