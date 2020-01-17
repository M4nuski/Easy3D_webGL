// Easy3D_WebGL
// Common engine constants and some helper methods
// Emmanuel Charette 2017-2019

"use strict"

// Animation State and commands (exclusives)
const E3D_RESET = 0; // initial, back to start and pause, animator function should build the stateData object if nec
const E3D_PLAY = 1;  // play
const E3D_PAUSE = 2; // pause
const E3D_RESTART = 3; // reset and play
const E3D_DONE = 4;

// Scene State (exclusives)
const E3D_CREATED = 0;
const E3D_READY = 1;
const E3D_ACTIVE = 2;

// Ressource Callback
const E3D_RES_FAIL = 0;
const E3D_RES_LOAD = 1;
const E3D_RES_ALL = 2;

// Pointer inputs (may be different in IE because IE)
const E3D_INP_NONE = -3;
const E3D_INP_DISABLED = -2;
const E3D_INP_ALWAYS = -1;
const E3D_INP_LMB = 0; // single touch drag
const E3D_INP_MMB = 1; // double touch pinch
const E3D_INP_RMB = 2; // double touch drag

const E3D_INP_DOUBLE_PREFIX_CODE = "dbl";

// Pointer axisesess
const E3D_INP_X = 0; // left right
const E3D_INP_Y = 1; // up down
const E3D_INP_W = 2; // mouse wheel / touch pinch

// Premade vec and mat to avoid inline creation of instances
const vec3_origin = vec3.fromValues(0, 0, 0);
const vec3_x = vec3.fromValues(1, 0, 0);
const vec3_y = vec3.fromValues(0, 1, 0);
const vec3_z = vec3.fromValues(0, 0, 1);
const vec3_nx = vec3.fromValues(-1, 0, 0);
const vec3_ny = vec3.fromValues(0, -1, 0);
const vec3_nz = vec3.fromValues(0, 0, -1);
const vec3_unit = vec3.fromValues(1, 1, 1);

const mat4_identity = mat4.create();

// Dummy containers to capture temporary results without affecting parameters
var vec3_dummy = vec3.create();
var mat4_dummy = mat4.create();

// General mathematical constants
const PIdiv2 = Math.PI / 2.0;
const PIx2 = Math.PI * 2.0;

const RadToDeg = (180.0 / Math.PI);
const DegToRad = (Math.PI / 180.0);

function rndPM(val) { // random between plus or minus "val"
    return (2*val*Math.random()) - val;
}
function rndInt(val) { // integer random between 0 and val-1
    return Math.floor(Math.random() * val);
}

function add3f(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
}
function copy3fArray(a) {
    var r = Array(a.length);
    for (var i = 0; i< a.length; ++i) {
        r[i] = a[i].slice();
    }
    return r;
}

