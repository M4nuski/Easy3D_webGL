document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");


"use strict"


log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const logElement = document.getElementById("logDiv");
const status = document.getElementById("statusDiv");
const virtualKb = document.getElementById("inputTable"); 
const virtualTrackpad = document.getElementById("track0"); 
const virtualThumbStick0 = document.getElementById("thumb0"); 


log("Set DOM Events");
can.addEventListener("resize", winResize); // To reset camera matrix
document.forms["moveTypeForm"].addEventListener("change", winResize); // To update camera matrix
document.forms["moveTypeForm"].invertY.addEventListener("keydown", (e) => {e.preventDefault(); });

// Engine Config

const _fieldOfView = 45 * DegToRad;
const _zNear = 0.1;
const _zFar = 500.0;

// Engine State

var winWidth = 10, winHeight = 10;
var usepct_smth=0;
var l0v, l1v;// light entities index
var cloned = false;

// Engine Components

var gl; // webGL canvas rendering context
var timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var inputs = new E3D_input(can, true, true, true, true, true, true);

var vKBinputs = new E3D_input_virtual_kb(virtualKb, inputs, true);
var vTPinput = new E3D_input_virtual_trackpad(virtualTrackpad , inputs);
var vTSinput = new E3D_input_virtual_thumbstick(virtualThumbStick0, inputs);


log("Session Start", true);
initEngine();



function winResize() {
    winWidth = gl.canvas.clientWidth
    winHeight = gl.canvas.clientHeight;
    
    let vmode = document.forms["moveTypeForm"].moveType.value; 

    if (vmode == "model") {
        scn.camera = new E3D_camera_model("cam1m", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = false;
        inputs.clampPitch = true;
        inputs.allowPan = true;
    } 
    else if (vmode == "free") {
        scn.camera = new E3D_camera_persp("cam1f", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = true;
        inputs.clampPitch = true;
        inputs.allowPan = false;
    } 
    else if (vmode == "space") {
        scn.camera = new E3D_camera_space("cam1s", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = true;
        inputs.clampPitch = false;
        inputs.allowPan = false;
    }
    else {
        scn.camera = new E3D_camera("cam1o", winWidth, winHeight);
    }

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
        scn = new E3D_scene("mainScene", gl, winWidth, winHeight, vec4.fromValues(0.0, 0.0, 0.15, 1.0), 300);

        log("Shader Program Initialization", false);
        scn.program = new E3D_program("mainProgram", gl);
        scn.program.compile(vertShader01, fragShader01);
        scn.program.bindLocations(attribList01, uniformList01);

        log("Lighting Initialization", false);
        scn.lights =  new E3D_lighting(vec3.fromValues(0.0, 0.0, 0.15));
        scn.lights.setColor0(vec3.fromValues(1.0, 1.0, 1.0));
        scn.lights.setDirection0(vec3.fromValues(-0.2, -0.2, -1.0)); 
        scn.lights.light0_lockToCamera = true;

        scn.lights.setColor1(vec3.fromValues(1.0, 1.0, 0.85));
        scn.lights.setDirection1(vec3.fromValues(1.0, -1.0, 0.8));
        scn.lights.light1_lockToCamera = false;

        log("Camera Initialization", false);
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

    } catch (e) {
        log(e, false);

        return; 
    }
     
    resMngr.addRessource("ST.raw", "ST", "Model");
    resMngr.addRessource("AXIS.raw", "Map", "Model");
    resMngr.addRessource("CM.raw", "CM", "Model");
    resMngr.loadAll("models");


    
    l0v = new E3D_entity_vector("light0vect", true, 2.0, true);
    l0v.position = vec3.fromValues(-5, 20, -5);
    l0v.scale = vec3.fromValues(5, 5, 5);
    l0v.visible = true;
    l0v.resetMatrix();
    l0v = scn.addEntity(l0v);
    
    l1v = new E3D_entity_vector("light1vect", true, 2.0, true);
    l1v.position = vec3.fromValues(5, 20, 5);
    l1v.scale = vec3.fromValues(5, 5, 5);
    l1v.visible = true;
    l1v.resetMatrix();
    l1v = scn.addEntity(l1v);

    timer.run();
    scn.state = E3D_ACTIVE;
}


function prepRender() {
    // move camera per inputs
    let yf = (document.forms["moveTypeForm"].invertY.checked) ? -1.0 : 1.0;
    scn.camera.move(inputs.px_smth, -inputs.py_smth, inputs.pz_smth, inputs.ry_smth*yf, inputs.rx_smth, inputs.rz_smth);
    // update some entities per current lights direction
    if (scn.entities.length >= 3) {
        scn.entities[l0v].updateVector(scn.lights.light0_adjusted);
        scn.entities[l1v].updateVector(scn.lights.light1_adjusted);
    }


}

function timerTick() {  // Game Loop

    vTSinput.processInputs("rz", "pz", timer.delta);
    inputs.processInputs(timer.delta);

    updateStatus();

    if (inputs.checkCommand("action0", true)) log("action0", false);
    if (inputs.checkCommand("action1", true)) log("action1", false);

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
            if (name == "ST") {
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 2, vec3.fromValues(1,1,1));
                scn.addEntity(nm);  
                nm.position[2] = -120;
                nm.visible = true;
                nm.resetMatrix();
                if (!cloned) cloneWar();
            } else if (name == "CM") {
                let nm = E3D_loader.loadModel_RAW(name+"_top", resMngr.getRessourcePath(name), resMngr.getData(name), 0, "sweep");
                scn.addEntity(nm);  
                nm.position[1] = -80;
                nm.scale[0] = 3;
                nm.scale[2] = 3;
                nm.resetMatrix();
                nm.visible = true;
                nm = scn.cloneStaticEntity("CM_top", "CM_bottom");
                scn.entities[nm].position[1] = 80;
                scn.entities[nm].scale[0] = 3;
                scn.entities[nm].scale[2] = 3;
                scn.entities[nm].resetMatrix();
                scn.entities[nm].visible = true;

            } else {
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 0, "sweep");
                scn.addEntity(nm);  
                nm.visible = true;
            }

        }  


    } // msg loaded
}


function cloneWar() {
    for (let j = 1; j < 36; ++j) {
        var newGuy = scn.cloneStaticEntity("ST", "ST" + j);
        scn.entities[newGuy].rotation[1] = j * 10 * DegToRad;
        scn.entities[newGuy].position[2] = -120;
        vec3.rotateY(scn.entities[newGuy].position, scn.entities[newGuy].position, vec3_origin, j * 10 * DegToRad );
        scn.entities[newGuy].resetMatrix();
        scn.entities[newGuy].visible = true;
    }
    cloned = true;
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
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + "pY:" + Math.floor(scn.camera.position[1]) + "pZ:" + Math.floor(scn.camera.position[2])+ "rX: " + Math.floor(inputs.rx_sum * RadToDeg) + " rY:"+ Math.floor(inputs.ry_sum * RadToDeg) + "<br />" +
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets;
}



});