// Easy3D_WebGL
// Maze demo game for version 0.4
// Emmanuel Charette 2020

"use strict"

// Stats
var nHitTest = 0;
var nHits = 0;
var show_DEV_CD = false;
var phyTracers, dev_Hits, dev_CD;


var gAccel = 0;

var timer = { delta : 0, start : Date.now() }; // dummy timer 

var logElement = null;
function log(text, silent = true) {
    let ts = Date.now() - timer.start;
    if (!silent) {
        if (logElement == null) logElement = document.getElementById("logDiv");        
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
var startTime = 0;

log("Set DOM Events");
window.addEventListener("resize", winResize); // To reset camera matrix
btn_restart.addEventListener("click", restartGame); 
btn_new.addEventListener("click", newGame); 
btn_help.addEventListener("click", toggleHelp); 

// Engine Config

const _fieldOfView = 60 * DegToRad;
const _zNear = 0.1;
const _zFar = 600.0;

// Engine State

var ball, newMaze; // entities
var maze = new E3D_entity("Maze", "", false);
var animations = [];


// Engine Components

var gl; // webGL canvas rendering context
timer = new E3D_timing(false, 25, timerTick);
var scn;  // E3D_scene
var resMngr = new ressourceManager(onRessource);
var meshLoader = new E3D_loader();

var inputs = new E3D_input(GLCanvas, true, false, true, false);

log("Session Start", true);
initEngine();

function winResize() {
    gl.canvas.width  = gl.canvas.offsetWidth;
    gl.canvas.height = gl.canvas.offsetHeight;
    
    log("Resize to " + gl.canvas.width + " x " + gl.canvas.height , true);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // TODO keep track of viewport in camera
    scn.camera.resize(gl.canvas.width, gl.canvas.height, _fieldOfView, _zNear, _zFar); 
    scn.camera.updateMatrix();
}

function toggleHelp() {
    div_help.style.display = (div_help.style.display != "table-row") ? "table-row" : "none";
}


var startPosition = v3_new();
var targetPosition = v3_new();

function restartGame() {

    // reset positions
    v3_copy(ball.position, startPosition);
    ball.resetMatrix();
    animations[0] = newBaseAnim(ball, _v3_null, _v3_null, 1.0, -1, true);
    animations[0].sourceCollResolver = collisionResult_asSource_slide;

    maze.rotation = v3_val_new(0, 0, 0);
    maze.resetMatrix();

    inputs.reset();

    startTime = 0;
    span_time.innerText = "Time: 00:00.00";
    span_time.style.color = "lime";

}

function newGame() {
    var size = Number(input_nb_size.value);
    if (size == NaN) {
        size = 5;
        input_nb_size.value = size;
    }

    var seed = Number(input_nb_seed.value);
    if (seed == NaN) {
        seed = (new Date()).getFullYear;
        input_nb_seed.value = seed;
    } else {
        input_nb_seed.value = seed + 1;
    }

    genMaze(size, seed);
    restartGame();
}


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

        scn = new E3D_scene("mainScene", gl, gl.canvas.width, gl.canvas.height, [0.3, 0.3, 1.0, 1.0], 300);

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
        scn.camera.moveTo(0, 350, 0, PIdiv2, 0, 0);      
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
     
  //  resMngr.addRessource("../Models/M1.raw",  "Maze", "Map");
    resMngr.addRessource("../Models/SPH.raw", "Ball", "Entity");
    resMngr.loadAll("Start");

   // genMaze(8, 2020 + seedIndex++);

    timer.run();
    //scn.state = E3D_ACTIVE;
}


const pushVect = v3_val_new(0, 10, 0);
const deltaVect = v3_new();
const speed = v3_new();

var lastPos = v3_new();
var rAngle = 0;
var rMat = m4_new();
var qRot = quat.create();
var newRot = quat.create();

// quaternions
function fromQuat(out, q) {
    var x = q[0],
        y = q[1],
        z = q[2],
        w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
  
    var xx = x * x2;
    var yx = y * x2;
    var yy = y * y2;
    var zx = z * x2;
    var zy = z * y2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
  
    out[0] = 1 - yy - zz;
    out[1] = yx + wz;
    out[2] = zx - wy;
    out[3] = 0;
  
    out[4] = yx - wz;
    out[5] = 1 - xx - zz;
    out[6] = zy + wx;
    out[7] = 0;
  
    out[8] = zx + wy;
    out[9] = zy - wx;
    out[10] = 1 - xx - yy;
    out[11] = 0;
  
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
  
    return out;
  }

  function q4_normalize(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    var len = x * x + y * y + z * z + w * w;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      out[0] = x * len;
      out[1] = y * len;
      out[2] = z * len;
      out[3] = w * len;
    }
    return out;
  }

  /**
   * https://gist.github.com/blixt/f17b47c62508be59987b
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
function Random(seed) {
    this._seed = seed % 2147483647;
    if (this._seed <= 0) this._seed += 2147483646;
  }
  
  /**
   * Returns a pseudo-random value between 1 and 2^32 - 2.
   */
  Random.prototype.next = function () {
    return this._seed = this._seed * 16807 % 2147483647;
  };
  
  
  /**
   * Returns a pseudo-random floating point number in range [0, 1).
   */
  Random.prototype.nextFloat = function (opt_minOrMax, opt_max) {
    // We know that result of next() will be 1 to 2147483646 (inclusive).
    return (this.next() - 1) / 2147483646;
  };

  Random.prototype.nextInt = function(maxInt){
        return Math.floor(maxInt * (this.next() - 1) / 2147483646);
  }

  var PRNG = new Random(2020);

function prepRender() {

    // move maze per inputs
    maze.rotateBy([inputs.rx_delta_smth, 0, -inputs.ry_delta_smth]);
    v3_clamp_mod(maze.rotation, -0.93, 0.93);
    maze.resetMatrix();    

    // Run Animations
    //cleanupDoneAnimations(animations, scn);
    collisionDetectionAnimator(animations, scn, 8);


    // create ball rotation effect
    v3_sub_res(pushVect, ball.position, lastPos);
    pushVect[1] = 0;
   // pushVect[0] = -pushVect[0];

    var xAngle = v3_length(pushVect) / -24;
    v3_cross_mod(pushVect, _v3_y);
    v3_normalize_mod(pushVect);

    span_status.innerText = justify("% ", timer.usageSmoothed.toFixed(2), 8);
   /* span_status.innerText = justify("dx", xAngle.toFixed(4), 12) + "\n" + 
    justify("x", pushVect[0].toFixed(4), 12) + "\n" +
    justify("y", pushVect[1].toFixed(4), 12) + "\n" +
    justify("z", pushVect[2].toFixed(4), 12);
*/
    quat.setAxisAngle(newRot, pushVect, xAngle);
    q4_normalize(newRot, newRot);
    quat.multiply(qRot, newRot, qRot);
  //  q4_normalize(qRot, qRot);
    fromQuat(rMat, qRot);
    //override resetMatrix();
    m4_copy(ball.normalMatrix, rMat);
    m4_copy(ball.modelMatrix, rMat);
    ball.modelMatrix[12] =  ball.position[0];
    ball.modelMatrix[13] =  ball.position[1];
    ball.modelMatrix[14] =  ball.position[2];

    v3_copy(lastPos, ball.position);



    // Timer display
    if (startTime != 0) {
        if (ball.position[1] < -50) {
            startTime = 0;
            span_time.style.color =  "red";
        } else {
            var deltaTime = new Date(Date.now() - startTime);
            span_time.innerText = "Time: " + padStart("" + deltaTime.getMinutes(), "0", 2) + ":" 
                                        + padStart("" + deltaTime.getSeconds(), "0", 2) + ":" 
                                        + padStart(""+Math.floor(deltaTime.getMilliseconds() / 10), "0", 2);
        }
    }
}
function timerTick() {  // Game Loop

    inputs.processInputs(timer.delta);
    inputs.smoothRotation(1);
    inputs.smoothPosition(1);

    // Render
    if (scn.state == E3D_ACTIVE) {
        scn.preRender();
        scn.render();
        scn.postRender();
    }   
}

function onKeyInput(event) {
    if (event.type == "mouseDown") {
        if ((startTime == 0) && (ball.position[1] >= -90)) startTime = Date.now();
    }
    //log(PRNG.nextInt(4));
}

// DFS maze generator

var mazeObj;
var mazeSize = 5;

var TopWall = 0;
var BottomWall = 1;
var LeftWall = 2;
var RightWall = 3;

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

function clamp(val, min, max) {
    if (val < min) val = min;
    if (val > max) val = max;
    return val;
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
    //mazeObj[CurrentPos[0]][CurrentPos[1]].walls[TopWall] = false; // remove top wall of first node
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

    // exit at fartest point
    //mazeObj[exitX][exitY];

    // side wall holes
    for (var i = 0; i < mazeSize/4; ++i) {
        mazeObj[0][rng.nextInt(mazeSize)].walls[LeftWall] = false;
        mazeObj[mazeSize-1][rng.nextInt(mazeSize)].walls[RightWall] = false;
        mazeObj[rng.nextInt(mazeSize)][0].walls[TopWall] = false;
        mazeObj[rng.nextInt(mazeSize)][mazeSize-1].walls[BottomWall] = false;
    }
    
    // generate maze mesh
    //wireframe layout
  /*  var newMazeWF = new E3D_entity_wireframe_canvas("newMazeWireFrame");
    var px1 = 0;
    var py1 = 0;
    var px2 = 0;
    var py2 = 0;*/
    var scale = 320 / mazeSize;
    var mid = scale * mazeSize / 2;


/*
    newMazeWF.addWireSphere([((exitX + 0.5) * scale) - mid, 0, ((exitY + 0.5) * scale) - mid], 10, _v3_green, 16, false, 1);
    newMazeWF.addWireSphere([((startX + 0.5) * scale) - mid, 0, ((startY + 0.5) * scale) - mid], 10, _v3_black, 16, false, 1);
    // gen wall lines
    for (var x = 0; x < mazeSize; ++x) for (var y = 0; y < mazeSize; ++y) {

        px1 = (scale *   x  ) - mid;
        py1 = (scale *   y  ) - mid;
        px2 = (scale * (x+1)) - mid;
        py2 = (scale * (y+1)) - mid;

        // offset walls
        px1 += 1;
        py1 += 1;
        px2 -= 1;
        py2 -= 1;

        var col = mazeObj[x][y].traceDepth / maxTraceDepth;
        if (col < 0.5) {
            col = v3_val_new(col * 2, 0, 0);
        } else {
            col = v3_val_new(1, (col - 0.5) * 2, 0);
        }
        //col = _v3_black;
        if (mazeObj[x][y].walls[TopWall]) {
            newMazeWF.addLine([px1, 0, py1], [px2, 0, py1], false, col);
            if (y == 0) newMazeWF.addLine([px1, 0, py1-2], [px2, 0, py1-2], false, col);
        }
        if (mazeObj[x][y].walls[BottomWall]) {
            newMazeWF.addLine([px1, 0, py2], [px2, 0, py2], false, col);
            if (y == mazeSize-1) newMazeWF.addLine([px1, 0, py2+2], [px2, 0, py2+2], false, col);
        }
        if (mazeObj[x][y].walls[LeftWall]) {
            newMazeWF.addLine([px1, 0, py1], [px1, 0, py2], false, col);
            if (x == 0) newMazeWF.addLine([px1-2, 0, py1], [px1-2, 0, py2], false, col);
        }
        if (mazeObj[x][y].walls[RightWall]) {
            newMazeWF.addLine([px2, 0, py1], [px2, 0, py2], false, col);
            if (x == mazeSize-1) newMazeWF.addLine([px2+2, 0, py1], [px2+2, 0, py2], false, col);
        }
    }

    //newMaze.position = v3_val_new(0, 0, 0);
    newMazeWF.visible = true;
    newMazeWF.position[1] = wallHeight;
    maze.visible = false;
    ball.visible = false;
    scn.removeEntity(newMazeWF.id, true);
    scn.addEntity(newMazeWF);
    */
   //
    // "diamond" corners mesh
    //newMaze = new E3D_entity("newMazeBaseMesh", "", false);
    meshLoader.reset();

    var scale = 320 / mazeSize;
    var mid = scale * mazeSize / 2;

    // inner horizontal walls
    for (var y = 0; y < mazeSize; ++y) {
        var py = (scale * y) - mid;  

        // top walls      
        var startPos = 0;
        while (startPos < mazeSize) { 
            if (mazeObj[startPos][y].walls[TopWall]) {
                var endPos = startPos+1;
                var startCap = !mazeObj[startPos][y].walls[LeftWall];
                while ((endPos < mazeSize) && mazeObj[endPos][y].walls[TopWall] && !mazeObj[endPos-1][y].walls[RightWall]) endPos++;
                var p1 = (scale * startPos) - mid;
                var p2 = (scale * endPos) - mid;            
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
                var p1 = (scale * startPos) - mid;
                var p2 = (scale * endPos) - mid;            
                startPos = endPos-1;
                var endCap = !mazeObj[startPos][y].walls[RightWall];
                addMazeWall([p2, 0, py + scale], [p1, 0, py + scale], endCap, startCap);
            }
            startPos++;
        }    
    }

    // bottom edge
    var py = (scale * mazeSize) - mid;
    var startPos = 0;
    while (startPos < mazeSize) { 
        if (mazeObj[startPos][mazeSize - 1].walls[BottomWall]) {
            var endPos = startPos+1;
            while ((endPos < mazeSize) && mazeObj[endPos][mazeSize - 1].walls[BottomWall]) endPos++;
            var p1 = (scale * startPos) - mid;
            var p2 = (scale * endPos) - mid;            
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
            var p1 = (scale * startPos) - mid;
            var p2 = (scale * endPos) - mid;            
            startPos = endPos-1;

            addMazeWall([p2, -baseHeight, py], [p1, -baseHeight, py], true, true, baseHeight + wallHeight);
        }
        startPos++;
    }


    // inner vertical walls
    for (var x = 0; x < mazeSize; ++x) {
        var px = (scale * x) - mid;  

        // left walls      
        var startPos = 0;
        while (startPos < mazeSize) { 
            if (mazeObj[x][startPos].walls[LeftWall]) {
                var endPos = startPos+1;
                var startCap = !mazeObj[x][startPos].walls[TopWall];
                while ((endPos < mazeSize) && mazeObj[x][endPos].walls[LeftWall] && !mazeObj[x][endPos-1].walls[BottomWall]) endPos++;
                var p1 = (scale * startPos) - mid;
                var p2 = (scale * endPos) - mid;            
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
                var p1 = (scale * startPos) - mid;
                var p2 = (scale * endPos) - mid;            
                startPos = endPos-1;
                var endCap = !mazeObj[x][startPos].walls[BottomWall];
                addMazeWall([px + scale, 0, p1], [px + scale, 0, p2], startCap, endCap);
            }
            startPos++;
        }
    }


    // right edge
    var px = (scale * mazeSize) - mid;
    var startPos = 0;
    while (startPos < mazeSize) { 
        if (mazeObj[mazeSize - 1][startPos].walls[RightWall]) {
            var endPos = startPos+1;
            while ((endPos < mazeSize) && mazeObj[mazeSize - 1][endPos].walls[RightWall]) endPos++;
            var p1 = (scale * startPos) - mid;
            var p2 = (scale * endPos) - mid;            
            startPos = endPos-1;

            addMazeWall([px, -baseHeight, p2], [px, -baseHeight, p1], true, true, baseHeight + wallHeight);
        }
        startPos++;
    }
    // left edge
    var px = - mid;
    var startPos = 0;
    while (startPos < mazeSize) { 
        if (mazeObj[0][startPos].walls[LeftWall]) {
            var endPos = startPos+1;
            while ((endPos < mazeSize) && mazeObj[0][endPos].walls[LeftWall]) endPos++;
            var p1 = (scale * startPos) - mid;
            var p2 = (scale * endPos) - mid;            
            startPos = endPos-1;

            addMazeWall([px, -baseHeight, p1], [px, -baseHeight, p2], true, true, baseHeight + wallHeight);
        }
        startPos++;
    }



    // simplify maze mesh


    
    // add base
    var pp =  320 / 2;
    var pm = -320 / 2;
    meshLoader.pushQuad4p([pp, 0, pm], [pm, 0, pm], [pm, 0, pp], [pp, 0, pp]);
    
    meshLoader.pushQuad4p([pp, 0, pp], [pm, 0, pp],  [pm, -baseHeight, pp], [pp, -baseHeight, pp]);
    meshLoader.pushQuad4p([pm, 0, pm], [pp, 0, pm],  [pp, -baseHeight, pm], [pm, -baseHeight, pm]);
    meshLoader.pushQuad4p([pm, 0, pp], [pm, 0, pm],  [pm, -baseHeight, pm], [pm, -baseHeight, pp]);
    meshLoader.pushQuad4p([pp, 0, pm], [pp, 0, pp],  [pp, -baseHeight, pp], [pp, -baseHeight, pm]);
    
    // load maze mesh to entity with CD and edges
    maze.clear();
    meshLoader.addCDFromData(maze, false);
    meshLoader.addStrokeData(maze, false, 0.5);
    meshLoader.addModelData(maze);
    
    // simplify CD
    
    // add new maze to scene
  //  scn.removeEntity(newMaze.id, true);
  //  scn.addEntity(newMaze);

    // set ball starting position

    v3_val_res(startPosition, ((startX + 0.5) * scale) - mid, wallHeight / 2, ((startY + 0.5) * scale) - mid);
    v3_val_res(targetPosition, ((exitX + 0.5) * scale) - mid, wallHeight / 2, ((exitY + 0.5) * scale) - mid);

    // set ball goal position

    // set view    
   // maze.resetMatrix();
    maze.visible = true;
    scn.removeEntity(maze.id, true);
    scn.addEntity(maze);

   // newMaze.visible = true;
   // maze.visible = false;
   // scn.removeEntity(maze.id, true);
   // maze = newMaze;
   // animations[0].target = newMaze;
   // ball.visible = false;
} 

var wallHeight = 32;
var baseHeight = 8;
var wallHalfThickness = 4;

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
    var midP = v3_avg2_new(leftP, rightP);

    meshLoader.pushTriangle3p(leftP, leftProj, midP);
    meshLoader.pushTriangle3p(leftProj, rightProj, midP);
    meshLoader.pushTriangle3p(rightProj, rightP, midP);
}

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

       /* if (resMngr.getRessourceType(name) == "Map") {
            if (name == "Maze") {
                maze = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), _v3_white, [2, 2, 2]);
                meshLoader.addCDFromData(maze);
                meshLoader.addStrokeData(maze);
                meshLoader.addModelData(maze);
                maze.visible = true;
                maze.position = v3_val_new(-20, 0, 20);
                scn.addEntity(maze);  
            }
        }*/

        if (resMngr.getRessourceType(name) == "Entity") {
            if (name == "Ball") {
                ball = new E3D_entity(name, "", false);
                meshLoader.loadModel_RAW(resMngr.getRessourcePath(name), resMngr.getData(name), [1.0, 1.0, 0.5], [12, 12, 12]);
                ball.pushCD_sph(_v3_origin, 12);
                meshLoader.smoothNormals(-0.9);
                meshLoader.addModelData(ball);
                ball.visible = true;
                //ball.position = v3_val_new(20, 50, 64);
                scn.addEntity(ball);  

                newGame();


            }
        }

    } // msg loaded
}








});