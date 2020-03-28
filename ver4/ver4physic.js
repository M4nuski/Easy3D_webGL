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
const range4 = document.getElementById("myRange4");
const range5 = document.getElementById("myRange5");

log("Set DOM Events");
window.addEventListener("resize", winResize); // To reset camera matrix


// Engine Config


const _fieldOfView = 45 * DegToRad;
const _zNear = 0.1;
const _zFar = 1024.0;


// Engine Content and state

var animations = [];
var worldPlanes, mazeMesh;

var capsule1, capsule2; // capsule-capsule intersection tests
var edge1_r = 20;
var edge2_r = 10;
var edge1_l = 150;
var edge2_l = 100;

var sph_source, sph_target;
var point_source;
var edge_target;
var plane_target, planeWithEdges_target;
var box_target;
var triangle_target, triangleWithEdges_target;

var DEV_markers;  
var DEV_boxPlanes, DEV_boxBox, DEV_boxDiscrete; // entities

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
       scn.camera.moveTo(0, 60, -20, -0 * DegToRad, -0 * DegToRad, 0);
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
    inputs.keyMap.set("rx_dec", E3D_INP_DISABLED);

    inputs.keyMap.set("action_toggle_CD", "Backquote"); // #
    inputs.keyMap.set("action_speed", "ShiftLeft");

    inputs.keyMap.set("action_switch_ctrl_player", "Digit1");
    inputs.keyMap.set("action_switch_ctrl_capsule1", "Digit2");
    inputs.keyMap.set("action_switch_ctrl_capsule2", "Digit3");
    inputs.keyMap.set("action_switch_ctrl_sphereSource", "Digit4");
    inputs.keyMap.set("action_switch_ctrl_pointSource", "Digit5");    

    inputs.keyMap.set("action_toggle_autofire", "Digit8");
    inputs.keyMap.set("action_CD_clear", "Digit9");
    inputs.keyMap.set("action_anim_clear", "Digit0");
    inputs.keyMap.set("action_anim_replay", "KeyR");
    inputs.keyMap.set("action_anim_step", "KeyT");

    // Scene entity creation // TODO in JSON scene file

    // entities
    var sph = new E3D_entity_wireframe_canvas("sph"); // the ball to throw
    sph.addWireSphere([0,0,0], 16, [1,1,0], 32, true, 8);
    sph.visible = false;
    scn.addEntity(sph);

    worldPlanes = new E3D_entity_wireframe_canvas("planes");
    worldPlanes.addPlane([0, -50, 0], [PIdiv2, 0, 0], 2048, 2048, 64, [1,1,0], true);
    worldPlanes.addPlane([150, -0, 0], [PIdiv2, 0.25, 0.5], 1024, 512, 64, [1,0,1], true);
    worldPlanes.addPlane([-150, -0, 0], [PIdiv2, -0.25, -0.5], 512, 1024, 64, [0,1,1], true);  
    worldPlanes.visible = true;
    scn.addEntity(worldPlanes);

    // capsule CD test entities
    capsule1 = new E3D_entity_wireframe_canvas("capsuleHitTarget1");
    capsule1.position = [15, 0, -250];
    capsule1.addCylinder([0, 0, 0], edge1_r*2, edge1_l, [1, 0, 0], 32, 4, 10, false);
    capsule1.pushCD_edge([0, 0, 0], [0, 1, 0], edge1_l);
    capsule1.visible = true;
    capsule1.vis_culling = false;
    scn.addEntity(capsule1);


    capsule2 = new E3D_entity_wireframe_canvas("capsuleHitTarget2");
    capsule2.position = [-15, 0, -250];
    capsule2.addCylinder([0, 0, 0], edge2_r*2, edge2_l, [0, 1, 0], 32, 4, 10, false);
    capsule2.pushCD_edge([0, 0, 0], [0, 1, 0], edge2_l);
    capsule2.visible = true;
    capsule2.vis_culling = false;
    scn.addEntity(capsule2);
    
    // generic CD test entities
    sph_source = new E3D_entity_wireframe_canvas("capsuleWand");
    sph_source.position = [10, 50, 10];
    sph_source.rotation = [0, 0, Math.PI]; 
    sph_source.addLine([0, 0, 0], [0, 25, 0], false, [1, 1, 1]);
    sph_source.pushCD_edge([0, 0, 0], [0, 1, 0], 25);
    sph_source.addCylinder([0, 0, 0], 8, 25, [0.6, 0.6, 0.6], 32, 4, 10, false);
    sph_source.addWireSphere([0,  0, 0], 8, _v3_green, 32, true, 8);
    sph_source.addWireSphere([0, 25, 0], 8, _v3_red,   32, true, 8);
    sph_source.visible = true;
    scn.addEntity(sph_source);

    point_source = new E3D_entity_wireframe_canvas("edgeWand");
    point_source.position = [-10, 50, 10];
    point_source.rotation = [0, 0, Math.PI]; 
    point_source.addWireCross([0,  0, 0], 5, _v3_green);
    point_source.addWireCross([0, 25, 0], 5, _v3_red);
    point_source.addLine([0, 0, 0], [0, 25, 0], false, _v3_white);
    point_source.pushCD_edge2p([0, 0, 0], [0, 25, 0]);
    point_source.visible = true;
    scn.addEntity(point_source);

    sph_target = new E3D_entity_wireframe_canvas("wireSphereTarget");
    sph_target.addWireSphere([0,0,0], 50, _v3_white, 64, true, 8);
    sph_target.visible = true;
    scn.addEntity(sph_target);

    edge_target = new E3D_entity_wireframe_canvas("edgeTarget");
    edge_target.position = [0, 0, 50];
    edge_target.addCylinder([0, 0, 0], 0.25, 50, _v3_white, 6, 2, 5, false);
    edge_target.pushCD_edge([0, 0, 0], [0, 1, 0], 50);
    edge_target.visible = true;
    edge_target.vis_culling = false;
    scn.addEntity(edge_target);

    plane_target = new E3D_entity_wireframe_canvas("planeTarget");
    plane_target.position = [0, 0, 100];
    plane_target.addPlane([ 0, 0, 0], [0, PIdiv2, 0], 28, 50, 2, _v3_white, true);
    plane_target.CD_edge = 0;
    plane_target.visible = true;
    plane_target.vis_culling = false;
    scn.addEntity(plane_target);

    planeWithEdges_target = new E3D_entity_wireframe_canvas("planeWithEdgesTarget");
    planeWithEdges_target.position = [0, 100, 100];
    planeWithEdges_target.addPlane([ 0, 0, 0], [0, PIdiv2, 0], 28, 50, 2, _v3_gray, true);
    planeWithEdges_target.addLine([ 0,  25,  14], [ 0, -25,  14], false, _v3_white);
    planeWithEdges_target.addLine([ 0,  25, -14], [ 0, -25, -14], false, _v3_white);
    planeWithEdges_target.addLine([ 0,  25,  14], [ 0,  25, -14], false, _v3_white);
    planeWithEdges_target.addLine([ 0, -25,  14], [ 0, -25, -14], false, _v3_white);
    planeWithEdges_target.visible = true;
    planeWithEdges_target.vis_culling = false;
    scn.addEntity(planeWithEdges_target);

    box_target = new E3D_entity_wireframe_canvas("boxTarget");
    box_target.position = [0, 0, 150];
    box_target.addWireCube([0, 0, 0], [0, 0, 0], [30, 30, 30], _v3_white, true, false, true);
    box_target.visible = true;
    box_target.vis_culling = false;
    scn.addEntity(box_target);

    triangle_target = new E3D_entity_wireframe_canvas("triangleTarget");
    var p1 = [0, 0, 0];
    var p2 = [-30, 40, 75];
    var p3 = [30, 20, 75];
    var pa = v3_avg3_new(p1, p2, p3);
    triangle_target.position = [0, 0, 200];
    triangle_target.addTriangle(p1, p2, p3, _v3_white, true);
    triangle_target.addLine(p1, pa, false, _v3_white);
    triangle_target.addLine(p2, pa, false, _v3_white);
    triangle_target.addLine(p3, pa, false, _v3_white);    
    triangle_target.visible = true;
    triangle_target.vis_culling = false;
    scn.addEntity(triangle_target);

    triangleWithEdges_target = new E3D_entity_wireframe_canvas("triangleWithEdgesTarget");
    triangleWithEdges_target.position = [0, 100, 200];
    triangleWithEdges_target.addTriangle(p1, p2, p3, _v3_gray, true);
    triangleWithEdges_target.addLine(p1, p2, false, _v3_white);
    triangleWithEdges_target.addLine(p2, p3, false, _v3_white);
    triangleWithEdges_target.addLine(p3, p1, false, _v3_white);
    triangleWithEdges_target.addLine(p1, pa, false, _v3_gray);
    triangleWithEdges_target.addLine(p2, pa, false, _v3_gray);
    triangleWithEdges_target.addLine(p3, pa, false, _v3_gray);    
    triangleWithEdges_target.pushCD_edge2p(p1, p2);
    triangleWithEdges_target.pushCD_edge2p(p2, p3);
    triangleWithEdges_target.pushCD_edge2p(p3, p1);
    triangleWithEdges_target.visible = true;
    triangleWithEdges_target.vis_culling = false;
    scn.addEntity(triangleWithEdges_target);



    // diferent types of boxes CD definitions for perf benchmarking
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




    // DEV entities
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

    // external meshes
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

            mazeMesh = new E3D_entity(name, "", false);

            meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), _v3_gray, _v3_unit);
            meshLoader.addCDFromData(mazeMesh);
            meshLoader.addStrokeData(mazeMesh);
           // meshLoader.smoothNormals(-0.9);
            meshLoader.addModelData(mazeMesh);
            
            mazeMesh.position[1] = 60;
            mazeMesh.position[2] = 750;
            mazeMesh.visible = true;

            scn.addEntity(mazeMesh); 
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
        case 'c2': // capsule2        
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            capsule2.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            capsule2.rotateByParent([inputs.rx_delta_smth, inputs.rz_delta_smth, inputs.ry_delta_smth], _parentView);
            capsule2.resetMatrix();
            break;
        case 'c1': // capsule1      
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            capsule1.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            capsule1.rotateByParent([inputs.rx_delta_smth, inputs.rz_delta_smth, inputs.ry_delta_smth], _parentView);
            capsule1.resetMatrix();
            break;
        case 'sphere':   
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            sph_source.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            sph_source.rotateByParent([inputs.rx_delta_smth, inputs.rz_delta_smth, inputs.ry_delta_smth], _parentView);
            sph_source.resetMatrix();
            break;
        case 'point': 
            m4_rotationY_res(_parentView.normalMatrix, -scn.camera.rotation[1]);
            m4_rotateX_mod(_parentView.normalMatrix, -scn.camera.rotation[0]);

            point_source.moveByParent([-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth], _parentView);
            point_source.rotateByParent([inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth], _parentView);
            point_source.resetMatrix();
            break;
        default:
            scn.camera.moveBy(-inputs.px_delta_smth, inputs.py_delta_smth, inputs.pz_delta_smth, 
                               inputs.rx_delta_smth, inputs.ry_delta_smth, inputs.rz_delta_smth);
      }



    // move maze per sliders
    if (mazeMesh.visible) {
        mazeMesh.rotateTo([PIx2 * (range1.value -500) / 1000, PIx2 * (range2.value -500) / 1000, PIx2 * (range3.value -500) / 1000]);
        mazeMesh.resetMatrix();
    }

    // clear DEV markers
    DEV_markers.clear();


// CD function tests

// capsule-capsule setup
edge1_r = range1.value / 10;
edge1_l = range2.value / 2;
edge2_r = range3.value / 10;
edge2_l = range4.value / 2;

capsule1.clear();
capsule1.addCylinder([0, 0, 0], edge1_r*2, edge1_l, _v3_red, 32, 4, 10, false);
capsule1.pushCD_edge([0, 0, 0], [0, 1, 0], edge1_l);
capsule1.resetMatrix();

capsule2.clear();
capsule2.addCylinder([0, 0, 0], edge2_r*2, edge2_l, _v3_green, 32, 4, 10, false);
capsule2.pushCD_edge([0, 0, 0], [0, 1, 0], edge2_l);
capsule2.resetMatrix();

// capsule-capsule CD dev 
    var edge_r_sum = edge1_r + edge2_r;

    var v1 = [0,0,0];
    var v2 = [0,0,0];

    v3_scale_res(v1, capsule1.CD_edge_n[0], capsule1.CD_edge_l[0]);
    v3_scale_res(v2, capsule2.CD_edge_n[0], capsule2.CD_edge_l[0]);
    
    var closestPt = path_path_closest_t(capsule1.CD_edge_p[0], v1, capsule2.CD_edge_p[0], v2);
    hitPoints.set("c_c cpa t",  closestPt);

    v3_addscaled_res(v1, capsule1.CD_edge_p[0], capsule1.CD_edge_n[0], capsule1.CD_edge_l[0] * closestPt);
    v3_addscaled_res(v2, capsule2.CD_edge_p[0], capsule2.CD_edge_n[0], capsule2.CD_edge_l[0] * closestPt);
    DEV_markers.addLine(v1, v2, false, [1,0,1]);   

    var edge_dist = v3_distance(v1, v2);
    hitPoints.set("c_c edge_dist", edge_dist);


    if ((closestPt >= 0.0) && (closestPt <= 1.0) && (edge_dist <= edge_r_sum)) {

        // sph hit at closest approach
        v3_addscaled_res(v1, capsule1.CD_edge_p[0], capsule1.CD_edge_n[0], capsule1.CD_edge_l[0] * closestPt);
        v3_addscaled_res(v2, capsule2.CD_edge_p[0], capsule2.CD_edge_n[0], capsule2.CD_edge_l[0] * closestPt);
        DEV_markers.addWireSphere(v1, edge1_r  * 2, [1, 0.5, 0.5], 32, false, 5);
        DEV_markers.addWireSphere(v2, edge2_r * 2, [1, 0.5, 0.5], 32, false, 5);

        var edge_pen = Math.sqrt((edge_r_sum * edge_r_sum) - (edge_dist * edge_dist));
        hitPoints.set("c_c edge_pen", edge_pen);

        // weird approximation that works ok
        var start_dist = v3_distance(capsule2.CD_edge_p[0], capsule1.CD_edge_p[0]) * 1.4142;
        var closestPt2 = closestPt * (edge_r_sum - start_dist) / (edge_dist - edge_pen - start_dist); 

       // compensated sph hit
       v3_addscaled_res(v1, capsule1.CD_edge_p[0], capsule1.CD_edge_n[0], capsule1.CD_edge_l[0] * closestPt2);
       v3_addscaled_res(v2, capsule2.CD_edge_p[0], capsule2.CD_edge_n[0], capsule2.CD_edge_l[0] * closestPt2);
       DEV_markers.addWireSphere(v1, edge1_r*2, [0.5, 1.0, 0.5], 32, false, 5);
       DEV_markers.addWireSphere(v2, edge2_r*2, [0.5, 1.0, 0.5], 32, false, 5);   
    } 


    // Position marker along t
    var off = range5.value / 1000;
    hitPoints.set("slide5 pos", off);
    v3_addscaled_res(v1, capsule1.CD_edge_p[0], capsule1.CD_edge_n[0], capsule1.CD_edge_l[0] * off);
    v3_addscaled_res(v2, capsule2.CD_edge_p[0], capsule2.CD_edge_n[0], capsule2.CD_edge_l[0] * off);
    DEV_markers.addWireSphere(v1, edge1_r  * 2, _v3_white, 32, false, 5);
    DEV_markers.addWireSphere(v2, edge2_r * 2, _v3_white, 32, false, 5);


    // capsule intersect setup
    var cap_p0 = sph_source.CD_sph_p[0];
    var cap_p  = sph_source.CD_sph_p[1];
    var cap_r  = sph_source.CD_sph_r[0];
    var cap_n = v3_sub_new(cap_p, cap_p0);
    var cap_l = v3_length(cap_n);
    v3_invscale_mod(cap_n, cap_l);    


    // capsule edge intersect test 
    var edge_p = edge_target.CD_edge_p[0];
    var edge_n = edge_target.CD_edge_n[0];
    var edge_l = edge_target.CD_edge_l[0];

    var firstHit = v3_new();
    var hitRes = capsuleEdgeIntersect_res(firstHit, cap_r, cap_p0, cap_n, cap_l, edge_p, edge_n, edge_l);

    if (hitRes != false) {
        var htiPos = v3_addscaled_new(cap_p0, cap_n, hitRes * cap_l);
        DEV_markers.addWireSphere(htiPos, cap_r * 2, _v3_blue, 16, false, 8);
        DEV_markers.addLine(firstHit, htiPos, false, _v3_white);
    }


    // capsule sphere intersect test
    var sph_p0 = sph_target.CD_sph_p[0];
    var sph_r  = sph_target.CD_sph_r[0];

    var hitRes = capsuleSphereIntersect(cap_r, cap_p0, cap_n, cap_l, sph_p0, sph_r);

    if (hitRes != false) {
        var firstHit = v3_addscaled_new(cap_p0, cap_n, hitRes);
        DEV_markers.addWireSphere(firstHit, cap_r * 2, _v3_blue, 16, false, 8);
        DEV_markers.addLine(firstHit, sph_p0, false, _v3_white);
    }


    // capsule plane intersect test
    var firstHit = v3_new();
    var hitRes = capsulePlaneIntersect_res(firstHit, cap_r, cap_p0, cap_n, 
        plane_target.CD_plane_n[0], plane_target.CD_plane_p[0], 
        plane_target.CD_plane_w[0], plane_target.CD_plane_halfWidth[0],
        plane_target.CD_plane_h[0], plane_target.CD_plane_halfHeight[0]);

    if ((hitRes != false) && (hitRes <= cap_l)) {
        DEV_markers.addWireSphere(firstHit, cap_r * 2, _v3_blue, 16, false, 8);
        var dp = v3_sub_new(cap_p0, plane_target.CD_plane_p[0])
        if (v3_dot(dp, plane_target.CD_plane_n[0]) >= 0.0) { 
            DEV_markers.addLineByPosNormLen(firstHit, plane_target.CD_plane_n[0], -cap_r, false, _v3_white);
        } else {
            DEV_markers.addLineByPosNormLen(firstHit, plane_target.CD_plane_n[0],  cap_r, false, _v3_white);
        }
    }


    // capsule triangle intersect test
    var firstHit = v3_new();
    var hitRes = triangle_capsule_intersect_res(firstHit, cap_p0, cap_n, cap_r,
        triangle_target.CD_triangle_p1[0], triangle_target.CD_triangle_p3p1[0], triangle_target.CD_triangle_p2p1[0],
        triangle_target.CD_triangle_p3p1lenSq[0], triangle_target.CD_triangle_p2p1lenSq[0], triangle_target.CD_triangle_p3p2p1dot[0],
        triangle_target.CD_triangle_n[0]);

    if ((hitRes != false) && (hitRes <= cap_l)) {
        DEV_markers.addWireSphere(firstHit, cap_r * 2, _v3_blue, 16, false, 8);
        DEV_markers.addLineByPosNormLen(firstHit, triangle_target.CD_triangle_n[0], -cap_r, false, _v3_white);
    }



    // capsule triangleWithEdges intersect test
    var firstHit = v3_new();
    var hitRest = triangle_capsule_intersect_res(firstHit, cap_p0, cap_n, cap_r,
        triangleWithEdges_target.CD_triangle_p1[0], triangleWithEdges_target.CD_triangle_p3p1[0], triangleWithEdges_target.CD_triangle_p2p1[0],
        triangleWithEdges_target.CD_triangle_p3p1lenSq[0], triangleWithEdges_target.CD_triangle_p2p1lenSq[0], triangleWithEdges_target.CD_triangle_p3p2p1dot[0],
        triangleWithEdges_target.CD_triangle_n[0]);

    if ((hitRest != false) && (hitRest <= cap_l)) {
        DEV_markers.addWireSphere(firstHit, cap_r * 2, [0, 0, 0.5], 16, false, 8);
        DEV_markers.addLineByPosNormLen(firstHit, triangleWithEdges_target.CD_triangle_n[0], -cap_r, false, _v3_gray);
        hitPoints.set("c_te t hitRes", hitRest / cap_l);
    }

    for (var i = 0; i < 3; ++i) {
        var edge_p = triangleWithEdges_target.CD_edge_p[i];
        var edge_n = triangleWithEdges_target.CD_edge_n[i];
        var edge_l = triangleWithEdges_target.CD_edge_l[i];

        var firstHit = v3_new();
        var hitRes = capsuleEdgeIntersect_res(firstHit, cap_r, cap_p0, cap_n, cap_l, edge_p, edge_n, edge_l);

        if (hitRes != false) {
            var htiPos = v3_addscaled_new(cap_p0, cap_n, hitRes * cap_l);
            DEV_markers.addWireSphere(htiPos, cap_r * 2, _v3_blue, 16, false, 8);
            DEV_markers.addLine(firstHit, htiPos, false, _v3_white);
            hitPoints.set("c_te e hitRes", hitRes);

            hitPoints.set("c_te te sign", Math.sign(hitRes - hitRest));
        }
    }



    // vector intersect setup
    var vect_p0 = point_source.CD_edge_p[0];
    var vect_p  = v3_addscaled_new(vect_p0, point_source.CD_edge_n[0], point_source.CD_edge_l[0])
    var vect_v  = v3_sub_new(vect_p, vect_p0);
    var vect_l  = v3_length(vect_v);
    var vect_n  = v3_invscale_new(vect_v, vect_l); 

    var posOffset = v3_new();
    var firstHit = v3_new();


    // vector-sphere intersect
    var sph_p0 = sph_target.CD_sph_p[0];
    var sph_r  = sph_target.CD_sph_r[0];
    var sph_r2 = sph_r * sph_r;

    v3_sub_res(posOffset, sph_p0, vect_p0);

    var hitRes = vector_sph_min_t(vect_n, posOffset, sph_r2);  
    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= vect_l)) {
        v3_addscaled_res(firstHit, vect_p0, vect_n, hitRes); 
        DEV_markers.addWireCross(firstHit, 5, _v3_lightblue);
    }

    // vector-plane intersect
    v3_sub_res(posOffset, vect_p0, plane_target.CD_plane_p[0]);
    var hitRes = vectorPlaneIntersect(posOffset, plane_target.CD_plane_n[0], vect_n);       

    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= vect_l)) {

        v3_addscaled_res(firstHit, vect_p0, vect_n, hitRes);
        v3_sub_res(posOffset, firstHit, plane_target.CD_plane_p[0]);

        if (insidePlane(posOffset, plane_target.CD_plane_h[0], plane_target.CD_plane_halfHeight[0],
            plane_target.CD_plane_w[0],  plane_target.CD_plane_halfWidth[0]) ) {
                DEV_markers.addWireCross(firstHit, 5, _v3_lightblue);
        }
    }

    // vector-triangle intersect
    var hitRes = triangle_vector_intersect_res(firstHit, vect_p0, vect_n, 
        triangle_target.CD_triangle_p1[0], triangle_target.CD_triangle_p3p1[0], triangle_target.CD_triangle_p2p1[0], 
        triangle_target.CD_triangle_p3p1lenSq[0], triangle_target.CD_triangle_p2p1lenSq[0],
        triangle_target.CD_triangle_p3p2p1dot[0], triangle_target.CD_triangle_n[0]);

    if ((hitRes != false) && (hitRes <= vect_l) && (hitRes >= 0.0) ) {      
        DEV_markers.addWireCross(firstHit, 5, _v3_lightblue); 
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
        mazeMesh.visible = false;

        dev_CD.visible = true;
        phyTracers.visible = true;
    } else {
        mazeMesh.visible = true;

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
        animations[animations.length-1].sourceCollResolver = collisionResult_asSource_slide;
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
    if (inputs.checkCommand("action_switch_ctrl_player", true)) { moveTarget = "player";  inputs.mousePosDirection = 1; }
    if (inputs.checkCommand("action_switch_ctrl_capsule1", true)) { moveTarget = "c1";  inputs.mousePosDirection = -1; }
    if (inputs.checkCommand("action_switch_ctrl_capsule2", true)) { moveTarget = "c2";  inputs.mousePosDirection = -1; }
    if (inputs.checkCommand("action_switch_ctrl_sphereSource", true)) { moveTarget = "sphere";  inputs.mousePosDirection = -1; }
    if (inputs.checkCommand("action_switch_ctrl_pointSource", true)) { moveTarget = "point";  inputs.mousePosDirection = -1; }

    if (inputs.checkCommand("action_toggle_autofire", true)) { DEV_firing = !DEV_firing; if (DEV_firing) DEV_lastFire = timer.lastTick; }

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