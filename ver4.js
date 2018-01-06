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
var testSph, splos;
var cloned = false;
var animations = [];
var nHitTest = 0;

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
    testSph.addWireSphere([30,0,0], 20, [1,0,0], 24, true);
    testSph.addWireSphere([0,30,0], 20, [0,1,0], 24, true);
    testSph.addWireSphere([0,0,30], 20, [0,0,1], 24, true);
    testSph.visible = true;
    scn.addEntity(testSph, false);

    splos = new E3D_entity_dynamic("splosions");
    splos.visible = true;
    splos.arrayIncrement = 2700; 
    scn.addEntity(splos, false);

    testSph.addPlane([0, 0, -100], [0, 0, 0], 50, 50, 4, [1,1,0], true, false);
    testSph.addPlane([0, 300, 0], [PIdiv2, 0, 0], 450, 450, 20, [0,1,0], true, false);
    testSph.addPlane([225, 300, -225], [0, PIdiv2, 0], 250, 250, 11, [0,1,1], true, false);
    testSph.addPlane([-150, 80, 150], [0, -PIdiv2/2, -PIdiv2/2], 300, 300, 15, [1,1,1], true, false);
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

function sphAnim() {

    if (this.state == E3D_PLAY) {
        this.data.last_CD_sph_p = this.target.CD_sph_p[0].slice();
        vec3.scaleAndAdd(this.target.position, this.target.position, this.data.spd, this.timer.delta);
        this.target.resetMatrix();
    
        testSph.line(this.data.last_CD_sph_p, this.target.CD_sph_p[0], true);

        // for each other entity
        for (let i = 0; i < this.scn.entities.length; ++i ) if (this.target.id != this.scn.entities[i].id) {
        // TODO add CD events to array and pîck closest one

            if (this.scn.entities[i].CD_sph > 0) {  // collision detection - this.sph to other sph  

                for (let j = 0; j < this.scn.entities[i].CD_sph; ++j) {
                    nHitTest++;
                    var d = vec3.squaredDistance(this.scn.entities[i].CD_sph_p[j], this.target.CD_sph_p[0]);
                    var minD = this.target.CD_sph_rs[0] + this.scn.entities[i].CD_sph_rs[j];
                    if (d <= minD) {
                        log("hit sph-sph: " + this.target.id + " - " + this.scn.entities[i].id);
                        var penetration = Math.sqrt(minD) - Math.sqrt(d);
                        var n = [this.target.CD_sph_p[0][0] - this.scn.entities[i].CD_sph_p[j][0], this.target.CD_sph_p[0][1] - this.scn.entities[i].CD_sph_p[j][1], this.target.CD_sph_p[0][2] - this.scn.entities[i].CD_sph_p[j][2] ];
                        this.data.spd = reflect(this.data.spd, n);
                            testSph.moveTo(this.target.position);
                        vec3.scaleAndAdd(this.target.position, this.target.position, n, penetration);
                            testSph.lineTo(this.target.position, false);
                        this.target.resetMatrix();
                    }
                }
            } // sph

            if (this.scn.entities[i].CD_iPlane > 0) {  // collision detection - this.sph to infinite plane
                var v = vec3.subtract([0, 0, 0], this.target.CD_sph_p[0], this.scn.entities[i].position);
                var last_v = vec3.subtract([0, 0, 0], this.data.last_CD_sph_p, this.scn.entities[i].position);

                for (let j = 0; j < this.scn.entities[i].CD_iPlane; ++j) {
                    nHitTest++;

                    var dist = vec3.dot(v, this.scn.entities[i].CD_iPlane_n[j]);
                    var last_Dist = vec3.dot(last_v, this.scn.entities[i].CD_iPlane_n[j]);
                    
                    dist = this.scn.entities[i].CD_iPlane_d[j] + dist;
                    var sgn = (dist > 0) ? 1 : -1;
                    dist = Math.abs(dist) ;

                    last_Dist = this.scn.entities[i].CD_iPlane_d[j] + last_Dist;
                    var last_sgn = (last_Dist > 0) ? 1 : -1;
                    last_Dist = Math.abs(last_Dist) ;

                
                    if ( dist < this.target.CD_sph_r[0]) { 
                        log("hit sph-iPlane: " + this.target.id + " - " + this.scn.entities[i].id);
                        var penetration = (sgn == last_sgn) ? (this.target.CD_sph_r[0] - dist) : (this.target.CD_sph_r[0] + dist);
                        penetration *= last_sgn;
                        this.data.spd = reflect(this.data.spd, this.scn.entities[i].CD_iPlane_n[j]);
                            testSph.moveTo(this.target.position);
                        vec3.scaleAndAdd(this.target.position, this.target.position, this.scn.entities[i].CD_iPlane_n[j], penetration);
                            testSph.lineTo(this.target.position, false);
                        this.target.resetMatrix();

                    }  else { // if sph itself didn't hit plane, test for vector from last position to this one

                        dist *= sgn;
                        last_Dist *= last_sgn;
                        if ( ( (dist > 0) && (last_Dist < 0) ) || ( (dist < 0) && (last_Dist > 0) ) ) {
                            log("hit sph(vect)-iPlane: " + this.target.id + " - " + this.scn.entities[i].id);
                            var penetration = ( Math.abs(last_Dist) +  Math.abs(dist)) * last_sgn;
                            this.data.spd = reflect(this.data.spd, this.scn.entities[i].CD_iPlane_n[j]);
                              testSph.moveTo(this.target.position);
                            vec3.scaleAndAdd(this.target.position, this.target.position, this.scn.entities[i].CD_iPlane_n[j], penetration);
                              testSph.lineTo(this.target.position, false);
                            this.target.resetMatrix();
                        }
    
                    }
                }         
            } // iplane




        } // end for each other entity perform hit test

        this.data.spd[1] -= this.timer.delta * 9.81; // or whatever is G in this scale and projection
        this.data.ttl -= this.timer.delta;

        if (this.data.ttl < 0) {
            this.state = E3D_DONE;
            this.target.visible = false;
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
        this.data.last_CD_sph_p = this.target.CD_sph_p[0].slice();
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

    if (this.state == E3D_PLAY) {

        for (let i = 0; i < numPellets; ++i) if (this.data.act[i]) { // i is pallet index

            // current tranlation vector
            var v = [0, 0, 0];
            var so = [0, 0, 0];
            vec3.scale(v, this.data.vect[i], timer.delta);

            // translate pellet entity elements
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var b = this.target.getVertex3f((i*this.target.srcNumElements) + j); // b is a view in float32array...
                vec3.add(b, v, b);
            }

            // collision detection - this vec (internal) to other sph
            var colList = [] ; // array of (entIdx, cdIdx, t)
            for (var entIdx = 0; entIdx < this.scn.entities.length; ++entIdx) 
                if (this.scn.entities[entIdx].CD_sph > 0) 
                for (var cdIdx = 0; cdIdx < this.scn.entities[entIdx].CD_sph; ++cdIdx) {
                    nHitTest++;
                    vec3.subtract(so, this.scn.entities[entIdx].CD_sph_p[cdIdx], this.data.org[i]);
                    var t = VectSphHit(this.data.vectNorm[i], so, this.scn.entities[entIdx].CD_sph_rs[cdIdx]);
                    
                    if (t != false) colList.push( [entIdx, cdIdx, t] );
                         
            } // end for each sph data of each entities with sph CD

            if (colList.length > 0) {
                var vLen = vec3.length(v);      
                // remove out of range          
                for (cl = colList.length-1; cl >= 0; --cl) if (colList[cl][2] > vLen) colList.splice(cl, 1);
                // if nec sort ascending per item 2 (t)
                if (colList.length > 0) {
                    if (colList.length > 1) colList.sort((a, b) => { return a[2] - b[2];} );

                    //deactive pellet, log, and do something...
                    this.data.act[i] = false;
                    log("Hit sph-sph: ent[" + colList[0][0] + "] sph[" + colList[0][1] +"]");
                    var newloc = vec3.scaleAndAdd([0,0,0], this.data.org[i], this.data.vectNorm[i], colList[0][2]);
                    if (this.scn.entities[colList[0][0]].id.indexOf("sph") > -1) {
                        splode(newloc);
                    } else {
                        testSph.addWireCross(newloc, 2, [1,1,1]);
                    } 
                }
            }
            // update pellet origin
            vec3.add(this.data.org[i], this.data.org[i], v);

        } // end for each active pellet

        this.data.ttl -= timer.delta;
        if (this.data.ttl  <= 0) {
            this.state = E3D_DONE;
            this.target.visible = false;
        }  // ttl
    }   // active

    if (this.state == E3D_RESTART) {
        vec3.copy(this.target.position, this.scn.camera.position);        

        this.data.vect = Array(numPellets);
        this.data.vectNorm = Array(numPellets);
        this.data.act = Array(numPellets);
        this.data.org = Array(numPellets);
        this.data.ttl = 2.0;

        this.target.setSize(this.target.srcNumElements * numPellets);

        for (let i = 0; i < numPellets; ++i) {
            //new pellet
            this.target.copySource(this.target.srcNumElements * i);
            this.data.act[i] = true;
            
            //pellet vector
            this.data.vect[i] = this.scn.camera.adjustToCamera(vec3.fromValues(rndPM(20), rndPM(20), -500 - rndPM(10) ) );
            this.data.vectNorm[i] = vec3.normalize([0,0,0], this.data.vect[i] );

            //pellet origin (world coordinates)
            var offset = this.scn.camera.adjustToCamera(vec3.fromValues(10 + rndPM(5), -15 - rndPM(5),  rndPM(2)));
            this.data.org[i] = vec3.add([0, 0, 0], this.target.position, offset);
            
            //offset pelets vertex by new origin and invalidate normal
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var idx = (i*this.target.srcNumElements) + j;
                var b = this.target.getVertex3f(idx);
                vec3.add(b, offset, b)
                this.target.setNormal3f(idx, vec3_origin);
            }
        }

        this.state = E3D_PLAY;
        this.target.visible = true;
        this.scn.addEntity(this.target, false);
        this.target.resetMatrix();
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
    for (i = 0; i < nvect; ++i) {
        vect[i] = [rndPM(10), rndPM(10), rndPM(10)] ;
        dvect[i] = [rndPM(10), 5+rndPM(10), rndPM(10)] ;
    }
    var idx = 0;
    for (i = 0; i < iter; ++i) {
        var s = 2 - (dim * i);
        for (j=0; j < nvect; ++j) {

            splos.addWireCross(add3f(loc, vect[j]), s, col[idx]);

            idx++;
            if (idx >= col.length) idx = 0;
        }
        for (j = 0; j < nvect; ++j) {
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
    }
}

function updateStatus() {
    usepct_smth = timer.smooth(usepct_smth, timer.usage, 3);
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + "pY:" + Math.floor(scn.camera.position[1]) + "pZ:" + Math.floor(scn.camera.position[2])+ "rX: " + Math.floor(inputs.rx_sum * RadToDeg) + " rY:"+ Math.floor(inputs.ry_sum * RadToDeg) + "<br />" +
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets + "<br />"+
    "nAnims: " + animations.length + " nHitTests: " + nHitTest;
}



});