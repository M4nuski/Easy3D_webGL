// Easy3D_WebGL
// Main demo program for cell shading shaders/render
// Emmanuel Charette 2017-2019

"use strict"

document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");

log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const logElement = document.getElementById("logDiv");
const status = document.getElementById("statusDiv");

log("Set DOM Events");
can.addEventListener("resize", winResize); // To reset camera matrix

// Engine Config

const _fieldOfView = 60 * DegToRad;
const _zNear = 0.1;
const _zFar = 500.0;

// Engine State

var winWidth = 10, winHeight = 10;
var usepct_smth=0;

// Engine Components

var gl; //
var timer = new E3D_timing(false, 50, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var inputs = new E3D_input(can, true, true, true, true, true, true);
var meshLoader = new E3D_loader();


log("Session Start", true);
initEngine();


function winResize() {
    winWidth = gl.canvas.clientWidth
    winHeight = gl.canvas.clientHeight;
    
    scn.camera = new E3D_camera_model("cam1m", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    inputs.clampPitch = true;
    inputs.allowPan = true;

    scn.camera.moveTo(0, 7.5, 15, 0, 0, 0);
}

function initEngine() {

    log("Context Initialization", false);
    gl = can.getContext("webgl");

    if (!gl) {
        log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
        timer.pause();
        return;
    }

    log("Scene Creation", false);
    try {
        scn = new E3D_scene_cell_shader("mainScene_CS", gl, winWidth, winHeight, [0.95, 0.95, 0.95, 1.0], 300);

        log("Shader Program Initialization", false);

        scn.program = new E3D_program("mainProgram", gl);
        scn.program.compile(vertShader02_CS01, fragShader02_CS01);
        scn.program.bindLocations(attribList02_CS01, uniformList02_CS01);

        scn.strokeProgram = new E3D_program("strokeProgram", gl);
        scn.strokeProgram.compile(vertShader02_CS00, fragShader02_CS00);
        scn.strokeProgram.bindLocations(attribList02_CS00, uniformList02_CS00);

        log("Lighting Initialization", false);
        scn.lights =  new E3D_lighting(v3_val_new(0.0, 0.0, 0.15));
        scn.lights.setColor0(v3_val_new(1.0, 1.0, 1.0));
        scn.lights.setDirection0(v3_val_new(-0.2, -0.2, -1.0)); 
        scn.lights.light0_lockToCamera = true;

        scn.lights.setColor1(v3_val_new(1.0, 1.0, 0.85));
        scn.lights.setDirection1(v3_val_new(1.0, -1.0, 0.8));
        scn.lights.light1_lockToCamera = true;

        log("Camera Initialization", false);
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

    } catch (e) {
        log(e, false);

        return; 
    }
     
    resMngr.addRessource("../Models/ST.raw", "Storm Trooper", "Model");
    resMngr.addRessource("../Models/DEER.raw", "Deer Horns", "Model");
 //   resMngr.addRessource("../Models/FALCON.raw", "Millenium Falcon", "Model");
    resMngr.addRessource("../Models/SSHIP.raw", "Space Ship", "Model");
    resMngr.addRessource("../Models/M9.raw", "B M9", "Model");
    resMngr.addRessource("../Models/GTR.raw", "Nissan GTR", "Model");
    resMngr.loadAll("models");


    inputs._posSpeed /=2;
    inputs._rotSpeed /=2; 

    timer.run();
    scn.state = E3D_ACTIVE;
}


function prepRender() {
    // move camera per inputs
    scn.camera.moveBy(-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth, 
                       inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth);
}

function timerTick() {  // Game Loop
    inputs.processInputs(timer.delta);
    inputs.smoothPosition(5);
    inputs.smoothRotation(5);

    updateStatus();

    if (scn.state == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }   

}


function onRessource(name, msg) {
    if (msg == E3D_RES_FAIL) {
        log("Failed to load ressource: " + name, false);        
    }
    if (msg == E3D_RES_ALL) {
        log("All async ressources loaded for tag: " + name, true);       
        resMngr.flushAll();   
    }

    if (msg == E3D_RES_LOAD) {
        log("Async ressource loaded: " + name, true); 

        if (resMngr.getRessourceType(name) == "Model") {
            let nm = new E3D_entity(name, "", false);

            if (name == "Deer Horns") {
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0, 0.2, 0.2]);
                meshLoader.smoothNormals( -0.707);
            } else if (name == "Storm Trooper") {
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0, 1.0, 1.0]);
                meshLoader.addStrokeData(nm);
                meshLoader.smoothNormals( 0.0);
            } else if (name == "B M9") {
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [0.2, 0.2, 0.3]);
                meshLoader.addStrokeData(nm);
                meshLoader.smoothNormals( -0.2);
                nm.position = [-15, 0, 0];
                nm.rotation = [0, 3.1415, 0];
            } else if (name == "Nissan GTR") {
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0, 1.0, 0.25]);
                meshLoader.addStrokeData(nm);
                meshLoader.smoothNormals( 0.707);
                nm.position = [25, -5, 0];
                nm.rotation = [0, 0, 0];
            }  else {
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [0.5, 0.5, 1.0]);
                meshLoader.smoothNormals( 0.0);
                nm.position = [5, 15, -25];
                nm.rotation = [0, 3.1415, 0];
            }

            meshLoader.addModelData(nm);            
            scn.addEntity(nm);  
            nm.visible = true;
            nm.resetMatrix();
        }  
    } // msg loaded
}

// Logging and status information


function log(text, silent = true) {
    let ts = 0;
    try {
        ts = Date.now() - timer.start;
    } catch (e) {
        // timer was not yet defined
    } 

    console.log("E3D[" + ts + "] " + text);
    if (!silent) {
        logElement.innerHTML += "[" + ts + "] " + text + "<br />";
    }
}

function updateStatus() {
    usepct_smth = timer.smooth(usepct_smth, timer.usage, 3);
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + "pY:" + Math.floor(scn.camera.position[1]) + "pZ:" + Math.floor(scn.camera.position[2])+ "rX: " + Math.floor(inputs.rx * RadToDeg) + " rY:"+ Math.floor(inputs.ry * RadToDeg) + "<br />" +
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets;
}



});