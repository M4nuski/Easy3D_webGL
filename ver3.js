document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");



"use strict"



// global config


const _fieldOfView = 45 * DegToRad;
const _zNear = 0.1;
const _zFar = 200.0;


// global state var


//Scene

var sceneStatus = E3D_CREATED;
let timer; // E3D_timing class
var winWidth = 10, winHeight = 10;
var gl, programInfo, cam;
var entities = []; // of E3D_entity



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
    status.innerHTML = "pX:" + Math.floor(cam.position[0]) + "pY:" + Math.floor(cam.position[1]) + "pZ:" + Math.floor(cam.position[2])+ "<br />"+
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
        cam = new E3D_camera_model("cam1m", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    } 
    else  if (vmode == "free") {
        cam = new E3D_camera_persp("cam1f", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    } else {
        cam = new E3D_camera("cam1o", winWidth, winHeight);
        cam.resize(winWidth, winHeight);
        cam.updateInternal();
    }

}

var shdr;
timer = new E3D_timing(true, 25, timerTick);


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

    log("Shader Program Initialization", false);

    shdr = new E3D_program("mainProgram", gl);
    shdr.compile(vertShader01, fragShader00);
    shdr.bindLocations(attribList01, uniformList01);

    lights = new E3D_lighting(vec3.fromValues(0.0, 0.0, 0.15));

    lights.setColor0(vec3.fromValues(1.0, 1.0, 1.0));
    lights.setDirection0(vec3.fromValues(-0.2, -0.2, -1.0)); 
    lights.light0_lockToCamera = true;

    lights.setColor1(vec3.fromValues(1.0, 1.0, 0.85));
    lights.setDirection1(vec3.fromValues(1.0, -1.0, 0.8));
    lights.light1_lockToCamera = false;

    gl.clearColor(0.0, 0.0, 0.2, 1.0);
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.cullFace(gl.BACK);
    gl.enable(gl.CULL_FACE);

    winResize();

    getModel();

}

function setView() {
    /*
    sumRX += rx;
    sumRY += ry;  
    
    // some clamping and warping        
    if (sumRY < -PIdiv2) { sumRY = -PIdiv2; }
    if (sumRY >  PIdiv2) { sumRY =  PIdiv2; }

    if (sumRX < 0) { 
        sumRX += PIx2;
        tarx += PIx2;
     }
    if (sumRX > PIx2) { 
        sumRX -= PIx2; 
        tarx -= PIx2; 
    }

    // smooth controls
    tarx = timer.smooth(tarx, sumRX, _smooth);
    tary = timer.smooth(tary, sumRY, _smooth);

    tadx = timer.smooth(tadx, dx, _smooth);
    tady = timer.smooth(tady, dy, _smooth);
    tadz = timer.smooth(tadz, dz, _smooth);*/

    cam.move(inputs.tadx, -inputs.tady, inputs.tadz, inputs.tary, inputs.tarx, 0);

    if (lights.light0_lockToCamera) {
        lights.light0_adjusted = cam.adjustToCamera(lights.light0_direction);
    }
    if (lights.light1_lockToCamera) {
        lights.light1_adjusted = cam.adjustToCamera(lights.light1_direction);
    }

   entities[1].updateVector(lights.light0_adjusted);
   entities[2].updateVector(lights.light1_adjusted);

}


function bind3FloatBuffer(location, buffer) { //TODO in scene
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}

function bindAndUpdate3FloatBuffer(location, buffer, data) { // TODO in scene
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}

function drawScene(gl) {

    if (sceneStatus == E3D_ACTIVE) {

        setView();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // todo move to scene properties

        gl.useProgram(shdr.shaderProgram);

        gl.uniformMatrix4fv(shdr.shaderUniforms["uProjectionMatrix"], false, cam.getViewMatrix());     

        gl.uniform3fv(shdr.shaderUniforms["uLightA_Color"], lights.ambiant_color);

        gl.uniform3fv(shdr.shaderUniforms["uLight0_Color"], lights.light0_color);
        gl.uniform3fv(shdr.shaderUniforms["uLight0_Direction"], lights.light0_adjusted);

        gl.uniform3fv(shdr.shaderUniforms["uLight1_Color"], lights.light1_color);
        gl.uniform3fv(shdr.shaderUniforms["uLight1_Direction"], lights.light1_adjusted);




        for (let i = 0; i < entities.length; ++i) {
            if ((entities[i].visible) && (entities[i].numElements > 0)) {

                // Entity Attributes
                if (entities[i].dynamic) {
                    bindAndUpdate3FloatBuffer(shdr.shaderAttributes["aVertexPosition"], entities[i].vertexBuffer, entities[i].vertexArray);
                    bindAndUpdate3FloatBuffer(shdr.shaderAttributes["aVertexNormal"], entities[i].normalBuffer, entities[i].normalArray);    
                    bindAndUpdate3FloatBuffer(shdr.shaderAttributes["aVertexColor"], entities[i].colorBuffer, entities[i].colorArray);  
                } else {
                    bind3FloatBuffer(shdr.shaderAttributes["aVertexPosition"], entities[i].vertexBuffer);  
                    bind3FloatBuffer(shdr.shaderAttributes["aVertexNormal"], entities[i].normalBuffer);    
                    bind3FloatBuffer(shdr.shaderAttributes["aVertexColor"], entities[i].colorBuffer);
                }
                // Entity Uniforms
                gl.uniformMatrix4fv(shdr.shaderUniforms["uModelMatrix"], false, entities[i].modelMatrix);
                gl.uniformMatrix4fv(shdr.shaderUniforms["uNormalMatrix"], false, entities[i].normalMatrix);
                
                // Draw
                gl.drawArrays(entities[i].drawMode, 0, entities[i].numElements);
            }
        }


    }
}


function initBuffers(gl, rawModelData) {

    entities.push( new E3D_entity("map", "", false) );

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

    entities[0].vertexArray = new Float32Array(positions);
    entities[0].vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[0].vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[0].vertexArray, gl.STATIC_DRAW);

    entities[0].colorArray = new Float32Array(colors);
    entities[0].colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[0].colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[0].colorArray, gl.STATIC_DRAW);
    
    entities[0].normalArray = new Float32Array(normals);
    entities[0].normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[0].normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[0].normalArray, gl.STATIC_DRAW);

    entities[0].numElements = numFloats / 3;

    entities[0].visible = true;


    entities.push( new E3D_entity_vector("light1vect", true, 2.0, true) );
    entities[1].position = vec3.fromValues(-5, 20, -5);
    entities[1].scale = vec3.fromValues(5, 5, 5);
    entities[1].visible = true;
    entities[1].resetMatrix();

    entities[1].vertexBuffer = gl.createBuffer(); //todo move to scene with context
    entities[1].colorBuffer = gl.createBuffer();
    entities[1].normalBuffer = gl.createBuffer();


    entities.push( new E3D_entity_vector("light1vect", true, 2.0, true) );
    entities[2].position = vec3.fromValues(5, 20, 5);
    entities[2].scale = vec3.fromValues(5, 5, 5);
    entities[2].visible = true;
    entities[2].resetMatrix();

    entities[2].vertexBuffer = gl.createBuffer(); //todo move to scene with context
    entities[2].colorBuffer = gl.createBuffer();
    entities[2].normalBuffer = gl.createBuffer();


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