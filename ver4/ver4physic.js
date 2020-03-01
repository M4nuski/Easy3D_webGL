// Easy3D_WebGL
// Main testing program for physics and collisiion detection
// Emmanuel Charette 2019-2020

"use strict"

// Engine Stats

var nHitTest = 0;
var nHits = 0;

var show_DEV_CD = false;
var phyTracers, dev_CD, dev_Hits;
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


// Engine Content and state


var animations = [];
var testSph, targetEdge, targetEdge2, targetEdge3, testPlanes, DEV_markers, DEV_wand, DEV_axis, DEV_boxPlanes, DEV_boxBox, DEV_boxDiscrete; // entities
var DEV_anim_step = false;
var moveTarget = "p";

var DEV_anim_active = true;
var sphCounter = 0;
var DEV_lastAnimData = null;

var DEV_lastFire = 0;
var DEV_firing = false;

// Engine Core Components

// TODO make global in core, add entities and anim, add core switch-over methods, add default engine init methods
var gl; // webGL canvas rendering context
timer = new E3D_timing(false, 50, timerTick);
var scn;  // E3D_scene
var inputs = new E3D_input(can, true, true, false, false); // Mouse and Keyboard
var resMngr = new ressourceManager(onRessource);
var meshLoader = new E3D_loader();

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
    ", nAnims: " + padStart(""+animations.length, " ", 6) + ", nHitTests: " + padStart(""+nHitTest, " ", 6) + ", nbHits: " + padStart(""+nHits, " ", 5) + ", nbCDpasses: " + padStart(""+nbCDpasses, " ", 3);

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
    inputs.keyMap.set("action_toggle_fire", "Digit8");

    inputs.keyMap.set("action_anim_clear", "Digit0");
    inputs.keyMap.set("action_CD_clear", "Digit9");
    inputs.keyMap.set("action_anim_replay", "KeyR");
    inputs.keyMap.set("action_anim_step", "KeyT");
    inputs.keyMap.set("rx_dec", E3D_INP_DISABLED);

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
   // testPlanes.addPlane([150, -0, 0], [PIdiv2, 0.25, 0.5], 1024, 512, 64, [1,0,1], true);
    //testPlanes.addPlane([-150, -0, 0], [PIdiv2, -0.25, -0.5], 512, 1024, 64, [0,1,1], true);
    //testPlanes.addWireCube([0, 100, 100], [0,0,0], [50, 50, 50], [1, 0.8, 0.8], true, false, true);

    testPlanes.visible = true;
    scn.addEntity(testPlanes);

    DEV_boxPlanes = new E3D_entity_wireframe_canvas("DEV_boxPlanes");
    DEV_boxPlanes.position = [400, 50, 0];
    DEV_boxPlanes.addPlane([0, 0, -25], [0, 0, 0], 50, 50, 2, [1,0,0], true);
    DEV_boxPlanes.addPlane([0, 0,  25], [0, 0, 0], 50, 50, 2, [1,0,0], true);
    DEV_boxPlanes.addPlane([0, -25, 0], [PIdiv2, 0, 0], 50, 50, 2, [1,0,0], true);
    DEV_boxPlanes.addPlane([0,  25, 0], [PIdiv2, 0, 0], 50, 50, 2, [1,0,0], true);
    DEV_boxPlanes.addPlane([-25, 0, 0], [0, PIdiv2, 0], 50, 50, 2, [1,0,0], true);
    DEV_boxPlanes.addPlane([ 25, 0, 0], [0, PIdiv2, 0], 50, 50, 2, [1,0,0], true);

    DEV_boxPlanes.visible = true;
    DEV_cube_6P_target = scn.addEntity(DEV_boxPlanes);


    DEV_boxBox = new E3D_entity_wireframe_canvas("DEV_boxBox");
    DEV_boxBox.position = [500, 50, 0];
    DEV_boxBox.addWireCube([0, 0, 0], [0, 0, 0], [50, 50, 50], [0, 1, 0], true, false, true);
    DEV_boxBox.visible = true;
    DEV_cube_BX_target = scn.addEntity(DEV_boxBox);


    DEV_boxDiscrete = new E3D_entity_wireframe_canvas("DEV_boxDiscrete");
    DEV_boxDiscrete.position = [600, 50, 0];
    DEV_boxDiscrete.addPlane([0, 0, -25], [0, 0, 0], 50, 50, 2, [0,0,1], false);
    DEV_boxDiscrete.addPlane([0, 0,  25], [0, 0, 0], 50, 50, 2, [0,0,1], false);
    DEV_boxDiscrete.addPlane([0, -25, 0], [PIdiv2, 0, 0], 50, 50, 2, [0,0,1], false);
    DEV_boxDiscrete.addPlane([0,  25, 0], [PIdiv2, 0, 0], 50, 50, 2, [0,0,1], false);
    DEV_boxDiscrete.addPlane([-25, 0, 0], [0, PIdiv2, 0], 50, 50, 2, [0,0,1], false);
    DEV_boxDiscrete.addPlane([ 25, 0, 0], [0, PIdiv2, 0], 50, 50, 2, [0,0,1], false);

    DEV_boxDiscrete.pushCD_plane([  0,   0, -25],  [ 0, 0,-1], [ 1, 0, 0], [ 0, 1, 0], 25, 25);
    DEV_boxDiscrete.pushCD_plane([  0,   0,  25],  [ 0, 0, 1], [ 1, 0, 0], [ 0, 1, 0], 25, 25);
    DEV_boxDiscrete.pushCD_plane([  0, -25,   0],  [ 0,-1, 0], [ 1, 0, 0], [ 0, 0, 1], 25, 25);
    DEV_boxDiscrete.pushCD_plane([  0,  25,   0],  [ 0, 1, 0], [ 1, 0, 0], [ 0, 0, 1], 25, 25);
    DEV_boxDiscrete.pushCD_plane([-25,   0,   0],  [-1, 0, 0], [ 0, 1, 0], [ 0, 0, 1], 25, 25);
    DEV_boxDiscrete.pushCD_plane([ 25,   0,   0],  [ 1, 0, 0], [ 0, 1, 0], [ 0, 0, 1], 25, 25);

    DEV_boxDiscrete.pushCD_edge([-25, -25, -25], [0, 1, 0], 50); // bottom
    DEV_boxDiscrete.pushCD_edge([-25, -25,  25], [0, 1, 0], 50);
    DEV_boxDiscrete.pushCD_edge([ 25, -25, -25], [0, 1, 0], 50);
    DEV_boxDiscrete.pushCD_edge([ 25, -25,  25], [0, 1, 0], 50);

    DEV_boxDiscrete.pushCD_edge([-25, -25, -25], [0, 0, 1], 50); // back
    DEV_boxDiscrete.pushCD_edge([-25,  25, -25], [0, 0, 1], 50);
    DEV_boxDiscrete.pushCD_edge([ 25, -25, -25], [0, 0, 1], 50);
    DEV_boxDiscrete.pushCD_edge([ 25,  25, -25], [0, 0, 1], 50);

    DEV_boxDiscrete.pushCD_edge([-25, -25, -25], [1, 0, 0], 50); // left
    DEV_boxDiscrete.pushCD_edge([-25, -25,  25], [1, 0, 0], 50);
    DEV_boxDiscrete.pushCD_edge([-25,  25, -25], [1, 0, 0], 50);
    DEV_boxDiscrete.pushCD_edge([-25,  25,  25], [1, 0, 0], 50);

    DEV_boxDiscrete.visible = true;
    DEV_cube_DS_target = scn.addEntity(DEV_boxDiscrete);


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
    DEV_wand.position = [0, 50, 100];
    DEV_wand.addLine([0, 0, 0], [0, 25, 0], false, [1, 1, 1]);
    DEV_wand.pushCD_edge([0, 0, 0], [0, 1, 0], 25);
    DEV_wand.addCylinder([0, 0, 0], 8, 25, [0.6, 0.6, 0.6], 32, 4, 10, false);
    DEV_wand.addWireSphere([0, 0, 0], 8, [0, 0 ,1], 32, true, 8);
    DEV_wand.addWireSphere([0, 25, 0], 8, [0, 1 ,0], 32, true, 8);
   // DEV_wand.addWireCube([0, 0, 0], [0, 0, 0], [32, 32, 32], [1, 1, 1], true, false, true);
   // DEV_wand.addTriangle([0, 20, 80], [-30, 20, 150], [30, 20, 150], [1, 1, 1], true);
    DEV_wand.visible = true;
    scn.addEntity(DEV_wand);


    targetEdge3 = new E3D_entity_wireframe_canvas("edge3HitTest");
    targetEdge3.position = [0, 50, 125];
    targetEdge3.addCylinder([0, 0, 0], 1, 150, [0, 1, 0], 8, 2, 5, false);
    targetEdge3.pushCD_edge([0, 0, 0], [0, 1, 0], 150);
    targetEdge3.visible = true;
    targetEdge3.vis_culling = false;
    scn.addEntity(targetEdge3);


    DEV_markers = new E3D_entity_wireframe_canvas("CD_hits_markers");
    DEV_markers.addWireSphere([0,0,0], 1, [1,1,1], 8, false);
    DEV_markers.visible = true;
    DEV_markers.vis_culling = false;
    scn.addEntity(DEV_markers);


    phyTracers = new E3D_entity_wireframe_canvas("PHY_Traces", 1024*32);
    phyTracers.visible = true;
    phyTracers.vis_culling = false;
    scn.addEntity(phyTracers);


    dev_Hits = new E3D_entity_wireframe_canvas("PHY_hits");
    dev_Hits.visible = true;
    dev_Hits.vis_culling = false;
    scn.addEntity(dev_Hits);


    dev_CD = new E3D_entity_wireframe_canvas("DEV/CD_Display");
    dev_CD.visible = false;
    dev_CD.vis_culling = false;
    scn.addEntity(dev_CD);


    //resMngr.addRessource("../Models/PYRA.raw", "Map", "Model");
    resMngr.addRessource("../Models/M1.raw", "Map", "Model");
    //resMngr.addRessource("../Models/BOX10.raw", "Map", "Model", false);
    resMngr.loadAll("models");

    // Activate timer and set scene as active

    timer.run();
    scn.state = E3D_ACTIVE;
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

            DEV_axis = new E3D_entity(name, "", false);

            meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), _v3_gray, _v3_unit);
            meshLoader.addCDFromData(DEV_axis);
            meshLoader.addStrokeData(DEV_axis);
           // meshLoader.smoothNormals(-0.9);
            meshLoader.addModelData(DEV_axis);
            
            DEV_axis.position[1] = 60;
            DEV_axis.position[2] = 750;
            DEV_axis.visible = true;

            scn.addEntity(DEV_axis); 
        }  
    } // msg loaded
}



var _parentView = { normalMatrix : m4_new() };
function prepRender() {

    if (show_DEV_CD) {
        dev_CD.clear();
        if (DEV_anim_active || DEV_anim_step) dev_Hits.clear();
    }
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


  //  dev_CD.addPlane([0, 30, 0],  [PIx2 * range1.value / 1000, PIx2 * range2.value / 1000, PIx2 * range3.value / 1000], 256, 256, 8, [1,1,1], true);
if (DEV_axis.visible) {
    DEV_axis.rotateTo([PIx2 * (range1.value -500) / 1000, PIx2 * (range2.value -500) / 1000, PIx2 * (range3.value -500) / 1000]);
    DEV_axis.resetMatrix();
}
/*
      targetEdge.CD_edge_p[0]; // edge origin
      targetEdge.CD_edge_n[0]; // edge normal
      targetEdge.CD_edge_l[0]; // edge length
      testSph.CD_sph_p[0]; // sphere origin
      testSph.CD_sph_r[0]; // sphere radius
      testSph.CD_sph_rs[0]; // sphere radius squared
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
    



    var sph_p0 = DEV_wand.CD_sph_p[0];
    var sph_p = DEV_wand.CD_sph_p[1];
    var sph_r = 4;
    var sph_n = v3_sub_new(sph_p, sph_p0);
    var sph_l = v3_length(sph_n);
    v3_invscale_mod(sph_n, sph_l);

    var edge_p = targetEdge3.CD_edge_p[0];
    var edge_n = targetEdge3.CD_edge_n[0];
    var edge_l = targetEdge3.CD_edge_l[0];

    var hitRes = capsuleEdgeIntersect(sph_r, sph_p0, sph_n, sph_l, edge_p, edge_n, edge_l);

    if (hitRes != false) {
        var firstHit = v3_addscaled_new(sph_p0, sph_n, hitRes * sph_l);
        DEV_markers.addWireSphere(firstHit, sph_r * 2, _v3_red, 16, false, 8);
    }















    if (DEV_anim_active) {
        cleanupDoneAnimations(animations, scn);
        nbCDpasses = collisionDetectionAnimator(animations, scn, 10);
    } else if (DEV_anim_step) {
        timer.delta = 0.050;
        timer.gAccel = E3D_G * 0.050;
        cleanupDoneAnimations(animations, scn);
        nbCDpasses = collisionDetectionAnimator(animations, scn, 10);
        DEV_anim_step = false;
    }




    if (show_DEV_CD) {
     //   dev_CD.clear();
        for (let i = 0; i < scn.entities.length; ++i) {
            // vis culling
            if (scn.entities[i].vis_culling) dev_CD.addWireSphere(scn.entities[i].position,scn.entities[i].cull_dist * 2, [1,0.5,0], 24, false);

            // sph
            for (let j = 0; j < scn.entities[i].CD_sph; ++j) {
                dev_CD.addWireSphere(scn.entities[i].CD_sph_p[j], scn.entities[i].CD_sph_r[j] * 2, [1,0.5,0.5], 4, false);
            }

            // plane
            for (let j = 0; j < scn.entities[i].CD_plane; ++j) {
                dev_CD.addLineByPosNormLen(scn.entities[i].CD_plane_p[j], scn.entities[i].CD_plane_n[j], 10, false, [1.0,1.0,1.0]);

                dev_CD.addLineByPosNormLen(scn.entities[i].CD_plane_p[j], scn.entities[i].CD_plane_w[j],  scn.entities[i].CD_plane_halfWidth[j], false, [1.0,0.2,0.2]);
                dev_CD.addLineByPosNormLen(scn.entities[i].CD_plane_p[j], scn.entities[i].CD_plane_w[j], -scn.entities[i].CD_plane_halfWidth[j], false, [1.0,0.0,0.0]);

                dev_CD.addLineByPosNormLen(scn.entities[i].CD_plane_p[j], scn.entities[i].CD_plane_h[j],  scn.entities[i].CD_plane_halfHeight[j], false, [0.2,1.0,0.2]);
                dev_CD.addLineByPosNormLen(scn.entities[i].CD_plane_p[j], scn.entities[i].CD_plane_h[j], -scn.entities[i].CD_plane_halfHeight[j], false, [0.0,1.0,0.0]);
            }

            // edge
            for (let j = 0; j < scn.entities[i].CD_edge; ++j) {
                dev_CD.addLineByPosNormLen(scn.entities[i].CD_edge_p[j], scn.entities[i].CD_edge_n[j], scn.entities[i].CD_edge_l[j], false, [1,0.5,0]);
            }

            // box
            for (let j = 0; j < scn.entities[i].CD_box; ++j) {
                dev_CD.addLine( scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopBackRight],
                                scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft], false, [1,0.5,0]);

                dev_CD.addLine( scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopBackLeft],
                                scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontRight], false, [1,0.5,0]);

                dev_CD.addLine( scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackRight],
                                scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopFrontLeft], false, [1,0.5,0]);
    
                dev_CD.addLine( scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft],
                                scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopFrontRight], false, [1,0.5,0]);
            }

            // triangle
            var midpoint = [0,0,0];
            var p2 = [0,0,0];
            var p3 = [0,0,0];
            for (let j = 0; j < scn.entities[i].CD_triangle; ++j) {
                v3_add_res(p2, scn.entities[i].CD_triangle_p1[j], scn.entities[i].CD_triangle_p2p1[j]);
                v3_add_res(p3, scn.entities[i].CD_triangle_p1[j], scn.entities[i].CD_triangle_p3p1[j]);
                v3_avg3_res(midpoint, scn.entities[i].CD_triangle_p1[j], p2, p3);

                dev_CD.addLineByPosNormLen(midpoint, scn.entities[i].CD_triangle_n[j], 10, false, [1.0,1.0,1.0]);
                dev_CD.addLine(midpoint, scn.entities[i].CD_triangle_p1[j], false, [1.0, 0.5, 0.5]);
                dev_CD.addLine(midpoint, p2, false, [0.5, 1.0, 0.5]);
                dev_CD.addLine(midpoint, p3, false, [0.5, 0.5, 1.0]);
            }

        }
        DEV_axis.visible = false;

        dev_CD.visible = true;
        phyTracers.visible = true;
    } else {
        DEV_axis.visible = true;

        dev_CD.visible = false;
        phyTracers.visible = false;
    }



}




function timerTick() {  // Game Loop
    inputs._posSpeed = inputs.checkCommand("action_speed", false) ? 250 : 50;
    inputs.processInputs(timer.delta);
    inputs.smoothRotation(6);
    inputs.smoothPosition(6);

    updateStatus();
    nHitTest = 0;
    nHits = 0;

    if (inputs.checkCommand("action1", true)) {

        let newSph = scn.cloneEntity("sph", "sph" + sphCounter++);
        newSph.position[1] = 5;
        newSph.rotation[0] = rndPM(PIx2);
        newSph.rotation[1] = rndPM(PIx2);
        animations.push(newBaseAnim_RelativeToCamera(newSph, scn.camera,
             [rndPM(1), rndPM(1), rndPM(1) + ((inputs.checkCommand("action_speed", false)) ? -600 : -300)], _v3_null, 1.0, 30, true));
        animations[animations.length-1].target.animIndex = animations.length-1;

        DEV_lastAnimData = { pos: v3_clone(newSph.position), spd: v3_clone(animations[animations.length-1].pspd) }

    }
    if (inputs.checkCommand("action2", false)) {
        //  console.log("action0", true);
        for (var i = 0; i < 32; ++i) {
            let newSph = scn.cloneEntity("sph", "sphR" + sphCounter++);            
            newSph.position[0] = rndPM(150);
            newSph.position[1] = 150 + rndPM(50);        
            newSph.position[2] = rndPM(500);
            newSph.rotation[0] = rndPM(PIx2);
            newSph.rotation[1] = rndPM(PIx2);
            animations.push(newBaseAnim(newSph,                
                [rndPM(10), rndPM(10), rndPM(10)], _v3_null, 1.0, 30, true));
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

    if (inputs.checkCommand("action_toggle_fire", true)) { DEV_firing = !DEV_firing; if (DEV_firing) DEV_lastFire = timer.lastTick; }

    if (inputs.checkCommand("action_CD_clear", true)) { phyTracers.clear(); }

    if (inputs.checkCommand("action_anim_step", true)) { DEV_anim_step = true; }

    if (inputs.checkCommand("action_anim_clear", true)) {
        for (let i = animations.length -1; i >=0; --i) {
            scn.removeEntity(animations[i].target.id, false);
            animations.splice(i, 1);
        } 
    }
    if (inputs.checkCommand("action_anim_replay", true)) {
        if (DEV_lastAnimData != null) {
            let newSph = scn.cloneEntity("sph", "sph" + sphCounter++);
            newSph.moveTo(DEV_lastAnimData.pos);
            animations.push(newBaseAnim(newSph, DEV_lastAnimData.spd, _v3_null, 1.0, 30, true));
            animations[animations.length-1].target.animIndex = animations.length-1;
        }
    }

    if (DEV_firing && DEV_anim_active) {
        if ((timer.lastTick - DEV_lastFire) > 250) {
            DEV_lastFire = timer.lastTick;

            var xdelta = rndPM(30);
            var speed = [rndPM(5), rndPM(5), rndPM(5) - 300];

            let newSph = scn.cloneEntity("sph", "sphF" + sphCounter++);
            newSph.moveTo([400 + xdelta, 60, 75]);
            animations.push(newBaseAnim(newSph, speed, _v3_null, 0, 0.31, true ));
            animations[animations.length-1].target.animIndex = animations.length-1;

            newSph = scn.cloneEntity("sph", "sphF" + sphCounter++);
            newSph.moveTo([500 + xdelta, 60, 75]);
            animations.push(newBaseAnim(newSph, speed, _v3_null, 0, 0.31, true ));
            animations[animations.length-1].target.animIndex = animations.length-1;

            newSph = scn.cloneEntity("sph", "sphF" + sphCounter++);
            newSph.moveTo([600 + xdelta, 60, 75]);
            animations.push(newBaseAnim(newSph, speed, _v3_null, 0, 0.31, true ));
            animations[animations.length-1].target.animIndex = animations.length-1;

        }
    }

    if (scn.state == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }   
}






}); // DOMContentLoaded