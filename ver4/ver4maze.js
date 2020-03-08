// Easy3D_WebGL
// Maze demo game for version 0.4
// Emmanuel Charette 2020

"use strict"

// Stats
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
const span_status = document.getElementById("span_status");
var startTime = 0;

log("Set DOM Events");
window.addEventListener("resize", winResize); // To reset camera matrix
btn_restart.addEventListener("click", restartGame); 
btn_help.addEventListener("click", toggleHelp); 

// Engine Config

const _fieldOfView = 60 * DegToRad;
const _zNear = 0.1;
const _zFar = 600.0;

// Engine State

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
}

function restartGame() {
    ball.position = v3_val_new(20, 50, 64);
    if (animations.length > 0) animations[0].pspd = v3_val_new(0, 0, 0);
    ball.resetMatrix();
    maze.rotation = v3_val_new(0, 0, 0);
    maze.resetMatrix();
    inputs.reset();
    startTime = 0;
    span_time.innerText = "Time: 00:00.00";
    span_time.style.color = "lime";
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

        scn = new E3D_scene("mainScene", gl, gl.canvas.width, gl.canvas.height, [0.6, 0.6, 1.0, 1.0], 200);

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
        scn.camera.moveTo(0, 300, 0, PIdiv2, 0, 0);      
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

        inputs.keyMap.set("action0", E3D_INP_LMB);
        inputs.onInput = onKeyInput;

    } catch (e) {
        log(e, false);

        return; 
    }
     
    resMngr.addRessource("../Models/M1.raw",  "Maze", "Map");
    resMngr.addRessource("../Models/SPH.raw", "Ball", "Entity");
    resMngr.loadAll("Start");

    timer.run();
    //scn.state = E3D_ACTIVE;
}


const pushVect = v3_val_new(0, 10, 0);
const deltaVect = v3_new();
const speed = v3_new();

var lastPos = v3_new();
var rAngle = 0;
var rMat = m4_new();
var qRot = quat.create();
var newRot = quat.create();

function fromQuat(out, q) {
    var x = q[0],
        y = q[1],
        z = q[2],
        w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
  
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
  
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
  
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
  
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
  
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
  
    return out;
  }

  function q4_normalize(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    var len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      out[0] = x * len;
      out[1] = y * len;
      out[2] = z * len;
      out[3] = w * len;
    }
    return out;
  }

function prepRender() {

    // move maze per inputs
    maze.rotateBy([inputs.rx_delta_smth, 0, -inputs.ry_delta_smth]);
    v3_clamp_mod(maze.rotation, -0.3, 0.3);
    maze.resetMatrix();    

    // Run Animations
    //cleanupDoneAnimations(animations, scn);
    collisionDetectionAnimator(animations, scn, 8);


    // create ball rotation effect
    v3_sub_res(pushVect, ball.position, lastPos);
    pushVect[1] = 0;
   // pushVect[0] = -pushVect[0];

    var xAngle = v3_length(pushVect) / -12;
    v3_cross_mod(pushVect, _v3_y);
    v3_normalize_mod(pushVect);

    span_status.innerText = justify("dx", xAngle.toFixed(4), 12) + "\n" + 
    justify("x", pushVect[0].toFixed(4), 12) + "\n" +
    justify("y", pushVect[1].toFixed(4), 12) + "\n" +
    justify("z", pushVect[2].toFixed(4), 12);

    quat.setAxisAngle(newRot, pushVect, xAngle);
    q4_normalize(newRot, newRot);
    quat.multiply(qRot, newRot, qRot);
    q4_normalize(qRot, qRot);
    fromQuat(rMat, qRot);
    //override resetMatrix();
    m4_copy(ball.normalMatrix, rMat);
    m4_copy(ball.modelMatrix, rMat);
    ball.modelMatrix[12] =  ball.position[0];
    ball.modelMatrix[13] =  ball.position[1];
    ball.modelMatrix[14] =  ball.position[2];

    v3_copy(lastPos, ball.position);



    // Timer display
    if (startTime != 0) {
        if (ball.position[1] < -50) {
            startTime = 0;
            span_time.style.color =  "red";
        } else {
            var deltaTime = new Date(Date.now() - startTime);
            span_time.innerText = "Time: " + padStart("" + deltaTime.getMinutes(), "0", 2) + ":" 
                                        + padStart("" + deltaTime.getSeconds(), "0", 2) + ":" 
                                        + padStart(""+Math.floor(deltaTime.getMilliseconds() / 10), "0", 2);
        }
    }
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

function onKeyInput(event) {
    if (event.type == "mouseDown") {
        if ((startTime == 0) && (ball.position[1] >= -90)) startTime = Date.now();
    }
}

function onRessource(name, msg) {
    if (msg == E3D_RES_FAIL) {
        log("Failed to load ressource: " + name, false);        
    }
    if (msg == E3D_RES_ALL) {
        log("All async ressources loaded for tag: " + name, true);       
        resMngr.flushAll();   
        scn.state = E3D_ACTIVE;
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
                maze.position = v3_val_new(-20, 0, 20);
                scn.addEntity(maze);  
            }
        }

        if (resMngr.getRessourceType(name) == "Entity") {
            if (name == "Ball") {
                ball = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0, 1.0, 0.5], [12, 12, 12]);
                ball.pushCD_sph(_v3_origin, 12);
                meshLoader.smoothNormals(-0.5);
                meshLoader.addModelData(ball);
                ball.visible = true;
                ball.position = v3_val_new(20, 50, 64);
                scn.addEntity(ball);  

                animations.push(newBaseAnim(ball, _v3_null, _v3_null, 1.0, -1, true));
                animations[0].sourceCollResolver = collisionResult_asSource_slide;
            }
        }

    } // msg loaded
}








});