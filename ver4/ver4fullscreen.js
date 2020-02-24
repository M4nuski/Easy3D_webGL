// Easy3D_WebGL
// Main demo program for full screen and pointer lock
// Emmanuel Charette 2017-2019

"use strict"

document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");

log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const logElement = document.getElementById("logDiv");
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
var testSph, splos, iplanes, fplanes, cubes, dev_CD, targetVector; // entities
var cloned = false;
var animations = [];
var nHitTest = 0;

// Engine Components

var gl; // webGL canvas rendering context
var timer = new E3D_timing(false, 50, timerTick);
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
    //l0v.scale = v3_val_new(5, 5, 5);
    l0v.visible = true;
    l0v.vis_culling = false;

    scn.addEntity(l0v);
    
    l1v = new E3D_entity_axis("light1vect", true, 10.0, true);
    l1v.position = v3_val_new(5, 20, 5);
    //l1v.scale = v3_val_new(5, 5, 5);
    l1v.visible = true;
    l1v.vis_culling = false;

    scn.addEntity(l1v);

    testSph = new E3D_entity_wireframe_canvas("wireSphereTest");
    testSph.addWireSphere([30,0,0], 20, [1,0,0], 24, true);
    testSph.addWireSphere([0,30,0], 20, [0,1,0], 24, true);
    testSph.addWireSphere([0,0,30], 20, [0,0,1], 24, true);
    testSph.visible = true;
    //testSph.cull_dist2 = 2500;
    scn.addEntity(testSph);

    splos = new E3D_entity_wireframe_canvas("splosions");
    splos.visible = true;
    splos.arrayIncrement = 2700; 
    splos.vis_culling = false;
    scn.addEntity(splos);

    iplanes = new E3D_entity_wireframe_canvas("infinitePlanes");
    iplanes.addPlane([0, 0, -100], [0, 0, 0], 50, 50, 4, [1,1,0], true, false);
    iplanes.addPlane([0, 300, 0], [PIdiv2, 0, 0], 450, 450, 20, [0,1,0], true, false);
    iplanes.addPlane([225, 300, -225], [0, PIdiv2, 0], 250, 250, 11, [0,1,1], true, false);
    iplanes.addPlane([-150, 80, 150], [0, -PIdiv2/2, -PIdiv2/2], 300, 300, 15, [1,1,1], true, false);
    iplanes.visible = true;
    iplanes.vis_culling = false;
    scn.addEntity(iplanes);

    fplanes = new E3D_entity_wireframe_canvas("finitePlanes");
    fplanes.position = [25, -10, 25];
    fplanes.addPlane([-25, 10, 25], [0, 0, 0], 20, 20, -1, [1,0,0], false, true);
    fplanes.addPlane([25, -10, 0], [0, PIdiv2, 0], 10, 40, -1, [0,1,0], false, true);
    fplanes.addPlane([0, 30, 0], [PIdiv2/2, PIdiv2, PIdiv2/2], 30, 30, 2, [0.5,0.5,0.5], false, true);
    fplanes.visible = true;
    //fplanes.cull_dist2 = 4200;
    scn.addEntity(fplanes);

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
    //cubes.cull_dist2 = 4200;
    scn.addEntity(cubes);

    dev_CD = new E3D_entity_wireframe_canvas("DEV/CD_Display");

    dev_CD.visible = true;
    dev_CD.vis_culling = false;
    scn.addEntity(dev_CD);

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

    // Cleanup
    for (let i = animations.length -1; i >=0; --i) {
        if (animations[i].state == E3D_DONE) {
            scn.removeEntity(animations[i].target.id, false);
            animations.splice(i, 1);
        } 
    }
    
    // Animate / Calculate Expected target position and state
    // target orig, delta, dR2
    for (let i = 0; i < animations.length; ++i) animations[i].animateFirstPass(); //if supported calculate next position but don't lock

    for (let i = 0; i < animations.length; ++i) { // animations are source
        if (animations[i].delta2  > -1) for (let j = 0 ; j < scn.entities.length; ++j) { // all entities are targets
            if ((scn.entities[j].collisionDetection) && (animations[i].target.id != scn.entities[j].id) ) { 
                var deltaP = v3_distance( animations[i].target.position, scn.entities[j].position);
                var deltaD = animations[i].delta2 + animations[i].target.cull_dist + scn.entities[j].cull_dist; 
                animations[i].candidates[j] = (scn.entities[j].CD_iPlane > 0) || ( deltaP  <= deltaD );  
            } else animations[i].candidates[j] = false;
        }
        animations[i].animateRePass();
    }

    // Post
    for (let i = 0; i < animations.length; ++i) animations[i].animateLastPass();



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
      //  console.log("action0", true);
        let newSph = scn.cloneEntity("sph", "sph" + timer.lastTick);
        animations.push(new E3D_animation("ball throw" + timer.lastTick, newSph, scn, timer, sphAnimF, sphAnimR, sphAnimL));
        animations[animations.length-1].restart();
    }
    if (inputs.checkCommand("action1", true)) {
      //  console.log("action1", true);      
        let newPyra = new E3D_entity_dynamicCopy("shotgun " + timer.lastTick, scn.entities[scn.getEntityIndexFromId("pyra")]);          
        animations.push(new E3D_animation("shotgun " + timer.lastTick, newPyra, scn, timer, shotgunAnimF, shotgunAnimR, shotgunAnimL));
        animations[animations.length-1].restart();
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
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), _v3_white, _v3_unit);
                meshLoader.smoothNormals(0.0);
                meshLoader.addModelData(nm);

                nm.position[2] = -120;
                nm.visible = true;
                
                animations.push(new E3D_animation("ST rotate", nm, scn, timer, rot0));
                animations[animations.length-1].play();
                
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
function sphAnimF(){
    if (this.state == E3D_RESTART) {
        v3_copy(this.target.position, scn.camera.position);
        this.target.position[1] += 5;
        this.target.rotation[0] = rndPM(PIx2);
        this.target.rotation[1] = rndPM(PIx2);

        this.spd = scn.camera.adjustToCamera(v3_scale_new(_v3_nz, 100));
        this.spd[0] += rndPM(1);
        this.spd[1] += rndPM(1);
        this.spd[2] += rndPM(1);
        this.ttl = 30;
        
        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.resetMatrix();
        this.last_position = this.target.position.slice();
    } else {
        this.last_position = this.target.position.slice();
        var dlt = v3_scale_new(this.spd, timer.delta);
        v3_add_mod(this.target.position, dlt);
        this.delta2 = v3_length(dlt);
    }
}
function sphAnimL() {
    this.spd[1] -= timer.delta * 9.81; // or whatever is G in this scale and projection
    this.ttl -= timer.delta;

    if (this.ttl < 0) {
        this.state = E3D_DONE;
        this.target.visible = false;

    } 
}
function sphAnimR() {

    if (this.state == E3D_PLAY) {

        this.target.resetMatrix();  // update CD data  
        splos.addLine(this.last_position, this.target.position, true);
        var colList = [] ; // array of [entIdx, cdIdx, penetration, srcType, trgtType, normal]
            // for each other entity
            for (let i = 0; i < scn.entities.length; ++i ) if (this.candidates[i]) {
                if (scn.entities[i].CD_sph > 0) {  // collision detection - this.sph to other sph  

                    for (let j = 0; j < scn.entities[i].CD_sph; ++j) {
                        nHitTest++;
                        var d = v3_distancesquared(scn.entities[i].CD_sph_p[j], this.target.CD_sph_p[0]);
                        var minD = this.target.CD_sph_rs[0] + scn.entities[i].CD_sph_rs[j];
                        if (d <= minD) {
                        //  log("hit sph-sph: " + this.target.id + " - " + scn.entities[i].id);
                            var penetration = Math.sqrt(minD) - Math.sqrt(d);
                            var n = [this.target.CD_sph_p[0][0] - scn.entities[i].CD_sph_p[j][0], this.target.CD_sph_p[0][1] - scn.entities[i].CD_sph_p[j][1], this.target.CD_sph_p[0][2] - scn.entities[i].CD_sph_p[j][2] ];
                            //colList.push([i, j, penetration, "sph", "sph", n]);
                              splos.moveCursorTo(this.target.position);
                            v3_reflect_mod(this.spd, n);
                            v3_scale_mod(this.spd, 0.8);
                            v3_addscaled_mod(this.target.position, n, penetration);
                            this.target.resetMatrix();
                              splos.addLineTo(this.target.position, false);
                        }
                    }
                } // sph

                if (scn.entities[i].CD_iPlane > 0) {  // collision detection - this.sph to infinite plane
                    var v = v3_sub_new(this.target.CD_sph_p[0], scn.entities[i].position);
                    var last_v = v3_sub_new(this.last_position, scn.entities[i].position);

                    for (let j = 0; j < scn.entities[i].CD_iPlane; ++j) {
                        nHitTest++;

                        var dist = v3_dot(v, scn.entities[i].CD_iPlane_n[j]) - scn.entities[i].CD_iPlane_d[j] ;
                        var last_Dist = v3_dot(last_v, scn.entities[i].CD_iPlane_n[j]) - scn.entities[i].CD_iPlane_d[j];
                                        
                        var sgn = (dist > 0) ? 1 : -1;
                        dist = Math.abs(dist) ;

                        var last_sgn = (last_Dist > 0) ? 1 : -1;
                        last_Dist = Math.abs(last_Dist) ;
                    
                        if ( dist < this.target.CD_sph_r[0]) { 
                        //    log("hit sph-iPlane: " + this.target.id + " - " + scn.entities[i].id);
                            var penetration = (sgn == last_sgn) ? (this.target.CD_sph_r[0] - dist) : (this.target.CD_sph_r[0] + dist);
                            penetration *= last_sgn;
                          //  colList.push([i, j, penetration, "sph", "iPlane", scn.entities[i].CD_iPlane_n[j]])
                              splos.moveCursorTo(this.target.position);
                            v3_reflect_mod(this.spd, scn.entities[i].CD_iPlane_n[j]);
                            v3_scale_mod(this.spd, 0.8);
                            v3_addscaled_mod(this.target.position, scn.entities[i].CD_iPlane_n[j], penetration);
                            this.target.resetMatrix();
                              splos.addLineTo(this.target.position, false);

                        } else { // if sph itself didn't hit plane, test for vector from last position to this one
                            dist *= sgn;
                            last_Dist *= last_sgn;
                            if ( ( (dist > 0) && (last_Dist < 0) ) || ( (dist < 0) && (last_Dist > 0) ) ) {
                            //  log("hit sph(vect)-iPlane: " + this.target.id + " - " + scn.entities[i].id);
                                var penetration = ( Math.abs(last_Dist) +  Math.abs(dist)) * last_sgn;
                                colList.push([i, j, penetration, "sph/vect", "iPlane", scn.entities[i].CD_iPlane_n[j]])
                            }
        
                        }
                    }         
                } // iplane

                if (scn.entities[i].CD_edge > 0) {  // collision detection - this.sph to edge vector  

                    for (let j = 0; j < scn.entities[i].CD_edge; ++j) {
                        nHitTest++;

                        // subtract (out, a, b);// out = a - b
                        var so = v3_sub_new(this.target.CD_sph_p[0], scn.entities[i].CD_edge_p[j]);
                        var t = SphEdgeHit(scn.entities[i].CD_edge_v[j], so, this.target.CD_sph_rs[0]);                    
                        if (t != false) colList.push( [i, j, t, "sph", "edge", v3_normalize_new(scn.entities[i].CD_edge_v[j]) ] );    
                       // var d = v3_distancesquared(scn.entities[i].CD_sph_p[j], this.target.CD_sph_p[0]);
                       // var minD = this.target.CD_sph_rs[0] + scn.entities[i].CD_sph_rs[j];
                     /*   if (d <= minD) {
                        //  log("hit sph-sph: " + this.target.id + " - " + scn.entities[i].id);
                            var penetration = Math.sqrt(minD) - Math.sqrt(d);
                            var n = [this.target.CD_sph_p[0][0] - scn.entities[i].CD_sph_p[j][0], this.target.CD_sph_p[0][1] - scn.entities[i].CD_sph_p[j][1], this.target.CD_sph_p[0][2] - scn.entities[i].CD_sph_p[j][2] ];
                            //colList.push([i, j, penetration, "sph", "sph", n]);
                              splos.moveCursorTo(this.target.position);
                            v3reflect_mod(this.spd, n);
                            v3_addscaled_mod(this.target.position, n, penetration);
                            this.target.resetMatrix();
                              splos.addLineTo(this.target.position, false);
                        }*/
                    } // target edges

                } // edge CD


            } // end for each other entity perform hit test

            // Go trough colList and resolve CD for vect
            if (colList.length > 0) {
                  splos.moveCursorTo(this.target.position);
                colList.sort((a, b) => { return b[2] - a[2]; } );
                v3_reflect_mod(this.spd, colList[0][5]);
                v3_addscaled_mod(this.target.position, colList[0][5], colList[0][2]);
                this.target.resetMatrix();
                  splos.addLineTo(this.target.position, false);
            }


    }   // end state == PLAY
}

function rot0() {
    if (this.state == E3D_PLAY) {
        this.target.rotation[1] += timer.delta;
        this.target.resetMatrix();
    }  
}

function shotgunAnimF() {
    if (this.state == E3D_RESTART) {
        v3_copy(this.target.position, scn.camera.position);        
        v3_add_mod(this.target.position, scn.camera.adjustToCamera([10, -10, 0])); // originate from bottom right corner of view

        this.vertOffset = Array(this.numPellets); // vect noise for vertex
        this.vect = Array(this.numPellets); // mainVect + vect noise
        this.vectNorm = Array(this.numPellets); //opt normalized vect for CD
        this.org = Array(this.numPellets); // each pass org = org + vect, world coordinates

        this.ttl = 2.0;
        this.act = Array(this.numPellets); // active

        this.mainVector = scn.camera.adjustToCamera([ rndPM(2), rndPM(2), -500 - rndPM(2) ] );         

        this.target.setSize(this.target.srcNumElements * this.numPellets);

        for (let i = 0; i < this.numPellets; ++i) {
            //new pellet
            this.target.copySource(this.target.srcNumElements * i);
            this.act[i] = true;
            
            //pellet vector
            this.vertOffset[i] = scn.camera.adjustToCamera([rndPM(10), rndPM(10), rndPM(3) ]); // some noise
            this.org[i] = v3_add_new(this.target.position, this.vertOffset[i]); // starting point is on noise.

            this.vect[i] = v3_add_new(this.vertOffset[i], this.mainVector); 
            this.vectNorm[i] = v3_normalize_new(this.vect[i] );

            //offset pelets vertex by new origin and invalidate normal
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var idx = (i*this.target.srcNumElements) + j;
                var b = this.target.getVertex3f(idx);
                v3_add_mod(b, this.vertOffset[i]);
                this.target.setNormal3f(idx, _v3_origin);
            }
        }

        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.vis_culling = true; // for now, to see vis and CD sphere
        scn.addEntity(this.target);
        
    } 
}
function shotgunAnimL() { 

    this.ttl -= timer.delta;

    if (this.ttl  <= 0) {
        this.state = E3D_DONE;
        this.target.visible = false;
    } else {
        this.last_position = this.target.position.slice();
        this.delta_position = v3_scale_new(this.mainVector, timer.delta);
        v3_add_mod(this.target.position, this.delta_position);
        this.delta2 = v3_length(this.delta_position);

        this.target.resetMatrix();
        this.target.cull_dist = 30;// override calculated cull dist
    }  

}
function shotgunAnimR() {

    if (this.state == E3D_PLAY) {

        for (let i = 0; i < this.numPellets; ++i) if (this.act[i]) { // i is pallet index

            // translate pellet entity elements
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var b = this.target.getVertex3f((i*this.target.srcNumElements) + j); // b is a view in float32array
                v3_addscaled_mod(b, this.vertOffset[i], timer.delta);
            }

            // current tranlation vector, world coordinates
            var vd = v3_scale_new(this.vect[i], timer.delta); // vector delta
            var so = v3_new(); // sphere origin
            var v1 = v3_add_new(this.org[i], vd); // vector end
   
            var colList = [] ; // array of [entIdx, cdIdx, t, srcType, trgtType, newloc]

            for (var entIdx = 0; entIdx < scn.entities.length; ++entIdx) if (this.candidates[entIdx]) { // for each candidate entities

                if (scn.entities[entIdx].CD_sph > 0) 
                for (var cdIdx = 0; cdIdx < scn.entities[entIdx].CD_sph; ++cdIdx) {
                    nHitTest++;
                    v3_sub_res(so, scn.entities[entIdx].CD_sph_p[cdIdx], this.org[i]);
                    var t = VectSphHit(this.vectNorm[i], so, scn.entities[entIdx].CD_sph_rs[cdIdx]);                    
                    if (t != false) colList.push( [entIdx, cdIdx, t, "vec", "sph"] );                         
                } // end for each sph data of each entities with sph CD

                if (scn.entities[entIdx].CD_iPlane > 0) 
                for (var cdIdx = 0; cdIdx < scn.entities[entIdx].CD_iPlane; ++cdIdx) {
                    nHitTest++;
                    var d0 = v3_dot(this.org[i], scn.entities[entIdx].CD_iPlane_n[cdIdx]) - scn.entities[entIdx].CD_iPlane_d[cdIdx];
                    var d1 = v3_dot(v1, scn.entities[entIdx].CD_iPlane_n[cdIdx]) - scn.entities[entIdx].CD_iPlane_d[cdIdx];
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) {
                        var t = -d0 / (d1 - d0);
                        var newloc = v3_lerp_new(this.org[i], v1, t);
                        colList.push( [entIdx, cdIdx, t, "vec", "iPlane", newloc] );
                    }                     
                } // end for each sph data of each entities with iPlane CD

                if (scn.entities[entIdx].CD_fPlane > 0) 
                for (var cdIdx = 0; cdIdx < scn.entities[entIdx].CD_fPlane; ++cdIdx) {
                    nHitTest++;
                    var offsetV0 = v3_sub_new(this.org[i], scn.entities[entIdx].CD_fPlane_d[cdIdx]);
                    var offsetV1 = v3_sub_new(v1, scn.entities[entIdx].CD_fPlane_d[cdIdx]);
                    var d0 = v3_dot(offsetV0, scn.entities[entIdx].CD_fPlane_n[cdIdx]);
                    var d1 = v3_dot(offsetV1, scn.entities[entIdx].CD_fPlane_n[cdIdx]);
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = v3_lerp_new(offsetV0, offsetV1, t);
                        var xx1 = Math.abs(v3_dot(newloc, scn.entities[entIdx].CD_fPlane_w[cdIdx]) );
                        var yy1 = Math.abs(v3_dot(newloc, scn.entities[entIdx].CD_fPlane_h[cdIdx]) );
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "fPlane", v3_add_new(newloc, scn.entities[entIdx].CD_fPlane_d[cdIdx] )] );
                    }                     
                } // end for each sph data of each entities with fPlane CD

                /*if (scn.entities[entIdx].CD_cube > 0) 
                for (var cdIdx = 0; cdIdx < scn.entities[entIdx].CD_cube; ++cdIdx) {
                    nHitTest++;
                    var offsetV0 = v3_sub_new(this.org[i], scn.entities[entIdx].CD_cube_p[cdIdx]);
                    var offsetV1 = v3_sub_new(v1, scn.entities[entIdx].CD_cube_p[cdIdx]);

                    var d0 = v3_dot(offsetV0, scn.entities[entIdx].CD_cube_x[cdIdx]);
                    var d1 = v3_dot(offsetV1, scn.entities[entIdx].CD_cube_x[cdIdx]);
                    // Test inside X/Y
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = v3_lerp_new(offsetV0, offsetV1, t);
                        var xx1 = Math.abs(newloc[1]);
                        var yy1 = Math.abs(newloc[2]);
                        //Check if crossing point is inside the unity square of plane
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "CubeX", v3_add_new(newloc,scn.entities[entIdx].CD_cube_p[cdIdx] )] );
                    }   


                    var d0 = v3_dot(offsetV0, scn.entities[entIdx].CD_cube_y[cdIdx]);
                    var d1 = v3_dot(offsetV1, scn.entities[entIdx].CD_cube_y[cdIdx]);
                    // Test inside X/Y
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = v3_lerp_new(offsetV0, offsetV1, t);
                        var xx1 = Math.abs(newloc[0]);
                        var yy1 = Math.abs(newloc[2]);
                        //Check if crossing point is inside the unity square of plane
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "CubeY", v3_add_new(newloc,scn.entities[entIdx].CD_cube_p[cdIdx] )] );
                    }   



                    var d0 = v3_dot(offsetV0, scn.entities[entIdx].CD_cube_z[cdIdx]);
                    var d1 = v3_dot(offsetV1, scn.entities[entIdx].CD_cube_z[cdIdx]);
                    // Test inside X/Y
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = v3_lerp_new(offsetV0, offsetV1, t);
                        var xx1 = Math.abs(newloc[0]);
                        var yy1 = Math.abs(newloc[1]);
                        //Check if crossing point is inside the unity square of plane
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "CubeZ", v3_add_new(newloc,scn.entities[entIdx].CD_cube_p[cdIdx] )] );
                    }   
    
                } // end for each sph data of each entities with cube CD
                */
            }

            if (colList.length > 0) {
                var vLen = v3_length(vd);      
                // remove out of range          
                for (var cl = colList.length-1; cl >= 0; --cl) if (colList[cl][2] > vLen) colList.splice(cl, 1);
                // if nec sort ascending per item 2 (t)
                if (colList.length > 0) {
                    if (colList.length > 1) colList.sort((a, b) => { return a[2] - b[2]; } );

                    //deactive pellet, log, and do something...
                    this.act[i] = false;
                  //  log("Hit pellet: " +colList[0][3] + " ent[" + colList[0][0] + "] " + colList[0][4] + " CD[" + colList[0][1] +"]");
                    var newloc = (colList[0][5]) ? colList[0][5] : v3_addscaled_new(this.org[i], this.vectNorm[i], colList[0][2]);
                    if (scn.entities[colList[0][0]].id.indexOf("sph") > -1) {
                        splode(newloc);
                    } else {
                        splos.addWireCross(newloc, 2, [1,1,1]);
                    } 
                }
            }

            // update pellet origin
            v3_addscaled_mod(this.org[i], this.vect[i], timer.delta);

        } // end for each active pellet
    }
} 


// Intersection of vector and sphere, as vector advance into static sphere, arrow like
function VectSphHit(v, so, sr2) { // translated to v origin
    var t0 = 0; 
    var t1 = 0;
   // var sr2 = sr * sr;
    var tca = v3_dot(so, v);

    if  (tca < 0) return false;
    // sph behind origin

    var d2 = v3_dot(so, so) - tca * tca;

    if (d2 > sr2) return false;
    // tangential point farther than radius

    var thc = Math.sqrt(sr2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;

    return (t0 < t1) ? t0 : t1;
}

// Intersction of sphere and vector, as sphere advance into edge
function SphEdgeHit(v, so, sr2) { // translated to v origin
    var t0 = 0; 
    var t1 = 0;

    var l = v3_length(v);
   // var vs = v3_scale_new(v, 1.0/l);
    
    // var sr2 = sr * sr;
    var tca = v3_dot(so, v);
    
    if  (tca < 0) return false;
    // sph behind origin
    
    var d2 = v3_dot(so, so) - tca * tca;
    
   // log("edge l " + l);
    if (d2 > (sr2/l )) return false;
    // tangential point farther than radius
    
    log("edge tca " + tca);
    var thc = Math.sqrt(sr2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;
    log("edge t0 " + t0);
    log("edge t1 " + t1);

    return tca;
}



function splode(loc) {
  // log("sploded!", false);
  // log(splos.numElements);
    var col = [ [1,0,0], [1,1,0] ,[0,1,0] ,[0,1,1] ,[0,0,1], [1,0,1] ];
    var nvect = 18;
    var iter = 20;
    var dim = 0.1;
    var dvect = Array(nvect);
    var vect = Array(nvect);
    for (let i = 0; i < nvect; ++i) {
        vect[i] = [rndPM(10), rndPM(10), rndPM(10)] ;
        dvect[i] = [rndPM(10), 5+rndPM(10), rndPM(10)] ;
    }
    var idx = 0;
    for (let i = 0; i < iter; ++i) {
        var s = 2 - (dim * i);
        for (let j=0; j < nvect; ++j) {

            splos.addWireCross(v3_add_new(loc, vect[j]), s, col[idx]);

            idx++;
            if (idx >= col.length) idx = 0;
        }
        for (let j = 0; j < nvect; ++j) {
            vect[j][0] += dvect[j][0];
            vect[j][1] += dvect[j][1];
            vect[j][2] += dvect[j][2];
            dvect[j][0] *= 0.9;
            dvect[j][1] -= 1;
            dvect[j][2] *= 0.9; 
            
        }
    }
  //  log(splos.numElements);
}


// Logging and status information


function log(text, silent = true) {
    let ts = 0;
    try {
        ts = Date.now() - timer.start;
    } catch (e) {
        // timer was not yet defined
        ts = "=";
    } 

    console.log("E3D[" + ts + "] " + text);
    if (!silent) {
        logElement.innerHTML += "[" + ts + "] " + text + "<br />";
        logElement.scrollTop = logElement.scrollHeight - logElement.offsetHeight;
    }

}

function updateStatus() {
    usepct_smth = timer.smooth(usepct_smth, timer.usage, 3);
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + " pY:" + Math.floor(scn.camera.position[1]) + " pZ:" + Math.floor(scn.camera.position[2])+ " rX: " + Math.floor(inputs.rx * RadToDeg) + " rY:"+ Math.floor(inputs.ry * RadToDeg) + "<br />" +
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets + "<br />"+
    "nAnims: " + animations.length + " nHitTests: " + nHitTest;
}

});