// Easy3D_WebGL
// Test program for v5 vector
// Emmanuel Charette 2022

"use strict"


console.log("User Main Script Start");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
let cam_o = new E3D_camera("cam_o");
let cam_p = new E3D_camera_persp("cam_p");
let cam_m = new E3D_camera_model("cam_m");
let cam_s = new E3D_camera_space("cam_s");
CAMERA = cam_p;

E3D_onResize();
SCENE.setClearColor(_v3_darkgray);
SCENE.fogLimit = E3D_FAR - 1;

var E3D_culling = E3D_cullingMode.FUSTRUM;

INPUTS._mouseWheelSpeed = 1.0;


var dataMap = new Map();
function formatDataMap() {
    var text = "";
    dataMap.forEach((a, b) => { text += (b + ": " + a) + "\n"; } );
    return text;
}
function setData(item, data) {
    dataMap.set(item, data);
}
function setDataFloat(item, data, dec = 3) {
    dataMap.set(item, data.toFixed(dec));
}
function setDataV3(item, data) {
    dataMap.set(item, v3_string(data));
}

// Create a new entity
var entity = new E3D_entity_wireframe_canvas("entity0");

// Large axis planes
entity.addPlane(_v3_origin, _v3_90x, 1000, 1000, _v3_lightgreen, 20);
entity.addPlane(_v3_origin, _v3_90y, 1000, 1000, _v3_lightred, 20);
entity.addPlane(_v3_origin, _v3_90z, 1000, 1000, _v3_lightblue, 20);

var entity2 = new E3D_entity_wireframe_canvas("entity1");
// Small axis planes
entity2.addPlane(_v3_origin, _v3_90x, 1000, 1000, _v3_darkgreen, 100);
entity2.addPlane(_v3_origin, _v3_90y, 1000, 1000, _v3_darkred, 100);
entity2.addPlane(_v3_origin, _v3_90z, 1000, 1000, _v3_darkblue, 100);


let offset = [10.0, 0.0, 0.0];
let p0 = [ 0.0, 0.0, 0.0];
let p1 = [ -2.0, 20.0, 10.0];
let p = [ 10.0, 25.0, -5.0];
let v = v3_sub_new(p1, p0);
let n = v3_normalize_new(v);
entity.addLine(p0, p1, _v3_lightgreen);
entity.addLineByPosNormLen(p0, n, 2.0, _v3_white);
let resv = v3_proj_on_normal_new(p, n);
let resp = v3_proj_on_normalplane_new(p, n);
entity.addCross(p, 1.0, _v3_white);
entity.addCross(resp, 1.0, _v3_red);
entity.addCross(resv, 1.0, _v3_blue);
entity.addLine(p0, p, _v3_lightgray);
entity.addLine(p, resp, _v3_lightgray);
entity.addLine(p, resv, _v3_lightgray);

v3_add_mod(p0, offset);
v3_add_mod(p1, offset);
v3_add_mod(p, offset);
v = v3_sub_new(p1, p0);
n = v3_normalize_new(v);
entity.addLine(p0, p1, _v3_white);
resv = v3_proj_on_offsetnormal_new(p, p0, n);
resp = v3_proj_on_plane_new(p, p0, n);
entity.addCross(p, 1.0, _v3_white);
entity.addCross(resp, 1.0, _v3_red);
entity.addCross(resv, 1.0, _v3_blue);
entity.addLine(p0, p, _v3_lightgray);
entity.addLine(p, resp, _v3_lightgray);
entity.addLine(p, resv, _v3_lightgray);

v3_add_mod(p0, offset);
v3_add_mod(p1, offset);
v3_add_mod(p, offset);
v = v3_sub_new(p1, p0);
n = v3_normalize_new(v);
entity.addLine(p0, p1, _v3_white);
resv = v3_proj_on_vector_new(p, p0, v);
resp = v3_proj_on_vectorplane_new(p, p0, v);
entity.addCross(p, 1.0, _v3_white);
entity.addCross(resp, 1.0, _v3_red);
entity.addCross(resv, 1.0, _v3_blue);
entity.addLine(p0, p, _v3_lightgray);
entity.addLine(p, resp, _v3_lightgray);
entity.addLine(p, resv, _v3_lightgray);

v3_add_mod(p0, offset);
v3_add_mod(p1, offset);
v3_add_mod(p, offset);
v = v3_sub_new(p1, p0);
n = v3_normalize_new(v);
entity.addLine(p0, p1, _v3_white);
resv = v3_proj_on_segment_new(p, p0, p1);
resp = v3_proj_on_segmentplane_new(p, p0, p1);
entity.addCross(p, 1.0, _v3_white);
entity.addCross(resp, 1.0, _v3_red);
entity.addCross(resv, 1.0, _v3_blue);
entity.addLine(p0, p, _v3_lightgray);
entity.addLine(p, resp, _v3_lightgray);
entity.addLine(p, resv, _v3_lightgray);

let axis1 = new E3D_entity_axis("rotateToCameraView", 25.0, true, 25.0, true);
axis1.moveTo([0.01, 50.01, 0.01]);
axis1.isVisible = true;
E3D_addEntity(axis1);
let axis2 = new E3D_entity_axis("inCameraSpace", 25.0, true, 1.0, false);
axis2.moveTo([0.01, 75.01, 0.01]);
axis2.isVisible = true;
E3D_addEntity(axis2);

E3D_addEntity(entity2);
entity.isVisible = true;
E3D_addEntity(entity);

var point1 = new E3D_entity_wireframe_canvas("point1");
point1.addSphere([0.0, 0.0, 0.0], 5.0, _v3_red, 16, 8);
point1.isVisible = true;
E3D_addEntity(point1);
var point2 = new E3D_entity_wireframe_canvas("point2");
point2.addSphere([0.0, 0.0, 0.0], 5.0, _v3_green, 16, 8);
point2.isVisible = true;
E3D_addEntity(point2);

    var point = new E3D_entity_wireframe_canvas("point#0");
    point.addSphere([0.0, 0.0, 0.0], 10.0, _v3_green, 12, 4);
    point.addSphere([0.0, 0.0, 0.0], 5.0, _v3_red, 12, 4);
    point.moveTo(v3_addnoise_new(_v3_null, 1024.0));
    point.isVisible = true;
    E3D_addEntity(point);
    point.visibilityDistance = 5.0;   // override for testing

    forN(2048, (i) => {
        var point2 = E3D_cloneEntity(point, "point#" + (i+1), true);
        ENTITIES[point2].moveTo(v3_addnoise_new(_v3_null, 1024.0));
        ENTITIES[point2].updateMatrix();
        ENTITIES[point2].isVisible = true;
        //E3D_addEntity(point2);
        ENTITIES[point2].visibilityDistance = 5.0;   // override for testing
    });

var culltestpoint1 = new E3D_entity_wireframe_canvas("ctpoint1");
culltestpoint1.addSphere([0.0, 0.0, 0.0], 10.0, _v3_green, 16, 4);
culltestpoint1.addSphere([0.0, 0.0, 0.0], 5.0, _v3_red, 16, 4);
culltestpoint1.isVisible = true;
E3D_addEntity(culltestpoint1);
culltestpoint1.visibilityDistance = 5.0; // override for testing

var culltestpoint2 = new E3D_entity_wireframe_canvas("ctpoint2");
culltestpoint2.addSphere([0.0, 0.0, 0.0], 10.0, _v3_green, 16, 4);
culltestpoint2.addSphere([0.0, 0.0, 0.0], 5.0, _v3_red, 16, 4);
culltestpoint2.moveTo([-50.0, -50.0, -50.0]);
culltestpoint2.isVisible = true;
E3D_addEntity(culltestpoint2);
culltestpoint2.visibilityDistance = 5.0; // override for testing

CB_tick = function() {
    if (INPUTS.checkCommand("action1", true)) {

    }
    INPUTS._posSpeed = INPUTS.inputTable.get("ShiftLeft") ? 300.0 : 150.0;
}

let p1element = $("p1");
let p2element = $("p2");
let p3element = $("p3");
let p4element = $("p4");
var distFromCam = 100.0;

TIMER.onSlowTick = function () {

    axis1.updateVector(CAMERA.rotateToCameraView_new([0.0, 0.0, -1.0]));

    let p1 = [ 0.0,  0.0, 0.0];
    let p2 = [100.0, 0.0, 0.0];
    let p3 = [0.0, 100.0, 0.0];
    let p4 = [0.0, 0.0, 100.0];

    let sc = CAMERA.getScreenCoordinates(p1);
    p1element.style.visibility = sc.visible ? "visible" : "hidden";
    p1element.style.left = sc.x + "px"; p1element.style.top = sc.y + "px";
    sc = CAMERA.getScreenCoordinates(p2);
    p2element.style.visibility = sc.visible ? "visible" : "hidden";
    p2element.style.left = sc.x + "px"; p2element.style.top = sc.y + "px";
    sc = CAMERA.getScreenCoordinates(p3);
    p3element.style.visibility = sc.visible ? "visible" : "hidden";
    p3element.style.left = sc.x + "px"; p3element.style.top = sc.y + "px";
    sc = CAMERA.getScreenCoordinates(p4);
    p4element.style.visibility = sc.visible ? "visible" : "hidden";
    p4element.style.left = sc.x + "px"; p4element.style.top = sc.y + "px";

    entity2.isVisible = CAMERA.zDist > -100.0;


    setData("Screen", E3D_WIDTH + "x" + E3D_HEIGHT + " near: " + E3D_NEAR + " far: " + E3D_FAR);
    setData("Viewport", "zoom: " + E3D_ZOOM.toFixed(3) + " FOV: " + (RadToDeg * E3D_FOV).toFixed(3) + " AR: " + (E3D_WIDTH / E3D_HEIGHT).toFixed(3));
    setDataV3("Cam.pos", CAMERA.position);
    if (CAMERA.id == "cam_m") setDataFloat("zDist", CAMERA.zDist);

    setDataV3("p1", p1);
    setDataV3("p2", p2);
    setDataV3("p3", p3);
    setDataV3("p4", p4);

    var offset = v3_sub_new([0.0, 0.0, 0.0], CAMERA.position);
    v3_rotateY_mod(offset, CAMERA.rotation[1]);
    v3_rotateX_mod(offset, CAMERA.rotation[0]);
    v3_rotateZ_mod(offset, CAMERA.rotation[2]);

    setDataV3("inFustrum p", offset);
    //let f = Math.tan(E3D_FOV / 2.0) * E3D_AR;
    //let fx = (E3D_AR >= 1.0) ? f : f / E3D_AR;
    //let fy = (E3D_AR < 1.0) ? f : f / E3D_AR;

    let f = Math.tan(E3D_FOV / 2.0);

    let fx = offset[2] * (E3D_FAR - E3D_NEAR) / (E3D_FAR + E3D_NEAR) + (2.0 * E3D_NEAR);
    let fy = fx;
    if (E3D_AR >= 1.0) {
        fx = fx * E3D_AR;
    } else {
        fy = fx / E3D_AR;
    }

    setDataFloat("fov/2.0", f);
    setDataFloat("w at z", fx * f);
    setDataFloat("h at z", fy * f);

    point1.moveTo(CAMERA.getworldCoordinates(INPUTS.pageX, INPUTS.pageY, distFromCam));
    point1.updateMatrix();
    point2.moveTo(CAMERA.getworldCoordinates(INPUTS.pageX, INPUTS.pageY, distFromCam + 100.0));
    point2.updateMatrix();

    $("data").innerText = formatDataMap();
    $("spanSFPS").innerText = TIMER.fpsSmoothed.toFixed(1);
    $("spanSPCT").innerText = TIMER.usageSmoothed.toFixed(1);
    $("spanLINES").innerText = E3D_DEBUG_RENDER_NB_ELEMENTS;
    $("spanENT").innerText = E3D_DEBUG_RENDER_NB_ENTITIES;
}

// camera type
onClick("cmd_type_o", () => { CAMERA = cam_o; CAMERA.moveTo( 0.0, 0.0, -250.0, 0.0, 0.0, 0.0 ); } );
onClick("cmd_type_p", () => { CAMERA = cam_p; CAMERA.moveTo( 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ); } );
onClick("cmd_type_m", () => { CAMERA = cam_m; CAMERA.moveTo( 0.0, 0.0, -100.0, 0.0, 0.0, 0.0 ); } );
onClick("cmd_type_s", () => { CAMERA = cam_s; CAMERA.moveTo( 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ); } );

// reset
onClick("cmd_reset",  () => CAMERA.moveTo( 0.0, 0.0, 0.0, 0.0, 0.0, 0.0 ));
onClick("cmd_resetX", () => CAMERA.moveTo(50.0, 0.0, 0.0, 0.0, 0.0, 0.0 ));
onClick("cmd_resetZ", () => CAMERA.moveTo(0.0, 0.0, 50.0, 0.0, 0.0, 0.0 ));
onClick("cmd_resetY", () => CAMERA.moveTo(0.0, 50.0, 0.0, 0.0, 0.0, 0.0 ));

// position
onClick("cmd_mx", () => CAMERA.moveBy(-1.0, 0.0, 0.0));
onClick("cmd_px", () => CAMERA.moveBy( 1.0, 0.0, 0.0));

onClick("cmd_my", () => CAMERA.moveBy(0.0,-1.0, 0.0));
onClick("cmd_py", () => CAMERA.moveBy(0.0, 1.0, 0.0));

onClick("cmd_mz", () => CAMERA.moveBy(0.0, 0.0,-1.0));
onClick("cmd_pz", () => CAMERA.moveBy(0.0, 0.0, 1.0));

onClick("cmd_mx10", () => CAMERA.moveBy(-10.0, 0.0, 0.0));
onClick("cmd_px10", () => CAMERA.moveBy( 10.0, 0.0, 0.0));

onClick("cmd_my10", () => CAMERA.moveBy(0.0,-10.0, 0.0));
onClick("cmd_py10", () => CAMERA.moveBy(0.0, 10.0, 0.0));

onClick("cmd_mz10", () => CAMERA.moveBy(0.0, 0.0,-10.0));
onClick("cmd_pz10", () => CAMERA.moveBy(0.0, 0.0, 10.0));

// rotation
onClick("cmd_rmx45", () => CAMERA.moveBy(0.0, 0.0, 0.0,  -45.0 * DegToRad, 0.0, 0.0));
onClick("cmd_rpx45", () => CAMERA.moveBy(0.0, 0.0, 0.0,   45.0 * DegToRad, 0.0, 0.0));

onClick("cmd_rmy45", () => CAMERA.moveBy(0.0, 0.0, 0.0,  0.0, -45.0 * DegToRad, 0.0));
onClick("cmd_rpy45", () => CAMERA.moveBy(0.0, 0.0, 0.0,  0.0,  45.0 * DegToRad, 0.0));

onClick("cmd_rmz45", () => CAMERA.moveBy(0.0, 0.0, 0.0,  0.0, 0.0, -45.0 * DegToRad));
onClick("cmd_rpz45", () => CAMERA.moveBy(0.0, 0.0, 0.0,  0.0, 0.0,  45.0 * DegToRad));

// parameters
onEvent("cmd_dist", "input", (event) => distFromCam = Number(event.target.value));
onEvent("cmd_FOV", "input", (event) => { E3D_FOV = Number(event.target.value) * DegToRad; CAMERA.resize(); });
onEvent("cmd_zoom", "input", (event) => { E3D_ZOOM = Number(event.target.value) / 8.0; CAMERA.resize(); });
