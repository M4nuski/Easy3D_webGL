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


// Engine Content and state


var animations = [];
var testSph, targetVector, iplanes, dev_CD, hitsMarkers, phyTracers; // entities
var show_DEV_CD = false;
var moveTarget = "p";
var hitPoints = [0,0,0];
var DEV_anim_active = true;
var vec1v, vec1e, vec2v, vec2e;


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
    "nAnims: " + padStart(""+animations.length, " ", 6) + ", nHitTests: " + nHitTest + "<br />" +
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
    dev_CD.visible = true;
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
    var hit = VectSphHit(n, so, testSph.CD_sph_rs[0])
     // if (hit != false) {
        hitsMarkers.clear();
        // p = targetVector.CD_edge_p[0] + (targetVector.CD_edge_v[0] * d)

        var p = vec3.scale([0, 0, 0], n, hitPoints[0]); 
        vec3.add(p, p, targetVector.CD_edge_p[0]);
        hitsMarkers.addWireSphere(p, 1, [1,0.5,0.5], 8, false);

        p = vec3.scale([0, 0, 0], n, hitPoints[1]); 
        vec3.add(p, p, targetVector.CD_edge_p[0]);
        hitsMarkers.addWireSphere(p, 1, [0.5,1,0.5], 8, false);

        p = vec3.scale([0, 0, 0],n, hitPoints[2]); 
        vec3.add(p, p, targetVector.CD_edge_p[0]);
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


      }
    if (show_DEV_CD) {
        dev_CD.numElements = 0;
        for (let i = 0; i < scn.entities.length; ++i) {
            if (scn.entities[i].vis_culling) dev_CD.addWireSphere(scn.entities[i].position,scn.entities[i].cull_dist * 2, [1,0.5,0], 24, false);
        }
        dev_CD.visible = true;
    } else {
        dev_CD.visible = false;
    }
}




function timerTick() {  // Game Loop
    inputs._posSpeed = inputs.checkCommand("action_speed", false) ? 250 : 50;
    inputs.processInputs(timer.delta);
    inputs.smoothRotation(6);
    inputs.smoothPosition(6);

    updateStatus();
    nHitTest = 0;

    if (inputs.checkCommand("action1", true)) {
      //  console.log("action0", true);
        let newSph = scn.cloneEntity("sph", "sph" + timer.lastTick);
        animations.push(new E3D_animation("ball throw" + timer.lastTick, sphAnim, newSph, scn, timer));
        animations[animations.length-1].restart();
    }
    if (inputs.checkCommand("action0", true)) {
      //  console.log("action1", true);    
      DEV_anim_active = true;  
     //   let newPyra = new E3D_entity_dynamicCopy("shotgun " + timer.lastTick, scn.entities[scn.getEntityIndexFromId("pyra")]);          
      //  animations.push(new E3D_animation("shotgun " + timer.lastTick, shotgunAnim, newPyra, scn, timer));
       // animations[animations.length-1].restart();
    }

    if (inputs.checkCommand("action_toggle_CD", true)) show_DEV_CD = !show_DEV_CD;
    if (inputs.checkCommand("action_switch_ctrl_player", true)) moveTarget = "p";
    if (inputs.checkCommand("action_switch_ctrl_sphere", true)) moveTarget = "s";
    if (inputs.checkCommand("action_switch_ctrl_vector", true)) moveTarget = "v";
    if (inputs.checkCommand("action_switch_ctrl_edge", true)) moveTarget = "e";

    if (scn.state == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }   
}




// animator functions

function sphAnim(cand) {

    if (this.state == E3D_PLAY) {

        if (cand) { // test and lock (pass 2)
        this.target.resetMatrix();  // update CD data  
        phyTracers.line(this.data.last_position, this.target.position, false, [1, 1, 1]);
        var colList = [] ; // array of [entIdx, cdIdx, penetration, srcType, trgtType, normal]

            // for each other entity
            for (let i = 0; i < cand.length; ++i ) if (cand[i]) {
                if (this.scn.entities[i].CD_sph > 0) {  // collision detection - this.sph to other sph  

                    for (let j = 0; j < this.scn.entities[i].CD_sph; ++j) {
                        nHitTest++;
                        // TODO CD as vect and inflated target sph for fast speed interpolation
                        var d = vec3.distance(this.scn.entities[i].CD_sph_p[j], this.target.CD_sph_p[0]);
                        var minD = this.target.CD_sph_r[0] + this.scn.entities[i].CD_sph_r[j];
                        if (d <= minD) {      
                            var penetration = (minD - d);
                            var n = sub3f(this.target.CD_sph_p[0], this.scn.entities[i].CD_sph_p[j]);
                            //colList.push([i, j, penetration, "sph", "sph", n]);
                            vec3.normalize(n, n);
                            vec3.scale(this.data.spd, this.data.spd, 0.8);
                            phyTracers.moveCursorTo(this.data.last_position);
                            var d = vec3.dot(this.data.spd, n);
                            if (d < 0.0) { 
                                this.data.spd = reflect(this.data.spd, n);
                            } else { 
                                 var sl = vec3.length(this.data.spd);
                                this.data.spd = scale3f(n, sl); 
                            }
                            vec3.scaleAndAdd(this.target.position, this.target.position, n, penetration);
                            this.target.resetMatrix();
                            phyTracers.lineTo(this.target.position, false, [1, 0, 0]);
                        }
                    }
                } // sph

                if (this.scn.entities[i].CD_iPlane > 0) {  // collision detection - this.sph to infinite plane
                    var v = vec3.subtract([0, 0, 0], this.target.CD_sph_p[0], this.scn.entities[i].position);
                    var last_v = vec3.subtract([0, 0, 0], this.data.last_position, this.scn.entities[i].position);

                    for (let j = 0; j < this.scn.entities[i].CD_iPlane; ++j) {
                        nHitTest++;

                        var dist = vec3.dot(v, this.scn.entities[i].CD_iPlane_n[j]) - this.scn.entities[i].CD_iPlane_d[j];
                        var last_Dist = vec3.dot(last_v, this.scn.entities[i].CD_iPlane_n[j]) - this.scn.entities[i].CD_iPlane_d[j];
                                        
                        var sgn = (dist > 0) ? 1 : -1;
                        var last_sgn = (last_Dist > 0) ? 1 : -1; 
         
                        dist = Math.abs(dist);
                        last_Dist = Math.abs(last_Dist);

                        if (dist < 0.0001) { sgn = last_sgn; dist = 0; }
                        if (last_Dist < 0.0001) { last_sgn = sgn; last_Dist = 0; }
                    
                        if ( dist < this.target.CD_sph_r[0]) { 
                     
                            var penetration = (sgn == last_sgn) ? (this.target.CD_sph_r[0] - dist) : (this.target.CD_sph_r[0] + dist);                            
                            penetration *= last_sgn;
                            
                            var d = vec3.dot(this.data.spd, this.scn.entities[i].CD_iPlane_n[j] );
                            if (last_sgn * d < 0.0) this.data.spd = reflect(this.data.spd, this.scn.entities[i].CD_iPlane_n[j]);
                            
                            phyTracers.moveCursorTo(this.data.last_position);
                            vec3.scale(this.data.spd, this.data.spd, 0.8);
                            vec3.scaleAndAdd(this.target.position, this.target.position, this.scn.entities[i].CD_iPlane_n[j], penetration);
                            this.target.resetMatrix();
                            phyTracers.lineTo(this.target.position, false, [1, 0, 0]);


                        } else { // if sph itself didn't hit plane, test as vector from last position to this one
                            dist *= sgn;
                            last_Dist *= last_sgn;
                            if ( ( (dist > 0) && (last_Dist < 0) ) || ( (dist < 0) && (last_Dist > 0) ) ) {
                     //         log("hit sph(vect)-iPlane: " + this.target.id + " - " + this.scn.entities[i].id);
                                var penetration = (/*Math.abs(last_Dist) +*/ Math.abs(dist)) * last_sgn;
                                colList.push([i, j, penetration, "sph/vect", "iPlane", this.scn.entities[i].CD_iPlane_n[j]])
                            }
        
                        }
                    }         
                } // iplane

               // if (this.scn.entities[i].CD_edge > 0) {  // collision detection - this.sph to edge vector  

                 //   for (let j = 0; j < this.scn.entities[i].CD_edge; ++j) {
                //        nHitTest++;

                        // subtract (out, a, b);// out = a - b
                    //    var so = vec3.subtract(vec3_dummy, this.target.CD_sph_p[0], this.scn.entities[i].CD_edge_p[j]);
                   //     var t = SphEdgeHit(this.scn.entities[i].CD_edge_v[j], so, this.target.CD_sph_rs[0]);                    
                  //      if (t != false) colList.push( [i, j, t, "sph", "edge", vec3.normalize(vec3_dummy, this.scn.entities[i].CD_edge_v[j]) ] );    
                 //      // var d = vec3.squaredDistance(this.scn.entities[i].CD_sph_p[j], this.target.CD_sph_p[0]);
                       // var minD = this.target.CD_sph_rs[0] + this.scn.entities[i].CD_sph_rs[j];
                     /*   if (d <= minD) {
                        //  log("hit sph-sph: " + this.target.id + " - " + this.scn.entities[i].id);
                            var penetration = Math.sqrt(minD) - Math.sqrt(d);
                            var n = [this.target.CD_sph_p[0][0] - this.scn.entities[i].CD_sph_p[j][0], this.target.CD_sph_p[0][1] - this.scn.entities[i].CD_sph_p[j][1], this.target.CD_sph_p[0][2] - this.scn.entities[i].CD_sph_p[j][2] ];
                            //colList.push([i, j, penetration, "sph", "sph", n]);
                              splos.moveTo(this.target.position);
                            this.data.spd = reflect(this.data.spd, n);
                            vec3.scaleAndAdd(this.target.position, this.target.position, n, penetration);
                            this.target.resetMatrix();
                              splos.lineTo(this.target.position, false);
                        }*/
                 //   } // target edges

               // } // edge CD
            


            } // end for each other entity perform hit test

            // Go trough colList and resolve CD for vect
            // [i, j, penetration, "sph/vect", "iPlane", this.scn.entities[i].CD_iPlane_n[j]]
            if (colList.length > 0) {

               phyTracers.moveCursorTo(this.target.position); 
                colList.sort((a, b) => { return b[2] - a[2]; } );
                this.data.spd = reflect(this.data.spd, colList[0][5]);
                vec3.scale(this.data.spd, this.data.spd, 0.8);
                vec3.scaleAndAdd(this.target.position, this.target.position, colList[0][5], colList[0][2]);
                this.target.resetMatrix();
                phyTracers.lineTo(this.target.position, false, [1, 0, 0]);
             //     splos.lineTo(this.target.position, false);
            }

            this.data.spd[1] -= this.timer.delta * 386.22; //9.81; // or whatever is G in this scale and projection
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

        this.data.spd = this.scn.camera.adjustToCamera(vec3.scale(vec3_dummy, vec3_nz, inputs.checkCommand("action_speed", false) ? 750 : 250));
        this.data.spd[0] += rndPM(1);
        this.data.spd[1] += rndPM(1);
        this.data.spd[2] += rndPM(1);
        this.data.ttl = 30;
        
        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.resetMatrix();
        this.data.last_position = this.target.position.slice();
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
                 //       splos.addWireCross(newloc, 2, [1,1,1]);
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



// Physics Methods

// Reflection vector, incident vector vs normal of surface
function reflect(inc, norm) {
    //r = v - 2.0 * dot(v, n) * n
    vec3.normalize(norm, norm);
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

    return (t0 < t1) ? t0 : t1;
}



}); // DOMContentLoaded