// Easy3D_WebGL
// Main demo program for version 0.5
// Generation and loading of shape primitives simple out-of-engine animation
// Emmanuel Charette 2020, 2024

"use strict"


var paramText = document.getElementById("params");

E3D_DEBUG_LOG_TIMESTAMPS = true;
E3D_DEBUG_LOG_MESH_STATS = false;
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
//CONTEXT.disable(CONTEXT.CULL_FACE);

var meshLoader = new E3D_mesh();
// Create a solid cube
var entity = new E3D_entity("entity1", true); // dynamic entity, GPU data will be updated when changed
var axis = new E3D_entity_axis("axis", 256, true, 0, 0);
axis.isVisible = true;

axis.position = [0, 24, 0];
E3D_addEntity(axis);

// Setup entity
entity.isVisible = true;
entity.position = [0, 24, 0];
E3D_addEntity(entity);


// Parameters

var type = "plane";
var w = 24;
var h = 24;
var d = 24;
var r = 24;
var r2 = 12;
var si = 8;
var se = 8;
var root = 0;
var depth = 3;
var origin = 0;
var smooth = false;
var color = false;
var outline = false;

genMesh();


// Parameters inputs
var paramDiv1 = document.getElementById("paramDiv1");
var paramDiv2 = document.getElementById("paramDiv2");
var paramDiv3 = document.getElementById("paramDiv3");
var paramDiv4 = document.getElementById("paramDiv4");

E3D_addHeader(paramDiv1, "Type");
E3D_addInput_radio(paramDiv1, "plane", "Plane", "type", true, paramDiv1CB);
E3D_addInput_radio(paramDiv1, "dsplane", "Double Sided Plane", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv1, "box", "Box", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv1, "obox", "Open Box", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv1, "pyramid", "Pyramid", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv1, "bpyramid", "Bi Pyramid", "type", false, paramDiv1CB);

E3D_addInput_radio(paramDiv2, "prism", "Prism", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv2, "aprism", "Asymetric Prism", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv2, "hprism", "Half Prism", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv2, "haprism", "Half Asymetric Prism", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv2, "torus", "Torus", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv2, "sphere", "Sphere", "type", false, paramDiv1CB);
E3D_addInput_radio(paramDiv2, "tube", "Tube", "type", false, paramDiv1CB);
function paramDiv1CB(event, t, id, v, g) {
    type = id;
    genMesh();
}

E3D_addHeader(paramDiv3, "Parameters");
E3D_addInput_range(paramDiv3, "w", "Width", 2, 120, w, paramDiv3CB, 1.0);
E3D_addInput_range(paramDiv3, "h", "Height", 2, 120, h, paramDiv3CB, 1.0);
E3D_addInput_range(paramDiv3, "d", "Depth", 2, 120, d, paramDiv3CB, 1.0);

E3D_addInput_range(paramDiv3, "r", "Radius", 2, 60, r, paramDiv3CB, 1.0);
E3D_addInput_range(paramDiv3, "r2", "Radius2 (sect, asym, inner)", 2, 60, r2, paramDiv3CB, 1.0);
E3D_addInput_range(paramDiv3, "si", "Sides", 2, 128, si, paramDiv3CB, 1.0);
E3D_addInput_range(paramDiv3, "se", "Sections", 2, 128, se, paramDiv3CB, 1.0);

E3D_addHeader(paramDiv4, "Options");
var a = []; forN(meshLoader.sphereBaseType.qty, (i) => a.push(i));
E3D_addInput_select(paramDiv4, "root", "Sphere Base Type", meshLoader.sphereBaseType.strings, a, paramDiv3CB);
E3D_addInput_range(paramDiv4, "depth", "Sphere Subdiv Depth", 0, 16, depth, paramDiv3CB, 1);
a = []; forN(meshLoader.originType.qty, (i) => a.push(i));
E3D_addInput_select(paramDiv4, "origin", "Mesh Origin", meshLoader.originType.strings, a, paramDiv3CB);
E3D_addInput_checkbox(paramDiv4, "smooth", "Smooth Shading", smooth, paramDiv3CB);
E3D_addInput_checkbox(paramDiv4, "color", "Colored", color, paramDiv3CB);
E3D_addInput_checkbox(paramDiv4, "outline", "Edge Outline", outline, paramDiv3CB);
function paramDiv3CB(event, t, id, value, g) {
    switch (id) {
        case "w":
            w = Number(value);
        break;
        case "h":
            h = Number(value);
        break;
        case "d":
            d = Number(value);
        break;
        case "r":
            r = Number(value);
        break;
        case "r2":
            r2 = Number(value);
        break;
        case "si":
            si = Number(value);
        break;
        case "se":
            se = Number(value);
        break;

        case "root":
            root = Number(value);
        break;
        case "depth":
            depth = Number(value);
        break;
        case "origin":
            origin = Number(value);
        break;
        case "smooth":
            smooth = ((value == true) || (value == "true"));
        break;
        case "color":
            color = ((value == true) || (value == "true"));
        break;
        case "outline":
            outline = ((value == true) || (value == "true"));
        break;
     } // TODO parameters object, first letter is (i, f, s, b) for int, float, string, bool auto convertion



    genMesh();
}

E3D_onResize(); // UI addition changes the viewport size

function genMesh() {
    /*
    var type = "plane";
    var w = 24;
    var h = 24;
    var d = 24;
    var r = 24;
    var r2 = 12;
    var si = 8;
    var se = 8;
    var root = 0;
    var origin = 0;
    var smooth = false;
    var color = false;
    var outline = false;*/
    entity.clear();
    meshLoader.reset();

    switch (type) {
        case "plane":
            meshLoader.pushPlane(_v3_origin, _v3_null, w, h, 0, _v3_white, origin);
        break;
        case "dsplane":
            meshLoader.pushDoubleSidedPlane(_v3_origin, _v3_null, w, h, 0.001, _v3_white, origin);
        break;
        case "box":
            meshLoader.pushBox(_v3_origin, _v3_null, w, h, d, _v3_white, origin);
        break;
        case "obox":
            meshLoader.pushOpenBox(_v3_origin, _v3_null, w, h, d, _v3_white, origin, true, true, false);
        break;
        case "pyramid":
            meshLoader.pushPyramid(_v3_origin, _v3_null, r, h, si, _v3_white, origin);
        break;
        case "bpyramid":
            meshLoader.pushBiPyramid(_v3_origin, _v3_null, r, h, si, _v3_white, origin);
        break;

        case "prism":
            meshLoader.pushPrism(_v3_origin, _v3_null, r, h, si, _v3_white, origin);
        break;
        case "hprism":
            meshLoader.pushHalfPrism(_v3_origin, _v3_null, r, h, si, _v3_white, origin);
        break;
        case "aprism":
            meshLoader.pushAsymetricPrism(_v3_origin, _v3_null, r, r2, h, si, _v3_white, origin);
        break;
        case "haprism":
            meshLoader.pushHalfAsymetricPrism(_v3_origin, _v3_null, r, r2, h, si, _v3_white, origin);
        break;
        case "sphere":
            meshLoader.pushSphere(_v3_origin, _v3_null, r, depth, _v3_white, origin, root);
        break;
        case "torus":
            meshLoader.pushTorus(_v3_origin, _v3_null, r, r2, se, si, _v3_white, origin);
        break;
        case "tube":
            meshLoader.pushTube(_v3_origin, _v3_null, r, r2, h, si, _v3_white, origin);
        break;

    }



    meshLoader.genUniqueVertices(0.01);
    if (color) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
    if (smooth) meshLoader.smoothNormals(0.7);
    if (outline) meshLoader.addStrokeData(entity, false, 0.999999); else entity.drawStrokes = false;
    meshLoader.addModelData(entity);
    E3D_updateEntityData(entity);
    CANVAS.focus();
}

// use the engine OnTick event callback to change the rotation of the entity
CB_tick = function() {
    // rotate around Y
  //  entity.rotation[1] += TIMER.delta * 0.4;
  //  entity.updateMatrix();
}


