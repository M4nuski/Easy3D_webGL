// Easy3D_WebGL
// ASCII to Baudot drum mesh generator 1
// Emmanuel Charette 2024

"use strict"

E3D_DEBUG_LOG_TIMESTAMPS = true;

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
SCENE.strokeColor = _v3_black;

// Create the entities
var groundEntity = new E3D_entity_wireframe_canvas("entity0");

// Ground plane
groundEntity.addPlane(_v3_origin, _v3_null, 12 * 25.4, 12*25.4, _v3_black, 120);
groundEntity.addPlane([0.0, -0.01, 0.0], _v3_null, 0.6*25.4, 0.6*25.4, _v3_lightgray, 60);
groundEntity.addPlane([0.0, 0.01, 0.0], _v3_null, 12*25.4, 12*25.4, _v3_red, 12);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);

// Tweak engine params
E3D_NEAR = 1.0;
E3D_FAR = 1024.0*4;
CAMERA = new E3D_camera_model("camera0m");
E3D_onResize();
CONTEXT.disable(CONTEXT.CULL_FACE);

// Move the camera back and up a little, add some nod
CAMERA.moveBy(0, 192, 384, 0.0, 0, 0.0);
SCENE.setClearColor([ 0.85,  0.85,  0.85]);
SCENE.lightA_color = _v3_darkgray;
//INPUTS._posSpeed *= 0.025;
//INPUTS._rotSpeed *= 0.75;

// mesh creating utility
var bunnyLoader = new E3D_mesh();
load_bunny();

var meshLoader = new E3D_mesh();
var entity = new E3D_entity("entity1", true); // dynamic entity, GPU data will be updated when changed
// Setup entity
entity.isVisible = true;
//entity.position = [0.0, 100.0, -20.0];
entity.rotation = [0.0, PIdiv2, 0.0];
E3D_addEntity(entity);

var genInhibit = false;

// Mesh parameters

var startBits = 1;
var stopBits = 2;
var syncBits = 1;

const _A = [1, 1, 0, 0, 0];
const _B = [1, 0, 0, 1, 1];
const _C = [0, 1, 1, 1, 0];
const _D = [1, 0, 0, 1, 0];
const _E = [1, 0, 0, 0, 0];
const _F = [1, 0, 1, 1, 0];
const _G = [0, 1, 0, 1, 1];
const _H = [0, 0, 1, 0, 1];
const _I = [0, 1, 1, 0, 0];
const _J = [1, 1, 0, 1, 0];
const _K = [1, 1, 1, 1, 0];
const _L = [0, 1, 0, 0, 1];
const _M = [0, 0, 1, 1, 1];
const _N = [0, 0, 1, 1, 0];
const _O = [0, 0, 0, 1, 1];
const _P = [0, 1, 1, 0, 1];
const _Q = [1, 1, 1, 0, 1];
const _R = [0, 1, 0, 1, 0];
const _S = [1, 0, 1, 0, 0];
const _T = [0, 0, 0, 0, 1];
const _U = [1, 1, 1, 0, 0];
const _V = [0, 1, 1, 1, 1];
const _W = [1, 1, 0, 0, 1];
const _X = [1, 0, 1, 1, 1];
const _Y = [1, 0, 1, 0, 1];
const _Z = [0, 0, 0, 0, 1];

const _CR = [0, 0, 0, 1, 0];
const _LF = [0, 1, 0, 0, 0];
const _LETTERS = [1, 1, 1, 1, 1];
const _FIGURES = [1, 1, 0, 1, 1];
const _SPACE = [0, 0, 1, 0, 0];
const _BLANK = [0, 0, 0, 0, 0];

const _NA_PRE = _FIGURES;
const _NA_CHR = _B; // default print "?" on not implemented characters

const ASCII_BAUDOT_ITA2STD = { // TODO ASCII_BAUDOT_ITA2USTTY
    0: [_BLANK , _BLANK ], // NULL
    1: [_NA_PRE , _NA_CHR], // SOHeading
    2: [_NA_PRE , _NA_CHR], // SOText
    3: [_NA_PRE , _NA_CHR], // EOText
    4: [_NA_PRE , _NA_CHR], // EOTransmission
    5: [_FIGURES , _D ], // whois    //$ for USTTY
    6: [_NA_PRE , _NA_CHR], // ACK
    7: [_FIGURES , _J ], // BELL   //_S for BELL in USTTY
    8: [_NA_PRE , _NA_CHR], // BS
    9: [_NA_PRE , _NA_CHR], // TAB
    10: [_BLANK , _LF ], // LF
    11: [_NA_PRE , _NA_CHR], // VTAB
    12: [_NA_PRE , _NA_CHR], // FF
    13: [_BLANK , _CR ], // CR
    14: [_NA_PRE , _NA_CHR], // SO
    15: [_NA_PRE , _NA_CHR], // SI

    16: [_NA_PRE , _NA_CHR], // DLE
    17: [_NA_PRE , _NA_CHR], // DC1 XON
    18: [_NA_PRE , _NA_CHR], // DC2
    19: [_NA_PRE , _NA_CHR], // DC3 XOFF
    20: [_NA_PRE , _NA_CHR], // DC4
    21: [_NA_PRE , _NA_CHR], // NACK
    22: [_NA_PRE , _NA_CHR], // SYNC Idle
    23: [_NA_PRE , _NA_CHR], // EOTransmission block
    24: [_NA_PRE , _NA_CHR], // Cancel
    25: [_NA_PRE , _NA_CHR], // EOMedium
    26: [_NA_PRE , _NA_CHR], // SUB
    27: [_NA_PRE , _NA_CHR], // ESC
    28: [_NA_PRE , _NA_CHR], // FS
    29: [_NA_PRE , _NA_CHR], // GS
    30: [_NA_PRE , _NA_CHR], // RS
    31: [_NA_PRE , _NA_CHR], // US

    32: [_LETTERS , _SPACE ], //
    33: [_FIGURES , _F ], //!
    34: [_NA_PRE , _NA_CHR ], //"   "'" ?
    35: [_FIGURES , _H ], //#
    36: [_FIGURES , _H ], //$ // for US?
    37: [_NA_PRE , _NA_CHR ], //%
    38: [_FIGURES , _G ], //&
    39: [_FIGURES , _S ], //'
    40: [_FIGURES , _K ], //(
    41: [_FIGURES , _L ], //)
    42: [_NA_PRE , _NA_CHR ], //*
    43: [_FIGURES , _F ], //+
    44: [_FIGURES , _N ], //,
    45: [_FIGURES , _A ], //-
    46: [_FIGURES , _M ], //.
    47: [_FIGURES , _X ], ///

    48: [_FIGURES , _P ], //0
    49: [_FIGURES , _Q ], //1
    50: [_FIGURES , _W ], //2
    51: [_FIGURES , _E ], //3
    52: [_FIGURES , _R ], //4
    53: [_FIGURES , _T ], //5
    54: [_FIGURES , _Y ], //6
    55: [_FIGURES , _U ], //7
    56: [_FIGURES , _I ], //8
    57: [_FIGURES , _O ], //9
    58: [_FIGURES , _C ], //:
    59: [_NA_PRE , _NA_CHR ], //;   ":" ?
    60: [_NA_PRE , _NA_CHR ], //<
    61: [_FIGURES , _V ], //=
    62: [_NA_PRE , _NA_CHR ], //>
    63: [_FIGURES , _B ], //?

    64: [_NA_PRE , _NA_CHR ], //@
    65: [_LETTERS , _A ], //A
    66: [_LETTERS , _B ], //B
    67: [_LETTERS , _C ], //C
    68: [_LETTERS , _D ], //D
    69: [_LETTERS , _E ], //E
    70: [_LETTERS , _F ], //F
    71: [_LETTERS , _G ], //G
    72: [_LETTERS , _H ], //H
    73: [_LETTERS , _I ], //I
    74: [_LETTERS , _J ], //J
    75: [_LETTERS , _K ], //K
    76: [_LETTERS , _L ], //L
    77: [_LETTERS , _M ], //M
    78: [_LETTERS , _N ], //N
    79: [_LETTERS , _O ], //O

    80: [_LETTERS , _P ], //P
    81: [_LETTERS , _Q ], //Q
    82: [_LETTERS , _R ], //R
    83: [_LETTERS , _S ], //S
    84: [_LETTERS , _T ], //T
    85: [_LETTERS , _U ], //U
    86: [_LETTERS , _V ], //V
    87: [_LETTERS , _W ], //W
    88: [_LETTERS , _X ], //X
    89: [_LETTERS , _Y ], //Y
    90: [_LETTERS , _Z ], //Z
    91: [_NA_PRE , _NA_CHR ], //[   "(" ?
    92: [_NA_PRE , _NA_CHR ], //\   "/" ?
    93: [_NA_PRE , _NA_CHR ], //]   ")" ?
    94: [_NA_PRE , _NA_CHR ], //^
    95: [_NA_PRE , _NA_CHR ], //_   "-" ?

    96: [_NA_PRE , _NA_CHR ], //`   "'" ?
    97: [_LETTERS , _A ], //a
    98: [_LETTERS , _B ], //b
    99: [_LETTERS , _C ], //c
    100: [_LETTERS , _D ], //d
    101: [_LETTERS , _E ], //e
    102: [_LETTERS , _F ], //f
    103: [_LETTERS , _G ], //g
    104: [_LETTERS , _H ], //h
    105: [_LETTERS , _I ], //i
    106: [_LETTERS , _J ], //j
    107: [_LETTERS , _K ], //k
    108: [_LETTERS , _L ], //l
    109: [_LETTERS , _M ], //m
    110: [_LETTERS , _N ], //n
    111: [_LETTERS , _O ], //o
    112: [_LETTERS , _P ], //p

    113: [_LETTERS , _Q ], //q
    114: [_LETTERS , _R ], //r
    115: [_LETTERS , _S ], //s
    116: [_LETTERS , _T ], //t
    117: [_LETTERS , _U ], //u
    118: [_LETTERS , _V ], //v
    119: [_LETTERS , _W ], //w
    120: [_LETTERS , _X ], //x
    121: [_LETTERS , _Y ], //y
    122: [_LETTERS , _Z ], //z
    123: [_NA_PRE , _NA_CHR ], //{     "(" ?
    124: [_NA_PRE , _NA_CHR ], //|     "1" ?
    125: [_NA_PRE , _NA_CHR ], //}     ")" ?
    126: [_NA_PRE , _NA_CHR ], //~     "-" ?
    127: [_NA_PRE , _NA_CHR ], //
}

var sliceHeight = 4.0;
var majorDia = 50.0;
var insideDia = 12.6;
var bumpHeight = 4.0;
var bumpType = "S";

var sync = true;
var syncPos = 128;
var syncBit = 0;
var syncType = "S";

var skipMode = "S";

function genMesh(){
    if (genInhibit) return;
    entity.clear();
    meshLoader.reset();
    //document.activeElement.blur();
    // mode pre + char
    // 1 start bit, 5 pre bit, 2 stop bits, 1 start bit, 5 char bits, 2 stop bits
    // 16 bits per revolutions
    var bpr = 16;
    var apr = 2 * Math.PI / bpr;
    var pVect = v3_val_new(0.0, 0.0, majorDia / 2.0);
    var npVect = v3_rotateY_new(pVect, apr);
    var w = v3_distance(pVect, npVect)*1.02;

    for (var s = 0; s < 128; ++s) {
        var empty = (ASCII_BAUDOT_ITA2STD[s][0] == _NA_PRE) && (ASCII_BAUDOT_ITA2STD[s][1] == _NA_CHR);
        if (!empty || (skipMode != "S")) {

            var ss = s; // override slice index for empty chars
            if (empty && (skipMode == " ")) ss = 32;
            if (empty && (skipMode == "?")) ss = 63;
            if (empty && (skipMode == "N")) ss = 0;

            var data = [0]; // start bit
            data = data.concat(ASCII_BAUDOT_ITA2STD[ss][0]);
            data = data.concat([1, 1]); // 2 stop bits
            data = data.concat([0]); // start bit
            data = data.concat(ASCII_BAUDOT_ITA2STD[ss][1]);
            data = data.concat([1, 1]); // 2 stop bits

            for (var b = 0; b < bpr; ++b) {
                v3_rotateY_mod(pVect, apr);
                if (data[b] == 0) {
                    if (bumpType == "S") meshLoader.pushOpenBox(pVect, [0.0, apr * (b+1), 0.0], w, sliceHeight, bumpHeight, _v3_white, meshLoader.originType.BOTTOMBACK ,true, false, true, true, true, true);
                    if (bumpType == "B") {
                        meshLoader.pushOpenBox(pVect, [0.0, apr * (b+1), 0.0], w, sliceHeight, bumpHeight, _v3_white, meshLoader.originType.BOTTOMBACK ,true, false, true, true, true, true);
                        bunnyLoader.appendTransformedModelData(entity, pVect, [0.0, (apr * (b+1)) + Math.PI, 0.0]);
                    }
                    if (bumpType == "L") meshLoader.pushHalfAsymetricPrism(pVect, [0.0, apr * (b+1), 0.0], w/2, bumpHeight, sliceHeight, 8, _v3_white, meshLoader.originType.BOTTOMBACK, _v3_white, true, true, false);
                    if (bumpType == "P") meshLoader.pushHalfAsymetricPrism(pVect, [0.0, apr * (b+1), 0.0], w/2, bumpHeight, sliceHeight, 2, _v3_white, meshLoader.originType.BOTTOMBACK, _v3_white, true, true, false);
                } else {
                    meshLoader.pushPlane(pVect, [0.0, apr * (b+1), 0.0], w, sliceHeight, 0, _v3_gray, meshLoader.originType.BOTTOMBACK);
                }

            } // each bit

            v3_add_mod(pVect, [0.0, sliceHeight, 0.0]);
        } //each slices
    }
    meshLoader.appendModelData(entity);
}

function load_bunny() {
        var ajax = new XMLHttpRequest();
        ajax.addEventListener("load", (event) => {
            let xm = event.target;
            if (xm) {
                if (xm.status == 200) {
                    var eData = xm.response;
                    bunnyLoader.loadModel_STL("../media/bun_res3.stl", eData, _v3_white, [80.0, 80.0, 80.0]);
                } else {
                    console.log(xm.responseURL  + " " + xm.statusText);
                }
            }
        } );
        ajax.open("GET", "../media/bun_res3.stl");
        ajax.responseType = "arraybuffer";
        ajax.send();
}

var paramDiv1 = document.getElementById("paramDiv1");
E3D_addHeader(paramDiv1, "Parameters");
E3D_addInput_range(paramDiv1, "dia", "Ext Diameter", 2, 120, 50, paramDiv1CB, 0.5);
E3D_addInput_range(paramDiv1, "hole", "Int Diameter", 1, 100, 12.6, paramDiv1CB, 0.1);
E3D_addInput_range(paramDiv1, "sh", "Slice Height", 1, 25, 4, paramDiv1CB, 0.1);
E3D_addInput_range(paramDiv1, "bh", "Bump Height", 0, 10, 4, paramDiv1CB, 0.05);
E3D_addInput_select(paramDiv1, "bt", "Bump Type", ["Square", "Lobe", "Pyra", "Bunny"], ["S", "L", "P", "B"], paramDiv1CB);
function paramDiv1CB(event, type, id, value, group) {
    switch (id) {
        case "dia":
            majorDia = value;
            break;
        case "hole":
            insideDia = value;
            break;
        case "sh":
            sliceHeight = value;
            break;
        case "bh":
            bumpHeight = value;
            break;
        case "bt":
            bumpType = value;
            break;
    }
    entity.clear();
    genMesh();
}

var paramDiv2 = document.getElementById("paramDiv2");
E3D_addHeader(paramDiv2, "Sync ring");
E3D_addInput_checkbox(paramDiv2, "sync", "Sync Ring", true, paramDiv2CB);
E3D_addInput_range(paramDiv2, "syncPos", "Sync Position", 0, 128, 128, paramDiv2CB, 1);
E3D_addInput_range(paramDiv2, "syncBit", "Sync Bit", 0, 128, 128, paramDiv2CB, 1);
E3D_addInput_select(paramDiv2, "syncType", "Bump Type", ["Square", "Lobe", "Pyra"], ["S", "L", "P"], paramDiv2CB);
function paramDiv2CB(event, type, id, value, group) {
    switch (id) {
        case "sync":
            sync = value;
            break;
        case "syncPos":
            syncPos = value;
            break;
        case "syncBit":
            syncBit = value;
            break;
        case "syncType":
            syncType = value;
            break;
    }

    entity.clear();
    genMesh();
}

var paramDiv3 = document.getElementById("paramDiv3");
E3D_addHeader(paramDiv3, "Code");
E3D_addInput_select(paramDiv3, "codeType", "Type", ["ITA2", "USTTY"], null, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "noEmpty", "Skip Unimplemented", "empty", true, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "qmEmpty", "Unimplemented == '?'", "empty", false, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "spEmpty", "Unimplemented == SPACE", "empty", false, paramDiv3CB);
E3D_addInput_radio(paramDiv3, "nullEmpty", "Unimplemented == NULL", "empty", false, paramDiv3CB);
function paramDiv3CB(event, type, id, value, group) {
    console.log("event t:" + type + " i:" + id + " v:" + value + " g:" + group);

    if (group == "empty") switch (id) {
        case "noEmpty":
            skipMode = "S";
            break;
        case "qmEmpty":
            skipMode = "?";
            break;
        case "spEmpty":
            skipMode = " ";
            break;
        case "nullEmpty":
            skipMode = "N";
            break;
    }
    entity.clear();
    genMesh();
}

var bottomBar = document.getElementById("bottomBar");
CB_tick = function() {
    var t = entity.numElements/3 + " poly, ";
    bottomBar.innerText = t;
}

var text_output = document.getElementById("text_output");

document.getElementById("button_save").addEventListener("click", saveMesh);
function saveMesh() {
    meshloader.loadModel_fromEntity(entity);
    downloadBlob("ASCIItoBAUDOTcylinder.stl", meshLoader.saveModel_ASCIISTL("ver5baudotDrum1.js"));
}
document.getElementById("button_clean").addEventListener("click", cleanMesh);

function cleanMesh() {
    meshloader.loadModel_fromEntity(entity);

    var st = performance.now();
    meshLoader.removeArealessTriangles();
    var et = performance.now();
    console.log("t rem area 0 tri : " + (et - st));

    st = performance.now();
    meshLoader.genBoundingBox();
    et = performance.now();
    console.log("t gen bb : " + (et - st));

    st = performance.now();
    meshLoader.genUniqueVertices();
    et = performance.now();
    console.log("t uniques: " + (et - st));

    st = performance.now();
    meshLoader.smoothNormals(0.71);
    et = performance.now();
    console.log("t smooth : " + (et - st));

    st = performance.now();
    meshLoader.genEdges();
    et = performance.now();
    console.log("t edges: " + (et - st));

    entity.clear();
    meshLoader.addModelData(entity);

    st = performance.now();
    meshLoader.addStrokeData(entity);
    et = performance.now();
    console.log("t add stroke data: " + (et - st));
}

E3D_onResize(); // UI addition changes the viewport size
entity.clear();
genMesh();
