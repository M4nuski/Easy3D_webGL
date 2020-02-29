document.addEventListener("DOMContentLoaded", function () {

"use strict"

var sessionStart = new Date().getTime();


// elements
var can = document.getElementById("GLCanvas");
var log = document.getElementById("logDiv");
var status = document.getElementById("statusDiv");

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


const gco = [0 ,0 ,0];
let glo = [0,0 ,0];
var gvo = [0, 0, 0];

const gcv  = vec3.fromValues(0, 0, 0);
let glv  = vec3.fromValues(0, 0, 0);
var gvv  = vec3.fromValues(0, 0, 0);

const t = {};

t.test1 = function() {
    const lco = [0 ,0 ,0];
    let llo = [0,0 ,0];
    var lvo = [0, 0, 0];

    var v1 = vec3.fromValues(0, 0, 0);

    const lcv  = vec3.fromValues(0, 0, 0);
    let llv  = vec3.fromValues(0, 0, 0);
    var lvv  = vec3.fromValues(0, 0, 0);


    //direct cast [0,0,0]
    //cast from new vec3.fromValues(0, 0, 0);
    //cast from new vec3.fromValues(0, 0, 0);

    const numtst = 25000000;
    addLine("Num iter: " + numtst);
    addLine("Premade vec3, local");

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, lcv);
    }
    let et = performance.now();

    addLine("const" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, llv);
    }
    et = performance.now();

    addLine("let" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, lvv);
    }
    et = performance.now();

    addLine("var" + " : " + (et-dt));


    addLine("");
    addLine("Premade vec3, global");

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, gcv);
    }
    et = performance.now();

    addLine("const" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, glv);
    }
    et = performance.now();

    addLine("let" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, gvv);
    }
    et = performance.now();

    addLine("var" + " : " + (et-dt));






    addLine("");
    addLine("Inline");

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, [0, 0, 0]);
    }
    et = performance.now();

    addLine("array [0,0,0]" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, [lvv[0],lvv[1],lvv[2]]);
    }
    et = performance.now();

    addLine("array [v[0],v[1],v[2]]" + " : " + (et-dt));


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, vec3.fromValues(0, 0, 0));
    }
    et = performance.now();

    addLine("vec3.fromValues(0, 0, 0)" + " : " + (et-dt));


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, vec3.fromValues(0, 0, 0));
    }
    et = performance.now();

    addLine("vec3.fromValues()" + " : " + (et-dt));


    addLine("");
    addLine("Local array");


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, lco);
    }
    et = performance.now();

    addLine("const" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, llo);
    }
    et = performance.now();

    addLine("let" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, lvo);
    }
    et = performance.now();

    addLine("var" + " : " + (et-dt));


    addLine("");
    addLine("Global array");


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, gco);
    }
    et = performance.now();

    addLine("const" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, glo);
    }
    et = performance.now();

    addLine("let" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, gvo);
    }
    et = performance.now();

    addLine("var" + " : " + (et-dt));



    addLine("End Test 1");
}

t.test2 = function() {

    let sum = 0;
    const numtst = 25000000;
    addLine("Num iter: " + numtst);

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        sum += Date.now() - dt;
    }
    let et = performance.now();

    addLine("Date.now(): " + (et-dt));


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        sum += performance.now() - dt;
    }
    et = performance.now();

    addLine("performance.now(): " + (et-dt));



    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        sum += (new Date()).getTime() - dt;
    }
    et = performance.now();

    addLine("new Date().getTime() x: " + (et-dt));

    addLine("End Test 2");
}


t.test3a = function() {

    const numtst = 25000000;
    var d = vec3.fromValues(0, 0, 0);

    addLine("Num iter: " + numtst);

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        d = vec3.fromValues(gvv[0], gvv[1], gvv[2]);
    }
    let et = performance.now();
    addLine("d = fromValues(s[])" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.copy(d, gvv);
    }
    et = performance.now();
    addLine("copy(d, s)" + " : " + (et-dt));


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        d = vec3.clone(gvv);
    }
    et = performance.now();
    addLine("d = clone(s)" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        d[0] = gvv[0];
        d[1] = gvv[1];
        d[2] = gvv[2];
    }
    et = performance.now();
    addLine("i in range [0..2] d[i] = s[i]" + " : " + (et-dt));

    addLine("End Test 3a");
}


function copy3f3f(a, b) {
    a[0] = b[0];
    a[1] = b[1];
    a[2] = b[2];
}


t.test3b = function() {

    const numtst = 25000000;
    var d = vec3.fromValues(0, 0, 0);
    var s = vec3.fromValues(0, 0, 0);
    addLine("Num iter: " + numtst);

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        d = vec3.clone(s);
    }
    let et = performance.now();
    addLine("d = vec3.clone(s)" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        d[0] = s[0];
        d[1] = s[1];
        d[2] = s[2];
    }
    et = performance.now();
    addLine("d[i] = s[i]" + " : " + (et-dt));


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        d = s.slice();
    }
    et = performance.now();
    addLine("d = s.slice();" + " : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        copy3f3f(d, s);
    }
    et = performance.now();
    addLine("copy3f3f(d, s);" + " : " + (et-dt));


    copy3f3f

    addLine("End Test 3b");
}

t.test4 = function() {
    let ms = mat4.create();
    let md = mat4.create();
    let v = vec3.fromValues(0, 0, 0);

    const numtst = 5000000;    
    addLine("Num iter: " + numtst);
    
    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        mat4.translate(md, ms, v);
    }
    let et = performance.now();
    addLine("translate(md, ms, v) : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.negate(v, v);
        mat4.translate(md, ms, v);
    }
    et = performance.now();
    addLine("vec.negate(v) + translate(md, ms, v) : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        mat4.translate(md, ms, [-v[0], -v[1], -v[2]] );
    }
    et = performance.now();
    addLine("translate(md, ms, [-v[]...]) : " + (et-dt));

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.negate(v, v);
        mat4.translate(md, ms, v);
        vec3.negate(v, v);
    }
    et = performance.now();
    addLine("negate(v) + translate(md, ms, v) + negate(v) : " + (et-dt));

    let dummy = vec3.fromValues(0, 0, 0);
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        mat4.translate(md, ms, vec3.negate(dummy, v));
    }
    et = performance.now();
    addLine("translate(md, ms, negate(dummy, v)) : " + (et-dt));

    addLine("End Test 4");
}




t.test5a = function() {
    const numtst = 1500000;
    const numItem = 5000;

    addLine("Num iter: " + numtst);
    addLine("numItem: " + numItem);

    var ar = [numItem];
    for (var i = 0; i < numItem; ++i ) {
        ar[i] = i;
    }

    var ma = new Map();
    for (var i = 0; i < numItem; ++i ) {
       ma.set(i, i);
    }
    

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) var x = Math.floor(Math.random() * numItem);
    let et = performance.now();
    addLine("random number gen time: " + (et-dt));


    var dummy;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        var x = Math.floor(Math.random() * numItem);
        dummy = ar[x];
    }
    et = performance.now();
    addLine("random access array: " + (et-dt));


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        var x = Math.floor(Math.random() * numItem);
        dummy = ma.get(x);
    }
    et = performance.now();
    addLine("random access map: " + (et-dt));  


    addLine("End Test 5a");
}



t.test5b = function() {
    const numtst = 150000;
    const numItem = 5000;

    addLine("Num iter: " + numtst);
    addLine("numItem: " + numItem);

    var ar = [numItem];
    for (var i = 0; i < numItem; ++i ) {
        ar[i] = i;
    }

    var ma = new Map();
    for (var i = 0; i < numItem; ++i ) {
       ma.set(i, i);
    }
    

    var dummy;
    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        for (let j = 0; j < numItem; ++j) {
            dummy = ar[j];
        }
    }
    let et = performance.now();
    addLine("sequential access array: " + (et-dt));


    dt = performance.now();    
    for (let i = 0; i < numtst; ++i) {
        var itr = ma.values();
        var v = itr.next();
        while (!v.done) {
            dummy = v.value;
            v = itr.next();
        }
    }
    et = performance.now();
    addLine("sequential access while (!itr.next().done): " + (et-dt));  


    dt = performance.now();    
    for (let i = 0; i < numtst; ++i) {
        for (var [val, done] of ma) {
            dummy = val;
        }
    }
    et = performance.now();
    addLine("sequential access for [val, done] of map: " + (et-dt));  

   addLine("End Test 5b");
}




t.test5c = function() {
    const numtst = 1500000;
    const numItem = 5000;

    addLine("Num iter: " + numtst);
    addLine("numItem: " + numItem);

    var ar = [numItem];
    for (var i = 0; i < numItem; ++i ) {
        ar[i] = i;
    }

    var ma = new Map();
    for (var i = 0; i < numItem; ++i ) {
       ma.set(i, i);
    }
   

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) var x = Math.floor(Math.random() * numItem);
    let et = performance.now();
    addLine("random number gen time: " + (et-dt));


    var dummy;
    let idx = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        var x = Math.floor(Math.random() * numItem);
        for (let j = 0; j < ar.length; ++j) {
            if (ar[j] == x) {
                idx = j;
                j = ar.length;
            }
        }
        dummy = ar[idx];
    }
    et = performance.now();
    addLine("array search by for: " + (et-dt));


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        var x = Math.floor(Math.random() * numItem);
        dummy = ar[ar.indexOf(x)];
    }
    et = performance.now();
    addLine("array search by indexOf: " + (et-dt));


    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        var x = Math.floor(Math.random() * numItem);
        dummy = ma.get(x);
    }
    et = performance.now();
    addLine("random access map: " + (et-dt));  


    addLine("End Test 5c");
}



t.test6 = function() {
    const numtst = 5000000;
    var vec3_dummy = [0, 0, 0];

    addLine("Num iter: " + numtst);

    var _ia = [];
    var _na = [];
    var _ra = [];
    
    for (var i = 0; i < numtst; ++i ) {
        _ia[i] = vec3.random(vec3_dummy, 10*Math.random()+1);
        _na[i] = vec3.random(vec3_dummy, 10*Math.random()+1);
        _ra[i] = 10*Math.random()+1;
    }

    var ia = _ia.slice(0, numtst);
    var na = _na.slice(0, numtst);

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        var x = reflect1(ia[i], na[i]);
        var r = x[0] + x[1] + x[2];
    }

    let et = performance.now();
    addLine("reflect1: " + (et-dt));

    ia = _ia.slice(0, numtst);
    na = _na.slice(0, numtst);

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
      var x = reflect2(ia[i], na[i]);
      var r = x[0] + x[1] + x[2];
    }

    et = performance.now();
    addLine("reflect2: " + (et-dt));


    ia = _ia.slice(0, numtst);
    na = _na.slice(0, numtst);
    var ra = _ra.slice(0, numtst);
    var r = 0;

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        var x = VectSphHit_geo(ia[i], na[i], ra[i]);
        if (x != false) r += x;

    }

    et = performance.now();
    addLine("VectSphHit_geo: " + (et-dt));


    ia = _ia.slice(0, numtst);
    na = _na.slice(0, numtst);
    ra = _ra.slice(0, numtst);
    r = 0;

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        var x = VectSphHit_quad(ia[i], na[i], ra[i]);
        if (x != false) r += x;

    }

    et = performance.now();
    addLine("VectSphHit_quad: " + (et-dt));

    addLine("End Test 6");
}

function reflect1(inc, norm) {
    //r = v - 2.0 * dot(v, n) * n
    vec3.normalize(norm, norm);

    var result = [0 ,0 ,0];
    var dr = vec3.dot(inc, norm) * 2.0;
    vec3.scale(result, norm, dr);
    vec3.subtract(result, inc, result); // out a b return a-b

    return result;
}


function reflect2(inc, norm) {
    //r = v - 2.0 * dot(v, n) * n
    vec3.normalize(norm, norm);
   // var nx = norm[0], ny = norm[1], nz = norm[2];
   // var ix = inc[0], iy = inc[1], iz = inc[2];
    var dr2 = 2.0 * (inc[0] * norm[0] + inc[1] * norm[1] + inc[2] * norm[2]);   
    return [ inc[0] - (norm[0] * dr2) , inc[1] - (norm[1] * dr2), inc[2] - (norm[2] * dr2) ];
   //var dr2 = 2.0 * (ix * nx + iy * ny + iz * nz);  
   //return [ ix - (nx * dr2) , iy - (ny * dr2), iz - (nz * dr2) ];

}

function VectSphHit_geo(v, so, sr) {
    var t0 = 0; 
    var t1 = 0;
    var sr2 = sr * sr;

    var L = vec3.clone(so);
    var tca = vec3.dot(L, v);

    if  (tca < 0) return false;
    // sph behind origin

    var d2 = vec3.dot(L, L) - tca * tca;

    if (d2 > sr2) return false;
    // tangential point farther than radius

    var thc = Math.sqrt(sr2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;
    var t = (t0 > t1) ? t0 : t1;
    return t > 0 ? t : false;
}

function VectSphHit_quad(v, so, sr) {
    var t0 = 0; 
    var t1 = 0;
    var sr2 = sr * sr;

    var L = vec3.clone(so);
    var a = vec3.dot(v, v); 
    var b = 2 * vec3.dot(L, v); 
    var c = vec3.dot(L, L) - sr2; 

    var discr = b * b - 4 * a * c; 
    if (discr < 0) return false;

    if (discr == 0) {
        t0 = - 0.5 * b / a; 
        t1 = - 0.5 * b / a; 
    } else { 
        var q = (b > 0) ? 
            -0.5 * (b + Math.sqrt(discr)) : 
            -0.5 * (b - Math.sqrt(discr)); 
        t0 = q / a; 
        t1 = c / q; 
    } 

    var t = (t0 > t1) ? t0 : t1;
    return t > 0 ? t : false;
}


t.test7 = function() {
    const numtst = 5000000;
    
    addLine("Num iter: " + numtst);

    var idx = Array(numtst);
    for (var i = 0; i < numtst; ++i ) {
        idx[i] = Math.floor(Math.random()*3);
    }

    var s = 0;
    var a1 = [1, 1, 1];
    var a2 = [2, 2, 2];

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s += a1[idx[i]];
    }
    let et = performance.now();
    addLine("[1, 1, 1] rnd access: " + (et-dt));

     s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s += a1[0];
        s += a1[2];
        s += a1[3];
    }
    et = performance.now();
    addLine("[1, 1, 1] x3 access: " + (et-dt));

    s = 0;
    var f1 = new Float32Array([1, 1, 1]);
    var f2 = new Float32Array([2, 2, 2]);

    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s += f1[idx[i]];
    }
    et = performance.now();
    addLine("Float32Array([1, 1, 1]) rnd access: " + (et-dt));

    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s += f1[0];
        s += f1[1];
        s += f1[2];
    }
    et = performance.now();
    addLine("Float32Array([1, 1, 1]) x3 access: " + (et-dt));


    s = 0;
    var o1 = { a0: 1, a1 : 2, a2 : 3 };
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s = new Float32Array(3);
        s[0]=1;
        s[1]=2;
        s[2]=3;
    }
    et = performance.now();
    addLine("access o.a0 o.a1, o.a2: " + (et-dt));



    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s += a1[idx[i]] + a2[idx[i]]; 
        s += a2[idx[i]] + a1[idx[i]]; 
    }
    et = performance.now();
    addLine("add [1, 1, 1]: " + (et-dt));



    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s += f1[idx[i]] + f2[idx[i]]; 
        s += f2[idx[i]] + f1[idx[i]]; 
    }
    et = performance.now();
    addLine("add Float32Array: " + (et-dt));


    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s += f1[idx[i]] + a2[idx[i]]; 
        s += f2[idx[i]] + a1[idx[i]]; 
    }
    et = performance.now();
    addLine("add mix: " + (et-dt));

    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s = [1, 2, 3]; 
    }
    et = performance.now();
    addLine("create [1, 2, 3]: " + (et-dt));

    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s = []; 
        s[0]=1;
        s[1]=2;
        s[2]=3;
    }
    et = performance.now();
    addLine("create [] +  [0]=1 [1]=2 [2]=3: " + (et-dt));

    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s = []; 
        s.push(1);
        s.push(2);
        s.push(3);
    }
    et = performance.now();
    addLine("create [] + push(1) push(2) push(3): " + (et-dt));

    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s = Array(3);
        s[0]=1;
        s[1]=2;
        s[2]=3;
    }
    et = performance.now();
    addLine("create Array(3) +  [0]=1 [1]=2 [2]=3: " + (et-dt));

    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s = Array(1, 2, 3);
    }
    et = performance.now();
    addLine("create Array(1, 2, 3): " + (et-dt));

    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s = new Float32Array([1, 2, 3]);
    }
    et = performance.now();
    addLine("create FloatArray([1, 2, 3]): " + (et-dt));

    s = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s = new Float32Array(3);
        s[0]=1;
        s[1]=2;
        s[2]=3;
    }
    et = performance.now();
    addLine("create FloatArray(3) +  [0]=1 [1]=2 [2]=3: " + (et-dt));

    addLine("End Test 7");
}

t.test8 = function() {
    const numtst = 5000000;    
    addLine("Num iter: " + numtst);

    var idx = Array(numtst);
    for (var i = 0; i < numtst; ++i ) {
        idx[i] = Math.floor(Math.random()*3);
    }

    var s = [];
  //  var a1 = [1, 1, 1];
  //  var a2 = [2, 2, 2];

    let dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s.push([1,2,3]);
    }
    let et = performance.now();
    addLine("push([1, 1, 1]) : " + (et-dt));


    s = [];
    var idx = 0;
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3];
        idx++
    }
    et = performance.now();
    addLine("holed idx++: " + (et-dt));

    idx = 0;
    var inc = 1000000;
    s = Array(inc);
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3];
        idx++;
    }
    et = performance.now();
    addLine("start at inc, then holed : " + (et-dt));

    idx = 0;
    inc = 1000;
    var l = inc;
    s = Array(inc);
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3];
        idx++;
        if (idx >= l) {
            s.length += inc;
            l += inc;
        }
    }
    et = performance.now();
    addLine("length+= inc: " + (et-dt));

    /*
    idx = 0;
    inc = 1000;
    l = inc;
    s = Array(inc);
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3];
        idx++;
        if (idx >= l) {
            s = s.concat(Array(inc));
            l += inc;
        }
    }
    et = performance.now();
    addLine("concat(array(inc)) : " + (et-dt));
*/
    addLine("concat(array(inc)) : NOPE");


    idx = 0;
    inc = 1000000;
    var x = 0;
    s = Array(inc);
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3, 4, 5];
        x += s[idx][0] + s[idx][1] + s[idx][2] + s[idx][3] + s[idx][4] ; 
        idx++;
    }
    et = performance.now();
    addLine("s[a,b,c] read s[0]+s[1]+s[2] " + (et-dt));

    idx = 0;
    inc = 1000000;
    var x = 0;
    var s0 = Array(inc);
    var s1 = Array(inc);
    var s2 = Array(inc);
    var s3 = Array(inc);
    var s4 = Array(inc);
    dt = performance.now();
    for (let i = 0; i < numtst; ++i) {
        s0[idx] = 1;
        s1[idx] = 2;
        s2[idx] = 3;
        s3[idx] = 4;
        s4[idx] = 5;
        x += s0[idx] + s1[idx] + s2[idx] + s3[idx] + s4[idx]; 
        idx++;
    }
    et = performance.now();
    addLine("s0=a, s1=b, s2=c read s0+s1+s2 " + (et-dt));

    addLine("End Test 8");
}


t.test9a = function() {

    const numtst = 2500000;    
    addLine("Num iter: " + numtst);

    let obj1 = {};  
    let obj2 = { prop: [] }; 
    let obj3 = [];
/*
    for (var i = 0 ; i < 1000; ++i) {
        var val = rand(1000);
        obj1["prop0"] = val;
        obj2.prop.push(val);
    }
*/
    obj1["prop0"] = 0;
    obj1["prop1"] = 1;
    obj1["prop2"] = 2;
    obj1["prop3"] = 3;
    obj1["prop4"] = 4;
    obj1["prop5"] = 5;
    obj1["prop6"] = 6;
    obj1["prop7"] = 7;
    obj1["prop8"] = 8;
    obj1["prop9"] = 9;

    obj2.prop.push(0);
    obj2.prop.push(1);
    obj2.prop.push(2);
    obj2.prop.push(3);
    obj2.prop.push(4);
    obj2.prop.push(5);
    obj2.prop.push(6);
    obj2.prop.push(7);
    obj2.prop.push(8);
    obj2.prop.push(9);

    obj3.push(0);
    obj3.push(1);
    obj3.push(2);
    obj3.push(3);
    obj3.push(4);
    obj3.push(5);
    obj3.push(6);
    obj3.push(7);
    obj3.push(8);
    obj3.push(9);


    var mo = 0;
    var le = 0;
    var dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter)
        for (var x= 0; x < 10; ++x) {
        if ( obj1["prop" + x] >= 5) mo++;
        if ( obj1["prop" + x] < 5) le++;
    }
    var et = performance.now();
    addLine("obj[\"str\" + index] concat string : " + (et-dt) + " mo: " + mo + " le: " + le);


    mo = 0;
    le = 0;
    var dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) {
        if ( obj1["prop0"] >= 5) mo++;
        if ( obj1["prop0"] < 5) le++;

        if ( obj1["prop1"] >= 5) mo++;
        if ( obj1["prop1"] < 5) le++;

        if ( obj1["prop2"] >= 5) mo++;
        if ( obj1["prop2"] < 5) le++;

        if ( obj1["prop3"] >= 5) mo++;
        if ( obj1["prop3"] < 5) le++;

        if ( obj1["prop4"] >= 5) mo++;
        if ( obj1["prop4"] < 5) le++;

        if ( obj1["prop5"] >= 5) mo++;
        if ( obj1["prop5"] < 5) le++;

        if ( obj1["prop6"] >= 5) mo++;
        if ( obj1["prop6"] < 5) le++;

        if ( obj1["prop7"] >= 5) mo++;
        if ( obj1["prop7"] < 5) le++;

        if ( obj1["prop8"] >= 5) mo++;
        if ( obj1["prop8"] < 5) le++;

        if ( obj1["prop9"] >= 5) mo++;
        if ( obj1["prop9"] < 5) le++;

    }
    var et = performance.now();
    addLine("obj[\"string\"], const string : " + (et-dt) + " mo: " + mo + " le: " + le);


    mo = 0;
    le = 0;
    var dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) {
        if ( obj1.prop0 >= 5) mo++;
        if ( obj1.prop0 < 5) le++;

        if ( obj1.prop1 >= 5) mo++;
        if ( obj1.prop1 < 5) le++;

        if ( obj1.prop2 >= 5) mo++;
        if ( obj1.prop2 < 5) le++;

        if ( obj1.prop3 >= 5) mo++;
        if ( obj1.prop3 < 5) le++;

        if ( obj1.prop4 >= 5) mo++;
        if ( obj1.prop4 < 5) le++;

        if ( obj1.prop5 >= 5) mo++;
        if ( obj1.prop5 < 5) le++;

        if ( obj1.prop6 >= 5) mo++;
        if ( obj1.prop6 < 5) le++;

        if ( obj1.prop7 >= 5) mo++;
        if ( obj1.prop7 < 5) le++;

        if ( obj1.prop8 >= 5) mo++;
        if ( obj1.prop8 < 5) le++;

        if ( obj1.prop9 >= 5) mo++;
        if ( obj1.prop9 < 5) le++;

    }
    var et = performance.now();
    addLine("obj.val normal access : " + (et-dt) + " mo: " + mo + " le: " + le);


    
    mo = 0;
    le = 0;    
    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) for (var x= 0; x < 10; ++x) { 
        if ( obj2.prop[x] >= 5) mo++;
        if ( obj2.prop[x] < 5) le++;
    }

    et = performance.now();
    addLine("obj.array[iter] : " + (et-dt) + " mo: " + mo + " le: " + le);

    mo = 0;
    le = 0;    
    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) for (var x= 0; x < 10; ++x) { 
        if ( obj3[x] >= 5) mo++;
        if ( obj3[x] < 5) le++;
    }

    et = performance.now();
    addLine("array[iter] : " + (et-dt) + " mo: " + mo + " le: " + le);

    addLine("End Test 9a");
}



t.test9b = function() {

    const numtst = 10000000;    
    addLine("Num iter: " + numtst);

    let obj1 = {};  
    let obj3 = [];
    let obj4 = { prop: [] };
    let obj5 = { prop: [] };

    obj1["prop0"] = 0;
    obj1["prop1"] = 1;
    obj1["prop2"] = 2;
    obj1["prop3"] = 3;
    obj1["prop4"] = 4;
    obj1["prop5"] = 5;
    obj1["prop6"] = 6;
    obj1["prop7"] = 7;
    obj1["prop8"] = 8;
    obj1["prop9"] = 9;

    obj3.push(0);
    obj3.push(1);
    obj3.push(2);
    obj3.push(3);
    obj3.push(4);
    obj3.push(5);
    obj3.push(6);
    obj3.push(7);
    obj3.push(8);
    obj3.push(9);

    obj4.prop.push(0);
    obj4.prop.push(1);
    obj4.prop.push(2);
    obj4.prop.push(3);
    obj4.prop.push(4);
    obj4.prop.push(5);
    obj4.prop.push(6);
    obj4.prop.push(7);
    obj4.prop.push(8);
    obj4.prop.push(9);

    obj5.prop.push( { val: 0 } );
    obj5.prop.push( { val: 1 } );
    obj5.prop.push( { val: 2 } );
    obj5.prop.push( { val: 3 } );
    obj5.prop.push( { val: 4 } );
    obj5.prop.push( { val: 5 } );
    obj5.prop.push( { val: 6 } );
    obj5.prop.push( { val: 7 } );
    obj5.prop.push( { val: 8 } );
    obj5.prop.push( { val: 9 } );

    var mo = 0;
    var le = 0;

    var dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) {
        if ( obj1.prop0 >= 5) mo++;
        if ( obj1.prop0 < 5) le++;

        if ( obj1.prop1 >= 5) mo++;
        if ( obj1.prop1 < 5) le++;

        if ( obj1.prop2 >= 5) mo++;
        if ( obj1.prop2 < 5) le++;

        if ( obj1.prop3 >= 5) mo++;
        if ( obj1.prop3 < 5) le++;

        if ( obj1.prop4 >= 5) mo++;
        if ( obj1.prop4 < 5) le++;

        if ( obj1.prop5 >= 5) mo++;
        if ( obj1.prop5 < 5) le++;

        if ( obj1.prop6 >= 5) mo++;
        if ( obj1.prop6 < 5) le++;

        if ( obj1.prop7 >= 5) mo++;
        if ( obj1.prop7 < 5) le++;

        if ( obj1.prop8 >= 5) mo++;
        if ( obj1.prop8 < 5) le++;

        if ( obj1.prop9 >= 5) mo++;
        if ( obj1.prop9 < 5) le++;

    }
    var et = performance.now();
    addLine("obj.val : " + (et-dt) + " mo: " + mo + " le: " + le);


    mo = 0;
    le = 0;    
    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) for (var x= 0; x < 10; ++x) { 
        if ( obj3[x] >= 5) mo++;
        if ( obj3[x] < 5) le++;
    }

    et = performance.now();
    addLine("array[index] : " + (et-dt) + " mo: " + mo + " le: " + le);


    mo = 0;
    le = 0;    
    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) for (var x= 0; x < 10; ++x) { 
        if ( obj4.prop[x] >= 5) mo++;
        if ( obj4.prop[x] < 5) le++;
    }

    et = performance.now();
    addLine("obj.array[index] : " + (et-dt) + " mo: " + mo + " le: " + le);


    mo = 0;
    le = 0;    
    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) for (var x= 0; x < 10; ++x) { 
        if ( obj5.prop[x].val >= 5) mo++;
        if ( obj5.prop[x].val < 5) le++;
    }

    et = performance.now();
    addLine("obj.array[index].val : " + (et-dt) + " mo: " + mo + " le: " + le);


    addLine("End Test 9b");
}

//<div id="test9c" class="test">9c-Access time obj.a=new[], obj.a[i]=, obj.obj.p= </div>
t.test9c = function() {
    //self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-Sph"];
    const numtst = 10000000;
    const numData = 100;    
    addLine("Num iter: " + numtst);

    var markers = [];
    for (var i = 0; i < numData; ++i) markers.push(randStr(6));
    var t0 = [];
    for (var i = 0; i < numData; ++i) t0.push(rand(1000));
    var hitNormal = [];
    for (var i = 0; i < numData; ++i) hitNormal.push(v3_val_new(rand(10), rand(10), rand(10)) );
    var firstHit = [];
    for (var i = 0; i < numData; ++i) firstHit.push(v3_val_new(rand(10), rand(10), rand(10)) );
    var type = [];
    for (var i = 0; i < numData; ++i) type.push(randStr(10));

    String.fromCodePoint(65, 90); 
    let obj1 = { obj1a : ["", 0, [0, 0, 0], [0, 0, 0], ""] }; // new [] clone v3
    let obj2 = { obj2a : ["", 0, [0, 0, 0], [0, 0, 0], ""] }; // write to [] clone v3
    let obj3 = { obj3a : ["", 0, [0, 0, 0], [0, 0, 0], ""] }; // write to [] copy v3
    let obj4 = { obj4a : { m:"", t0:0, n:[0,0,0], p0:[0,0,0], d:""}  };  // copy to .obj.x
    let obj5 = { obj5a : [{ m:"", t0:0, n:[0,0,0], p0:[0,0,0], d:""}]  };  // copy to [i].obj.x

    var dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) {
        obj1.obj1a = [markers[iter % numData], t0[iter % numData], v3_clone(hitNormal[iter % numData]), v3_clone(firstHit[iter % numData]), type[iter % numData] ];
    }
    var et = performance.now();
    addLine("write, new [], clone v3 : " + (et-dt));

  
    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter) {
        obj2.obj2a[0] = markers[iter % numData];
        obj2.obj2a[1] = t0[iter % numData];
        obj2.obj2a[2] = v3_clone(hitNormal[iter % numData]);
        obj2.obj2a[3] = v3_clone(firstHit[iter % numData]);
        obj2.obj2a[4] = type[iter % numData];
    }

    et = performance.now();
    addLine("write, [0], by const, v3 clone : " + (et-dt));


    const _m = 0;
    const _t = 1;
    const _n = 2;
    const _p = 3;
    const _d = 4;


    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter)  { 
        obj2.obj2a[_m] = markers[iter % numData];
        obj2.obj2a[_t] = t0[iter % numData];
        obj2.obj2a[_n] = v3_clone(hitNormal[iter % numData]);
        obj2.obj2a[_p] = v3_clone(firstHit[iter % numData]);
        obj2.obj2a[_d] = type[iter % numData];
    }

    et = performance.now();
    addLine("write, [_c], by var, v3_clone : " + (et-dt));

    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter)  { 
        obj3.obj3a[0] = markers[iter % numData];
        obj3.obj3a[1] = t0[iter % numData];
        v3_copy(obj3.obj3a[2], hitNormal[iter % numData]);
        v3_copy(obj3.obj3a[3], firstHit[iter % numData]);
        obj3.obj3a[4] = type[iter % numData];
    }

    et = performance.now();
    addLine("write, [0], by const, v3_copy : " + (et-dt));

    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter)  { 
        obj3.obj3a[_m] = markers[iter % numData];
        obj3.obj3a[_t] = t0[iter % numData];
        v3_copy(obj3.obj3a[_n], hitNormal[iter % numData]);
        v3_copy(obj3.obj3a[_p], firstHit[iter % numData]);
        obj3.obj3a[_d] = type[iter % numData];
    }

    et = performance.now();
    addLine("write, [_c], by var, v3_copy : " + (et-dt));


 
    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter)  { 
        obj4.obj4a.m = markers[iter % numData];
        obj4.obj4a.t0 = t0[iter % numData];
        v3_copy(obj4.obj4a.n, hitNormal[iter % numData]);
        v3_copy(obj4.obj4a.p0, firstHit[iter % numData]);
        obj4.obj4a.d = type[iter % numData];
    }

    et = performance.now();
    addLine("write, obj.prop, v3_copy : " + (et-dt));

    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter)  { 
        obj5.obj5a[0].m = markers[iter % numData];
        obj5.obj5a[0].t0 = t0[iter % numData];
        v3_copy(obj5.obj5a[0].n, hitNormal[iter % numData]);
        v3_copy(obj5.obj5a[0].p0, firstHit[iter % numData]);
        obj5.obj5a[0].d = type[iter % numData];
    }

    et = performance.now();
    addLine("write, obj.[0].prop, v3_copy : " + (et-dt));


    dt = performance.now();
    for (var iter = 0; iter < numtst; ++iter)  { 
        obj5.obj5a[_m].m = markers[iter % numData];
        obj5.obj5a[_m].t0 = t0[iter % numData];
        v3_copy(obj5.obj5a[_m].n, hitNormal[iter % numData]);
        v3_copy(obj5.obj5a[_m].p0, firstHit[iter % numData]);
        obj5.obj5a[_m].d = type[iter % numData];
    }

    et = performance.now();
    addLine("write, obj.[_c].prop, v3_copy : " + (et-dt));

    addLine("End Test 9c");
}

var e = 0;
var f = 0;
var g = 0;
var h = 0;

t.test10 = function() {

    const numtst = 150;    
    addLine("Num iter: " + numtst + " (hypercubed)");

    let arr = [];
    for (let i = 0; i < numtst; ++i) arr.push(1);
    



    let sum = 0;

    var dt = performance.now();
    for (var h = 0; h < numtst; ++h) 
        for (var i = 0; i < numtst; ++i) 
            for (var j = 0; j < numtst; ++j) 
                for (var k = 0; k < numtst; ++k) sum += arr[k];

    var et = performance.now();
    addLine("var ++iter : " + (et-dt) + " sum: " + sum);

    sum = 0;

    dt = performance.now();

    for (var h = 0; h < numtst; ++h)
        for (let i = 0; i < numtst; ++i)
            for (let j = 0; j < numtst; ++j)
                for (let k = 0; k < numtst; ++k) sum += arr[k];

    et = performance.now();
    addLine("let ++iter : " + (et-dt) + " sum: " + sum);


    sum = 0;
    var dt = performance.now();

    for (var h = 0; h < numtst; h++)
        for (var i = 0; i < numtst; i++)
            for (var j = 0; j < numtst; j++)
                for (var k = 0; k < numtst; k++) sum += arr[k];

    var et = performance.now();
    addLine("var iter++ : " + (et-dt) + " sum: " + sum);

    sum = 0;
    dt = performance.now();

    for (var h = 0; h < numtst; h++) 
        for (let i = 0; i < numtst; i++)
            for (let j = 0; j < numtst; j++)
                for (let k = 0; k < numtst; k++) sum += arr[k];

    et = performance.now();
    addLine("let iter++ : " + (et-dt) + " sum: " + sum);


    sum = 0;

    let l = 0;
    let m = 0;
    let n = 0;
    let o = 0;
    dt = performance.now();

    for (l = 0; l < numtst; ++l) 
        for (m = 0; m < numtst; ++m)
            for (n = 0; n < numtst; ++n)
                for (o = 0; o < numtst; ++o) sum += arr[o];

    et = performance.now();
    addLine("local let ++iter : " + (et-dt) + " sum: " + sum);


    sum = 0;

    dt = performance.now();

    for (e = 0; e < numtst; ++e) 
        for (f = 0; f < numtst; ++f)
            for (g = 0; g < numtst; ++g)
                for (h = 0; h < numtst; ++h) sum += arr[h];

    et = performance.now();
    addLine("global var ++iter : " + (et-dt) + " sum: " + sum);





    addLine("End Test 10");
}



t.test11 = function() {

    const numtst = 1000000;    
    addLine("Num iter: " + numtst + " ()");

    let arr = [];
    let resarr = [];
    let eps = 0.001; 
    let inveps = 1.0 / eps; 
    for (let i = 0; i < numtst; ++i) {
        arr.push(rndPM(0.002));
        resarr.push(false);
    }



    var dt = performance.now();
    for (var i = 0; i < 1; ++i) 
        for (var j = 0; j < numtst; ++j) resarr[j] = (Math.abs(arr[j]) < eps);
    var et = performance.now();
    addLine("(Math.abs(x) < eps) : " + (et-dt));

    dt = performance.now();
    for (var i = 0; i < 100; ++i) 
        for (var j = 0; j < numtst; ++j) resarr[j] = (Math.round(arr[j] / eps) != 0);  
    et = performance.now();
    addLine("(Math.round(arr[j] / eps) != 0) : " + (et-dt));

    dt = performance.now();
    for (var i = 0; i < 100; ++i) 
        for (var j = 0; j < numtst; ++j) resarr[j] = (Math.round(arr[j] * inveps) != 0);  
    et = performance.now();
    addLine("(Math.round(arr[j] * inveps) != 0) : " + (et-dt));


    addLine("End Test 11");
}


t.test12 = function() {

    const numtst = 100000;
    const numNum = 3000;    
    addLine("Num iter: " + numtst + " ()");
    addLine("Num numbers: " + numNum + " ()");

    let f32a = new Float32Array(numNum);
    let f32b = new Float32Array(numNum);
    let f32r = new Float32Array(numNum);
    let nora = new Array(numNum);
    let norb = new Array(numNum);
    let norr = new Array(numNum);



    for (let i = 0; i < numNum; ++i) {
        var a = rndPM(1000) / 10.0; if (a == 0.0) a = 0.1;
        var b = rndPM(1000) / 10.0; if (b == 0.0) b = -0.1;
        f32a[i] = a;
        f32b[i] = b;

        var a = rndPM(1000) / 10.0; if (a == 0.0) a = 0.1;
        var b = rndPM(1000) / 10.0; if (b == 0.0) b = -0.1;
        nora[i] = a;
        norb[i] = b;      
    }



    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) 
            for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] + f32b[j];
    var et = performance.now();
    addLine("f32 a + b : " + (et-dt));

    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) 
            for (var j = 0; j < numNum; ++j) norr[j] = nora[j] + norb[j];
    var et = performance.now();
    addLine("nor a + b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] + f32b[j];
    var et = performance.now();
    addLine("f32 a + b : " + (et-dt));


    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] - f32b[j];
    var et = performance.now();
    addLine("f32 a - b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) norr[j] = nora[j] - norb[j];
    var et = performance.now();
    addLine("nor a - b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] - f32b[j];
    var et = performance.now();
    addLine("f32 a - b : " + (et-dt));


    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] * f32b[j];
    var et = performance.now();
    addLine("f32 a * b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) norr[j] = nora[j] * norb[j];
    var et = performance.now();
    addLine("nor a * b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] * f32b[j];
    var et = performance.now();
    addLine("f32 a * b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] / f32b[j];
    var et = performance.now();
    addLine("f32 a / b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) norr[j] = nora[j] / norb[j];
    var et = performance.now();
    addLine("nor a / b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] / f32b[j];
    var et = performance.now();
    addLine("f32 a / b : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = Math.sqrt( f32a[j]*f32a[j] + f32b[j]*f32b[j] );
    var et = performance.now();
    addLine("f32 sqrt(a*a + b*b) : " + (et-dt));

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) norr[j] = Math.sqrt( nora[j]*nora[j] + norb[j]*norb[j] );
    var et = performance.now();
    addLine("nor sqrt(a*a + b*b) : " + (et-dt));


    addLine("End Test 12");
}



t.test13 = function() {

    const numtst = 1000000;
  
    addLine("Num iter: " + numtst + " ()");

    let a1 = new Array(numtst);
    let r1 = new Array(numtst);
    let ang1 = new Array(numtst);

    var t1 = 0;
    var t2 = 0;
    var t3 = 0;

    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resRecalc(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resRecalc: " + (et-dt));
    t1 += (et-dt);

    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resLocalVar(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resLocalVar: " + (et-dt));
    t2 += (et-dt);

    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resLocalVarCache(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resLocalVarCache: " + (et-dt));
    t3 += (et-dt);



    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resLocalVarCache(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resLocalVarCache: " + (et-dt));
    t3 += (et-dt);

    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resRecalc(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resRecalc: " + (et-dt));
    t1 += (et-dt);

    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resLocalVar(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resLocalVar: " + (et-dt));
    t2 += (et-dt);




    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resLocalVar(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resLocalVar: " + (et-dt));
    t2 += (et-dt);

    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resLocalVarCache(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resLocalVarCache: " + (et-dt));
    t3 += (et-dt);

    for (let i = 0; i < numtst; ++i) {
        ang1[i] = rand(2 * Math.PI);
        a1[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        r1[i] = [ 0, 0, 0 ]; 
    }
    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_rotateX_resRecalc(r1[i], a1[i], ang1[i]);
    var et = performance.now();
    addLine("v3_rotateX_resRecalc: " + (et-dt));
    t1 += (et-dt);
    addLine("");
    addLine("v3_rotateX_resRecalc total: " + t1);
    addLine("v3_rotateX_resLocalVar total: " + t2);
    addLine("v3_rotateX_resLocalVarCache total: " + t3);


    addLine("End Test 13");
}




t.test14 = function() {

    const numtst = 1000000;
  
    addLine("Num iter: " + numtst);

    let a = new Array(numtst);
    let b = new Array(numtst);
    let r = new Array(numtst);

    for (let i = 0; i < numtst; ++i) {
        a[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        b[i] = [ rndPM(1), rndPM(1), rndPM(1) ];  
        r[i] = [ 0, 0, 0 ]; 
    }
    
    var t1 = 0;
    var t2 = 0;

    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_reflect_resAccessAll(r[i], a[i], b[i]);
    var et = performance.now();
    addLine("v3_reflect_resAccessAll: " + (et-dt));
    t1 += (et-dt);

    addLine("Randomizing sets");
    for (let i = 0; i < numtst; ++i) {
        a[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        b[i] = [ rndPM(1), rndPM(1), rndPM(1) ];  
        r[i] = [ 0, 0, 0 ]; 
    }

    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_reflect_resCachedAccess(r[i], a[i], b[i]);
    var et = performance.now();
    addLine("v3_reflect_resCachedAccess: " + (et-dt));
    t2 += (et-dt);

    addLine("Randomizing sets");
    for (let i = 0; i < numtst; ++i) {
        a[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        b[i] = [ rndPM(1), rndPM(1), rndPM(1) ];  
        r[i] = [ 0, 0, 0 ]; 
    }

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) v3_reflect_resCachedAccess(r[i], a[i], b[i]);
    var et = performance.now();
    addLine("v3_reflect_resCachedAccess: " + (et-dt));
    t2 += (et-dt);

    addLine("Randomizing sets");
    for (let i = 0; i < numtst; ++i) {
        a[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        b[i] = [ rndPM(1), rndPM(1), rndPM(1) ];  
        r[i] = [ 0, 0, 0 ]; 
    }

    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_reflect_resAccessAll(r[i], a[i], b[i]);
    var et = performance.now();
    addLine("v3_reflect_resAccessAll: " + (et-dt));
    t1 += (et-dt);

    addLine("Randomizing sets");    
    for (let i = 0; i < numtst; ++i) {
        a[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        b[i] = [ rndPM(1), rndPM(1), rndPM(1) ];  
        r[i] = [ 0, 0, 0 ]; 
    }

    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_reflect_resAccessAll(r[i], a[i], b[i]);
    var et = performance.now();
    addLine("v3_reflect_resAccessAll: " + (et-dt));
    t1 += (et-dt);

    addLine("Randomizing sets");
    for (let i = 0; i < numtst; ++i) {
        a[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        b[i] = [ rndPM(1), rndPM(1), rndPM(1) ];  
        r[i] = [ 0, 0, 0 ]; 
    }

    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_reflect_resCachedAccess(r[i], a[i], b[i]);
    var et = performance.now();
    addLine("v3_reflect_resCachedAccess: " + (et-dt));
    t2 += (et-dt);


    addLine("Randomizing sets");
    for (let i = 0; i < numtst; ++i) {
        a[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        b[i] = [ rndPM(1), rndPM(1), rndPM(1) ];  
        r[i] = [ 0, 0, 0 ]; 
    }

    var dt = performance.now();
    for (var i = 0; i < numtst; ++i) v3_reflect_resCachedAccess(r[i], a[i], b[i]);
    var et = performance.now();
    addLine("v3_reflect_resCachedAccess: " + (et-dt));
    t2 += (et-dt);

    addLine("Randomizing sets");
    for (let i = 0; i < numtst; ++i) {
        a[i] = [ rndPM(100), rndPM(100), rndPM(100) ];  
        b[i] = [ rndPM(1), rndPM(1), rndPM(1) ];  
        r[i] = [ 0, 0, 0 ]; 
    }

    var dt = performance.now();
        for (var i = 0; i < numtst; ++i) v3_reflect_resAccessAll(r[i], a[i], b[i]);
    var et = performance.now();
    addLine("v3_reflect_resAccessAll: " + (et-dt));
    t1 += (et-dt);
    
    addLine("");
    addLine("v3_reflect_resAccessAll total: " + t1);
    addLine("v3_reflect_resCachedAccess total: " + t2);

    addLine("End Test 14");
}



t.test15 = function() {

    const numIter = 10000;
    const numtst = 1000;
  
    addLine("Num iter: " + numtst);

    let m = new Array(numtst);
    let v = new Array(numtst);
    let r = new Array(numtst);

    var t1 = 0; // m4_translate_resNoCache
    var t2 = 0; // m4_translate_resCacheVect
    var t3 = 0; // m4_translate_resCacheMat
    var t4 = 0; // m4_translate_resCacheBoth

    for (var cur_itt = 0; cur_itt < numIter; ++cur_itt) {

        for (let i = 0; i < numtst; ++i) {
            m[i] = m4_new();  
            m[i][0] = rndPM(10);
            m[i][5] = rndPM(10);
            m[i][10] = rndPM(10);
            v[i] = [ rndPM(10), rndPM(10), rndPM(10) ];  
            r[i] = m4_new();  
        }
        var dt = performance.now();
            for (var i = 0; i < numtst; ++i) m4_translate_resNoCache(r[i], m[i], v[i]);
        var et = performance.now();
        t1 += (et-dt);

        for (let i = 0; i < numtst; ++i) {
            m[i] = m4_new();  
            m[i][0] = rndPM(10);
            m[i][5] = rndPM(10);
            m[i][10] = rndPM(10);
            v[i] = [ rndPM(10), rndPM(10), rndPM(10) ];  
            r[i] = m4_new();  
        }
        var dt = performance.now();
            for (var i = 0; i < numtst; ++i) m4_translate_resCacheVect(r[i], m[i], v[i]);
        var et = performance.now();
        t2 += (et-dt);

        for (let i = 0; i < numtst; ++i) {
            m[i] = m4_new();  
            m[i][0] = rndPM(10);
            m[i][5] = rndPM(10);
            m[i][10] = rndPM(10);
            v[i] = [ rndPM(10), rndPM(10), rndPM(10) ];  
            r[i] = m4_new();  
        }
        var dt = performance.now();
            for (var i = 0; i < numtst; ++i) m4_translate_resCacheMat(r[i], m[i], v[i]);
        var et = performance.now();
        t3 += (et-dt);

        for (let i = 0; i < numtst; ++i) {
            m[i] = m4_new();  
            m[i][0] = rndPM(10);
            m[i][5] = rndPM(10);
            m[i][10] = rndPM(10);
            v[i] = [ rndPM(10), rndPM(10), rndPM(10) ];  
            r[i] = m4_new();  
        }
        var dt = performance.now();
            for (var i = 0; i < numtst; ++i) m4_translate_resCacheBoth(r[i], m[i], v[i]);
        var et = performance.now();
        t4 += (et-dt);   

    }

    addLine("");
    addLine("m4_translate_resNoCache total: " + t1);
    addLine("m4_translate_resCacheVect total: " + t2);
    addLine("m4_translate_resCacheMat total: " + t3);
    addLine("m4_translate_resCacheBoth total: " + t4);


    addLine("End Test 15");
}






function rndPM(val) { // random between plus or minus "val"
    return (2*val*Math.random()) - val;
}

function rand(x) {
    return Math.floor(Math.random() * x);
}

function randStr(l) {
    var res = "";
    for (var i = 0; i < l; ++i) res = res + (String.fromCodePoint(64+rand(64)));
    return res;
}

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

function v3_rotateX_resRecalc(res, a, ang) {
    res[0] = a[0];
    res[1] = a[1] * Math.cos(ang) - a[2] * Math.sin(ang);
    res[2] = a[1] * Math.sin(ang) + a[2] * Math.cos(ang);
}

function v3_rotateX_resLocalVar(res, a, ang) {
    let c = Math.cos(ang);
    let s = Math.sin(ang);
    res[0] = a[0];
    res[1] = a[1] * c - a[2] * s;
    res[2] = a[1] * s + a[2] * c;
}
function v3_rotateX_resLocalVarCache(res, a, ang) {
    let c = Math.cos(ang);
    let s = Math.sin(ang);
    let y = a[1];
    let z = a[2];
    res[0] = a[0];
    res[1] = y * c - z * s;
    res[2] = y * s + z * c;
}

function v3_reflect_resAccessAll(result, inc, norm) {
    var dr2 = 2.0 * (inc[0] * norm[0] + inc[1] * norm[1] + inc[2] * norm[2]);
    result[0] = inc[0] - (norm[0] * dr2); 
    result[1] = inc[1] - (norm[1] * dr2);
    result[2] = inc[2] - (norm[2] * dr2);
}

function v3_reflect_resCachedAccess(result, inc, norm) {
    var ix =  inc[0], iy =  inc[1], iz =  inc[2];
    var nx = norm[0], ny = norm[1], nz = norm[2];
    var dr2 = 2.0 * (ix * nx + iy * ny + iz * nz);
    result[0] = ix - (nx * dr2); 
    result[1] = iy - (ny * dr2);
    result[2] = iz - (nz * dr2);
}



function m4_translate_resNoCache(res, a, v){
    res[0] = a[0]; res[1] = a[1]; res[2]  = a[2];  res[3]  = a[3];
    res[4] = a[4]; res[5] = a[5]; res[6]  = a[6];  res[7]  = a[7];
    res[8] = a[8]; res[9] = a[9]; res[10] = a[10]; res[11] = a[11];

    res[12] = a[0] * v[0] + a[4] * v[1] + a[8]  * v[2] + a[12];
    res[13] = a[1] * v[0] + a[5] * v[1] + a[9]  * v[2] + a[13];
    res[14] = a[2] * v[0] + a[6] * v[1] + a[10] * v[2] + a[14];
    res[15] = a[3] * v[0] + a[7] * v[1] + a[11] * v[2] + a[15];
}

function m4_translate_resCacheVect(res, a, v){
    var x = v[0], y = v[1], z = v[2];

    res[0] = a[0]; res[1] = a[1]; res[2]  = a[2];  res[3]  = a[3];
    res[4] = a[4]; res[5] = a[5]; res[6]  = a[6];  res[7]  = a[7];
    res[8] = a[8]; res[9] = a[9]; res[10] = a[10]; res[11] = a[11];

    res[12] = a[0] * x + a[4] * y + a[8]  * z + a[12];
    res[13] = a[1] * x + a[5] * y + a[9]  * z + a[13];
    res[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    res[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
}

function m4_translate_resCacheMat(res, a, v){
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
    var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];

    res[0] = a0;
    res[1] = a1;
    res[2] = a2;
    res[3] = a3;

    res[4] = a4;
    res[5] = a5;
    res[6] = a6;
    res[7] = a7;

    res[8] =  a8;
    res[9] =  a9; 
    res[10] = a10;
    res[11] = a11;

    res[12] = a0 * v[0] + a4 * v[1] + a8  * v[2] + a[12];
    res[13] = a1 * v[0] + a5 * v[1] + a9  * v[2] + a[13];
    res[14] = a2 * v[0] + a6 * v[1] + a10 * v[2] + a[14];
    res[15] = a3 * v[0] + a7 * v[1] + a11 * v[2] + a[15];
}

function m4_translate_resCacheBoth(res, a, v){
    var x = v[0], y = v[1], z = v[2];

    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7];
    var a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];

    res[0] = a0;
    res[1] = a1;
    res[2] = a2;
    res[3] = a3;

    res[4] = a4;
    res[5] = a5;
    res[6] = a6;
    res[7] = a7;

    res[8]  = a8;
    res[9]  = a9; 
    res[10] = a10;
    res[11] = a11;

    res[12] = a0 * x + a4 * y + a8  * z + a[12];
    res[13] = a1 * x + a5 * y + a9  * z + a[13];
    res[14] = a2 * x + a6 * y + a10 * z + a[14];
    res[15] = a3 * x + a7 * y + a11 * z + a[15];
}


function m4_new(){
    var m = new Array(16);
    m[0] =  1;        m[1] =  0;        m[2] =  0;       m[3] =  0;
    m[4] =  0;        m[5] =  1;        m[6] =  0;       m[7] =  0;
    m[8] =  0;        m[9] =  0;        m[10] = 1;       m[11] = 0;
    m[12] = 0;        m[13] = 0;        m[14] = 0;       m[15] = 1;
    return m;      
}



});