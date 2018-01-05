document.addEventListener("DOMContentLoaded", function () {

"use strict"

var sessionStart = new Date().getTime();


// elements
var can = document.getElementById("GLCanvas");
var log = document.getElementById("logDiv");
var status = document.getElementById("statusDiv");

// events
document.getElementById("test1").addEventListener("click", test1);
document.getElementById("test2").addEventListener("click", test2);
document.getElementById("test3").addEventListener("click", test3);
document.getElementById("test4").addEventListener("click", test4);
document.getElementById("test5").addEventListener("click", test5);
document.getElementById("test6").addEventListener("click", test6);
document.getElementById("test7").addEventListener("click", test7);

const gco = [0 ,0 ,0];
let glo = [0,0 ,0];
var gvo = [0, 0, 0];

const gcv  = vec3.create();
let glv  = vec3.create();
var gvv  = vec3.create();

function test1(event) {
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

    const numtst = 5000000;
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




}

function test2(event) {

    let sum = 0;
    const numtst = 1000000;

    let dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        sum += Date.now() - dt;
    }
    let et = Date.now();

    addLine("Date.now() x" + numtst + ": " + (et-dt));


    dt = Date.now();
    for (let i = 0; i < numtst; ++i) {
        sum += (new Date()).getTime() - dt;
    }
    et = Date.now();

    addLine("new Date().getTime() x" + numtst + ": " + (et-dt));
}


function test3(event) {

    const numtst = 5000000;
    var d = vec3.create();

    addLine("Num iter: " + numtst);

    addLine("");

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
    addLine("d[] = s[]" + " : " + (et-dt));
}

function test4(event) {
    let ms = mat4.create();
    let md = mat4.create();
    let v = vec3.create();


    const numtst = 5000000;
    
    addLine("Num iter: " + numtst);
    
    addLine("");
    
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


}




function test5() {
    const numtst = 100000;
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

}




function test6() {
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


function test7(event) {
    const numtst = 5000000;
    
    addLine("Num iter: " + numtst);
  /*  
    var vec3_dummy = [0, 0, 0];
    var _ia = [];
    var _na = [];
    var _ra = [];
    
    for (var i = 0; i < numtst; ++i ) {
        _ia[i] = vec3.random(vec3_dummy, Math.random(10)+1);
        _na[i] = vec3.random(vec3_dummy, Math.random(10)+1);
        _ra[i] =  Math.random(10)+1;
    }

    var ia = _ia.slice(0, numtst);
    var na = _na.slice(0, numtst);
/*
*/
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


}

/*
bool intersect(const Ray &ray) const 
{ 
        float t0, t1; // solutions for t if the ray intersects 
#if 0 
        // geometric solution
        Vec3f L = center - orig; 
        float tca = L.dotProduct(dir); 
        // if (tca < 0) return false;
        float d2 = L.dotProduct(L) - tca * tca; 
        if (d2 > radius2) return false; 
        float thc = sqrt(radius2 - d2); 
        t0 = tca - thc; 
        t1 = tca + thc; 
#else 
        // analytic solution
        Vec3f L = orig - center; 
        float a = dir.dotProduct(dir); 
        float b = 2 * dir.dotProduct(L); 
        float c = L.dotProduct(L) - radius2; 
        if (!solveQuadratic(a, b, c, t0, t1)) return false; 
#endif 
        if (t0 > t1) std::swap(t0, t1); 
 
        if (t0 < 0) { 
            t0 = t1; // if t0 is negative, let's use t1 instead 
            if (t0 < 0) return false; // both t0 and t1 are negative 
        } 
 
        t = t0; 
 
        return true; 
bool solveQuadratic(const float &a, const float &b, const float &c, float &x0, float &x1) 
{ 
    float discr = b * b - 4 * a * c; 
    if (discr < 0) return false; 
    else if (discr == 0) x0 = x1 = - 0.5 * b / a; 
    else { 
        float q = (b > 0) ? 
            -0.5 * (b + sqrt(discr)) : 
            -0.5 * (b - sqrt(discr)); 
        x0 = q / a; 
        x1 = c / q; 
    } 
    if (x0 > x1) std::swap(x0, x1); 
 
    return true; 
} 
*/




function addLine(text) {
    log.innerHTML += "[" + ((new Date()).getTime() - sessionStart) + "] " + text + "<br />";
}


});