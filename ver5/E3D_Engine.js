var E3D_scriptList = [

    "ver5/math.js",
    "ver5/utility.js",
    "ver5/debug.js",

    "ver5/timing.js",
    "ver5/input.js",    
    
    "ver5/shader.js",
    "ver5/camera.js",
    "ver5/entity.js",
    "ver5/scene.js",

    "ver5/animation.js",
    "ver5/collision.js",
    
    "ver5/core.js",
    "ver5/resource.js",
    "ver5/mesh.js"
];
    
var E3D_numScriptLoaded = 0;
function E3D_scriptLoaded() {
    E3D_numScriptLoaded++;
    if (E3D_numScriptLoaded >= E3D_scriptList.length) {
        log("ScriptsLoaded");
        if (E3D_userInit) E3D_userInit();
    }
}
for (var i = 0; i < E3D_scriptList.length; ++i) {
    var s = document.createElement("script");
    s.type = "text/javascript"; 
    s.onload = E3D_scriptLoaded;
    s.src = E3D_scriptList[i];
    document.head.appendChild(s);
}