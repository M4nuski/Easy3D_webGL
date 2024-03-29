// Easy3D_WebGL
// Main demo program for version 0.5
// Demonstrate various basic shaders
// Emmanuel Charette 2020

"use strict"


var programs = [];
var meshLoader = new E3D_mesh();

E3D_DEBUG_LOG_TIMESTAMPS = true;

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();


// Change the scene back to basic
SCENE = new E3D_scene("scene1", _v3_black);

// Load the shaders
log("Shader Program 1 ", false);
programs[0] = new E3D_program("program_base_passtrough", programData_passtrough);
log("Shader Program 2 ", false);
programs[1] = new E3D_program("program_base_normals", programData_passtrough_shownormals);
log("Shader Program 3 ", false);
programs[2] = new E3D_program("program_base_depth", programData_passtrough_showdepth);
log("Shader Program 4 ", false);
programs[3] = new E3D_program("program_base_shade", programData_passtrough_shade);
log("Shader Program 5 ", false);
programs[4] = new E3D_program("program_base_shadeAndDepth", programData_passtrough_shadeAndDepth);


// Set the scene
SCENE.program = programs[0];
SCENE.initialize();
SCENE.state = E3D_ACTIVE;


// Move the camera back and up a little, add some nod 
CAMERA.moveTo(0, 80, 100, 0.5);




// Create the entities
var groundEntity = new E3D_entity_wireframe_canvas("entity0");
// Large ground plane
groundEntity.addPlane(_v3_origin, _v3_null, 2048, 2048, _v3_lightgray, 128);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);


// Create a box
meshLoader.pushBox(_v3_origin, _v3_null, 8, 16, 24);     
// Randomize colors
for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = Math.random();


// Create a few more boxes spread around
for (var x = -8; x < 8; ++x) for (var y = -8; y < 8; ++y) {

    var newEnt = new E3D_entity("cube" + x + "-" + y);
    meshLoader.addModelData(newEnt);
    newEnt.isVisible = true;

    // Set positions, randomize rotation
    newEnt.position = [x * 50 + 25, 0, y * 50 + 25];
    newEnt.rotation = [randomFloatPlusMinus(Math.PI), randomFloatPlusMinus(Math.PI), 0];

    E3D_addEntity(newEnt);
}


    
// Create a torus mesh
var torusEntity = new E3D_entity("torus",false);
meshLoader.reset();
meshLoader.pushTorus(_v3_origin, _v3_null, 32, 12, 64, 32);

// Rainbow colors (hue sweep)
var c = v3_new();
for (var i = 0; i < meshLoader.colors.length / 3; ++i) {
    v3_huesweep_res(c, i, meshLoader.colors.length / 3);
    meshLoader.colors[(i * 3)    ] = c[0];
    meshLoader.colors[(i * 3) + 1] = c[1];
    meshLoader.colors[(i * 3) + 2] = c[2];
}

// Check and smooth adjascent normals if they are similar
meshLoader.smoothNormals(0.7);
meshLoader.addModelData(torusEntity);
torusEntity.isVisible = true;
torusEntity.position = [0, 24, 0];
E3D_addEntity(torusEntity);




// Register the button events
$forEach(".E3D_fakeButton", button => onClick(button, (event) => SCENE.program = programs[event.target.getAttribute("data-shader")]));

// handle interval changes
TIMER.setFpsCap($("inputINT").value);
onEvent($("inputINT"), "change", (event) => { TIMER.setFpsCap(event.target.value); event.target.blur(); } );



// use the engine OnTick event callback to change the rotation of the torus every frames
CB_tick = function() {
    // rotate around Y
    torusEntity.rotation[1] += TIMER.delta * 0.4;
    torusEntity.updateMatrix();
}

// use the timer OnSlowTick event callback to update stats shown in document less often than each frames
TIMER.onSlowTick = function () {
    $("spanFPS").innerText = padStart(TIMER.fps.toFixed(2), " ", 8);
    $("spanSFPS").innerText = padStart(TIMER.fpsSmoothed.toFixed(1), " ", 8);
    $("spanPct").innerText = padStart(TIMER.usage.toFixed(1), " ", 8);
    $("spanSPct").innerText = padStart(TIMER.usageSmoothed.toFixed(1), " ", 8);
}
