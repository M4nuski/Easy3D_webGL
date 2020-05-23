// Easy3D_WebGL
// Main demo program for version 0.5
// Demo for various type of animations
// Emmanuel Charette 2020

"use strict"

// Init all default engine components
E3D_InitAll();

// Move the camera back and up a little, slight nod
CAMERA.moveTo(0, 24, 100, 0.25);

// Set FPS to 1:1 vs screen refresh
TIMER.setInterval(1);


// State
var animMode = "direct";


// Create entities

// Large ground plane
var ground = new E3D_entity_wireframe_canvas("entity0");
ground.addPlane(_v3_origin, _v3_90x, 2048, 2048, 128, _v3_lightgray);
ground.isVisible = true;
E3D_addEntity(ground);


// base entity to move around and show the different methods
var baseEntity = new E3D_entity("pyra", true);
var meshCtor = new E3D_mesh();
meshCtor.pushBiPyramid(_v3_origin, _v3_null, 8, 16, 4);
meshCtor.addModelData(baseEntity);


// entity to demo direct transform and vertex data modification
var directEntity = new E3D_entity_dynamicCopy("pyraCopy", baseEntity);
directEntity.copySource();
directEntity.moveTo([32, 0, 0]);
E3D_addEntity(directEntity);
directEntity.isVisible = true;

var directBeat = [0.5, 1, 1,   2, 2, 1,   1, 1, 1,   2, 1, 1,    0.5, 1, 1,   2, 2, 1,   1, 1, 1,   2, 2, 1];
var directBeatLast = -1;
var directBeatCurrentScale = 1.0;
var directBeatSlice = 0.5 / 3; // 120 bpm, 3t






// Events
$forEach(".E3D_fakeButton", button => onClick(button, (event) => animMode = event.target.getAttribute("data-mode")));
//document.querySelectorAll(".fakeButton").forEach(button => onClick(button, (event) => animMode = event.target.getAttribute("data-mode")));


// use the engine OnTick event callback for stats and direct animations
CB_tick = function() {


// Stats
    $("spanSFPS").innerText = padStart(TIMER.fpsSmoothed.toFixed(1), " ", 8);
    $("spanSPCT").innerText = padStart(TIMER.usageSmoothed.toFixed(1), " ", 8);
    $("spanMODE").innerText = animMode;


// Direct Animation
    if (animMode == "direct") {

        // Position and rotation
        v3_rotateY_mod(directEntity.position, -TIMER.delta); // move around Y
        directEntity.rotation[1] -= TIMER.delta; // always face inward
        directEntity.updateMatrix(); 

        // Beat
        var directBeatNum = Math.floor(TIMER.elapsed / directBeatSlice);
        if (directBeatNum != directBeatLast) {
            directBeatCurrentScale = directBeat[directBeatNum % directBeat.length];
            directBeatLast = directBeatNum;
        } else {
            directBeatCurrentScale = TIMER.smooth(directBeatCurrentScale, 1.0, 10);
        }
        
        // Vertex scaling
        for (var i = 0; i < directEntity.numElements; ++i) {
            var srcVertex = baseEntity.getVertex(i);
            var dstVertex = directEntity.getVertex(i);
            v3_mult_res(dstVertex, srcVertex, [1.0, directBeatCurrentScale, 1.5 - (directBeatCurrentScale / 2.0)]);        
        }

        directEntity.dataContentChanged = true; // update GPU memory
    } // direct anim mode

}