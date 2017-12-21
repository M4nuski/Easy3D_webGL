document.addEventListener("DOMContentLoaded", function () {

"use strict"


// global config
const _pinchHysteresis = 10;
const _rotateMouseButton = 0;
const _panMouseButton = 1;

// global state var



var sessionStart = new Date().getTime();

var panning = false;
var rotating = false;
var mx, pinx, dx = 0, rx = 0;
var my, piny, dy = 0, ry = 0;
var dz = -16.0;

var touchDist = 0;

var gl, programInfo, buffers;

var rawModelData = [];
var floatModelData = [];
var numTriangles = 0;

// elements
var can = document.getElementById("GLCanvas");
var log = document.getElementById("logDiv");
var status = document.getElementById("statusDiv");

// events
can.addEventListener("mousedown", mouseDown);
can.addEventListener("mouseup", mouseUp);
can.addEventListener("mousemove", mouseMove);
can.addEventListener("mouseleave", mouseLeave);
can.addEventListener("wheel", mouseWheel);
can.addEventListener("dblclick", mouseDblClick); // to avoid weird selection behaviour on canvas

can.addEventListener("touchstart", touchStart);
can.addEventListener("touchend", touchEnd);
can.addEventListener("touchcancel", touchCancel);
can.addEventListener("touchmove", touchMove);

function updateStatus() {
    status.innerHTML = "X:" + Math.floor(mx) + " Y:" + Math.floor(my) + " dX:" + Math.floor(dx) + " dY:" + Math.floor(dy) + " dZ:" + Math.floor(dz);
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
    
    var doUpdate = false;
    
    if (panning) {
        dx = dx + (mx - pinx);
        dy = dy + (my - piny);
        doUpdate = true;
    }
    
    if (rotating) {
        rx = rx + (mx - pinx);
        ry = ry + (my - piny);
        doUpdate = true;
    }
    
    pinx = mx;
    piny = my;
    
    updateStatus();
    if (doUpdate) {
        drawScene(gl, programInfo, buffers);
    }
}


function mouseWheel(event) {
    if (event.deltaY != 0) {
        // addLine("deltaY" + event.deltaY); 
        dz += (event.deltaY / 100);
        updateStatus();
        drawScene(gl, programInfo, buffers);
    }
    if (event.preventDefault) { event.preventDefault(); };
}

function mouseDblClick(event) {
    if (event.preventDefault) { event.preventDefault(); };
}

var ongoingTouches = [];
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
    //    addLine("end touch: " + touches[i].identifier);
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
    //    addLine("cancel touch: " + touches[i].identifier);
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

       // addLine(newTouchDist - touchDist);
  
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
    drawScene(gl, programInfo, buffers);
}

function getModel() {
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", reqListener);
    oReq.open("GET", "ST.raw");
    addLine("Loading Model Async");
    oReq.send();
}


const vsSource = `
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying lowp vec4 vColor;

void main(void) {
gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
vColor = aVertexColor;
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
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
        },
    };


    getModel();

    // drawScene(gl, programInfo,buffers);

    //  buffers = initBuffers(gl);

}

function drawScene(gl, programInfo, buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar);


    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.



    mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [dx / 50, -dy / 50, dz]);  // amount to translate

    mat4.rotate(modelViewMatrix, modelViewMatrix, rx / 100, [0, 1, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, ry / 100, [1, 0, 0]);

    // mat4.translate(modelViewMatrix,     // destination matrix
    //    modelViewMatrix,     // matrix to translate
    //  [dx, -dy, 0.0]);  // amount to translate

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
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
    // Tell WebGL to use our program when drawing

    gl.useProgram(programInfo.program);

    // Set the shader uniforms

    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix);

    {
        const offset = 0;
        const vertexCount = numTriangles / 3;// 4;
        gl.drawArrays(gl.TRIANGLES, offset, vertexCount);
    }
}


function initBuffers(gl) {
    addLine("Creating buffers");
    // Create a buffer for the square's positions.

    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now create an array of positions for the square.

    const colorSweep = [
        1.0, 0.5, 0.5,
        0.5, 1.0, 0.5,
        0.5, 0.5, 1.0
    ];
    var colors = [];
    var positions = [];/* = [
    1.0,  1.0,
    -1.0,  1.0,
    1.0, -1.0,
    -1.0, -1.0,
];*/

    for (var i = 0; i < rawModelData.length; i++) {
        var chunk = rawModelData[i].split(" ");
        for (var j = 0; j < chunk.length; j++) {
            var n = chunk[j].trim();
            if (n != "") {
                positions.push(Number(chunk[j].trim()));
                colors.push(colorSweep[numTriangles % 9]);
                numTriangles++;
            }
        }
    }
    addLine("Loaded " + numTriangles + " float locations");
    addLine((numTriangles / 3) + " vertices");
    addLine((numTriangles / 9) + " triangles");

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
        position: positionBuffer,
        color: colorBuffer,
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
    const shader = gl.createShader(type);

    // Send the source to the shader object

    gl.shaderSource(shader, source);

    // Compile the shader program

    gl.compileShader(shader);

    // See if it compiled successfully

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        addLine('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function addLine(text) {
    log.innerHTML += "[" + ((new Date()).getTime() - sessionStart) + "] " + text + "<br />";
}


});