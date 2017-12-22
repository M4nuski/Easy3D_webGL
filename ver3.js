document.addEventListener("DOMContentLoaded", function () {



"use strict"

const _PId2 = Math.PI / 2;
const _PIx2 = Math.PI * 2;

// global config
const _pinchHysteresis = 10;
const _rotateMouseButton = 0;
const _panMouseButton = 1;

const _fieldOfView = 45 * Math.PI / 180; // 45deg in radians
const _zNear = 0.1;
const _zFar = 100.0;

const _moveSpeed = 50; // units per sec
const _rotateSpeed = 3.14; // rad per sec

const _mouseXFactor = 0.0025;
const _mouseYFactor = 0.0025;
const _mouseZFactor = 0.001;

const _keyUP = " ";
const _keyDN = "c";
const _keyLT = "a";
const _keyRT = "d";
const _keyFD = "w";
const _keyBD = "s";

const _smooth = 0.01;

let timer; // E3D_timing class

var sceneStatus = E3D_CREATED;

// global state var



//for input model
var panning = false;
var rotating = false;

var mx, pinx, dx = 0, rx = 0, sumRX = 0;
var my, piny, dy = 0, ry = 0, sumRY = 0;
var dz = 0;
var tadx = dx, tady =dy, tadz = dz, tarx = sumRX, tary = sumRY;

var touchDist = 0;
var ongoingTouches = [];

var inputTable = {};



var winWidth = 10, winHeight = 10;
var projectionMatrix = mat4.create();
var viewMatrix = mat4.clone(projectionMatrix);

var light_direction = vec3.fromValues(-1.0, -1.0, -1.0);
vec3.normalize(light_direction, light_direction);
var _light0 = vec3.clone(light_direction);

var current_pos = vec3.fromValues(0, 0, -16.0);
var current_rot = mat4.create();


var gl, programInfo, cam;


var entities = []; // of E3D_entity


// elements
const can = document.getElementById("GLCanvas");
const log = document.getElementById("logDiv");
const status = document.getElementById("statusDiv");

const inputForm = document.getElementById("inputTable");

// events
can.addEventListener("mousedown", mouseDown);
can.addEventListener("mouseup", mouseUp);
can.addEventListener("mousemove", mouseMove);
can.addEventListener("mouseleave", mouseLeave);
can.addEventListener("wheel", mouseWheel);
can.addEventListener("dblclick", mouseDblClick);
if (pLockSupported) { pLockMoveEvent = mouseLockedMove };

can.addEventListener("touchstart", touchStart);
can.addEventListener("touchend", touchEnd);
can.addEventListener("touchcancel", touchCancel);
can.addEventListener("touchmove", touchMove);

can.addEventListener("resize", winResize);

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

inputForm.addEventListener("mousedown", formMouseDown);
inputForm.addEventListener("mouseup", formMouseUp);
inputForm.addEventListener("mouseleave", formMouseUp);

inputForm.addEventListener("dblclick", formMouseDblClick);

inputForm.addEventListener("touchstart", formTouchStart);
inputForm.addEventListener("touchend", formTouchEnd);
inputForm.addEventListener("touchcancel", formTouchEnd);

document.forms["moveTypeForm"].addEventListener("change", prepView);

function updateStatus() {
    status.innerHTML = "pX:" + Math.floor(cam.position[0]) + "pY:" + Math.floor(cam.position[1]) + "pZ:" + Math.floor(cam.position[2])+ "<br />"+
    "rX: " + Math.floor(sumRY * 57.3) + " rY:"+ Math.floor(sumRX * 57.3) + " delta:" + timer.delta + "s";
}

function winResize() {
    winWidth = gl.canvas.clientWidth
    winHeight = gl.canvas.clientHeight;

    prepView();
}

function timerTick(){  
    processKeyInputs();
    updateStatus();
    drawScene(gl, programInfo);
}


function keyDown(event) {
    inputTable[event.key] = true;

    if ((pLockActive) && (event.key == "Escape")) {
        pLockExit();
    }
}

function keyUp(event) {

    if (inputTable[event.key] != undefined) {
        inputTable[event.key] = false;
    }

}

function processKeyInputs() {
    if (inputTable[_keyUP]) {
        dy += _moveSpeed * timer.delta;
    }
    if (inputTable[_keyDN]) {
        dy -= _moveSpeed * timer.delta;
    }
    if (inputTable[_keyLT]) {
        dx += _moveSpeed * timer.delta;
    }
    if (inputTable[_keyRT]) {
        dx -= _moveSpeed * timer.delta;
    }
    if (inputTable[_keyFD]) {
        dz += _moveSpeed * timer.delta;
    }
    if (inputTable[_keyBD]) {
        dz -= _moveSpeed * timer.delta;
    }

}

function mouseDown(event) {

    pinx = event.pageX; // store relative ref
    piny = event.pageY;

    if (event.button == _panMouseButton) {
        panning = true;
    }
    if (event.button == _rotateMouseButton) {
        rotating = true;
    }

    if (event.preventDefault) { event.preventDefault(); };
}

function mouseUp(event) {

    if (event.button == _panMouseButton) {
        panning = false;
    }
    if (event.button == _rotateMouseButton) {
        rotating = false;
    }

}

function mouseLeave(event) {
    panning = false;
    rotating = false;
}

function mouseMove(event) {

    mx = event.pageX;
    my = event.pageY;
    
    if (panning) {
        dx += (mx - pinx) * _mouseXFactor * _moveSpeed;
        dy += (my - piny) * _mouseYFactor * _moveSpeed;
    }
    
    if (rotating) {
        rx += (mx - pinx) * _mouseXFactor * _rotateSpeed;
        ry += (my - piny) * _mouseYFactor * _rotateSpeed;
    }
    
    pinx = mx;
    piny = my;

}

function mouseLockedMove(x, y) {
    // de facto rotating
    if (pLockActive) {
        rx += x * _mouseXFactor * _rotateSpeed;
        ry += y * _mouseYFactor * _rotateSpeed;
        addLine( x + " " + y);
        }
}

function mouseWheel(event) {

    if (event.deltaY != 0) {
        dz += event.deltaY * _mouseZFactor * _moveSpeed;
    }

    if (event.preventDefault) { event.preventDefault(); };
}

function mouseDblClick(event) {
    if (pLockSupported) {
        pLockRequest(can);
    }
    if (event.preventDefault) { event.preventDefault(); };
}


function touchStart(event) {

    event.preventDefault(); // to revise
    var touches = event.changedTouches;

    for (var i = 0; i < touches.length; i++) {

        ongoingTouches.push(copyTouch(touches[i]));
    }

    if (ongoingTouches.length == 1) {
        //process as mouse down
        ongoingTouches[0].button = _rotateMouseButton;
        mouseDown(ongoingTouches[0]);

    } else if (ongoingTouches.length == 2) {
        //process as mouse up and then wheel / pan

        ongoingTouches[0].button = _rotateMouseButton;
        mouseUp(ongoingTouches[0]);

        ongoingTouches[0].button = _panMouseButton;

        mouseDown( touchToButton( (ongoingTouches[0].pageX + ongoingTouches[1].pageX) / 2,
                                  (ongoingTouches[0].pageY + ongoingTouches[1].pageY) / 2,
                                    _panMouseButton) );

        var tdx = ongoingTouches[1].pageX - ongoingTouches[0].pageX;
        var tdy = ongoingTouches[1].pageY - ongoingTouches[0].pageY;

        touchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));
    }
}


function touchEnd(event) {

    event.preventDefault();
    var touches = event.changedTouches;

    if (ongoingTouches.length == 1) {
        ongoingTouches[0].button = _rotateMouseButton;
        mouseUp(ongoingTouches[0]);
    }

    if (ongoingTouches.length == 2) {
        ongoingTouches[0].button = _panMouseButton;
        mouseUp(ongoingTouches[0]);
    }

    for (var i = 0; i < touches.length; i++) {
        var idx = ongoingTouchIndexById(touches[i].identifier);
        if (idx >= 0) {
            ongoingTouches.splice(idx, 1);
        } 
    }
}
function touchCancel(event) {

    event.preventDefault();

    if (ongoingTouches.length == 1) {
        ongoingTouches[0].button = _rotateMouseButton;
        mouseUp(ongoingTouches[0]);
    }

    if (ongoingTouches.length == 2) {
        ongoingTouches[0].button = _panMouseButton;
        mouseUp(ongoingTouches[0]);
    }

    var touches = event.changedTouches;

    for (var i = 0; i < touches.length; i++) {
        var idx = ongoingTouchIndexById(touches[i].identifier);
        ongoingTouches.splice(idx, 1);
    }
}

function touchMove(event) {

    event.preventDefault();
    var touches = event.changedTouches;

    for (var i = 0; i < touches.length; i++) {
        var idx = ongoingTouchIndexById(touches[i].identifier);
        if (idx >= 0) {
            ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        }
    }


    if (ongoingTouches.length == 1) {
        ongoingTouches[0].button = _rotateMouseButton;
        mouseMove(ongoingTouches[0]);

    } else if (ongoingTouches.length == 2) {

        var tdx = ongoingTouches[1].pageX - ongoingTouches[0].pageX;
        var tdy = ongoingTouches[1].pageY - ongoingTouches[0].pageY;
        var newTouchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));

        // pinch panning
        ongoingTouches[0].button = _panMouseButton;
        mouseMove( touchToButton( (ongoingTouches[0].pageX + ongoingTouches[1].pageX) / 2,
                                    (ongoingTouches[0].pageY + ongoingTouches[1].pageY) / 2,
                                    _panMouseButton) );

         if (Math.abs(touchDist - newTouchDist) > _pinchHysteresis) {        
            // mouse wheel zoom
            var delta = (touchDist - newTouchDist) / Math.abs(touchDist - newTouchDist) * _pinchHysteresis;
            mouseWheel({ deltaY: -5*((touchDist - newTouchDist) - delta) });
            touchDist = newTouchDist;
        }

    } // 2 touches

}

function touchToButton(x, y, btn) {
    return { pageX: x, pageY: y, button: btn } ;
}

function copyTouch(touch) {
    return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, button: _rotateMouseButton };
}

function ongoingTouchIndexById(idToFind) {
    for (var i = 0; i < ongoingTouches.length; i++) {
        var id = ongoingTouches[i].identifier;

        if (id == idToFind) {
            return i;
        }
    }
    return -1;    // not found
}

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
    injectKey(keyDown, event);
    event.preventDefault();
}

function formMouseUp(event) {
    injectKey(keyUp, event);
}

function formMouseDblClick(event) {
    event.preventDefault();
}
function formTouchStart(event) {
    injectKey(keyDown, event);
    event.preventDefault();
}
function formTouchEnd(event) {
    injectKey(keyUp, event);
}


function reqListener() {
    addLine("Parsing Response Text");
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
    addLine("Loading Model Async");
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

const vsSource = `
//from model
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uModelNormalMatrix;

//from scene
uniform mat4 uProjectionMatrix;
uniform vec3 uLight;

//output to fragment shader
varying lowp vec4 vColor;
//varying lowp vec4 vNormal;  

void main(void) {
    vec4 buf_normal;
    float fact_diffuse;

    buf_normal = normalize(uModelNormalMatrix * vec4(aVertexNormal, 1.0));	
    fact_diffuse = max(dot(buf_normal.xyz, uLight), 0.0);

    // outputs
    vColor = vec4(0.2,0.2,0.2,1.0) + (aVertexColor * fact_diffuse * 0.8);
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    //vNormal = aVertexNormal;
}
`;


const fsSource = `
varying lowp vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}
`;

timer = new E3D_timing(true, 25, timerTick);
addLine("Session Start");

main();

function main() {
    addLine("Context Initialization");
    // Initialize the GL context
    gl = can.getContext("webgl");

    // Only continue if WebGL is available and working
    if (!gl) {
        addLine("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    addLine("Shader Program Initialization");

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            vertexNormal:  gl.getAttribLocation(shaderProgram, 'aVertexNormal')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            modelNormalMatrix: gl.getUniformLocation(shaderProgram, 'uModelNormalMatrix'),
            light:  gl.getUniformLocation(shaderProgram, 'uLight')
        },
    };


    gl.clearColor(0.0, 0.0, 0.2, 1.0);
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.cullFace(gl.BACK);
    gl.enable(gl.CULL_FACE);

    winResize();

    //prepView();

    getModel();

}

function setView() {
    const origin = [0, 0, 0];

    sumRX += rx;
    sumRY += ry;  
    
    // some clamping and warping        
    if (sumRY < -_PId2) { sumRY = -_PId2; }
    if (sumRY >  _PId2) { sumRY =  _PId2; }

    if (sumRX < 0) { 
        sumRX += _PIx2;
        tarx += _PIx2;
     }
    if (sumRX > _PIx2) { 
        sumRX -= _PIx2; 
        tarx -= _PIx2; 
    }

    // smooth controls
    tarx = timer.smooth(tarx, sumRX, _smooth);
    tary = timer.smooth(tary, sumRY, _smooth);

    tadx = timer.smooth(tadx, dx, _smooth);
    tady = timer.smooth(tady, dy, _smooth);
    tadz = timer.smooth(tadz, dz, _smooth);

    cam.move(tadx, -tady, tadz, tary, tarx, 0);

    if (cam.id == "cam1m") { // rotate around object
        light_direction = cam.adjustToCamera(_light0);
    } 

    // clean up state changes
    dx = 0; dy = 0; dz = 0;
    rx = 0; ry = 0;
}


function bind3FloatBufferToLocation(buffer, location) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}

function drawScene(gl, programInfo) {

    if (sceneStatus == E3D_ACTIVE) {

        setView();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // todo move to scene properties

        // scence uniforms
        gl.useProgram(programInfo.program);       
        gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, cam.getViewMatrix());        
        gl.uniform3fv(programInfo.uniformLocations.light, light_direction);

        for (let i = 0; i < entities.length; ++i) {
            if ((entities[i].visible) && (entities[i].numElements > 0)) {

                // Entity Attributes
                bind3FloatBufferToLocation(entities[i].vertexBuffer, programInfo.attribLocations.vertexPosition);
                bind3FloatBufferToLocation(entities[i].normalBuffer, programInfo.attribLocations.vertexNormal)
                bind3FloatBufferToLocation(entities[i].colorBuffer,  programInfo.attribLocations.vertexColor)

                // Entity Uniforms
                gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, entities[i].modelMatrix);
                gl.uniformMatrix4fv(programInfo.uniformLocations.modelNormalMatrix, false, entities[i].normalMatrix);
                
                // Draw
                gl.drawArrays(gl.TRIANGLES, 0, entities[i].numElements);
            }
        }
    }
}


function initBuffers(gl, rawModelData) {

    entities.push( new E3D_entity("map", "") );

    addLine("Creating buffers");

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

    addLine("Loaded " + numFloats + " float locations");
    addLine((numFloats / 3) + " vertices");
    addLine((numFloats / 9) + " triangles");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

    entities[0].vertexBuffer = positionBuffer;
    entities[0].colorBuffer = colorBuffer;
    entities[0].normalBuffer = normalBuffer;
    entities[0].numElements = numFloats / 3;

    entities[0].visible = true;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        addLine('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}
//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
 //   addLine("Creating shader: " + type );
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        addLine('An error occurred compiling the '+ type +' shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function addLine(text) {
    log.innerHTML += "[" + ((new Date()).getTime() - timer.start) + "] " + text + "<br />";
}


});