document.addEventListener("DOMContentLoaded", function () {



"use strict"



// global config
const _pinchHysteresis = 10;
const _rotateMouseButton = 0;
const _panMouseButton = 1;

const _fieldOfView = 45;
const _zNear = 0.1;
const _zFar = 100.0;

const _moveSpeed = 50; // units per sec
const _rotateSpeed = 3.14; // rad per sec

const _mouseXFactor = 0.005;
const _mouseYFactor = 0.005;
const _mouseZFactor = 0.001;

const _keyUP = " ";
const _keyDN = "c";
const _keyLT = "a";
const _keyRT = "d";
const _keyFD = "w";
const _keyBD = "s";



const _tickInterval = 25;

const _timer = setInterval(timerTick, _tickInterval);
var   sceneDelta = _tickInterval / 1000;
var   lastScene = 0;
var sceneStatus = "SCENE_CREATED";
var sessionStart = new Date().getTime();


// global state var



//for input model
var panning = false;
var rotating = false;

var mx, pinx, dx = 0, rx = 0, sumRX = 0;
var my, piny, dy = 0, ry = 0, sumRY = 0;
var dz = 0;

var touchDist = 0;
var ongoingTouches = [];

var inputTable = {};


//var odz = dz, ody = dy, odx = dx;

var winWidth = 10, winHeight = 10;
var projectionMatrix = mat4.create();
var viewMatrix = mat4.clone(projectionMatrix);

var light_direction = vec3.fromValues(-1.0, -1.0, -1.0);
vec3.normalize(light_direction, light_direction);
var _light0 = vec3.clone(light_direction);

var current_pos = vec3.fromValues(0, 0, -16.0);
var current_rot = mat4.create();

var gl, programInfo, buffers;

var rawModelData = [];
var numFloats = 0;




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


function updateStatus() {
    status.innerHTML = "pX:" + Math.floor(current_pos[0]) + "pY:" + Math.floor(current_pos[1]) + "pZ:" + Math.floor(current_pos[2])+ "<br />"+
    "rX: " + Math.floor(sumRY * 57.3) + " rY:"+ Math.floor(sumRX * 57.3) + " delta:" + sceneDelta + "s";
}

function winResize() {
    winWidth = gl.canvas.clientWidth
    winHeight = gl.canvas.clientHeight;

    prepView();
}

function timerTick(){
  
    {
        const ts = (new Date()).getTime(); 
        sceneDelta = (ts - lastScene) / 1000;
        lastScene = ts;
    }
    
    processKeyInputs();

    updateStatus();
    drawScene(gl, programInfo, buffers);
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
        dy += _moveSpeed * sceneDelta;
    }
    if (inputTable[_keyDN]) {
        dy -= _moveSpeed * sceneDelta;
    }
    if (inputTable[_keyLT]) {
        dx += _moveSpeed * sceneDelta;
    }
    if (inputTable[_keyRT]) {
        dx -= _moveSpeed * sceneDelta;
    }
    if (inputTable[_keyFD]) {
        dz += _moveSpeed * sceneDelta;
    }
    if (inputTable[_keyBD]) {
        dz -= _moveSpeed * sceneDelta;
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
    rx += x * _mouseXFactor * _rotateSpeed;
    ry += y * _mouseYFactor * _rotateSpeed;
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
    //    addLine("new touch: " + touches[i].identifier);
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
        } else {
            addLine("can't figure out which touch to end");
        }
    }
}
function touchCancel(event) {

    event.preventDefault();
    addLine("touchcancel.");

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
        } else {
            addLine("can't figure out which touch to continue");
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
    rawModelData = [];
    for (var i = 0; i < data.length; i++) {
        if ((data[i] != "") && (data[i].split(" ").length != 1)) {
            rawModelData.push(data[i]);
        }
    }
    buffers = initBuffers(gl);
    sceneStatus = "SCENE_ACTIVE";
}

function getModel() {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);
    oReq.open("GET", "AXIS.raw");//CM ST.raw");
    addLine("Loading Model Async");
    oReq.send();
}

function prepView() {

    // Projection matrix with current values
    const fieldOfView = _fieldOfView * Math.PI / 180;   // in radians
    const aspect = winWidth / winHeight;
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        _zNear,
        _zFar);

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


    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.cullFace(gl.BACK);
    gl.enable(gl.CULL_FACE);

    winResize();

    prepView();

    getModel();

}

function setView() {
   
    var vmode = document.forms["moveTypeForm"].moveType.value;

    const origin = [0, 0, 0];

    sumRX += rx;
    sumRY += ry;  
    
    if (sumRY < -1.5708) {sumRY = -1.5708;}
    if (sumRY > 1.5708) {sumRY = 1.5708;}

    if (vmode == "model") { // rotate around object

        vec3.add(current_pos, current_pos, [dx, -dy, dz]);
        mat4.translate(viewMatrix, projectionMatrix, current_pos); 

        mat4.rotateY(current_rot, mat4.create(), sumRX);
        mat4.rotateX(current_rot, current_rot, sumRY);
        mat4.multiply(viewMatrix, viewMatrix, current_rot);

        // adjust light direction to follow camera
        vec3.rotateY(light_direction, _light0, origin, -sumRX); 
        vec3.rotateX(light_direction, light_direction, origin, -sumRY); 
        
    } else if (vmode == "free") { // move freely around world             

        mat4.rotateX(current_rot, mat4.create(), sumRY);
        mat4.rotateY(current_rot, current_rot, sumRX);

        mat4.multiply(viewMatrix, projectionMatrix, current_rot);

        const newTranslation = vec3.fromValues(dx , -dy, dz);

        vec3.rotateX(newTranslation, newTranslation, origin, -sumRY);
        vec3.rotateY(newTranslation, newTranslation, origin, -sumRX);

        vec3.add(current_pos, current_pos, newTranslation);
        mat4.translate(viewMatrix, viewMatrix, current_pos ); 
    }


    // clean up state changes
    dx = 0; dy = 0; dz = 0;
    rx = 0; ry = 0;
}


function drawScene(gl, programInfo, buffers) {

    setView();
    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);




if (sceneStatus == "SCENE_ACTIVE") {


    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

   // mat4.translate(modelViewMatrix,     // destination matrix
  //      modelViewMatrix,     // matrix to translate
   //     [dx / 50, -dy / 50, dz]);  // amount to translate

    //mat4.rotate(modelViewMatrix, modelViewMatrix, rx / 100, [0, 1, 0]);
    //mat4.rotate(modelViewMatrix, modelViewMatrix, ry / 100, [1, 0, 0]);

    const modelNormalMatrix = mat4.create();

  //  mat4.rotate(modelNormalMatrix, modelNormalMatrix, rx / 100, [0, 1, 0]);
//    mat4.rotate(modelNormalMatrix, modelNormalMatrix, ry / 100, [1, 0, 0]);




    {
        const numComponents = 3;  // pull out 3 values per iteration
        const type = gl.FLOAT;    // the data in the buffer is 32bit floats
        const normalize = false;  // don't normalize
        const stride = 0;         // how many bytes to get from one set of values to the next
        // 0 = use type and numComponents above
        const offset = 0;         // how many bytes inside the buffer to start from
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the colors from the color buffer
    // into the vertexColor attribute.
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexColor,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexColor);
    }


    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexNormal);
    }





    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        viewMatrix);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelNormalMatrix,
        false,
        modelNormalMatrix);

    gl.uniform3fv(programInfo.uniformLocations.light, light_direction);

    {
        const offset = 0;
        const vertexCount = numFloats / 3;// 4;

        gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }

}

}


function initBuffers(gl) {
    addLine("Creating buffers");


    const colorSweep = [
        1.0, 0.5, 0.5,
        0.5, 1.0, 0.5,
        0.5, 0.5, 1.0
    ];
    var colors = [];
    var positions = [];
    var normals = [];


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



    return {
        position: positionBuffer,
        color: colorBuffer,
        normal: normalBuffer
    };
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
    log.innerHTML += "[" + ((new Date()).getTime() - sessionStart) + "] " + text + "<br />";
}


});