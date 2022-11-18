// Easy3D_WebGL
// Main demo program for version 0.5
// Generation and loading of shape primitives simple out-of-engine animation
// Emmanuel Charette 2020

"use strict"


var paramText = document.getElementById("params");

E3D_DEBUG_LOG_TIMESTAMPS = true;

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
SCENE.strokeColor = _v3_black;


// Create the entities
var groundEntity = new E3D_entity_wireframe_canvas("entity0");
// Large ground plane
groundEntity.addPlane(_v3_origin, _v3_null, 2048, 2048, _v3_lightgray, 128);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);

// Move the camera back and up a little, add some nod 
CAMERA.moveTo(0, 80, 100, 0.5);




var meshLoader = new E3D_mesh();
// Create a solid cube
var entity = new E3D_entity("entity1", true); // dynamic entity, GPU data will be updated when changed

// Create mesh
meshLoader.pushBox(_v3_origin, _v3_null, 48, 48, 48);
paramText.innerText = "Box 48.00 x 48.00 x 48.00";

// Change colors
for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

// Load data from mesh to entity
meshLoader.addModelData(entity);

// Setup entity
entity.isVisible = true;
entity.position = [0, 24, 0];
E3D_addEntity(entity);


// checkboxes
var check_colored = document.getElementById("chk_colored");
if (!check_colored) check_colored = { checked: false }; 
var check_smooth = document.getElementById("chk_smooth");
if (!check_smooth) check_smooth = { checked: false }; 
var check_outline = document.getElementById("chk_outline");
if (!check_outline) check_outline = { checked: false }; 

// Register the button events
var btn = document.getElementById("btn_s1"); // plane
if (btn) btn.addEventListener("click", x => {

    entity.clear();
    meshLoader.reset();
    
    var w = 24 + randomFloatPlusMinus(12);
    var h = 24 + randomFloatPlusMinus(12);

    meshLoader.pushDoubleSidedPlane(_v3_origin, _v3_null, w, h, 0.001);


    if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
    meshLoader.genUniqueVertices(0.01);
    if (check_outline.checked) meshLoader.addStrokeData(entity, true, -0.1); else entity.drawStrokes = false;
    meshLoader.addModelData(entity);
    E3D_updateEntityData(entity);

    paramText.innerText = `Plane ${w*2} x ${h*2}`;

} );
var btn = document.getElementById("btn_s2"); // box
if (btn) btn.addEventListener("click", x =>  {

    entity.clear();
    meshLoader.reset();
    var w = 36 + randomFloatPlusMinus(18);
    var h = 36 + randomFloatPlusMinus(18);
    var d = 36 + randomFloatPlusMinus(18);

    meshLoader.pushBox(_v3_origin, _v3_null, w, h, d);     

    if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);        
    if (check_smooth.checked) meshLoader.smoothNormals(-0.9);
    if (check_outline.checked) meshLoader.addStrokeData(entity, false, 0.5);

    meshLoader.addModelData(entity);
    E3D_updateEntityData(entity);

    paramText.innerText = `Box ${w.toFixed(2)} x ${h.toFixed(2)} x ${d.toFixed(2)}`;

} );
var btn = document.getElementById("btn_s3"); // pyramid
if (btn) btn.addEventListener("click", x => {

    entity.clear();
    meshLoader.reset();
    var nbSide = randomInteger(30) + 3;
    var height = 36 + randomFloatPlusMinus(20);
    var radius = 24 + randomFloatPlusMinus(12);

    meshLoader.pushPyramid(_v3_origin, _v3_null, radius, height, nbSide);

    if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
    if (check_smooth.checked) meshLoader.smoothNormals(0.7);
    if (check_outline.checked) meshLoader.addStrokeData(entity, false, 0.9999);

    meshLoader.addModelData(entity);
    E3D_updateEntityData(entity);

    paramText.innerText = `Pyramid ${radius.toFixed(2)} x ${height.toFixed(2)}, ${nbSide} sides`;

} );
var btn = document.getElementById("btn_s4"); // prism
if (btn) btn.addEventListener("click", x =>  {

    entity.clear();
    meshLoader.reset();
    var nbSide = randomInteger(30) + 3;
    var height = 36 + randomFloatPlusMinus(20);
    var radius = 24 + randomFloatPlusMinus(10);

    meshLoader.pushPrism(_v3_origin, _v3_null, radius, height, nbSide);

    if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
    if (check_smooth.checked) meshLoader.smoothNormals(0.7);
    if (check_outline.checked) meshLoader.addStrokeData(entity, false, 0.9999);

    meshLoader.addModelData(entity);
    E3D_updateEntityData(entity);

    paramText.innerText = `Prism ${radius.toFixed(2)} x ${height.toFixed(2)}, ${nbSide} sides`;

} );
var btn = document.getElementById("btn_s5"); // sphere
if (btn) btn.addEventListener("click", x =>  {

    entity.clear();
    meshLoader.reset();

    var radius = 32 + randomFloatPlusMinus(10);
    var depth = randomInteger(6);
    var type = randomInteger(meshLoader.sphereBaseType.qty);

    meshLoader.pushSphere(_v3_origin, _v3_null, radius, depth, _v3_white, type);

    if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
    if (check_outline.checked) meshLoader.addStrokeData(entity, false, 1.0001);
    if (check_smooth.checked) meshLoader.smoothNormals(0.0);

    meshLoader.addModelData(entity);
    E3D_updateEntityData(entity);
    
    paramText.innerText = `Sphere radius ${radius.toFixed(2)} base type: ${meshLoader.sphereBaseType.strings[type]} recursion depth of ${depth}`;
} );

var btn = document.getElementById("btn_s6"); // torus
if (btn) btn.addEventListener("click", x =>  {

    entity.clear();
    meshLoader.reset();

    var radius = 32 + randomFloatPlusMinus(16);
    var sectionRadius = 16 + randomFloatPlusMinus(8);
    var sections = 4 + randomInteger(45);
    var sides = 4 + randomInteger(29);

    meshLoader.pushTorus(_v3_origin, _v3_null, radius, sectionRadius, sections, sides);
    
    if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i); 
    if (check_outline.checked) meshLoader.addStrokeData(entity, true, 0.9999);       
    if (check_smooth.checked) meshLoader.smoothNormals(0.2);

    meshLoader.addModelData(entity);
    E3D_updateEntityData(entity);
    
    paramText.innerText = `Torus radius ${radius.toFixed(2)}, section radius: ${sectionRadius.toFixed(2)}, sections:${sections}, sides: ${sides}`;
} );




// use the engine OnTick event callback to change the rotation of the entity
CB_tick = function() {
    // rotate around Y
    entity.rotation[1] += TIMER.delta * 0.4;
    entity.updateMatrix();
}    


