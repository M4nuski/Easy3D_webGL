document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");



"use strict"



// global config


const _fieldOfView = 45 * DegToRad;
const _zNear = 0.1;
const _zFar = 200.0;


// global state var


//Scene


let timer; // E3D_timing class
var winWidth = 10, winHeight = 10;
var gl, programInfo;




log("Get DOM Elements");
const can = document.getElementById("GLCanvas");
const logElement = document.getElementById("logDiv");
const status = document.getElementById("statusDiv");
const inputForm = document.getElementById("inputTable");

log("Set DOM Events");
can.addEventListener("resize", winResize);
document.forms["moveTypeForm"].addEventListener("change", prepView);


// Inputs from virtual devices / UI
inputForm.addEventListener("mousedown", formMouseDown);
inputForm.addEventListener("mouseup", formMouseUp);
inputForm.addEventListener("mouseleave", formMouseUp);
inputForm.addEventListener("dblclick", formMouseDblClick);

inputForm.addEventListener("touchstart", formTouchStart);
inputForm.addEventListener("touchend", formTouchEnd);
inputForm.addEventListener("touchcancel", formTouchEnd);



var inputs = new E3D_input(can, true, true, true, true);


function updateStatus() {
    status.innerHTML = "pX:" + Math.floor(scn.camera.position[0]) + "pY:" + Math.floor(scn.camera.position[1]) + "pZ:" + Math.floor(scn.camera.position[2])+ "<br />"+
    "rX: " + Math.floor(inputs.sumRY * RadToDeg) + " rY:"+ Math.floor(inputs.sumRX * RadToDeg) + " delta:" + timer.delta + "s " + timer.usage + "%";
}

function winResize() {
    winWidth = gl.canvas.clientWidth
    winHeight = gl.canvas.clientHeight;
    
    prepView();
}

function timerTick() {  // game loop
    inputs.processInputs(timer);
    updateStatus();
    drawScene(gl, programInfo);
}





// UI virtual device inputs // TODO create class
function injectKey(fct, event) {
    const newKey = (event.target.innerHTML).toLowerCase();
    if (newKey != "") {
        if (newKey == "space") {
            fct({ key: " " });
        } else if (newKey.length == 1) {
            fct({ key: (newKey) });
        }
    }
}

function formMouseDown(event) {
    injectKey((e) => inputs.keyDown(e) , event);
    event.preventDefault();
}

function formMouseUp(event) {
    injectKey((e) => inputs.keyUp(e), event);
}

function formMouseDblClick(event) {
    event.preventDefault();
}
function formTouchStart(event) {
    injectKey((e) => inputs.keyDown(e), event);
    event.preventDefault();
}
function formTouchEnd(event) {
    injectKey((e) => inputs.keyUp(e), event);
}





// async file loader
function reqListener() {
    log("Parsing Response Text", false);
    var data = this.responseText.split("\n");
    let rawModelData = [];
    for (var i = 0; i < data.length; i++) {
        if ((data[i] != "") && (data[i].split(" ").length != 1)) {
            rawModelData.push(data[i]);
        }
    }
    initBuffers(gl, rawModelData);

    sceneStatus = E3D_ACTIVE;

}

function getModel() {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);
    oReq.open("GET", "AXIS.raw");//CM ST.raw");
    log("Loading Model Async", false);
    oReq.send();
}







function prepView() {
    let vmode = document.forms["moveTypeForm"].moveType.value; 
    if (vmode == "model") {
        scn.camera = new E3D_camera_model("cam1m", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    } 
    else  if (vmode == "free") {
        scn.camera = new E3D_camera_persp("cam1f", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    } else {
        scn.camera = new E3D_camera("cam1o", winWidth, winHeight);
        scn.camera.resize(winWidth, winHeight);
        scn.camera.updateInternal();
    }

}


timer = new E3D_timing(true, 25, timerTick);
var scn; 
log("Session Start", true);


main();

function main() {
    log("Context Initialization", false);
    // Initialize the GL context
    gl = can.getContext("webgl");

    // Only continue if WebGL is available and working
    if (!gl) {
        log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
        timer.pause();
        return;
    }

    log("Scene Creation", false);
    scn = new E3D_scene("mainScene", gl, winWidth, winHeight);

    log("Shader Program Initialization", false);
    scn.program = new E3D_program("mainProgram", gl);
    scn.program .compile(vertShader01, fragShader00);
    scn.program .bindLocations(attribList01, uniformList01);

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

    scn.preRenderFunction = setView;

    scn.status = E3D_ACTIVE;
    
    getModel();    

}

function setView() {

    scn.camera.move(inputs.tadx, -inputs.tady, inputs.tadz, inputs.tary, inputs.tarx, 0);

    if (scn.lights.light0_lockToCamera) {
        scn.lights.light0_adjusted = scn.camera.adjustToCamera(scn.lights.light0_direction);
    }
    if (scn.lights.light1_lockToCamera) {
        scn.lights.light1_adjusted = scn.camera.adjustToCamera(scn.lights.light1_direction);
    }

    if (scn.entities.length == 3) {
        scn.entities[1].updateVector(scn.lights.light0_adjusted);
        scn.entities[2].updateVector(scn.lights.light1_adjusted);
    }

}




function drawScene(gl) {

    if (scn.status == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }
}


function initBuffers(gl, rawModelData) {

    scn.entities.push( new E3D_entity("map", "", false) );

    log("Creating buffers");

    let numFloats = 0;

    const colorSweep = [
        1.0, 0.5, 0.5,
        0.5, 1.0, 0.5,
        0.5, 0.5, 1.0
    ];
    let colors = [];
    let positions = [];
    let normals = [];


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

    log("Loaded " + numFloats + " float locations", true);
    log((numFloats / 3) + " vertices", true);
    log((numFloats / 9) + " triangles", false);

    scn.entities[0].vertexArray = new Float32Array(positions);
    scn.entities[0].vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, scn.entities[0].vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, scn.entities[0].vertexArray, gl.STATIC_DRAW);

    scn.entities[0].colorArray = new Float32Array(colors);
    scn.entities[0].colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, scn.entities[0].colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, scn.entities[0].colorArray, gl.STATIC_DRAW);
    
    scn.entities[0].normalArray = new Float32Array(normals);
    scn.entities[0].normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, scn.entities[0].normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, scn.entities[0].normalArray, gl.STATIC_DRAW);

    scn.entities[0].numElements = numFloats / 3;

    scn.entities[0].visible = true;


    scn.entities.push( new E3D_entity_vector("light1vect", true, 2.0, true) );
    scn.entities[1].position = vec3.fromValues(-5, 20, -5);
    scn.entities[1].scale = vec3.fromValues(5, 5, 5);
    scn.entities[1].visible = true;
    scn.entities[1].resetMatrix();

    scn.entities[1].vertexBuffer = gl.createBuffer(); //todo move to scene with context
    scn.entities[1].colorBuffer = gl.createBuffer();
    scn.entities[1].normalBuffer = gl.createBuffer();


    scn.entities.push( new E3D_entity_vector("light1vect", true, 2.0, true) );
    scn.entities[2].position = vec3.fromValues(5, 20, 5);
    scn.entities[2].scale = vec3.fromValues(5, 5, 5);
    scn.entities[2].visible = true;
    scn.entities[2].resetMatrix();

    scn.entities[2].vertexBuffer = gl.createBuffer(); //todo move to scene with context
    scn.entities[2].colorBuffer = gl.createBuffer();
    scn.entities[2].normalBuffer = gl.createBuffer();


}



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


});