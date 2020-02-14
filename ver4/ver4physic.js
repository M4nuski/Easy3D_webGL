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

const range1 = document.getElementById("myRange1");
const range2 = document.getElementById("myRange2");
const range3 = document.getElementById("myRange3");

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
var testSph, targetEdge, targetEdge2, testPlanes, dev_CD, DEV_markers, phyTracers, DEV_wand; // entities
var show_DEV_CD = false;
var moveTarget = "p";
var hitPoints = new Map();
var DEV_anim_active = true;
var sphCounter = 0;
var DEV_lastAnimData = null;
var gAccel, lgaccel = 0;

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
    ", rX: " + padStart(""+Math.floor(scn.camera.rotation[0] * RadToDeg), " ", 5) + 
    ", rY:"+ padStart(""+Math.floor(scn.camera.rotation[1] * RadToDeg), " ", 5) + "\n" +
    "delta: " + padEnd(""+timer.delta, "0", 5) + 
    "s, usage: " + padStart(""+(timer.usageSmoothed.toFixed(1)), " ", 5) +
    "%, FPS: " + padStart(""+Math.floor(timer.fpsSmoothed), " ", 3) + "\n" +

    "nElements: " + scn.drawnElemenets +
    ", nAnims: " + padStart(""+animations.length, " ", 6) + ", nHitTests: " + nHitTest + ", nbHits: " + nHits + ", nbCDpasses: " + nbCDpasses;

    var tc = "";
    for (var [k, v] of hitPoints) tc += justify(k, v.toFixed(4), 30) + "\n";
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
        scn.lights.setDirection0([-0.2, -0.2, -1.0]); 
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
    inputs.keyMap.set("action_switch_ctrl_wand", "Digit5");

    inputs.keyMap.set("action_anim_clear", "Digit0");
    inputs.keyMap.set("action_CD_clear", "Digit9");
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

    testPlanes = new E3D_entity_wireframe_canvas("planes");
    testPlanes.addPlane([0, -50, 0], [PIdiv2, 0, 0], 2048, 2048, 64, [1,1,0], true);
    testPlanes.addPlane([150, -50, 0], [PIdiv2, 0.25, 0.5], 1024, 512, 64, [1,0,1], true);
    testPlanes.addPlane([-150, -50, 0], [PIdiv2, -0.25, -0.5], 512, 1024, 64, [0,1,1], true);
    testPlanes.visible = true;
    scn.addEntity(testPlanes);


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

    DEV_wand = new E3D_entity_wireframe_canvas("wand");
    DEV_wand.position = [0, 50, 0];
    DEV_wand.addLine([0, 0, 25], [0, 0, -25], false, [1, 1, 1]);
    DEV_wand.addWireSphere([0,0, -25], 10, [1, 1 ,0], 32, false, 8);
    DEV_wand.visible = true;
    scn.addEntity(DEV_wand);
    /*cubes = new E3D_entity_wireframe_canvas("cubesTest");
    cubes.position = [0, 50, -50];
    cubes.addWireCube([0, -50, 0], [0,0,0], [15, 15, 15], [1,0,0], true, false, false );
    cubes.addWireCube([0, -25, 0], [0,0,0], [10, 10, 10], [0,1,0], true, true, false );
    cubes.addWireCube([0, 0, 0], [0,0,0], [5, 5, 5], [0,0,1], true, false, true );
    cubes.addWireCube([0, 25, 0], [0,0,0], [10, 10, 10], [1,0,1], true, true, true );
    cubes.visible = true;
    //cubes.cull_dist2 = 4200;
    scn.addEntity(cubes);*/

    DEV_markers = new E3D_entity_wireframe_canvas("CD_hits_markers");
    DEV_markers.addWireSphere([0,0,0], 1, [1,1,1], 8, false);
    DEV_markers.visible = true;
    DEV_markers.vis_culling = false;
    scn.addEntity(DEV_markers);

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
            targetEdge2.rotateByParent([inputs.rx_delta_smth, inputs.rz_delta_smth, inputs.ry_delta_smth], _parentView);
            targetEdge2.resetMatrix();
            break;
        case 'v': // edge1      
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            targetEdge.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            targetEdge.rotateByParent([inputs.rx_delta_smth, inputs.rz_delta_smth, inputs.ry_delta_smth], _parentView);
            targetEdge.resetMatrix();
            break;
        case 'w': // wand      
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            DEV_wand.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            DEV_wand.rotateByParent([inputs.rx_delta_smth, inputs.rz_delta_smth, inputs.ry_delta_smth], _parentView);
            DEV_wand.resetMatrix();
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


    DEV_markers.clear();

    var closestPt = point_vector_point( targetEdge.CD_edge_p[0],  targetEdge.CD_edge_n[0], testSph.CD_sph_p[0]);
    DEV_markers.addLine(closestPt, testSph.CD_sph_p[0], false, [1,1,0]);

    closestPt = point_segment_point( targetEdge2.CD_edge_p[0],  targetEdge2.CD_edge_n[0], targetEdge2.CD_edge_l[0], testSph.CD_sph_p[0]);
    DEV_markers.addLine(closestPt, testSph.CD_sph_p[0], false, [0,1,1]);

    var v1 = v3_scale_new(targetEdge.CD_edge_n[0],  targetEdge.CD_edge_l[0]);
    var v2 = v3_scale_new(targetEdge2.CD_edge_n[0], targetEdge2.CD_edge_l[0]);

    closestPt = path_path_closest_t(targetEdge.CD_edge_p[0],  v1, targetEdge2.CD_edge_p[0], v2);

    v3_addscaled_res(v1, targetEdge.CD_edge_p[0],  v1, closestPt);
    v3_addscaled_res(v2, targetEdge2.CD_edge_p[0], v2, closestPt);

    DEV_markers.addLine(v1, v2, false, [1,0,1]);

    var edge_r = 10;
    var edge2_r = 5;        
    var edge_dist = v3_distance(v1, v2);

    hitPoints.set("p_p eD", edge_dist);
    hitPoints.set("p_p closest t",  closestPt);

    if ((closestPt > 0.0) && (closestPt <= 1.0) && (edge_dist < (edge_r + edge2_r))) {

        var edge_pen = (edge_r + edge2_r) - edge_dist;
        var start_dist = v3_distance(targetEdge2.CD_edge_p[0], targetEdge.CD_edge_p[0]);
        var fact_dist = (-(edge_pen/1.5) + edge_dist - start_dist) / closestPt;  
        var hit_dist = (edge_r + edge2_r - start_dist) / fact_dist;

        hitPoints.set("p_p sD", start_dist);    
        hitPoints.set("p_p fact",fact_dist);
        hitPoints.set("p_p hit_dst", hit_dist); 

        v3_addscaled_res(v1, targetEdge.CD_edge_p[0],  targetEdge.CD_edge_n[0],  (targetEdge.CD_edge_l[0] * hit_dist) );
        v3_addscaled_res(v2, targetEdge2.CD_edge_p[0], targetEdge2.CD_edge_n[0],  (targetEdge2.CD_edge_l[0] * hit_dist) );

        hitPoints.set("p_p endDist", v3_distance(v1, v2));

        DEV_markers.addWireSphere(v1, edge_r*2, [1, 0.5, 0.5], 32, false, 5);
        DEV_markers.addWireSphere(v2, edge2_r*2, [1, 0.5, 0.5], 32, false, 5);

    } 

    var off = range2.value / 1000;
    hitPoints.set("r2 pos t", off);
    v3_addscaled_res(v1, targetEdge.CD_edge_p[0],  targetEdge.CD_edge_n[0],  targetEdge.CD_edge_l[0] * off);
    v3_addscaled_res(v2, targetEdge2.CD_edge_p[0], targetEdge2.CD_edge_n[0], targetEdge2.CD_edge_l[0] * off);
    DEV_markers.addWireSphere(v1, edge_r*2, [1, 1, 1], 32, false, 5);
    DEV_markers.addWireSphere(v2, edge2_r*2, [1, 1, 1], 32, false, 5);


    dev_CD.addPlane([0, 30, 0],  [PIx2 * range1.value / 1000, PIx2 * range2.value / 1000, PIx2 * range3.value / 1000], 256, 256, 8, [1,1,1], true);

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
    var hit = VectSphHit(targetEdge.CD_edge_n[0], so, testSph.CD_sph_rs[0]);

    var _tca = hitPoints.get("v-s tca");
    var _t0 = hitPoints.get("v-s t0");
    var _t1 = hitPoints.get("v-s t1");

    var p = v3_scale_new(targetEdge.CD_edge_n[0], _tca); 
    v3_add_mod(p, targetEdge.CD_edge_p[0]);
    if ((_tca >= 0.0) && _tca <= targetEdge.CD_edge_l[0]) DEV_markers.addWireSphere(p, 1, [1,0.5,0.5], 8, false);

    p = v3_scale_new(targetEdge.CD_edge_n[0], _t0); 
    v3_add_mod(p, targetEdge.CD_edge_p[0]);
    if ((_t0 >= 0.0) && _t0 <= targetEdge.CD_edge_l[0])  DEV_markers.addWireSphere(p, 1, [0.5,1,0.5], 8, false);

    p = v3_scale_new(targetEdge.CD_edge_n[0], _t1); 
    v3_add_mod(p, targetEdge.CD_edge_p[0]);
    if ((_t1 >= 0.0) &&_t1 <= targetEdge.CD_edge_l[0])  DEV_markers.addWireSphere(p, 1, [0.5,0.5,1], 8, false);


    DEV_markers.addLine(testSph.position, [0,0,0], false, [1,0,0]);

    var p = point_vector_point(targetEdge.CD_edge_p[0], targetEdge.CD_edge_n[0],  testSph.CD_sph_p[0]);

    var cylAxis = [0, 1, 0];
    var cylPos = v3_clone(targetEdge2.position);
    var cylLen = 100;
    var cylRad = 10;

    var edgeAxis = v3_clone(targetEdge.CD_edge_n[0]);
    var edgePos = v3_clone(targetEdge.CD_edge_p[0]);
    var edgeLen = targetEdge.CD_edge_l[0];
    
    hitPoints.set("cyl_edg dot", v3_dot(cylAxis, edgeAxis)); // is vector parallel or perpendicular
    
    var cylEdgeOffset = v3_sub_new(edgePos, cylPos);
    hitPoints.set("cyl_w0 dot", v3_dot(cylAxis, cylEdgeOffset)); // is base within cyl length
    
    v3_addscaled_res(so, cylEdgeOffset, edgeAxis, edgeLen);
    hitPoints.set("w0_edg dot", v3_dot(cylAxis, so)); // is end within cyl length
    




    if (DEV_anim_active) {
    // Animate / Calculate Expected target position and state

        // Cleanup
        var someremoved = false;
        for (let i = animations.length -1; i >=0; --i) if (animations[i].state == E3D_DONE) {
            scn.removeEntity(animations[i].target.id, false);
            animations.splice(i, 1);
            someremoved = true;
        } 

        if (someremoved) for (let i = 0; i < animations.length; ++i) animations[i].target.animIndex = i;

        // First pass, calculate expected next position
        for (let i = 0; i < animations.length; ++i) {
            animations[i].animateFirstPass();
            animations[i].collisionDetected = false;
            animations[i].collisionFromOther = false;
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
                        animations[i].candidates[j] = deltaP <= deltaD;  
                    }
                }
            }
        }

        nbCDpasses = 0;
        var maxIter = 10;
        var numIter = maxIter;
        var hitDetected = true;
        while ((numIter > 0) && (hitDetected)){
            hitDetected = false;
            for (let i = 0; i < animations.length; ++i) if (animations[i].deltaLength > 0.0) CheckForAnimationCollisions(animations[i]); // Collision Detection
            for (let i = 0; i < animations.length; ++i) if ((animations[i].collisionDetected) || (animations[i].collisionFromOther)) {            
                animations[i].animateRePass(); // Collision Response
                hitDetected = true;
            }
            numIter--;
        }

        nbCDpasses = maxIter - numIter;

        // Last pass, post-process animation state after collision are resolved
        for (let i = 0; i < animations.length; ++i) animations[i].animateLastPass();
    }





    if (show_DEV_CD) {
     //   dev_CD.clear();
        for (let i = 0; i < scn.entities.length; ++i) {
            if (scn.entities[i].vis_culling) dev_CD.addWireSphere(scn.entities[i].position,scn.entities[i].cull_dist * 2, [1,0.5,0], 24, false);
            for (let j = 0; j < scn.entities[i].CD_sph; ++j) {
                dev_CD.addWireSphere(scn.entities[i].CD_sph_p[j], scn.entities[i].CD_sph_r[j] * 2, [1,0.5,0.5], 4, false);
            }
            for (let j = 0; j < scn.entities[i].CD_plane; ++j) {
                dev_CD.moveCursorTo(scn.entities[i].CD_plane_p[j]);
                var norm = v3_scale_new(scn.entities[i].CD_plane_n[j], 10);
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

    lgaccel = gAccel;
    gAccel = timer.delta * 386.22;

    updateStatus();
    nHitTest = 0;
    nHits = 0;
    if (inputs.checkCommand("action1", true)) {
      //  console.log("action0", true);
        let newSph = scn.cloneEntity("sph", "sph" + sphCounter);
        animations.push(new E3D_animation("ball throw" + sphCounter++, newSph, scn, timer, anim_sph_firstPass, anim_sph_rePass, anim_sph_endPass));
        animations[animations.length-1].restart();
        animations[animations.length-1].target.animIndex = animations.length-1;
    }
    if (inputs.checkCommand("action2", false)) {
        //  console.log("action0", true);
        for (var i = 0; i < 32; ++i) {
            let newSph = scn.cloneEntity("sph", "sph" + sphCounter);
            animations.push(new E3D_animation("ball throw" + sphCounter++, newSph, scn, timer, anim_sphRain_firstPass, anim_sph_rePass, anim_sph_endPass));
            animations[animations.length-1].restart();
            animations[animations.length-1].target.animIndex = animations.length-1;
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
    if (inputs.checkCommand("action_switch_ctrl_wand", true)) { moveTarget = "w";  inputs.mousePosDirection = -1; }

    if (inputs.checkCommand("action_CD_clear", true)) { phyTracers.clear(); }

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
            animations[animations.length - 1].last_position = v3_clone(DEV_lastAnimData.pos);
            animations[animations.length - 1].spd = v3_clone(DEV_lastAnimData.spd);
            animations[animations.length - 1].ttl = 30;
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
var vectOffset = [0.0, 0.0, 0.0];

function CheckForAnimationCollisions(self){

    //  [animIndex, entityIndex, t, normal, firstHitPosition] // t is fraction of self.deltaLength done when firstHit        

    // for each candidate entity                      
    for (let i = 0; i < self.candidates.length; ++i) if (self.candidates[i] == true) {

        v3_sub_res(vectOrig, self.target.CD_sph_p[0], self.delta);
        v3_invscale_res(pathVect, self.delta, self.deltaLength); // TODO preserve actual last positions, or effective delta
        
        // collision detection - self.sph to other sph (static sph target) // TODO use path to path interpolation
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_sph > 0)) {           


            for (let j = 0; j < scn.entities[i].CD_sph; ++j) {
                var marker = i+"s"+j;
                if (marker != self.lastHitMarker) {
                    nHitTest++;

                    var sumR = self.target.CD_sph_r[0] + scn.entities[i].CD_sph_r[j];

                    v3_sub_res(sphOffset, scn.entities[i].CD_sph_p[j], vectOrig);

                    var hitRes = VectSphHit(pathVect, sphOffset, sumR * sumR); 

                    if (isFinite(hitRes) && (hitRes != false) && (hitRes <= self.deltaLength) ) {
                        if (hitRes < 0.0) hitRes = 0.0;

                        v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes);
                        var t0 = v3_distancesquared(firstHit, self.last_position);

                        if ((!self.collisionDetected) || ((self.collisionDetected) && (t0 < self.closestCollision[1]))) {
                            v3_sub_res(hitNormal, firstHit, scn.entities[i].CD_sph_p[j]);
                            self.collisionDetected = true;
                            self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-Sph"];
                            if ((self.target.animIndex != -1) && (scn.entities[i].animIndex != -1)) {
                                animations[scn.entities[i].animIndex].collisionFromOther = true;
                                animations[scn.entities[i].animIndex].otherCollision = [self.target.animIndex + "s" + "0", t0, v3_clone(hitNormal), v3_clone(self.spd), "Sph-Sph"];
                            }
                        }
                    }


                } 
            }
        } // sph - sph



        // collision detection - self.sph to edge (static edge)
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_edge > 0)) {  

            for (let j = 0; j < scn.entities[i].CD_edge; ++j) {
                var marker = i+"e"+j;
                if  (marker != self.lastHitMarker) {
                    nHitTest++;

                    var p1, p2, distsq;

                    // closest points between paths, v1t is t along delta, v2t is t along edge (0.0 - 1.0), -1 is behind
                    var v2 = v3_scale_new(scn.entities[i].CD_edge_n[j], scn.entities[i].CD_edge_l[j]);
                    var [v1t, v2t] = vector_vector_t(vectOrig, self.delta, scn.entities[i].CD_edge_p[j], v2);

                    // check if closest points are within both vectors
                    var potentialHit = ( (v1t > 0.0) && (v1t <= 1.0) && (v2t >= 0.0) && (v2t <= 1.0) );
                    if (potentialHit) {
                        p1 = v3_addscaled_new(vectOrig, self.delta, v1t);
                        p2 = v3_addscaled_new(scn.entities[i].CD_edge_p[j], v2, v2t);
                        distsq = v3_distancesquared(p1, p2);
                        potentialHit = (distsq <= self.target.CD_sph_rs[0]);
                        if (show_DEV_CD && potentialHit) log("closest");
                    }
                    if (!potentialHit) {

                        // end cap as the sphere at the end of the vector
                        v3_sub_res(sphOffset, self.target.CD_sph_p[0], scn.entities[i].CD_edge_p[j]);
                        var endCap = vector_sph_t(scn.entities[i].CD_edge_n[j], sphOffset, self.target.CD_sph_rs[0]);

                        if (endCap != false) {
                            var [st0, stca, st1] = endCap;    

                            var p1p = v3_addscaled_new(scn.entities[i].CD_edge_p[j], scn.entities[i].CD_edge_n[j], st0);
                            var p2p = v3_addscaled_new(scn.entities[i].CD_edge_p[j], scn.entities[i].CD_edge_n[j], st1);
                            var d1 = v3_lengthsquared(p1p, vectOrig);                            
                            var d2 = v3_lengthsquared(p2p, vectOrig);

                            p2 = (d1 < d2) ? p2p : p1p;
                            p1 = v3_clone(self.target.CD_sph_p[0]);

                            distsq = v3_distancesquared(p1, p2);
                            potentialHit = (distsq <= self.target.CD_sph_rs[0]); // last sanity check                            
                            if (potentialHit) v1t = 1.0;
                            if (show_DEV_CD) { 
                                phyTracers.addWireSphere(p1p, 2, [1,7.5,1], 8, false, 3);
                                phyTracers.addWireSphere(p2p, 2, [0.75,1,1], 8, false, 3);
                                if (potentialHit) log("endcap");
                            }
                        }
                    }

                    if (potentialHit) {                       

                        var penetration = Math.sqrt(self.target.CD_sph_rs[0]) - Math.sqrt(distsq);
                            var vcos = v3_dot(pathVect, scn.entities[i].CD_edge_n[j]);

                            penetration = penetration / Math.abs(1.0 - (vcos * vcos));// as path length
     
                            var t0 = v1t - (penetration / self.deltaLength); // as path t
                            if (t0 < 0.0) t0 = 0.0;

                            hitPoints.set("edge vcos", vcos);

                            v3_addscaled_res(firstHit, vectOrig, self.delta, t0);
                            var t0 = v3_distancesquared(firstHit, self.last_position);
                            if (((!self.collisionDetected) && (t0 >= 0.0)) || ((self.collisionDetected) && (t0 >= 0.0) && (t0 < self.closestCollision[1]))) {
      
                                var ptsonsegment = point_segment_point(scn.entities[i].CD_edge_p[j],  scn.entities[i].CD_edge_n[j], scn.entities[i].CD_edge_l[j], firstHit);
                                v3_sub_res(hitNormal, firstHit, ptsonsegment);

                                if (show_DEV_CD) {              
                                    phyTracers.addWireSphere(p1, 3, [1,0,0], 8, false, 3);
                                    phyTracers.addWireSphere(p2, 3, [0,1,0], 8, false, 3);
                                    phyTracers.addWireCross(vectOrig, 1, [0, 1, 0]);
                                    phyTracers.addWireCross(self.target.CD_sph_p[0], 1, [1, 0, 0]);
                                    phyTracers.addLine(firstHit, ptsonsegment, false, [0,0,1]);
            
                                    phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0.5,0.5], 8, false, 3);
                                    phyTracers.addWireSphere(ptsonsegment, 3, [1,0,1], 8, false, 3);
                                    log("edge hit v1t" + v1t + " p" + penetration + " vcos" + vcos + " t0" + t0, false);
                                }

                           //     if (t0 > 1.0) t0 = 1.0;                 
                                self.collisionDetected = true;
                                self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-edge"];
                               // edgeHit = t0;
                            }

                    }
                }//marker different
            }// for edges
        } // sph - edge




        // collision detection - self.sph to plane (static)
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_plane > 0)) {  

            for (let j = 0; j < scn.entities[i].CD_plane; ++j) {
                var marker = i+"p"+j;
                if  (marker != self.lastHitMarker) {
                    nHitTest++;

                    v3_copy(hitNormal, scn.entities[i].CD_plane_n[j]); 

                    v3_sub_res(vectOffset, vectOrig, scn.entities[i].CD_plane_p[j]);// Delta of Origin point and Plane position 
                    var d0 = v3_dot(vectOffset, hitNormal); 

                    v3_sub_res(firstHit, self.target.CD_sph_p[0], scn.entities[i].CD_plane_p[j]); // Delta of End point and Plane position
                    var d1 = v3_dot(firstHit, hitNormal);
                   
                    if (d0 < 0.0) v3_negate_mod(hitNormal); // if d >= 0 on side of normal, else on opposite side of normal

                    var validHit = false;
                    var parallelHit = false;

                    var p = v3_dot(pathVect, hitNormal);

                    if (Math.abs(p) < _v3_epsilon) { // parallel
                        var hitDist = Math.abs(d0);
                        if (hitDist < self.target.CD_sph_r[0]) { // parallel and closer that radius

                            // check if inside plane rectangle
                            validHit = true;
                            if (Math.abs(v3_dot(firstHit, scn.entities[i].CD_plane_w[j])) > scn.entities[i].CD_plane_halfWidth[j]) validHit = false;
                            if (validHit) {
                                if (Math.abs(v3_dot(firstHit, scn.entities[i].CD_plane_h[j])) > scn.entities[i].CD_plane_halfHeight[j]) validHit = false; 
                            }
                            if (validHit) {
                                // offset to get the entity out of the plane
                                v3_scale_res(sphOffset, hitNormal, (self.target.CD_sph_r[0] - hitDist) );
                                v3_add_mod(self.target.position, sphOffset);
                                self.target.resetMatrix();
                                v3_add_mod(vectOrig, sphOffset);  // offset already calculated point
                                if (show_DEV_CD) log("par hit");                
                                parallelHit = true; // prevent further hit testing with this plane
                            }                       
                        }

                    } else { // if not parallel check if already inside

                        var hitDist =  Math.abs(d0);
                        if (hitDist < self.target.CD_sph_r[0]) { //  closer that radius

                            // check if inside plane rectangle
                            validHit = true;
                            if (Math.abs(v3_dot(firstHit, scn.entities[i].CD_plane_w[j])) > scn.entities[i].CD_plane_halfWidth[j]) validHit = false;
                            if (validHit) {
                                if (Math.abs(v3_dot(firstHit, scn.entities[i].CD_plane_h[j])) > scn.entities[i].CD_plane_halfHeight[j]) validHit = false; 
                            }
                            if (validHit) {
                                // offset to get the entity out of the plane
                                v3_scale_res(sphOffset, hitNormal, (self.target.CD_sph_r[0] - hitDist) );
                                v3_add_mod(self.target.position, sphOffset);
                                self.target.resetMatrix();
                                v3_add_mod(vectOrig, sphOffset);  // offset already calculated point
                            }                       
                        } 
                    }

                    var hitRes = false;
                    validHit = false;
                    if (!parallelHit) hitRes = planeIntersect(scn.entities[i].CD_plane_p[j], hitNormal, vectOrig, pathVect);                 

                    if ((hitRes) && (hitRes >= -self.target.CD_sph_r[0])) { // some hit in front of vector

                        // offset for sph radius
                        // new hit = firstHit - pathVect * radius / sin angle
                        var offset = self.target.CD_sph_r[0] / Math.abs(p);
                        var t0 = hitRes - offset;

                        if (show_DEV_CD) phyTracers.addWireCross(v3_addscaled_new(vectOrig, pathVect, t0), 2*self.target.CD_sph_r[0], [0,0,1]);

                        if ( (t0 >= -self.target.CD_sph_r[0]) && (t0 <= self.deltaLength)) { // if hit is still forward and before end of delta 

                            v3_addscaled_res(firstHit, vectOrig, pathVect, t0); 
                            if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2*self.target.CD_sph_r[0], [0,1,0]);

                            // check if inside
                            v3_copy(sphOffset, firstHit);
                            validHit = true;    
                            if (Math.abs(v3_dot(sphOffset, scn.entities[i].CD_plane_w[j])) > scn.entities[i].CD_plane_halfWidth[j]) validHit = false;
                            if (validHit) {
                                if (Math.abs(v3_dot(sphOffset, scn.entities[i].CD_plane_h[j])) > scn.entities[i].CD_plane_halfHeight[j]) validHit = false; 
                            }
                        }

                        var t0 = v3_distancesquared(firstHit, self.last_position);

                        if (((!self.collisionDetected) && validHit) || (validHit && (self.collisionDetected) && (t0 < self.closestCollision[1]))) {

                            if (show_DEV_CD) if (v3_distancesquared(firstHit, vectOrig) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0,0], 8, false, 3);
                                             
                            self.collisionDetected = true;
                            self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-plane"];
                            //if (show_DEV_CD && (edgeHit > -1)) log("edge was " + edgeHit + " plane is " + t0);
                        }
                    }
                }
            }
        } // sph - plane





        // TODO box as mix of plane and edges

        // TODO triangle as simplification of box

    } // end for each other entity perform hit test

}

// animator functions

function anim_sph_firstPass() {
    if (this.state == E3D_RESTART) {
        v3_copy(this.target.position, scn.camera.position);
        this.target.position[1] += 5;
        this.target.rotation[0] = rndPM(PIx2);
        this.target.rotation[1] = rndPM(PIx2);

        this.spd = scn.camera.adjustToCamera(v3_scale_new(_v3_nz, inputs.checkCommand("action_speed", false) ? 600 : 300));

        this.spd[0] += rndPM(1);
        this.spd[1] += rndPM(1);
        this.spd[2] += rndPM(1);
        this.ttl = 30;
        
        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.resetMatrix();
        this.last_position = v3_clone(this.target.position);

        DEV_lastAnimData = { pos: v3_clone(this.target.position), spd: v3_clone(this.spd) };

        
    } else if (this.state == E3D_PLAY) {

        v3_copy(this.last_position, this.target.position);

        v3_scale_res(this.delta, this.spd, timer.delta);  
        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        this.target.resetMatrix();
        this.lastHitMarker = "";
        
        if (show_DEV_CD) { 
            phyTracers.addLine(this.last_position, this.target.position, true);
            phyTracers.moveCursorTo(this.target.position);
            phyTracers.addLineBy(this.delta, false, [1, 1, 1]);
        }
    }
}
function anim_sphRain_firstPass() {
    if (this.state == E3D_RESTART) {

        this.target.position[0] = rndPM(150);
        this.target.position[1] = 150 + rndPM(50);
        this.target.position[2] = rndPM(500);
        this.target.rotation[0] = rndPM(PIx2);
        this.target.rotation[1] = rndPM(PIx2);

        this.spd = [0, 0, 0];

        this.spd[0] += rndPM(1);
        this.spd[1] += rndPM(1);
        this.spd[2] += rndPM(1);
        this.ttl = 30;
        
        this.state = E3D_PLAY;
        this.target.visible = true;
        this.target.resetMatrix();
        this.last_position = v3_clone(this.target.position);

        this.startedYDelta = this.last_position[1];
        this.expectedYDelta = 0;
        
    } else if (this.state == E3D_PLAY) {

        v3_copy(this.last_position, this.target.position);

        v3_scale_res(this.delta, this.spd, timer.delta);   
        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        this.target.resetMatrix();
        this.lastHitMarker = "";

        this.startedYDelta = this.last_position[1];
        this.expectedYDelta = this.delta[1];
    
    }
}
function anim_sph_rePass() {
    if ((this.deltaLength > 0) && (this.collisionDetected)) {

 
            nHits++;
            this.lastHitMarker = this.closestCollision[0];
            // closestCollision = [marker, penetration, n, firstHit, "SphVect-plane"];
            //                       0          1       2     3              4
if (this.closestCollision[1] < 0.0) throw "col behind initial position: " + this.closestCollision[1];

            v3_normalize_mod(this.closestCollision[2]); // change direction on hit

            if (v3_dot(this.closestCollision[2], this.delta) < 0.0){ 
            //v3_negate_mod(this.closestCollision[2]);
//if (v3_dot(this.closestCollision[2], this.delta) > 0.0) throw "delta along normal: " + this.closestCollision[0];
            if ((this.spd[1] < 0.0) && (this.closestCollision[2][1] > 0.0)) {
                var gPenality = lgaccel * this.closestCollision[2][1];
                if (this.spd[1] <= -gPenality) {                     
                    this.spd[1] += gPenality * 1.00; 
                } else {
                    this.spd[1] += -this.closestCollision[2][1] * this.spd[1];
                }
          //      this.spd[1] += gPenality;
          //      if (this.spd[1] < 0.0) this.spd[1] = 0.0;
            }


            v3_reflect_mod(this.spd, this.closestCollision[2]); // reflect per hit normal  
      
           
            v3_copy(this.last_position, this.closestCollision[3]);             
           
            var remainder = 1.0 - (Math.sqrt(this.closestCollision[1]) / this.deltaLength) ; // fraction remaining
            v3_scale_mod(this.spd, 0.8); // hit "drag"
            if (remainder < 0.0) remainder = 0;
//if (remainder < 0.0) throw "remaining delta is negative " + remainder;
            
            v3_scale_res(this.delta, this.spd, remainder * timer.delta * 0.8);
            this.deltaLength = v3_length(this.delta);
            v3_add_res(this.target.position, this.last_position, this.delta);  
            
           
            this.target.resetMatrix();
        }
           // this.state = E3D_PAUSE;
        }

        if (this.collisionFromOther) {

            v3_normalize_mod(this.otherCollision[2]); // change direction on hit
            v3_addscaled_mod(this.spd, this.otherCollision[2], -0.15 * v3_length(this.otherCollision[3])); 

            v3_scale_mod(this.spd, 0.8); // hit "drag"     

            v3_scale_res(this.delta, this.spd, timer.delta);            
            this.deltaLength = v3_length(this.delta);
            v3_add_res(this.target.position, this.last_position, this.delta); 

            this.target.resetMatrix();
        }

        this.collisionDetected = false;
        this.collisionFromOther = false;
}

function anim_sph_endPass() {
    this.spd[1] -= gAccel;
    this.ttl -= timer.delta;

    if (this.ttl < 0) {
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
    hitPoints.set("v-s tca", tca);
    hitPoints.set("v-s t0" ,-1);
    hitPoints.set("v-s t1" ,-1);
if (isNaN(tca)) throw "VectSphHit tca NaN";
    if  (tca < 0) return false;
    // sph behind origin

    var d2 = v3_dot(so, so) - tca * tca;

    if (d2 > sr2) return false;
    // tangential point farther than radius

    var thc = Math.sqrt(sr2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;
    hitPoints.set("v-s t0" , t0);
    hitPoints.set("v-s t1" , t1);
if (isNaN(thc)) throw "VectSphHit thc NaN";
    return (t0 < t1) ? t0 : t1;
}

function vector_sph_t(n, sphO_minus_vectO, sphRadSquared) { // translated to v origin

    var t0 = 0; 
    var t1 = 0;
    var tca = v3_dot(sphO_minus_vectO, n);
if (isNaN(tca)) throw "vector_sph_t tca NaN";

  //  if  (tca < 0) return false;
    // sph behind origin

    var d2 = v3_lengthsquared(sphO_minus_vectO) - (tca * tca);

    if (d2 > sphRadSquared) return false;
    // tangential point farther than radius

    var thc = Math.sqrt(sphRadSquared - d2);
if (isNaN(thc)) throw "vector_sph_t thc NaN";

    t0 = tca - thc;
    t1 = tca + thc;

    return [t0, tca, t1];
}


var _planeIntersect_diff = [0.0, 0.0, 0.0];
function planeIntersect(planePos, planeNormal, vectOrigin, vectDirection) {
// https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection
    var angleCos = v3_dot(planeNormal, vectDirection);
    hitPoints.set("p-v cos", angleCos);
	if (Math.abs(angleCos) < _v3_epsilon) {
      //  log("parallel");
        return false; // parallel, either too far or impossible to get there, edges testing would have catched it
    }
	v3_sub_res(_planeIntersect_diff, planePos, vectOrigin);
    var t = v3_dot(planeNormal, _planeIntersect_diff) / angleCos;

    hitPoints.set("p-v t", t);
  //  if (t < 0.0) return false; // derriere    

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

function vector_vector_t(orig1, v1, orig2, v2) {
    // http://geomalgorithms.com/a07-_distance.html
    v3_sub_res(_vector_vector_distance_Odelta, orig1, orig2);
    var a = v3_lengthsquared(v1);
    var b = v3_dot(v1, v2);
    var c = v3_lengthsquared(v2);
    var d = v3_dot(v1, _vector_vector_distance_Odelta);
    var e = v3_dot(v2, _vector_vector_distance_Odelta);

    var D = a * c - b * b;
    var sc = 0.0;
    var tc = 0.0;

    if (D < _v3_epsilon) {
        sc = -1.0;
        tc = (b > c) ? d / b : e / c;      
    } else {
        sc = (b * e - c * d) / D;
        tc = (a * e - b * d) / D;
    }
    hitPoints.set("v-v_t sc", sc);
    hitPoints.set("v-v_t tc", tc);
    return [sc, tc];
   // v3_addscaled_res(_vector_vector_distance_dP, _vector_vector_distance_Odelta, v1, sc);
   // v3_scale_res(_vector_vector_distance_tcv, v2, tc);
   // v3_sub_mod(_vector_vector_distance_dP, _vector_vector_distance_tcv);

   // return v3_length(_vector_vector_distance_dP);
}
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