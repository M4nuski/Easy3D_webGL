// Easy3D_WebGL v0.5
// Script loader for the full engine stack
// Script in the "data-main" attribute of the <script> element will by added and loaded at the end of the list
// The "data-fail" script will be ran in the loading fail.
// Emmanuel Charette 2020

"use strict"

var E3D_DEBUG_VERBOSE = false;

var E3D_scriptList = [
    "ver5/math.js",
    "ver5/utility.js",
    "ver5/debug.js",

    "ver5/timing.js",
    "ver5/input.js",    
    
    "ver5/shader.js",
    "ver5/camera.js",
    "ver5/entity.js",
    "ver5/scene.js",

    "ver5/animation.js",
    "ver5/body.js",
    "ver5/collision.js",
    
    "ver5/core.js",
    "ver5/resource.js",
    "ver5/mesh.js"
];
    
var E3D_fallbackScript = "";
var E3D_numScriptLoaded = 0;
var E3D_currentScript = "";
var E3D_engineRoot = "";

function E3D_scriptLoaded() {
    E3D_numScriptLoaded++;
    if (E3D_DEBUG_VERBOSE) console.log("E3D_Engine: " + E3D_currentScript + " Loaded");
    if (E3D_numScriptLoaded >= E3D_scriptList.length) {
        console.log("E3D_Engine: All Scripts Loaded");
    } else E3D_loadNextScript();
}

function E3D_scriptLoadError(event){
    console.log("E3D_Engine: Script Load Error for " + E3D_currentScript + ": " + event.type);
    if (E3D_fallbackScript != "") {
        var s = document.createElement("script");
        s.type = "text/javascript"; 
        s.src = E3D_fallbackScript;
        document.head.appendChild(s);
    } else { // Default warning
        var elem = document.createElement("div");
        elem.style.backgroundColor = "red";
        elem.style.color = "white";
        elem.style.position = "absolute";
        elem.style.zIndex = "9999";
        elem.style.top = "0px";
        elem.style.left = "0px";
        elem.style.right = "0px";
        elem.innerText = "Easy3D Engine v0.5 script list load error: " + E3D_currentScript;
        document.body.appendChild(elem);
    }
}

function E3D_loadNextScript() {
    if (E3D_numScriptLoaded < E3D_scriptList.length) {
        var s = document.createElement("script");
        s.type = "text/javascript"; 
        s.onload = E3D_scriptLoaded;
        s.onerror = E3D_scriptLoadError;
        s.src = E3D_engineRoot + E3D_scriptList[E3D_numScriptLoaded];
        E3D_currentScript = E3D_engineRoot + E3D_scriptList[E3D_numScriptLoaded];
        document.head.appendChild(s);
    }
}

var scriptTags = document.querySelectorAll("SCRIPT");
for (var tag of scriptTags) {
    var debug = tag.getAttribute("data-debug");
    if ((debug) && (debug == "verbose")) E3D_DEBUG_VERBOSE = true;
}
for (var tag of scriptTags) {
    var main = tag.getAttribute("data-main");
    if (main) { 
        E3D_scriptList.push(main);
        if (E3D_DEBUG_VERBOSE) console.log("E3D_Engine: Adding main script " + main);
    }
    var fail = tag.getAttribute("data-fail");
    if (fail) {
        E3D_fallbackScript = fail;
        if (E3D_DEBUG_VERBOSE) console.log("E3D_Engine: Using fallback script " + fail);
    }
    var root = tag.getAttribute("data-root");
    if (root) {
        E3D_engineRoot = root;
        if (E3D_DEBUG_VERBOSE) console.log("E3D_Engine: Using engine root of " + root);
    }
}

E3D_loadNextScript();
