// Easy3D_WebGL
// Propeller generator 1
// Emmanuel Charette 2021


"use strict"


var paramText1 = document.getElementById("params1");
var paramText2 = document.getElementById("params2");

var profile = [
    //top
    [0.0000000, 0.0000000, 0.0],
    [0.0005000, 0.0023390, 0.0],
    [0.0010000, 0.0037271, 0.0],
    [0.0020000, 0.0058025, 0.0],
    [0.0040000, 0.0089238, 0.0],
    [0.0080000, 0.0137350, 0.0],
    [0.0120000, 0.0178581, 0.0],
    [0.0200000, 0.0253735, 0.0],
    [0.0300000, 0.0330215, 0.0],
    [0.0400000, 0.0391283, 0.0],
    [0.0500000, 0.0442753, 0.0],
    [0.0600000, 0.0487571, 0.0],
    [0.0800000, 0.0564308, 0.0],
    [0.1000000, 0.0629981, 0.0],
    [0.1200000, 0.0686204, 0.0],
    [0.1400000, 0.0734360, 0.0],
    [0.1600000, 0.0775707, 0.0],
    [0.1800000, 0.0810687, 0.0],
    [0.2000000, 0.0839202, 0.0],
    [0.2200000, 0.0861433, 0.0],
    [0.2400000, 0.0878308, 0.0],
    [0.2600000, 0.0890840, 0.0],
    [0.2800000, 0.0900016, 0.0],
    [0.3000000, 0.0906804, 0.0],
    [0.3200000, 0.0911857, 0.0],
    [0.3400000, 0.0915079, 0.0],
    [0.3600000, 0.0916266, 0.0],
    [0.3800000, 0.0915212, 0.0],
    [0.4000000, 0.0911712, 0.0],
    [0.4200000, 0.0905657, 0.0],
    [0.4400000, 0.0897175, 0.0],
    [0.4600000, 0.0886427, 0.0],
    [0.4800000, 0.0873572, 0.0],
    [0.5000000, 0.0858772, 0.0],
    [0.5200000, 0.0842145, 0.0],
    [0.5400000, 0.0823712, 0.0],
    [0.5600000, 0.0803480, 0.0],
    [0.5800000, 0.0781451, 0.0],
    [0.6000000, 0.0757633, 0.0],
    [0.6200000, 0.0732055, 0.0],
    [0.6400000, 0.0704822, 0.0],
    [0.6600000, 0.0676046, 0.0],
    [0.6800000, 0.0645843, 0.0],
    [0.7000000, 0.0614329, 0.0],
    [0.7200000, 0.0581599, 0.0],
    [0.7400000, 0.0547675, 0.0],
    [0.7600000, 0.0512565, 0.0],
    [0.7800000, 0.0476281, 0.0],
    [0.8000000, 0.0438836, 0.0],
    [0.8200000, 0.0400245, 0.0],
    [0.8400000, 0.0360536, 0.0],
    [0.8600000, 0.0319740, 0.0],
    [0.8800000, 0.0277891, 0.0],
    [0.9000000, 0.0235025, 0.0],
    [0.9200000, 0.0191156, 0.0],
    [0.9400000, 0.0146239, 0.0],
    //[0.9600000, 0.0100232, 0.0],
   // [0.9700000, 0.0076868, 0.0],
   // [0.9800000, 0.0053335, 0.0],
   // [0.9900000, 0.0029690, 0.0],
   // [1.0000000, 0.0005993, 0.0],

    //botttom
   // [1.0000000, -.0005993, 0.0],
   // [0.9900000, -.0009666, 0.0],
    //[0.9800000, -.0013339, 0.0],
    //[0.9700000, -.0017011, 0.0],
   // [0.9600000, -.0020683, 0.0],
    [0.9400000, -.0028028, 0.0],
    [0.9200000, -.0035373, 0.0],
    [0.9000000, -.0042718, 0.0],
    [0.8800000, -.0050063, 0.0],
    [0.8600000, -.0057408, 0.0],
    [0.8400000, -.0064753, 0.0],
    [0.8200000, -.0072098, 0.0],
    [0.8000000, -.0079443, 0.0],
    [0.7800000, -.0086788, 0.0],
    [0.7600000, -.0094133, 0.0],
    [0.7400000, -.0101478, 0.0],
    [0.7200000, -.0108823, 0.0],
    [0.7000000, -.0116169, 0.0],
    [0.6800000, -.0123515, 0.0],
    [0.6600000, -.0130862, 0.0],
    [0.6400000, -.0138207, 0.0],
    [0.6200000, -.0145551, 0.0],
    [0.6000000, -.0152893, 0.0],
    [0.5800000, -.0160232, 0.0],
    [0.5600000, -.0167572, 0.0],
    [0.5400000, -.0174914, 0.0],
    [0.5200000, -.0182262, 0.0],
    [0.5000000, -.0189619, 0.0],
    [0.4800000, -.0196986, 0.0],
    [0.4600000, -.0204353, 0.0],
    [0.4400000, -.0211708, 0.0],
    [0.4200000, -.0219042, 0.0],
    [0.4000000, -.0226341, 0.0],
    [0.3800000, -.0233606, 0.0],
    [0.3600000, -.0240870, 0.0],
    [0.3400000, -.0248176, 0.0],
    [0.3200000, -.0255565, 0.0],
    [0.3000000, -.0263079, 0.0],
    [0.2800000, -.0270696, 0.0],
    [0.2600000, -.0278164, 0.0],
    [0.2400000, -.0285181, 0.0],
    [0.2200000, -.0291445, 0.0],
    [0.2000000, -.0296656, 0.0],
    [0.1800000, -.0300490, 0.0],
    [0.1600000, -.0302546, 0.0],
    [0.1400000, -.0302404, 0.0],
    [0.1200000, -.0299633, 0.0],
    [0.1000000, -.0293786, 0.0],
    [0.0800000, -.0284595, 0.0],
    [0.0600000, -.0271277, 0.0],
    [0.0500000, -.0260452, 0.0],
    [0.0400000, -.0245211, 0.0],
    [0.0300000, -.0226056, 0.0],
    [0.0200000, -.0202723, 0.0],
    [0.0120000, -.0169733, 0.0],
    [0.0080000, -.0142862, 0.0],
    [0.0040000, -.0105126, 0.0],
    [0.0020000, -.0078113, 0.0],
    [0.0010000, -.0059418, 0.0],
    [0.0005000, -.0046700, 0.0],
    [0.0000000, 0.0000000, 0.0]    
];

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
SCENE.strokeColor = _v3_black;


// Create the entities
var groundEntity = new E3D_entity_wireframe_canvas("entity0");
// Large ground plane
groundEntity.addPlane(_v3_origin, _v3_90x, 2540, 2540, 100, _v3_black);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);

E3D_NEAR = 1.0;
E3D_FAR = 4096.0;
CAMERA = new E3D_camera_model("camera0m");
E3D_onResize();

CONTEXT.disable(CONTEXT.CULL_FACE); 

// Move the camera back and up a little, add some nod 
CAMERA.moveBy(0, 100, 1500, 0.15);
SCENE.setClearColor([ 0.85,  0.85,  0.85]);
SCENE.lightA_color = _v3_darkgray; 
INPUTS._posSpeed *= 10;


var meshLoader = new E3D_mesh();
// Create a solid cube
var entity = new E3D_entity("entity1", true); // dynamic entity, GPU data will be updated when changed


// Mesh parameters
// TODO make adjustable
var baseAng = 2.5 * DegToRad;
var helixP = 1.73 * 25.4;
var maxL = 30.0 * 25.4;
var maxWidth  = 6.5 * 25.4;
var minL = maxWidth * 0.4;
var maxHeight = 2.125 * 25.4;

function getAngle(dist) {    
    return Math.atan(helixP / dist) + baseAng;
}
function getBox(pArray) {
    var maxX = -Infinity;
    var minX = Infinity;
    var maxY = -Infinity;
    var minY = Infinity;
    for (var i = 0; i < pArray.length; ++i) {
        if (pArray[i][0] > maxX) maxX = pArray[i][0];
        if (pArray[i][0] < minX) minX = pArray[i][0];
        if (pArray[i][1] > maxY) maxY = pArray[i][1];
        if (pArray[i][1] < minY) minY = pArray[i][1];
    }
    return { max_X:maxX, min_X:minX, max_Y:maxY, min_Y:minY };
}


function genProp(){

    meshLoader.reset();
    var p0 = v3_new();    
    var stepLen = (maxL - minL) / (numSegments-1);
    var segmentsProfiles = [];

    // generate tiwsted segment profiles
    for (var j = 0; j < numSegments; ++j) {

        segmentsProfiles.push([]);

        var d = (j * stepLen) + minL;
        var twistAngle = getAngle(d);

        for (var i = 0; i < profile.length; ++i) {
            v3_copy(p0, profile[i]);
            // puff up upper profile
            if (i < 56) p0[1] = p0[1] * (1.0 + (Math.pow(twistAngle, puffExp) * puffCoef) * Math.pow(Math.sin(i * Math.PI / 56), cosExp));

            v3_rotateZ_mod(p0, -twistAngle);
            v3_add_mod(p0, [0, 0, d]);
            segmentsProfiles[j].push( v3_clone(p0) );
        }
    }

    var taperEnd = 12 * 25.4;
    var taperScale = 0.5;
    var taperM = 1.0 / (maxL - taperEnd);

    // adjust and clip segment profiles
    for (var j = 0; j < numSegments; ++j) {
        var limits = getBox(segmentsProfiles[j]);
        var x_scale = maxWidth / (limits.max_X - limits.min_X);
        // taper
        if (segmentsProfiles[j][0][2] > taperEnd) x_scale = x_scale * (1.0 - (taperScale * ((segmentsProfiles[j][0][2] - taperEnd) *taperM)));

        var scale = [x_scale, x_scale, 1.0];
        for (var i = 0; i < profile.length; ++i) v3_mult_mod(segmentsProfiles[j][i], scale);

        limits = getBox(segmentsProfiles[j]);
        var offset = [-(limits.min_X) + (maxWidth / 2), -maxHeight+  (limits.max_Y), 0];
        //for (var i = 0; i < 112; ++i) v3_sub_mod(segmentsProfiles[j][i], offset);    

        // top 0 - 55
        var limitX = -1;
        for (var i = 0; i < 56; ++i) { 
            v3_sub_mod(segmentsProfiles[j][i], offset);
            if (segmentsProfiles[j][i][1] < 4.0) {
                segmentsProfiles[j][i][1] = 4.0;
                segmentsProfiles[j][i][0] = segmentsProfiles[j][i-1][0];
                limitX = segmentsProfiles[j][i-1][0];
            }
        }

        // bottom 56 - 111
        for (var i = 111; i >= 56; --i) {
            v3_sub_mod(segmentsProfiles[j][i], offset);
            if (segmentsProfiles[j][i][1] < 0.0) {
                segmentsProfiles[j][i][1] = 0.0;
                if (segmentsProfiles[j][i][0] > limitX) segmentsProfiles[j][i][0] = limitX;
            }
        }

        // wrap bottom of last segment closer than the radius
        if (segmentsProfiles[j][i][2] <= maxWidth / 2) {
            for (var i = 0; i < 112; ++i) {
                if (Math.abs(segmentsProfiles[j][i][0]) >= maxWidth / 2) {
                    segmentsProfiles[j][i][2] = 0;
                    segmentsProfiles[j][i][0] = (maxWidth / 2) * Math.sign(segmentsProfiles[j][i][0]);
                } else {
                    segmentsProfiles[j][i][2] = Math.sqrt( Math.pow(maxWidth / 2, 2) - Math.pow(segmentsProfiles[j][i][0], 2));
                }
            }
        }

    }

    // generate mesh
    for (var j = 0; j < numSegments-1; ++j) {

        for (var i = 0; i < profile.length; ++i) {
        // v3_copy(p0, segmentsProfiles[j][i]);
            var idx = (i == profile.length-1) ? 0 : i+1;
        // v3_copy(p1 = segmentsProfiles[j][idx];
    // j1i ji jidx j1idx
        meshLoader.pushQuad4p(segmentsProfiles[j+1][idx], segmentsProfiles[j][idx], segmentsProfiles[j][i], segmentsProfiles[j+1][i]);
    //        meshLoader.pushQuad4p(segmentsProfiles[j+1][i], segmentsProfiles[j+1][idx], segmentsProfiles[j][idx], segmentsProfiles[j][i]);
        }
    }
    // end cap
    for (var i = 0; i < 55; ++i) {
        meshLoader.pushQuad4p(segmentsProfiles[numSegments-1][i+1], segmentsProfiles[numSegments-1][i], segmentsProfiles[numSegments-1][111-i], segmentsProfiles[numSegments-1][110-i]);
    }

    // regen normals after all the tweakings
    meshLoader.genNormals();

    // copy and flip
    for (var i = 0; i < meshLoader.numFloats / 3; ++i) {
        meshLoader.positions.push(-meshLoader.positions[i * 3]);
        meshLoader.positions.push( meshLoader.positions[i * 3 + 1]);
        meshLoader.positions.push(-meshLoader.positions[i * 3 + 2]);

        meshLoader.colors.push(meshLoader.colors[i * 3]);
        meshLoader.colors.push(meshLoader.colors[i * 3 + 1]);
        meshLoader.colors.push(meshLoader.colors[i * 3 + 2]);

        meshLoader.normals.push(-meshLoader.normals[i * 3]);
        meshLoader.normals.push( meshLoader.normals[i * 3 + 1]);
        meshLoader.normals.push(-meshLoader.normals[i * 3 + 2]);

    }
    meshLoader.numFloats = meshLoader.positions.length;


    meshLoader.pushTube(_v3_null, _v3_null, 0.5 * 25.4, maxWidth / 2, maxHeight, 64, _v3_darkgray, true, true);

    // Change colors
    //for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

    // Load data from mesh to entity
    meshLoader.addModelData(entity);
}

// Setup entity
entity.isVisible = true;
entity.position = [0, 0, 0];
E3D_addEntity(entity);


var puffExp = 3;
var range_puffExp = document.getElementById("range_puffExp");
range_puffExp.value = puffExp * 10;
range_puffExp.addEventListener("input", changeParams2);

var puffCoef = 8;
var range_puffCoef = document.getElementById("range_puffCoef");
range_puffCoef.value = puffCoef;
range_puffCoef.addEventListener("input", changeParams2);

var cosExp = 1;
var range_cosExp = document.getElementById("range_cosExp");
range_cosExp.value = cosExp * 10;
range_cosExp.addEventListener("input", changeParams2);

var numSegments = 48;
var range_segNum = document.getElementById("range_segNum");
range_segNum.value = numSegments;
range_segNum.addEventListener("input", changeParams2);


function changeParams2() {
    numSegments = range_segNum.value;
    range_segNum.innerHTML = ` ${numSegments}`;
    puffExp = range_puffExp.value / 10;
    puffCoef = range_puffCoef.value;
    cosExp = range_cosExp.value / 10;
    paramText2.textContent = "segments: " + numSegments + " puff Exp: " + puffExp + " cosine Exp: " + cosExp + " puff coef: " + puffCoef;

    entity.clear();
    genProp();
}

changeParams2();



// use the engine OnTick event callback to change the rotation of the entity
CB_tick = function() {
    // rotate around Y
 //   entity.rotation[1] += TIMER.delta * 0.4;
  //  entity.updateMatrix();
}    

// TODO export to ascii STL


