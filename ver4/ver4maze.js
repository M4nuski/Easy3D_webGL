// Easy3D_WebGL
// Maze demo game for version 0.5
// Emmanuel Charette 2022

"use strict"

// DEV Stats
var nHitTest = 0;
var nHits = 0;
var show_DEV_CD = false;
var phyTracers, dev_Hits, dev_CD;

// Global engine data
var gAccel = 0;
var timer = { delta : 0, start : Date.now() }; // dummy timer 

// Engine logging
var logElement = null;
function log(text, silent = true) {
    let ts = Date.now() - timer.start;
    if (!silent) {
        //if (logElement == null) logElement = document.getElementById("logDiv");        
        if (logElement != null) {
            logElement.innerHTML += "[" + ts + "] " + text + "<br />";
            logElement.scrollTop = logElement.scrollHeight - logElement.offsetHeight;
        } 
    }
    console.log("[" + ts + "] " + text);
}


document.addEventListener("DOMContentLoaded", function () {
log("DOMContentLoaded");


log("Get DOM Elements");
const GLCanvas = document.getElementById("GLCanvas");

const btn_restart = document.getElementById("btn_restart");

const btn_new = document.getElementById("btn_new");
const input_nb_size = document.getElementById("input_nb_size");
const input_nb_seed = document.getElementById("input_nb_seed");

const span_time = document.getElementById("span_time");
const btn_help = document.getElementById("btn_help");

const div_help = document.getElementById("helpDiv");
const span_status = document.getElementById("span_status");

logElement = document.getElementById("logDiv");    


log("Set DOM Events");
window.addEventListener("resize", winResize); // To reset camera matrix
btn_restart.addEventListener("click", restartGame); 
btn_new.addEventListener("click", newGame); 
btn_help.addEventListener("click", toggleHelp); 
input_nb_size.addEventListener("keydown", inputsKeydown);
input_nb_seed.addEventListener("keydown", inputsKeydown);


// Engine Config

const _fieldOfView = 60 * DegToRad;
const _zNear = 1;
var _zFar = 600.0;
const _fogStart = 400.0;
const _camHeight = 400.0;
E3D_G = 250.0; // override gravity accel


// Entities

var ball; 
var maze = new E3D_entity("Maze", "", true);
var markers = new E3D_entity_wireframe_canvas("Markers", "", true);

var animations = [];


// Maze data

var lastSeed = 0;
var lastSize = -1;

var mazeSize = 5;
var cellWidth = 50;
var wallHeight = 50;
var wallHalfThickness = 4;
var baseHeight = 8;

var TopWall = 0;
var BottomWall = 1;
var LeftWall = 2;
var RightWall = 3;

var startPosition = v3_new();
var targetPosition = v3_new();
var ballRadius = 12;

var rotationClamp = 0.5;
var rotationSmoothing = 1.0;

// Game state

var startTime = 0;
var gameState = "start";
/*
start: time span gray, set to 0, position and rotation reset
run: time span white, timer running, animations running
win: time span green, timer stop, anim stop
loss: time span red, timer stop, anim stop
*/
const runColor  = [0.3, 0.3, 1.0, 1.0];
const winColor  = [0.2, 0.7, 0.2, 1.0];
const lossColor = [0.5, 0.2, 0.2, 1.0];


// Engine Components

var gl; // webGL canvas rendering context
timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var meshLoader = new E3D_loader();

var inputs = new E3D_input(GLCanvas, true, false, true, false);
var baseRotSpeed = inputs._rotSpeed;


// Startup

log("Session Start", true);
initEngine();


// Localization
const language_default = ".lang_FR";
const language_other = ".lang_EN";
var language = language_default;
document.getElementById("btn_lang").addEventListener("click", toggleLangButton);
function toggleLangButton() {
    // toggle
    let oldLanguage = language.slice();
    language = (language == language_default) ? language_other : language_default;  

    // update style
    for (var rule of document.styleSheets[0].cssRules) {
        if (rule.selectorText == oldLanguage) rule.style.display = "none";
        if (rule.selectorText == language) rule.style.display = "";
    }

    if (localStorage) localStorage.setItem("maze05.lang", language);
}
if (localStorage) {
    var l = localStorage.getItem("maze05.lang");
    if ((l != undefined) && (l != language_default)) toggleLangButton();
}


// Event handlers

function winResize() {
    gl.canvas.width  = gl.canvas.offsetWidth;
    gl.canvas.height = gl.canvas.offsetHeight;
    
    log("Resize to " + gl.canvas.width + " x " + gl.canvas.height , true);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // TODO keep track of viewport in camera
    scn.camera.resize(gl.canvas.width, gl.canvas.height, _fieldOfView, _zNear, _zFar); 
    scn.camera.updateMatrix();

    inputs.resize();
}

function toggleHelp() {
    div_help.style.display = (div_help.style.display != "table-row") ? "table-row" : "none";
}

function inputsKeydown(event) {
    if ((event.key == "Enter") || (event.code == "Enter") || (event.code == "NumpadEnter")) {
        event.target.blur();
        newGame();
    }
}

function restartGame() {
    // reset speeds, limits, camera and fog
    if (lastSize != mazeSize) {

        var dist = (1.25 * mazeSize * cellWidth) + wallHeight;
        _zFar = dist * 1.25;
        scn.fogLimit = dist;

        scn.camera.moveTo(0, dist, 0);
        winResize();

        var fact = 8 / (mazeSize + 6);
        //log(fact);
        inputs._rotSpeed = baseRotSpeed * fact;
        rotationClamp = 0.4 * fact;
        rotationSmoothing = fact;
        lastSize = mazeSize;
    }

    markers.clear();
    markers.addCylinder(targetPosition, ballRadius * 0.5, ballRadius * 0.2, _v3_white, 16, 0, 1, false);
    markers.addCylinder(targetPosition, ballRadius * 1.0, ballRadius * 0.4, _v3_red,   16, 0, 1, false);
    markers.addCylinder(targetPosition, ballRadius * 1.5, ballRadius * 0.6, _v3_white, 16, 0, 1, false);
    markers.addCylinder(targetPosition, ballRadius * 2.0, ballRadius * 0.8, _v3_red,   16, 0, 1, false);
    markers.addCylinder(targetPosition, ballRadius * 2.5, ballRadius * 1.0, _v3_white, 16, 0, 1, false);

    // reset positions
    v3_copy(ball.position, startPosition);
    ball.resetMatrix();
    animations[0] = newBaseAnim(ball, _v3_null, _v3_null, 1.0, -1, true);
    animations[0].sourceCollResolver = collisionResult_asSource_slide;

    maze.rotation = v3_val_new(0, 0, 0);
    maze.resetMatrix();

    markers.rotation = v3_val_new(0, 0, 0);
    markers.resetMatrix();

    v3_copy(lastPos, startPosition);
    sumRotMat = m4_new();

    inputs.reset();
    scn.changeClearColor(runColor);

    startTime = 0;
    span_time.innerText = "00:00.00";
    span_time.style.color = "gray";

    gameState = "start";
}

function newGame() {
    var size = Number(input_nb_size.value);
    if (size == NaN) {
        size = 5;
        input_nb_size.value = size;
    }

    // if same seed and size than last time increase seed before generating
    // otherwise generate from provided value
    var seed = Number(input_nb_seed.value);
    if (seed == NaN) {
        seed = (new Date()).getFullYear;
        input_nb_seed.value = seed;
    } else {
        if ((seed == lastSeed) && (mazeSize == size)) seed += 1;
        input_nb_seed.value = seed;        
    }

    genMaze(size, seed);
    restartGame();
    lastSeed = seed;
}


// Engine core methods

function initEngine() {

    log("Context Initialization", false);
    gl = GLCanvas.getContext("webgl");

    if (!gl) {
        log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
        timer.pause();
        return;
    }

    log("Scene Creation", false);
    try {
        gl.canvas.width  = gl.canvas.offsetWidth;
        gl.canvas.height = gl.canvas.offsetHeight;

        scn = new E3D_scene("mainScene", gl, gl.canvas.width, gl.canvas.height, runColor, _fogStart);

        log("Shader Program Initialization", false);
        scn.program = new E3D_program("mainProgram", gl);
        scn.program.compile(vertShader01, fragShader01);
        scn.program.bindLocations(attribList01, uniformList01);

        log("Lighting Initialization", false);
        scn.lights = new E3D_lighting(v3_val_new(0.0, 0.0, 0.15));
        scn.lights.setColor0(v3_val_new(1.0, 1.0, 1.0));
        scn.lights.setDirection0(v3_val_new(-0.2, -0.2, -1.0)); 
        scn.lights.light0_lockToCamera = true;

        scn.lights.setColor1(v3_val_new(1.0, 1.0, 0.85));
        scn.lights.setDirection1(v3_val_new(1.0, -1.0, 0.8));
        scn.lights.light1_lockToCamera = false;

        log("Camera Initialization", false);

        scn.camera = new E3D_camera_persp("TopCam", gl.canvas.width, gl.canvas.height, _fieldOfView, _zNear, _zFar);   
        scn.camera.moveTo(0, _camHeight, 0, PIdiv2, 0, 0);      
        winResize();

        log("Scene Initialization", false);
        scn.initialize();

        scn.preRenderFunction = prepRender; // callback to do some custom stuff

        inputs.keyMap.set("action0", E3D_INP_LMB);
        inputs.onInput = onKeyInput;

    } catch (e) {
        log(e, false);

        return; 
    }
     
    resMngr.addRessource("../Models/SPH.raw", "Ball", "Entity");
    resMngr.loadAll("Start");

    markers.visible = true;
    scn.addEntity(markers);
    timer.run();
}


// for ball rotation
var lastPos = v3_new();
var newRotMat = m4_new();
var sumRotMat = m4_new();
var newRotVect = v3_new();

// to detect game state
var _limitAxis = v3_new();
var _target = v3_new();

function prepRender() {
    // stats display
    span_status.innerText =padStart(""+timer.usageSmoothed.toFixed(2), " ", 8) + "%";

    if ((gameState == "run") || (gameState == "start")) {
        // move maze per inputs
        maze.rotateBy([inputs.rx_delta_smth, 0, -inputs.ry_delta_smth]);
        maze.resetMatrix();

        // update target marker
        markers.rotateBy([inputs.rx_delta_smth, 0, -inputs.ry_delta_smth]);
        markers.resetMatrix();

        // Run Animations
        //cleanupDoneAnimations(animations, scn);
        collisionDetectionAnimator(animations, scn, 8);


        // create ball rotation effect
        // Matrix version
        v3_sub_res(newRotVect, ball.position, lastPos);
        newRotVect[1] = 0;
        var rLen = v3_length(newRotVect);
        if (rLen > _v3_epsilon) {
            var rotAngle = rLen / -ballRadius;
            v3_cross_mod(newRotVect, _v3_y); // rotation around perpendicular axis
            v3_normalize_mod(newRotVect);

            m4_rotation_res(newRotMat, rotAngle, newRotVect);
            m4_multiply_res(sumRotMat, newRotMat, sumRotMat);

            m4_copy(ball.normalMatrix, sumRotMat);
            m4_copy(ball.modelMatrix, sumRotMat);

            ball.modelMatrix[12] =  ball.position[0];
            ball.modelMatrix[13] =  ball.position[1];
            ball.modelMatrix[14] =  ball.position[2];
        }
        v3_copy(lastPos, ball.position);


        // apply current maze rotation to target and limit axis
        v3_applym4_res(_limitAxis, _v3_y, maze.normalMatrix);
        v3_applym4_res(_target, targetPosition, maze.normalMatrix);
    }
    if (gameState == "run") {
         // Timer display and game logic
        if (v3_dot(_limitAxis, ball.position) < -ballRadius) {
            startTime = 0;
            span_time.style.color = "red";
            gameState = "loss";
            scn.changeClearColor(lossColor);
        } else if (v3_distance(ball.position, _target) <= ballRadius) {
            span_time.style.color = "lime";
            gameState = "win";
            scn.changeClearColor(winColor);
        } else {
            var deltaTime = new Date(Date.now() - startTime);
            span_time.innerText =  padStart("" + deltaTime.getMinutes(), "0", 2) + ":" 
                                   + padStart("" + deltaTime.getSeconds(), "0", 2) + ":" 
                                   + padStart(""+Math.floor(deltaTime.getMilliseconds() / 10), "0", 2);
            if (deltaTime > 3600000) {
                span_time.style.color = "red";
                gameState = "loss";
                scn.changeClearColor(lossColor);
            }                             
        }
    }
}

function timerTick() {  // Engine Loop

    inputs.processInputs(timer.delta);
    inputs.smoothRotation(rotationSmoothing);
    inputs.clampRotationSmooth(-rotationClamp, rotationClamp);

    // Render
    if (scn.state == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }   
}

function onKeyInput(event) {
    if (event.type == "mouseDown") {
        if (gameState == "start") {
            startTime = Date.now();
            span_time.style.color = "white";
            gameState = "run";
        }
    }
}


// DFS maze generator

var mazeObj;
class MazeNode {
    constructor (x, y) {
        this.visited = false;
        this.walls = [true, true, true, true];
        this.traceDepth = -1;
        this.x = x;
        this.y = y;
    }

    hasUnvisitedNeighbours() {
        var res = false;
        if (this.x > 0) res = res || !(mazeObj[this.x-1][this.y].visited);
        if (this.y > 0) res = res || !(mazeObj[this.x][this.y-1].visited);
        if (this.x < mazeSize-1) res = res || !(mazeObj[this.x+1][this.y].visited);
        if (this.y < mazeSize-1) res = res || !(mazeObj[this.x][this.y+1].visited);
        return res;
    }

}

function genMaze(size = 5, seed = 2020) {
    mazeSize = size;
    var rng = new Random(seed);
    rng.nextInt(mazeSize); // ignore first one

    // prep maze 2D array
    mazeObj = new Array(mazeSize);
    for (var i = 0; i < mazeSize; ++i) mazeObj[i] = new Array(mazeSize);

    // create maze nodes
    for (var x = 0; x < mazeSize; ++x) for (var y = 0; y < mazeSize; ++y) mazeObj[x][y] = new MazeNode(x, y);
   
    // select starting point
    var startX = rng.nextInt(mazeSize);
    var startY = rng.nextInt(mazeSize);
    var CurrentPos = [startX, startY];
    var posStack = [];
    var stackIndex = 0;
    posStack.push([CurrentPos[0], CurrentPos[1]]);

    mazeObj[CurrentPos[0]][CurrentPos[1]].visited = true; // fisrt node is visited
    mazeObj[CurrentPos[0]][CurrentPos[1]].traceDepth = 0;

    // run DFS algo, by loop, external stack
    var done = false;
    while (done == false) {

        // randomly select unvisited neighbour
        var validNewPos = false;
        var nx = 0;
        var ny = 0;
        while (!validNewPos) {
            //random
            nx = rng.nextInt(4); // 0 1 2 3
            if (nx == 1) nx =  0;
            if (nx == 2) nx = -1; // 25% chance
            if (nx == 3) nx =  1; // 25% chance

            ny = 0;
            if (nx == 0) { // 50% chance
                ny = rng.nextInt(2); // 0 1
               if (ny == 0) ny = -1; // 25% chance, other 25% is ny == 1
            }

            //new position
            nx += CurrentPos[0];
            ny += CurrentPos[1];

            //clamp
            nx = clamp(nx, 0, mazeSize - 1);
            ny = clamp(ny, 0, mazeSize - 1);

            //test
            validNewPos = ((nx != CurrentPos[0]) || (ny != CurrentPos[1])) && (mazeObj[nx][ny].visited == false);     
        }

        // select wall
        var wall = 0;
        var nextWall = 0;
        if (nx < CurrentPos[0]) {
            wall = LeftWall;
            nextWall = RightWall;
        }
        if (nx > CurrentPos[0]) {
            wall = RightWall;
            nextWall = LeftWall;
        }
        if (ny < CurrentPos[1]) {
            wall = TopWall;
            nextWall = BottomWall;
        }
        if (ny > CurrentPos[1]) {
            wall = BottomWall;
            nextWall = TopWall;
        }

        // remove current cell wall
        mazeObj[CurrentPos[0]][CurrentPos[1]].walls[wall] = false;

        // update pos
        CurrentPos = [nx, ny];

        // remove new cell wall
        mazeObj[CurrentPos[0]][CurrentPos[1]].walls[nextWall] = false;

        // set visited
        mazeObj[CurrentPos[0]][CurrentPos[1]].visited = true;
        mazeObj[CurrentPos[0]][CurrentPos[1]].traceDepth = stackIndex + 1;

        // update stack
        stackIndex++;
        posStack[stackIndex] = [CurrentPos[0], CurrentPos[1]];

        // if no unvisited neighbours unwind stack (until 0) and retest
        var backTrack = mazeObj[CurrentPos[0]][CurrentPos[1]].hasUnvisitedNeighbours() == false;
        while (backTrack) {
            stackIndex--;
            if (stackIndex >= 0) {
                CurrentPos[0] = posStack[stackIndex][0];
                CurrentPos[1] = posStack[stackIndex][1];
            }
            backTrack = (stackIndex > 0) && ( mazeObj[CurrentPos[0]][CurrentPos[1]].hasUnvisitedNeighbours() == false );
        }

        done = (stackIndex < 0) || ( (stackIndex == 0) && (mazeObj[CurrentPos[0]][CurrentPos[1]].hasUnvisitedNeighbours() == false) ); 
    }

    // depest stack point
    var maxTraceDepth = 0;
    var exitX = 0;
    var exitY = 0;
    for (var x = 0; x < mazeSize; ++x) for (var y = 0; y < mazeSize; ++y) if (maxTraceDepth < mazeObj[x][y].traceDepth) {
        maxTraceDepth = mazeObj[x][y].traceDepth;
        exitX = x;
        exitY = y;
    }

    // side wall holes
    for (var i = 0; i < mazeSize/4; ++i) {
        mazeObj[0][rng.nextInt(mazeSize)].walls[LeftWall] = false;
        mazeObj[mazeSize-1][rng.nextInt(mazeSize)].walls[RightWall] = false;
        mazeObj[rng.nextInt(mazeSize)][0].walls[TopWall] = false;
        mazeObj[rng.nextInt(mazeSize)][mazeSize-1].walls[BottomWall] = false;
    }
    
    // generate maze mesh

    // "diamond" corners mesh
    meshLoader.reset();

    //var scale = 320 / mazeSize; // now cellWidth
    var mid = cellWidth * mazeSize / 2;

    // inner horizontal walls
    for (var y = 0; y < mazeSize; ++y) {
        var py = (cellWidth * y) - mid;  

        // top walls      
        var startPos = 0;
        while (startPos < mazeSize) { 
            if (mazeObj[startPos][y].walls[TopWall]) {
                var endPos = startPos+1;
                var startCap = !mazeObj[startPos][y].walls[LeftWall];
                while ((endPos < mazeSize) && mazeObj[endPos][y].walls[TopWall] && !mazeObj[endPos-1][y].walls[RightWall]) endPos++;
                var p1 = (cellWidth * startPos) - mid;
                var p2 = (cellWidth * endPos) - mid;            
                startPos = endPos-1;
                var endCap = !mazeObj[startPos][y].walls[RightWall];
                addMazeWall([p1, 0, py], [p2, 0, py], startCap, endCap);
            }
            startPos++;
        }

        // bottom walls
        var startPos = 0;    
        while (startPos < mazeSize) { 
            if (mazeObj[startPos][y].walls[BottomWall]) {
                var endPos = startPos+1;
                var startCap = !mazeObj[startPos][y].walls[LeftWall];
                while ((endPos < mazeSize) && mazeObj[endPos][y].walls[BottomWall] && !mazeObj[endPos-1][y].walls[RightWall]) endPos++;
                var p1 = (cellWidth * startPos) - mid;
                var p2 = (cellWidth * endPos) - mid;            
                startPos = endPos-1;
                var endCap = !mazeObj[startPos][y].walls[RightWall];
                addMazeWall([p2, 0, py + cellWidth], [p1, 0, py + cellWidth], endCap, startCap);
            }
            startPos++;
        }    
    }

    // bottom edge
    var py = (cellWidth * mazeSize) - mid;
    var startPos = 0;
    while (startPos < mazeSize) { 
        if (mazeObj[startPos][mazeSize - 1].walls[BottomWall]) {
            var endPos = startPos+1;
            while ((endPos < mazeSize) && mazeObj[endPos][mazeSize - 1].walls[BottomWall]) endPos++;
            var p1 = (cellWidth * startPos) - mid;
            var p2 = (cellWidth * endPos) - mid;            
            startPos = endPos-1;

            addMazeWall([p1,-baseHeight, py], [p2, -baseHeight, py], true, true, baseHeight + wallHeight);
        }
        startPos++;
    }
    // top edge
    var py = - mid;
    var startPos = 0;
    while (startPos < mazeSize) { 
        if (mazeObj[startPos][0].walls[TopWall]) {
            var endPos = startPos+1;
            while ((endPos < mazeSize) && mazeObj[endPos][0].walls[TopWall]) endPos++;
            var p1 = (cellWidth * startPos) - mid;
            var p2 = (cellWidth * endPos) - mid;            
            startPos = endPos-1;

            addMazeWall([p2, -baseHeight, py], [p1, -baseHeight, py], true, true, baseHeight + wallHeight);
        }
        startPos++;
    }


    // inner vertical walls
    for (var x = 0; x < mazeSize; ++x) {
        var px = (cellWidth * x) - mid;  

        // left walls      
        var startPos = 0;
        while (startPos < mazeSize) { 
            if (mazeObj[x][startPos].walls[LeftWall]) {
                var endPos = startPos+1;
                var startCap = !mazeObj[x][startPos].walls[TopWall];
                while ((endPos < mazeSize) && mazeObj[x][endPos].walls[LeftWall] && !mazeObj[x][endPos-1].walls[BottomWall]) endPos++;
                var p1 = (cellWidth * startPos) - mid;
                var p2 = (cellWidth * endPos) - mid;            
                startPos = endPos-1;
                var endCap = !mazeObj[x][startPos].walls[BottomWall];
                addMazeWall([px, 0, p2], [px, 0, p1], endCap, startCap);
            }
            startPos++;
        }

        // right walls
        var startPos = 0;
        while (startPos < mazeSize) { 
            if (mazeObj[x][startPos].walls[RightWall]) {
                var endPos = startPos+1;
                var startCap = !mazeObj[x][startPos].walls[TopWall];
                while ((endPos < mazeSize) && mazeObj[x][endPos].walls[RightWall] && !mazeObj[x][endPos-1].walls[BottomWall]) endPos++;
                var p1 = (cellWidth * startPos) - mid;
                var p2 = (cellWidth * endPos) - mid;            
                startPos = endPos-1;
                var endCap = !mazeObj[x][startPos].walls[BottomWall];
                addMazeWall([px + cellWidth, 0, p1], [px + cellWidth, 0, p2], startCap, endCap);
            }
            startPos++;
        }
    }


    // right edge
    var px = (cellWidth * mazeSize) - mid;
    var startPos = 0;
    while (startPos < mazeSize) { 
        if (mazeObj[mazeSize - 1][startPos].walls[RightWall]) {
            var endPos = startPos+1;
            while ((endPos < mazeSize) && mazeObj[mazeSize - 1][endPos].walls[RightWall]) endPos++;
            var p1 = (cellWidth * startPos) - mid;
            var p2 = (cellWidth * endPos) - mid;            
            startPos = endPos-1;

            addMazeWall([px, -baseHeight, p2], [px, -baseHeight, p1], true, true, baseHeight + wallHeight);
        }
        startPos++;
    }
    // left edge
    var px = -mid;
    var startPos = 0;
    while (startPos < mazeSize) { 
        if (mazeObj[0][startPos].walls[LeftWall]) {
            var endPos = startPos+1;
            while ((endPos < mazeSize) && mazeObj[0][endPos].walls[LeftWall]) endPos++;
            var p1 = (cellWidth * startPos) - mid;
            var p2 = (cellWidth * endPos) - mid;            
            startPos = endPos-1;

            addMazeWall([px, -baseHeight, p1], [px, -baseHeight, p2], true, true, baseHeight + wallHeight);
        }
        startPos++;
    }
  
    // add base
    
    var pp =  mid;
    var pm = -mid;
    meshLoader.pushQuad4p([pp, 0, pm], [pm, 0, pm], [pm, 0, pp], [pp, 0, pp]);
    
    meshLoader.pushQuad4p([pp, 0, pp], [pm, 0, pp],  [pm, -baseHeight, pp], [pp, -baseHeight, pp]);
    meshLoader.pushQuad4p([pm, 0, pm], [pp, 0, pm],  [pp, -baseHeight, pm], [pm, -baseHeight, pm]);
    meshLoader.pushQuad4p([pm, 0, pp], [pm, 0, pm],  [pm, -baseHeight, pm], [pm, -baseHeight, pp]);
    meshLoader.pushQuad4p([pp, 0, pm], [pp, 0, pp],  [pp, -baseHeight, pp], [pp, -baseHeight, pm]);
    
    // load maze mesh to entity with CD and edges
    maze.clear();
    meshLoader.addCDFromData(maze, false);
    meshLoader.addStrokeData(maze, false, 0.8);
    meshLoader.addModelData(maze);

    // calculate ball starting position and goal position

    v3_val_res(startPosition, ((startX + 0.5) * cellWidth) - mid, wallHeight / 2, ((startY + 0.5) * cellWidth) - mid);
    v3_val_res(targetPosition, ((exitX + 0.5) * cellWidth) - mid, ballRadius, ((exitY + 0.5) * cellWidth) - mid);


    // update scene with new maze
    maze.visible = true;
    scn.updateEntity(maze);
} 


function addMazeWall(leftP, rightP, leftClosed, rightClosed, height = wallHeight) {
    var n = v3_sub_new(rightP, leftP);
    v3_normalize_mod(n);

    var leftProj = v3_addscaled_new(leftP, n, wallHalfThickness);
    var rightProj = v3_addscaled_new(rightP, n, -wallHalfThickness);

    v3_rotateY_mod(n, -PIdiv2);

    v3_addscaled_mod(leftProj, n, wallHalfThickness);
    v3_addscaled_mod(rightProj, n, wallHalfThickness);

    meshLoader.pushWall(leftProj, rightProj, height); // face wall
    if (leftClosed) meshLoader.pushWall(leftP, leftProj, height); // end walls
    if (rightClosed) meshLoader.pushWall(rightProj, rightP, height);

    // top
    leftP[1] += height; 
    leftProj[1] += height; 
    rightP[1] += height; 
    rightProj[1] += height; 

   // var midP = v3_avg2_new(leftP, rightP);
   // meshLoader.pushTriangle3p(leftP, leftProj, midP);
   // meshLoader.pushTriangle3p(leftProj, rightProj, midP);
   // meshLoader.pushTriangle3p(rightProj, rightP, midP);
   /*
   [105] 270 CD triangles
   [118] unique Vert: 190
   [158] edges: 465
   [159] 131 CD edges
   [160] 107 strokes
   */
    meshLoader.pushTriangle3p(leftP, leftProj, rightP);
    meshLoader.pushTriangle3p(leftProj, rightProj, rightP);
    /*
    [52] 234 CD triangles
    [66] unique Vert: 168
    [119] edges: 405
    [121] 131 CD edges
    [121] 107 strokes
    */
}
// Engine resource loading

function onRessource(name, msg) {
    if (msg == E3D_RES_FAIL) {
        log("Failed to load ressource: " + name, false);        
    }
    if (msg == E3D_RES_ALL) {
        log("All async ressources loaded for tag: " + name, true);       
        resMngr.flushAll();   
        scn.state = E3D_ACTIVE;
    }

    if (msg == E3D_RES_LOAD) {
        log("Async ressource loaded: " + name, true); 

        if (resMngr.getRessourceType(name) == "Entity") {

            if (name == "Ball") {
                ball = new E3D_entity(name, "", true);
                //ballDia = 72 / mazeSize;
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0, 1.0, 0.5], [ballRadius, ballRadius, ballRadius]);
                ball.pushCD_sph(_v3_origin, ballRadius);
                meshLoader.smoothNormals(-0.9);
                meshLoader.addModelData(ball);
                ball.visible = true;
                scn.addEntity(ball);  

                newGame();
            }

        } // Entity group

    } // msg E3D_RES_LOAD
}








});