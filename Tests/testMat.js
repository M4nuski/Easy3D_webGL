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

function addText(text) {
    log.innerHTML += text; 
    log.scrollTop = log.scrollHeight;
}

function rand(x) {
    return Math.floor(Math.random() * x);
}


function drawMatrix(m) {
    addLine("Matrix:");

    var l = "<table><tr><td>";
    l += Math.floor(m[0] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[4] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[8] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[12] * 100) / 100;
    l += "</td></tr>";

    l += "<tr><td>";
    l += Math.floor(m[1] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[5] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[9] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[13] * 100) / 100;
    l += "</td></tr>";

    l += "<tr><td>";
    l += Math.floor(m[2] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[6] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[10] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[14] * 100) / 100;
    l += "</td></tr>";

    l += "<tr><td>";
    l += Math.floor(m[3] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[7] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[11] * 100) / 100;
    l += "</td><td>";
    l += Math.floor(m[15] * 100) / 100;
    l += "</td></tr></table>";

    addText(l);
    addLine("");
}


const t = {};

t.test1 = function() {
    let m1 = mat4.create();
    mat4.scale(m1, m1, [1.1, 2.2, 3.3, 4.4]);
    drawMatrix(m1);
    let m2 = mat4.create();
    mat4.translate(m2, m2, [10, 20, 30, 40]);
    drawMatrix(m2);

    let m3 = mat4.create();
    mat4.multiply(m3, m2, m1);
    addLine("m2 X m1");
    drawMatrix(m3);

    mat4.multiply(m3, m1, m2);
    addLine("m1 X m2");
    drawMatrix(m3);
    
    let m4 = mat4.create();
    mat4.invert(m4, m3);
    addLine("inverse");
    drawMatrix(m4);

    mat4.transpose(m4, m3);
    addLine("transpose");
    drawMatrix(m4);

    mat4.rotateZ(m3, m1, 3.141592/2);
    addLine("rotate m1 z 90d");
    drawMatrix(m3);

    mat4.invert(m4, m3);
    addLine("inverse");
    drawMatrix(m4);

    mat4.transpose(m4, m3);
    addLine("transpose");
    drawMatrix(m4);

    addLine("End Test 1");
}






});