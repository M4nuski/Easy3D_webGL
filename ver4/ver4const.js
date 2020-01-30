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
const _v3_origin = [ 0,  0,  0];
const _v3_x =      [ 1,  0,  0];
const _v3_y =      [ 0,  1,  0];
const _v3_z =      [ 0,  0,  1];
const _v3_nx =     [-1,  0,  0];
const _v3_ny =     [ 0, -1,  0];
const _v3_nz =     [ 0,  0, -1];
const _v3_unit =   [ 1,  1,  1];

const mat4_identity = mat4.create(); 

/*
// Dummy containers to capture temporary results without affecting parameters
var vec3_dummy = vec3.create();
var mat4_dummy = mat4.create();
*/

// General mathematical constants
const PIdiv2 = Math.PI / 2.0;
const PIx2 = Math.PI * 2.0;

const RadToDeg = (180.0 / Math.PI);
const DegToRad = (Math.PI / 180.0);

// Randoms
function rndPM(val) { // random between plus or minus "val"
    return (2*val*Math.random()) - val;
}
function rndInt(val) { // integer random between 0 and val-1
    return Math.floor(Math.random() * val);
}

// Strings
function padStart(str, pad, len) {
    if (pad.length < 1) return str;
    while (str.length < len) str = pad[0] + str; 
    return str;
}
function padEnd(str, pad, len) {
    if (pad.length < 1) return str;
    while (str.length < len) str = str + pad[0]; 
    return str;
}


// Arrays of 3 floats
/*
function add3f(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2] ];
}
function add3f3fm(dest, a) {
    dest[0] = dest[0] + a[0];
    dest[1] = dest[1] + a[1];
    dest[2] = dest[2] + a[2];
}
function sub3f(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2] ];
}
*/

function v3_new() { return [ 0.0, 0.0, 0.0 ]; }
function v3_val(x, y, z) { return [ x, y, z ]; } // syntaxtic sugar

function v3_clone(a) {
    return [ a[0], a[1], a[2] ];
}
function v3_copy(res, a) {
    res[0] = a[0];
    res[1] = a[1];
    res[2] = a[2];
}



function v3_sub_new(a, b) {
    return [ a[0] - b[0],
             a[1] - b[1],
             a[2] - b[2] ];
}
function v3_sub_mod(a, b) {
    a[0] = a[0] - b[0];
    a[1] = a[1] - b[1];
    a[2] = a[2] - b[2];
}
function v3_sub_res(res, a, b) {
    res[0] = a[0] - b[0];
    res[1] = a[1] - b[1];
    res[2] = a[2] - b[2];
}

function v3_subsub_new(a, b, c) {
    return [ a[0] - b[0] - c[0],
             a[1] - b[1] - c[1],
             a[2] - b[2] - c[2] ];
}
function v3_subsub_mod(a, b, c) {
    a[0] = a[0] - b[0] - c[0];
    a[1] = a[1] - b[1] - c[1];
    a[2] = a[2] - b[2] - c[2];
}
function v3_subsub_res(res, a, b, c) {
    res[0] = a[0] - b[0] - c[0];
    res[1] = a[1] - b[1] - c[1];
    res[2] = a[2] - b[2] - c[2];
}



function v3_add_new(a, b) {
    return [ a[0] + b[0],
             a[1] + b[1],
             a[2] + b[2] ];
}
function v3_add_mod(a, b) {
    a[0] = a[0] + b[0];
    a[1] = a[1] + b[1];
    a[2] = a[2] + b[2];
}
function v3_add_res(res, a, b) {
    res[0] = a[0] + b[0];
    res[1] = a[1] + b[1];
    res[2] = a[2] + b[2];
}

function v3_addadd_new(a, b, c) {
    return [ a[0] + b[0] + c[0],
             a[1] + b[1] + c[1],
             a[2] + b[2] + c[2] ];
}
function v3_addadd_mod(a, b, c) {
    a[0] = a[0] + b[0] + c[0];
    a[1] = a[1] + b[1] + c[1];
    a[2] = a[2] + b[2] + c[2];
}
function v3_addadd_res(res, a, b, c) {
    res[0] = a[0] + b[0] + c[0];
    res[1] = a[1] + b[1] + c[1];
    res[2] = a[2] + b[2] + c[2];
}



function v3_addscaled_new(a, b, f) {
    return [ a[0] + (b[0] * f),
             a[1] + (b[1] * f),
             a[2] + (b[2] * f) ];
}
function v3_addscaled_mod(a, b, f) {
    a[0] = a[0] + (b[0] * f);
    a[1] = a[1] + (b[1] * f);
    a[2] = a[2] + (b[2] * f);
}
function v3_addscaled_res(res, a, b, f) {
    res[0] = a[0] + (b[0] * f);
    res[1] = a[1] + (b[1] * f);
    res[2] = a[2] + (b[2] * f);
}



function v3_scale_new(a, f) {
    return [ a[0] * f,
             a[1] * f,
             a[2] * f ];
}
function v3_scale_mod(a, f) {
    a[0] = a[0] * f;
    a[1] = a[1] * f;
    a[2] = a[2] * f;
}
function v3_scale_res(res, a, f) {
    res[0] = a[0] * f;
    res[1] = a[1] * f;
    res[2] = a[2] * f;
}

function v3_invscale_new(a, f) {
    return [ a[0] / f,
             a[1] / f,
             a[2] / f ];
}
function v3_invscale_mod(a, f) {
    a[0] = a[0] / f;
    a[1] = a[1] / f;
    a[2] = a[2] / f;
}
function v3_invscale_res(res, a, f) {
    res[0] = a[0] / f;
    res[1] = a[1] / f;
    res[2] = a[2] / f;
}

function v3_negate_new(a) {
    return [ -a[0],
             -a[1],
             -a[2] ];
}
function v3_negate_mod(a) {
    a[0] = -a[0];
    a[1] = -a[1];
    a[2] = -a[2];
}
function v3_negate_res(res, a) {
    res[0] = -a[0];
    res[1] = -a[1];
    res[2] = -a[2];
}



function v3_div_new(a, b) {
    return [ a[0] / b[0],
             a[1] / b[1],
             a[2] / b[2] ];
}
function v3_div_mod(a, b) {
    a[0] = a[0] / b[0];
    a[1] = a[1] / b[1];
    a[2] = a[2] / b[2];
}
function v3_div_res(res, a, b) {
    res[0] = a[0] / b[0];
    res[1] = a[1] / b[1];
    res[2] = a[2] / b[2];
}


function v3_mult_new(a, b) {
    return [ a[0] * b[0],
             a[1] * b[1],
             a[2] * b[2] ];
}
function v3_mult_mod(a, b) {
    a[0] = a[0] * b[0];
    a[1] = a[1] * b[1];
    a[2] = a[2] * b[2];
}
function v3_mult_res(res, a, b) {
    res[0] = a[0] * b[0];
    res[1] = a[1] * b[1];
    res[2] = a[2] * b[2];
}


function v3_lerp_new(a, b, f) {
    return [ a[0] = a[0] + f * (b[0] - a[0]),
             a[1] = a[1] + f * (b[1] - a[1]),
             a[2] = a[2] + f * (b[2] - a[2]) ];
}
function v3_lerp_mod(a, b, f) {
    a[0] = a[0] + f * (b[0] - a[0]);
    a[1] = a[1] + f * (b[1] - a[1]);
    a[2] = a[2] + f * (b[2] - a[2]);
}
function v3_lerp_res(res, a, b, f) {
    res[0] = a[0] + f * (b[0] - a[0]);
    res[1] = a[1] + f * (b[1] - a[1]);
    res[2] = a[2] + f * (b[2] - a[2]);
}



function v3_dot(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}

function v3_cross_new(a, b) { 
    var r =  [0, 0, 0];    
    r[0] = a[1] * b[2] - a[2] * b[1];
    r[1] = a[2] * b[0] - a[0] * b[2];
    r[2] = a[0] * b[1] - a[1] * b[0];
    return r;
}
function v3_cross_mod(a, b) { 
    var a0 = a[0], a1 = a[1], a2 = a[2];
    a[0] = a1 * b[2] - a2 * b[1];
    a[1] = a2 * b[0] - a0 * b[2];
    a[2] = a0 * b[1] - a1 * b[0];
}

function v3_cross_res(res, a, b) { 
    res[0] = a[1] * b[2] - a[2] * b[1];
    res[1] = a[2] * b[0] - a[0] * b[2];
    res[2] = a[0] * b[1] - a[1] * b[0];
}

function v3_normalize_new(a) {
    var l = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    if (l > 0.0) {
        l = Math.sqrt(l);
        return [ 
        a[0] / l,
        a[1] / l,
        a[2] / l ];
    } else return [0, 0, 0];
}
function v3_normalize_mod(a) {
    var l = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    if (l > 0.0) {
        l = Math.sqrt(l);
        a[0] = a[0] / l;
        a[1] = a[1] / l;
        a[2] = a[2] / l;
    }
}
function v3_normalize_res(res, a) {
    var l = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    if (l > 0.0) {
        l = Math.sqrt(l);
        res[0] = a[0] / l;
        res[1] = a[1] / l;
        res[2] = a[2] / l;
    } else {
        res[0] = a[0];
        res[1] = a[1];
        res[2] = a[2];
    }
}

function v3_length(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}
function v3_lengthsquared(a) {
    return (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

function v3_distance(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    var dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
function v3_distancesquared(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    var dz = a[2] - b[2];
    return (dx * dx + dy * dy + dz * dz);
}



function v3_reflect_mod(inc, norm) {
    var dr2 = 2.0 * (inc[0] * norm[0] + inc[1] * norm[1] + inc[2] * norm[2]);
    inc[0] = inc[0] - (norm[0] * dr2); 
    inc[1] = inc[1] - (norm[1] * dr2);
    inc[2] = inc[2] - (norm[2] * dr2);
}
function v3_reflect_new(inc, norm) {
    var dr2 = 2.0 * (inc[0] * norm[0] + inc[1] * norm[1] + inc[2] * norm[2]);
    return [ inc[0] - (norm[0] * dr2), 
             inc[1] - (norm[1] * dr2), 
             inc[2] - (norm[2] * dr2) ];
}
function v3_reflect_res(result, inc, norm) {
    var dr2 = 2.0 * (inc[0] * norm[0] + inc[1] * norm[1] + inc[2] * norm[2]);
    result[0] = inc[0] - (norm[0] * dr2); 
    result[1] = inc[1] - (norm[1] * dr2);
    result[2] = inc[2] - (norm[2] * dr2);
}


function v3_rotateX_mod(a, ang) {
    let ny = a[1] * Math.cos(ang) - a[2] * Math.sin(ang);
    let nz = a[1] * Math.sin(ang) + a[2] * Math.cos(ang);
    a[1] = ny;
    a[2] = nz;
}
function v3_rotateX_new(a, ang) {
    return [ a[0],
             a[1] * Math.cos(ang) - a[2] * Math.sin(ang),
             a[1] * Math.sin(ang) + a[2] * Math.cos(ang) ];
}
function v3_rotateX_res(res, a, ang) {
    res[0] = a[0];
    res[1] = a[1] * Math.cos(ang) - a[2] * Math.sin(ang);
    res[2] = a[1] * Math.sin(ang) + a[2] * Math.cos(ang);
}

function v3_rotateY_mod(a, ang) {
    let nx = a[2] * Math.sin(ang) + a[0] * Math.cos(ang);
    let nz = a[2] * Math.cos(ang) - a[0] * Math.sin(ang);
    a[0] = nx;
    a[2] = nz;
}
function v3_rotateY_new(a, ang) {
    return [ a[2] * Math.sin(ang) + a[0] * Math.cos(ang),
             a[1],
             a[2] * Math.cos(ang) - a[0] * Math.sin(ang) ];
}
function v3_rotateY_res(res, a, ang) {
    res[0] = a[2] * Math.sin(ang) + a[0] * Math.cos(ang);
    res[1] = a[1];
    res[2] = a[2] * Math.cos(ang) - a[0] * Math.sin(ang);
}

function v3_rotateZ_mod(a, ang) {
    let nx = a[0] * Math.cos(ang) - a[1] * Math.sin(ang);
    let ny = a[0] * Math.sin(ang) + a[1] * Math.cos(ang);
    a[0] = nx;
    a[1] = ny;
}
function v3_rotateZ_new(a, ang) {
    return [ a[0] * Math.cos(ang) - a[1] * Math.sin(ang),
             a[0] * Math.sin(ang) + a[1] * Math.cos(ang),
             a[2] ];
}
function v3_rotateZ_res(res, a, ang) {
    res[0] = a[0] * Math.cos(ang) - a[1] * Math.sin(ang);
    res[1] = a[0] * Math.sin(ang) + a[1] * Math.cos(ang);
    res[2] = a[2];
}
/*
function sub3ff(a, b, c) {
    return [a[0] - b[0] - c[0], a[1] - b[1] - c[1], a[2] - b[2] - c[2]];
}
function scale3f(a, f) {
    return [a[0] * f, a[1] * f, a[2] * f];
}
function scale3fm(dest, f) {
    dest[0] = dest[0] * f;
    dest[1] = dest[1] * f;
    dest[2] = dest[2] * f;
}
function scaleAndAdd3f(a, b, f) {
    return [a[0] + (b[0] * f), a[1] + (b[1] * f), a[2] + (b[2] * f)];
}
function scaleAndAdd3fm(a, b, f) {
    a[0] = a[0] + (b[0] * f);
    a[1] = a[1] + (b[1] * f);
    a[2] = a[2] + (b[2] * f);
}
function scaleAndSub3f(a, b, f) {
    return [a[0] - (b[0] * f), a[1] - (b[1] * f), a[2] - (b[2] * f)];
}
*/

function v3a_clone(a) {
    var res = new Array(a.length);
    for (var i = 0; i < a.length; ++i) res[i] = [ a[i][0],  a[i][1],  a[i][2] ];
    return res;
}
function v3a_copy(res, a) {
    for (var i = 0; i < a.length; ++i) res[i] = [ a[i][0],  a[i][1],  a[i][2] ];
    return res;
}










function v3_applym4_new(a, m) {
    var res = [0, 0, 0];
    var w =   m[3] * a[0] + m[7] * a[1] + m[11] * a[2] + m[15];
    w = w || 1.0;
    res[0] = (m[0] * a[0] + m[4] * a[1] + m[8]  * a[2] + m[12]) / w;
    res[1] = (m[1] * a[0] + m[5] * a[1] + m[9]  * a[2] + m[13]) / w;
    res[2] = (m[2] * a[0] + m[6] * a[1] + m[10] * a[2] + m[14]) / w;
    return res;
}
function v3_applym4_res(res, a, m) {
    var w =   m[3] * a[0] + m[7] * a[1] + m[11] * a[2] + m[15];
    w = w || 1.0;
    res[0] = (m[0] * a[0] + m[4] * a[1] + m[8]  * a[2] + m[12]) / w;
    res[1] = (m[1] * a[0] + m[5] * a[1] + m[9]  * a[2] + m[13]) / w;
    res[2] = (m[2] * a[0] + m[6] * a[1] + m[10] * a[2] + m[14]) / w;
}
function v3_applym4_mod(a, m) {
    var w = m[3] * a[0] + m[7] * a[1] + m[11] * a[2] + m[15];
    w = w || 1.0;
    a[0] = (m[0] * a[0] + m[4] * a[1] + m[8]  * a[2] + m[12]) / w;
    a[1] = (m[1] * a[0] + m[5] * a[1] + m[9]  * a[2] + m[13]) / w;
    a[2] = (m[2] * a[0] + m[6] * a[1] + m[10] * a[2] + m[14]) / w;
}



function m4_new(){
    var m = new Array(16);
    m[0] =  1;        m[1] =  0;        m[2] =  0;       m[3] =  0;
    m[4] =  0;        m[5] =  1;        m[6] =  0;       m[7] =  0;
    m[8] =  0;        m[9] =  0;        m[10] = 1;       m[11] = 0;
    m[12] = 0;        m[13] = 0;        m[14] = 0;       m[15] = 1;
    return m;      
}
function m4_clone(a){
    var m = new Array(16);
    m[0] =  a[0];        m[1] =  a[1];        m[2] =  a[2];       m[3] =  a[3];
    m[4] =  a[4];        m[5] =  a[5];        m[6] =  a[6];       m[7] =  a[7];
    m[8] =  a[8];        m[9] =  a[9];        m[10] = a[10];      m[11] = a[11];
    m[12] = a[12];       m[13] = a[13];       m[14] = a[14];      m[15] = a[15];
    return m;      
}
function m4_copy(res, a){
    res[0] =  a[0];        res[1] =  a[1];        res[2] =  a[2];       res[3] =  a[3];
    res[4] =  a[4];        res[5] =  a[5];        res[6] =  a[6];       res[7] =  a[7];
    res[8] =  a[8];        res[9] =  a[9];        res[10] = a[10];      res[11] = a[11];
    res[12] = a[12];       res[13] = a[13];       res[14] = a[14];      res[15] = a[15];
}
function m4_reset(a){
    a[0] =  1;        a[1] =  0;        a[2] =  0;       a[3] =  0;
    a[4] =  0;        a[5] =  1;        a[6] =  0;       a[7] =  0;
    a[8] =  0;        a[9] =  0;        a[10] = 1;       a[11] = 0;
    a[12] = 0;        a[13] = 0;        a[14] = 0;       a[15] = 1;    
}

// m4_rotateX
// m4_rotateY
// m4_rotateZ
// m4_rotate
// m4_translate
// m4_scale
// m4_invert
// m4_ortho
// m4_persp

function m4_transpose_mod(a) {
    var a1 = a[1], a2 = a[2], a3 = a[3], a6 = a[6], a7 = a[7], a11 = a[11];

    a[1] = a[4];
    a[2] = a[8];
    a[3] = a[12];
    a[4] = a1;

    a[6] = a[9];
    a[7] = a[13];
    a[8] = a2;
    a[9] = a6;

    a[11] = a[14];
    a[12] = a3;
    a[13] = a7;
    a[14] = a11;
}
function m4_transpose_res(res, a) {    
   res[0] = a[0];
   res[1] = a[4];
   res[2] = a[8];
   res[3] = a[12];
   res[4] = a[1];
   res[5] = a[5];
   res[6] = a[9];
   res[7] = a[13];
   res[8] = a[2];
   res[9] = a[6];
   res[10] = a[10];
   res[11] = a[14];
   res[12] = a[3];
   res[13] = a[7];
   res[14] = a[11];
   res[15] = a[15];
}
function m4_transpose_new(a) {    
    var m = new Array(16);
    m[0] = a[0];
    m[1] = a[4];
    m[2] = a[8];
    m[3] = a[12];
    m[4] = a[1];
    m[5] = a[5];
    m[6] = a[9];
    m[7] = a[13];
    m[8] = a[2];
    m[9] = a[6];
    m[10] = a[10];
    m[11] = a[14];
    m[12] = a[3];
    m[13] = a[7];
    m[14] = a[11];
    m[15] = a[15];
    return m;
 }

// TODO m4_---

/*
//function v3a_clone(a)
function copy3fArray(a) {
    var r = Array(a.length);
    for (var i = 0; i < a.length; ++i) {
        r[i] = [0, 0, 0];
        r[i][0] = a[i][0];
        r[i][1] = a[i][1];
        r[i][2] = a[i][2];
    }
    return r;
}

//function v3a_copy(dest, a)
function copy3fArraym(dest, a) {
    for (var i = 0; i < a.length; ++i) {
        dest[i][0] = a[i][0];
        dest[i][1] = a[i][1];
        dest[i][2] = a[i][2];
    }
}

function copy3f3fm(dest, a) {    
    dest[0] = a[0];
    dest[1] = a[1];
    dest[2] = a[2];
}
function copy3f3fr(a) {
    return [ a[0], a[1], a[2] ];
}

function copy3f3fn(dest, a) {
    dest = [ a[0], a[1], a[2] ];
}

function invScale3f1fm(a, f) {
    a[0] = a[0] / f;
    a[1] = a[1] / f;
    a[2] = a[2] / f;
}
*/

