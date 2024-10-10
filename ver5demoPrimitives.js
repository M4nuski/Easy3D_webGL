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

const dataDiv = getElem("dataDiv");

// Parameters inputs
var paramDiv1 = getElem("paramDiv1");
var paramDiv2 = getElem("paramDiv2");
var paramDiv3 = getElem("paramDiv3");
var paramDiv4 = getElem("paramDiv4");

E3D_addHeader(paramDiv1, "Type");
E3D_addInput_radio(paramDiv1, "plane", "Plane", "type", true, paramDivCallback);
E3D_addInput_radio(paramDiv1, "dsplane", "Double Sided Plane", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv1, "box", "Box", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv1, "obox", "Open Box", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv1, "pyramid", "Pyramid", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv1, "bpyramid", "Bi Pyramid", "type", false, paramDivCallback);

E3D_addInput_radio(paramDiv2, "prism", "Prism", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv2, "aprism", "Asymetric Prism", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv2, "hprism", "Half Prism", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv2, "haprism", "Half Asymetric Prism", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv2, "torus", "Torus", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv2, "sphere", "Sphere", "type", false, paramDivCallback);
E3D_addInput_radio(paramDiv2, "tube", "Tube", "type", false, paramDivCallback);

E3D_addHeader(paramDiv3, "Parameters");
E3D_addInput_range(paramDiv3, "w", "Width", 2, 120, 24, paramDivCallback, 1.0);
E3D_addInput_range(paramDiv3, "h", "Height", 2, 120, 24, paramDivCallback, 1.0);
E3D_addInput_range(paramDiv3, "d", "Depth", 2, 120, 24, paramDivCallback, 1.0);

E3D_addInput_range(paramDiv3, "r", "Radius", 2, 60, 24, paramDivCallback, 1.0);
E3D_addInput_range(paramDiv3, "r2", "Radius2 (sect, asym, inner)", 2, 60, 12, paramDivCallback, 1.0);
E3D_addInput_range(paramDiv3, "si", "Sides", 2, 128, 8, paramDivCallback, 1.0);
E3D_addInput_range(paramDiv3, "se", "Sections", 2, 128, 8, paramDivCallback, 1.0);

E3D_addHeader(paramDiv4, "Options");
var a = []; forN(meshLoader.sphereBaseType.qty, (i) => a.push(i));
E3D_addInput_select(paramDiv4, "root", "Sphere Base Type", meshLoader.sphereBaseType.strings, a, paramDivCallback);
E3D_addInput_range(paramDiv4, "depth", "Sphere Subdiv Depth", 0, 7, 3, paramDivCallback, 1);
a = []; forN(meshLoader.originType.qty, (i) => a.push(i));
E3D_addInput_select(paramDiv4, "origin", "Mesh Origin", meshLoader.originType.strings, a, paramDivCallback);
E3D_addInput_checkbox(paramDiv4, "smooth", "Smooth Normals", false, paramDivCallback);
E3D_addInput_checkbox(paramDiv4, "color", "Colored", false, paramDivCallback);
E3D_addInput_checkbox(paramDiv4, "outline", "Edge Outline", false, paramDivCallback);

function paramDivCallback(event, type, name, value, group) {
    genMesh();

    //console.log("Type: " + type + " Name: " + name + " Value: " + value + " Group: " + group);

/*
    // Example when not using the E3D_UIParam("parameter name") function :
    switch (id) {
        case "root":
            root = Number(value);
        break;
        case "depth":
            depth = Number(value);
        break;
        case "origin":
            origin = Number(value);
        break;
     }
*/
}

function genMesh() {
    genDataText();

    entity.clear();
    meshLoader.reset();

    switch (E3D_UIParam("type")) {
        case "plane":
            meshLoader.pushPlane(_v3_origin, _v3_null, E3D_UIParam("w"), E3D_UIParam("h"), 0, _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "dsplane":
            meshLoader.pushDoubleSidedPlane(_v3_origin, _v3_null, E3D_UIParam("w"), E3D_UIParam("h"), 0.001, _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "box":
            meshLoader.pushBox(_v3_origin, _v3_null, E3D_UIParam("w"), E3D_UIParam("h"), E3D_UIParam("d"), _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "obox":
            meshLoader.pushOpenBox(_v3_origin, _v3_null, E3D_UIParam("w"), E3D_UIParam("h"), E3D_UIParam("d"), _v3_white, Number(E3D_UIParam("origin")), true, true, false);
        break;
        case "pyramid":
            meshLoader.pushPyramid(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("h"), E3D_UIParam("si"), _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "bpyramid":
            meshLoader.pushBiPyramid(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("h"), E3D_UIParam("si"), _v3_white, Number(E3D_UIParam("origin")));
        break;

        case "prism":
            meshLoader.pushPrism(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("h"), E3D_UIParam("si"), _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "hprism":
            meshLoader.pushHalfPrism(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("h"), E3D_UIParam("si"), _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "aprism":
            meshLoader.pushAsymetricPrism(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("r2"), E3D_UIParam("h"), E3D_UIParam("si"), _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "haprism":
            meshLoader.pushHalfAsymetricPrism(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("r2"), E3D_UIParam("h"), E3D_UIParam("si"), _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "sphere":
            meshLoader.pushSphere(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("depth"), _v3_white, Number(E3D_UIParam("origin")), Number(E3D_UIParam("root")));
        break;
        case "torus":
            meshLoader.pushTorus(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("r2"), E3D_UIParam("se"), E3D_UIParam("si"), _v3_white, Number(E3D_UIParam("origin")));
        break;
        case "tube":
            meshLoader.pushTube(_v3_origin, _v3_null, E3D_UIParam("r"), E3D_UIParam("r2"), E3D_UIParam("h"), E3D_UIParam("si"), _v3_white, Number(E3D_UIParam("origin")));
        break;
    }

    meshLoader.genUniqueVertices(0.01);
    if (E3D_UIParam("color")) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
    if (E3D_UIParam("smooth")) meshLoader.smoothNormals(0.707);
    if (E3D_UIParam("outline")) meshLoader.addStrokeData(entity, false, 0.999999); else entity.drawStrokes = false;
    meshLoader.addModelData(entity);
    E3D_updateEntityData(entity);
    CANVAS.focus();
}

// use the engine OnTick event callback to change the rotation of the entity
CB_tick = function() {
    //
}

function genDataText() {
    // Some index-to-string formatting
    var o = E3D_UIPARAM.get("origin");
    if (!isNaN(o)) E3D_UIPARAM.set("origin", meshLoader.originType.strings[o]);
    var r = E3D_UIPARAM.get("root");
    if (!isNaN(r)) E3D_UIPARAM.set("root", meshLoader.sphereBaseType.strings[r]);

    // Parameter map to text
    dataDiv.innerText = E3D_MapToText(E3D_UIPARAM);

    // Revert strings to indices
    E3D_UIPARAM.set("origin", o);
    E3D_UIPARAM.set("root", r);
}

E3D_onResize(); // UI addition changes the viewport size
genMesh(); // Generate mesh at startup


