// Easy3D_WebGL
// Main demo program for version 0.5
// Emmanuel Charette 2020

"use strict"



var nHitTest = 0;
var nHits = 0;

var show_DEV_CD = false;
var phyTracers, dev_Hits;
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
var testSph, splos, planes, fplanes, cubes, dev_CD; // entities
var cloned = false;
var animations = [];
var nHitTest = 0;

// Engine Components

var gl; // webGL canvas rendering context
timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new resourceManager(onresource);
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

// Status information

function updateStatus() {
    usepct_smth = timer.smooth(usepct_smth, timer.usage, 3);
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + " pY:" + Math.floor(scn.camera.position[1]) + " pZ:" + Math.floor(scn.camera.position[2])+ " rX: " + Math.floor(inputs.rx * RadToDeg) + " rY:"+ Math.floor(inputs.ry * RadToDeg) + "<br />" +
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets + "<br />"+
    "nAnims: " + animations.length + " nHitTests: " + nHitTest;
}


function winResize() {
    winWidth = gl.canvas.clientWidth;
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
        scn.lights = new E3D_lighting(v3_val_new(0.0, 0.0, 0.15));
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
     
    resMngr.addresource("../Models/ST.raw", "ST", "Model");
    resMngr.addresource("../Models/AXIS.raw", "Map", "Model");
    resMngr.addresource("../Models/CM.raw", "CM", "Model");
    resMngr.addresource("../Models/SPH.raw", "sph", "Model");
    resMngr.addresource("../Models/PYRA.raw", "pyra", "Model");
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

    planes = new E3D_entity_wireframe_canvas("Planes");
    planes.addPlane([0, 0, -100], [0, 0, 0], 50, 50, 4, [1,1,0], true);
    planes.addPlane([0, 300, 0], [PIdiv2, 0, 0], 450, 450, 20, [0,1,0], true);
    planes.addPlane([225, 300, -225], [0, PIdiv2, 0], 250, 250, 11, [0,1,1], true);
    planes.addPlane([-150, 80, 150], [0, -PIdiv2/2, -PIdiv2/2], 300, 300, 15, [1,1,1], true);
    planes.addPlane([0, 0, 50], [0, 0, 0], 20, 20, -1, [1,0,0], true);
    planes.addPlane([50, -20, 25], [0, PIdiv2, 0], 10, 40, -1, [0,1,0], true);
    planes.addPlane([25, 20, 25], [PIdiv2/2, PIdiv2, PIdiv2/2], 30, 30, 2, [0.5,0.5,0.5], true);
    planes.visible = true;
    planes.vis_culling = false;
    scn.addEntity(planes);

    cubes = new E3D_entity_wireframe_canvas("cubesTest");
    cubes.position = [0, 50, -50];
    cubes.addWireCube([0, -50, 0], [0,0,0], [15, 15, 15], [1,0,0], true, false, false );
    cubes.addWireCube([0, -25, 0], [0,0,0], [10, 10, 10], [0,1,0], true, true, false );
    cubes.addWireCube([0, 0, 0], [0,0,0], [5, 5, 5], [0,0,1], true, false, true );
    cubes.addWireCube([0, 25, 0], [0,0,0], [10, 10, 10], [1,0,1], true, true, true );
    cubes.addTriangle([0, 20, 80], [-30, 22, 150], [30, 18, 150], [1, 1, 1], true);
    cubes.visible = true;
    scn.addEntity(cubes);

    dev_CD = new E3D_entity_wireframe_canvas("DEV/CD_Display");
    dev_CD.visible = true;
    dev_CD.vis_culling = false;
    scn.addEntity(dev_CD);

    dev_Hits = new E3D_entity_wireframe_canvas("PHY_hits");
    dev_Hits.visible = true;
    dev_Hits.vis_culling = false;
    scn.addEntity(dev_Hits);

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
        show_DEV_CD = true;
        dev_CD.clear();
        for (let i = 0; i < scn.entities.length; ++i) {
            if (scn.entities[i].vis_culling) dev_CD.addWireSphere(scn.entities[i].position,scn.entities[i].cull_dist * 2, [1,0.5,0], 24, false);
        }
        dev_CD.visible = true;
    } else {
        dev_CD.visible = false;
        show_DEV_CD = false;
    }

}

function timerTick() {  // Game Loop
    
    // Inputs
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

    // Stats
    updateStatus();
    nHitTest = 0;

    // Events / Commands
    if (inputs.checkCommand("action0", true)) {
     //   log("action0", true); throw a ball
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
       // log("action1", true); fire shotgun
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

    // Render
    if (scn.state == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }   
}


function onresource(name, msg) {
    if (msg == E3D_RES_FAIL) {
        log("Failed to load resource: " + name, false);        
    }
    if (msg == E3D_RES_ALL) {
        log("All async resources loaded for tag: " + name, true);       
        resMngr.flushAll();   
    }

    if (msg == E3D_RES_LOAD) {
        log("Async resource loaded: " + name, true); 

        if (resMngr.getresourceType(name) == "Model") {
            if (name == "ST") {
                let nm = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getresourcePath(name), resMngr.getData(name));
                meshLoader.smoothNormals(0.0);
                meshLoader.addModelData(nm);

                nm.position[2] = -120;
                nm.visible = true;

                animations.push(newTransformAnim(nm, _v3_null, [0, 1, 0]));

                scn.addEntity(nm);  

                if (!cloned) cloneWar();

            } else if (name == "CM") {
                let nm = new E3D_entity(name+"_top", "", false);
                meshLoader.loadModel_RAW(resMngr.getresourcePath(name), resMngr.getData(name), "sweep", v3_val_new(3.0, 1.0, 3.0));
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
                meshLoader.loadModel_RAW(resMngr.getresourcePath(name), resMngr.getData(name), [1.0,1.0,0.5]);
                meshLoader.smoothNormals(0.0);
                meshLoader.addModelData(nm);

                nm.pushCD_sph(_v3_origin, 0.5);
                scn.addEntity(nm);               

            } else if (name == "pyra") {
                let nm = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getresourcePath(name), resMngr.getData(name), [1.0,0.8,0.0]);
                meshLoader.removeNormals();
                meshLoader.addModelData(nm);
                scn.addEntity(nm);
            } else {
                let nm = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getresourcePath(name), resMngr.getData(name), "sweep");
                meshLoader.addModelData(nm);
                scn.addEntity(nm);  
                nm.visible = true;
                nm.pushCD_sph(_v3_origin, 7.0);
            }

        }  


    } // msg loaded
}


// Creates copies of the StormTrooper entity
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