// Easy3D_WebGL
// Core container for state and engine
// Emmanuel Charette 2017-2020

"use strict"


// Config
var E3D_FOV = 45 * DegToRad;
var E3D_NEAR = 0.1;
var E3D_FAR = 500.0;
var E3D_WIDTH = 640;
var E3D_HEIGHT = 480;
var E3D_G = 386.22;

// Global default 
var TIMER = new E3D_timing(false, 20, E3D_onTick); 
var CANVAS = null;
var CONTEXT = null;
var SCENE = new E3D_scene("scene0");
var CAMERA = new E3D_camera_persp("camera0");
var ENTITIES = [];
var INPUTS = null;



// Startup
function E3D_Init(element) {

    if (element == undefined) {
        log("No target element provided", false);

        element = document.getElementById("E3D_mainDiv");
        if (element == undefined) {
            log("No target element found", false);
            element = document.createElement("div");
            element.id = "E3D_mainDiv";
            element.style.position = "absolute";
            element.style.width = "100%";
            element.style.height = "100%";
            element.style.left = "0px";
            element.style.top = "0px";
            document.body.appendChild(element);
        }
    }

    if (element.tagName == "CANVAS") {
        CANVAS = element;
    } else {
        CANVAS = document.createElement("canvas");
        CANVAS.id = "E3D_canvas";
        element.appendChild(CANVAS);
        CANVAS.style.width = "100%";
        CANVAS.style.height = "100%";
    }

    CANVAS.width = CANVAS.offsetWidth;
    CANVAS.height = CANVAS.offsetHeight;

    log("Context Initialization", false);
    CONTEXT = CANVAS.getContext("webgl");

    if (!CONTEXT) {
        log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
        TIMER.pause();
        return;
    }

    log("Scene Initialization", false);
    try {
        log("Shader Program", false);
        SCENE.program = new E3D_program("program0");
        SCENE.program.compile(vertShader01, fragShader01);
        SCENE.program.bindLocations(attribList01, uniformList01);

        log("Lighting", false);
        SCENE.lights = new E3D_lighting(v3_val_new(0.0, 0.0, 0.15));
        SCENE.lights.setColor0(v3_val_new(1.0, 1.0, 1.0));
        SCENE.lights.setDirection0(v3_val_new(-0.2, -0.2, -1.0)); 
        SCENE.lights.light0_lockToCamera = true;

        SCENE.lights.setColor1(v3_val_new(1.0, 1.0, 0.85));
        SCENE.lights.setDirection1(v3_val_new(1.0, -1.0, 0.8));
        SCENE.lights.light1_lockToCamera = false;

        log("Camera", false);
        window.addEventListener("resize", E3D_onResize); // To reset camera matrix
        E3D_onResize();

        log("Scene Initialization", false);
        SCENE.initialize();
    } catch (e) {
        log(e, false);
        return; 
    }

    INPUTS = new E3D_input(element, true, true, true, true);

    TIMER.run();
    SCENE.state = E3D_ACTIVE;
}

// Default resize function
function E3D_onResize() {
    E3D_WIDTH = CANVAS.offsetWidth;
    E3D_HEIGHT = CANVAS.offsetHeight;
    //if (CONTEXT) CONTEXT.viewport(0, 0, E3D_WIDTH, E3D_HEIGHT);
    CAMERA.resize();
    log("Resized to " + E3D_WIDTH + "x" + E3D_HEIGHT);
}

// Default timer tick event handler
function E3D_onTick() {

    // Inputs
    INPUTS.processInputs();
    INPUTS.smoothRotation(6);
    INPUTS.smoothPosition(6);

    CAMERA.moveBy(-INPUTS.px_delta_smth, INPUTS.py_delta_smth, INPUTS.pz_delta_smth, 
                   INPUTS.rx_delta_smth, INPUTS.ry_delta_smth, INPUTS.rz_delta_smth);

    // Render
    if (SCENE.state == E3D_ACTIVE) {
        SCENE.preRender();
        SCENE.render();
        SCENE.postRender();
    }   
}

// Default Logger
var logElement = null;
function log(text, silent = true) {
    let ts = Date.now() - TIMER.start;
    if (!silent) {
        if (logElement == null) logElement = document.getElementById("E3D_logDiv");        
        if (logElement != null) {
            logElement.innerHTML += "[" + ts + "] " + text + "<br />";
            logElement.scrollTop = logElement.scrollHeight - logElement.offsetHeight;
        } 
    }
    console.log("[" + ts + "] " + text);
}