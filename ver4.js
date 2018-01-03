document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");


"use strict"


log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const logElement = document.getElementById("logDiv");
const status = document.getElementById("statusDiv");

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
var testSph;
var cloned = false;
var animations = [];

// Engine Components

var gl; // webGL canvas rendering context
var timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var inputs = new E3D_input(can, true, true, true, true, true, true);
// virtual KB
var vKBinputs = new E3D_input_virtual_kb(document.getElementById("inputTable"), inputs, true);
// virtual trackpad + thumbstick
var vTPinput = new E3D_input_virtual_trackpad(document.getElementById("track0") , inputs);
var vTSinput = new E3D_input_virtual_thumbstick(document.getElementById("thumb0"), inputs, "action1");
// virtual dual sticks
var vTSinputLeft = new E3D_input_virtual_thumbstick(document.getElementById("thumb1Left"), inputs, "action1");
var vTSinputRight = new E3D_input_virtual_thumbstick(document.getElementById("thumb1Right"), inputs, "action0");


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
    resMngr.addRessource("SPH.raw", "sph", "Model");
    resMngr.addRessource("PYRA.raw", "pyra", "Model");
    resMngr.loadAll("models");


    
    l0v = new E3D_entity_vector("light0vect", true, 2.0, true);
    l0v.position = vec3.fromValues(-5, 20, -5);
    l0v.scale = vec3.fromValues(5, 5, 5);
    l0v.visible = true;
    l0v.resetMatrix();
    scn.addEntity(l0v, false);
    
    l1v = new E3D_entity_vector("light1vect", true, 2.0, true);
    l1v.position = vec3.fromValues(5, 20, 5);
    l1v.scale = vec3.fromValues(5, 5, 5);
    l1v.visible = true;
    l1v.resetMatrix();
    scn.addEntity(l1v, false);

    timer.run();
    scn.state = E3D_ACTIVE;

    testSph = new E3D_entity_dynamic("wireSphereTest");
    testSph.addWireSphere([30,0,0], 20, [1,0,0], 24);
    testSph.addWireSphere([0,30,0], 20, [0,1,0], 24);
    testSph.addWireSphere([0,0,30], 20, [0,0,1], 24);
    testSph.visible = true;
    scn.addEntity(testSph, false);

}


function prepRender() {
    // move camera per inputs
    let yf = (document.forms["moveTypeForm"].invertY.checked) ? -1.0 : 1.0;
    scn.camera.move(inputs.px_smth, -inputs.py_smth, inputs.pz_smth, inputs.ry_smth*yf, inputs.rx_smth, inputs.rz_smth);
    // update some entities per current lights direction
    if (scn.entities.length >= 3) {
        l0v.updateVector(scn.lights.light0_adjusted);
        l1v.updateVector(scn.lights.light1_adjusted);
    }
    for (let i = animations.length -1; i >=0; --i) {
        animations[i].animate();
        if (animations[i].state == E3D_DONE) {
            scn.removeEntity(animations[i].target.id);
            animations.splice(i, 1);
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

    updateStatus();

    if (inputs.checkCommand("action0", true)) {
        log("action0", true);
        let newSph = scn.cloneEntity("sph", "sph" + timer.lastTick);
        animations.push(new E3D_animation("ball throw" + timer.lastTick, sphAnim, newSph, scn, timer));
        animations[animations.length-1].restart();
    }
    if (inputs.checkCommand("action1", true)) {
        log("action1", true);      
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
                scn.addEntity(nm);  
                nm.position[2] = -120;
                nm.visible = true;
                nm.resetMatrix();
                animations.push(new E3D_animation("ST rotate", rot0, nm, scn, timer));
                animations[animations.length-1].play();

                if (!cloned) cloneWar();

            } else if (name == "CM") {
                let nm = E3D_loader.loadModel_RAW(name+"_top", resMngr.getRessourcePath(name), resMngr.getData(name), 0, "sweep");
                scn.addEntity(nm);  
                nm.position[1] = -80;
                nm.scale[0] = 3;
                nm.scale[2] = 3;
                nm.resetMatrix();
                nm.visible = true;

                nm = scn.cloneEntity("CM_top", "CM_bottom");
                nm.position[1] = 80;
                nm.scale[0] = 3;
                nm.scale[2] = 3;
                nm.resetMatrix();
                nm.visible = true;

            } else if (name == "sph") {
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 2, [1.0,1.0,0.5]);
                nm.colDetData.sph = [];
                nm.colDetData.sph.push( { p : [0,0,0] , r : 0.5 } );
                scn.addEntity(nm);               

            } else if (name == "pyra") {
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 0, [1.0,0.8,0.0]);
                scn.addEntity(nm);   
            } else {
                let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 0, "sweep");
                scn.addEntity(nm);  
                nm.visible = true;
                nm.colDetData.sph = [];
                nm.colDetData.sph.push( { p : [0,0,0] , r : 7.0 } );
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

function sphAnim() {
    if (this.state == E3D_RESTART) {
        vec3.copy(this.target.position, this.scn.camera.position);
        this.target.position[1] += 5;
        this.target.rotation[0] = Math.random()*PIx2;
        this.target.rotation[1] = Math.random()*PIx2;
        this.data.spd = this.scn.camera.adjustToCamera(vec3.scale(vec3_dummy, vec3_nz, 100));
        this.data.spd[0] += Math.random()-0.5;
        this.data.spd[1] += Math.random()-0.5;
        this.data.spd[2] += Math.random()-0.5;
        this.state = E3D_PLAY;
        this.target.visible = true;
    } 

    if (this.state == E3D_PLAY) {
        vec3.add(this.target.position, this.target.position, vec3.scale(vec3_dummy, this.data.spd, this.timer.delta));

        // collision detection !!!
        var thisLoc = [0,0,0];
        vec3.add(thisLoc, this.target.position, this.target.colDetData.sph[0].p); // only static for now

        for (let i = 0; i < this.scn.entities.length; ++i ){
            //does have data and not same object...
            if ((this.scn.entities[i].colDetData.sph) && (this.target.id != this.scn.entities[i].id)) {

                for (let j = 0; j < this.scn.entities[i].colDetData.sph.length; ++j) {
                    var thatLoc = [0,0,0];
                    vec3.add(thatLoc, this.scn.entities[i].position, this.scn.entities[i].colDetData.sph[j].p); // only static for now
                    var d = vec3.distance(thatLoc, thisLoc);
                    var minD = this.target.colDetData.sph[0].r + this.scn.entities[i].colDetData.sph[j].r;
                    if (d <= minD) {
                       // log(vec3.length(this.data.spd));
                        log("col Det " + this.target.id + " - " + this.scn.entities[i].id);
                        var penetration = minD - d;

                        var n = [thisLoc[0] - thatLoc[0], thisLoc[1] - thatLoc[1], thisLoc[2] - thatLoc[2] ];
                        this.data.spd = reflect(this.data.spd, n);
                        vec3.scale(n, n, penetration);
                        vec3.add(this.target.position, this.target.position, n);
                       // log(vec3.length(this.data.spd));
                       // vec3.negate(this.data.spd,this.data.spd);
                        //this.data.spd = [0,0,0];
                    }
                }
            }
        }

        this.data.spd[1] -= this.timer.delta * 9.81; // or whatever is G in this scale and projection
        this.target.resetMatrix();

        if (this.target.position[1] < -500) {
            this.state = E3D_DONE;
            this.target.visible = false;
        } 
    }  
}

function rot0() {
    if (this.state == E3D_PLAY) {
        this.target.rotation[1] += this.timer.delta;
        this.target.resetMatrix();
    }  
}

function shotgunAnim() {
    let numPellets = 10;

    if (this.state == E3D_RESTART) {
        vec3.copy(this.target.position, this.scn.camera.position);
        var offset = this.scn.camera.adjustToCamera(vec3.fromValues(5, -5, -2));

        this.data.vect = [];
        this.data.act = [];
        this.data.ttl = 2.0;

        this.target.setSize(this.target.srcNumElements * numPellets);

        for (let i = 0; i < numPellets; ++i) {
            //new pellet
            this.target.copySource(this.target.srcNumElements * i);

            //some random noise
            var dx = Math.random()*20-10;
            var dy = Math.random()*20-10;
            var dz = Math.random()*4-2;
            
            this.data.vect.push(this.scn.camera.adjustToCamera(vec3.fromValues(dx*3, dy*3, -750 - dz)));
            
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var idx = (i*this.target.srcNumElements) + j;
                var o2 = [  offset[0] + (dx/10)  ,  offset[1] + (dy/10)  ,  offset[2] + (dz/10)  ];
                var b = this.target.getVertex3f(idx);
                vec3.add(b, o2, b)
                this.target.setNormal3f(idx, vec3_origin);
            }
        }

        this.state = E3D_PLAY;
        this.target.visible = true;
        this.scn.addEntity(this.target, false);
        this.target.scale = [0.1, 0.1, 0.1];
        this.target.resetMatrix();
    } 

    if (this.state == E3D_PLAY) {

        for (let i = 0; i < numPellets; ++i) {
            var v = vec3.scale(vec3_dummy, this.data.vect[i], timer.delta);
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var b = this.target.getVertex3f((i*this.target.srcNumElements) + j);
                var p0 = [ b[0], b[1], b[2] ]; 
                vec3.add(b, v, b);
                var p1 = [ b[0], b[1], b[2] ]; 

                // collision detection !
                // vector->sph col det
                //testSph.addWireCross(loc, 2, [1,1,1]);


            }
        }

        this.data.ttl -= timer.delta;
        if (this.data.ttl  <= 0) {
            this.state = E3D_DONE;
            this.target.visible = false;
        } 
    }  

}

function reflect(inc, norm) {
    //r = v - 2.0 * dot(v, n) * n
    vec3.normalize(norm, norm);

    var result = [0 ,0 ,0];
    var dr = vec3.dot(inc, norm);

    vec3.scale(result, norm, dr * 2.0);
   // vec3.scale(result, result, 2.0);
    vec3.subtract(result, inc, result) // out a b return a-b

    return result;
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
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets + " nAnims: " + animations.length;
}



});