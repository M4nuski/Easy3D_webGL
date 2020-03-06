// Easy3D_WebGL
// Main demo program for version 0.4
// Emmanuel Charette 2017-2020

"use strict"

var nHitTest = 0;
var nHits = 0;

var show_DEV_CD = false;
var phyTracers, dev_Hits, dev_CD;
var gAccel = 0;

var timer = { delta : 0, start : Date.now() }; // dummy timer 

var logElement = null;
function log(text, silent = true) {
    let ts = Date.now() - timer.start;
    if (!silent) {
        if (logElement == null) logElement = document.getElementById("logDiv");        
        if (logElement != null) {
            logElement.innerHTML += "[" + ts + "] " + text + "<br />";
            logElement.scrollTop = logElement.scrollHeight - logElement.offsetHeight;
        } 
    }
    console.log("[" + ts + "] " + text);
}

document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");

log("Get DOM Elements");
const GLCanvas = document.getElementById("GLCanvas");
const btn_restart = document.getElementById("btn_restart");
const btn_help = document.getElementById("btn_help");
const span_time = document.getElementById("span_time");
const div_help = document.getElementById("helpDiv");
var startTime = 0;

log("Set DOM Events");
window.addEventListener("resize", winResize); // To reset camera matrix
btn_restart.addEventListener("click", restartGame); 
btn_help.addEventListener("click", toggleHelp); 

// Engine Config

const _fieldOfView = 60 * DegToRad;
const _zNear = 0.1;
const _zFar = 500.0;

// Engine State and stats

var maze, ball; // entities
var animations = [];


// Engine Components

var gl; // webGL canvas rendering context
timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var meshLoader = new E3D_loader();

var inputs = new E3D_input(GLCanvas, true, false, true, false);

log("Session Start", true);
initEngine();

function winResize() {
    gl.canvas.width  = gl.canvas.offsetWidth;
    gl.canvas.height = gl.canvas.offsetHeight;
    
    log("Resize to " + gl.canvas.width + " x " + gl.canvas.height , true);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // TODO keep track of viewport in camera
    scn.camera.resize(gl.canvas.width, gl.canvas.height, _fieldOfView, _zNear, _zFar); 
    scn.camera.updateMatrix();
}

function toggleHelp() {
    div_help.style.display = (div_help.style.display != "table-row") ? "table-row" : "none";
    winResize();
}

function restartGame() {
   
}

function initEngine() {

    log("Context Initialization", false);
    gl = GLCanvas.getContext("webgl");

    if (!gl) {
        log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
        timer.pause();
        return;
    }

    log("Scene Creation", false);
    try {
        gl.canvas.width  = gl.canvas.offsetWidth;
        gl.canvas.height = gl.canvas.offsetHeight;

        scn = new E3D_scene("mainScene", gl, gl.canvas.width, gl.canvas.height, [0.8, 0.8, 0.95, 1.0], 300);

        log("Shader Program Initialization", false);
        scn.program = new E3D_program("mainProgram", gl);
        scn.program.compile(vertShader01, fragShader01);
        scn.program.bindLocations(attribList01, uniformList01);

        log("Lighting Initialization", false);
        scn.lights = new E3D_lighting(v3_val_new(0.0, 0.0, 0.15));
        scn.lights.setColor0(v3_val_new(1.0, 1.0, 1.0));
        scn.lights.setDirection0(v3_val_new(-0.2, -0.2, -1.0)); 
        scn.lights.light0_lockToCamera = true;

        scn.lights.setColor1(v3_val_new(1.0, 1.0, 0.85));
        scn.lights.setDirection1(v3_val_new(1.0, -1.0, 0.8));
        scn.lights.light1_lockToCamera = false;

        log("Camera Initialization", false);

        scn.camera = new E3D_camera_persp("TopCam", gl.canvas.width, gl.canvas.height, _fieldOfView, _zNear, _zFar);   
        scn.camera.moveTo(0, 400, 0, PIdiv2, 0, 0);      
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

    } catch (e) {
        log(e, false);

        return; 
    }
     
    resMngr.addRessource("../Models/M1.raw", "Maze", "Map");
    resMngr.loadAll("Map");

    timer.run();
    scn.state = E3D_ACTIVE;

    ball = new E3D_entity_wireframe_canvas("wireSphereTest");
    ball.addWireSphere([0, 200, 0], 16, [1, 1, 0], 32, true, 8);
    ball.visible = true;
    scn.addEntity(ball);
}


function prepRender() {
    // move maze per inputs
    maze.rotateBy([inputs.rx_delta_smth, 0, -inputs.ry_delta_smth]);
    v3_clamp_mod(maze.rotation, -0.3, 0.3);
    maze.resetMatrix();

    // Run Animations
    //cleanupDoneAnimations(animations, scn);
    //collisionDetectionAnimator(animations, scn, 10);
}

function timerTick() {  // Game Loop

    inputs.processInputs(timer.delta);
    inputs.smoothRotation(1);
    inputs.smoothPosition(1);

    // Render
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

        if (resMngr.getRessourceType(name) == "Map") {
            if (name == "Maze") {
                maze = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), _v3_white, [2, 2, 2]);
                meshLoader.addCDFromData(maze);
                meshLoader.addStrokeData(maze);
                meshLoader.addModelData(maze);
                maze.visible = true;
                scn.addEntity(maze);  
            }
        }

        if (resMngr.getRessourceType(name) == "Entity") {
            if (name == "Ball") {
                ball = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name));
                ball.pushCD_sph(_v3_origin, 16);
                meshLoader.addModelData(ball);
                ball.visible = true;
                scn.addEntity(ball);  
            }
        }

    } // msg loaded
}








});