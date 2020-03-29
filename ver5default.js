// Easy3D_WebGL
// Main demo program for version 0.5
// Load default engine 
// Emmanuel Charette 2020

"use strict"

function E3D_userInit() {
    log("E3D_userInit");

    // Load all default engine parts, scene, lights, timer, inputs, camera
    E3D_InitAll();

    // Create a new entity
    var entity = new E3D_entity_wireframe_canvas("entity0");
    // Large ground plane
    entity.addPlane(_v3_origin, _v3_90x, 2048, 2048, 128, _v3_lightgray);
    // Cube in the middle, on top of ground
    entity.addWireCube([0, 24, 0], _v3_null, 48, _v3_white);
    // Set it visible
    entity.isVisible = true;

    E3D_addEntity(entity);

    // Move the camera back and up a little
    CAMERA.moveTo(0, 24, 100);

    // If the buttons exists register the events
    var fsbtn = document.getElementById("btn_fs");
    if (fsbtn) fsbtn.addEventListener("click", x => fullscreenEnable(CANVAS));
    var plbtn = document.getElementById("btn_pl");
    if (plbtn) plbtn.addEventListener("click", x => pLockRequest(CANVAS));
}

