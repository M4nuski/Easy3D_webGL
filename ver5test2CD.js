// Easy3D_WebGL
// Test program for v5 CD
// Emmanuel Charette 2022

"use strict"


console.log("User Main Script Start");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
//CAMERA = new E3D_camera_model("cam2")
E3D_onResize();
SCENE.setClearColor(_v3_darkgray);

// Move the camera back and up a little
CAMERA.moveBy(0, 0, 0, 0.2,-0.2, 0.0);
CAMERA.moveBy(0, 0, 200);


// Create a new entity
var grid = new E3D_entity_wireframe_canvas("entity_grid");
// Large axis planes
grid.addPlane(_v3_origin, _v3_90x, 1000, 1000, _v3_lightgreen, 20);
grid.addPlane(_v3_origin, _v3_90y, 1000, 1000, _v3_lightred, 20);
grid.addPlane(_v3_origin, _v3_90z, 1000, 1000, _v3_lightblue, 20);
grid.isVisible = true;
E3D_addEntity(grid);

var obj1 = new E3D_entity_wireframe_canvas("entity_solid");
obj1.addSphere([0.0, 0.0, 0.0], 15.0);
obj1.addSphere([0.0, 25.0, 0.0], 15.0, _v3_white, 32, 3);

obj1.addCross([0.0, 0.0, 25.0], 5.0);

obj1.addPlane([0.0, -20.0, 50.0], _v3_null, 64.0, 48.0, _v3_lightgray);
obj1.addPlane([0.0, -10.0, 50.0], _v3_null, 64.0, 48.0, _v3_white, 12);

obj1.addCircle([0.0, 0.0, 50.0], _v3_null, 10.0);

obj1.addCylinder([0.0, 0.0, 75.0], _v3_null, 10.0, 20.0);
obj1.addCylinder([0.0, 25.0, 75.0], _v3_null, 10.0, 20.0, _v3_white, 24, 12, 4);

obj1.moveLineCursorTo([25.0, 25.0, 0.0]); forN(64, (i, n) => obj1.addLineByOffset([1.0, Math.sin(i/Math.PI)*2.0, 0.0], obj1.nextColor()) );

obj1.addCube([50.0, 0.0, 25.0], _v3_null, 10.0);
obj1.addCube([50.0, 25.0, 25.0], _v3_null, 10.0, _v3_white, true, false);
obj1.addCube([50.0, 50.0, 25.0], _v3_null, 10.0, _v3_white, false, true);
obj1.addCube([50.0, -25.0, 25.0], _v3_null, [10.0, 20.0, 30.0]);
obj1.addCube([50.0, 50.0, .0], _v3_null, 10.0, _v3_white, false, true, false);

obj1.addTriangle([50.0, 0.0, 75.0], [50.0, 25.0, 50.0], [75.0, 0.0, 50.0]);

obj1.addCapsule([100.0, 0.0, 25.0], _v3_null, 50.0, 10.0);
obj1.addCapsule([100.0, 0.0, 50.0], _v3_null, 50.0, 10.0, _v3_white, 32, 12, 4);

let gridInddex = obj1.addQuadGrid([-200.0, 0.5, 0.0], _v3_null, 200, 100, 20, 10);
forXY(20, 10, (x, y) => { let v = obj1.getGridVertex(gridInddex, 20, 10, x, y); v[1] = Math.random()*2.0;} );

obj1.isVisible = true;
E3D_addEntity(obj1);

CB_tick = function() {
   /* if (INPUTS.checkCommand("action1", true)) {
        n = v3_addnoise_new(_v3_origin, 1.0);
        v = v3_addnoise_new(_v3_origin, 256.0);
        v3_normalize_mod(n);
        p = v3_projection_new(v, n);        
        entity.addLineByPosNormLen(o, n, 10, _v3_white);
        entity.addLine(o, v, _v3_red);
        entity.addLine(v, p, _v3_yellow);
    }
    entity2.isVisible = CAMERA.zDist > -100.0;
    $("data").innerText = v3_string(CAMERA.position) + "\n";
    $("data").innerText += CAMERA.zDist.toFixed(3);*/
    $("spanSFPS").innerText = TIMER.fpsSmoothed.toFixed(1);
    $("spanSPCT").innerText = TIMER.usageSmoothed.toFixed(1);
    $("spanINTERVAL").innerText = TIMER.interval;
    $("spanLINES").innerText = SCENE.drawnElements;
}
