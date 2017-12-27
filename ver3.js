document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");



"use strict"



const _PId2 = Math.PI / 2;
const _PIx2 = Math.PI * 2;

// global config
const _pinchHysteresis = 10;
const _rotateMouseButton = 0;
const _panMouseButton = 1;

const _fieldOfView = 45 * Math.PI / 180; // 45deg in radians
const _zNear = 0.1;
const _zFar = 200.0;

const _moveSpeed = 50; // units per sec
const _rotateSpeed = 3.14; // rad per sec

const _mouseSpeed = 0.0025;
const _mouseWheelSpeed = 0.001;

const _keyUP = " ";
const _keyDN = "c";
const _keyLT = "a";
const _keyRT = "d";
const _keyFD = "w";
const _keyBD = "s";

const _smooth = 0.1;



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


//Scene

var sceneStatus = E3D_CREATED;
let timer; // E3D_timing class
var winWidth = 10, winHeight = 10;
var gl, programInfo, cam;
var entities = []; // of E3D_entity



log("Get DOM Elements");
// elements
const can = document.getElementById("GLCanvas");
const logElement = document.getElementById("logDiv");
const status = document.getElementById("statusDiv");

const inputForm = document.getElementById("inputTable");

log("Set DOM Events");
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

function timerTick(){  // "game" loop
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
        dx += (mx - pinx) * _mouseSpeed * _moveSpeed;
        dy += (my - piny) * _mouseSpeed * _moveSpeed;
    }
    
    if (rotating) {
        rx += (mx - pinx) * _mouseSpeed * _rotateSpeed;
        ry += (my - piny) * _mouseSpeed * _rotateSpeed;
    }
    
    pinx = mx;
    piny = my;

}

function mouseLockedMove(x, y) {
    // de facto rotating
    if (pLockActive) {
        rx += x * _mouseSpeed * _rotateSpeed;
        ry += y * _mouseSpeed * _rotateSpeed;
      //  log( x + " " + y, false);
        }
}

function mouseWheel(event) {

    if (event.deltaY != 0) {
        dz += event.deltaY * _mouseWheelSpeed * _moveSpeed;
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
        else log("(touchEnd) Touch Id not found");
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
        } else log("(touchMove) Touch Id not found");
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
    gl.disable(gl.CULL_FACE);

    winResize();

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

  //  if (cam.id == "cam1m") { // rotate around object
        if (lights.light0_lockToCamera) {
            lights.light0_adjusted = cam.adjustToCamera(lights.light0_direction);
        }
        if (lights.light1_lockToCamera) {
            lights.light1_adjusted = cam.adjustToCamera(lights.light1_direction);
        }
   // } 
   entities[1].vertexArray[21] = lights.light0_adjusted[0];
   entities[1].vertexArray[22] = lights.light0_adjusted[1];
   entities[1].vertexArray[23] = lights.light0_adjusted[2];

   entities[2].vertexArray[21] = lights.light1_adjusted[0];
   entities[2].vertexArray[22] = lights.light1_adjusted[1];
   entities[2].vertexArray[23] = lights.light1_adjusted[2];

    // clean up state changes
    dx = 0; dy = 0; dz = 0;
    rx = 0; ry = 0;
}


function bind3FloatBuffer(location, buffer) { //TODO static in scene
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
}

function bindAndUpdate3FloatBuffer(location, buffer, data) { // TODO static in scene
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(location);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
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

   // entities[0].vertexBuffer = positionBuffer;
  //  entities[0].colorBuffer = colorBuffer;
   // entities[0].normalBuffer = normalBuffer;

    entities[0].numElements = numFloats / 3;

    entities[0].visible = true;



    let posData = [ 0, 0, 0, 1, 0, 0,
                      0, 0, 0, 0, 1, 0,
                      0, 0, 0, 0, 0, 1,
                      0, 0, 0, 1, 1, 1];

    let colData = [1, 0, 0, 1, 0, 0,
                   0, 1, 0, 0, 1, 0,
                   0, 0, 1, 0, 0, 1,
                   1, 1, 1, 1, 1, 1 ];


    entities.push( new E3D_entity("light0vect", "", true) );
    entities[1].position = vec3.fromValues(0, 20, 0);
    entities[1].scale = vec3.fromValues(10, 10, 10);

    entities[1].vertexArray = new Float32Array(posData);
    entities[1].vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[1].vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[1].vertexArray, gl.DYNAMIC_DRAW);

    entities[1].colorArray = new Float32Array(colData);
    entities[1].colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[1].colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[1].colorArray, gl.STATIC_DRAW);
    
    entities[1].normalArray = new Float32Array(24);
    entities[1].normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[1].normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[1].normalArray, gl.STATIC_DRAW);

    entities[1].numElements = 8;
    entities[1].drawMode = gl.LINES;
    entities[1].visible = true;
    entities[1].resetMatrix();





    entities.push( new E3D_entity("light1vect", "", true) );
    entities[2].position = vec3.fromValues(0, 20, 0);
    entities[2].scale = vec3.fromValues(10, 10, 10);

    entities[2].vertexArray = new Float32Array(posData);
    entities[2].vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[2].vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[2].vertexArray, gl.DYNAMIC_DRAW);

    entities[2].colorArray = new Float32Array(colData);
    entities[2].colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[2].colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[2].colorArray, gl.STATIC_DRAW);
    
    entities[2].normalArray = new Float32Array(24);
    entities[2].normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, entities[2].normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, entities[2].normalArray, gl.STATIC_DRAW);

    entities[2].numElements = 8;
    entities[2].drawMode = gl.LINES;
    entities[2].visible = true;
    entities[2].resetMatrix();
}



function log(text, silent = true) {
    let ts = 0;
    try {
        ts = new Date().getTime() - timer.start;
    } catch (e) {
        // timer was not yet defined
    } 

    console.log("E3D[" + ts + "] " + text);
    if (!silent) {
        logElement.innerHTML += "[" + ts + "] " + text + "<br />";
    }
}


});