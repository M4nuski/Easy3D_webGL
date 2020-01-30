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

const gcv  = vec3.create();
let glv  = vec3.create();
var gvv  = vec3.create();

const t = {};

t.test1 = function() {
    const lco = [0 ,0 ,0];
    let llo = [0,0 ,0];
    var lvo = [0, 0, 0];

    var v1 = vec3.create();

    const lcv  = vec3.create();
    let llv  = vec3.create();
    var lvv  = vec3.create();


    //direct cast [0,0,0]
    //cast from new vec3.create();
    //cast from new vec3.fromValues(0, 0, 0);

    const numtst = 25000000;
    addLine("Num iter: " + numtst);
    addLine("Premade vec3, local");

    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, lcv);
    }
    let et = Date.now();

    addLine("const" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, llv);
    }
    et = Date.now();

    addLine("let" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, lvv);
    }
    et = Date.now();

    addLine("var" + " : " + (et-dt));


    addLine("");
    addLine("Premade vec3, global");

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, gcv);
    }
    et = Date.now();

    addLine("const" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, glv);
    }
    et = Date.now();

    addLine("let" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, gvv);
    }
    et = Date.now();

    addLine("var" + " : " + (et-dt));






    addLine("");
    addLine("Inline");

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, [0, 0, 0]);
    }
    et = Date.now();

    addLine("array [0,0,0]" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, [lvv[0],lvv[1],lvv[2]]);
    }
    et = Date.now();

    addLine("array [v[0],v[1],v[2]]" + " : " + (et-dt));


    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, vec3.create());
    }
    et = Date.now();

    addLine("vec3.create()" + " : " + (et-dt));


    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, vec3.fromValues(0, 0, 0));
    }
    et = Date.now();

    addLine("vec3.fromValues()" + " : " + (et-dt));


    addLine("");
    addLine("Local array");


    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, lco);
    }
    et = Date.now();

    addLine("const" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, llo);
    }
    et = Date.now();

    addLine("let" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, lvo);
    }
    et = Date.now();

    addLine("var" + " : " + (et-dt));


    addLine("");
    addLine("Global array");


    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, gco);
    }
    et = Date.now();

    addLine("const" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, glo);
    }
    et = Date.now();

    addLine("let" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.add(v1, v1, gvo);
    }
    et = Date.now();

    addLine("var" + " : " + (et-dt));



    addLine("End Test 1");
}

t.test2 = function() {

    let sum = 0;
    const numtst = 25000000;
    addLine("Num iter: " + numtst);

    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        sum += Date.now() - dt;
    }
    let et = Date.now();

    addLine("Date.now(): " + (et-dt));


    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        sum += (new Date()).getTime() - dt;
    }
    et = Date.now();

    addLine("new Date().getTime() x: " + (et-dt));

    addLine("End Test 2");
}


t.test3a = function() {

    const numtst = 25000000;
    var d = vec3.create();

    addLine("Num iter: " + numtst);

    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        d = vec3.fromValues(gvv[0], gvv[1], gvv[2]);
    }
    let et = Date.now();
    addLine("d = fromValues(s[])" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.copy(d, gvv);
    }
    et = Date.now();
    addLine("copy(d, s)" + " : " + (et-dt));


    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        d = vec3.clone(gvv);
    }
    et = Date.now();
    addLine("d = clone(s)" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        d[0] = gvv[0];
        d[1] = gvv[1];
        d[2] = gvv[2];
    }
    et = Date.now();
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
    var d = vec3.create();
    var s = vec3.create();
    addLine("Num iter: " + numtst);

    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        d = vec3.clone(s);
    }
    let et = Date.now();
    addLine("d = vec3.clone(s)" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        d[0] = s[0];
        d[1] = s[1];
        d[2] = s[2];
    }
    et = Date.now();
    addLine("d[i] = s[i]" + " : " + (et-dt));


    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        d = s.slice();
    }
    et = Date.now();
    addLine("d = s.slice();" + " : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        copy3f3f(d, s);
    }
    et = Date.now();
    addLine("copy3f3f(d, s);" + " : " + (et-dt));


    copy3f3f

    addLine("End Test 3b");
}

t.test4 = function() {
    let ms = mat4.create();
    let md = mat4.create();
    let v = vec3.create();

    const numtst = 5000000;    
    addLine("Num iter: " + numtst);
    
    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        mat4.translate(md, ms, v);
    }
    let et = Date.now();
    addLine("translate(md, ms, v) : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.negate(v, v);
        mat4.translate(md, ms, v);
    }
    et = Date.now();
    addLine("vec.negate(v) + translate(md, ms, v) : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        mat4.translate(md, ms, [-v[0], -v[1], -v[2]] );
    }
    et = Date.now();
    addLine("translate(md, ms, [-v[]...]) : " + (et-dt));

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        vec3.negate(v, v);
        mat4.translate(md, ms, v);
        vec3.negate(v, v);
    }
    et = Date.now();
    addLine("negate(v) + translate(md, ms, v) + negate(v) : " + (et-dt));

    let dummy = vec3.create();
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        mat4.translate(md, ms, vec3.negate(dummy, v));
    }
    et = Date.now();
    addLine("translate(md, ms, negate(dummy, v)) : " + (et-dt));

    addLine("End Test 4");
}




t.test5 = function() {
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

    var dummy = 0;
    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        var x = Math.floor(Math.random() * numItem);
        dummy = ar[x];
    }

    let et = Date.now();
    addLine("random access array: " + (et-dt));

    dummy = 0;
     dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        var x = Math.floor(Math.random() * numItem);
        dummy = ma.get(x);
    }

     et = Date.now();
    addLine("random access map: " + (et-dt));

    
    dummy = 0;
    let idx = 0;
     dt = Date.now();
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

     et = Date.now();
    addLine("array search by for: " + (et-dt));

    dummy = 0;
    dt = Date.now();
   for (let i = 0; i < numtst; ++i) {
       var x = Math.floor(Math.random() * numItem);
       dummy = ar[ar.indexOf(x)];
   }

    et = Date.now();
   addLine("array search by indexOf: " + (et-dt));

   addLine("End Test 5");
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

    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        var x = reflect1(ia[i], na[i]);
        var r = x[0] + x[1] + x[2];
    }

    let et = Date.now();
    addLine("reflect1: " + (et-dt));

    ia = _ia.slice(0, numtst);
    na = _na.slice(0, numtst);

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
      var x = reflect2(ia[i], na[i]);
      var r = x[0] + x[1] + x[2];
    }

    et = Date.now();
    addLine("reflect2: " + (et-dt));


    ia = _ia.slice(0, numtst);
    na = _na.slice(0, numtst);
    var ra = _ra.slice(0, numtst);
    var r = 0;

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        var x = VectSphHit_geo(ia[i], na[i], ra[i]);
        if (x != false) r += x;

    }

    et = Date.now();
    addLine("VectSphHit_geo: " + (et-dt));


    ia = _ia.slice(0, numtst);
    na = _na.slice(0, numtst);
    ra = _ra.slice(0, numtst);
    r = 0;

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        var x = VectSphHit_quad(ia[i], na[i], ra[i]);
        if (x != false) r += x;

    }

    et = Date.now();
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

    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s += a1[idx[i]];
    }
    let et = Date.now();
    addLine("[1, 1, 1] rnd access: " + (et-dt));

     s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s += a1[0];
        s += a1[2];
        s += a1[3];
    }
    et = Date.now();
    addLine("[1, 1, 1] x3 access: " + (et-dt));

    s = 0;
    var f1 = new Float32Array([1, 1, 1]);
    var f2 = new Float32Array([2, 2, 2]);

    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s += f1[idx[i]];
    }
    et = Date.now();
    addLine("Float32Array([1, 1, 1]) rnd access: " + (et-dt));

    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s += f1[0];
        s += f1[1];
        s += f1[2];
    }
    et = Date.now();
    addLine("Float32Array([1, 1, 1]) x3 access: " + (et-dt));


    s = 0;
    var o1 = { a0: 1, a1 : 2, a2 : 3 };
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s = new Float32Array(3);
        s[0]=1;
        s[1]=2;
        s[2]=3;
    }
    et = Date.now();
    addLine("access o.a0 o.a1, o.a2: " + (et-dt));



    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s += a1[idx[i]] + a2[idx[i]]; 
        s += a2[idx[i]] + a1[idx[i]]; 
    }
    et = Date.now();
    addLine("add [1, 1, 1]: " + (et-dt));



    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s += f1[idx[i]] + f2[idx[i]]; 
        s += f2[idx[i]] + f1[idx[i]]; 
    }
    et = Date.now();
    addLine("add Float32Array: " + (et-dt));


    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s += f1[idx[i]] + a2[idx[i]]; 
        s += f2[idx[i]] + a1[idx[i]]; 
    }
    et = Date.now();
    addLine("add mix: " + (et-dt));

    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s = [1, 2, 3]; 
    }
    et = Date.now();
    addLine("create [1, 2, 3]: " + (et-dt));

    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s = []; 
        s[0]=1;
        s[1]=2;
        s[2]=3;
    }
    et = Date.now();
    addLine("create [] +  [0]=1 [1]=2 [2]=3: " + (et-dt));

    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s = []; 
        s.push(1);
        s.push(2);
        s.push(3);
    }
    et = Date.now();
    addLine("create [] + push(1) push(2) push(3): " + (et-dt));

    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s = Array(3);
        s[0]=1;
        s[1]=2;
        s[2]=3;
    }
    et = Date.now();
    addLine("create Array(3) +  [0]=1 [1]=2 [2]=3: " + (et-dt));

    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s = Array(1, 2, 3);
    }
    et = Date.now();
    addLine("create Array(1, 2, 3): " + (et-dt));

    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s = new Float32Array([1, 2, 3]);
    }
    et = Date.now();
    addLine("create FloatArray([1, 2, 3]): " + (et-dt));

    s = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s = new Float32Array(3);
        s[0]=1;
        s[1]=2;
        s[2]=3;
    }
    et = Date.now();
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

    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s.push([1,2,3]);
    }
    let et = Date.now();
    addLine("push([1, 1, 1]) : " + (et-dt));


    s = [];
    var idx = 0;
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3];
        idx++
    }
    et = Date.now();
    addLine("holed idx++: " + (et-dt));

    idx = 0;
    var inc = 1000000;
    s = Array(inc);
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3];
        idx++;
    }
    et = Date.now();
    addLine("start at inc, then holed : " + (et-dt));

    idx = 0;
    inc = 1000;
    var l = inc;
    s = Array(inc);
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3];
        idx++;
        if (idx >= l) {
            s.length += inc;
            l += inc;
        }
    }
    et = Date.now();
    addLine("length+= inc: " + (et-dt));

    /*
    idx = 0;
    inc = 1000;
    l = inc;
    s = Array(inc);
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3];
        idx++;
        if (idx >= l) {
            s = s.concat(Array(inc));
            l += inc;
        }
    }
    et = Date.now();
    addLine("concat(array(inc)) : " + (et-dt));
*/
    addLine("concat(array(inc)) : NOPE");


    idx = 0;
    inc = 1000000;
    var x = 0;
    s = Array(inc);
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s[idx] = [1, 2, 3, 4, 5];
        x += s[idx][0] + s[idx][1] + s[idx][2] + s[idx][3] + s[idx][4] ; 
        idx++;
    }
    et = Date.now();
    addLine("s[a,b,c] read s[0]+s[1]+s[2] " + (et-dt));

    idx = 0;
    inc = 1000000;
    var x = 0;
    var s0 = Array(inc);
    var s1 = Array(inc);
    var s2 = Array(inc);
    var s3 = Array(inc);
    var s4 = Array(inc);
    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        s0[idx] = 1;
        s1[idx] = 2;
        s2[idx] = 3;
        s3[idx] = 4;
        s4[idx] = 5;
        x += s0[idx] + s1[idx] + s2[idx] + s3[idx] + s4[idx]; 
        idx++;
    }
    et = Date.now();
    addLine("s0=a, s1=b, s2=c read s0+s1+s2 " + (et-dt));

    addLine("End Test 8");
}


t.test9 = function() {

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
    var dt = Date.now();
    for (var iter = 0; iter < numtst; ++iter)
        for (var x= 0; x < 10; ++x) {
        if ( obj1["prop" + x] >= 5) mo++;
        if ( obj1["prop" + x] < 5) le++;
    }
    var et = Date.now();
    addLine("prop list, concat string : " + (et-dt) + " mo: " + mo + " le: " + le);



    mo = 0;
    le = 0;
    var dt = Date.now();
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
    var et = Date.now();
    addLine("prop list, direct string : " + (et-dt) + " mo: " + mo + " le: " + le);


    mo = 0;
    le = 0;
    var dt = Date.now();
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
    var et = Date.now();
    addLine("prop normal access : " + (et-dt) + " mo: " + mo + " le: " + le);


    
    mo = 0;
    le = 0;    
    dt = Date.now();
    for (var iter = 0; iter < numtst; ++iter) for (var x= 0; x < 10; ++x) { 
        if ( obj2.prop[x] >= 5) mo++;
        if ( obj2.prop[x] < 5) le++;
    }

    et = Date.now();
    addLine("obj.array[iter] : " + (et-dt) + " mo: " + mo + " le: " + le);

    mo = 0;
    le = 0;    
    dt = Date.now();
    for (var iter = 0; iter < numtst; ++iter) for (var x= 0; x < 10; ++x) { 
        if ( obj3[x] >= 5) mo++;
        if ( obj3[x] < 5) le++;
    }

    et = Date.now();
    addLine("obj[iter] : " + (et-dt) + " mo: " + mo + " le: " + le);

    addLine("End Test 9");
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

    var dt = Date.now();
    for (var h = 0; h < numtst; ++h) 
        for (var i = 0; i < numtst; ++i) 
            for (var j = 0; j < numtst; ++j) 
                for (var k = 0; k < numtst; ++k) sum += arr[k];

    var et = Date.now();
    addLine("var ++iter : " + (et-dt) + " sum: " + sum);

    sum = 0;

    dt = Date.now();

    for (var h = 0; h < numtst; ++h)
        for (let i = 0; i < numtst; ++i)
            for (let j = 0; j < numtst; ++j)
                for (let k = 0; k < numtst; ++k) sum += arr[k];

    et = Date.now();
    addLine("let ++iter : " + (et-dt) + " sum: " + sum);


    sum = 0;
    var dt = Date.now();

    for (var h = 0; h < numtst; h++)
        for (var i = 0; i < numtst; i++)
            for (var j = 0; j < numtst; j++)
                for (var k = 0; k < numtst; k++) sum += arr[k];

    var et = Date.now();
    addLine("var iter++ : " + (et-dt) + " sum: " + sum);

    sum = 0;
    dt = Date.now();

    for (var h = 0; h < numtst; h++) 
        for (let i = 0; i < numtst; i++)
            for (let j = 0; j < numtst; j++)
                for (let k = 0; k < numtst; k++) sum += arr[k];

    et = Date.now();
    addLine("let iter++ : " + (et-dt) + " sum: " + sum);


    sum = 0;

    let l = 0;
    let m = 0;
    let n = 0;
    let o = 0;
    dt = Date.now();

    for (l = 0; l < numtst; ++l) 
        for (m = 0; m < numtst; ++m)
            for (n = 0; n < numtst; ++n)
                for (o = 0; o < numtst; ++o) sum += arr[o];

    et = Date.now();
    addLine("local let ++iter : " + (et-dt) + " sum: " + sum);


    sum = 0;

    dt = Date.now();

    for (e = 0; e < numtst; ++e) 
        for (f = 0; f < numtst; ++f)
            for (g = 0; g < numtst; ++g)
                for (h = 0; h < numtst; ++h) sum += arr[h];

    et = Date.now();
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



    var dt = Date.now();
        for (var i = 0; i < 1; ++i) 
            for (var j = 0; j < numtst; ++j) resarr[j] = (Math.abs(arr[j]) < eps);
    var et = Date.now();
    addLine("(Math.abs(x) < eps) : " + (et-dt));

    dt = Date.now();
    for (var i = 0; i < 100; ++i) 
        for (var j = 0; j < numtst; ++j) resarr[j] = (Math.round(arr[j] / eps) != 0);  
    et = Date.now();
    addLine("(Math.round(arr[j] / eps) != 0) : " + (et-dt));

    dt = Date.now();
    for (var i = 0; i < 100; ++i) 
        for (var j = 0; j < numtst; ++j) resarr[j] = (Math.round(arr[j] * inveps) != 0);  
    et = Date.now();
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



    var dt = Date.now();
        for (var i = 0; i < numtst; ++i) 
            for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] + f32b[j];
    var et = Date.now();
    addLine("f32 a + b : " + (et-dt));

    var dt = Date.now();
        for (var i = 0; i < numtst; ++i) 
            for (var j = 0; j < numNum; ++j) norr[j] = nora[j] + norb[j];
    var et = Date.now();
    addLine("nor a + b : " + (et-dt));

    var dt = Date.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] - f32b[j];
    var et = Date.now();
    addLine("f32 a - b : " + (et-dt));

    var dt = Date.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) norr[j] = nora[j] - norb[j];
    var et = Date.now();
    addLine("nor a - b : " + (et-dt));

    var dt = Date.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] * f32b[j];
    var et = Date.now();
    addLine("f32 a * b : " + (et-dt));

    var dt = Date.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) norr[j] = nora[j] * norb[j];
    var et = Date.now();
    addLine("nor a * b : " + (et-dt));

    var dt = Date.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = f32a[j] / f32b[j];
    var et = Date.now();
    addLine("f32 a / b : " + (et-dt));

    var dt = Date.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) norr[j] = nora[j] / norb[j];
    var et = Date.now();
    addLine("nor a / b : " + (et-dt));

    var dt = Date.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) f32r[j] = Math.sqrt( f32a[j]*f32a[j] + f32b[j]*f32b[j] );
    var et = Date.now();
    addLine("f32 sqrt(a*a + b*b) : " + (et-dt));

    var dt = Date.now();
    for (var i = 0; i < numtst; ++i) 
        for (var j = 0; j < numNum; ++j) norr[j] = Math.sqrt( nora[j]*nora[j] + norb[j]*norb[j] );
    var et = Date.now();
    addLine("nor sqrt(a*a + b*b) : " + (et-dt));


    addLine("End Test 12");
}

function rndPM(val) { // random between plus or minus "val"
    return (2*val*Math.random()) - val;
}

function rand(x) {
    return Math.floor(Math.random() * x);
}



});