// Easy3D_WebGL
// Main demo program for full screen and pointer lock
// Emmanuel Charette 2017-2020

"use strict"


var nHitTest = 0;
var nHits = 0;

var show_DEV_CD = false;
var phyTracers;
var gAccel = 0;
var timer = { delta : 0, start : 0 }; // dummy timer 

var logElement = null;

function log(text, silent = true) {
    let ts = 0;
    try {
        ts = Date.now() - timer.start;
    } catch (e) {
        // timer was not yet defined
        ts = "=";
    } 
    //console.log("E3D[" + ts + "] " + text);
    if (!silent) {
        if (logElement == null) logElement = document.getElementById("logDiv");        
        if (logElement == null) {
            logElement.innerHTML += "[" + ts + "] " + text + "<br />";
            logElement.scrollTop = logElement.scrollHeight - logElement.offsetHeight;
        } else {
            console.log("E3D[" + ts + "] " + text);
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");

log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const status = document.getElementById("statusDiv");
const mainDiv = document.getElementById("mainDiv");

log("Set DOM Events");
window.addEventListener("resize", winResize); // To reset camera matrix

document.forms["moveTypeForm"].addEventListener("change", camChange); // To update camera matrix
document.forms["moveTypeForm"].invertY.addEventListener("keydown", (e) => {e.preventDefault(); });
document.forms["displayForm"].CDP.addEventListener("keydown", (e) => {e.preventDefault(); });
/*
// Try to figure out which of desktop or mobile control scheme should be used
document.body.addEventListener("mousemove", callBackMouse);
document.body.addEventListener("touchStart", callBackTouch);
document.body.removeEventListener

function callBackMouse() {
    console.log("Probably Desktop");
    document.body.removeEventListener("mousemove", callBackMouse);
    document.body.addEventListener("touchStart", callBackTouch);
}

function callBackTouch() {
    console.log("Probably Mobile");
    document.body.removeEventListener("mousemove", callBackTouch);
    document.body.addEventListener("touchStart", callBackMouse);
}
*/
document.getElementById("screenSizeDiv").addEventListener("click", () => { fullscreenToggle(mainDiv); hover2CollapseAll(); } );
document.getElementById("pointerLockImg").addEventListener("click", () => { pLockToggle(can); hover2CollapseAll(); } );
pLockCallback = function(event) {
    log(event, true);

    // remap controls
    if (event == "lock") {
        inputs.pointerMap.set("rx_btn", E3D_INP_ALWAYS);
        inputs.pointerMap.set("ry_btn", E3D_INP_ALWAYS);
        inputs.keyMap.set("action0", E3D_INP_LMB);

    } else if ((event == "unlock") || (event == "error")) {
        inputs.pointerMap.set("rx_btn", E3D_INP_LMB);
        inputs.pointerMap.set("ry_btn", E3D_INP_LMB);
        inputs.keyMap.set("action0", E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_LMB);
    }
}
fullscreenChangeCallback = function fullscreenChange(active, elem) {
    if (active) {
        document.getElementById("screenSizeImgFS").style.display = "none";
        document.getElementById("screenSizeImgWS").style.display = "inline-block";
    } else {

        document.getElementById("screenSizeImgFS").style.display = "inline-block";
        document.getElementById("screenSizeImgWS").style.display = "none";
        if (pLockRequested) {
            pLockRequest(mainDiv); // Restore pointerLock 
            hover2CollapseAll();
        }
    }
}

// Engine Config

const _fieldOfView = 45 * DegToRad;
const _zNear = 0.1;
const _zFar = 500.0;

// Engine State and stats

var winWidth = 10, winHeight = 10;
var usepct_smth = 0; //usage pct smoothed value
var l0v, l1v;// light vector entities 
var testSph, splos, planes, cubes, dev_CD, targetVector; // entities
var cloned = false;
var animations = [];
var nHitTest = 0;

// Engine Components

var gl; // webGL canvas rendering context
timer = new E3D_timing(false, 50, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var meshLoader = new E3D_loader();

var inputs = new E3D_input(can, true, true, false, true);// don't support touch in main element, touch handling is done in virtual TS and TP
inputs.onInput = onEngineInput;

// virtual dual sticks
var vTSinputLeft = new E3D_input_virtual_thumbstick(document.getElementById("thumb1Left"), inputs, "", "action0");
vTSinputLeft.Xspeed = inputs._rotSpeed;
vTSinputLeft.Yspeed = inputs._posSpeed; //pz
var vTSinputRight = new E3D_input_virtual_thumbstick(document.getElementById("thumb1Right"), inputs, "", "action1");
vTSinputRight.Xspeed = inputs._rotSpeed;
vTSinputRight.Yspeed = inputs._rotSpeed;

log("Session Start", false);

initEngine();

log("Engine Initialized", false);


// Status information

function updateStatus() {
    usepct_smth = timer.smooth(usepct_smth, timer.usage, 3);
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + " pY:" + Math.floor(scn.camera.position[1]) + " pZ:" + Math.floor(scn.camera.position[2])+ " rX: " + Math.floor(inputs.rx * RadToDeg) + " rY:"+ Math.floor(inputs.ry * RadToDeg) + "<br />" +
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets + "<br />"+
    "nAnims: " + animations.length + " nHitTests: " + nHitTest;
}


function winResize() {
    gl.canvas.width  = gl.canvas.offsetWidth;
    gl.canvas.height = gl.canvas.offsetHeight;

    winWidth = gl.canvas.offsetWidth;
    winHeight = gl.canvas.offsetHeight;

    gl.viewport(0, 0, winWidth, winHeight);

    log("Resize to " + winWidth + " x " + winHeight, false);
   
    let vmode = document.forms["moveTypeForm"].moveType.value; 

    if (vmode == "model") {
        scn.camera.resize(winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    } 
    else if (vmode == "free") {
        scn.camera.resize(winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    } 
    else if (vmode == "space") {
        scn.camera.resize(winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    }
    else {
        scn.camera.resize(winWidth, winHeight) 
    }


    vTSinputLeft.onResize();
    vTSinputRight.onResize();
}


function camChange() {

    let vmode = document.forms["moveTypeForm"].moveType.value; 

    if (vmode == "model") {
        scn.camera = new E3D_camera_model("cam1m", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = false;
    } 
    else if (vmode == "free") {
        scn.camera = new E3D_camera_persp("cam1f", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = true;
    } 
    else if (vmode == "space") {
        scn.camera = new E3D_camera_space("cam1s", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = true;
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
        scn = new E3D_scene("mainScene", gl, winWidth, winHeight, [0.0, 0.0, 0.25, 1.0], 400);

        log("Shader Program Initialization", false);
        scn.program = new E3D_program("mainProgram", gl);
        scn.program.compile(vertShader01, fragShader01);
        scn.program.bindLocations(attribList01, uniformList01);

        log("Lighting Initialization", false);
        scn.lights =  new E3D_lighting(v3_val_new(0.0, 0.0, 0.15));
        scn.lights.setColor0(v3_val_new(1.0, 1.0, 1.0));
        scn.lights.setDirection0(v3_val_new(-0.2, -0.2, -1.0)); 
        scn.lights.light0_lockToCamera = true;

        scn.lights.setColor1(v3_val_new(1.0, 1.0, 0.85));
        scn.lights.setDirection1(v3_val_new(1.0, -1.0, 0.8));
        scn.lights.light1_lockToCamera = false;

        log("Camera Initialization", false);
        camChange();
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

    } catch (e) {
        log(e, false);

        return; 
    }
    
        inputs.keyMap.set("rx_dec", "null");
        inputs.keyMap.set("rx_inc", "null");
        inputs.keyMap.set("ry_dec", "null");
        inputs.keyMap.set("ry_inc", "null");
        inputs.keyMap.set("rz_dec", "KeyQ");
        inputs.keyMap.set("rz_inc", "KeyE");
        inputs.pointerMap.set("px_btn", E3D_INP_DISABLED);
        inputs.pointerMap.set("py_btn", E3D_INP_DISABLED);
        inputs.pointerMap.set("pz_btn", E3D_INP_DISABLED);
        inputs.pointerMap.set("rz_btn", E3D_INP_DISABLED);

        inputs.keyMap.set("togglePointerlock", "ControlRight");
        inputs.keyMap.set("toggleFullscreen", "F11");

        pLockCallback("unlock"); // preset controls mapping
     
    resMngr.addRessource("../Models/ST.raw", "ST", "Model");
    resMngr.addRessource("../Models/AXIS.raw", "Map", "Model");
    resMngr.addRessource("../Models/CM.raw", "CM", "Model");
    resMngr.addRessource("../Models/SPH.raw", "sph", "Model");
    resMngr.addRessource("../Models/PYRA.raw", "pyra", "Model");
    resMngr.loadAll("models");
    
    l0v = new E3D_entity_axis("light0vect", true, 10.0, true);
    l0v.position = v3_val_new(-5, 20, -5);
    l0v.visible = true;
    l0v.vis_culling = false;

    scn.addEntity(l0v);
    
    l1v = new E3D_entity_axis("light1vect", true, 10.0, true);
    l1v.position = v3_val_new(5, 20, 5);
    l1v.visible = true;
    l1v.vis_culling = false;

    scn.addEntity(l1v);

    testSph = new E3D_entity_wireframe_canvas("wireSphereTest");
    testSph.addWireSphere([30,0,0], 20, [1,0,0], 24, true);
    testSph.addWireSphere([0,30,0], 20, [0,1,0], 24, true);
    testSph.addWireSphere([0,0,30], 20, [0,0,1], 24, true);
    testSph.visible = true;
    scn.addEntity(testSph);

    splos = new E3D_entity_wireframe_canvas("splosions");
    splos.visible = true;
    splos.arrayIncrement = 2048; 
    splos.vis_culling = false;
    scn.addEntity(splos);

    planes = new E3D_entity_wireframe_canvas("infinitePlanes");
    planes.addPlane([   0,   0, -100], [0, 0, 0], 50, 50, 4, [1,1,0], true, false);
    planes.addPlane([   0, 300,    0], [PIdiv2, 0, 0], 450, 450, 20, [0,1,0], true, false);
    planes.addPlane([ 225, 300, -225], [0, PIdiv2, 0], 250, 250, 11, [0,1,1], true, false);
    planes.addPlane([-150,  80,  150], [0, -PIdiv2/2, -PIdiv2/2], 300, 300, 15, [1,1,1], true, false);
    planes.addPlane([ 0,   0, 50], [0, 0, 0], 20, 20, -1, [1,0,0], false, true);
    planes.addPlane([50, -20, 25], [0, PIdiv2, 0], 10, 40, -1, [0,1,0], false, true);
    planes.addPlane([25,  20, 25], [PIdiv2/2, PIdiv2, PIdiv2/2], 30, 30, 2, [0.5,0.5,0.5], false, true);
    planes.visible = true;
    scn.addEntity(planes);

    targetVector = new E3D_entity_wireframe_canvas("vectorHitTest");
    targetVector.position = [25, 25, 25];
    targetVector.addLine([0, 0, 0], [0, 100, 0], false, [1,1,1]);
    targetVector.pushCD_edge([0, 0, 0], [0, 100, 0]);
    targetVector.visible = true;
    scn.addEntity(targetVector);


    cubes = new E3D_entity_wireframe_canvas("cubesTest");
    cubes.position = [0, 50, -50];
    cubes.addWireCube([0, -50, 0], [0,0,0], [15, 15, 15], [1,0,0], true, false, false );
    cubes.addWireCube([0, -25, 0], [0,0,0], [10, 10, 10], [0,1,0], true, true, false );
    cubes.addWireCube([0, 0, 0], [0,0,0], [5, 5, 5], [0,0,1], true, false, true );
    cubes.addWireCube([0, 25, 0], [0,0,0], [10, 10, 10], [1,0,1], true, true, true );
    cubes.visible = true;
    scn.addEntity(cubes);

    dev_CD = new E3D_entity_wireframe_canvas("DEV/CD_Display");

    dev_CD.visible = true;
    dev_CD.vis_culling = false;
    scn.addEntity(dev_CD);

    E3D_G = 32;
    timer.run();
    scn.state = E3D_ACTIVE;
}


function prepRender() {

    // move camera per inputs
    let yf = (document.forms["moveTypeForm"].invertY.checked) ? -1.0 : 1.0;
    scn.camera.moveBy(-inputs.px_delta_smth,    inputs.py_delta_smth, inputs.pz_delta_smth, 
                       inputs.rx_delta_smth*yf, inputs.ry_delta_smth, inputs.rz_delta_smth);

    // update some entities per current lights direction
    if (scn.entities.length >= 3) {
        l0v.updateVector(scn.lights.light0_adjusted);
        l1v.updateVector(scn.lights.light1_adjusted);
    }

    // Animations
    cleanupDoneAnimations(animations, scn);
    collisionDetectionAnimator(animations, scn, 10);

    // DEV CD display
    if (document.forms["displayForm"].CDP.checked) {
        dev_CD.numElements = 0;
        for (let i = 0; i < scn.entities.length; ++i) {
            if (scn.entities[i].vis_culling) dev_CD.addWireSphere(scn.entities[i].position,scn.entities[i].cull_dist * 2, [1,0.5,0], 24, false);
        }
        dev_CD.visible = true;
    } else {
        dev_CD.visible = false;
    }

}


function onEngineInput() { // preprocess inputs out of game loop

    if (inputs.checkCommand("togglePointerlock", true)) {
        pLockToggle(can);
        hover2CollapseAll();
    }

    if (inputs.checkCommand("toggleFullscreen", true)) {
        let pla = pLockActive();
        fullscreenToggle(mainDiv);
        if (pla) {
            pLockRequest(can);
            hover2CollapseAll();
        }
    }

}


function timerTick() {  // Game Loop
    
    vTSinputRight.processInputs("ry_offset", "rx_offset");
    vTSinputLeft.processInputs("rz_offset", "pz_offset");

    inputs.processInputs(timer.delta);

    inputs.smoothRotation(6);
    inputs.smoothPosition(6);

    updateStatus();
    nHitTest = 0;

    if (inputs.checkCommand("action0", true)) {
        let newSph = scn.cloneEntity("sph", "sph" + timer.lastTick);
        newSph.position[1] = 5;
        newSph.rotation[0] = rndPM(PIx2);
        newSph.rotation[1] = rndPM(PIx2);

        animations.push(newBaseAnim_RelativeToCamera(newSph, scn.camera,
             [rndPM(1), rndPM(1), rndPM(1) -100], _v3_null, 1.0, 10, true));

        animations[animations.length-1].target.animIndex = animations.length-1;
        animations[animations.length-1].group = "splodable";     
    }
    if (inputs.checkCommand("action1", true)) {
        let newPyra = new E3D_entity_dynamicCopy("shotgun " + timer.lastTick, scn.entities[scn.getEntityIndexFromId("pyra")]);  
        newPyra.moveTo([10, -10, 0]); // originate from bottom right corner of view

        animations.push(newParticuleAnim_RelativeToCamera(newPyra, scn.camera,
            [rndPM(2), rndPM(2), -150 - rndPM(2) ], _v3_null, 10, 
            shotgunPartPos, shotgunPartDir, 0.2, 2.0, true));
        animations[animations.length-1].target.animIndex = animations.length-1;
        animations[animations.length-1].animLastPass = collisionResult_lastPass_splode;

        newPyra.visible = true;
        scn.addEntity(newPyra); 
    }
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
                let nm = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name));
                meshLoader.smoothNormals(0.0);
                meshLoader.addModelData(nm);

                nm.position[2] = -120;
                nm.visible = true;

                animations.push(newTransformAnim(nm, _v3_null, [0, 1, 0]));

                scn.addEntity(nm);  

                if (!cloned) cloneWar();

            } else if (name == "CM") {
                let nm = new E3D_entity(name+"_top", "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), "sweep", v3_val_new(5, 1, 5));
                meshLoader.addModelData(nm);

                nm.position[1] = -120;
                nm.visible = true;
                scn.addEntity(nm);  

                nm = scn.cloneEntity("CM_top", "CM_bottom");
                nm.position[1] = 120;

                nm.visible = true;
                nm.resetMatrix();

            } else if (name == "sph") {
                let nm = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0, 1.0, 0.5]);
                meshLoader.smoothNormals(0.0);
                meshLoader.addModelData(nm);

                nm.pushCD_sph(_v3_origin, 0.5);
                scn.addEntity(nm);               

            } else if (name == "pyra") {
                let nm = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0,0.8,0.0]);
                meshLoader.removeNormals();
                meshLoader.addModelData(nm);

                scn.addEntity(nm);   
            } else {
                let nm = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), "sweep");
                meshLoader.addModelData(nm);
                
                scn.addEntity(nm);  
                nm.visible = true;
                nm.pushCD_sph(_v3_origin, 7.0);
            }

        }  


    } // msg loaded
}


function cloneWar() {
    for (let j = 1; j < 36; ++j) {
        var newGuy = scn.cloneEntity("ST", "ST" + j);
        newGuy.rotation[1] = j * 10 * DegToRad;
        newGuy.position[2] = -120;
        v3_rotateY_mod(newGuy.position, _v3_origin, j * 10 * DegToRad );
        newGuy.resetMatrix();
        newGuy.visible = true;
    }
    cloned = true;
}


// animator functions

// Returns the starting positions of the shotgun's pellet particules
function shotgunPartPos(n, nbPart) {
    return [rndPM(5), rndPM(5), rndPM(2)];    
}

// Returns the direction of the shotgun pellets
function shotgunPartDir(pos, n, nbPart) {
    return v3_scale_new(pos, 0.01);
}

//animLastPass override, when a shotgun pellet hit a ball, remove the ball and create an explosion
function collisionResult_lastPass_splode() {
    for (var hitIndex = 0; hitIndex < this.colNum; ++hitIndex) {
        this.pActive[this.closestCollision[hitIndex].source_cdi] = false;
        var ent = scn.entities[this.closestCollision[hitIndex].target_ei];
        var anim = animations[ent.animIndex];

        if ((ent.animIndex != -1) && (anim.group == "splodable")) { 

            anim.state = E3D_DONE; // remove animation

            var col = [ [1,0,0], [1,1,0] ,[0,1,0] ,[0,1,1] ,[0,0,1], [1,0,1] ]; // color sweep
            var nvect = 18;
            var iter = 20;
            var dim = 0.1;
            var dvect = Array(nvect);
            var vect = Array(nvect);
            var location = v3_new();
            splos.increaseSize(6 * 18 * 20);
            for (i = 0; i < nvect; ++i) {
                vect[i] = [rndPM(10), rndPM(10), rndPM(10)] ;
                dvect[i] = [rndPM(10), 5+rndPM(10), rndPM(10)] ;
            }
            var colorIndex = 0;
            for (var i = 0; i < iter; ++i) {
                var s = 2 - (dim * i);
                for (var j=0; j < nvect; ++j) {

                    v3_add_res(location, this.closestCollision[hitIndex].p0, vect[j]);
                    splos.addWireCross(location, s, col[colorIndex]);
        
                    colorIndex++;
                    if (colorIndex >= col.length) colorIndex = 0;
                }
                for (var j = 0; j < nvect; ++j) {
                    vect[j][0] += dvect[j][0];
                    vect[j][1] += dvect[j][1];
                    vect[j][2] += dvect[j][2];
                    dvect[j][0] *= 0.9; // falloff
                    dvect[j][1] -= 1; // "gravity"
                    dvect[j][2] *= 0.9;  // falloff
                    
                }
            }


        }
        
    }

    anim_Base_endPass_ttl.call(this); // call default
 }





});