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













function addLine(text) {
    log.innerHTML += "[" + ((new Date()).getTime() - sessionStart) + "] " + text + "<br />";
}


});