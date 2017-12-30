document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");


"use strict"


log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const logElement = document.getElementById("logDiv");
const status = document.getElementById("statusDiv");
const virtualKb = document.getElementById("inputTable"); 


log("Set DOM Events");
can.addEventListener("resize", winResize); // To reset camera matrix
document.forms["moveTypeForm"].addEventListener("change", winResize); // To update camera matrix


// Engine Config

const _fieldOfView = 45 * DegToRad;
const _zNear = 0.1;
const _zFar = 300.0;

// Engine State

var winWidth = 10, winHeight = 10;
var usepct_smth=0;
var l0v, l1v;// light entities index
var cloned = false;

// Engine Components

var gl; // webGL canvas rendering context
var timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var inputs = new E3D_input(can, true, true, true, true);
var vKBinputs = new E3D_input_virtual_kb(virtualKb, inputs, true);


log("Session Start", true);
initEngine();



function winResize() {
    winWidth = gl.canvas.clientWidth
    winHeight = gl.canvas.clientHeight;
    
    let vmode = document.forms["moveTypeForm"].moveType.value; 

    if (vmode == "model") {
        scn.camera = new E3D_camera_model("cam1m", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = false;
    } 
    else if (vmode == "free") {
        scn.camera = new E3D_camera_persp("cam1f", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
        scn.lights.light0_lockToCamera = true;
    } 
    else {
        scn.camera = new E3D_camera("cam1o", winWidth, winHeight);
    }

}

function initEngine() {

    log("Context Initialization", false);
    gl = can.getContext("webgl");

    if (!gl) {
        log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
        timer.pause();
        return;
    }

    log("Scene Creation", false);
    try {
        scn = new E3D_scene("mainScene", gl, winWidth, winHeight);
        scn.clearColor = vec4.fromValues(0.0, 0.0, 0.15, 1.0);
        scn.fogLimit = (_zFar - _zNear)*0.5;

        log("Shader Program Initialization", false);
        scn.program = new E3D_program("mainProgram", gl);
        scn.program.compile(vertShader01, fragShader01);
        scn.program.bindLocations(attribList01, uniformList01);

        log("Lighting Initialization", false);
        scn.lights =  new E3D_lighting(vec3.fromValues(0.0, 0.0, 0.15));
        scn.lights.setColor0(vec3.fromValues(1.0, 1.0, 1.0));
        scn.lights.setDirection0(vec3.fromValues(-0.2, -0.2, -1.0)); 
        scn.lights.light0_lockToCamera = true;

        scn.lights.setColor1(vec3.fromValues(1.0, 1.0, 0.85));
        scn.lights.setDirection1(vec3.fromValues(1.0, -1.0, 0.8));
        scn.lights.light1_lockToCamera = false;

        log("Camera Initialization", false);
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

    } catch (e) {
        log(e, false);

        return; 
    }
     
    resMngr.addRessource("ST.raw", "ST", "Model");
    resMngr.addRessource("AXIS.raw", "Map", "Model");

    resMngr.loadAll("models");


    
    l0v = new E3D_entity_vector("light0vect", true, 2.0, true);
    l0v.position = vec3.fromValues(-5, 20, -5);
    l0v.scale = vec3.fromValues(5, 5, 5);
    l0v.visible = true;
    l0v.resetMatrix();
    l0v = scn.addEntity(l0v);
    
    l1v = new E3D_entity_vector("light1vect", true, 2.0, true);
    l1v.position = vec3.fromValues(5, 20, 5);
    l1v.scale = vec3.fromValues(5, 5, 5);
    l1v.visible = true;
    l1v.resetMatrix();
    l1v = scn.addEntity(l1v);

    timer.run();
    scn.state = E3D_ACTIVE;
}


function prepRender() {
    // move camera per inputs
    scn.camera.move(inputs.px_smth, -inputs.py_smth, inputs.pz_smth, inputs.ry_smth, inputs.rx_smth, 0);

    // update some entities per current lights direction
    if (scn.entities.length >= 3) {
        scn.entities[l0v].updateVector(scn.lights.light0_adjusted);
        scn.entities[l1v].updateVector(scn.lights.light1_adjusted);
    }


}

function timerTick() {  // Game Loop

    inputs.processInputs(timer.delta);
    updateStatus();

    if (scn.state == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }
}


function onRessource(name, msg) {
    if (msg == E3D_RES_FAIL) {
        log("Failed to load ressource: " + name, false);        
    }
    if (msg == E3D_RES_ALL) {
        log("All async ressources loaded for tag: " + name, true);          
    }

    if (msg == E3D_RES_LOAD) {
        log("Async ressource loaded: " + name, true); 

        if (resMngr.getRessourceType(name) == "Model") {
            if (name == "ST") {
                let nm = loadModel_RAW(resMngr.getData(name), name, resMngr.getRessourcePath(name), 2, vec3.fromValues(1,1,1));
                scn.addEntity(nm);  
                nm.position[2] = -120;
                nm.resetMatrix();
                if (!cloned) cloneWar();
            } else {
                let nm = loadModel_RAW(resMngr.getData(name), name, resMngr.getRessourcePath(name), 0, "sweep");
                scn.addEntity(nm);  
            }

        }  


    } // msg loaded
}


function cloneWar() {
    for (let j = 1; j < 36; ++j) {
        var newGuy = scn.cloneStaticEntity("ST", "ST" + j);
        scn.entities[newGuy].rotation[1] = j * 10 * DegToRad;
        scn.entities[newGuy].position[2] = -120;
        vec3.rotateY(scn.entities[newGuy].position, scn.entities[newGuy].position, vec3_origin, j * 10 * DegToRad );
        scn.entities[newGuy].resetMatrix();
        scn.entities[newGuy].visible = true;
    }
    cloned = true;
}

// data, name, file, smoothShading (epsillon limit), color(sweep / vec3 )
function loadModel_RAW(rawModelData, name, file, smoothShading, color) {

    let mp = new E3D_entity(name, file, false);

    log("Creating entity " + name, false);

    let numFloats = 0;

    var colorSweep;
    if (color === "sweep") {
        colorSweep = [
            1.0, 0.5, 0.5,
            0.5, 1.0, 0.5,
            0.5, 0.5, 1.0
        ];
    } else {
        colorSweep = [
            color[0], color[1], color[2],
            color[0], color[1], color[2],
            color[0], color[1], color[2]
        ];   
    }


    let colors = [];
    let positions = [];
    let normals = [];


    log("Parsing Response Text", true);

    var data = rawModelData.split("\n"); // remove empty and text lines
    rawModelData = [];
    for (var i = 0; i < data.length; i++) {
        if ((data[i] != "") && (data[i].split(" ").length != 1)) {
            rawModelData.push(data[i]);
        }
    }

    // parse locations
    for (var i = 0; i < rawModelData.length; i++) {
        var chunk = rawModelData[i].split(" ");
        for (var j = 0; j < chunk.length; j++) {
            var n = chunk[j].trim();
            if (n != "") {
                positions.push(Number(chunk[j].trim()));
                colors.push(colorSweep[numFloats % 9]);
                numFloats++;
            }
        }
    }

    // create face normals
    for (var i = 0; i < numFloats / 9; i++) { // for each face
        var v1 = vec3.fromValues(positions[i * 9], positions[(i * 9) + 1], positions[(i * 9) + 2]);
        var v2 = vec3.fromValues(positions[(i * 9) + 3], positions[(i * 9) + 4], positions[(i * 9) + 5]);
        var v3 = vec3.fromValues(positions[(i * 9) + 6], positions[(i * 9) + 7], positions[(i * 9) + 8]);

        v2 = vec3.subtract(v2, v2, v1);
        v3 = vec3.subtract(v3, v3, v1);

        var newNormal = vec3.create();

        vec3.cross(newNormal, v3, v2);

        vec3.normalize(newNormal, newNormal);

        normals.push(newNormal[0]); // flat shading
        normals.push(newNormal[1]); 
        normals.push(newNormal[2]); 

        normals.push(newNormal[0]); // flat shading
        normals.push(newNormal[1]); 
        normals.push(newNormal[2]); 

        normals.push(newNormal[0]); // flat shading
        normals.push(newNormal[1]); 
        normals.push(newNormal[2]); 

    }

    if (smoothShading > 0.0) {
        log("Smooth Shading Normals", true);
        // group vertex by locality (list of unique location)
        // average normals per locality
        // if diff < smoothShading normal is average
        // else keep flat normal
        // expand back
        let numVert =  (numFloats / 3);
        log("numVert: " + numVert, true);
        var uniqueVertex = [];
        var indices = [numVert];

        for (var i = 0; i < numVert; ++i) {
            var unique = true;
            var curVert = [positions[i*3], positions[(i*3)+1], positions[(i*3)+2] ];
            for (var j = 0; j < uniqueVertex.length; ++j) {
                if ((unique) && (vec3.equals(uniqueVertex[j], curVert))) {
                    unique = false;
                    indices[i] = j;
                }
            }
            if (unique) { 
                uniqueVertex.push(vec3.clone(curVert));
                indices[i] = uniqueVertex.length-1;
            } 
        }

        log("unique Vert: " + uniqueVertex.length, true);

        var avgNorms = [uniqueVertex.length];
        // for all unique, average normals
        //
        for (var i = 0; i < uniqueVertex.length; ++i) { // i index in uniqueVertex and avgNorms
            avgNorms[i] = vec3.create();

            for (var j = 0; j < indices.length; ++j) {// j index in indices and normals*3 
                if (indices[j] == i) {
                    var curNorm = [normals[j*3], normals[(j*3)+1], normals[(j*3)+2] ];
                    vec3.add(avgNorms[i] , avgNorms[i], curNorm);
                }
            }

            vec3.normalize(avgNorms[i], avgNorms[i]);
        }

        log("Smoothing...", true);

        for (var i = 0; i < uniqueVertex.length; ++i) { // i index in uniqueVertex and avgNorms

            for (var j = 0; j < indices.length; ++j) {// j index in indices and normals*3 
                if (indices[j] == i) {
                    var curNorm = [normals[j*3], normals[(j*3)+1], normals[(j*3)+2] ];

                    if (vec3.angle(avgNorms[i], curNorm) < smoothShading) {
                        normals[j*3] = avgNorms[i][0];
                        normals[(j*3)+1] = avgNorms[i][1];
                        normals[(j*3)+2] = avgNorms[i][2];
                    }
                }
            }


        }


        for (var i = 0; i < numVert; ++i) {
            var unique = true;
            var curVert = [positions[i*3], positions[(i*3)+1], positions[(i*3)+2] ];
            for (var j = 0; j < uniqueVertex.length; ++j) {
                if ((unique) && (vec3.equals(uniqueVertex[j], curVert))) unique = false;
            }
            if (unique) uniqueVertex.push(vec3.clone(curVert));
        }


    }

    log("Loaded " + numFloats + " float locations", true);
    log((numFloats / 3) + " vertices", true);
    log((numFloats / 9) + " triangles", false);

    mp.vertexArray = new Float32Array(positions);
    mp.colorArray = new Float32Array(colors);
    mp.normalArray = new Float32Array(normals);

    mp.numElements = numFloats / 3;
    mp.visible = true;

    mp.resetMatrix();

    return mp;
}



// Logging and status information


function log(text, silent = true) {
    let ts = 0;
    try {
        ts = Date.now() - timer.start;
    } catch (e) {
        // timer was not yet defined
    } 

    console.log("E3D[" + ts + "] " + text);
    if (!silent) {
        logElement.innerHTML += "[" + ts + "] " + text + "<br />";
    }
}

function updateStatus() {
    usepct_smth = timer.smooth(usepct_smth, timer.usage, 3);
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + "pY:" + Math.floor(scn.camera.position[1]) + "pZ:" + Math.floor(scn.camera.position[2])+ "rX: " + Math.floor(inputs.ry_sum * RadToDeg) + " rY:"+ Math.floor(inputs.ry_sum * RadToDeg) + "<br />" +
    " delta:" + timer.delta + "s usage:" + Math.floor(usepct_smth) + "% nElements: " + scn.drawnElemenets;
}



});