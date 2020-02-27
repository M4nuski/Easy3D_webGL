// Easy3D_WebGL
// Main demo program for version 0.4
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
    console.log("E3D[" + ts + "] " + text);
    if (!silent) {
        if (logElement == null) logElement = document.getElementById("logDiv");        
        if (logElement == null) {
            logElement.innerHTML += "[" + ts + "] " + text + "<br />";
            logElement.scrollTop = logElement.scrollHeight - logElement.offsetHeight;
        } else {
            console.log("[" + ts + "] " + text);
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");

log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const mainDiv = document.getElementById("mainDiv");
const logElement = document.getElementById("logDiv");

const status = document.getElementById("statusDiv");

log("Set DOM Events");
can.addEventListener("resize", winResize); // To reset camera matrix
document.forms["moveTypeForm"].addEventListener("change", camChange); // To update camera matrix
document.forms["moveTypeForm"].invertY.addEventListener("keydown", (e) => {e.preventDefault(); });
document.forms["displayForm"].CDP.addEventListener("keydown", (e) => {e.preventDefault(); });

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
timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var meshLoader = new E3D_loader();

var inputs = new E3D_input(mainDiv, true, true, true, true, true, true);

// virtual KB
var vKBinputs = new E3D_input_virtual_kb(document.getElementById("inputTable"), inputs, true);
// virtual trackpad + thumbstick
var vTPinput = new E3D_input_virtual_trackpad(document.getElementById("track0") , inputs);
var vTSinput = new E3D_input_virtual_thumbstick(document.getElementById("thumb0"), inputs, "action1");
vTSinput.Xspeed = inputs._rotSpeed;
vTSinput.Yspeed = inputs._posSpeed; //pz
// virtual dual sticks
var vTSinputLeft = new E3D_input_virtual_thumbstick(document.getElementById("thumb1Left"), inputs, "action1");
vTSinputLeft.Xspeed = inputs._rotSpeed;
vTSinputLeft.Yspeed = inputs._posSpeed; //pz
var vTSinputRight = new E3D_input_virtual_thumbstick(document.getElementById("thumb1Right"), inputs, "action0");
vTSinputRight.Xspeed = inputs._rotSpeed;
vTSinputRight.Yspeed = inputs._rotSpeed;

try {
if (process) {
    var info = document.getElementById("processInfo");
    if (info) {
        info.innerHTML = "We are using node " + process.versions.node +
        ", Chrome " + process.versions.chrome + 
        ", and Electron " + process.versions.electron; 
    }
}
} catch (ex) { console.log("Running in browser (not Electron)"); }

log("Session Start", true);
initEngine();



function winResize() {
    winWidth = gl.canvas.clientWidth
    winHeight = gl.canvas.clientHeight;
    
    scn.camera.resize(winWidth, winHeight, _fieldOfView, _zNear, _zFar); 
}


function camChange() {

    let vmode = document.forms["moveTypeForm"].moveType.value; 

    inputs.keyMap.set("ry_dec", "KeyQ");
    inputs.keyMap.set("ry_inc", "KeyE");

    inputs.keyMap.set("rz_dec", "KeyZ");    
    inputs.keyMap.set("rz_inc", "KeyX");

    inputs.keyMap.set("rx_dec", "null");
    inputs.keyMap.set("rx_inc", "null");

    inputs.keyMap.set("action0", "KeyR");

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

        inputs.keyMap.set("ry_dec", "KeyZ");
        inputs.keyMap.set("ry_inc", "KeyX");

        inputs.keyMap.set("rz_dec", "KeyQ");
        inputs.keyMap.set("rz_inc", "KeyE");
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
        scn = new E3D_scene("mainScene", gl, winWidth, winHeight, [0.0, 0.0, 0.15, 1.0], 300);

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

    timer.run();
    E3D_G = 32;
    scn.state = E3D_ACTIVE;

    testSph = new E3D_entity_wireframe_canvas("wireSphereTest");
    testSph.addWireSphere([30,0,0], 20, [1,0,0], 24, true);
    testSph.addWireSphere([0,30,0], 20, [0,1,0], 24, true);
    testSph.addWireSphere([0,0,30], 20, [0,0,1], 24, true);
    testSph.visible = true;
    scn.addEntity(testSph);

    splos = new E3D_entity_wireframe_canvas("splosions");
    splos.visible = true;
    splos.arrayIncrement = 4096; 
    splos.vis_culling = false;
    scn.addEntity(splos);

    iplanes = new E3D_entity_wireframe_canvas("infinitePlanes");
    iplanes.addPlane([0, 0, -100], [0, 0, 0], 50, 50, 4, [1,1,0], true);
    iplanes.addPlane([0, 300, 0], [PIdiv2, 0, 0], 450, 450, 20, [0,1,0], true);
    iplanes.addPlane([225, 300, -225], [0, PIdiv2, 0], 250, 250, 11, [0,1,1], true);
    iplanes.addPlane([-150, 80, 150], [0, -PIdiv2/2, -PIdiv2/2], 300, 300, 15, [1,1,1], true);
    iplanes.visible = true;
    iplanes.vis_culling = false;
    scn.addEntity(iplanes);

    fplanes = new E3D_entity_wireframe_canvas("finitePlanes");
    fplanes.position = [25, -10, 25];
    fplanes.addPlane([-25, 10, 25], [0, 0, 0], 20, 20, -1, [1,0,0], true);
    fplanes.addPlane([25, -10, 0], [0, PIdiv2, 0], 10, 40, -1, [0,1,0], true);
    fplanes.addPlane([0, 30, 0], [PIdiv2/2, PIdiv2, PIdiv2/2], 30, 30, 2, [0.5,0.5,0.5], true);
    fplanes.visible = true;
    scn.addEntity(fplanes);

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

    phyTracers = new E3D_entity_wireframe_canvas("PHY_Traces", 1024*32);
    phyTracers.visible = true;
    phyTracers.vis_culling = false;
    scn.addEntity(phyTracers);

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

    // Run Animations
    cleanupDoneAnimations(animations, scn);
    collisionDetectionAnimator(animations, scn, 10);

    // Display CD informations
    if (document.forms["displayForm"].CDP.checked) {
        dev_CD.clear();
        for (let i = 0; i < scn.entities.length; ++i) {
            if (scn.entities[i].vis_culling) dev_CD.addWireSphere(scn.entities[i].position,scn.entities[i].cull_dist * 2, [1,0.5,0], 24, false);
        }
        dev_CD.visible = true;
    } else {
        dev_CD.visible = false;
    }

}

function timerTick() {  // Game Loop
    
    vTSinputRight.processInputs("ry_offset", "rx_offset");

    if (scn.camera.id == "cam1s") {
        vTSinput.processInputs("rz_offset", "pz_offset");
        vTSinputLeft.processInputs("rz_offset", "pz_offset");
    } else {
        vTSinput.processInputs("px_offset", "pz_offset");
        vTSinputLeft.processInputs("px_offset", "pz_offset");

    }

    inputs.processInputs(timer.delta);
    inputs.smoothRotation(6);
    inputs.smoothPosition(6);
    if (scn.camera.id == "cam1f") {
     //   inputs.clampRotationSmooth(-PIdiv2, PIdiv2, true, false, false);
        if (scn.camera.rotation[0] < -PIdiv2)  {
            scn.camera.rotation[0] = -PIdiv2;
            if (inputs.rx_delta_smth < 0) inputs.rx_delta_smth = 0;
        }

        if (scn.camera.rotation[0] >  PIdiv2) {
            scn.camera.rotation[0] =  PIdiv2;
            if (inputs.rx_delta_smth > 0) inputs.rx_delta_smth = 0;
        }

    } 

    updateStatus();
    nHitTest = 0;

    if (inputs.checkCommand("action0", true)) {
     //   log("action0", true);
        let newSph = scn.cloneEntity("sph", "sph" + timer.lastTick);
        newSph.position[1] = 5;
        newSph.rotation[0] = rndPM(PIx2);
        newSph.rotation[1] = rndPM(PIx2);
        animations.push(newBaseAnim_RelativeToCamera(newSph, scn.camera,
             [rndPM(1), rndPM(1), rndPM(1) -100], _v3_null, true, 10, true));
        animations[animations.length-1].target.animIndex = animations.length-1;
    }
    if (inputs.checkCommand("action1", true)) {
       // log("action1", true);      
        let newPyra = new E3D_entity_dynamicCopy("shotgun " + timer.lastTick, scn.entities[scn.getEntityIndexFromId("pyra")]);  
        newPyra.moveTo([10, -10, 0]); // originate from bottom right corner of view

        animations.push(newParticuleAnim_RelativeToCamera(newPyra, scn.camera,
            [rndPM(2), rndPM(2), -500 - rndPM(2) ], _v3_null, 10, 
            shotgunPartPos, shotgunPartDir, false, 2.0, true));
        animations[animations.length-1].target.animIndex = animations.length-1;
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
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), "sweep", v3_val_new(3.0, 1.0, 3.0));
                meshLoader.addModelData(nm);

                nm.position[1] = -80;
                nm.visible = true;
                scn.addEntity(nm);  

                nm = scn.cloneEntity("CM_top", "CM_bottom");
                nm.position[1] = 80;
                nm.visible = true;
                nm.resetMatrix();

            } else if (name == "sph") {
                let nm = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0,1.0,0.5]);
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
        v3_rotateY_mod(newGuy.position, j * 10 * DegToRad );
        newGuy.resetMatrix();
        newGuy.visible = true;
    }
    cloned = true;
}

function shotgunPartPos(n, nbPart) {
    return [rndPM(10), rndPM(10), rndPM(3)];    
}

function shotgunPartDir(pos, n, nbPart) {
    return v3_clone(pos);
}
function collisionResult_asTarget_splode(loc) {
    // log("sploded!", false);
    // log(splos.numElements);
      var col = [ [1,0,0], [1,1,0] ,[0,1,0] ,[0,1,1] ,[0,0,1], [1,0,1] ];
      var nvect = 18;
      var iter = 20;
      var dim = 0.1;
      var dvect = Array(nvect);
      var vect = Array(nvect);
      for (i = 0; i < nvect; ++i) {
          vect[i] = [rndPM(10), rndPM(10), rndPM(10)] ;
          dvect[i] = [rndPM(10), 5+rndPM(10), rndPM(10)] ;
      }
      var idx = 0;
      for (var i = 0; i < iter; ++i) {
          var s = 2 - (dim * i);
          for (var j=0; j < nvect; ++j) {
  
              splos.addWireCross(v3_add_new(loc, vect[j]), s, col[idx]);
  
              idx++;
              if (idx >= col.length) idx = 0;
          }
          for (var j = 0; j < nvect; ++j) {
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
  
/*
function shotgunAnimF () {
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
            this.vectNorm[i] = v3_normalize_new(this.vect[i]);

            //offset pelets vertex by new origin and invalidate normal
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var idx = (i*this.target.srcNumElements) + j;
                var b = this.target.getVertex3f(idx);
                v3_add_mod(b, this.vertOffset[i])
                this.target.setNormal3f(idx, _v3_origin);
            }
        }

        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.vis_culling = true; // for now, to see vis and CD sphere
        scn.addEntity(this.target);        
    } 
}
*/
/*
function shotgunAnimL () {

    this.ttl -= timer.delta;

    if (this.ttl  <= 0) {
        this.state = E3D_DONE;
        this.target.visible = false;
    } else  {
        this.last_position = this.target.position.slice();
        this.delta_position = v3_scale_new(this.mainVector, timer.delta);
        v3_add_mod(this.target.position, this.delta_position);
        this.delta2 = v3_length(this.delta_position);

        this.target.resetMatrix();
        this.target.cull_dist = 30;// override calculated cull dist
    }  
}
*/
function shotgunAnimR() {
 
    if (this.state == E3D_PLAY) {
        for (let i = 0; i < this.numPellets; ++i) if (this.act[i]) { // i is pellet index

            // translate pellet entity elements
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var b = this.target.getVertex3f((i*this.target.srcNumElements) + j); // b is a view in float32array
                v3_addscaled_mod(b, this.vertOffset[i], timer.delta);
            }

            // current tranlation vector, world coordinates
            var vd = v3_scale_new(this.vect[i], timer.delta); // vector delta
            var so = [0, 0, 0]; // sphere origin
            var v1 = v3_add_new(this.org[i], vd); // vector end
           // v3_add_mod(v1, this.delta_position);


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
                        var newloc = v3_lerp_new( this.org[i], v1, t);
                        colList.push( [entIdx, cdIdx, t, "vec", "iPlane", newloc] );
                    }                     
                } // end for each sph data of each entities with iPlane CD

                if (scn.entities[entIdx].CD_fPlane > 0) 
                for (var cdIdx = 0; cdIdx < scn.entities[entIdx].CD_fPlane; ++cdIdx) {
                    nHitTest++;
                    var offsetV0 =v3_sub_new(this.org[i], scn.entities[entIdx].CD_fPlane_d[cdIdx]);
                    var offsetV1 =v3_sub_new(v1, scn.entities[entIdx].CD_fPlane_d[cdIdx]);
                    var d0 = v3_dot(offsetV0, scn.entities[entIdx].CD_fPlane_n[cdIdx]);
                    var d1 = v3_dot(offsetV1, scn.entities[entIdx].CD_fPlane_n[cdIdx]);
                    if ( ((d0 > 0) && (d1 < 0)) || ((d0 < 0) && (d1 > 0)) ) { // d0-d1 crosses the plane
                        var t = -d0 / (d1 - d0);
                        var newloc = v3_lerp_new(offsetV0, offsetV1, t);
                        var xx1 = Math.abs(v3_dot(newloc, scn.entities[entIdx].CD_fPlane_w[cdIdx]) );
                        var yy1 = Math.abs(v3_dot(newloc, scn.entities[entIdx].CD_fPlane_h[cdIdx]) );
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "fPlane", v3_add_new(newloc,scn.entities[entIdx].CD_fPlane_d[cdIdx] )] );
                    }                     
                } // end for each sph data of each entities with fPlane CD

               /* if (scn.entities[entIdx].CD_cube > 0) 
                for (var cdIdx = 0; cdIdx < scn.entities[entIdx].CD_cube; ++cdIdx) {
                    nHitTest++;
                    var offsetV0 =v3_sub_new(this.org[i], scn.entities[entIdx].CD_cube_p[cdIdx]);
                    var offsetV1 =v3_sub_new(v1, scn.entities[entIdx].CD_cube_p[cdIdx]);

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
                        if ( (xx1 <= 1) && (yy1 <= 1) ) colList.push( [entIdx, cdIdx, t, "vec", "CubeZ", v3_add_new(newloc, scn.entities[entIdx].CD_cube_p[cdIdx] )] );
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
           //v3_addscaled_mod(this.org[i], this.vect[i], timer.delta);

        } // end for each active pellet


        
    }   // active




} 




// Status information

function updateStatus() {
    usepct_smth = timer.smooth(usepct_smth, timer.usage, 3);
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + " pY:" + Math.floor(scn.camera.position[1]) + " pZ:" + Math.floor(scn.camera.position[2])+ " rX: " + Math.floor(inputs.rx * RadToDeg) + " rY:"+ Math.floor(inputs.ry * RadToDeg) + "<br />" +
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets + "<br />"+
    "nAnims: " + animations.length + " nHitTests: " + nHitTest;
}



});