// Easy3D_WebGL
// bell mesh generator
// Emmanuel Charette 2026

"use strict"

E3D_DEBUG_LOG_TIMESTAMPS = true;

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
SCENE.strokeColor = _v3_black;
SCENE.fogLimit = 2.0;
// Create the entities
var groundEntity = new E3D_entity_wireframe_canvas("entity0");

// Ground plane
groundEntity.addPlane(_v3_origin, _v3_null, 300, 300, [0.2, 0.2, 0.2], 150);
groundEntity.addPlane([0.0, 0.01, 0.0], _v3_null, 300, 300, _v3_red, 30);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);

// Tweak engine params
E3D_NEAR = 1.0;
E3D_FAR = 1024;
CAMERA = new E3D_camera_model("camera0m");
E3D_onResize();
CONTEXT.disable(CONTEXT.CULL_FACE);

// Move the camera back and up a little, add some nod
CAMERA.moveBy(0, 25, 50, 0.0, 0, 0.0);
SCENE.setClearColor([ 0.85,  0.85,  0.85]);
SCENE.lightA_color = _v3_darkgray;
//INPUTS._posSpeed *= 0.025;
//INPUTS._rotSpeed *= 0.75;

// mesh creating utility
//var bunnyLoader = new E3D_mesh();
//load_bunny();

var meshLoader = new E3D_mesh();

var meshentity = new E3D_entity("Mesh", true); // dynamic entity, GPU data will be updated when changed
meshentity.isVisible = true;
E3D_addEntity(meshentity);

var entity = new E3D_entity_wireframe_canvas("WireFrame", false); // dynamic entity, GPU data will be updated when changed
entity.isVisible = true;
E3D_addEntity(entity);

var debugentity = new E3D_entity_wireframe_canvas("DebugWireFrame", false); // dynamic entity, GPU data will be updated when changed
debugentity.isVisible = true;
E3D_addEntity(debugentity);


var genInhibit = false;


// Mesh parameters
var radius = 24.0;
var amplitude = 36.0;
var offset = radius / 8.0;
var slices = 45;
var turns = 0.75;
var points = 64;
var formula = "B";
var skirtFormula = "A";
var hole = 0;
var offsetType = "V";
var skirt = 0;

function skirtFunct(y, h, off = 0) {
    // y should be between amplitude and 0
    // h is sin skirt
    //if ((y - amplitude) > amplitude) console.log("Y amp error", y, amplitude);
    return (((y-off)-amplitude) / amplitude) * (h + amplitude) + amplitude + off;
}

function processFormula(angle, selectedFormula, amp) {
    var y = 0;
    var hAmp = amp / 2;
    switch (selectedFormula) {
        case "A":
            y = hAmp * Math.cos(angle) + hAmp;
            break;
        case "B":
            var a = angle / 1.36;
            a = a + PIdiv2;
            y = amp * Math.cos(a + Math.cos(a)) + amp;
            break;
        case "C":
            y = hAmp * Math.cos(angle - Math.sin(angle)) + hAmp;
            break;
        case "D":
            y = hAmp * Math.cos(angle - (Math.PI / 2.25 * Math.sin(angle))) + hAmp;
            break;
        case "E":
            y = hAmp * (10*Math.cos(angle)/9 - Math.cos(3*angle)/9) + hAmp;
            break;
    }
    return y;
}

function genMesh(){
    if (genInhibit) return;
    entity.clear();
    debugentity.clear();
    debugentity.addLine([0,0,0], [0, amplitude, 0], _v3_green);
    meshentity.clear();

    //document.activeElement.blur();

    var vertices = [];
    vertices.push([]);
    for (var p = 0; p <= points; ++p) {

        var x = hole + (p * (radius-hole) / points);
        var angle = Math.PI * x / radius;
        var y = processFormula(angle, formula, amplitude);
        var n = v3_val_new(x, y, 0);
        vertices[0].push(n); // base data
    }

    var lastH;
    for (var s = 0; s <= slices; ++s) {
        var angle = Math.PI * 2.0 * turns * s / slices;
        vertices.push([]); // 1 3 5 etc bottom

        //var h = (skirt/2) * Math.sin((angle*2) + 1.5*Math.PI ) + (skirt/2);
        var h = processFormula((angle*2) + 1.5*Math.PI, skirtFormula, skirt);
        var currentOffset = 0;

        if (s > 0) {
            var p0 = v3_val_new(radius, -lastH, 0);
            var p1 = v3_val_new(radius, -h, 0);
            v3_rotateY_mod(p0, Math.PI * 2.0 * turns * (s-1) / slices);
            v3_rotateY_mod(p1, angle);
            debugentity.addLine(p0, p1, _v3_magenta);            
        }
        lastH = h;

        for (var p = 0; p <= points; ++p) {
            var n = v3_rotateY_new(vertices[0][p], angle);
            n[1] = skirtFunct(n[1], h);
            if (p == 0) entity.moveLineCursorTo(n); else entity.addLineTo(n, [1,0,0]);
            vertices[s*2+1].push(n);
        }
        vertices.push([]); // 2 4 6 etc top
        var lastGoodNN = [0, 1024, 0];
        for (var p = 0; p <= points; ++p) {
            var n = v3_rotateY_new(vertices[0][p], angle);
            switch (offsetType){
                case "V":
                    v3_translateY_mod(n, offset);
                    currentOffset = offset;
                    break;                    
                case "T":
                    if (p == 0) {
                        v3_translateY_mod(n, offset);
                        currentOffset = offset;
                    } else {
                        var delta2 = v3_sub_new(vertices[0][p], vertices[0][p-1]);
                        var delta1 = (p == points) ? v3_clone(delta2) : v3_sub_new(vertices[0][p+1], vertices[0][p]);
                        var nn = v3_add_new(delta1, delta2);

                        var xx = nn[0];
                        nn[0] = -nn[1];
                        nn[1] = xx;
                        v3_normalize_mod(nn);
                        v3_scale_mod(nn, offset);
                        v3_add_mod(nn, vertices[0][p]);

                        if (nn[0] < lastGoodNN[0]) nn[0] = lastGoodNN[0];
                        lastGoodNN[0] = nn[0];

                        if (nn[1] > lastGoodNN[1]) nn[1] = lastGoodNN[1];
                        lastGoodNN[1] = nn[1];

                        v3_rotateY_res(n, nn, angle);
                        currentOffset = n[1] - vertices[0][p][1];
                    }
                    break;
            }
            n[1] = skirtFunct(n[1], h, currentOffset);
            if (s == 0) debugentity.addLine(vertices[1][p], n);
            if (p == 0) entity.moveLineCursorTo(n); else entity.addLineTo(n, [0,0,1]);
            vertices[s*2+2].push(n);
        } 
    }

    meshLoader.reset();
    // create ouside mesh
    for (var s = 0; s < slices; ++s) {
        for (var p = 0; p < points; ++p) {
            meshLoader.pushQuad4p(vertices[2*s + 1][p], vertices[2*s + 3][p], vertices[2*s + 3][p+1], vertices[2*s + 1][p+1]);
            meshLoader.pushQuad4p(vertices[2*s + 2][p], vertices[2*s + 2][p+1], vertices[2*s + 4][p+1], vertices[2*s + 4][p]);
        }
    }
    // create rim
    for (var s = 0; s < slices; ++s) {
        meshLoader.pushQuad4p(vertices[2*s + 1][points], vertices[2*s + 3][points], vertices[2*s + 4][points], vertices[2*s + 2][points]);
    }
    // create hole
    if (hole > 0) for (var s = 0; s < slices; ++s) {
        meshLoader.pushQuad4p(vertices[2*s + 1][0], vertices[2*s + 2][0], vertices[2*s + 4][0], vertices[2*s + 3][0]);
    }

    // transfer data
    meshLoader.addModelData(meshentity);
}


var paramDiv1 = document.getElementById("paramDiv1");
E3D_addHeader(paramDiv1, "Parameters");
E3D_addInput_range(paramDiv1, "radius", "radius", 1, 128, radius, paramDiv1CB, 0.5);
E3D_addInput_range(paramDiv1, "amplitude", "amplitude", 0.5, 128, amplitude, paramDiv1CB, 0.5);
E3D_addInput_range(paramDiv1, "offset", "offset", 0.1, 24, offset, paramDiv1CB, 0.1);
E3D_addInput_range(paramDiv1, "slices", "slices", 2, 180, slices, paramDiv1CB, 1);
E3D_addInput_range(paramDiv1, "turns", "turns", 0.05, 1, turns, paramDiv1CB, 0.05);
E3D_addInput_range(paramDiv1, "points", "points", 2, 256, points, paramDiv1CB, 1);

function paramDiv1CB(event, type, id, value, group) {
    switch (id) {
        case "radius":
            radius = value;
            break;
        case "amplitude":
            amplitude = value;
            break;
        case "offset":
            offset = value;
            break;
        case "slices":
            slices = value;
            break;
        case "turns":
            turns = value;
            break;
        case "points":
            points = value;
            break;
    }

    genMesh();
}

var paramDiv2 = document.getElementById("paramDiv2");
E3D_addHeader(paramDiv2, "(More parameters)");
E3D_addInput_checkbox(paramDiv2, "traces", "Formula Traces", true, paramDiv2CB);
E3D_addInput_select(paramDiv2, "offsetType", "Offset Direction", ["UP", "TAN"], ["V", "T"], paramDiv2CB);
E3D_addInput_range(paramDiv2, "hole", "Hole Radius", 0, 32, 0, paramDiv2CB, 0.1);
E3D_addInput_select(paramDiv2, "formula", "Shape Formula", ["Cos(a)", "Cos(a + Cos(a))", "Cos(a - Sin(a))", "Cos(a - Pi/2.25*Sin(a))", "10/9Cos(a) - 1/9Cos(3a)"], ["A", "B", "C", "D", "E"], paramDiv2CB);
E3D_addInput_range(paramDiv2, "skirt", "Skirt Length", 0, 64, 0, paramDiv2CB, 0.1);
E3D_addInput_select(paramDiv2, "skirtFormula", "Skirt Formula", ["Cos(a)", "10/9Cos(a) - 1/9Cos(3a)"], ["A", "E"], paramDiv2CB);

function paramDiv2CB(event, type, id, value, group) {
    switch (id) {
        case "formula":
            formula = value;
            break;
        case "traces":
            entity.isVisible = value;
            debugentity.isVisible = value;
            break;
        case "hole":
            hole = value;
            break;
        case "offsetType":
            offsetType = value;
            break;
        case "skirt":
            skirt = value;
            break;
        case "skirtFormula":
            skirtFormula = value;
            break;
    }

    if (id != "traces") genMesh();
}
E3D_setInput_select(paramDiv2, "formula", "B");
E3D_setInput_select(paramDiv2, "skirtFormula", "A");
/*
var paramDiv3 = document.getElementById("paramDiv3");
E3D_addHeader(paramDiv3, "Code");
E3D_addInput_select(paramDiv3, "codeType", "Type", ["ITA2", "USTTY"], null, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "noEmpty", "Skip Unimplemented", "empty", true, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "qmEmpty", "Unimplemented == '?'", "empty", false, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "spEmpty", "Unimplemented == SPACE", "empty", false, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "nullEmpty", "Unimplemented == NULL", "empty", false, paramDiv3CB);
function paramDiv3CB(event, type, id, value, group) {
    console.log("event t:" + type + " i:" + id + " v:" + value + " g:" + group);

    if (group == "empty") switch (id) {
        case "noEmpty":
            skipMode = "S";
            break;
        case "qmEmpty":
            skipMode = "?";
            break;
        case "spEmpty":
            skipMode = " ";
            break;
        case "nullEmpty":
            skipMode = "N";
            break;
    }
    entity.clear();
    genMesh();
}
*/
var bottomBar = document.getElementById("bottomBar");
CB_tick = function() {
    var t = meshentity.numElements/3 + " poly, ";
    bottomBar.innerText = t;
}

var text_output = document.getElementById("text_output");

document.getElementById("button_save").addEventListener("click", saveMesh);
function saveMesh() {
    meshLoader.loadModel_fromEntity(entity);
    downloadBlob("bell.stl", meshLoader.saveModel_ASCIISTL("ver5bellGenerator.js"));
}
document.getElementById("button_clean").addEventListener("click", cleanMesh);

function cleanMesh() {
    meshLoader.loadModel_fromEntity(meshentity);

    var st = performance.now();
    meshLoader.removeArealessTriangles();
    var et = performance.now();
    console.log("t rem area 0 tri : " + (et - st));

    st = performance.now();
    meshLoader.genBoundingBox();
    et = performance.now();
    console.log("t gen bb : " + (et - st));

    st = performance.now();
    meshLoader.genUniqueVertices();
    et = performance.now();
    console.log("t uniques: " + (et - st));

    st = performance.now();
    meshLoader.smoothNormals(0.71);
    et = performance.now();
    console.log("t smooth : " + (et - st));

    st = performance.now();
    meshLoader.genEdges();
    et = performance.now();
    console.log("t edges: " + (et - st));

    meshentity.clear();
    meshLoader.addModelData(meshentity);

    st = performance.now();
    meshLoader.addStrokeData(meshentity);
    et = performance.now();
    console.log("t add stroke data: " + (et - st));
}

E3D_onResize(); // UI addition changes the viewport size
entity.clear();
genMesh();
