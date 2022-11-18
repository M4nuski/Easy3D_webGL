// Easy3D_WebGL
// Test program for v5 performance
// Emmanuel Charette 2022

"use strict"


console.log("User Main Script Start");

E3D_logElement = $("data");

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

var obj1 = new E3D_entity("entity_solid");
var meshCreator = new E3D_mesh();



var test1_status = "wait";
var test2_status = "wait";

//CB_tick = function() {
TIMER.onSlowTick = function () {

    if (test1_status == "run") {

        meshCreator.pushSphere(_v3_null, _v3_null, 50.0, 8);
        log((meshCreator.positions.length / 3) + " vertices", false);

        var startTime = performance.now();
        meshCreator.genUniqueVertices();
        var stopTime = performance.now();
        log("genUniqueVertices: " + ((stopTime - startTime) * 0.001).toFixed(3), false);
        meshCreator.addModelData(obj1);

        obj1.isVisible = true;
        E3D_addEntity(obj1);

        test1_status = "done";
    }

    
    if (test2_status == "run") {

        var startTime = performance.now();
        meshCreator.genNormals();
        var stopTime = performance.now();
        log("genNormals: " + ((stopTime - startTime) * 0.001).toFixed(3), false);

        test2_status = "done";
    }

    if ((test1_status == "wait") && (TIMER.time > 2.0)) {
        log("Starting test 1", false);
        test1_status = "run";
    }

    if ((test1_status == "done") && (test2_status == "wait")) {
        log("Starting test 2", false);
        test2_status = "run";
    }


    $("spanSFPS").innerText = TIMER.fpsSmoothed.toFixed(1);
    $("spanSPCT").innerText = TIMER.usageSmoothed.toFixed(1);
    $("spanLINES").innerText = SCENE.drawnElements;
}
