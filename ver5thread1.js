// Easy3D_WebGL
// Thread mesh generator 1
// Emmanuel Charette 2023

"use strict"

E3D_DEBUG_LOG_TIMESTAMPS = true;

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
SCENE.strokeColor = _v3_black;


// Create the entities
var groundEntity = new E3D_entity_wireframe_canvas("entity0");

// Ground plane
groundEntity.addPlane(_v3_origin, _v3_null, 12, 12, _v3_black, 120);
groundEntity.addPlane([0.0, -0.0001, 0.0], _v3_null, 0.6, 0.6, _v3_lightgray, 60);
groundEntity.addPlane([0.0, 0.0001, 0.0], _v3_null, 12, 12, _v3_red, 12);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);

// Profile wireframe
var profileEntity = new E3D_entity_wireframe_canvas("entity1");
E3D_addEntity(profileEntity);
profileEntity.isVisible = true;

// tweak engine params
E3D_NEAR = 0.1;
E3D_FAR = 256.0;
CAMERA = new E3D_camera_model("camera0m");
E3D_onResize();

//CONTEXT.disable(CONTEXT.CULL_FACE);

// Move the camera back and up a little, add some nod
CAMERA.moveBy(0.5, 0.05, 0.5, 0.1, 0, 0.0);
SCENE.setClearColor([ 0.85,  0.85,  0.85]);
SCENE.lightA_color = _v3_darkgray;
INPUTS._posSpeed *= 0.025;
INPUTS._rotSpeed *= 0.75;

// mesh creating utility
var meshLoader = new E3D_mesh();
var entity = new E3D_entity("entity1", true); // dynamic entity, GPU data will be updated when changed
// Setup entity
entity.isVisible = true;
entity.position = [0, 0, 0];
E3D_addEntity(entity);

// Mesh parameters

var majorDia = 1;
var pitch = 14; // TPI
var angle = 60;

var fitCut = 0.003;
var rootCut = 0.250;
var tipCut = 0.125;

var nTurns = 10;
var nSections = 16;
var meshType = "ext"; // ext | int | spec
var threadType = "UNC"; // UNC | ACME // TODO metric?

var genInhibit = false;

profileEntity.clear();

function genMesh(){
    if (genInhibit) return;

    meshLoader.reset();

    var points = [];
    points.push(v3_new()); // bottom mid root
    points.push(v3_new()); // bottom

    points.push(v3_new()); // bottom tip
    points.push(v3_new()); // top tip

    points.push(v3_new()); // top
    points.push(v3_new()); // top mid root

    const majorRadius = majorDia / 2;
    const decimalPitch = (1 / pitch);
    const halfDecPitch = decimalPitch / 2;
    const threadH = decimalPitch / (2 * Math.tan(angle * DegToRad / 2) );
    const angleRatio =  Math.tan(angle * DegToRad / 2);

    // as per UNC standard
    let tipRadius = majorRadius + ( threadH / 8 );
    let minorRadius = majorRadius - ( 5 * threadH / 8 );
    let rootRadius = majorRadius - ( 7 * threadH / 8 );

    // 2023-08-29 late night tweak
    const tipWidth = 0.5 - (angleRatio / 2); // 0.3707 for 29deg
    if (threadType == "ACME") {
        tipRadius = majorRadius + ( threadH * tipWidth );
        minorRadius = majorRadius - halfDecPitch;
        rootRadius = minorRadius - ( threadH * tipWidth );
    }
    // compensated
    let EffMajorRadius = tipRadius - (tipCut * threadH);
    let EffMinorRadius = rootRadius + (rootCut * threadH);
    if ((threadType == "UNC") || (threadType == "Metric")) {
        if (meshType == "int") EffMajorRadius = tipRadius;
        if (meshType == "ext") EffMinorRadius = rootRadius;
    }

    if (threadType == "ACME") {
        if (tipCut > tipWidth) tipCut = tipWidth;
        EffMajorRadius = majorRadius - (tipCut * threadH);
        EffMinorRadius = minorRadius + (rootCut * threadH);
        if (meshType == "int") EffMajorRadius = majorRadius + (tipCut * threadH);
        if (meshType == "ext") EffMinorRadius = minorRadius - (rootCut * threadH);
    }

    //paramDiv3.innerText  = "10% fit: " + (0.1 / pitch).toFixed(4) + "\n";
    //paramDiv3.innerText += "Pitch: " + decimalPitch.toFixed(4) + "\n";
    //paramDiv3.innerText += "H: " + threadH.toFixed(4) + "\n";
    E3D_setOutput_text(paramDiv3, "fit", (0.1 / pitch).toFixed(4));
    E3D_setOutput_text(paramDiv3, "pitch", decimalPitch.toFixed(4));
    E3D_setOutput_text(paramDiv3, "threadH", threadH.toFixed(4));

    let fitVertOffset = 0.5 * fitCut / Math.sin((90-(angle/2)) * DegToRad);
    //if (meshType == "spec") fitVertOffset = 0.0000;
    if (meshType == "int") fitVertOffset = -fitVertOffset;
    if (fitVertOffset > (angleRatio * (tipRadius - EffMajorRadius))) fitVertOffset = (angleRatio * (tipRadius - EffMajorRadius));
    if (fitVertOffset < (-angleRatio * (EffMinorRadius - rootRadius))) fitVertOffset = (-angleRatio * (EffMinorRadius - rootRadius));

    points[0][0] = rootRadius;

    points[1][0] = tipRadius;
    points[1][1] = halfDecPitch;

    points[2][0] = rootRadius;
    points[2][1] = decimalPitch;

    points[3] = v3_val_new(EffMinorRadius, 0, 0.0001);
    points[4] = v3_val_new(EffMinorRadius, (angleRatio * (EffMinorRadius - rootRadius)) + fitVertOffset,  0.0001);
    points[5] = v3_val_new(EffMajorRadius, (halfDecPitch - (angleRatio * (tipRadius - EffMajorRadius))) + fitVertOffset,  0.0001);

    points[6] = v3_val_new(EffMajorRadius, halfDecPitch + (angleRatio * (tipRadius - EffMajorRadius)) - fitVertOffset,  0.0001);
    points[7] = v3_val_new(EffMinorRadius, decimalPitch - (angleRatio * (EffMinorRadius - rootRadius)) - fitVertOffset,  0.0001);
    points[8] = v3_val_new(EffMinorRadius, decimalPitch, 0.0001);

    const p0_bottom_midroot = v3_clone(points[3]);
    const p1_bottom = v3_clone(points[4]);
    const p2_bottom_tip = v3_clone(points[5]);
    const p3_top_tip = v3_clone(points[6]);
    const p4_top = v3_clone(points[7]);
    const p5_top_midroot = v3_clone(points[8]);

    profileEntity.clear();
    profileEntity.addLine([majorRadius, 0, 0], [majorRadius, nTurns * decimalPitch], _v3_darkgreen);
    profileEntity.addLine([minorRadius, 0, 0], [minorRadius, nTurns * decimalPitch], _v3_darkgreen);
    profileEntity.addLine([tipRadius, 0, 0], [tipRadius, nTurns * decimalPitch], _v3_red);
    profileEntity.addLine([rootRadius, 0, 0], [rootRadius, nTurns * decimalPitch], _v3_red);

    for (var i = 0; i < nTurns; ++i) {
        profileEntity.addLine(points[0], points[1], _v3_red);
        profileEntity.addLine(points[1], points[2], _v3_red);

        profileEntity.addLine(points[3], points[4], _v3_blue);
        profileEntity.addLine(points[4], points[5], _v3_blue);
        profileEntity.addLine(points[5], points[6], _v3_blue);
        profileEntity.addLine(points[6], points[7], _v3_blue);
        profileEntity.addLine(points[7], points[8], _v3_blue);

        v3_add_mod(points[0], [0, decimalPitch, 0]);
        v3_add_mod(points[1], [0, decimalPitch, 0]);
        v3_add_mod(points[2], [0, decimalPitch, 0]);

        v3_add_mod(points[3], [0, decimalPitch, 0]);
        v3_add_mod(points[4], [0, decimalPitch, 0]);
        v3_add_mod(points[5], [0, decimalPitch, 0]);
        v3_add_mod(points[6], [0, decimalPitch, 0]);
        v3_add_mod(points[7], [0, decimalPitch, 0]);
        v3_add_mod(points[8], [0, decimalPitch, 0]);
    }



    // generate mesh
    const sectionAngle = Math.PI * 2 / nSections;
    const turnOffset = v3_val_new(0, decimalPitch, 0);
    const sectionOffset = v3_val_new(0, decimalPitch / nSections, 0);

    for (var t = 0; t < nTurns; ++t) {
        points[0] = v3_addscaled_new(p0_bottom_midroot, turnOffset, t);
        points[1] = v3_addscaled_new(p1_bottom, turnOffset, t);
        points[2] = v3_addscaled_new(p2_bottom_tip, turnOffset, t);
        points[3] = v3_addscaled_new(p3_top_tip, turnOffset, t);
        points[4] = v3_addscaled_new(p4_top, turnOffset, t);
        points[5] = v3_addscaled_new(p5_top_midroot, turnOffset, t);

        for (var s = 0; s < nSections; ++s) {
            points[6]  = v3_rotateY_new(points[0], sectionAngle);
            points[7]  = v3_rotateY_new(points[1], sectionAngle);
            points[8]  = v3_rotateY_new(points[2], sectionAngle);
            points[9]  = v3_rotateY_new(points[3], sectionAngle);
            points[10] = v3_rotateY_new(points[4], sectionAngle);
            points[11] = v3_rotateY_new(points[5], sectionAngle);

            v3_add_mod(points[6], sectionOffset);
            v3_add_mod(points[7], sectionOffset);
            v3_add_mod(points[8], sectionOffset);
            v3_add_mod(points[9], sectionOffset);
            v3_add_mod(points[10], sectionOffset);
            v3_add_mod(points[11], sectionOffset);

            meshLoader.pushQuad4p(points[0], points[6], points[7], points[1]);
            meshLoader.pushQuad4p(points[1], points[7], points[8], points[2]);
            meshLoader.pushQuad4p(points[2], points[8], points[9], points[3]);
            meshLoader.pushQuad4p(points[3], points[9], points[10], points[4]);
            meshLoader.pushQuad4p(points[4], points[10], points[11], points[5]);

            v3_copy(points[0], points[6]);
            v3_copy(points[1], points[7]);
            v3_copy(points[2], points[8]);
            v3_copy(points[3], points[9]);
            v3_copy(points[4], points[10]);
            v3_copy(points[5], points[11]);
        }
    }

    // bottom cap
    let middle = v3_val_new(0, halfDecPitch, 0);
    for (var s = 0; s < nSections; ++s) {
        points[0]  = v3_rotateY_new(p0_bottom_midroot, sectionAngle * s);
        points[1]  = v3_rotateY_new(p0_bottom_midroot, sectionAngle * (s + 1));

        v3_addscaled_mod(points[0], sectionOffset, s);
        v3_addscaled_mod(points[1], sectionOffset, s + 1);

        meshLoader.pushTriangle3p(points[1], points[0], middle);
    }

    // bottom thread end
    meshLoader.pushTriangle3p(middle, p0_bottom_midroot, p1_bottom);
    meshLoader.pushTriangle3p(middle, p1_bottom, p2_bottom_tip);
    meshLoader.pushTriangle3p(middle, p2_bottom_tip, p3_top_tip);
    meshLoader.pushTriangle3p(middle, p3_top_tip, p4_top);
    meshLoader.pushTriangle3p(middle, p4_top, p5_top_midroot);

    // top cap
    middle = v3_val_new(0, (nTurns * decimalPitch) + halfDecPitch, 0);
    for (var s = 0; s < nSections; ++s) {
        points[0]  = v3_rotateY_new(p5_top_midroot, sectionAngle * s);
        points[1]  = v3_rotateY_new(p5_top_midroot, sectionAngle * (s + 1));

        v3_addscaled_mod(points[0], sectionOffset, ((nTurns - 1) * nSections) + s);
        v3_addscaled_mod(points[1], sectionOffset, ((nTurns - 1) * nSections) + s + 1);

        meshLoader.pushTriangle3p(points[0], points[1], middle);
    }

    // top thread end
    v3_addscaled_mod(p0_bottom_midroot, turnOffset, nTurns);
    v3_addscaled_mod(p1_bottom, turnOffset, nTurns);
    v3_addscaled_mod(p2_bottom_tip, turnOffset, nTurns);
    v3_addscaled_mod(p3_top_tip, turnOffset, nTurns);
    v3_addscaled_mod(p4_top, turnOffset, nTurns);
    v3_addscaled_mod(p5_top_midroot, turnOffset, nTurns);

    meshLoader.pushTriangle3p(middle, p1_bottom, p0_bottom_midroot);
    meshLoader.pushTriangle3p(middle, p2_bottom_tip, p1_bottom);
    meshLoader.pushTriangle3p(middle, p3_top_tip, p2_bottom_tip);
    meshLoader.pushTriangle3p(middle, p4_top, p3_top_tip);
    meshLoader.pushTriangle3p(middle, p5_top_midroot, p4_top);

    meshLoader.addModelData(entity);
}


var paramDiv1 = document.getElementById("paramDiv1");
var paramDiv2 = document.getElementById("paramDiv2");
var paramDiv3 = document.getElementById("paramDiv3");
//var paramDiv4 = document.getElementById("paramDiv4");
// TODO add to DOM helper class
function E3D_addInput_range(element, name, caption, min, max, value, callback, step = 1, scale = 1, formatter = null) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newElem2 = document.createElement("span");
    newElem2.className = "E3D_input_value";
    newElem2.innerText = value;
    newElem2.id = "range_"+name+"_value";
    element.appendChild(newElem2);

    //<input type="range" id="range_$name" class="E3D_input_range" min="$min" max="$max" step="$step" value="$value" data-scale="$scale"/>
    newElem = document.createElement("input");
    newElem.type = "range";
    newElem.id = "range_"+name;
    newElem.className = "E3D_input_range";
    newElem.setAttribute("min", min);
    newElem.setAttribute("max", max);
    newElem.setAttribute("step", step);
    newElem.value = value;
    newElem.setAttribute("data-scale", scale);
    element.appendChild(newElem);

    newElem.addEventListener("input", function(event) {
        var newValue = event.target.value * scale;
        if (formatter != null) newValue = formatter(newValue);
        newElem2.innerText = newValue;
        callback(event, "range", name, newValue);
    });
}
function E3D_setInput_range(element, name, value) {
    var newInputValue = element.querySelector("#range_"+name+"_value");
    var newInputElem = element.querySelector("#range_"+name);
    if ((newInputValue) && (newInputElem)) {

        newInputValue.innerText = value;
        newInputElem.value = value;
        newInputElem.dispatchEvent(new Event('input', { bubbles: true, target:newInputElem, value: value }));
    }

}

function E3D_addInput_radio(element, name, caption, group, checked, callback) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newDiv = document.createElement("div");
    newDiv.className = "E3D_input_value";
    element.appendChild(newDiv);

        newElem = document.createElement("input");
        newElem.type = "radio";
        newElem.id = "radio_"+name;
        //newElem.className = "E3D_input_radio";
        newElem.setAttribute("name", group);
        if (checked) newElem.setAttribute("checked", true);
        newDiv.appendChild(newElem);

    var newElem2 = document.createElement("span");
    newElem2.innerHTML = "&nbsp;";
    element.appendChild(newElem2);

    //<input type="radio" id="radio_$name" name="$group" class="E3D_input_radio" $checked />

    newElem.addEventListener("input", function(event) { callback(event, "radio", name, event.target.checked, event.target.name); });
}

function E3D_addInput_checkbox(element, name, caption, checked, callback) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newDiv = document.createElement("div");
    newDiv.className = "E3D_input_value";
    element.appendChild(newDiv);

        newElem = document.createElement("input");
        newElem.type = "checkbox";
        //ewElem.className = "E3D_input_checkbox";
        newElem.id = "checkbox_" + name;
        if (checked) newElem.setAttribute("checked", true);
        newDiv.appendChild(newElem);
        newElem.addEventListener("input", function(event) { callback(event, "checkbox", name, event.target.checked); });

    newElem = document.createElement("span");
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

}
function E3D_addSeparator(element) {
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_separator";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_separator";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_separator";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);
}
function E3D_addHeader(element, text) {
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_header";
    newElem.innerText = text;
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_header";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_header";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);
}

function E3D_addOutput_text(element, name, caption, value) {
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_value";
    newElem.id = "outputText_" + name;
    newElem.innerText = value;
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);
}

function E3D_setOutput_text(element, name, value) {
    var outputElem = element.querySelector("#outputText_"+name);
    if (outputElem) {
        outputElem.innerText = value;
    }
}

function E3D_addInput_select(element, name, caption, options, values, callback) {
    if ((!values) || (values.length == 0)) values = options;

    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    newElem = document.createElement("span");
    newElem.className = "E3D_input_value";
    newElem.innerHTML = "&nbsp;";
    element.appendChild(newElem);

    newElem = document.createElement("select");
    newElem.className = "E3D_input_select";
    newElem.id = "select_" + name;
    element.appendChild(newElem);

    for (var i = 0; i < options.length; ++i) {
        var newOpt = document.createElement("option");
        newOpt.innerText = options[i];
        newOpt.value = values[i];
        newElem.appendChild(newOpt);
    }

    newElem.addEventListener("input", function(event) { callback(event, "select", name, event.target.value); });

}

// TODO E3D_setInput_select
// TODO E3D_setInput_radio


//E3D_addHeader(paramDiv1, "Type");
E3D_addInput_radio(paramDiv1, "UNC", "Unified Standard", "type", true, paramDiv2CB);
E3D_addInput_radio(paramDiv1, "ACME", "ACME", "type", false, paramDiv2CB);
E3D_addInput_radio(paramDiv1, "Metric", "Metric", "type", false, paramDiv2CB);
E3D_addInput_radio(paramDiv1, "G", "Whitworth/G/PF", "type", false, paramDiv2CB);
E3D_addInput_radio(paramDiv1, "NPT", "NPT", "type", false, paramDiv2CB);

E3D_addHeader(paramDiv1, "Parameters");
E3D_addInput_range(paramDiv1, "dia", "Maj. Diameter", 0.125, 2, 1.0, paramDiv1CB, 0.005);
E3D_addInput_range(paramDiv1, "pitch", "TPI", 1, 80, 14, paramDiv1CB, 0.5);
E3D_addInput_range(paramDiv1, "angle", "P. Angle", 2, 120, 60, paramDiv1CB, 1);
E3D_addInput_range(paramDiv1, "fit", "Fit", -0.050, 0.050, 0.003, paramDiv1CB, 0.0005);

function paramDiv1CB(event, type, id, value, group) {
    switch (id) {
        case "dia":
            majorDia = value;
            break;
        case "pitch":
            pitch = value;
            break;
        case "angle":
            angle = value;
            break;
        case "fit":
            fitCut = value;
            break;
        case "tip":
            tipCut = value;
            break;
        case "root":
            rootCut = value;
            break;
    }
    entity.clear();
    genMesh();
}

E3D_addHeader(paramDiv2, "Adjustments");
E3D_addInput_range(paramDiv2, "tip", "Tip cut ratio / allowance", 0.000, 0.495, 0.125, paramDiv1CB, 0.005);
E3D_addInput_range(paramDiv2, "root", "Root cut ratio / allowance", 0.000, 0.495, 0.25, paramDiv1CB, 0.005);

E3D_addHeader(paramDiv2, "Mesh");
E3D_addInput_range(paramDiv2, "nSections", "Nb of Sections", 6, 256, 16, paramDiv2CB, 1);
E3D_addInput_range(paramDiv2, "nTurns", "Nb of turns", 1, 128, 10, paramDiv2CB, 1);
E3D_addSeparator(paramDiv2);
E3D_addInput_radio(paramDiv2, "ext", "External Thread", "style", true, paramDiv2CB);
E3D_addInput_radio(paramDiv2, "int", "Internal Thread", "style", false, paramDiv2CB);
E3D_addInput_radio(paramDiv2, "spec", "Spec Profile", "style", false, paramDiv2CB);

function paramDiv2CB(event, type, id, value, group) {
    switch (id) {
        case "nSections":
            nSections = value;
            break;
        case "nTurns":
            nTurns = value;
            break;
    }
    if (type == "radio") {
        if (group == "style") {
            meshType = id;
        } else if (group == "type") {
            threadType = id;
            genInhibit = true;
            if ((id == "UNC") || (id == "Metric")) {
                E3D_setInput_range(paramDiv1, "angle", 60);
                E3D_setInput_range(paramDiv2, "tip", 0.125);
                E3D_setInput_range(paramDiv2, "root", 0.25);
            } else if (id == "ACME") {
                E3D_setInput_range(paramDiv1, "angle", 29);
                E3D_setInput_range(paramDiv2, "tip", 0.0);
                E3D_setInput_range(paramDiv2, "root", 0.0);
            } else if ((id == "G") || (id == "NPT")) {
                E3D_setInput_range(paramDiv1, "angle", 55);
                E3D_setInput_range(paramDiv2, "tip", 0.1);
                E3D_setInput_range(paramDiv2, "root", 0.1);
            }

        } else console.log("Unkown radio callback group");
    }
    genInhibit = false;
    entity.clear();
    genMesh();
}

E3D_addOutput_text(paramDiv3, "fit", "10% Fit", "0.0000");
E3D_addOutput_text(paramDiv3, "pitch", "Pitch (dec)", "0.0000");
E3D_addOutput_text(paramDiv3, "threadH", "Form Height", "0.0000");
E3D_addInput_checkbox(paramDiv3, "testCB", "Checkbox Test", true, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "testRB1", "RadioButton Test1", "testgrp", true, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "testRB2", "RadioButton Test2", "testgrp", false, paramDiv3CB);

E3D_addInput_select(paramDiv3, "testSelect1", "Select Test1", ["a", "b", "c", "d"], null, paramDiv3CB);
E3D_addInput_select(paramDiv3, "testSelect2", "Select Test2", ["aaaaaaa", "bb bb", "cc", "dd dd dd dd d"], [1, 2, 3, 4], paramDiv3CB);

function paramDiv3CB(event, type, id, value, group) {
    console.log("event " + type + " " + id + " " + value + " " + group);
}

var bottomBar = document.getElementById("bottomBar");
CB_tick = function() {
    var t = meshLoader.positions.length/9 + " poly, ";
    bottomBar.innerText = t;
}

var text_output = document.getElementById("text_output");

document.getElementById("button_save").addEventListener("click", saveMesh);
function saveMesh() {
    for (var i = 0; i < meshLoader.positions.length; ++i) meshLoader.positions[i] *= 25.4;
    var n = "d" + Math.round(majorDia * 1000) + " p" + pitch + " f" + Math.round(fitCut * 10000);
        downloadBlob("mesh" + n + ".stl", meshLoader.saveModel_ASCIISTL("ver5thread1.js"));
    for (var i = 0; i < meshLoader.positions.length; ++i) meshLoader.positions[i] /= 25.4;
}
document.getElementById("button_clean").addEventListener("click", cleanMesh);

function cleanMesh() {
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

    entity.clear();
    meshLoader.addModelData(entity);

    st = performance.now();
    meshLoader.addStrokeData(entity);
    et = performance.now();
    console.log("t add stroke data: " + (et - st));
}

genMesh();

/*
Whitworth / G / PF
p = 1.0 / TPI
d = 0.640327 * p (clipped thread form height)
r = 0.137329 * p (thread tip radius)
H = d * 1.3333 (H = d + H/6 + H/6, H = d / 0.6667)
a = 55.0
*/
/*
NPT
taper angle
3/4 per foot. (3/8 per foot on radius)


*/