// Easy3D_WebGL
// Main demo program for version 0.5
// Load default engine
// Emmanuel Charette 2020

"use strict"


E3D_DEBUG_LOG_TIMESTAMPS = true;

console.log("User Main Script Start");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();

// Create a new entity
var cubeEntity = new E3D_entity_wireframe_canvas("entity0");
// Large ground plane
cubeEntity.addPlane(_v3_origin, _v3_null, 2048, 2048, _v3_lightgray, 128);
// Cube in the middle, on top of ground
cubeEntity.addCube([0, 24, 0], _v3_null, 48);
//for (var x = -10; x < 11; ++x) for (var y = -10; y < 11; ++y) if ((x != 0) || (y != 0)) entity.addCube([x * 64, 16, y * 64], _v3_null, 32, _v3_white);

cubeEntity.isVisible = true;

E3D_addEntity(cubeEntity);

// Move the camera back and up a little
CAMERA.moveTo(0, 24, 100);

//E3D_DEBUG_LOG_INPUT_MODE = true;
//E3D_DEBUG_LOG_INPUT_MOVES = true;

// If the buttons exists register the events (demo3)
var btn = document.getElementById("btn_fs");
if (btn) btn.addEventListener("click", x => fullscreenEnable(CANVAS) );
var btn = document.getElementById("btn_pl");
if (btn) btn.addEventListener("click", x => pLockRequest(CANVAS) );
var btn = document.getElementById("btn_fspl");
if (btn) btn.addEventListener("click", x => { fullscreenEnable(CANVAS); pLockRequest(CANVAS); } );

// change input mode for pointer lock vs mouse look (demo3)
CB_pointerlockEvent = function (event) {
    if (event == "lock") {
        INPUTS.pointerMap.set("rx_btn", E3D_INP_ALWAYS);
        INPUTS.pointerMap.set("ry_btn", E3D_INP_ALWAYS);
    } else {
        INPUTS.pointerMap.set("rx_btn", E3D_INP_LMB);
        INPUTS.pointerMap.set("ry_btn", E3D_INP_LMB);
    }
}


