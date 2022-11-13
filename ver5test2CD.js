// Easy3D_WebGL
// Test program for v5 CD
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
var grid = new E3D_entity_wireframe_canvas("entity_grid");
// Large axis planes
grid.addPlane(_v3_origin, _v3_90x, 1000, 1000, 19, _v3_lightgreen);
grid.addPlane(_v3_origin, _v3_90y, 1000, 1000, 19, _v3_lightred);
grid.addPlane(_v3_origin, _v3_90z, 1000, 1000, 19, _v3_lightblue);
grid.isVisible = true;
E3D_addEntity(grid);


CB_tick = function() {
   /* if (INPUTS.checkCommand("action1", true)) {
        n = v3_addnoise_new(_v3_origin, 1.0);
        v = v3_addnoise_new(_v3_origin, 256.0);
        v3_normalize_mod(n);
        p = v3_projection_new(v, n);        
        entity.addLineByPosNormLen(o, n, 10, false, _v3_white);
        entity.addLine(o, v, false, _v3_red);
        entity.addLine(v, p, false, _v3_yellow);
    }
    entity2.isVisible = CAMERA.zDist > -100.0;
    $("data").innerText = v3_string(CAMERA.position) + "\n";
    $("data").innerText += CAMERA.zDist.toFixed(3);*/
}
