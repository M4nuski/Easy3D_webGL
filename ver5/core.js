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

// Global members 
var TIMER = new E3D_timing(false, 100, E3D_onTick_callback); 
var CANVAS = null;
var CONTEXT = null;
var SCENE = new E3D_scene("scene0");
var ENTITIES = [];
var ANIMS = []; // list of ENTITIES that need to be animated
var CAMERA = new E3D_camera("camera0");
var INPUTS = new E3D_input();

// Callbacks
// base events
var CB_input;
var CB_pointerlockMove; 
var CB_pointerlockEvent;
var CB_resize;
var CB_tick;
// engine loop
var CB_processInputs;
var CB_processCamera;
var CB_processPreRender;
var CB_processRender;
var CB_processPostRender;


// Engine initialization functions


// Context, timer, perspective camera, all input types, default scene and shaders, lights 
function E3D_InitAll(element) {
    E3D_InitScene(element);
    if (SCENE) {

        log("Camera", false);
        CAMERA = new E3D_camera_persp("camera0p");
        E3D_onResize();

        log("Inputs", false);
        INPUTS.supportKeyboard();
        INPUTS.supportMouse();
        INPUTS.supportTouch();
        INPUTS.supportPointerLock();
         
        log("Timer", false);
        TIMER.onTick = E3D_onTick_default;
        TIMER.setInterval(20);
        TIMER.run();
    }    
}

// Context, scene, lights
function E3D_InitScene(element) {
    E3D_InitContext(element);
    if (CONTEXT) {
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

            SCENE.fogLimit = E3D_FAR / 2;
            SCENE.initialize();
            SCENE.state = E3D_ACTIVE;
        } catch (e) {
            log(e, false);
            return; 
        }
    }
}


// Context only
function E3D_InitContext(element) {
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

    window.addEventListener("resize", E3D_onResize);

    log("Context Initialization", false);
    CONTEXT = CANVAS.getContext("webgl");

    if (!CONTEXT) {
        log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
        TIMER.pause();
        return;
    }
}



// on resize handlers


// Default resize function
function E3D_onResize() {
    // get new size
    E3D_WIDTH = CANVAS.offsetWidth; 
    E3D_HEIGHT = CANVAS.offsetHeight;
    // adjust canvas resolution to fit new size, remove or override to lower the render viewport resolution
    CANVAS.width = E3D_WIDTH;
    CANVAS.height = E3D_HEIGHT;
    // reset viewport and camera
    CONTEXT.viewport(0, 0, E3D_WIDTH, E3D_HEIGHT);
    CAMERA.resize();
    //log("Resized to " + E3D_WIDTH + "x" + E3D_HEIGHT);
    if (CB_resize) CB_resize();
}


// on tick handlers


// Default timer tick event handler
function E3D_onTick_default() {
    if (CB_tick) CB_tick();
    // Inputs
    INPUTS.processInputs();
    INPUTS.smoothRotation(6);
    INPUTS.smoothPosition(6);

    // Camera
    CAMERA.moveBy(-INPUTS.px_delta_smth, INPUTS.py_delta_smth, INPUTS.pz_delta_smth, 
                   INPUTS.rx_delta_smth, INPUTS.ry_delta_smth, INPUTS.rz_delta_smth);
    CAMERA.updateMatrix();

    // Render
    if (SCENE.state == E3D_ACTIVE) {
        SCENE.preRender();
        SCENE.render();
        SCENE.postRender();
    }   
}

// timer tick handler for scene only, callbacks for the rest
function E3D_onTick_scene() {
    if (CB_processInputs) CB_processInputs();
    if (CB_processCamera) CB_processCamera();
    // Render
    if (SCENE.state == E3D_ACTIVE) {
        SCENE.preRender();
        if (CB_processPreRender) CB_processPreRender();
        SCENE.render();
        if (CB_processRender) CB_processRender();
        SCENE.postRender();
        if (CB_processPostRender) CB_processPostRender();  
    }   
}

// timer tick handler for callbacks only
function E3D_onTick_callback() {
    if (CB_processInputs) CB_processInputs();
    if (CB_processCamera) CB_processCamera();
    if (CB_processPreRender) CB_processPreRender();
    if (CB_processRender) CB_processRender();
    if (CB_processPostRender) CB_processPostRender();  
}


// Default Logger


var E3D_logElement = null;
function log(text, silent = true) {
    let ts = Date.now() - TIMER.start;
    if (!silent) {
        if (E3D_logElement == null) E3D_logElement = document.getElementById("E3D_logDiv");        
        if (E3D_logElement != null) {
            E3D_logElement.innerHTML += "[" + ts + "] " + text + "<br />";
            E3D_logElement.scrollTop = E3D_logElement.scrollHeight - E3D_logElement.offsetHeight;
        } 
    }
    console.log("[" + ts + "] " + text);
}