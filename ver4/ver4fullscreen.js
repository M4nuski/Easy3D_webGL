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

document.getElementById("screenSizeDiv").addEventListener("click", () => { fullscreenToggle(mainDiv); hover2CollapseAll(); } );
document.getElementById("pointerLockImg").addEventListener("click", () => { pLockToggle(can); hover2CollapseAll(); } );
pLockCallback = function(event) {
    log(event, true);

    // remap controls
    if (event == "lock") {
        inputs.pointerMap["rx_btn"] = E3D_INP_ALWAYS;
        inputs.pointerMap["ry_btn"] = E3D_INP_ALWAYS;
        inputs.keyMap["action0"] = E3D_INP_LMB;

    } else if ((event == "unlock") || (event == "error")) {
        inputs.pointerMap["rx_btn"] = E3D_INP_LMB;
        inputs.pointerMap["ry_btn"] = E3D_INP_LMB;
        inputs.keyMap["action0"] = E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_LMB;
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
var testSph, splos, iplanes, fplanes, cubes, dev_CD; // entities
var cloned = false;
var animations = [];
var nHitTest = 0;

// Engine Components

var gl; // webGL canvas rendering context
var timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);

var inputs = new E3D_input(can, true, true, true, true, true, true);
inputs.onInput = onEngineInput;

// virtual KB
var vKBinputs = new E3D_input_virtual_kb(document.getElementById("inputTable"), inputs, true);
// virtual trackpad + thumbstick
var vTPinput = new E3D_input_virtual_trackpad(document.getElementById("track0") , inputs);
var vTSinput = new E3D_input_virtual_thumbstick(document.getElementById("thumb0"), inputs, "action1");
// virtual dual sticks
var vTSinputLeft = new E3D_input_virtual_thumbstick(document.getElementById("thumb1Left"), inputs, "action1");
var vTSinputRight = new E3D_input_virtual_thumbstick(document.getElementById("thumb1Right"), inputs, "action0");


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

    vTSinput.onResize();
    vTSinputLeft.onResize();
    vTSinputRight.onResize();
    //TODO move to class, also add scroll ??

}


function camChange() {

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
        scn = new E3D_scene("mainScene", gl, winWidth, winHeight, vec4.fromValues(0.0, 0.0, 0.25, 1.0), 400);

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
        camChange();
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

    } catch (e) {
        log(e, false);

        return; 
    }
    
        inputs.keyMap["rx_dec"] = "null";
        inputs.keyMap["rx_inc"] = "null";
        inputs.keyMap["ry_dec"] = "null";
        inputs.keyMap["ry_inc"] = "null";
        inputs.keyMap["rz_dec"] = "KeyQ";
        inputs.keyMap["rz_inc"] = "KeyE";
        inputs.pointerMap["px_btn"] = E3D_INP_DISABLED;
        inputs.pointerMap["py_btn"] = E3D_INP_DISABLED;
        inputs.pointerMap["pz_btn"] = E3D_INP_DISABLED;
        inputs.pointerMap["rz_btn"] = E3D_INP_DISABLED;
        pLockCallback("unlock"); // preset controls mapping
     
    resMngr.addRessource("../Models/ST.raw", "ST", "Model");
    resMngr.addRessource("../Models/AXIS.raw", "Map", "Model");
    resMngr.addRessource("../Models/CM.raw", "CM", "Model");
    resMngr.addRessource("../Models/SPH.raw", "sph", "Model");
    resMngr.addRessource("../Models/PYRA.raw", "pyra", "Model");
    resMngr.loadAll("models");
    
    l0v = new E3D_entity_vector("light0vect", true, 10.0, true);
    l0v.position = vec3.fromValues(-5, 20, -5);
    //l0v.scale = vec3.fromValues(5, 5, 5);
    l0v.visible = true;
    l0v.vis_culling = false;

    scn.addEntity(l0v);
    
    l1v = new E3D_entity_vector("light1vect", true, 10.0, true);
    l1v.position = vec3.fromValues(5, 20, 5);
    //l1v.scale = vec3.fromValues(5, 5, 5);
    l1v.visible = true;
    l1v.vis_culling = false;

    scn.addEntity(l1v);

    testSph = new E3D_entity_dynamic("wireSphereTest");
    testSph.addWireSphere([30,0,0], 20, [1,0,0], 24, true);
    testSph.addWireSphere([0,30,0], 20, [0,1,0], 24, true);
    testSph.addWireSphere([0,0,30], 20, [0,0,1], 24, true);
    testSph.visible = true;
    //testSph.cull_dist2 = 2500;
    scn.addEntity(testSph);

    splos = new E3D_entity_dynamic("splosions");
    splos.visible = true;
    splos.arrayIncrement = 2700; 
    splos.vis_culling = false;
    scn.addEntity(splos);

    iplanes = new E3D_entity_dynamic("infinitePlanes");
    iplanes.addPlane([0, 0, -100], [0, 0, 0], 50, 50, 4, [1,1,0], true, false);
    iplanes.addPlane([0, 300, 0], [PIdiv2, 0, 0], 450, 450, 20, [0,1,0], true, false);
    iplanes.addPlane([225, 300, -225], [0, PIdiv2, 0], 250, 250, 11, [0,1,1], true, false);
    iplanes.addPlane([-150, 80, 150], [0, -PIdiv2/2, -PIdiv2/2], 300, 300, 15, [1,1,1], true, false);
    iplanes.visible = true;
    iplanes.vis_culling = false;
    scn.addEntity(iplanes);

    fplanes = new E3D_entity_dynamic("finitePlanes");
    fplanes.position = [25, -10, 25];
    fplanes.addPlane([-25, 10, 25], [0, 0, 0], 20, 20, -1, [1,0,0], false, true);
    fplanes.addPlane([25, -10, 0], [0, PIdiv2, 0], 10, 40, -1, [0,1,0], false, true);
    fplanes.addPlane([0, 30, 0], [PIdiv2/2, PIdiv2, PIdiv2/2], 30, 30, 2, [0.5,0.5,0.5], false, true);
    fplanes.visible = true;
    //fplanes.cull_dist2 = 4200;
    scn.addEntity(fplanes);

    cubes = new E3D_entity_dynamic("cubesTest");
    cubes.position = [0, 50, -50];
    cubes.addWireCube([0, -50, 0], [0,0,0], [15, 15, 15], [1,0,0], true, false, false );
    cubes.addWireCube([0, -25, 0], [0,0,0], [10, 10, 10], [0,1,0], true, true, false );
    cubes.addWireCube([0, 0, 0], [0,0,0], [5, 5, 5], [0,0,1], true, false, true );
    cubes.addWireCube([0, 25, 0], [0,0,0], [10, 10, 10], [1,0,1], true, true, true );
    cubes.visible = true;
    //cubes.cull_dist2 = 4200;
    scn.addEntity(cubes);

    dev_CD = new E3D_entity_dynamic("DEV/CD_Display");

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

    // Animate / Calculate Expected target position and state
    // target orig, delta, dR2
    for (let i = animations.length -1; i >=0; --i) {
        if (animations[i].state == E3D_DONE) {
            scn.removeEntity(animations[i].target.id, false);
            animations.splice(i, 1);
        } else {
            animations[i].animate(null); //if supported calculate next position but don't lock
        }
    }
    // Cull Collission Detection with pos vs dR2
    let candidates = Array(scn.entities.length);
    for (let i = 0; i < animations.length; ++i) { // animations are source
        if (animations[i].delta2  > -1) for (let j = 0 ; j < scn.entities.length; ++j) // all entities are targets
            if ((scn.entities[j].collisionDetection) && (animations[i].target.id != scn.entities[j].id) ) { 
                var deltaP = vec3.distance( animations[i].target.position, scn.entities[j].position);
                var deltaD = animations[i].delta2 + animations[i].target.cull_dist + scn.entities[j].cull_dist; 
                candidates[j] = (scn.entities[j].CD_iPlane > 0) || ( deltaP  <= deltaD );  
        }
        animations[i].animate(candidates);
    }
    // Collistion Detection / get closest hit and reflection vector adjust with "t" and reflect vector

 //   for (let i = 0; i < animations.length; ++i) { 
  //      animations[i].animate(candidates); // resolve collision and lock final position
   // }
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
    
    vTSinputRight.processInputs("rx", "ry", timer.delta);

    if (scn.camera.id == "cam1s") {
        vTSinput.processInputs("rz", "pz", timer.delta);
        vTSinputLeft.processInputs("rz", "pz", timer.delta);
    } else {
        vTSinput.processInputs("px", "pz", timer.delta);
        vTSinputLeft.processInputs("px", "pz", timer.delta);
    }

    inputs.processInputs(timer.delta);
    inputs.smoothRotation(6);
    inputs.smoothPosition(6);

    updateStatus();
    nHitTest = 0;

    if (inputs.checkCommand("action0", true)) {
     //   log("action0", true);
        let newSph = scn.cloneEntity("sph", "sph" + timer.lastTick);
        animations.push(new E3D_animation("ball throw" + timer.lastTick, sphAnim, newSph, scn, timer));
        animations[animations.length-1].restart();
    }
    if (inputs.checkCommand("action1", true)) {
       // log("action1", true);      
        let newPyra = new E3D_entity_dynamicCopy("shotgun " + timer.lastTick, scn.entities[scn.getEntityIndexFromId("pyra")]);          
        animations.push(new E3D_animation("shotgun " + timer.lastTick, shotgunAnim, newPyra, scn, timer));
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
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 2, vec3.fromValues(1,1,1));
                nm.position[2] = -120;
                nm.visible = true;

                animations.push(new E3D_animation("ST rotate", rot0, nm, scn, timer));
                animations[animations.length-1].play();
                scn.addEntity(nm);  

                if (!cloned) cloneWar();

            } else if (name == "CM") {
                let nm = E3D_loader.loadModel_RAW(name+"_top", resMngr.getRessourcePath(name), resMngr.getData(name), 0, "sweep", false, vec3.fromValues(5, 1, 5));
                nm.position[1] = -120;
                //nm.scale[0] = 5;
                //nm.scale[2] = 5;
                nm.visible = true;
                scn.addEntity(nm);  

                nm = scn.cloneEntity("CM_top", "CM_bottom");
                nm.position[1] = 120;
                //nm.scale[0] = 5;
                //nm.scale[2] = 5;
                nm.visible = true;
                nm.resetMatrix();

            } else if (name == "sph") {
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 2, [1.0,1.0,0.5]);
                nm.pushCD_sph(vec3_origin, 0.5);
                scn.addEntity(nm);               

            } else if (name == "pyra") {
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 0, [1.0,0.8,0.0]);
                scn.addEntity(nm);   
            } else {
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 0, "sweep");
                scn.addEntity(nm);  
                nm.visible = true;
                nm.pushCD_sph(vec3_origin, 7.0);
            }

        }  


    } // msg loaded
}


function cloneWar() {
    for (let j = 1; j < 36; ++j) {
        var newGuy = scn.cloneEntity("ST", "ST" + j);
        newGuy.rotation[1] = j * 10 * DegToRad;
        newGuy.position[2] = -120;
        vec3.rotateY(newGuy.position, newGuy.position, vec3_origin, j * 10 * DegToRad );
        newGuy.resetMatrix();
        newGuy.visible = true;
    }
    cloned = true;
}


// animator functions

function sphAnim(cand) {

    if (this.state == E3D_PLAY) {

        if (cand) { // test and lock (pass 2)
        this.target.resetMatrix();  // update CD data  
        splos.line(this.data.last_position, this.target.position, true);
        var colList = [] ; // array of [entIdx, cdIdx, penetration, srcType, trgtType, normal]
            // for each other entity
            for (let i = 0; i < cand.length; ++i ) if (cand[i]) {
                if (this.scn.entities[i].CD_sph > 0) {  // collision detection - this.sph to other sph  

                    for (let j = 0; j < this.scn.entities[i].CD_sph; ++j) {
                        nHitTest++;
                        var d = vec3.squaredDistance(this.scn.entities[i].CD_sph_p[j], this.target.CD_sph_p[0]);
                        var minD = this.target.CD_sph_rs[0] + this.scn.entities[i].CD_sph_rs[j];
                        if (d <= minD) {
                        //  log("hit sph-sph: " + this.target.id + " - " + this.scn.entities[i].id);
                            var penetration = Math.sqrt(minD) - Math.sqrt(d);
                            var n = [this.target.CD_sph_p[0][0] - this.scn.entities[i].CD_sph_p[j][0], this.target.CD_sph_p[0][1] - this.scn.entities[i].CD_sph_p[j][1], this.target.CD_sph_p[0][2] - this.scn.entities[i].CD_sph_p[j][2] ];
                            //colList.push([i, j, penetration, "sph", "sph", n]);
                              splos.moveTo(this.target.position);
                            this.data.spd = reflect(this.data.spd, n);
                            vec3.scaleAndAdd(this.target.position, this.target.position, n, penetration);
                            this.target.resetMatrix();
                              splos.lineTo(this.target.position, false);
                        }
                    }
                } // sph

                if (this.scn.entities[i].CD_iPlane > 0) {  // collision detection - this.sph to infinite plane
                    var v = vec3.subtract([0, 0, 0], this.target.CD_sph_p[0], this.scn.entities[i].position);
                    var last_v = vec3.subtract([0, 0, 0], this.data.last_position, this.scn.entities[i].position);

                    for (let j = 0; j < this.scn.entities[i].CD_iPlane; ++j) {
                        nHitTest++;

                        var dist = vec3.dot(v, this.scn.entities[i].CD_iPlane_n[j]) - this.scn.entities[i].CD_iPlane_d[j] ;
                        var last_Dist = vec3.dot(last_v, this.scn.entities[i].CD_iPlane_n[j]) - this.scn.entities[i].CD_iPlane_d[j];
                                        
                        var sgn = (dist > 0) ? 1 : -1;
                        dist = Math.abs(dist) ;

                        var last_sgn = (last_Dist > 0) ? 1 : -1;
                        last_Dist = Math.abs(last_Dist) ;
                    
                        if ( dist < this.target.CD_sph_r[0]) { 
                        //    log("hit sph-iPlane: " + this.target.id + " - " + this.scn.entities[i].id);
                            var penetration = (sgn == last_sgn) ? (this.target.CD_sph_r[0] - dist) : (this.target.CD_sph_r[0] + dist);
                            penetration *= last_sgn;
                          //  colList.push([i, j, penetration, "sph", "iPlane", this.scn.entities[i].CD_iPlane_n[j]])
                              splos.moveTo(this.target.position);
                            this.data.spd = reflect(this.data.spd, this.scn.entities[i].CD_iPlane_n[j]);
                            vec3.scaleAndAdd(this.target.position, this.target.position, this.scn.entities[i].CD_iPlane_n[j], penetration);
                            this.target.resetMatrix();
                              splos.lineTo(this.target.position, false);

                        } else { // if sph itself didn't hit plane, test for vector from last position to this one
                            dist *= sgn;
                            last_Dist *= last_sgn;
                            if ( ( (dist > 0) && (last_Dist < 0) ) || ( (dist < 0) && (last_Dist > 0) ) ) {
                            //  log("hit sph(vect)-iPlane: " + this.target.id + " - " + this.scn.entities[i].id);
                                var penetration = ( Math.abs(last_Dist) +  Math.abs(dist)) * last_sgn;
                                colList.push([i, j, penetration, "sph/vect", "iPlane", this.scn.entities[i].CD_iPlane_n[j]])
                            }
        
                        }
                    }         
                } // iplane

            } // end for each other entity perform hit test

            // Go trough colList and resolve CD for vect
            if (colList.length > 0) {
                  splos.moveTo(this.target.position);
                colList.sort((a, b) => { return b[2] - a[2]; } );
                this.data.spd = reflect(this.data.spd, colList[0][5]);
                vec3.scaleAndAdd(this.target.position, this.target.position, colList[0][5], colList[0][2]);
                this.target.resetMatrix();
                  splos.lineTo(this.target.position, false);
            }

            this.data.spd[1] -= this.timer.delta * 9.81; // or whatever is G in this scale and projection
            this.data.ttl -= this.timer.delta;

            if (this.data.ttl < 0) {
                this.state = E3D_DONE;
                this.target.visible = false;
            } 
        } else { // initial animation pass (pass 1)
            this.data.last_position = this.target.position.slice();
            var dlt = vec3.scale([0,0,0], this.data.spd, this.timer.delta);
            vec3.add(this.target.position, this.target.position, dlt);
            this.delta2 = vec3.length(dlt);
        }
    }   // end state == PLAY

    if (this.state == E3D_RESTART) {
        vec3.copy(this.target.position, this.scn.camera.position);
        this.target.position[1] += 5;
        this.target.rotation[0] = rndPM(PIx2);
        this.target.rotation[1] = rndPM(PIx2);

        this.data.spd = this.scn.camera.adjustToCamera(vec3.scale(vec3_dummy, vec3_nz, 100));
        this.data.spd[0] += rndPM(1);
        this.data.spd[1] += rndPM(1);
        this.data.spd[2] += rndPM(1);
        this.data.ttl = 10;
        
        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.resetMatrix();
        this.data.last_position = this.target.position.slice();
    } 

}

function rot0() {
    if (this.state == E3D_PLAY) {
        this.target.rotation[1] += this.timer.delta;
        this.target.resetMatrix();
    }  
}


function shotgunAnim(cand) {
    let numPellets = 10;

    if (this.state == E3D_PLAY) {
        if (cand) { // pass 2, hit test and lock
        for (let i = 0; i < numPellets; ++i) if (this.data.act[i]) { // i is pallet index

            // translate pellet entity elements
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var b = this.target.getVertex3f((i*this.target.srcNumElements) + j); // b is a view in float32array
                vec3.scaleAndAdd(b, b, this.data.vertOffset[i], timer.delta);
            }

            // current tranlation vector, world coordinates
            var vd = vec3.scale([0,0,0], this.data.vect[i], timer.delta); // vector delta
            var so = [0, 0, 0]; // sphere origin
            var v1 = vec3.add([0,0,0], this.data.org[i], vd); // vector end
           // vec3.add(v1, this.data.delta_position, v1);


            var colList = [] ; // array of [entIdx, cdIdx, t, srcType, trgtType, newloc]

            for (var entIdx = 0; entIdx < cand.length; ++entIdx) if (cand[entIdx]) { // for each candidate entities

                if (this.scn.entities[entIdx].CD_sph > 0) 
                for (var cdIdx = 0; cdIdx < this.scn.entities[entIdx].CD_sph; ++cdIdx) {
                    nHitTest++;
                    vec3.subtract(so, this.scn.entities[entIdx].CD_sph_p[cdIdx], this.data.org[i]);
                    var t = VectSphHit(this.data.vectNorm[i], so, this.scn.entities[entIdx].CD_sph_rs[cdIdx]);                    
                    if (t != false) colList.push( [entIdx, cdIdx, t, "vec", "sph"] );                         
                } // end for each sph data of each entities with sph CD

                if (this.scn.entities[entIdx].CD_iPlane > 0) 
                for (var cdIdx = 0; cdIdx < this.scn.entities[entIdx].CD_iPlane; ++cdIdx) {
                    nHitTest++;
                    var d0 = vec3.dot(this.data.org[i], this.scn.entities[entIdx].CD_iPlane_n[cdIdx]) - this.scn.entities[entIdx].CD_iPlane_d[cdIdx];
                    var d1 = vec3.dot(v1, this.scn.entities[entIdx].CD_iPlane_n[cdIdx]) - this.scn.entities[entIdx].CD_iPlane_d[cdIdx];
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) {
                        var t = -d0 / (d1 - d0);
                        var newloc = vec3.lerp([0,0,0], this.data.org[i], v1, t);
                        colList.push( [entIdx, cdIdx, t, "vec", "iPlane", newloc] );
                    }                     
                } // end for each sph data of each entities with iPlane CD

                if (this.scn.entities[entIdx].CD_fPlane > 0) 
                for (var cdIdx = 0; cdIdx < this.scn.entities[entIdx].CD_fPlane; ++cdIdx) {
                    nHitTest++;
                    var offsetV0 = vec3.subtract([0,0,0], this.data.org[i], this.scn.entities[entIdx].CD_fPlane_d[cdIdx]);
                    var offsetV1 = vec3.subtract([0,0,0], v1, this.scn.entities[entIdx].CD_fPlane_d[cdIdx]);
                    var d0 = vec3.dot(offsetV0, this.scn.entities[entIdx].CD_fPlane_n[cdIdx]);
                    var d1 = vec3.dot(offsetV1, this.scn.entities[entIdx].CD_fPlane_n[cdIdx]);
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = vec3.lerp([0,0,0], offsetV0, offsetV1, t);
                        var xx1 = Math.abs(vec3.dot(newloc, this.scn.entities[entIdx].CD_fPlane_w[cdIdx]) );
                        var yy1 = Math.abs(vec3.dot(newloc, this.scn.entities[entIdx].CD_fPlane_h[cdIdx]) );
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "fPlane", add3f(newloc,this.scn.entities[entIdx].CD_fPlane_d[cdIdx] )] );
                    }                     
                } // end for each sph data of each entities with fPlane CD

                if (this.scn.entities[entIdx].CD_cube > 0) 
                for (var cdIdx = 0; cdIdx < this.scn.entities[entIdx].CD_cube; ++cdIdx) {
                    nHitTest++;
                    var offsetV0 = vec3.subtract([0,0,0], this.data.org[i], this.scn.entities[entIdx].CD_cube_p[cdIdx]);
                    var offsetV1 = vec3.subtract([0,0,0], v1, this.scn.entities[entIdx].CD_cube_p[cdIdx]);

                    var d0 = vec3.dot(offsetV0, this.scn.entities[entIdx].CD_cube_x[cdIdx]);
                    var d1 = vec3.dot(offsetV1, this.scn.entities[entIdx].CD_cube_x[cdIdx]);
                    // Test inside X/Y
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = vec3.lerp([0,0,0], offsetV0, offsetV1, t);
                        var xx1 = Math.abs(newloc[1]);
                        var yy1 = Math.abs(newloc[2]);
                        //Check if crossing point is inside the unity square of plane
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "CubeX", add3f(newloc,this.scn.entities[entIdx].CD_cube_p[cdIdx] )] );
                    }   


                    var d0 = vec3.dot(offsetV0, this.scn.entities[entIdx].CD_cube_y[cdIdx]);
                    var d1 = vec3.dot(offsetV1, this.scn.entities[entIdx].CD_cube_y[cdIdx]);
                    // Test inside X/Y
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = vec3.lerp([0,0,0], offsetV0, offsetV1, t);
                        var xx1 = Math.abs(newloc[0]);
                        var yy1 = Math.abs(newloc[2]);
                        //Check if crossing point is inside the unity square of plane
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "CubeY", add3f(newloc,this.scn.entities[entIdx].CD_cube_p[cdIdx] )] );
                    }   



                    var d0 = vec3.dot(offsetV0, this.scn.entities[entIdx].CD_cube_z[cdIdx]);
                    var d1 = vec3.dot(offsetV1, this.scn.entities[entIdx].CD_cube_z[cdIdx]);
                    // Test inside X/Y
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = vec3.lerp([0,0,0], offsetV0, offsetV1, t);
                        var xx1 = Math.abs(newloc[0]);
                        var yy1 = Math.abs(newloc[1]);
                        //Check if crossing point is inside the unity square of plane
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "CubeZ", add3f(newloc,this.scn.entities[entIdx].CD_cube_p[cdIdx] )] );
                    }   
    
                } // end for each sph data of each entities with cube CD
            }

            if (colList.length > 0) {
                var vLen = vec3.length(vd);      
                // remove out of range          
                for (var cl = colList.length-1; cl >= 0; --cl) if (colList[cl][2] > vLen) colList.splice(cl, 1);
                // if nec sort ascending per item 2 (t)
                if (colList.length > 0) {
                    if (colList.length > 1) colList.sort((a, b) => { return a[2] - b[2]; } );

                    //deactive pellet, log, and do something...
                    this.data.act[i] = false;
                  //  log("Hit pellet: " +colList[0][3] + " ent[" + colList[0][0] + "] " + colList[0][4] + " CD[" + colList[0][1] +"]");
                    var newloc = (colList[0][5]) ? colList[0][5] : vec3.scaleAndAdd([0,0,0], this.data.org[i], this.data.vectNorm[i], colList[0][2]);
                    if (this.scn.entities[colList[0][0]].id.indexOf("sph") > -1) {
                        splode(newloc);
                    } else {
                        splos.addWireCross(newloc, 2, [1,1,1]);
                    } 
                }
            }

            // update pellet origin
            vec3.scaleAndAdd(this.data.org[i], this.data.org[i], this.data.vect[i], timer.delta);

        } // end for each active pellet

    } else { // pass 1 of active, offset

        this.data.ttl -= timer.delta;
        if (this.data.ttl  <= 0) {
            this.state = E3D_DONE;
            this.target.visible = false;
        } else // ttl 
        {
            this.data.last_position = this.target.position.slice();
            this.data.delta_position = vec3.scale([0,0,0], this.data.mainVector, this.timer.delta);
            vec3.add(this.target.position, this.target.position, this.data.delta_position);
            this.delta2 = vec3.length(this.data.delta_position);

            this.target.resetMatrix();
            this.target.cull_dist = 30;// override calculated cull dist
        }  
    }
    }   // active

    if (this.state == E3D_RESTART) {
        vec3.copy(this.target.position, this.scn.camera.position);        
        vec3.add(this.target.position, this.target.position, this.scn.camera.adjustToCamera([10, -10, 0])); // originate from bottom right corner of view

        this.data.vertOffset = Array(numPellets); // vect noise for vertex
        this.data.vect = Array(numPellets); // mainVect + vect noise
        this.data.vectNorm = Array(numPellets); //opt normalized vect for CD
        this.data.org = Array(numPellets); // each pass org = org + vect, world coordinates

        this.data.ttl = 2.0;
        this.data.act = Array(numPellets); // active

        this.data.mainVector = this.scn.camera.adjustToCamera([ rndPM(2), rndPM(2), -500 - rndPM(2) ] );         

        this.target.setSize(this.target.srcNumElements * numPellets);

        for (let i = 0; i < numPellets; ++i) {
            //new pellet
            this.target.copySource(this.target.srcNumElements * i);
            this.data.act[i] = true;
            
            //pellet vector
            this.data.vertOffset[i] = this.scn.camera.adjustToCamera([rndPM(10), rndPM(10), rndPM(3) ]); // some noise
            this.data.org[i] = vec3.add([0,0,0], this.target.position, this.data.vertOffset[i]); // starting point is on noise.

            this.data.vect[i] = vec3.add([0,0,0], this.data.vertOffset[i], this.data.mainVector); 
            this.data.vectNorm[i] = vec3.normalize([0,0,0], this.data.vect[i] );

            //offset pelets vertex by new origin and invalidate normal
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var idx = (i*this.target.srcNumElements) + j;
                var b = this.target.getVertex3f(idx);
                vec3.add(b, this.data.vertOffset[i], b)
                this.target.setNormal3f(idx, vec3_origin);
            }
        }

        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.vis_culling = true; // for now, to see vis and CD sphere
        this.scn.addEntity(this.target);
        
    } 


} 


function reflect(inc, norm) {
    //r = v - 2.0 * dot(v, n) * n
    vec3.normalize(norm, norm);
    var dr2 = 2.0 * (inc[0] * norm[0] + inc[1] * norm[1] + inc[2] * norm[2]);
    return [ inc[0] - (norm[0] * dr2) , inc[1] - (norm[1] * dr2), inc[2] - (norm[2] * dr2) ];
}

function VectSphHit(v, so, sr2) { // translated to v origin
    var t0 = 0; 
    var t1 = 0;
   // var sr2 = sr * sr;
    var tca = vec3.dot(so, v);

    if  (tca < 0) return false;
    // sph behind origin

    var d2 = vec3.dot(so, so) - tca * tca;

    if (d2 > sr2) return false;
    // tangential point farther than radius

    var thc = Math.sqrt(sr2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;

    return (t0 < t1) ? t0 : t1;
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

            splos.addWireCross(add3f(loc, vect[j]), s, col[idx]);

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