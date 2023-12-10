// Easy3D_WebGL
// Test program for version 0.5 bounding bog and segment intersect
// Emmanuel Charette 2023

"use strict"


//var paramText = document.getElementById("params");

E3D_DEBUG_LOG_TIMESTAMPS = true;

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
SCENE.strokeColor = _v3_black;

// Move the camera back and up a little, add some nod
CAMERA.moveTo(0, 80, 100, 0.5);


const p1 = v3_val_new(-128, -128, -128);
const p2 = v3_val_new( 128,  128,  128);
const cube = v3_val_new( 48,  48,  48);
const center = v3_val_new( 0,  48/2,  0);

// Create the entities

const groundEntity = new E3D_entity_wireframe_canvas("entity0");
// Large ground plane
groundEntity.addPlane(_v3_origin, _v3_null, 2048, 2048, _v3_lightgray, 128);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);

const cubeEntity = new E3D_entity_wireframe_canvas("entity1");
// Cube in the middle, on top of ground
cubeEntity.addCube(center, _v3_null, cube);
cubeEntity.isVisible = true;
E3D_addEntity(cubeEntity);

const segEntity = new E3D_entity_wireframe_canvas("entity2");
segEntity.isVisible = true;
E3D_addEntity(segEntity);

const boundEntity = new E3D_entity_wireframe_canvas("entity3");
boundEntity.isVisible = true;
E3D_addEntity(boundEntity);




// Register the button events
var btn = document.getElementById("btn_randcube");
if (btn) btn.addEventListener("click", x => {
    cubeEntity.clear();
    v3_val_res(cube, 64,  64,  64);
    v3_addnoise_mod(cube, 48);
    v3_val_res(center, 0,  cube[1] / 2,  0);

    cubeEntity.addCube(center, _v3_null, cube);

    checkBoundaries();
} );

btn = document.getElementById("btn_randseg");
if (btn) btn.addEventListener("click", x => {

    segEntity.clear();
    boundEntity.clear();

    var st = performance.now();
    for (var i = 0; i < 100; ++i) { // 4 ms for 1000 incl entity add
        v3_val_res(p1, -16, -16, -16);
        v3_addnoise_mod(p1, 64);
        v3_val_res(p2,  16,  16,  16);
        v3_addnoise_mod(p2, 64);

        segEntity.addLine(p1, p2);

        checkBoundaries();
    }
    var et = performance.now();
    console.log(et - st);

} );

btn = document.getElementById("btn_check");
if (btn) btn.addEventListener("click", x => {
    checkBoundaries();
} );

function checkBoundaries() {
 //   boundEntity.clear();

    // define segment
    var p = v3_clone(p1);
    var n = v3_sub_new(p2, p1);
    v3_normalize_mod(n);


    // define bounding box
    var minX = (cube[0] / -2) + center[0];
    var maxX = (cube[0] /  2) + center[0];

    var minY = (cube[1] / -2) + center[1];
    var maxY = (cube[1] /  2) + center[1];

    var minZ = (cube[2] / -2) + center[2];
    var maxZ = (cube[2] /  2) + center[2];

    // justify segment to bounding box
    var pmin = v3_val_new(minX, minY, minZ);
    var pmax = v3_val_new(maxX, maxY, maxZ);

    boundEntity.addCross(pmin, 5);
    boundEntity.addCross(pmax, 5);



    var dX1 = (maxX - p[0]) / n[0];
    //var ppX1 = v3_addscaled_new(p, n, dX1);
    //boundEntity.addCross(ppX1, 5, _v3_red);

    var dX2 = (minX - p[0]) / n[0];
    //var ppX2 = v3_addscaled_new(p, n, dX2);
    //boundEntity.addCross(ppX2, 5, _v3_red);

    if (isNaN(dX1)) dX1 = 0.0;
    if (isNaN(dX2)) dX2 = 0.0;

    if (dX2 < dX1) {
        var v = dX1;
        dX1 = dX2;
        dX2 = v;
    }


    var dY1 = (maxY - p[1]) / n[1];
    //var ppY1 = v3_addscaled_new(p, n, dY1);
    //boundEntity.addCross(ppY1, 5, _v3_green);

    var dY2 = (minY - p[1]) / n[1];
    //var ppY2 = v3_addscaled_new(p, n, dY2);
    //boundEntity.addCross(ppY2, 5, _v3_green);

    if (isNaN(dY1)) dY1 = 0.0;
    if (isNaN(dY2)) dY2 = 0.0;

    if (dY2 < dY1) {
        var v = dY1;
        dY1 = dY2;
        dY2 = v;
    }


    var dZ1 = (maxZ - p[2]) / n[2];
    //var ppZ1 = v3_addscaled_new(p, n, dZ1);
    //boundEntity.addCross(ppZ1, 5, _v3_blue);

    var dZ2 = (minZ - p[2]) / n[2];
    //var ppZ2 = v3_addscaled_new(p, n, dZ2);
    //boundEntity.addCross(ppZ2, 5, _v3_blue);

    if (isNaN(dZ1)) dZ1 = 0.0;
    if (isNaN(dZ2)) dZ2 = 0.0;

    if (dZ2 < dZ1) {
        var v = dZ1;
        dZ1 = dZ2;
        dZ2 = v;
    }

    var largestof1 = Math.max(dX1, dY1, dZ1);
    var smallestof2 = Math.min(dX2, dY2, dZ2);

    if (largestof1 < smallestof2) {
        boundEntity.addCross(v3_addscaled_new(p, n, largestof1), 10, _v3_magenta);
        boundEntity.addCross(v3_addscaled_new(p, n, smallestof2), 10, _v3_yellow);
    }
}


// use the engine OnTick event callback to change the rotation of the entity
CB_tick = function() {
    // rotate around Y
    //entity.rotation[1] += TIMER.delta * 0.4;
    //entity.updateMatrix();
}


