document.addEventListener("DOMContentLoaded", function () {

"use strict"

var sessionStart = new Date().getTime();


// elements
var canvas = document.getElementById("glCanvas");
var log = document.getElementById("logDiv");

// events
document.getElementById("startTestSpan").addEventListener("click", starttest);

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

var vertexArray;

var triNum = 1000000;
var entNum = 10;

var triDiv = 10;
var entMult = 10;

var triMin = 10;
var entMax = 1000000;

function starttest() {
    triNum = document.getElementById("nbTriStart").value;
    entNum = document.getElementById("nbEntStart").value;
    triDiv = document.getElementById("ittTriDiv").value;
    entMult = document.getElementById("ittEntMult").value;

    triMin = document.getElementById("nbTriMin").value;
    entMax = document.getElementById("nbEntMax").value;


    addLine("Context Initialization");
    context = canvas.getContext("webgl");
    canvas.style.display = "block";

    if (!context) {
        addLine("Unable to initialize WebGL. Your browser or machine may not support it.");
        timer.pause();
        return;
    }
    
    addLine("Shader Program Initialization");

    addLine("program A (in-shader matrix mult)");
    programA = new E3D_program("test program A", context);
    programA.compile(vertShaderPerfTestA, fragShaderPerfTestA);
    programA.bindLocations(attribListPerfTestA, uniformListPerfTestA);

    addLine("program B (in-code JS matrix mult)");
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
    context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

    addLine("Buffer");
    vertexArray = new Float32Array(triNum * 3 * 4); // 1 million triangles * 3 vertex * 4 float
    PosBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, PosBuffer);
    context.bufferData(context.ARRAY_BUFFER, vertexArray, context.DYNAMIC_DRAW); 

    addLine("");
    addLine("Test Starting...");



    triNum = triNum * triDiv;
    entNum = entNum / entMult;
    setTimeout( testItterator, 10);
}

function testItterator() {
    if ((triNum > triMin) && (entNum < entMax)) {

        triNum = triNum / triDiv;
        entNum = entNum * entMult;

        addLine("Testing with nbEntities=" + entNum + " and nbTri=" + triNum);
        setTimeout(testShader, 10);
    } else {
        addLine("Test Ended.");
        addLine("");
    }
}

function addLine(text) {
    if (text != "") {
        log.innerHTML += "[" + ((new Date()).getTime() - sessionStart) + "] " + text + "<br />";
    } else log.innerHTML += "<br />"; 

    log.scrollTop = log.scrollHeight;
}




function testShader() {
  
    context.useProgram(programA.shaderProgram);
    context.bindBuffer(context.ARRAY_BUFFER, PosBuffer);
    context.vertexAttribPointer(programA.shaderAttributes["aVertexPosition"], 4, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(programA.shaderAttributes["aVertexPosition"]);
  

        var delta = 0;
        for (var subTest = 0; subTest < 10; ++subTest) {
            st = performance.now();
            renderA(entNum, triNum);
            et = performance.now();
            delta += (et - st);
        }
        addLine("Program A delta: " + (delta / 10) + " maxRPS: " + (10000 / delta) );



    context.useProgram(programB.shaderProgram);
    context.bindBuffer(context.ARRAY_BUFFER, PosBuffer);
    context.vertexAttribPointer(programB.shaderAttributes["aVertexPosition"], 4, context.FLOAT, false, 0, 0);
    context.enableVertexAttribArray(programB.shaderAttributes["aVertexPosition"]);


        var delta = 0;
        for (var subTest = 0; subTest < 10; ++subTest) {
            st = performance.now();
            renderB(entNum, triNum);
            et = performance.now();
            delta += (et - st);
        }
        addLine("Program B delta: " + (delta / 10) + " maxRPS: " + (10000 / delta) );

    setTimeout(testItterator, 10);
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
#version 100

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
#version 100

varying highp vec4 position;

void main(void) {
    gl_FragColor = position; 
}
`;
const attribListPerfTestB = ["aVertexPosition"];
const uniformListPerfTestB = ["uModelViewMatrix", "uModelViewProjectionMatrix"];

});