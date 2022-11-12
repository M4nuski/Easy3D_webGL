// Easy3D_WebGL
// Test program for v5 vector
// Emmanuel Charette 2022

"use strict"


console.log("User Main Script Start");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
CAMERA = new E3D_camera_model("cam2")
E3D_onResize();
SCENE.setClearColor(_v3_darkgray);

// Move the camera back and up a little
CAMERA.moveBy(0, 0, 0, 0.2,-0.2, 0.0);
CAMERA.moveBy(0, 0, 200);


// Create a new entity
var entity = new E3D_entity_wireframe_canvas("entity0");

// Large axis planes
entity.addPlane(_v3_origin, _v3_90x, 1000, 1000, 11, _v3_lightgreen);
entity.addPlane(_v3_origin, _v3_90y, 1000, 1000, 11, _v3_lightred);
entity.addPlane(_v3_origin, _v3_90z, 1000, 1000, 11, _v3_lightblue);

/*
let o = v3_val_new(10, 0, 20);
let n = v3_normalize_new([ 0.0, 1.0, 1.0]);
let v = v3_val_new(100.0, 42.0, 20.0);
let p = v3_projection_new(v, n);
let p2 = v3_projection3_new(v, v3_scale_new(n, 10));

entity.addLineByPosNormLen(o, n, 10, false, _v3_white);
entity.addLine(_v3_origin, v, false, _v3_red);
entity.addLine(v, p, false, _v3_yellow);
entity.addLine(v, p2, false, _v3_cyan);
*/
/*
let p0 = [ 2.0, 10.0, 10.0];
let p1 = [ 0.0, 30.0, 20.0];
entity.addLine(p0, p1, false, _v3_white);
let p = [ 10.0, 25.0, -5.0];
let res = v3_proj_on_segmentplane_new(p, p0, p1);
entity.addWireCross(p, 1.0, _v3_white);
entity.addWireCross(res, 1.0, _v3_red);
entity.addLine(p0, p, false, _v3_lightgray);
entity.addLine(p0, res, false, _v3_lightgray);

p0 = [ 12.0, 10.0, 10.0];
p1 = [ 10.0, 30.0, 20.0];
let v = v3_sub_new(p1, p0);
entity.addLine(p0, p1, false, _v3_white);
p = [ 20.0, 25.0, -5.0];
res = v3_proj_on_vectorplane_new(p, p0, v);
entity.addWireCross(p, 1.0, _v3_white);
entity.addWireCross(res, 1.0, _v3_red);
entity.addLine(p0, p, false, _v3_lightgray);
entity.addLine(p0, res, false, _v3_lightgray);

p0 = [ 22.0, 10.0, 10.0];
p1 = [ 20.0, 30.0, 20.0];
v = v3_sub_new(p1, p0);
let n = v3_normalize_new(v);
entity.addLine(p0, p1, false, _v3_lightgreen);
entity.addLineByPosNormLen(p0, n, 10, false, _v3_white);
p = [ 30.0, 25.0, -5.0];
res = v3_proj_on_plane_new(p, p0, n);
entity.addWireCross(p, 1.0, _v3_white);
entity.addWireCross(res, 1.0, _v3_red);
entity.addLine(p0, p, false, _v3_lightgray);
entity.addLine(p0, res, false, _v3_lightgray);

p0 = [ 0.0, 0.0, 0.0];
p1 = [ -2.0, 20.0, 10.0];
v = v3_sub_new(p1, p0);
n = v3_normalize_new(v);
entity.addLine(p0, p1, false, _v3_lightgreen);
entity.addLineByPosNormLen(p0, n, 10, false, _v3_white);
entity.addWireSphere(p0, 1.0, _v3_green);
p = [ 10.0, 25.0, -5.0];
res = v3_proj_on_normalplane_new(p, n);
entity.addWireCross(p, 1.0, _v3_white);
entity.addWireCross(res, 1.0, _v3_red);
entity.addLine(p0, p, false, _v3_lightgray);
entity.addLine(p0, res, false, _v3_lightgray);
*/

let offset = [10.0, 0.0, 0.0];
let p0 = [ 0.0, 0.0, 0.0];
let p1 = [ -2.0, 20.0, 10.0];
let p = [ 10.0, 25.0, -5.0];
let v = v3_sub_new(p1, p0);
let n = v3_normalize_new(v);
entity.addLine(p0, p1, false, _v3_lightgreen);
entity.addLineByPosNormLen(p0, n, 2.0, false, _v3_white);
let resv = v3_proj_on_normal_new(p, n);
let resp = v3_proj_on_normalplane_new(p, n);
entity.addWireCross(p, 1.0, _v3_white);
entity.addWireCross(resp, 1.0, _v3_red);
entity.addWireCross(resv, 1.0, _v3_blue);
entity.addLine(p0, p, false, _v3_lightgray);
entity.addLine(p0, resp, false, _v3_lightgray);
entity.addLine(p0, resv, false, _v3_lightgray);

v3_add_mod(p0, offset);
v3_add_mod(p1, offset);
v3_add_mod(p, offset);
v = v3_sub_new(p1, p0);
n = v3_normalize_new(v);
entity.addLine(p0, p1, false, _v3_white);
resv = v3_proj_on_offsetnormal_new(p, p0, n);
resp = v3_proj_on_plane_new(p, p0, n);
entity.addWireCross(p, 1.0, _v3_white);
entity.addWireCross(resp, 1.0, _v3_red);
entity.addWireCross(resv, 1.0, _v3_blue);
entity.addLine(p0, p, false, _v3_lightgray);
entity.addLine(p0, resp, false, _v3_lightgray);
entity.addLine(p0, resv, false, _v3_lightgray);

v3_add_mod(p0, offset);
v3_add_mod(p1, offset);
v3_add_mod(p, offset);
v = v3_sub_new(p1, p0);
n = v3_normalize_new(v);
entity.addLine(p0, p1, false, _v3_white);
resv = v3_proj_on_vector_new(p, p0, v);
resp = v3_proj_on_vectorplane_new(p, p0, v);
entity.addWireCross(p, 1.0, _v3_white);
entity.addWireCross(resp, 1.0, _v3_red);
entity.addWireCross(resv, 1.0, _v3_blue);
entity.addLine(p0, p, false, _v3_lightgray);
entity.addLine(p0, resp, false, _v3_lightgray);
entity.addLine(p0, resv, false, _v3_lightgray);

v3_add_mod(p0, offset);
v3_add_mod(p1, offset);
v3_add_mod(p, offset);
v = v3_sub_new(p1, p0);
n = v3_normalize_new(v);
entity.addLine(p0, p1, false, _v3_white);
resv = v3_proj_on_segment_new(p, p0, p1);
resp = v3_proj_on_segmentplane_new(p, p0, p1);
entity.addWireCross(p, 1.0, _v3_white);
entity.addWireCross(resp, 1.0, _v3_red);
entity.addWireCross(resv, 1.0, _v3_blue);
entity.addLine(p0, p, false, _v3_lightgray);
entity.addLine(p0, resp, false, _v3_lightgray);
entity.addLine(p0, resv, false, _v3_lightgray);

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




entity.isVisible = true;
E3D_addEntity(entity);



CB_tick = function() {
    if (INPUTS.checkCommand("action1", true)) {
        n = v3_addnoise_new(_v3_origin, 1.0);
        v = v3_addnoise_new(_v3_origin, 256.0);
        v3_normalize_mod(n);
        p = v3_projection_new(v, n);        
        entity.addLineByPosNormLen(o, n, 10, false, _v3_white);
        entity.addLine(o, v, false, _v3_red);
        entity.addLine(v, p, false, _v3_yellow);
    }
}
/*
// project point on plane of n
function v3_projection_new(p, n) {
    let d = v3_dot(n, p);
    return v3_addscaled_new(p, n, -d);
}
function v3_projection_mod(p, n) {
    let d = v3_dot(n, p);
    v3_addscaled_mod(p, n, -d);
}
function v3_projection_res(r, p, n) {
    let d = v3_dot(n, p);
    v3_addscaled_res(r, p, n, -d);
}

//a.project(b) = b * (a.dot(b) * b.length_squared())
//a.project(n) = n * a.dot(n)
// project point on n
function v3_projection2_new(p, n) {
    let d = v3_dot(p, n);
    return v3_scale_new(n, d);
}
function v3_projection2_mod(p, n) {
    let d = v3_dot(p, n);
    v3_scale_mod(n, d);
}
function v3_projection2_res(res, p, n) {
    let d = v3_dot(p, n);
    v3_scale_res(res, n, d);
}

function v3_projection3_new(p, v) {
    let d = v3_dot(p, v) / v3_lengthsquared(v);
    return v3_scale_new(v, d);
}
function v3_projection3_mod(p, v) {
    let d = v3_dot(p, v) / v3_lengthsquared(v);
    v3_scale_mod(v, d);
}
function v3_projection3_res(res, p, v) {
    let d = v3_dot(p, v) / v3_lengthsquared(v);
    v3_scale_res(res, v, d);
}
*/