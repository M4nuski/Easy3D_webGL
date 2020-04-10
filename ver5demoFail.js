// Easy3D_WebGL
// Main demo program for version 0.5
// Fallback script on engine script list load error.
// Emmanuel Charette 2020


var elem = document.createElement("div");
elem.style.backgroundColor = "red";
elem.style.color = "white";
elem.style.position = "absolute";
elem.style.zIndex = "9999";
elem.style.top = "0px";
elem.style.left = "0px";
elem.style.right = "0px";
elem.innerText = "Easy3D Engine v0.5 script list load error: " + E3D_currentScript;
document.body.appendChild(elem);
