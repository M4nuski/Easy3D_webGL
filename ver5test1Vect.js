// Easy3D_WebGL
// Test program for v5 vector
// Emmanuel Charette 2022

"use strict"


console.log("User Main Script Start");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
//CAMERA = new E3D_camera("cam_o");
//CAMERA = new E3D_camera_persp("cam_p");
CAMERA = new E3D_camera_model("cam_m");
//CAMERA = new E3D_camera_space("cam_s");

E3D_onResize();
SCENE.setClearColor(_v3_darkgray);

// Move the camera back and up a little
CAMERA.moveBy(0, 0, 0, 0.2,-0.2, 0.0);
CAMERA.moveBy(0, 0, 200);


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

let capsule = {
    l: 10.0,
    r: 0.5,
    p: [ 0.0, 0.0, -2.0],
    n: v3_normalize_new( [ 0.2, 1.0, 0.2] )
}

let vect = {
    l: 20.0,
    r: 0.5,
    p: [ 10.0, 5.0, -2.0],
    n: v3_normalize_new( [ 0.2, 2.0, -2.0] )
}

let axis1 = new E3D_entity_axis("adjustToCam", 25.0, true, 10.0, false);
axis1.moveTo([0.01, 50.01, 0.01]);
axis1.isVisible = true;
E3D_addEntity(axis1);
let axis2 = new E3D_entity_axis("negateCam", 25.0, true, 10.0, false);
axis2.moveTo([0.01, 75.01, 0.01]);
axis2.isVisible = true;
E3D_addEntity(axis2);

entity.isVisible = true;
E3D_addEntity(entity2);
E3D_addEntity(entity);


CB_tick = function() {
    if (INPUTS.checkCommand("action1", true)) {

    }
    if ((CAMERA.id == "cam_o") && (INPUTS.pz_delta != 0.0)) {
        E3D_ZOOM = 1.0 + (Math.abs(INPUTS.pz) * 0.01);
        CAMERA.resize();
    }
}

TIMER.onSlowTick = function () {

    axis1.updateVector(CAMERA.adjustToCamera_new([0.0, 0.0, -1.0]));
    axis2.updateVector(CAMERA.negateCamera_new([0.0, 0.0, -1.0]));
    
    entity2.isVisible = CAMERA.zDist > -100.0;
    $("data").innerText = v3_string(CAMERA.position) + "\n";
    if (CAMERA.id == "cam_m") $("data").innerText += CAMERA.zDist.toFixed(3);
}
