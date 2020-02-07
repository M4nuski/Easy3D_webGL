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
const dataElement = document.getElementById("dataDiv");

log("Set DOM Events");
window.addEventListener("resize", winResize); // To reset camera matrix


// Engine Config


const _fieldOfView = 45 * DegToRad;
const _zNear = 0.1;
const _zFar = 1024.0;


// Engine Stats

var nHitTest = 0;
var nHits = 0;
var nbCDpasses = 0;



// Engine Content and state


var animations = [];
var testSph, targetEdge, targetEdge2, iplanes, dev_CD, hitsMarkers, phyTracers; // entities
var show_DEV_CD = false;
var moveTarget = "p";
var hitPoints = [0,0,0,0,0];
var DEV_anim_active = true;
var sphCounter = 0;
var DEV_lastAnimData = null;
var gAccel = 0;

// Engine Core Components

// TODO make global in core, add entities and anim, add core switch-over methods, add default engine init methods
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

    status.textContent = 
    "pX:" + padStart(""+Math.floor(scn.camera.position[0]), " ", 6) + 
    ", pY:" + padStart(""+Math.floor(scn.camera.position[1]), " ", 6) + 
    ", pZ:" + padStart(""+Math.floor(scn.camera.position[2]), " ", 6) + 
    ", rX: " + padStart(""+Math.floor(inputs.rx * RadToDeg), " ", 5) + 
    ", rY:"+ padStart(""+Math.floor(inputs.ry * RadToDeg), " ", 5) + "\n" +
    "delta: " + padEnd(""+timer.delta, "0", 5) + 
    "s, usage: " + padStart(""+(timer.usageSmoothed.toFixed(1)), " ", 5) +
    "%, FPS: " + padStart(""+Math.floor(timer.fpsSmoothed), " ", 3) + "\n" +

    "nElements: " + scn.drawnElemenets +
    ", nAnims: " + padStart(""+animations.length, " ", 6) + ", nHitTests: " + nHitTest + ", nbHits: " + nHits + ", nbCDpasses: " + nbCDpasses;
    
    var tc = "";
    for (var i = 0; i < 20; ++i) {
        if (hitPoints[i] != undefined) tc += "[" + padStart(""+i, "0", 2) + "] "+ padStart(hitPoints[i].toFixed(4), " ", 12) + "\n";
    }
    dataElement.textContent = tc;
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
        scn = new E3D_scene("mainScene", gl, can.offsetWidth, can.offsetHeight, [0.2, 0.2, 0.2, 1.0], 512);

        log("Shader Program Initialization", false);
        scn.program = new E3D_program("mainProgram", gl);
        scn.program.compile(vertShader01, fragShader01);
        scn.program.bindLocations(attribList01, uniformList01);

        log("Lighting Initialization", false);
        scn.lights =  new E3D_lighting([0.0, 0.0, 0.15]);
        scn.lights.setColor0([1.0, 1.0, 1.0]);
        scn.lights.setDirection0([-0.2, -0.2, -1.]); 
        scn.lights.light0_lockToCamera = true;

        scn.lights.setColor1([1.0, 1.0, 0.85]);
        scn.lights.setDirection1([1.0, -1.0, 0.8]);
        scn.lights.light1_lockToCamera = false;

        log("Camera Initialization", false);
      //  scn.camera = new E3D_camera("cam1ortho", can.offsetWidth, can.offsetHeight);
        scn.camera = new E3D_camera_persp("cam1persp", can.offsetWidth, can.offsetHeight, _fieldOfView, _zNear, _zFar);
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

    // Input configuration // TODO in JSON config file
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

    targetEdge = new E3D_entity_wireframe_canvas("edgeHitTest");
    targetEdge.position = [25, 25, 25];
    targetEdge.addCylinder([0, 0, 0], 20, 100, [1, 0, 0], 32, 4, 10, false);
    targetEdge.pushCD_edge([0, 0, 0], [0, 1, 0], 100);
    targetEdge.visible = true;
    targetEdge.vis_culling = false;
    scn.addEntity(targetEdge);


    targetEdge2 = new E3D_entity_wireframe_canvas("edge2HitTest");
    targetEdge2.position = [0, 25, 25];
    targetEdge2.addCylinder([0, 0, 0], 10, 150, [0, 1, 0], 32, 4, 10, false);
    targetEdge2.pushCD_edge([0, 0, 0], [0, 1, 0], 150);
    targetEdge2.visible = true;
    targetEdge2.vis_culling = false;
    scn.addEntity(targetEdge2);


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

    // Activate timer and set scene as active

    timer.run();
    scn.state = E3D_ACTIVE;
}


var _parentView = { normalMatrix : m4_new() };
function prepRender() {

    if (show_DEV_CD) dev_CD.clear();

    // Move per inputs
    switch (moveTarget) {
        case 'e': // edge2        
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            targetEdge2.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            targetEdge2.rotateByParent([inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth], _parentView);
            targetEdge2.resetMatrix();
            break;
        case 'v': // edge1      
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            targetEdge.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            targetEdge.rotateByParent([inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth], _parentView);
            targetEdge.resetMatrix();
            break;
        case 's': // sphere
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            testSph.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            testSph.rotateByParent([inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth], _parentView);
            testSph.resetMatrix();
            break;
        default:
            scn.camera.moveBy(-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth, 
                               inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth);
      }
/*
    if (inputs.checkCommand("action_switch_ctrl_player", true)) moveTarget = "p";
    if (inputs.checkCommand("action_switch_ctrl_sphere", true)) moveTarget = "s";
    if (inputs.checkCommand("action_switch_ctrl_vector", true)) moveTarget = "v";
    if (inputs.checkCommand("action_switch_ctrl_edge", true)) moveTarget = "e";
 */


hitsMarkers.clear();




        var closestPt = point_vector_point( targetEdge.CD_edge_p[0],  targetEdge.CD_edge_n[0], testSph.CD_sph_p[0]);
        hitsMarkers.addLine(closestPt, testSph.CD_sph_p[0], false, [1,1,0]);

        closestPt = point_segment_point( targetEdge2.CD_edge_p[0],  targetEdge2.CD_edge_n[0], targetEdge2.CD_edge_l[0], testSph.CD_sph_p[0]);
        hitsMarkers.addLine(closestPt, testSph.CD_sph_p[0], false, [0,1,1]);

        var v1 = v3_scale_new(targetEdge.CD_edge_n[0],  targetEdge.CD_edge_l[0]);
        var v2 = v3_scale_new(targetEdge2.CD_edge_n[0], targetEdge2.CD_edge_l[0]);

        closestPt = path_path_closest_t(targetEdge.CD_edge_p[0],  v1, targetEdge2.CD_edge_p[0], v2);

        v3_addscaled_res(v1, targetEdge.CD_edge_p[0],  v1, closestPt);
        v3_addscaled_res(v2, targetEdge2.CD_edge_p[0], v2, closestPt);

        hitsMarkers.addLine(v1, v2, false, [1,0,1]);
/*
      targetEdge.CD_edge_p[0]; // edge origin
      targetEdge.CD_edge_n[0]; // edge normal
      targetEdge.CD_edge_l[0]; // edge length
      testSph.CD_sph_p[0]; // sphere origin
      testSph.CD_sph_r[0]; // sphere radius
      testSph.CD_sph_rs[0]; // sphare radius squared
*/
    var so = [0,0,0];

    v3_sub_res(so, testSph.CD_sph_p[0], targetEdge.CD_edge_p[0]);
    //v3_normalize_res(n, targetEdge.CD_edge_v[0]);
    //copy3f3fm(n, targetEdge.CD_edge_v[0]);
    var hit = VectSphHit(targetEdge.CD_edge_n[0], so, testSph.CD_sph_rs[0]);
    //var l = v3_length(n);

     
        // p = targetEdge.CD_edge_p[0] + (targetEdge.CD_edge_v[0] * d)

        var p = v3_scale_new(targetEdge.CD_edge_n[0], hitPoints[0]); 
        v3_add_mod(p, targetEdge.CD_edge_p[0]);
        if ((hitPoints[0] >= 0.0) && hitPoints[0] <= targetEdge.CD_edge_l[0]) hitsMarkers.addWireSphere(p, 1, [1,0.5,0.5], 8, false);

        p = v3_scale_new(targetEdge.CD_edge_n[0], hitPoints[1]); 
        v3_add_mod(p, targetEdge.CD_edge_p[0]);
        if ((hitPoints[1] >= 0.0) && hitPoints[1] <= targetEdge.CD_edge_l[0])  hitsMarkers.addWireSphere(p, 1, [0.5,1,0.5], 8, false);

        p = v3_scale_new(targetEdge.CD_edge_n[0], hitPoints[2]); 
        v3_add_mod(p, targetEdge.CD_edge_p[0]);
        if ((hitPoints[2] >= 0.0) && hitPoints[2] <= targetEdge.CD_edge_l[0])  hitsMarkers.addWireSphere(p, 1, [0.5,0.5,1], 8, false);


         hitsMarkers.addLine(testSph.position, [0,0,0], false, [1,0,0]);


        var p = point_vector_point(targetEdge.CD_edge_p[0], targetEdge.CD_edge_n[0],  testSph.CD_sph_p[0]);

       // v3_add_mod(p, targetEdge.CD_edge_p[0]);
    //   hitsMarkers.addWireSphere(p, 1, [0.5,1.0,0.5], 8, false);


        var cylAxis = [0, 1, 0];
        var cylPos = v3_clone(targetEdge2.position);
        var cylLen = 100;
        var cylRad = 10;

        var edgeAxis = v3_clone(targetEdge.CD_edge_n[0]);
        var edgePos = v3_clone(targetEdge.CD_edge_p[0]);
        var edgeLen = targetEdge.CD_edge_l[0];
        
        
        hitPoints[10] = v3_dot(cylAxis, edgeAxis); // is vector parallel or perpendicular
        
        var cylEdgeOffset = v3_sub_new(edgePos, cylPos);
        hitPoints[11] = v3_dot(cylAxis, cylEdgeOffset); // is base within cyl length
        
        v3_addscaled_res(so, cylEdgeOffset, edgeAxis, edgeLen);
      //  v3_sub_res(so, edgePos, cylPos);
        hitPoints[12] = v3_dot(cylAxis, so); // is end within cyl length
        
      //  v3_addscaled_res(so, edgePos, edgeAxis, edgeLen);
      //  hitPoints[13] = v3_dot(cylAxis, so);









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
                        var deltaP = v3_distance( animations[i].target.position, scn.entities[j].position);
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
     //   dev_CD.clear();
        for (let i = 0; i < scn.entities.length; ++i) {
            if (scn.entities[i].vis_culling) dev_CD.addWireSphere(scn.entities[i].position,scn.entities[i].cull_dist * 2, [1,0.5,0], 24, false);
            for (let j = 0; j < scn.entities[i].CD_sph; ++j) {
                dev_CD.addWireSphere(scn.entities[i].CD_sph_p[j], scn.entities[i].CD_sph_r[j] * 2, [1,0.5,0.5], 4, false);
            }
            for (let j = 0; j < scn.entities[i].CD_iPlane; ++j) {
                var pos = v3_addscaled_new(scn.entities[i].position, scn.entities[i].CD_iPlane_n[j], scn.entities[i].CD_iPlane_d[j]);
                dev_CD.moveCursorTo(pos);
                var norm = v3_scale_new(scn.entities[i].CD_iPlane_n[j], 10);
                dev_CD.addLineBy(norm, false, [1.0,1.0,1.0]);
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
    if (inputs.checkCommand("action_switch_ctrl_player", true)) { moveTarget = "p";  inputs.mousePosDirection = 1; }
    if (inputs.checkCommand("action_switch_ctrl_sphere", true)) { moveTarget = "s";  inputs.mousePosDirection = -1; }
    if (inputs.checkCommand("action_switch_ctrl_vector", true)) { moveTarget = "v";  inputs.mousePosDirection = -1; }
    if (inputs.checkCommand("action_switch_ctrl_edge", true)) { moveTarget = "e";  inputs.mousePosDirection = -1; }

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
            
            animations[animations.length - 1].target.position = v3_clone(DEV_lastAnimData.pos);
            animations[animations.length - 1].data.last_position = v3_clone(DEV_lastAnimData.pos);
            animations[animations.length - 1].data.spd = v3_clone(DEV_lastAnimData.spd);
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






var firstHit = [0.0, 0.0, 0.0];
var hitNormal = [0.0, 0.0, 0.0];
var vectOrig = [0.0, 0.0, 0.0];
var pathVect = [0.0, 0.0, 0.0];
var sphOffset = [0.0, 0.0, 0.0];
var planPosition = [0.0, 0.0, 0.0];
var vectOffset = [0.0, 0.0, 0.0];

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

        v3_sub_res(vectOrig, self.target.CD_sph_p[0], self.delta);
        v3_invscale_res(pathVect, self.delta, self.deltaLength);
        
        // collision detection - self.sph to other sph  
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_sph > 0)) {           


            for (let j = 0; j < scn.entities[i].CD_sph; ++j) {
                var marker = i+"s"+j;
                if (marker != self.lastHitIndex) {
                    nHitTest++;

                    var sumR = self.target.CD_sph_r[0] + scn.entities[i].CD_sph_r[j];
                    v3_sub_res(sphOffset, scn.entities[i].CD_sph_p[j], vectOrig);

                    var hitRes = VectSphHit(pathVect, sphOffset, sumR * sumR); 

                    if (isFinite(hitRes) && (hitRes != false) && (hitRes <= self.deltaLength) /*&& (hitRes >= 0.0)*/) {
                        if (hitRes < 0.0) hitRes = 0.0;
                        var t0 =  hitRes / self.deltaLength;
                        if ((!hitDetected) || ((hitDetected) && (t0 < self.closestCollision[1]))) {
                            v3_addscaled_res(firstHit, self.data.last_position, pathVect, hitRes);
                            v3_sub_res(hitNormal, firstHit, scn.entities[i].CD_sph_p[j]);
                            hitDetected = true;
                            self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-Sph"];
                        }
                    }
                } 
            }
        } // sph - sph



        // collision detection - self.sph to infinite plane
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_iPlane > 0)) {  

            for (let j = 0; j < scn.entities[i].CD_iPlane; ++j) {
                var marker = i+"ip"+j;
                if  (marker != self.lastHitIndex) {
                    nHitTest++;

                    v3_copy(hitNormal, scn.entities[i].CD_iPlane_n[j]);
                    v3_addscaled_res(planPosition, scn.entities[i].position, hitNormal, scn.entities[i].CD_iPlane_d[j]);
                    v3_sub_res(vectOffset, vectOrig, planPosition);

                    var d = v3_dot(vectOffset, hitNormal);
                    // if d >= 0 on side of normal, else on opposite side of normal
                    if (d >= 0.0) {
                        v3_addscaled_mod(planPosition, hitNormal,  self.target.CD_sph_r[0]);
                    } else {
                        v3_addscaled_mod(planPosition, hitNormal, -self.target.CD_sph_r[0]);           
                    }

                    var hitRes = planeIntersect(planPosition, hitNormal, vectOrig, pathVect);
                    
                    if ((hitRes) && (hitRes <= self.deltaLength) ) {
                        var t0 = hitRes / self.deltaLength;
                        
                        if ((!hitDetected) || ((hitDetected) && (t0 < self.closestCollision[1]))) {
                            v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes - 0.05);
                            
                            if (show_DEV_CD) {
                                if (v3_distancesquared(firstHit, vectOrig) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0,0], 8, false, 3);
                            }
                            if (d < 0.0) v3_negate_mod(hitNormal);

                            hitDetected = true;
                            if (t0 < 0.0) t0 = 0;
                            self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-iPlane"];
                        }
                    }
                }
            }
        } // sph - iPlane


        // collision detection - self.sph to edge
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_edge > 0)) {  

            for (let j = 0; j < scn.entities[i].CD_edge; ++j) {
                var marker = i+"e"+j;
                if  (marker != self.lastHitIndex) {
                    nHitTest++;

                    // dir normalize vector
                    // rpos relative position of ray vs cylinder axis (ray.pos - cyl.pos)
                    // rad2 squared radius of cylinder
                    // height height of cylinder
                    // returns [ t , normal ]
                    //function cylinderIntersect(dir, rpos, rad2, height)

                    var rpos = v3_sub_new(vectOrig, scn.entities[i].CD_edge_p[j]);
                    // z x y 
                    // y x z
                    var rotatedVect = v3_rotateY_new(pathVect, -scn.entities[i].rotation[1]);
                    v3_rotateX_mod(rotatedVect, -scn.entities[i].rotation[0]);
                    v3_rotateZ_mod(rotatedVect, -scn.entities[i].rotation[2]);
                    var hitRes = cylinderIntersect(rotatedVect, rpos, self.target.CD_sph_rs[0], scn.entities[i].CD_edge_l[j]);     
                   /* if (show_DEV_CD) {          
                        phyTracers.moveCursorTo(vectOrig);
                        phyTracers.addLineBy(v3_scale_new(rotatedVect, scn.entities[i].CD_edge_l[j]*2), false, [1,0,0]);
                    }*/
                    if ((hitRes) && (hitRes[0] <= self.deltaLength)) {

                        var t0 = hitRes[0] / self.deltaLength;
                        v3_addscaled_res(firstHit, vectOrig, rotatedVect, hitRes[0]);
                //        v3_applym4_mod(firstHit, scn.entities[i].normalMatrix);
                //        v3_applym4_mod(hitRes[1], scn.entities[i].normalMatrix);

                        if (show_DEV_CD) {
                            phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0,0], 8, false, 3);
                            //phyTracers.addLine(firstHit, 16, [1,0,0], 8, false, 3);
                            log("edge hit " + hitRes[0] + " " + hitRes[1], false);


                        }
                   //     var wc = v3_scale_new(hitRes[1], 10);
                      //  phyTracers.addWireCross(wc, 5, [1,1,1]);
                        //  hitNormal = 

                        hitDetected = true;
                        self.closestCollision = [marker, t0, v3_clone(hitRes[1]), v3_clone(firstHit), "Sph-edge"];
                    }//hitres
                }//marker different
            }// for edges
        } // sph - edge



    } // end for each other entity perform hit test



    return hitDetected;
}

// animator functions

function anim_sph_firstPass() {
    if (this.state == E3D_RESTART) {
        v3_copy(this.target.position, scn.camera.position);
        this.target.position[1] += 5;
        this.target.rotation[0] = rndPM(PIx2);
        this.target.rotation[1] = rndPM(PIx2);

        this.data.spd = scn.camera.adjustToCamera(v3_scale_new(_v3_nz, inputs.checkCommand("action_speed", false) ? 600 : 300));

        this.data.spd[0] += rndPM(1);
        this.data.spd[1] += rndPM(1);
        this.data.spd[2] += rndPM(1);
        this.data.ttl = 30;
        
        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.resetMatrix();
        this.data.last_position = v3_clone(this.target.position);

        DEV_lastAnimData = { pos: v3_clone(this.target.position), spd: v3_clone(this.data.spd) };

        
    } else if (this.state == E3D_PLAY) {

        v3_copy(this.data.last_position, this.target.position);

        v3_scale_res(this.delta, this.data.spd, timer.delta);  
        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        this.target.resetMatrix();
        this.lastHitIndex = "";
        
        if (show_DEV_CD) phyTracers.addLine(this.data.last_position,this.target.position, true);
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
        this.data.last_position = v3_clone(this.target.position);

        this.data.startedYDelta = this.data.last_position[1];
        this.data.expectedYDelta = 0;
        
    } else if (this.state == E3D_PLAY) {

        v3_copy(this.data.last_position, this.target.position);

        v3_scale_res(this.delta, this.data.spd, timer.delta);   
        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

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

            v3_normalize_mod(this.closestCollision[2]); // change direction on hit
            v3_reflect_mod(this.data.spd, this.closestCollision[2]); // reflect per hit normal  

          //  if (show_DEV_CD) phyTracers.addLine(this.data.last_position, this.target.position, false, [1, 0, 0]);
          //  if (show_DEV_CD) phyTracers.addLine(this.data.last_position, this.closestCollision[3], false, [0, 1, 0]);            
           
            v3_copy(this.data.last_position, this.closestCollision[3]);             
           
            var remainder = 1.0 - this.closestCollision[1]; // fraction remaining

            v3_scale_mod(this.data.spd, 0.8); // hit "drag"

            if (this.closestCollision[2][1] > 0.0) {
                var gPenality = gAccel * this.closestCollision[2][1];
                this.data.spd[1] -= gPenality;
                if (this.data.spd[1] < 0.0) this.data.spd[1] = 0.0;
            }
            if (remainder < 0.0) throw "remaining delta is negative " + remainder;
            
            v3_scale_res(this.delta, this.data.spd, remainder * timer.delta);
            this.deltaLength = v3_length(this.delta);
            v3_add_res(this.target.position, this.data.last_position, this.delta);  
            
           // if (show_DEV_CD) phyTracers.addLine(this.data.last_position, this.target.position, true); 

            
            this.target.resetMatrix();
           // this.state = E3D_PAUSE;
        }
        return colDetected;
    } else return false;
}

function anim_sph_endPass() {
    this.data.spd[1] -= gAccel;
    this.data.ttl -= timer.delta;

    if (this.data.ttl < 0) {
        this.state = E3D_DONE;
        this.target.visible = false;
    } 
}




// Physics Methods




// Intersection of vector and sphere, as vector advance into static sphere, arrow like
function VectSphHit(v, so, sr2) { // translated to v origin
    var t0 = 0; 
    var t1 = 0;
   // var sr2 = sr * sr;
    var tca = v3_dot(so, v);
    hitPoints[0] = tca;
    hitPoints[1] = -1;
    hitPoints[2] = -1;
if (isNaN(tca)) throw "VectSphHit tca NaN";
    if  (tca < 0) return false;
    // sph behind origin

    var d2 = v3_dot(so, so) - tca * tca;

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

var _planeIntersect_diff = [0.0, 0.0, 0.0];
function planeIntersect(planePos, planeNormal, vectOrigin, vectDirection) {
    var angleCos = v3_dot(planeNormal, vectDirection);
    hitPoints[3] = angleCos;
	if (angleCos == 0.0) {
        log("parallel");
        return false; // parallel
    }
	v3_sub_res(_planeIntersect_diff, planePos, vectOrigin);
    var t = v3_dot(planeNormal, _planeIntersect_diff) / angleCos;

    hitPoints[4] = t;
    if (t < -0.0) return false; // derriere    
	return t;
}

// dir normalize vector
// rpos relative position of ray vs cylinder axis (ray.pos - cyl.pos)
// rad2 squared radius of cylinder
// height height of cylinder
// returns [ t , normal ]
function cylinderIntersect(dir, rpos, rad2, height) {
    var t = -1, t1 = -1, t2 = -1;
 
	var a = (dir[0] * dir[0]) + (dir[2] * dir[2]);
    if (a == 0.0) return false; // parallel

    var b = 2.0 * ((dir[0] * rpos[0]) + (dir[2] * rpos[2]));
	var c = (rpos[0] * rpos[0]) + (rpos[2] * rpos[2]) - (rad2);

    var sfact = Math.sqrt((b * b) - (4.0 * a * c));
    if (isNaN(sfact)) return false;
	var t1 = (-b + sfact) / (2.0 * a);
    var t2 = (-b - sfact) / (2.0 * a);
    
    if ((rpos[1] + (dir[1] * t1)) > height) t1 = Infinity;
	if ((rpos[1] + (dir[1] * t1)) < 0.0) t1 = Infinity;
	if ((rpos[1] + (dir[1] * t2)) > height) t2 = Infinity;
    if ((rpos[1] + (dir[1] * t2)) < 0.0) t2 = Infinity;
    
	if (t1 < 0.0) t1 = Infinity;
    if (t2 < 0.0) t2 = Infinity;
    
    if ((t1 == Infinity) && (t2 == Infinity)) return false;

	t = Math.min(t1, t2);

	var h = v3_addscaled_new(rpos, dir, t * (1 - _v3_epsilon));
	h[1] = 0.0;

    if (v3_lengthsquared(h) < rad2) v3_negate_mod(h);

	return [t, h];
}



var _point_vector_t_offset = [0, 0, 0];
function point_vector_t(orig, norm, point) {
    // http://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
    v3_sub_res(_point_vector_t_offset, orig, point);
    return -v3_dot(_point_vector_t_offset, norm);
}

function point_vector_point(orig, norm, point) {
    return v3_addscaled_new(orig, norm, point_vector_t(orig, norm, point));
}

function point_vector_distance(orig, norm, point) {
    return v3_distance(point, point_vector_point(orig, norm, point));
}
function point_segment_point(orig, norm, len, point) {
    var t = point_vector_t(orig, norm, point);
    if (t < 0.0) t = 0.0;
    if (t > len) t = len;

    return v3_addscaled_new(orig, norm, t);
}
function point_segment_distance(orig, norm, len, point) {
    return v3_distance(point, point_segment_point(orig, norm, len, point));
}


var _path_path_closest_t_Vdelta = [0, 0, 0];
var _path_path_closest_t_Odelta = [0, 0, 0];
function path_path_closest_t(orig1, v1, orig2, v2) {
    // http://geomalgorithms.com/a07-_distance.html
    v3_sub_res(_path_path_closest_t_Vdelta, v1, v2);
    var dvlen = v3_lengthsquared(_path_path_closest_t_Vdelta);
    if (dvlen < _v3_epsilon) return -1.0;
    v3_sub_res(_path_path_closest_t_Odelta, orig1, orig2);
    return -v3_dot(_path_path_closest_t_Odelta, _path_path_closest_t_Vdelta) / dvlen;
}

var _path_path_closest_distance_p1 = [0, 0, 0];
var _path_path_closest_distance_p2 = [0, 0, 0];
function path_path_closest_distance(orig1, v1, orig2, v2) {
    var t = path_path_closest_t(orig1, v1, orig2, v2);
    v3_addscaled_res(_path_path_closest_distance_p1, orig1, v1, t);
    v3_addscaled_res(_path_path_closest_distance_p2, orig2, v2, t);
    return v3_distance(_path_path_closest_distance_p1, _path_path_closest_distance_p2);
}

var _vector_vector_distance_Odelta = [0, 0, 0]; // w
var _vector_vector_distance_dP = [0, 0, 0]; // dP
var _vector_vector_distance_tcv = [0, 0, 0]; // tc * v
function vector_vector_distance(orig1, v1, orig2, v2) {
    // http://geomalgorithms.com/a07-_distance.html
    v3_sub_res(_vector_vector_distance_Odelta, orig1, orig2);
    var a = v3_lengthsquared(v1);
    var b = v3_dot(v1, v2);
    var c = v3_lengthsquared(v2);
    var d = v3_dot(v1, _vector_vector_distance_Odelta);
    var e = v3_dot(v2, _vector_vector_distance_Odelta);

    var D = a*c - b*b;
    var sc = 0.0;
    var tc = 0.0;

    if (D < _v3_epsilon) {
        sc = 0.0;
        tc = (b > c) ? d / b : e / c;      
    } else {
        sc = (b*e - c*d) / D;
        tc = (a*e - b*d) / D;
    }

    v3_addscaled_res(_vector_vector_distance_dP, _vector_vector_distance_Odelta, v1, sc);
    v3_scale_res(_vector_vector_distance_tcv, v2, tc);
    v3_sub_mod(_vector_vector_distance_dP, _vector_vector_distance_tcv);

    return v3_length(_vector_vector_distance_dP);
}



}); // DOMContentLoaded