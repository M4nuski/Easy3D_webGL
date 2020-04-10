// Easy3D_WebGL
// Main demo program for version 0.5
// Demo for various type of animations
// Emmanuel Charette 2020

"use strict"

// Init all default engine components
E3D_InitAll();

var spanSFPS = getElem("spanSFPS");
var spanSPCT = getElem("spanSPCT");

// Create a new entity
var entity = new E3D_entity_wireframe_canvas("entity0");
// Large ground plane
entity.addPlane(_v3_origin, _v3_90x, 2048, 2048, 128, _v3_lightgray);
entity.isVisible = true;
E3D_addEntity(entity);

// Move the camera back and up a little
CAMERA.moveTo(0, 24, 100);

// use the engine OnTick event callback for stats and direct animations
CB_tick = function() {

    // Stats
    spanSFPS.innerText = padStart(""+TIMER.fpsSmoothed.toFixed(1), " ", 8);
    spanSPCT.innerText = padStart(""+TIMER.usageSmoothed.toFixed(1), " ", 8);

    // Direct Animation
}