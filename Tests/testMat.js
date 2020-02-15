document.addEventListener("DOMContentLoaded", function () {

"use strict"

var sessionStart = new Date().getTime();


// elements
var canvas = document.getElementById("glCanvas");
var log = document.getElementById("logDiv");

// events
var testers = document.querySelectorAll(".test");
for (var i = 0; i < testers.length; ++i) testers[i].addEventListener("click", starttest);

function starttest(event) {
    addLine("");
    addLine(event.target.id + " running");
    setTimeout( t[event.target.id], 10);
}

function addLine(text) {
    if (text != "") {
        log.innerHTML += "[" + ((new Date()).getTime() - sessionStart) + "] " + text + "<br />";
    } else log.innerHTML += "<br />"; 

    log.scrollTop = log.scrollHeight;
}

function addText(text) {
    log.innerHTML += text; 
    log.scrollTop = log.scrollHeight;
}

function rand(x) {
    return Math.floor(Math.random() * x);
}


function drawMatrix(m) {
    addLine("Matrix:");

    var l = "<table><tr><td>";
    l += Math.floor(m[0] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[4] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[8] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[12] * 100) / 100;
    l += "</td></tr>";

    l += "<tr><td>";
    l += Math.floor(m[1] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[5] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[9] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[13] * 100) / 100;
    l += "</td></tr>";

    l += "<tr><td>";
    l += Math.floor(m[2] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[6] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[10] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[14] * 100) / 100;
    l += "</td></tr>";

    l += "<tr><td>";
    l += Math.floor(m[3] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[7] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[11] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[15] * 100) / 100;
    l += "</td></tr></table>";

    addText(l);
    addLine("");
}


const t = {};

t.test1 = function() {
    let m1 = m4_new();
    mat4.scale(m1, m1, [1.1, 2.2, 3.3, 4.4]);
    drawMatrix(m1);
    let m2 = m4_new();
    mat4.translate(m2, m2, [10, 20, 30, 40]);
    drawMatrix(m2);

    let m3 = m4_new();
    mat4.multiply(m3, m2, m1);
    addLine("m2 X m1");
    drawMatrix(m3);

    mat4.multiply(m3, m1, m2);
    addLine("m1 X m2");
    drawMatrix(m3);
    
    let m4 = m4_new();
    mat4.invert(m4, m3);
    addLine("inverse");
    drawMatrix(m4);

    mat4.transpose(m4, m3);
    addLine("transpose");
    drawMatrix(m4);

    mat4.rotateZ(m3, m1, 3.141592/2);
    addLine("rotate m1 z 90d");
    drawMatrix(m3);

    mat4.invert(m4, m3);
    addLine("inverse");
    drawMatrix(m4);

    mat4.transpose(m4, m3);
    addLine("transpose");
    drawMatrix(m4);

    addLine("End Test 1");
}





t.test2 = function() {
    let m1 = m4_new();
    mat4.scale(m1, m1, [1.1, 2.2, 3.3, 1.0]);
    mat4.translate(m1, m1, [100, 200, 300, 0]);
    addLine("m1");
    drawMatrix(m1);

    let m2 = m4_new();
    mat4.translate(m2, m2, [10, 20, 30, 0]);
    mat4.scale(m2, m2, [11.11, 22.22, 33.33, 1.0]);
    addLine("m2");
    drawMatrix(m2);

    let m3 = m4_new();
    mat4.rotate(m3, m3, 3.141592/4, [0, 0, 1]);
    mat4.translate(m3, m3, [10, 20, 30, 0]);
    mat4.rotate(m3, m3, 3.141592/4, [0, 1, 0]);
    addLine("m3");
    drawMatrix(m3);
    
    let m4 = m4_new();
    mat4.multiply(m4, m2, m1);
    addLine("m2 * m1");
    drawMatrix(m4);

    mat4.multiply(m4, m4, m3);
    addLine("(m2 * m1) * m3");
    drawMatrix(m4);

    let m5 = m4_new();
    mat4.multiply(m5, m2, m1);

    mat4.multiply(m5, m3, m5);
    addLine("m3 * (m2 * m1)");
    drawMatrix(m4);
  
    addLine("End Test 2");
}


var context; 
var programA, programB, programC;
var PosBuffer;
var st, et;

let modelMat = m4_new();
let viewMat = m4_new();
let projectionMat = m4_new();
let mvpMat = m4_new();
let mvMat = m4_new();
mat4.perspective(projectionMat, 45, 320 / 240, 1, 1000);


t.test3 = function() {
    addLine("Context Initialization");
    context = canvas.getContext("webgl");
    canvas.style.visibility = "visible";

    if (!context) {
        addLine("Unable to initialize WebGL. Your browser or machine may not support it.");
        timer.pause();
        return;
    }
    
    addLine("Shader Program Initialization");
    programA = new E3D_program("test program A", context);
    programA.compile(vertShaderPerfTestA, fragShaderPerfTestA);
    programA.bindLocations(attribListPerfTestA, uniformListPerfTestA);

    programB = new E3D_program("test program B", context);
    programB.compile(vertShaderPerfTestB, fragShaderPerfTestB);
    programB.bindLocations(attribListPerfTestB, uniformListPerfTestB);
    
    addLine("Scene Creation");
    context.clearColor(0.0, 0.0, 0.0, 1.0);
    context.clearDepth(1.0);
    context.enable(context.DEPTH_TEST);
    context.depthFunc(context.LEQUAL);
    context.cullFace(context.BACK);
    context.enable(context.CULL_FACE);

    addLine("Buffer");
    var vertexArray = new Float32Array(1000000 * 3 * 4); // 1 million triangles * 3 vertex * 4 float
    PosBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, PosBuffer);
    context.bufferData(context.ARRAY_BUFFER, vertexArray, context.DYNAMIC_DRAW); 

    addLine("Draw Loop");
    // Draw
    context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
 


    addLine("program A");
    context.useProgram(programA.shaderProgram);
    context.bindBuffer(context.ARRAY_BUFFER, PosBuffer);
    context.vertexAttribPointer(programA.shaderAttributes["aVertexPosition"], 4, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(programA.shaderAttributes["aVertexPosition"]);
  
    var numEnt = 10;
    var numVert = 1000000;
    for (var testLoop = 0; testLoop < 6; ++testLoop) {
        var delta = 0;
        for (var subTest = 0; subTest < 10; ++subTest) {
            st = performance.now();
            renderA(numEnt, numVert); // view, projection, model as uniform; normal, modelView, modelViewProjection in shader
            et = performance.now();
            delta += (et - st);
        }
        addLine("nbEntities: " + numEnt + " nbTri: " + numVert + " delta: " + (delta / 10) + " maxRPS: " + (10000 / delta) );
        numEnt = numEnt * 10;
        numVert = numVert / 10;
    }


    addLine("");
    addLine("program B");
    context.useProgram(programB.shaderProgram);
    context.bindBuffer(context.ARRAY_BUFFER, PosBuffer);
    context.vertexAttribPointer(programB.shaderAttributes["aVertexPosition"], 4, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(programB.shaderAttributes["aVertexPosition"]);
  
    var numEnt = 10;
    var numVert = 1000000;
    for (var testLoop = 0; testLoop < 6; ++testLoop) {
        var delta = 0;
        for (var subTest = 0; subTest < 10; ++subTest) {
            st = performance.now();
            renderB(numEnt, numVert); 
            et = performance.now();
            delta += (et - st);
        }
        addLine("nbEntities: " + numEnt + " nbTri: " + numVert + " delta: " + (delta / 10) + " maxRPS: " + (10000 / delta) );
        numEnt = numEnt * 10;
        numVert = numVert / 10;
    }


    canvas.style.visibility = "hidden";
    addLine("End Test 3");
}

function renderA(numEntities, numElements) {    
    // Scene uniforms
    context.uniformMatrix4fv(programA.shaderUniforms["uViewMatrix"], false, projectionMat);
    context.uniformMatrix4fv(programA.shaderUniforms["uProjectionMatrix"], false, viewMat);

    for (let i = 0; i < numEntities; ++i) {
        // Entity uniforms
        context.uniformMatrix4fv(programA.shaderUniforms["uModelMatrix"], false, modelMat);
        // Draw
        context.drawArrays(4, 0, numElements*3);
    }
}

function renderB(numEntities, numElements) {    
    for (let i = 0; i < numEntities; ++i) {
        // Entity uniforms
        mat4.multiply(mvMat, viewMat, modelMat);
        mat4.multiply(mvpMat, mvMat, projectionMat);
        context.uniformMatrix4fv(programB.shaderUniforms["uModelViewMatrix"], false, mvMat);
        context.uniformMatrix4fv(programB.shaderUniforms["uModelViewProjectionMatrix"], false, mvpMat);        
        // Draw
        context.drawArrays(4, 0, numElements*3);
    }
}

function renderC(numEntities, numElements) {    
    // Scene uniforms
    context.uniformMatrix4fv(programC.shaderUniforms["uViewProjectionMatrix"], false, viewMat);

    for (let i = 0; i < numEntities; ++i) {
        // Entity uniforms
        context.uniformMatrix4fv(programC.shaderUniforms["uModelViewMatrix"], false, modelMat);
        //context.uniformMatrix4fv(program.shaderUniforms["uNormalMatrix"], false, normalMat);            
        // Draw
        context.drawArrays(4, 0, numElements*3);
    }
}



class E3D_program {
    constructor(id, context) {
        this.id = id;
        this.context = context;

        this.shaderProgram = null;
        this.shaderAttributes = {};
        this.shaderUniforms = {};
    }

    compile(vertexSource, fragmentSource) {
        const vs = E3D_program.loadShader(this.context, this.context.VERTEX_SHADER, vertexSource);
        const fs = E3D_program.loadShader(this.context, this.context.FRAGMENT_SHADER, fragmentSource);

        if ((vs != null) && (fs != null)) {
            this.shaderProgram = this.context.createProgram();
            this.context.attachShader(this.shaderProgram, vs);
            this.context.attachShader(this.shaderProgram, fs);
            this.context.linkProgram(this.shaderProgram);

            if (!this.context.getProgramParameter(this.shaderProgram, this.context.LINK_STATUS)) {
                console.log('Unable to initialize the shader program: ' + this.context.getProgramInfoLog(this.shaderProgram));
                this.shaderProgram = null;
            }
        } else {
            this.shaderProgram = null;
        }
    }


    bindLocations(attribList, uniformList) {
        for (let i = 0; i < attribList.length; ++i) {
            this.shaderAttributes[attribList[i]] = this.context.getAttribLocation(this.shaderProgram, attribList[i]);
        }

        for (let i = 0; i < uniformList.length; ++i) {
            this.shaderUniforms[uniformList[i]] = this.context.getUniformLocation(this.shaderProgram, uniformList[i]);
        }
    }

    static loadShader(context, type, source) {
        const shader = context.createShader(type);       
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            console.log('An error occurred compiling the '+ type +' shaders: ' + context.getShaderInfoLog(shader));
            context.deleteShader(shader);
            return null;
        }
        return shader;
    }



}


const vertShaderPerfTestA = `
#version 100
attribute vec4 aVertexPosition;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
varying highp vec4 position;
void main(void) {
    mat4 modelView = uViewMatrix * uModelMatrix;
    position = modelView * aVertexPosition;
    gl_Position = uProjectionMatrix * position;
}
`;
const fragShaderPerfTestA = `
varying highp vec4 position;
void main(void) {
    gl_FragColor = position; 
}
`;
const attribListPerfTestA = ["aVertexPosition"];
const uniformListPerfTestA = ["uModelMatrix", "uViewMatrix", "uProjectionMatrix"];

const vertShaderPerfTestB = `
#version 100
attribute vec4 aVertexPosition;
uniform mat4 uModelViewMatrix;
uniform mat4 uModelViewProjectionMatrix;
varying highp vec4 position;
void main(void) {
    position = uModelViewMatrix * aVertexPosition;
    gl_Position = uModelViewProjectionMatrix * aVertexPosition;
}
`;
const fragShaderPerfTestB = `
varying highp vec4 position;
void main(void) {
    gl_FragColor = position; 
}
`;
const attribListPerfTestB = ["aVertexPosition"];
const uniformListPerfTestB = ["uModelViewMatrix", "uModelViewProjectionMatrix"];

});