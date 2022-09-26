// Easy3D_WebGL
// Math heleprs
// 3D vectors (v3) and 4x4 matrix (m4) methods
// Modified version of gl-matrix.js by Brandon Jones and Colin MacKenzie IV version 2.4.0 (see notice below)
// Uses faster vanilla array, most methods have 3 version suffixes:
//      _new returns a new object: add(a, b) -> return new (a + b)
//      _mod modifies the first parameter object: add(a, b) -> a = a + b
//      _res writes the result in the supplied object: add(r, a, b) -> r = a + b

// Emmanuel Charette 2017-2020

/* Copyright (c) 2015, Brandon Jones, Colin MacKenzie IV.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

"use strict"


// General mathematical constants
const PIdiv2 = Math.PI / 2.0;
const PIx2 = Math.PI * 2.0;

const RadToDeg = (180.0 / Math.PI);
const DegToRad = (Math.PI / 180.0);

const g_iss = 386.1;
const g_fss = 32.2;
const g_mss = 9.81;

// Premade v3 and m4 to avoid inline creation of instances
const _v3_origin = [ 0,  0,  0];
const _v3_null =   [ 0,  0,  0];
const _v3_x =      [ 1,  0,  0];
const _v3_y =      [ 0,  1,  0];
const _v3_z =      [ 0,  0,  1];
const _v3_nx =     [-1,  0,  0];
const _v3_ny =     [ 0, -1,  0];
const _v3_nz =     [ 0,  0, -1];
const _v3_unit =   [ 1,  1,  1];
const _v3_nunit =  [-1, -1, -1];

const _v3_90x    = [ PIdiv2, 0, 0];
const _v3_90y    = [ 0, PIdiv2, 0];
const _v3_90z    = [ 0, 0, PIdiv2];
const _v3_n90x    = [-PIdiv2, 0, 0];
const _v3_n90y    = [ 0,-PIdiv2, 0];
const _v3_n90z    = [ 0, 0,-PIdiv2];

const _v3_epsilon = 0.00001;

const _m4_identity = m4_new(); 

// Colors
const _v3_white      = [ 1.0,  1.0,  1.0];
const _v3_black      = [ 0.0,  0.0,  0.0];
const _v3_red        = [ 1.0,  0.0,  0.0];
const _v3_lightred   = [ 1.0,  0.5,  0.5];
const _v3_darkred    = [ 0.5,  0.0,  0.0];
const _v3_green      = [ 0.0,  1.0,  0.0];
const _v3_lightgreen = [ 0.5,  1.0,  0.5];
const _v3_darkgreen  = [ 0.0,  0.5,  0.0];
const _v3_blue       = [ 0.0,  0.0,  1.0];
const _v3_lightblue  = [ 0.5,  0.5,  1.0];
const _v3_darkblue   = [ 0.0,  0.0,  0.5];
const _v3_cyan       = [ 0.0,  1.0,  1.0];
const _v3_magenta    = [ 1.0,  0.0,  1.0];
const _v3_yellow     = [ 1.0,  1.0,  0.0];
const _v3_orange     = [ 1.0,  0.5,  0.0];
const _v3_gray       = [ 0.50,  0.50,  0.50];
const _v3_lightgray  = [ 0.75,  0.75,  0.75];
const _v3_darkgray   = [ 0.25,  0.25,  0.25];



// Randoms
function randomFloatPlusMinus(val) { // random float between plus and minus "val" inclusive
    return ( 2.0 * val * Math.random() ) - val;
}
function randomInteger(val) { // random integer between 0 and val-1
    return Math.floor( Math.random() * val );
}

// Seeded RNG based on https://gist.github.com/blixt/f17b47c62508be59987b
class Random {
    constructor(seed) {
        this._seed = seed % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
    }
    // Returns a pseudo-random value between 1 and 2^32 - 2.
    next() {
        return this._seed = this._seed * 16807 % 2147483647;
    }
    // Returns a pseudo-random floating point number in range [0.0, 1.0-epsilon].
    nextFloat() {        
        return (this.next() - 1) / 2147483646; // We know that result of next() will be 1 to 2147483646 (inclusive).
    }
    // Returns a pseudo-random integer in range [0, maxInt-1].
    nextInt(maxInt) {
        return Math.floor(maxInt * (this.next() - 1) / 2147483646);
    }
}
  
  
 // Clamping
function clamp(val, min, max) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

function clampPlusMinus(val, limit) {
    if (val < -limit) return -limit;
    if (val >  limit) return  limit;
    return val;
}



// v3, 3 axis vector as array of floats

// Create new vector
function v3_new() { return [ 0.0, 0.0, 0.0 ]; }

// Vector from values
function v3_val_new(x, y, z) { return [ x, y, z ]; } 

function v3_val_res(res, x, y, z) { res[0] = x; res[1] = y; res[2] = z; } 

// Return new vector equal to argument
function v3_clone(a) {
    return [ a[0], a[1], a[2] ];
}

// Copy vector content to other vector
function v3_copy(res, a) {
    res[0] = a[0];
    res[1] = a[1];
    res[2] = a[2];
}

function v3_equals(a, b, epsilon = _v3_epsilon) {
    return (Math.abs(a[0] - b[0]) < epsilon) && (Math.abs(a[1] - b[1]) < epsilon) && (Math.abs(a[2] - b[2]) < epsilon);
}

// Clamp each components to min and max
function v3_clamp_new(a, min, max) {
    var res = v3_clone(a);
    if (res[0] < min) res[0] = min;
    if (res[0] > max) res[0] = max;
    if (res[1] < min) res[1] = min;
    if (res[1] > max) res[1] = max;
    if (res[2] < min) res[2] = min;
    if (res[2] > max) res[2] = max;
    return res;
}
function v3_clamp_mod(a, min, max) {
    if (a[0] < min) a[0] = min;
    if (a[0] > max) a[0] = max;
    if (a[1] < min) a[1] = min;
    if (a[1] > max) a[1] = max;
    if (a[2] < min) a[2] = min;
    if (a[2] > max) a[2] = max;
}
function v3_clamp_res(res, a, min, max) {
    v3_copy(res, a);
    if (res[0] < min) res[0] = min;
    if (res[0] > max) res[0] = max;
    if (res[1] < min) res[1] = min;
    if (res[1] > max) res[1] = max;
    if (res[2] < min) res[2] = min;
    if (res[2] > max) res[2] = max;
}


// Vector subtractions
// = a + b
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

// Double subtraction
// = a - b - c
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


// Vector addition
// = a + b
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

// Double vector addition
// = a + b + c
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

// Triple vector addition
function v3_addaddadd_new(a, b, c, d) {
    return [ a[0] + b[0] + c[0] + d[0],
             a[1] + b[1] + c[1] + d[1],
             a[2] + b[2] + c[2] + d[2] ];
}

// Add scaled vector
// = a + (b * f)
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

function v3_addaddscaled_new(a, b, c, f) {
    return [ a[0] + b[0] + (c[0] * f),
             a[1] + b[1] + (c[1] * f),
             a[2] + b[2] + (c[2] * f) ];
}

// Scale vector
// = a * f
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


// Inverse of scale, division
// = a / f
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


// Negate vector 
// = -a
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


// Divide, component-wise
// = a / b
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

// Multiply, component-wise
// = a * b
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


// Linear interpolation
// = a + (f * (b - a))
function v3_lerp_new(a, b, f) {
    return [ a[0] + f * (b[0] - a[0]),
             a[1] + f * (b[1] - a[1]),
             a[2] + f * (b[2] - a[2]) ];
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


// Dot product: a (.*) b
function v3_dot(a, b) {
    return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
}
// Dot product: (point - origin) (.*) normal 
function v3_offset_dot(point, origin, normal) {
    return ((point[0] - origin[0]) * normal[0]) + ((point[1] - origin[1]) * normal[1]) + ((point[2] - origin[2]) * normal[2]);
}

// Cross product
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

function v3_angle(a, b) {
    var na = v3_normalize_new(a);
    var nb = v3_normalize_new(b);

    var cosine = v3_dot(na, nb);
  
    if (cosine > 1.0) {
      return 0;
    } else if (cosine < -1.0) {
      return Math.PI;
    } else {
      return Math.acos(cosine);
    }
}

// Vector normalisation
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

// Generate normal from 3 points
var __v3_normal_p21 = v3_new();
var __v3_normal_p31 = v3_new();

function v3_normal_new(p1, p2, p3) {        
    var n = v3_new();

    v3_sub_res(__v3_normal_p21, p2, p1);
    v3_sub_res(__v3_normal_p31, p3, p1);
    v3_cross_res(n, __v3_normal_p21, __v3_normal_p31);
    v3_normalize_mod(n);

    return n;
}
function v3_normal_res(res, p1, p2, p3) {        
    v3_sub_res(__v3_normal_p21, p2, p1);
    v3_sub_res(__v3_normal_p31, p3, p1);
    v3_cross_res(res, __v3_normal_p21, __v3_normal_p31);
    v3_normalize_mod(res);
}


// Vector length
function v3_length(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}
function v3_lengthsquared(a) {
    return (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

function v3_lengthXY(a) {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1]);
}
function v3_lengthXYsquared(a) {
    return (a[0] * a[0] + a[1] * a[1]);
}

function v3_lengthXZ(a) {
    return Math.sqrt(a[0] * a[0] + a[2] * a[2]);
}
function v3_lengthXZsquared(a) {
    return (a[0] * a[0] + a[2] * a[2]);
}

function v3_lengthYZ(a) {
    return Math.sqrt(a[1] * a[1] + a[2] * a[2]);
}
function v3_lengthYZsquared(a) {
    return (a[1] * a[1] + a[2] * a[2]);
}

// Vector distance
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

function v3_distanceXY(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return Math.sqrt(dx * dx + dy * dy);
}
function v3_distanceXYsquared(a, b) {
    var dx = a[0] - b[0];
    var dy = a[1] - b[1];
    return (dx * dx + dy * dy);
}

function v3_distanceXZ(a, b) {
    var dx = a[0] - b[0];
    var dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dz * dz);
}
function v3_distanceXZsquared(a, b) {
    var dx = a[0] - b[0];
    var dz = a[2] - b[2];
    return (dx * dx + dz * dz);
}

function v3_distanceYZ(a, b) {
    var dy = a[1] - b[1];
    var dz = a[2] - b[2];
    return Math.sqrt(dy * dy + dz * dz);
}
function v3_distanceYZsquared(a, b) {
    var dy = a[1] - b[1];
    var dz = a[2] - b[2];
    return (dy * dy + dz * dz);
}


// Reflect incident vector per normal
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


// Rotate vector aound X
function v3_rotateX_mod(a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    let ny = a[1] * c - a[2] * s;
    let nz = a[1] * s + a[2] * c;
    a[1] = ny;
    a[2] = nz;
}
function v3_rotateX_new(a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    return [ a[0],
             a[1] * c - a[2] * s,
             a[1] * s + a[2] * c ];
}
function v3_rotateX_res(res, a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    res[0] = a[0];
    res[1] = a[1] * c - a[2] * s;
    res[2] = a[1] * s + a[2] * c;
}


// Rotate vector around Y
function v3_rotateY_mod(a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    let nx = a[2] * s + a[0] * c;
    let nz = a[2] * c - a[0] * s;
    a[0] = nx;
    a[2] = nz;
}
function v3_rotateY_new(a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    return [ a[2] * s + a[0] * c,
             a[1],
             a[2] * c - a[0] * s ];
}
function v3_rotateY_res(res, a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    res[0] = a[2] * s + a[0] * c;
    res[1] = a[1];
    res[2] = a[2] * c - a[0] * s;
}


// Rotate vector around Z
function v3_rotateZ_mod(a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    let nx = a[0] * c - a[1] * s;
    let ny = a[0] * s + a[1] * c;
    a[0] = nx;
    a[1] = ny;
}
function v3_rotateZ_new(a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    return [ a[0] * c - a[1] * s,
             a[0] * s + a[1] * c,
             a[2] ];
}

function v3_rotateZ_res(res, a, ang) {
    var c = Math.cos(ang);
    var s = Math.sin(ang);
    res[0] = a[0] * c - a[1] * s;
    res[1] = a[0] * s + a[1] * c;
    res[2] = a[2];
}


// Average of 2 v3 (middle)
function v3_avg2_mod(a, b) {
    a[0] = (a[0] + b[0]) / 2.0;
    a[1] = (a[1] + b[1]) / 2.0;
    a[2] = (a[2] + b[2]) / 2.0;
}
function v3_avg2_new(a, b) {
    return [
    (a[0] + b[0]) / 2.0,
    (a[1] + b[1]) / 2.0,
    (a[2] + b[2]) / 2.0
    ];
}
function v3_avg2_res(res, a, b) {
    res[0] = (a[0] + b[0]) / 2.0;
    res[1] = (a[1] + b[1]) / 2.0;
    res[2] = (a[2] + b[2]) / 2.0;
}


// Normalized Average of 2 v3
function v3_avg2normalized_new(a, b) {
    var x = (a[0] + b[0]) / 2.0;
    var y = (a[1] + b[1]) / 2.0;
    var z = (a[2] + b[2]) / 2.0;
    var l = x * x + y * y + z * z;
    if (l > 0.0) {
        l = Math.sqrt(l);
        return [ 
            x / l,
            y / l,
            z / l 
        ];
    } else return [0, 0, 0];
}

function v3_avg2normalized_mod(a, b) {
    a[0] = (a[0] + b[0]) / 2.0;
    a[1] = (a[1] + b[1]) / 2.0;
    a[2] = (a[2] + b[2]) / 2.0;
    var l = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    if (l > 0.0) {
        l = Math.sqrt(l);
        a[0] /= l;
        a[1] /= l;
        a[2] /= l;
    } else a = [0, 0, 0];
}

function v3_avg2normalized_res(res, a, b) {
    res[0] = (a[0] + b[0]) / 2.0;
    res[1] = (a[1] + b[1]) / 2.0;
    res[2] = (a[2] + b[2]) / 2.0;
    var l = res[0] * res[0] + res[1] * res[1] + res[2] * res[2];
    if (l > 0.0) {
        l = Math.sqrt(l);
        res[0] /= l;
        res[1] /= l;
        res[2] /= l;
    } else res = [0, 0, 0];
}


// Average of 3 v3
function v3_avg3_mod(a, b, c) {
    a[0] = (a[0] + b[0] + c[0]) / 3.0;
    a[1] = (a[1] + b[1] + c[1]) / 3.0;
    a[2] = (a[2] + b[2] + c[2]) / 3.0;
}
function v3_avg3_new(a, b, c) {
    return [
    (a[0] + b[0] + c[0]) / 3.0,
    (a[1] + b[1] + c[1]) / 3.0,
    (a[2] + b[2] + c[2]) / 3.0
    ];
}
function v3_avg3_res(res, a, b, c) {
    res[0] = (a[0] + b[0] + c[0]) / 3.0;
    res[1] = (a[1] + b[1] + c[1]) / 3.0;
    res[2] = (a[2] + b[2] + c[2]) / 3.0;
}

// Normalized Average of 3 v3
function v3_avg3normalized_new(a, b, c) {
    var x = (a[0] + b[0] + c[0]) / 3.0;
    var y = (a[1] + b[1] + c[1]) / 3.0;
    var z = (a[2] + b[2] + c[2]) / 3.0;
    var l = x * x + y * y + z * z;
    if (l > 0.0) {
        l = Math.sqrt(l);
        return [ 
            x / l,
            y / l,
            z / l 
        ];
    } else return [0, 0, 0];
}

function v3_avg3normalized_mod(a, b, c) {
    a[0] = (a[0] + b[0] + c[0]) / 3.0;
    a[1] = (a[1] + b[1] + c[1]) / 3.0;
    a[2] = (a[2] + b[2] + c[2]) / 3.0;
    var l = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    if (l > 0.0) {
        l = Math.sqrt(l);
        a[0] /= l;
        a[1] /= l;
        a[2] /= l;
    } else a = [0, 0, 0];
}

function v3_avg3normalized_res(res, a, b, c) {
    res[0] = (a[0] + b[0] + c[0]) / 3.0;
    res[1] = (a[1] + b[1] + c[1]) / 3.0;
    res[2] = (a[2] + b[2] + c[2]) / 3.0;
    var l = res[0] * res[0] + res[1] * res[1] + res[2] * res[2];
    if (l > 0.0) {
        l = Math.sqrt(l);
        res[0] /= l;
        res[1] /= l;
        res[2] /= l;
    } else res = [0, 0, 0];
}


// random noise
function v3_addv3noise_new(a, range) {
    return [
        a[0] + randomFloatPlusMinus(range[0]),
        a[1] + randomFloatPlusMinus(range[1]),
        a[2] + randomFloatPlusMinus(range[2])
    ];
}
function v3_addv3noise_mod(a, range) {
    a[0] += randomFloatPlusMinus(range[0]);
    a[1] += randomFloatPlusMinus(range[1]);
    a[2] += randomFloatPlusMinus(range[2]);
}
function v3_addv3noise_res(res, a, range) {
    res[0] = a[0] + randomFloatPlusMinus(range[0]);
    res[1] = a[1] + randomFloatPlusMinus(range[1]);
    res[2] = a[2] + randomFloatPlusMinus(range[2]);
}

function v3_addnoise_new(a, range) {
    return [
        a[0] + randomFloatPlusMinus(range),
        a[1] + randomFloatPlusMinus(range),
        a[2] + randomFloatPlusMinus(range)
    ];
}
function v3_addnoise_mod(a, range) {
    a[0] += randomFloatPlusMinus(range);
    a[1] += randomFloatPlusMinus(range);
    a[2] += randomFloatPlusMinus(range);
}
function v3_addnoise_res(res, a, range) {
    res[0] = a[0] + randomFloatPlusMinus(range);
    res[1] = a[1] + randomFloatPlusMinus(range);
    res[2] = a[2] + randomFloatPlusMinus(range);
}


// Color sweeps
const _v3_sweep_RGB = [ _v3_red, _v3_green, _v3_blue ];
const _v3_sweep_RGBCMY = [ _v3_red, _v3_green, _v3_blue, _v3_cyan, _v3_magenta, _v3_yellow ];

// v3
function v3_colorsweep_RGB_new(index) {
    return v3_clone(_v3_sweep_RGB[index % 3]);
}
function v3_colorsweep_RGB_mod(a, index) {
    v3_copy(a, _v3_sweep_RGB[index % 3]);
}

function v3_colorsweep_RGBCMY_new(index) {
    return v3_clone(_v3_sweep_RGBCMY[index % 6]);
}
function v3_colorsweep_RGBCMY_mod(a, index) {
    v3_copy(a, _v3_sweep_RGBCMY[index % 6]);
}

// float by float (index %3 == 0 will be red component, == 1 green, == 2 blue)
function float_colorsweep_RGB(index) {
    return _v3_sweep_RGB[Math.floor(index / 3) % 3][index % 3];
}
function float_colorsweep_RGBCMY(index) {
    return _v3_sweep_RGBCMY[Math.floor(index / 3) % 6][index % 3];
}

// "Rainbow" hue sweep
function v3_huesweep_new(pos, max) {
    var section = Math.floor(6.0 * pos / max);
    var base = (section / 6.0) * max;
    max /= 6.0;
    var res = v3_new();
    switch(section) {
        case 0: // red 1, green 0-1, blue 0
            res[0] = 1.0;
            res[1] = (pos - base) / max;
            res[2] = 0.0;
        break;
        case 1: // red 1-0, green 1, blue 0
            res[0] = 1.0 - ((pos - base) / max);
            res[1] = 1.0;
            res[2] = 0.0;
        break;
        case 2: // red 0, green 1, blue 0-1
            res[0] = 0.0;
            res[1] = 1.0;
            res[2] = (pos - base) / max;
        break;
        case 3: // red 0, green 1-0, blue 1
            res[0] = 0.0;
            res[1] = 1.0 - ((pos - base) / max);
            res[2] = 1.0;
        break;
        case 4: // red 0-1, green 0, blue 1
            res[0] = (pos - base) / max;
            res[1] = 0.0;
            res[2] = 1.0;
        break;
        case 5: // red 1, green 0, blue 1-0
            res[0] = 1.0;
            res[1] = 0.0;
            res[2] = 1.0 - ((pos - base) / max);
        break;
    }
    return res;
}
function v3_huesweep_res(res, pos, max) {
    var section = Math.floor(6.0 * pos / max);
    var base = (section / 6.0) * max;
    max /= 6.0;
    switch(section) {
        case 0: // red 1, green 0-1, blue 0
            res[0] = 1.0;
            res[1] = (pos - base) / max;
            res[2] = 0.0;
        break;
        case 1: // red 1-0, green 1, blue 0
            res[0] = 1.0 - ((pos - base) / max);
            res[1] = 1.0;
            res[2] = 0.0;
        break;
        case 2: // red 0, green 1, blue 0-1
            res[0] = 0.0;
            res[1] = 1.0;
            res[2] = (pos - base) / max;
        break;
        case 3: // red 0, green 1-0, blue 1
            res[0] = 0.0;
            res[1] = 1.0 - ((pos - base) / max);
            res[2] = 1.0;
        break;
        case 4: // red 0-1, green 0, blue 1
            res[0] = (pos - base) / max;
            res[1] = 0.0;
            res[2] = 1.0;
        break;
        case 5: // red 1, green 0, blue 1-0
            res[0] = 1.0;
            res[1] = 0.0;
            res[2] = 1.0 - ((pos - base) / max);
        break;
    }
}

// v3 Arrays



// Return a new array of v3 equal to argument
function v3a_clone(a) {
    var res = new Array(a.length);
    for (var i = 0; i < a.length; ++i) res[i] = [ a[i][0],  a[i][1],  a[i][2] ];
    return res;
}
// Copy array of v3 to other array
function v3a_copy(res, a) {
    for (var i = 0; i < a.length; ++i) res[i] = [ a[i][0],  a[i][1],  a[i][2] ];
}
// Create new array of empty v3
function v3a_new(n) {
    var res = new Array(n);
    for (var i = 0; i < n; ++i) res[i] = v3_new();
    return res;
}


// Scale vector array
// = a * f
function v3a_scale_new(a, f) {
    var res = [];
    for (var i = 0; i < a.length; ++i) res.push( [ a[i][0] * f, 
                                                   a[i][1] * f, 
                                                   a[i][2] * f ] );
    return res; 
}
function v3a_scale_mod(a, f) {
    for (var i = 0; i < a.length; ++i) a[i] = [ a[i][0] * f,
                                                a[i][1] * f,
                                                a[i][2] * f ];
}
function v3a_scale_res(res, a, f) {
    res = [];
    for (var i = 0; i < a.length; ++i) res.push( [ a[i][0] * f, 
                                                   a[i][1] * f, 
                                                   a[i][2] * f ] );
}


// v3 and m4



// Apply m4 matrix to vector
function v3_applym4_new(a, m) {
    var res = [0, 0, 0];

    var a0 = a[0];
    var a1 = a[1];
    var a2 = a[2];

    var w = m[3] * a0 + m[7] * a1 + m[11] * a2 + m[15];
    w = w || 1.0;

    res[0] = (m[0] * a0 + m[4] * a1 + m[8]  * a2 + m[12]) / w;
    res[1] = (m[1] * a0 + m[5] * a1 + m[9]  * a2 + m[13]) / w;
    res[2] = (m[2] * a0 + m[6] * a1 + m[10] * a2 + m[14]) / w;
    return res;
}
function v3_applym4_res(res, a, m) {
    var a0 = a[0];
    var a1 = a[1];
    var a2 = a[2];

    var w = m[3] * a0 + m[7] * a1 + m[11] * a2 + m[15];
    w = w || 1.0;

    res[0] = (m[0] * a0 + m[4] * a1 + m[8]  * a2 + m[12]) / w;
    res[1] = (m[1] * a0 + m[5] * a1 + m[9]  * a2 + m[13]) / w;
    res[2] = (m[2] * a0 + m[6] * a1 + m[10] * a2 + m[14]) / w;
}
function v3_applym4_mod(a, m) {
    var a0 = a[0];
    var a1 = a[1];
    var a2 = a[2];

    var w = m[3] * a0 + m[7] * a1 + m[11] * a2 + m[15];
    w = w || 1.0;

    a[0] = (m[0] * a0 + m[4] * a1 + m[8]  * a2 + m[12]) / w;
    a[1] = (m[1] * a0 + m[5] * a1 + m[9]  * a2 + m[13]) / w;
    a[2] = (m[2] * a0 + m[6] * a1 + m[10] * a2 + m[14]) / w;
}



// v3 Array and m4

// Apply m4 matrix to all vectors
function v3a_applym4_new(a, m) {
    var res = [];
    for (var i = 0; i < a.length; ++i) {
        var a0 = a[i][0];
        var a1 = a[i][1];
        var a2 = a[i][2];

        var w = m[3] * a0 + m[7] * a1 + m[11] * a2 + m[15];
        w = w || 1.0;

        res.push( [ (m[0] * a0 + m[4] * a1 + m[8]  * a2 + m[12]) / w,
                    (m[1] * a0 + m[5] * a1 + m[9]  * a2 + m[13]) / w,
                    (m[2] * a0 + m[6] * a1 + m[10] * a2 + m[14]) / w ]);
    }
    return res;
}
function v3a_applym4_res(res, a, m) {
    res = [];
    for (var i = 0; i < a.length; ++i) {
        var a0 = a[i][0];
        var a1 = a[i][1];
        var a2 = a[i][2];

        var w = m[3] * a0 + m[7] * a1 + m[11] * a2 + m[15];
        w = w || 1.0;

        res.push( [ (m[0] * a0 + m[4] * a1 + m[8]  * a2 + m[12]) / w,
                    (m[1] * a0 + m[5] * a1 + m[9]  * a2 + m[13]) / w,
                    (m[2] * a0 + m[6] * a1 + m[10] * a2 + m[14]) / w ]);
    }
}
function v3a_applym4_mod(a, m) {
    for (var i = 0; i < a.length; ++i) {
        var a0 = a[i][0];
        var a1 = a[i][1];
        var a2 = a[i][2];

        var w = m[3] * a0 + m[7] * a1 + m[11] * a2 + m[15];
        w = w || 1.0;

        a[i][0] = (m[0] * a0 + m[4] * a1 + m[8]  * a2 + m[12]) / w;
        a[i][1] = (m[1] * a0 + m[5] * a1 + m[9]  * a2 + m[13]) / w;
        a[i][2] = (m[2] * a0 + m[6] * a1 + m[10] * a2 + m[14]) / w;
    }
}


// v3 format


function v3_string(v) {
    return ((v[0] >= 0) ? "[ " : "[") + v[0].toFixed(3) + ((v[1] >= 0) ? ", " : ",") + v[1].toFixed(3) + ((v[2] >= 0) ? ", " : ",") + v[2].toFixed(3) + " ]";
}



// m4 Matrices


// Create new identity matrix
function m4_new(){
    var m = new Array(16);
    m[0] =  1;        m[1] =  0;        m[2] =  0;       m[3] =  0;
    m[4] =  0;        m[5] =  1;        m[6] =  0;       m[7] =  0;
    m[8] =  0;        m[9] =  0;        m[10] = 1;       m[11] = 0;
    m[12] = 0;        m[13] = 0;        m[14] = 0;       m[15] = 1;
    return m;      
}
// Return a new m4 equal to argument
function m4_clone(a){
    var m = new Array(16);
    m[0] =  a[0];        m[1] =  a[1];        m[2] =  a[2];       m[3] =  a[3];
    m[4] =  a[4];        m[5] =  a[5];        m[6] =  a[6];       m[7] =  a[7];
    m[8] =  a[8];        m[9] =  a[9];        m[10] = a[10];      m[11] = a[11];
    m[12] = a[12];       m[13] = a[13];       m[14] = a[14];      m[15] = a[15];
    return m;      
}
// Copy content of 2 matrices
function m4_copy(res, a){
    res[0] =  a[0];        res[1] =  a[1];        res[2] =  a[2];       res[3] =  a[3];
    res[4] =  a[4];        res[5] =  a[5];        res[6] =  a[6];       res[7] =  a[7];
    res[8] =  a[8];        res[9] =  a[9];        res[10] = a[10];      res[11] = a[11];
    res[12] = a[12];       res[13] = a[13];       res[14] = a[14];      res[15] = a[15];
}
// Reset matrix content to identity
function m4_reset(a){
    a[0] =  1;        a[1] =  0;        a[2] =  0;       a[3] =  0;
    a[4] =  0;        a[5] =  1;        a[6] =  0;       a[7] =  0;
    a[8] =  0;        a[9] =  0;        a[10] = 1;       a[11] = 0;
    a[12] = 0;        a[13] = 0;        a[14] = 0;       a[15] = 1;    
}


// Transpose matrix
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


// Invert matrix
function m4_invert_new(a) {    
    var a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
    var a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
    var a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
    var a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];
    
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
      
    // Calculate the determinant
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    
    if (!det) return m4_clone(a);

    var res = new Array(16);

    det = 1.0 / det;
    
    res[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    res[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    res[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    res[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    res[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    res[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    res[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    res[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    res[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    res[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    res[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    res[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    res[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    res[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    res[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    res[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
     
    return res;
}
function m4_invert_mod(a) {

    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];
    var a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];
    var a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15];
      
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
      
    // Calculate the determinant
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      
    if (det) { 
        
        det = 1.0 / det;
        
        a[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        a[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        a[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        a[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        a[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        a[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        a[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        a[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        a[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        a[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        a[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        a[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        a[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        a[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        a[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        a[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    }

}
function m4_invert_res(res, a) {
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];
    var a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];
    var a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15];
      
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32;
      
    // Calculate the determinant
    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      
    if (det) { 
        
        det = 1.0 / det;
        
        res[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        res[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        res[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        res[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        res[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        res[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        res[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        res[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        res[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        res[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        res[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        res[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        res[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        res[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        res[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        res[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    }
}


// Multiply 2 matrices
function m4_multiply_new(a, b){
    var res = new Array(16);
    var a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
    var a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
    var a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];        
    res[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    res[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    res[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    res[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    res[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    res[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    res[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    res[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    res[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    res[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    res[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    res[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    res[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    res[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    res[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    res[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return res;
}
function m4_multiply_mod(a, b){
    var a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
    var a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
    var a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];        
    a[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    a[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    a[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    a[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    a[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    a[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    a[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    a[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    a[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    a[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    a[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    a[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    a[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    a[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    a[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    a[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
}
function m4_multiply_res(res, a, b){
    var a00 = a[0],  a01 = a[1],  a02 = a[2],  a03 = a[3];
    var a10 = a[4],  a11 = a[5],  a12 = a[6],  a13 = a[7];
    var a20 = a[8],  a21 = a[9],  a22 = a[10], a23 = a[11];
    var a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];        
    res[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    res[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    res[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    res[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    res[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    res[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    res[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    res[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    res[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    res[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    res[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    res[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    res[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    res[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    res[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    res[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
}


// Create new translation matrix
function m4_translation_new(v){
    var res = new Array(16);

    res[0] =  1;        res[1] =  0;        res[2] =  0;       res[3] =  0;
    res[4] =  0;        res[5] =  1;        res[6] =  0;       res[7] =  0;
    res[8] =  0;        res[9] =  0;        res[10] = 1;       res[11] = 0;

    res[12] = v[0];
    res[13] = v[1];
    res[14] = v[2];
    res[15] = 1;

    return res;
}
function m4_translation_res(res, v){
    res[0] =  1;        res[1] =  0;        res[2] =  0;       res[3] =  0;
    res[4] =  0;        res[5] =  1;        res[6] =  0;       res[7] =  0;
    res[8] =  0;        res[9] =  0;        res[10] = 1;       res[11] = 0;

    res[12] = v[0];
    res[13] = v[1];
    res[14] = v[2];
    res[15] = 1;
}

// Add translation to matrix
function m4_translate_new(a, v){
    var res = new Array(16);

    res[0] = a[0]; res[1] = a[1]; res[2]  = a[2];  res[3]  = a[3];
    res[4] = a[4]; res[5] = a[5]; res[6]  = a[6];  res[7]  = a[7];
    res[8] = a[8]; res[9] = a[9]; res[10] = a[10]; res[11] = a[11];

    res[12] = a[0] * v[0] + a[4] * v[1] + a[8]  * v[2] + a[12];
    res[13] = a[1] * v[0] + a[5] * v[1] + a[9]  * v[2] + a[13];
    res[14] = a[2] * v[0] + a[6] * v[1] + a[10] * v[2] + a[14];
    res[15] = a[3] * v[0] + a[7] * v[1] + a[11] * v[2] + a[15];

    return res;
}
function m4_translate_mod(a, v){
    a[12] = a[0] * v[0] + a[4] * v[1] + a[ 8] * v[2] + a[12];
    a[13] = a[1] * v[0] + a[5] * v[1] + a[ 9] * v[2] + a[13];
    a[14] = a[2] * v[0] + a[6] * v[1] + a[10] * v[2] + a[14];
    a[15] = a[3] * v[0] + a[7] * v[1] + a[11] * v[2] + a[15];
}
function m4_translate_res(res, a, v){
    res[0] = a[0]; res[1] = a[1]; res[2]  = a[2];  res[3]  = a[3];
    res[4] = a[4]; res[5] = a[5]; res[6]  = a[6];  res[7]  = a[7];
    res[8] = a[8]; res[9] = a[9]; res[10] = a[10]; res[11] = a[11];

    res[12] = a[0] * v[0] + a[4] * v[1] + a[8]  * v[2] + a[12];
    res[13] = a[1] * v[0] + a[5] * v[1] + a[9]  * v[2] + a[13];
    res[14] = a[2] * v[0] + a[6] * v[1] + a[10] * v[2] + a[14];
    res[15] = a[3] * v[0] + a[7] * v[1] + a[11] * v[2] + a[15];
}


// Create mew rotation matrix around vector
function m4_rotation_new(ang, v) {
    var res = new Array(16);

    var x = v[0],
        y = v[1],
        z = v[2];

    var len = Math.sqrt(x * x + y * y + z * z);
    if (len < _v3_epsilon) return res;

    x /= len;
    y /= len;
    z /= len;
      
    var s = Math.sin(ang);
    var c = Math.cos(ang);
    var t = 1 - c;

    res[0]  = x * x * t + c;
    res[1]  = y * x * t + z * s;
    res[2]  = z * x * t - y * s;
    res[3]  = 0;

    res[4]  = x * y * t - z * s;
    res[5]  = y * y * t + c;
    res[6]  = z * y * t + x * s;
    res[7]  = 0;

    res[8]  = x * z * t + y * s;
    res[9]  = y * z * t - x * s;
    res[10] = z * z * t + c;
    res[11] = 0;
    
    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;

    return res;
}
function m4_rotation_res(res, ang, v) {
    var x = v[0],
        y = v[1],
        z = v[2];

    var len = Math.sqrt(x * x + y * y + z * z);
    if (len < _v3_epsilon) return res;

    x /= len;
    y /= len;
    z /= len;
      
    var s = Math.sin(ang);
    var c = Math.cos(ang);
    var t = 1 - c;

    res[0]  = x * x * t + c;
    res[1]  = y * x * t + z * s;
    res[2]  = z * x * t - y * s;
    res[3]  = 0;

    res[4]  = x * y * t - z * s;
    res[5]  = y * y * t + c;
    res[6]  = z * y * t + x * s;
    res[7]  = 0;

    res[8]  = x * z * t + y * s;
    res[9]  = y * z * t - x * s;
    res[10] = z * z * t + c;
    res[11] = 0;
    
    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;
}

// Add rotation around vector to matrix
function m4_rotate_new(a, ang, v){
    var res = new Array(16);

    var x = v[0],
        y = v[1],
        z = v[2];

    var len = Math.sqrt(x * x + y * y + z * z);
    if (len < _v3_epsilon) {
        m4_copy(res, a);
        return res;
    }

    //len = 1 / len;
    x /= len;
    y /= len;
    z /= len;
      
    var s = Math.sin(ang);
    var c = Math.cos(ang);
    var t = 1 - c;
      
    var a00 = a[0], a01 = a[1], a02 = a[2],  a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6],  a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      
    // Construct the rotation matrix
    var b00 = x * x * t + c;
    var b01 = y * x * t + z * s;
    var b02 = z * x * t - y * s;

    var b10 = x * y * t - z * s;
    var b11 = y * y * t + c;
    var b12 = z * y * t + x * s;

    var b20 = x * z * t + y * s;
    var b21 = y * z * t - x * s;
    var b22 = z * z * t + c;
      
    // Perform rotation-specific matrix multiplication
    res[0] = a00 * b00 + a10 * b01 + a20 * b02;
    res[1] = a01 * b00 + a11 * b01 + a21 * b02;
    res[2] = a02 * b00 + a12 * b01 + a22 * b02;
    res[3] = a03 * b00 + a13 * b01 + a23 * b02;
    res[4] = a00 * b10 + a10 * b11 + a20 * b12;
    res[5] = a01 * b10 + a11 * b11 + a21 * b12;
    res[6] = a02 * b10 + a12 * b11 + a22 * b12;
    res[7] = a03 * b10 + a13 * b11 + a23 * b12;
    res[8] = a00 * b20 + a10 * b21 + a20 * b22;
    res[9] = a01 * b20 + a11 * b21 + a21 * b22;
    res[10] = a02 * b20 + a12 * b21 + a22 * b22;
    res[11] = a03 * b20 + a13 * b21 + a23 * b22;
    
    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];

    return res;
}

function m4_rotate_mod(a, ang, v){
    var x = v[0],
        y = v[1],
        z = v[2];

    var len = Math.sqrt(x * x + y * y + z * z);
    if (len < _v3_epsilon) return;

    x /= len;
    y /= len;
    z /= len;
      
    var s = Math.sin(ang);
    var c = Math.cos(ang);
    var t = 1 - c;
      
    var a00 = a[0], a01 = a[1], a02 = a[2],  a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6],  a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      
    // Construct the rotation matrix
    var b00 = x * x * t + c;
    var b01 = y * x * t + z * s;
    var b02 = z * x * t - y * s;

    var b10 = x * y * t - z * s;
    var b11 = y * y * t + c;
    var b12 = z * y * t + x * s;

    var b20 = x * z * t + y * s;
    var b21 = y * z * t - x * s;
    var b22 = z * z * t + c;
      
    // Perform rotation-specific matrix multiplication
    a[0] = a00 * b00 + a10 * b01 + a20 * b02;
    a[1] = a01 * b00 + a11 * b01 + a21 * b02;
    a[2] = a02 * b00 + a12 * b01 + a22 * b02;
    a[3] = a03 * b00 + a13 * b01 + a23 * b02;
    a[4] = a00 * b10 + a10 * b11 + a20 * b12;
    a[5] = a01 * b10 + a11 * b11 + a21 * b12;
    a[6] = a02 * b10 + a12 * b11 + a22 * b12;
    a[7] = a03 * b10 + a13 * b11 + a23 * b12;
    a[8] = a00 * b20 + a10 * b21 + a20 * b22;
    a[9] = a01 * b20 + a11 * b21 + a21 * b22;
    a[10] = a02 * b20 + a12 * b21 + a22 * b22;
    a[11] = a03 * b20 + a13 * b21 + a23 * b22; 
}

function m4_rotate_res(res, a, ang, v){
    var x = v[0],
        y = v[1],
        z = v[2];

    var len = Math.sqrt(x * x + y * y + z * z);
    if (len < _v3_epsilon) {
        m4_copy(res, a);
        return;
    }

    x /= len;
    y /= len;
    z /= len;
      
    var s = Math.sin(ang);
    var c = Math.cos(ang);
    var t = 1 - c;
      
    var a00 = a[0], a01 = a[1], a02 = a[2],  a03 = a[3];
    var a10 = a[4], a11 = a[5], a12 = a[6],  a13 = a[7];
    var a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
      
    // Construct the rotation matrix
    var b00 = x * x * t + c;
    var b01 = y * x * t + z * s;
    var b02 = z * x * t - y * s;

    var b10 = x * y * t - z * s;
    var b11 = y * y * t + c;
    var b12 = z * y * t + x * s;

    var b20 = x * z * t + y * s;
    var b21 = y * z * t - x * s;
    var b22 = z * z * t + c;
      
    // Perform rotation-specific matrix multiplication
    res[0] = a00 * b00 + a10 * b01 + a20 * b02;
    res[1] = a01 * b00 + a11 * b01 + a21 * b02;
    res[2] = a02 * b00 + a12 * b01 + a22 * b02;
    res[3] = a03 * b00 + a13 * b01 + a23 * b02;
    res[4] = a00 * b10 + a10 * b11 + a20 * b12;
    res[5] = a01 * b10 + a11 * b11 + a21 * b12;
    res[6] = a02 * b10 + a12 * b11 + a22 * b12;
    res[7] = a03 * b10 + a13 * b11 + a23 * b12;
    res[8] = a00 * b20 + a10 * b21 + a20 * b22;
    res[9] = a01 * b20 + a11 * b21 + a21 * b22;
    res[10] = a02 * b20 + a12 * b21 + a22 * b22;
    res[11] = a03 * b20 + a13 * b21 + a23 * b22;
    
    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];
}

// Create rotation matrix around X
function m4_rotationX_new(ang) {
    var res = new Array(16);

    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = 1;
    res[1] = 0;
    res[2] = 0;
    res[3] = 0;

    res[4] = 0;
    res[5] = c;
    res[6] = s;    
    res[7] = 0;

    res[8]  =  0;
    res[9]  = -s;
    res[10] =  c;
    res[11] =  0;

    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;
    
    return res;
}
function m4_rotationX_res(res, ang) {
    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = 1;
    res[1] = 0;
    res[2] = 0;
    res[3] = 0;

    res[4] = 0;
    res[5] = c;
    res[6] = s;    
    res[7] = 0;

    res[8]  =  0;
    res[9]  = -s;
    res[10] =  c;
    res[11] =  0;

    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;
}

// Add rotation around X to matrix
function m4_rotateX_new(a, ang){
    var res = new Array(16);

    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = a[0];
    res[1] = a[1];
    res[2] = a[2];
    res[3] = a[3];

    res[4] = a[4] * c + a[8]  * s;
    res[5] = a[5] * c + a[9]  * s;
    res[6] = a[6] * c + a[10] * s;    
    res[7] = a[7] * c + a[11] * s;

    res[8]  = a[8]  * c - a[4] * s;
    res[9]  = a[9]  * c - a[5] * s;
    res[10] = a[10] * c - a[6] * s;
    res[11] = a[11] * c - a[7] * s;

    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];
    
    return res;
}

function m4_rotateX_mod(a, ang){
    var s = Math.sin(ang);
    var c = Math.cos(ang);

    var a04 = a[4];
    var a05 = a[5];
    var a06 = a[6];
    var a07 = a[7];
    var a08 = a[8];
    var a09 = a[9];
    var a10 = a[10];
    var a11 = a[11];

    a[4] = a04 * c + a08 * s;
    a[5] = a05 * c + a09 * s;
    a[6] = a06 * c + a10 * s;    
    a[7] = a07 * c + a11 * s;

    a[8]  = a08 * c - a04 * s;
    a[9]  = a09 * c - a05 * s;
    a[10] = a10 * c - a06 * s;
    a[11] = a11 * c - a07 * s;
}

function m4_rotateX_res(res, a, ang){
    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = a[0];
    res[1] = a[1];
    res[2] = a[2];
    res[3] = a[3];

    res[4] = a[4] * c + a[8]  * s;
    res[5] = a[5] * c + a[9]  * s;
    res[6] = a[6] * c + a[10] * s;    
    res[7] = a[7] * c + a[11] * s;

    res[8]  = a[8]  * c - a[4] * s;
    res[9]  = a[9]  * c - a[5] * s;
    res[10] = a[10] * c - a[6] * s;
    res[11] = a[11] * c - a[7] * s;

    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];
}

// Create a new rotation matrix around Y
function m4_rotationY_new(ang) {
    var res = new Array(16);

    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] =  c;
    res[1] =  0;
    res[2] = -s;
    res[3] =  0;

    res[4] = 0;
    res[5] = 1;
    res[6] = 0;
    res[7] = 0;

    res[8]  = s;
    res[9]  = 0;
    res[10] = c;
    res[11] = 0;
    
    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;

    return res;
}
function m4_rotationY_res(res, ang) {
    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] =  c;
    res[1] =  0;
    res[2] = -s;
    res[3] =  0;

    res[4] = 0;
    res[5] = 1;
    res[6] = 0;
    res[7] = 0;

    res[8]  = s;
    res[9]  = 0;
    res[10] = c;
    res[11] = 0;
    
    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;
}

// Add rotation around Y to matrix
function m4_rotateY_new(a, ang){
    var res = new Array(16);

    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = a[0] * c - a[8]  * s;
    res[1] = a[1] * c - a[9]  * s;
    res[2] = a[2] * c - a[10] * s;
    res[3] = a[3] * c - a[11] * s;

    res[4] = a[4];
    res[5] = a[5];
    res[6] = a[6];
    res[7] = a[7];

    res[8]  = a[0] * s + a[8]  * c;
    res[9]  = a[1] * s + a[9]  * c;
    res[10] = a[2] * s + a[10] * c;
    res[11] = a[3] * s + a[11] * c;
    
    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];

    return res;
}
function m4_rotateY_mod(a, ang){
    var s = Math.sin(ang);
    var c = Math.cos(ang);

    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a08 = a[8];
    var a09 = a[9];
    var a10 = a[10];
    var a11 = a[11];

    a[0] = a00 * c - a08 * s;
    a[1] = a01 * c - a09 * s;
    a[2] = a02 * c - a10 * s;
    a[3] = a03 * c - a11 * s;

    a[8]  = a00 * s + a08 * c;
    a[9]  = a01 * s + a09 * c;
    a[10] = a02 * s + a10 * c;
    a[11] = a03 * s + a11 * c;
}

function m4_rotateY_res(res, a, ang){
    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = a[0] * c - a[8]  * s;
    res[1] = a[1] * c - a[9]  * s;
    res[2] = a[2] * c - a[10] * s;
    res[3] = a[3] * c - a[11] * s;

    res[4] = a[4];
    res[5] = a[5];
    res[6] = a[6];
    res[7] = a[7];

    res[8]  = a[0] * s + a[8]  * c;
    res[9]  = a[1] * s + a[9]  * c;
    res[10] = a[2] * s + a[10] * c;
    res[11] = a[3] * s + a[11] * c;
    
    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];
}

// Create a new rotation matrix around Z
function m4_rotationZ_new(ang) {
    var res = new Array(16);

    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = c;
    res[1] = s;
    res[2] = 0;
    res[3] = 0;

    res[4] = -s;
    res[5] =  c;
    res[6] =  0;
    res[7] =  0;

    res[8]  = 0;
    res[9]  = 0;
    res[10] = 1;
    res[11] = 0;
    
    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;

    return res;
}
function m4_rotationZ_res(res, ang) {
    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = c;
    res[1] = s;
    res[2] = 0;
    res[3] = 0;

    res[4] = -s;
    res[5] =  c;
    res[6] =  0;
    res[7] =  0;

    res[8]  = 0;
    res[9]  = 0;
    res[10] = 1;
    res[11] = 0;
    
    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;
}

// Add rotation around Z to matrix
function m4_rotateZ_new(a, ang){
    var res = new Array(16);

    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = a[0] * c + a[4] * s;
    res[1] = a[1] * c + a[5] * s;
    res[2] = a[2] * c + a[6] * s;
    res[3] = a[3] * c + a[7] * s;    
  
    res[4] = a[4] * c - a[0] * s;
    res[5] = a[5] * c - a[1] * s;
    res[6] = a[6] * c - a[2] * s;
    res[7] = a[7] * c - a[3] * s;

    res[8] = a[8];
    res[9] = a[9];
    res[10] = a[10];
    res[11] = a[11];

    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];


    return res;
}
function m4_rotateZ_mod(a, ang){
    var s = Math.sin(ang);
    var c = Math.cos(ang);

    var a00 = a[0];
    var a01 = a[1];
    var a02 = a[2];
    var a03 = a[3];
    var a04 = a[4];
    var a05 = a[5];
    var a06 = a[6];
    var a07 = a[7];

    a[0] = a00 * c + a04 * s;
    a[1] = a01 * c + a05 * s;
    a[2] = a02 * c + a06 * s;
    a[3] = a03 * c + a07 * s;    

    a[4] = a04 * c - a00 * s;
    a[5] = a05 * c - a01 * s;
    a[6] = a06 * c - a02 * s;
    a[7] = a07 * c - a03 * s;
}
function m4_rotateZ_res(res, a, ang){

    var s = Math.sin(ang);
    var c = Math.cos(ang);

    res[0] = a[0] * c + a[4] * s;
    res[1] = a[1] * c + a[5] * s;
    res[2] = a[2] * c + a[6] * s;
    res[3] = a[3] * c + a[7] * s;

    res[4] = a[4] * c - a[0] * s;
    res[5] = a[5] * c - a[1] * s;
    res[6] = a[6] * c - a[2] * s;
    res[7] = a[7] * c - a[3] * s;
  
    res[8] = a[8];
    res[9] = a[9];
    res[10] = a[10];
    res[11] = a[11];

    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];
}


// Create new scale matrix
function m4_proportion_new(v) {
    var res = new Array(16);   

    res[0]  = v[0];
    res[1]  = 0;
    res[2]  = 0;
    res[3]  = 0;

    res[4]  = 0;
    res[5]  = v[1];
    res[6]  = 0;
    res[7]  = 0;

    res[8]  = 0;
    res[9]  = 0;
    res[10] = v[2];
    res[11] = 0;

    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;
    return res;
}
function m4_proportion_res(res, v) {
    res[0]  = v[0];
    res[1]  = 0;
    res[2]  = 0;
    res[3]  = 0;

    res[4]  = 0;
    res[5]  = v[1];
    res[6]  = 0;
    res[7]  = 0;

    res[8]  = 0;
    res[9]  = 0;
    res[10] = v[2];
    res[11] = 0;

    res[12] = 0;
    res[13] = 0;
    res[14] = 0;
    res[15] = 1;
}

// Add scale to matrix
function m4_scale_new(a, v) {
    var res = new Array(16);

    res[0]  = a[0]  * v[0];
    res[1]  = a[1]  * v[0];
    res[2]  = a[2]  * v[0];
    res[3]  = a[3]  * v[0];
    res[4]  = a[4]  * v[1];
    res[5]  = a[5]  * v[1];
    res[6]  = a[6]  * v[1];
    res[7]  = a[7]  * v[1];
    res[8]  = a[8]  * v[2];
    res[9]  = a[9]  * v[2];
    res[10] = a[10] * v[2];
    res[11] = a[11] * v[2];
    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];

    return res;
  }
  function m4_scale_mod(a, v) {
    a[0]  = a[0]  * v[0];
    a[1]  = a[1]  * v[0];
    a[2]  = a[2]  * v[0];
    a[3]  = a[3]  * v[0];
    a[4]  = a[4]  * v[1];
    a[5]  = a[5]  * v[1];
    a[6]  = a[6]  * v[1];
    a[7]  = a[7]  * v[1];
    a[8]  = a[8]  * v[2];
    a[9]  = a[9]  * v[2];
    a[10] = a[10] * v[2];
    a[11] = a[11] * v[2];
    a[12] = a[12];
    a[13] = a[13];
    a[14] = a[14];
    a[15] = a[15];
  }
  function m4_scale_res(res, a, v) {
    res[0]  = a[0]  * v[0];
    res[1]  = a[1]  * v[0];
    res[2]  = a[2]  * v[0];
    res[3]  = a[3]  * v[0];
    res[4]  = a[4]  * v[1];
    res[5]  = a[5]  * v[1];
    res[6]  = a[6]  * v[1];
    res[7]  = a[7]  * v[1];
    res[8]  = a[8]  * v[2];
    res[9]  = a[9]  * v[2];
    res[10] = a[10] * v[2];
    res[11] = a[11] * v[2];
    res[12] = a[12];
    res[13] = a[13];
    res[14] = a[14];
    res[15] = a[15];
  }


// Create new symmetric orthogonal projection matrix 
function m4_ortho_new(width, height, znear, zfar){
    var res = new Array(16);

    res[0] = 2 / width;
    res[1] = 0;
    res[2] = 0;
    res[3] = 0;
    res[4] = 0;
    res[5] = 2 / height;
    res[6] = 0;
    res[7] = 0;
    res[8] = 0;
    res[9] = 0;
    res[10] = -2 / (zfar - znear);
    res[11] = 0;
    res[12] = 0;
    res[13] = 0;
    res[14] = (zfar + znear) / (zfar - znear);
    res[15] = 1;

    return res;
}
function m4_ortho_res(res, width, height, znear, zfar){
    res[0] = 2 / width;
    res[1] = 0;
    res[2] = 0;
    res[3] = 0;
    res[4] = 0;
    res[5] = 2 / height;
    res[6] = 0;
    res[7] = 0;
    res[8] = 0;
    res[9] = 0;
    res[10] = -2 / (zfar - znear);
    res[11] = 0;
    res[12] = 0;
    res[13] = 0;
    res[14] = (zfar + znear) / (zfar - znear);
    res[15] = 1;
}


// Create new symmetrical perpective projetcion matrix
function m4_persp_new(yfov, ar, znear, zfar){
    var res = new Array(16);
    if (ar < 1.0) yfov = yfov / ar;
    var f = 1.0 / Math.tan(yfov / 2);
    var nf = 1 / (znear - zfar);
    res[0] = f / ar;
    res[1] = 0;
    res[2] = 0;
    res[3] = 0;
    res[4] = 0;
    res[5] = f;
    res[6] = 0;
    res[7] = 0;
    res[8] = 0;
    res[9] = 0;
    res[10] = (zfar + znear) * nf;
    res[11] = -1;
    res[12] = 0;
    res[13] = 0;
    res[14] = 2 * zfar * znear * nf;
    res[15] = 0;

    return res;
}
function m4_persp_res(res, yfov, ar, znear, zfar){
    if (ar < 1.0) yfov = yfov / ar;
    var f = 1.0 / Math.tan(yfov / 2);
    var nf = 1 / (znear - zfar);
    res[0] = f / ar;
    res[1] = 0;
    res[2] = 0;
    res[3] = 0;
    res[4] = 0;
    res[5] = f;
    res[6] = 0;
    res[7] = 0;
    res[8] = 0;
    res[9] = 0;
    res[10] = (zfar + znear) * nf;
    res[11] = -1;
    res[12] = 0;
    res[13] = 0;
    res[14] = 2 * zfar * znear * nf;
    res[15] = 0; 
}

// Pitch Yaw Roll Position matrix 
function m4_transform_new(position, rotation){
    var m = m4_rotationZ_new(rotation[2]);
    m4_rotateX_mod(m, rotation[0]);
    m4_rotateY_mod(m, rotation[1]);
    m[12] = position[0];
    m[13] = position[1];
    m[14] = position[2];
}

function m4_transform_res(res, position, rotation){
    m4_rotationZ_res(res, rotation[2]);
    m4_rotateX_mod(res, rotation[0]);
    m4_rotateY_mod(res, rotation[1]);
    res[12] = position[0];
    res[13] = position[1];
    res[14] = position[2];
}

function m4_transform_mod(res, position, rotation){
    m4_rotateZ_mod(res, rotation[2]);
    m4_rotateX_mod(res, rotation[0]);
    m4_rotateY_mod(res, rotation[1]);
    res[12] += position[0];
    res[13] += position[1];
    res[14] += position[2];
}