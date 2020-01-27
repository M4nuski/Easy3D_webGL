// Easy3D_WebGL
// Main testing program for physics and collisiion detection
// Emmanuel Charette 2017-2020

"use strict"

document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");

log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const logElement = document.getElementById("logDiv");
const status = document.getElementById("statusDiv");

log("Set DOM Events");
window.addEventListener("resize", winResize); // To reset camera matrix


// Engine Config


const _fieldOfView = 45 * DegToRad;
const _zNear = 0.1;
const _zFar = 1024.0;


// Engine Stats


var usepct_smth = 0; //usage pct smoothed value
var nHitTest = 0;
var nCDPasses = 0;
var nHits = 0;

// Engine Content and state


var animations = [];
var testSph, targetVector, iplanes, dev_CD, hitsMarkers, phyTracers; // entities
var show_DEV_CD = false;
var moveTarget = "p";
var hitPoints = [0,0,0];
var DEV_anim_active = true;
var vec1v, vec1e, vec2v, vec2e;
var sphCounter = 0;
var DEV_lastAnimData = null;
var nbCDpasses = 0;
var gAccel = 0;

// Engine Core Components


var gl; // webGL canvas rendering context
var timer = new E3D_timing(false, 50, timerTick);
var scn;  // E3D_scene
var inputs = new E3D_input(can, true, true, false, false); // Mouse and Keyboard


log("Session Start", false);


initEngine();


function winResize() {
    var winWidth  = gl.canvas.offsetWidth;
    var winHeight = gl.canvas.offsetHeight;

    log("Resize to " + winWidth + " x " + winHeight, false);

    gl.canvas.width  = winWidth;
    gl.canvas.height = winHeight;

    gl.viewport(0, 0, winWidth, winHeight);
    scn.camera.resize(winWidth, winHeight, _fieldOfView, _zNear, _zFar);
}


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
    status.innerHTML = 
    "pX:" + padStart(""+Math.floor(scn.camera.position[0]), " ", 6) + 
    ", pY:" + padStart(""+Math.floor(scn.camera.position[1]), " ", 6) + 
    ", pZ:" + padStart(""+Math.floor(scn.camera.position[2]), " ", 6) + 
    ", rX: " + padStart(""+Math.floor(inputs.rx * RadToDeg), " ", 5) + 
    ", rY:"+ padStart(""+Math.floor(inputs.ry * RadToDeg), " ", 5) + "<br />" +
    "delta:" + padEnd(""+timer.delta, "0", 5) + 
    "s, usage: " + padStart(""+Math.floor(usepct_smth), " ", 3) +
    "%, nElements: " + scn.drawnElemenets + "<br />"+
    "nAnims: " + padStart(""+animations.length, " ", 6) + ", nHitTests: " + nHitTest + ", nbHits: " + nHits + ", nbCDpasses: " + nbCDpasses + "<br />" +
    hitPoints[0] + " " +  hitPoints[1] + " " +  hitPoints[2] + " dotv1v2 " + vec3.dot(vec1v, vec2v);
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
        scn = new E3D_scene("mainScene", gl, can.offsetWidth, can.offsetHeight, vec4.fromValues(0.2, 0.2, 0.2, 1.0), 512);

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
        scn.camera = new E3D_camera_persp("cam1f", can.offsetWidth, can.offsetHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = true;
       // scn.camera.moveTo(-32, 64, 160, 20 * DegToRad, 10 * DegToRad, 0);
       scn.camera.moveTo(50, -40, 200, -0 * DegToRad, -0 * DegToRad, 0);
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

        log("Engine Initialized", false);
    } catch (e) {
        log(e, false);

        return; 
    }

    // Input configugarion // TODO in JSON config file
    inputs.keyMap.set("action_toggle_CD", "Backquote"); // #
    inputs.keyMap.set("action_switch_ctrl_player", "Digit1");
    inputs.keyMap.set("action_switch_ctrl_sphere", "Digit2");
    inputs.keyMap.set("action_switch_ctrl_vector", "Digit3");
    inputs.keyMap.set("action_switch_ctrl_edge", "Digit4");
    inputs.keyMap.set("action_anim_clear", "Digit0");
    inputs.keyMap.set("action_anim_replay", "KeyR");

    inputs.keyMap.set("action_speed", "ShiftLeft");

    // Scene entity creation // TODO in JSON scene file
    testSph = new E3D_entity_wireframe_canvas("wireSphereTest");
    testSph.addWireSphere([0,0,0], 50, [1,0,0], 64, true, 8);
    testSph.addWireSphere([0,0,-50], 50, [0,1,0], 48, true, 7);
    testSph.addWireSphere([0,0,-100], 50, [0,1,0], 36, true, 6);
    testSph.addWireSphere([0,0,-150], 50, [0,1,0], 25, true, 5);
    testSph.addWireSphere([0,0,-200], 50, [0,1,0], 16, true, 4);
    testSph.addWireSphere([0,0,-250], 50, [0,1,0], 16, true, 3);
    testSph.addWireSphere([0,0,-300], 50, [0,1,0], 16, true, 2);
    testSph.addWireSphere([0,0,-350], 50, [0,1,0], 16, true, 1);
    testSph.visible = true;
    scn.addEntity(testSph);

    var sph = new E3D_entity_wireframe_canvas("sph");
    sph.addWireSphere([0,0,0], 16, [1,1,0], 32, true, 8);
    sph.visible = false;
    scn.addEntity(sph);

    iplanes = new E3D_entity_wireframe_canvas("infinitePlanes");
    iplanes.addPlane([0, -50, 0], [PIdiv2, 0, 0], 2048, 2048, 64, [1,1,0], true, false);
    iplanes.addPlane([50, -50, 0], [PIdiv2, 0, 0.5], 2048, 2048, 64, [1,0,1], true, false);
    iplanes.addPlane([-50, -50, 0], [PIdiv2, 0, -0.5], 2048, 2048, 64, [0,1,1], true, false);
    iplanes.visible = true;
    //iplanes.vis_culling = false;
    scn.addEntity(iplanes);

   /* fplanes = new E3D_entity_wireframe_canvas("finitePlanes");
    fplanes.position = [25, -10, 25];
    fplanes.addPlane([-25, 10, 25], [0, 0, 0], 20, 20, -1, [1,0,0], false, true);
    fplanes.addPlane([25, -10, 0], [0, PIdiv2, 0], 10, 40, -1, [0,1,0], false, true);
    fplanes.addPlane([0, 30, 0], [PIdiv2/2, PIdiv2, PIdiv2/2], 30, 30, 2, [0.5,0.5,0.5], false, true);
    fplanes.visible = true;
    //fplanes.cull_dist2 = 4200;
    scn.addEntity(fplanes);*/

    targetVector = new E3D_entity_wireframe_canvas("vectorHitTest");
    targetVector.position = [25, 25, 25];
    targetVector.line([0, 0, 0], [0, 100, 0], false, [1,1,1]);
    targetVector.pushCD_edge([0, 0, 0], [0, 100, 0]);
    targetVector.visible = true;
    //targetVector.vis_culling = false;
    scn.addEntity(targetVector);


    /*cubes = new E3D_entity_wireframe_canvas("cubesTest");
    cubes.position = [0, 50, -50];
    cubes.addWireCube([0, -50, 0], [0,0,0], [15, 15, 15], [1,0,0], true, false, false );
    cubes.addWireCube([0, -25, 0], [0,0,0], [10, 10, 10], [0,1,0], true, true, false );
    cubes.addWireCube([0, 0, 0], [0,0,0], [5, 5, 5], [0,0,1], true, false, true );
    cubes.addWireCube([0, 25, 0], [0,0,0], [10, 10, 10], [1,0,1], true, true, true );
    cubes.visible = true;
    //cubes.cull_dist2 = 4200;
    scn.addEntity(cubes);*/

    hitsMarkers = new E3D_entity_wireframe_canvas("CD_hits_markers");
    hitsMarkers.addWireSphere([0,0,0], 1, [1,1,1], 8, false);
    hitsMarkers.visible = true;
    hitsMarkers.vis_culling = false;
    scn.addEntity(hitsMarkers);

    phyTracers = new E3D_entity_wireframe_canvas("PHY_Traces");
    phyTracers.visible = true;
    phyTracers.vis_culling = false;
    scn.addEntity(phyTracers);


    dev_CD = new E3D_entity_wireframe_canvas("DEV/CD_Display");
    dev_CD.visible = false;
    dev_CD.vis_culling = false;
    scn.addEntity(dev_CD);

    vec1e = new E3D_entity_axis("reflected", true, 10, false);
    vec1v = vec3.fromValues(0, 1, 0);
    vec1e.updateVector(vec1v);
    vec1e.visible = true;
    scn.addEntity(vec1e);

    vec2e = new E3D_entity_axis("incident", true, 10, false);
    vec2v = vec3.fromValues(0, -1, 0);
    vec2e.position = [0.5, 0, 0.5];
    vec2e.resetMatrix();
    vec2e.updateVector(vec2v);
    vec2e.visible = true;
    scn.addEntity(vec2e);

    // Activate timer and set scene as active

    timer.run();
    scn.state = E3D_ACTIVE;
}


function prepRender() {

    // Move per inputs
    switch (moveTarget) {
        case 'e':
            targetVector.moveBy([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth]);
            targetVector.rotateBy([inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth]);
            targetVector.resetMatrix();
            break;
        case 's':
            testSph.moveByLocal([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth]);
            testSph.rotateBy([inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth]);
            testSph.resetMatrix();
            break;
        default:
            scn.camera.moveBy(-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth, 
                               inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth);
      }

      vec3.rotateX(vec2v, vec2v, vec3_origin, 0.2 * timer.delta);
      vec2e.updateVector(vec2v);
      vec1v = reflect(vec2v, [0, 1, 0]);
      vec1e.updateVector(vec1v);

/*
      targetVector.CD_edge_p[0]; // edge origin
      targetVector.CD_edge_v[0]; // edge vector
      testSph.CD_sph_p[0]; // sphere origin
      testSph.CD_sph_r[0]; // sphere radius
      testSph.CD_sph_rs[0]; // sphare radius squared
*/
    var so = [0,0,0];
    var n = [0,0,0];
    vec3.subtract(so, testSph.CD_sph_p[0], targetVector.CD_edge_p[0]);
    vec3.normalize(n, targetVector.CD_edge_v[0]);
    //copy3f3fm(n, targetVector.CD_edge_v[0]);
    var hit = VectSphHit(n, so, testSph.CD_sph_rs[0]);
    //var l = vec3.length(n);
   // l = l*l;
     // if (hit != false) {
        hitsMarkers.clear();
        // p = targetVector.CD_edge_p[0] + (targetVector.CD_edge_v[0] * d)

        var p = vec3.scale([0, 0, 0], n, hitPoints[0]); 
        add3f3fm(p, targetVector.CD_edge_p[0]);
        hitsMarkers.addWireSphere(p, 1, [1,0.5,0.5], 8, false);

        p = vec3.scale([0, 0, 0], n, hitPoints[1]); 
        add3f3fm(p, targetVector.CD_edge_p[0]);
        hitsMarkers.addWireSphere(p, 1, [0.5,1,0.5], 8, false);

        p = vec3.scale([0, 0, 0],n, hitPoints[2]); 
        add3f3fm(p, targetVector.CD_edge_p[0]);
        hitsMarkers.addWireSphere(p, 1, [0.5,0.5,1], 8, false);
      //}

      hitsMarkers.line(testSph.position, [0,0,0], false, [1,0,0]);
      vec1v = sub3f([0,0,0], testSph.position);
      vec2v = [0, 1, 0];
   //   vec1v = reflect(vec1v, [0, 1, 0]);
      //vec3.scale(vec1v, vec1v, 10.0);
    //  hitsMarkers.line(vec1v, [0,0,0], false, [0,1,0]);

    if (DEV_anim_active) {
    // Animate / Calculate Expected target position and state

        // Cleanup
        for (let i = animations.length -1; i >=0; --i) if (animations[i].state == E3D_DONE) {
            scn.removeEntity(animations[i].target.id, false);
            animations.splice(i, 1);
        } 

        // First pass, calculate expected next position
        for (let i = 0; i < animations.length; ++i) {
            animations[i].animateFirstPass();
        } 

        // calc distance every time top 100% of 0.050s at 800 entities 
        // map with distance and hash of ID 100 at 200 entities
        // list in animation target entity at 700
        //  list in both and map to lookup at 600

        //  multi pass, only add if closest max at 600

        // Cull Collission Detection
        for (let i = 0; i < animations.length; ++i) { // CD culling
            if (animations[i].deltaLength > -1) {
                animations[i].candidates = [];
                for (let j = 0; j < scn.entities.length; ++j) {// all entities are targets
                    animations[i].candidates[j] = false;
                    if ((scn.entities[j].collisionDetection) && (animations[i].target.id != scn.entities[j].id) ) { 
                        var deltaP = vec3.distance( animations[i].target.position, scn.entities[j].position);
                        var deltaD = animations[i].deltaLength + animations[i].target.cull_dist + scn.entities[j].cull_dist; 
                        animations[i].candidates[j] = (scn.entities[j].CD_iPlane > 0) || ( deltaP <= deltaD );  
                    }
                }
            }
        }

        nbCDpasses = 0;
        var numIter = 10;
        var hitDetected = true;
        var newHit;
        while ((numIter > 0) && (hitDetected)){
            hitDetected = false;
            for (let i = 0; i < animations.length; ++i) {
                newHit = animations[i].animateRePass();
                hitDetected = newHit || hitDetected;
            }
            numIter--;
        }

        nbCDpasses = 10 - numIter;

        // Last pass, post-process animation state after collision detection
        for (let i = 0; i < animations.length; ++i) animations[i].animateLastPass();
    }



    if (show_DEV_CD) {
        dev_CD.clear();
        for (let i = 0; i < scn.entities.length; ++i) {
            if (scn.entities[i].vis_culling) dev_CD.addWireSphere(scn.entities[i].position,scn.entities[i].cull_dist * 2, [1,0.5,0], 24, false);
            for (let j = 0; j < scn.entities[i].CD_sph; ++j) {
                dev_CD.addWireSphere(scn.entities[i].CD_sph_p[j], scn.entities[i].CD_sph_r[j] * 2, [1,0.5,0.5], 4, false);
            }
            for (let j = 0; j < scn.entities[i].CD_iPlane; ++j) {
                var pos = scaleAndAdd3f(scn.entities[i].position, scn.entities[i].CD_iPlane_n[j], scn.entities[i].CD_iPlane_d[j]);
                dev_CD.moveCursorTo(pos);
                var norm = scale3f(scn.entities[i].CD_iPlane_n[j], 10);
                dev_CD.lineBy(norm, false, [1.0,1.0,1.0]);
            }

        }
        dev_CD.visible = true;
        phyTracers.visible = true;
    } else {
        dev_CD.visible = false;
        phyTracers.visible = false;
    }
}




function timerTick() {  // Game Loop
    inputs._posSpeed = inputs.checkCommand("action_speed", false) ? 250 : 50;
    inputs.processInputs(timer.delta);
    inputs.smoothRotation(6);
    inputs.smoothPosition(6);

    gAccel = timer.delta * 386.22;

    updateStatus();
    nHitTest = 0;
    nHits = 0;
    if (inputs.checkCommand("action1", true)) {
      //  console.log("action0", true);
        let newSph = scn.cloneEntity("sph", "sph" + sphCounter);
        animations.push(new E3D_animation("ball throw" + sphCounter++, newSph, scn, timer, anim_sph_firstPass, anim_sph_rePass, anim_sph_endPass));
        animations[animations.length-1].restart();
    }
    if (inputs.checkCommand("action2", false)) {
        //  console.log("action0", true);
        for (var i = 0; i < 32; ++i) {
            let newSph = scn.cloneEntity("sph", "sph" + sphCounter);
            animations.push(new E3D_animation("ball throw" + sphCounter++, newSph, scn, timer, anim_sphRain_firstPass, anim_sph_rePass, anim_sph_endPass));
            animations[animations.length-1].restart();
        }
      }
    if (inputs.checkCommand("action0", true)) { 
        DEV_anim_active = !DEV_anim_active;  
    }

    if (inputs.checkCommand("action_toggle_CD", true)) show_DEV_CD = !show_DEV_CD;
    if (inputs.checkCommand("action_switch_ctrl_player", true)) moveTarget = "p";
    if (inputs.checkCommand("action_switch_ctrl_sphere", true)) moveTarget = "s";
    if (inputs.checkCommand("action_switch_ctrl_vector", true)) moveTarget = "v";
    if (inputs.checkCommand("action_switch_ctrl_edge", true)) moveTarget = "e";

    if (inputs.checkCommand("action_anim_clear", true)) {
        for (let i = animations.length -1; i >=0; --i) {
            scn.removeEntity(animations[i].target.id, false);
            animations.splice(i, 1);
        } 
    }
    if (inputs.checkCommand("action_anim_replay", true)) {
        if (DEV_lastAnimData != null) {
            let newSph = scn.cloneEntity("sph", "sph" + sphCounter);
            animations.push(new E3D_animation("ball throw" + sphCounter++, newSph, scn, timer, anim_sph_firstPass, anim_sph_rePass, anim_sph_endPass));
            
            animations[animations.length - 1].target.position =copy3f3fr(DEV_lastAnimData.pos);
            animations[animations.length - 1].data.last_position = copy3f3fr(DEV_lastAnimData.pos);
            animations[animations.length - 1].data.spd = copy3f3fr(DEV_lastAnimData.spd);
            animations[animations.length - 1].data.ttl = 30;
            animations[animations.length - 1].target.visible = true;
            animations[animations.length - 1].target.resetMatrix();
            animations[animations.length - 1].state = E3D_PLAY;
        }
    }

    if (scn.state == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }   
}



function CheckForAnimationCollisions(self){
    var hitDetected = false;
    /*
    self.delta = [0, 0, 0]; // Position delta
    self.deltaLength = -1; // length of self.delta during animation step for culling, -1 anim target is not a source
    self.closestCollision = []; // targetMarker, t0, n, firstHitPos, hitDescriptionText
    self.candidates = []; // for all other entities, bool to test for CD
    self.lastHitIndex = -1;
    //  [animIndex, entityIndex, t, normal, firstHitPosition] // t is fraction of self.deltaLength done when firstHit        
*/
        // for each candidate entity                      
    for (let i = 0; i < self.candidates.length; ++i) if (self.candidates[i] == true) {

        var vectOrig = sub3f(self.target.CD_sph_p[0], self.delta);
        var pathVect = scale3f(self.delta, 1.0 / self.deltaLength);
        
        // collision detection - self.sph to other sph  
        if ((self.target.CD_sph > 0) && (self.scn.entities[i].CD_sph > 0)) {
            


            for (let j = 0; j < self.scn.entities[i].CD_sph; ++j) {
                var marker = i+"s"+j;
                if (marker != self.lastHitIndex) {
                    nHitTest++;

                    var sumR = self.target.CD_sph_r[0] + self.scn.entities[i].CD_sph_r[j];
                    var sphOffset = sub3f(self.scn.entities[i].CD_sph_p[j], vectOrig);
                    var hitRes = VectSphHit(pathVect, sphOffset, sumR * sumR); 

                    if (isFinite(hitRes) && (hitRes != false) && (hitRes <= self.deltaLength) /*&& (hitRes >= 0.0)*/) {
                        if (hitRes < 0.0) hitRes = 0.0;
                        var t0 =  hitRes / self.deltaLength;
                        if ((!hitDetected) || ((hitDetected) && (t0 < self.closestCollision[1]))) {
                            var firstHit = scaleAndAdd3f(self.data.last_position, pathVect, hitRes);
                            var hitNormal = sub3f(firstHit, self.scn.entities[i].CD_sph_p[j]);
                            hitDetected = true;
                            self.closestCollision = [marker, t0, hitNormal, firstHit, "Sph-Sph"];
                        }
                    }
                } 
            }
        } // sph



        // collision detection - self.sph to infinite plane
        if ((self.target.CD_sph > 0) && (self.scn.entities[i].CD_iPlane > 0)) {  

            for (let j = 0; j < self.scn.entities[i].CD_iPlane; ++j) {
                var marker = i+"ip"+j;
                if  (marker != self.lastHitIndex) {
                    nHitTest++;

                    // TODO find side first and only process appropriate offset and normal
                    var offsetP = scale3f(self.scn.entities[i].CD_iPlane_n[j], self.scn.entities[i].CD_iPlane_d[j] + self.target.CD_sph_r[0]);
                    var offsetM = scale3f(self.scn.entities[i].CD_iPlane_n[j], self.scn.entities[i].CD_iPlane_d[j] - self.target.CD_sph_r[0]);
                    var planePosOffsetP = add3f(self.scn.entities[i].position, offsetP);
                    var planePosOffsetM = add3f(self.scn.entities[i].position, offsetM);

                    var hitResP = planeIntersect(planePosOffsetP, self.scn.entities[i].CD_iPlane_n[j], vectOrig, pathVect);
                    var hitResM = planeIntersect(planePosOffsetM, self.scn.entities[i].CD_iPlane_n[j], vectOrig, pathVect);
                    
                    var hit = 0;

                    // pre cull results
                    if (hitResP > self.deltaLength) hitResP = false;
                    if (hitResM > self.deltaLength) hitResM = false;

                    // obvious cases
                    if ( hitResP && !hitResM) hit = 1;
                    if (!hitResP &&  hitResM) hit = -1;
                    
                    // dual cases
                    if (hitResP && hitResM) {
                        if ((hitResP > 0.0) && (hitResM > 0.0)) { // both positive
                            hit = (hitResP < hitResM) ? 1 : -1;
                        } else if ((hitResP < 0.0) && (hitResM < 0.0)) {  // both negative
                            hit = (hitResP > hitResM) ? 1 : -1;
                        } else {  // one negative and one positive
                            hit = (hitResP < 0.0) ? 1 : -1;
                        }
                    }

                    if (hit == 1) {

                        var t0 = hitResP / self.deltaLength;
                        if ((!hitDetected) || ((hitDetected) && (t0 < self.closestCollision[1]))) {
                            var firstHit = scaleAndAdd3f(vectOrig, pathVect, hitResP - 0.05);
                            if (show_DEV_CD) phyTracers.addWireSphere(firstHit, 16, [1,0,0], 16, false, 4);

                            var origOffset = sub3f(vectOrig, planePosOffsetP);

                            var n = copy3f3fr(self.scn.entities[i].CD_iPlane_n[j]);
                            if (vec3.dot(origOffset, n) < 0.0) scale3fm(n, -1);
                
                            hitDetected = true;
                            if (t0 < 0.0) t0 = 0;
                            self.closestCollision = [marker, t0, n, firstHit, "Sph-iPlane"];
                        }

                    } else if (hit == -1) {

                        var t0 = hitResM / self.deltaLength;
                        if ((!hitDetected) || ((hitDetected) && (t0 < self.closestCollision[1]))) {
                            var firstHit = scaleAndAdd3f(vectOrig, pathVect, hitResM - 0.05);
                            if (show_DEV_CD) phyTracers.addWireSphere(firstHit, 16, [1,0,0], 16, false, 4);

                            var origOffset = sub3f(vectOrig, planePosOffsetM);

                            var n = copy3f3fr(self.scn.entities[i].CD_iPlane_n[j]);
                            if (vec3.dot(origOffset, n) < 0.0) scale3fm(n, -1);  
                
                            hitDetected = true;
                            if (t0 < 0.0) t0 = 0;
                            self.closestCollision = [marker, t0, n, firstHit, "Sph-iPlane"];
                        }
                    }
                }
            }
        }



    } // end for each other entity perform hit test



    return hitDetected;
}

// animator functions

function anim_sph_firstPass() {
    if (this.state == E3D_RESTART) {
        copy3f3fm(this.target.position, this.scn.camera.position);
        this.target.position[1] += 5;
        this.target.rotation[0] = rndPM(PIx2);
        this.target.rotation[1] = rndPM(PIx2);

        this.data.spd = this.scn.camera.adjustToCamera(vec3.scale(vec3_dummy, vec3_nz, inputs.checkCommand("action_speed", false) ? 600 : 300));

        this.data.spd[0] += rndPM(1);
        this.data.spd[1] += rndPM(1);
        this.data.spd[2] += rndPM(1);
        this.data.ttl = 30;
        
        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.resetMatrix();
        this.data.last_position = copy3f3fr(this.target.position);

        DEV_lastAnimData = { pos: copy3f3fr(this.target.position), spd: copy3f3fr(this.data.spd) };

        
    } else if (this.state == E3D_PLAY) {

        copy3f3fm(this.data.last_position, this.target.position);

        vec3.scale(this.delta, this.data.spd, this.timer.delta);  
        add3f3fm(this.target.position, this.delta);
        this.deltaLength = vec3.length(this.delta);

        this.target.resetMatrix();
        this.lastHitIndex = "";
        
        if (show_DEV_CD) phyTracers.line(this.data.last_position,this.target.position, false, [1, 1, 1]);
    }
}
function anim_sphRain_firstPass() {
    if (this.state == E3D_RESTART) {

        this.target.position[0] = rndPM(150);
        this.target.position[1] = 150 + rndPM(50);
        this.target.position[2] = rndPM(500);
        this.target.rotation[0] = rndPM(PIx2);
        this.target.rotation[1] = rndPM(PIx2);

        this.data.spd = [0, 0, 0];

        this.data.spd[0] += rndPM(1);
        this.data.spd[1] += rndPM(1);
        this.data.spd[2] += rndPM(1);
        this.data.ttl = 30;
        
        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.resetMatrix();
        this.data.last_position = copy3f3fr(this.target.position);

        this.data.startedYDelta = this.data.last_position[1];
        this.data.expectedYDelta = 0;
        
    } else if (this.state == E3D_PLAY) {

        copy3f3fm(this.data.last_position, this.target.position);

        vec3.scale(this.delta, this.data.spd, this.timer.delta);   
        add3f3fm(this.target.position, this.delta);
        this.deltaLength = vec3.length(this.delta);

        this.target.resetMatrix();
        this.lastHitIndex = "";

        this.data.startedYDelta = this.data.last_position[1];
        this.data.expectedYDelta = this.delta[1];
    
    }
}
function anim_sph_rePass() {
    if (this.deltaLength > 0) {

        var colDetected = CheckForAnimationCollisions(this);

        if (colDetected) {
            nHits++;
            this.lastHitIndex = this.closestCollision[0];
            // closestCollision = [marker, penetration, n, firstHit, "SphVect-iPlane"];
            //                       0          1       2     3              4
if (this.closestCollision[1] < 0.0) throw "col behind initial position: " + this.closestCollision[1];

            vec3.normalize(this.closestCollision[2], this.closestCollision[2]); // change direction on hit
            this.data.spd = reflect(this.data.spd, this.closestCollision[2]); // reflect per hit normal  
           // this.delta = reflect(this.delta, this.closestCollision[2]); // reflect per hit normal           
           
           if (show_DEV_CD) phyTracers.line(this.data.last_position, this.target.position, false, [1, 0, 0]);
           if (show_DEV_CD) phyTracers.line(this.data.last_position, this.closestCollision[3], false, [0, 1, 0]);            
           
           copy3f3fm(this.data.last_position, this.closestCollision[3]);             
           
           var remainder = 1.0 - this.closestCollision[1]; // fraction remaining
        //   this.data.spd[1] = 1 - this.closestCollision[2][1]; 
           vec3.scale(this.data.spd, this.data.spd, 0.8); // hit "drag"



            var gPenality = gAccel * this.closestCollision[2][1];
            this.data.spd[1] -= gPenality;
            if (this.data.spd[1] < 0.0) this.data.spd[1] = 0.0;
            //    this.data.spd[1] -= gPenality * 0.8;
            
            if (remainder < 0.0) throw "remaining delta is negative " + remainder;
            
            vec3.scale(this.delta, this.data.spd, remainder * this.timer.delta);
            //vec3.scale(this.delta, this.delta, 0.8 * remainder); 
            this.deltaLength = vec3.length(this.delta);
            vec3.add(this.target.position, this.data.last_position, this.delta);  
            
            if (show_DEV_CD) phyTracers.line(this.data.last_position, this.target.position, false, [0, 0, 1]); 

            
            this.target.resetMatrix();
           // this.state = E3D_PAUSE;
        }
        return colDetected;
    } else return false;
}

function anim_sph_endPass() {
    this.data.spd[1] -= gAccel;
    this.data.ttl -= this.timer.delta;

    if (this.data.ttl < 0) {
        this.state = E3D_DONE;
        this.target.visible = false;
    } 
}


// Physics Methods

// Reflection vector, incident vector vs normal of surface
function reflect(inc, norm) {
    //r = v - 2.0 * dot(v, n) * n
   // vec3.normalize(norm, norm);
    var dr2 = 2.0 * (inc[0] * norm[0] + inc[1] * norm[1] + inc[2] * norm[2]);
    return [ inc[0] - (norm[0] * dr2) , inc[1] - (norm[1] * dr2), inc[2] - (norm[2] * dr2) ];
}

// Intersection of vector and sphere, as vector advance into static sphere, arrow like
function VectSphHit(v, so, sr2) { // translated to v origin
    var t0 = 0; 
    var t1 = 0;
   // var sr2 = sr * sr;
    var tca = vec3.dot(so, v);
    hitPoints[0] = tca;
    hitPoints[1] = 0;
    hitPoints[2] = 0;
if (isNaN(tca)) throw "VectSphHit tca NaN";
    if  (tca < 0) return false;
    // sph behind origin

    var d2 = vec3.dot(so, so) - tca * tca;

    if (d2 > sr2) return false;
    // tangential point farther than radius

    var thc = Math.sqrt(sr2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;
    hitPoints[1] = t0;
    hitPoints[2] = t1;
if (isNaN(thc)) throw "VectSphHit thc NaN";
    return (t0 < t1) ? t0 : t1;
}

function planeIntersect(planePos, planeNormal, vectOrigin, vectDirection) {
    var angleCos = vec3.dot(planeNormal, vectDirection);
    hitPoints[3] = angleCos;
	if (angleCos == 0.0) {
        log("parallel");
        return false; // parallel
    }
	var diff = sub3f(planePos, vectOrigin);
    var t = vec3.dot(planeNormal, diff) / angleCos;
    hitPoints[4] = t;
    if (t < 0.0) return false; // derriere    
	return t;
}



}); // DOMContentLoaded