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

let o = v3_val_new(10, 0, 20);
let n = v3_normalize_new([ 0.0, 1.0, 1.0]);
let v = v3_val_new(100.0, 42.0, 20.0);
let p = v3_projection_new(v, n);

entity.addLineByPosNormLen(o, n, 10, false, _v3_white);
entity.addLine(_v3_origin, v, false, _v3_red);
entity.addLine(v, p, false, _v3_yellow);

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

