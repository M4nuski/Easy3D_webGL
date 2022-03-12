// Easy3D_WebGL
// Propeller generator 1
// Emmanuel Charette 2021


"use strict"


// Clark-Y profile from http://airfoiltools.com/
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

var profileAeroData = [
 //alpha   CL      CD
 [-12.50000, -0.80560, 0.08275],
 [-12.25000, -0.84310, 0.07364],
 [-12.00000, -0.86240, 0.06737],
 [-11.75000, -0.84980, 0.05920],
 [-11.50000, -0.83000, 0.05450],
 [-11.25000, -0.80370, 0.05254],
 [-11.00000, -0.77440, 0.05130],
 [-10.75000, -0.74440, 0.04995],
 [-10.50000, -0.71940, 0.04813],
 [-10.25000, -0.69390, 0.04571],
 [-10.00000, -0.66700, 0.04308],
 [-9.75000, -0.64270, 0.04078],
 [-9.50000, -0.61720, 0.03874],
 [-9.25000, -0.59030, 0.03646],
 [-9.00000, -0.56770, 0.03427],
 [-8.75000, -0.54140, 0.03295],
 [-8.50000, -0.51530, 0.03171],
 [-8.25000, -0.49040, 0.03037],
 [-8.00000, -0.46420, 0.02908],
 [-7.75000, -0.43940, 0.02781],
 [-7.50000, -0.41360, 0.02642],
 [-7.25000, -0.38850, 0.02515],
 [-7.00000, -0.36260, 0.02394],
 [-6.75000, -0.33700, 0.02289],
 [-6.50000, -0.31070, 0.02192],
 [-6.25000, -0.28500, 0.02081],
 [-6.00000, -0.25970, 0.01951],
 [-5.75000, -0.23360, 0.01862],
 [-5.50000, -0.20720, 0.01782],
 [-5.25000, -0.18070, 0.01710],
 [-5.00000, -0.15400, 0.01644],
 [-4.75000, -0.12720, 0.01582],
 [-4.50000, -0.10020, 0.01525],
 [-4.25000, -0.07330, 0.01472],
 [-4.00000, -0.04630, 0.01426],
 [-3.75000, -0.01940, 0.01382],
 [-3.50000, 0.00740, 0.01329],
 [-3.25000, 0.03460, 0.01291],
 [-3.00000, 0.06170, 0.01257],
 [-2.75000, 0.08890, 0.01228],
 [-2.50000, 0.11620, 0.01200],
 [-2.25000, 0.14330, 0.01174],
 [-2.00000, 0.17020, 0.01150],
 [-1.75000, 0.19720, 0.01130],
 [-1.50000, 0.22420, 0.01110],
 [-1.25000, 0.25120, 0.01091],
 [-1.00000, 0.27810, 0.01068],
 [-0.75000, 0.30500, 0.01052],
 [-0.50000, 0.33180, 0.01041],
 [-0.25000, 0.35850, 0.01028],
 [0.00000, 0.38500, 0.01012],
 [0.25000, 0.41130, 0.00999],
 [0.50000, 0.43650, 0.00978],
 [0.75000, 0.45880, 0.00938],
 [1.00000, 0.47920, 0.00918],
 [1.25000, 0.50690, 0.00927],
 [1.50000, 0.54820, 0.00947],
 [1.75000, 0.58520, 0.00966],
 [2.00000, 0.62050, 0.00988],
 [2.25000, 0.65170, 0.01012],
 [2.50000, 0.67520, 0.01038],
 [2.75000, 0.69850, 0.01067],
 [3.00000, 0.72180, 0.01100],
 [3.25000, 0.74510, 0.01136],
 [3.50000, 0.76860, 0.01172],
 [3.75000, 0.79230, 0.01211],
 [4.0000, 0.81610, 0.01253],
 [4.25000, 0.83970, 0.01298],
 [4.50000, 0.86360, 0.01344],
 [4.75000, 0.88760, 0.01390],
 [5.00000, 0.91240, 0.01429],
 [5.25000, 0.93700, 0.01471],
 [5.50000, 0.96180, 0.01511],
 [5.75000, 0.98670, 0.01553],
 [6.00000, 1.01180, 0.01593],
 [6.25000, 1.03620, 0.01640],
 [6.50000, 1.06100, 0.01683],
 [6.75000, 1.08520, 0.01733],
 [7.00000, 1.10870, 0.01788],
 [7.25000, 1.13120, 0.01852],
 [7.50000, 1.15220, 0.01934],
 [7.75000, 1.17110, 0.02040],
 [8.00000, 1.18930, 0.02157],
 [8.25000, 1.20790, 0.02270],
 [8.50000, 1.22630, 0.02382],
 [8.75000, 1.24470, 0.02492],
 [9.00000, 1.26310, 0.02591],
 [9.25000, 1.28010, 0.02698],
 [9.50000, 1.29760, 0.02799],
 [9.75000, 1.31420, 0.02913],
 [10.00000, 1.32920, 0.03045],
 [10.25000, 1.34180, 0.03204],
 [10.50000, 1.34270, 0.03507],
 [10.75000, 1.35330, 0.03711],
 [11.00000, 1.36580, 0.03896],
 [11.25000, 1.37790, 0.04092],
 [11.50000, 1.38860, 0.04315],
 [11.75000, 1.39780, 0.04566],
 [12.00000, 1.40910, 0.04793],
 [12.25000, 1.41900, 0.05048],
 [12.50000, 1.42780, 0.05326],
 [12.75000, 1.43520, 0.05638],
 [13.00000, 1.44050, 0.05998],
 [13.25000, 1.44280, 0.06426],
 [13.50000, 1.44830, 0.06808],
 [13.75000, 1.45280, 0.07223],
 [14.00000, 1.45560, 0.07681],
 [14.25000, 1.45710, 0.08184],
 [14.50000, 1.45750, 0.08728],
 [14.75000, 1.45660, 0.09318],
 [15.00000, 1.45460, 0.09956],
 [15.25000, 1.45160, 0.10649],
 [15.50000, 1.44730, 0.11392],
 [15.75000, 1.44150, 0.12199],
 [16.00000, 1.43420, 0.13073],
 [16.25000, 1.42500, 0.14030],
 [16.50000, 1.41370, 0.15069],
 [16.75000, 1.40100, 0.16176] ];

const Cyl_CD = 1.17; // Sph 0.47;
const Cyl_CL = 0.00;

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
SCENE.strokeColor = _v3_black;


// Create the entities
var groundEntity = new E3D_entity_wireframe_canvas("entity0");
// Large ground plane
groundEntity.addPlane(_v3_origin, _v3_90x, 3048, 3048, 119, _v3_black);
groundEntity.addPlane([0.0, 0.1, 0.0], _v3_90x, 3048, 3048, 9, _v3_red);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);
// Profile wireframe
var profileEntity = new E3D_entity_wireframe_canvas("entity1");
E3D_addEntity(profileEntity);
profileEntity.isVisible = true;
 // Thrust Vectors


// tweak engine params for large models
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

var baseAng = 7.0 * DegToRad;
var helixP = 1.73 * 25.4;
var maxL = 30.0 * 25.4;
var maxWidth  = 6.25 * 25.4;
var minL = maxWidth * 0.4;
var maxHeight = 3 * 25.4;

var puffExp = 2.9;
var puffCoef = 6.4;
var cosExp = 1.5;

var numSegments = 42;
var clipTop = true;
var hubBoreRadius = 1 * 25.4 / 2.0;

var colorModel = 2;
var showHub = true;
var showProfile = true;

var taperRatio = 0.5;
var taperScale = 0.5;
var minEdgeT = 0.125 * 25.4;

var slipAngle = 0;
var slipRound = true;
var nBlades = 6;

class segment {
    constructor () {
        this.profile = [];
        this.angle = 0.0;
        this.scale = 1.0;
        this.lengthOrig = 0.0;
        this.lengthFinal = 0.0;
        this.radius = 0.0;
    }
}
var segments = [];

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
function getColor(i, j = 0) {
    if (colorModel == 0) return _v3_white;
    if (colorModel == 1) return ((i % 2) == 0) ? _v3_white : _v3_black;
    if (colorModel == 2) return (((i + j) % 2) == 0) ? _v3_white : _v3_black;
}

function genProp(){

    meshLoader.reset();
    var p0 = v3_new();    
    var stepLen = (maxL - minL) / (numSegments-1);

    segments = [];

    // generate tiwsted segment profiles
    for (var j = 0; j < numSegments; ++j) {
        segments[j] = new segment();

        var d = (j * stepLen) + minL;
        segments[j].radius = d;

        var twistAngle = getAngle(d);
        segments[j].angle = twistAngle * RadToDeg;

        var puffBase = Math.atan(maxWidth / d) / 2.0;
        var maxPuff = 0;
        for (var i = 0; i < profile.length; ++i) {
            v3_copy(p0, profile[i]);
            // puff up upper profile
            if (i < 56){
                var puff = (1.0 + (Math.pow(puffBase, puffExp) * puffCoef) * Math.pow(Math.sin(i * Math.PI / 56), cosExp));
                //console.log(j + ":"+i+" = " +puff);
                if (puff > maxPuff) maxPuff = puff;
                p0[1] = p0[1] * puff;
            }
            v3_rotateZ_mod(p0, -twistAngle);  
            segments[j].profile.push( v3_clone(p0) );
        }
        segments[j].scale = maxPuff;
    }

    // slip angle
    for (var j = 0; j < numSegments; ++j) {
        for (var i = 0; i < profile.length; ++i) v3_rotateY_mod(segments[j].profile[i], slipAngle * j / (numSegments-1));
    }

    var taperEnd = maxL * taperRatio;
    var taperM = 1.0 / (maxL - taperEnd);

    // adjust and clip segment profiles
    for (var j = 0; j < numSegments; ++j) {

        // get max width
        var limits = getBox(segments[j].profile);
        var x_scale = maxWidth / (limits.max_X - limits.min_X);

        var d = (j * stepLen) + minL;

        // taper
        if (d > taperEnd) x_scale = x_scale * (1.0 - (taperScale * ((d - taperEnd) * taperM)));

        for (var i = 0; i < profile.length; ++i) {
            // scale
            v3_scale_mod(segments[j].profile[i], x_scale);
            // translate along 
            segments[j].profile[i][2] += d;
        }

        segments[j].lengthOrig = v3_distanceXY(segments[j].profile[0], segments[j].profile[55]);

        // offset into position
        var offset = [(x_scale * limits.min_X) + (maxWidth / 2), -maxHeight +  (x_scale * limits.max_Y), 0];

        // top 0 - 55
        var limitX = -1;
        for (var i = 0; i < 56; ++i) { 
            v3_sub_mod(segments[j].profile[i], offset);
            if (segments[j].profile[i][1] < minEdgeT) {
                segments[j].profile[i][1] = minEdgeT;
                segments[j].profile[i][0] = segments[j].profile[(i+111) % 112][0];
                limitX = segments[j].profile[(i+111) % 112][0];
            }
        }


        // bottom 56 - 111
        for (var i = 111; i >= 56; --i) {
            v3_sub_mod(segments[j].profile[i], offset);
            if (segments[j].profile[i][1] < 0.0) {
                segments[j].profile[i][1] = 0.0;
                if (segments[j].profile[i][0] > limitX) segments[j].profile[i][0] = limitX;
            }
        }
        segments[j].lengthFinal = v3_distanceXY(segments[j].profile[0], segments[j].profile[55]);


        // round profile
        if (slipRound) for (var i = 0; i < profile.length; ++i) {
            var newZdist = Math.sqrt((d*d) - (segments[j].profile[i][0]*segments[j].profile[i][0]));
            if (!isNaN(newZdist)) segments[j].profile[i][2] -= (d - newZdist);
        }

        // wrap vertex of last segment closer than the radius
        if (d <= maxWidth / 2) {
            for (var i = 0; i < 112; ++i) {
                if (Math.abs(segments[j].profile[i][0]) >= maxWidth / 2) {
                    segments[j].profile[i][2] = 0;
                    segments[j].profile[i][0] = (maxWidth / 2) * Math.sign(segments[j].profile[i][0]);
                } else {
                    segments[j].profile[i][2] = Math.sqrt( Math.pow(maxWidth / 2, 2) - Math.pow(segments[j].profile[i][0], 2));
                }
                var nextI = i+1;
                if (nextI == 112) nextI = 1; // skip index 0 as it is a duplicate of index 111
                if (clipTop && 
                    (segments[j].profile[i][1] < segments[j].profile[nextI][1])  &&
                    (segments[j].profile[i][0] < segments[j].profile[nextI][0])) {
                     segments[j].profile[i][1] = maxHeight;
                }  
            }
        }


    }

    // generate mesh
    for (var j = 0; j < numSegments-1; ++j) {
        for (var i = 0; i < profile.length-1; ++i) {

            if (v3_equals(segments[j+1].profile[i], segments[j+1].profile[i+1], 0.01)) {
                meshLoader.pushTriangle3p(
                    segments[j].profile[i], 
                    segments[j+1].profile[i], 
                    segments[j].profile[i+1], 
                    _v3_green// getColor(i, j)
                    );
            } else if (v3_equals(segments[j].profile[i], segments[j].profile[i+1], 0.01)) {
                meshLoader.pushTriangle3p(
                    segments[j].profile[i], 
                    segments[j+1].profile[i], 
                    segments[j+1].profile[i+1], 
                    _v3_red// getColor(i, j)
                    );
                 } else {
            // j1i ji jidx j1idx
                    if (i < 56) {
                        meshLoader.pushQuad4p(
                            segments[j+1].profile[i+1], 
                            segments[j].profile[i+1], 
                            segments[j].profile[i], 
                            segments[j+1].profile[i], 
                            getColor(i, j)
                        );
                    } else {
                        meshLoader.pushQuad4p(
                            segments[j+1].profile[i],
                            segments[j+1].profile[i+1], 
                            segments[j].profile[i+1], 
                            segments[j].profile[i],                              
                            getColor(i, j)
                        );
                    }
            }
            //meshLoader.pushQuad4p(segments[j+1].profile[i], segments[j+1].profile[idx], segments[j].profile[idx], segments[j].profile[i]);
        }        
    }

    // tip cap
    for (var i = 0; i < 55; ++i) {
        meshLoader.pushQuad4p(
            segments[numSegments-1].profile[i+1], 
            segments[numSegments-1].profile[i], 
            segments[numSegments-1].profile[111-i], 
            segments[numSegments-1].profile[110-i],
            getColor(i)
        );
    }
    // root cap
    for (var i = 0; i < 55; ++i) {
        meshLoader.pushQuad4p(
            segments[0].profile[110-i], 
            segments[0].profile[111-i], 
            segments[0].profile[i], 
            segments[0].profile[i+1],
            getColor(i)
        );
    }

    // regen normals after all the tweakings
    meshLoader.genNormals();
    if (nBlades == 2) CopyMirrorEntity();
    if (nBlades == 3) CopyRotateEntity([120, 240]);
    if (nBlades == 4) { CopyRotateEntity([90]); CopyMirrorEntity(); };
    if (nBlades == 5) CopyRotateEntity([72*1, 72*2, 72*3, 72*4]);
    if (nBlades == 6) { CopyRotateEntity([120, 240]); CopyMirrorEntity(); };

    if (showHub) meshLoader.pushTube(_v3_null, _v3_null, hubBoreRadius, maxWidth / 2, maxHeight, 64, _v3_darkgray, true, true);

    // Load data from mesh to entity
    entity.clear();
    meshLoader.addModelData(entity);

    // Generate profiles
    if (showProfile) {
        profileEntity.clear();
        for (var j = 0; j < numSegments; ++j) {
            profileEntity.moveCursorTo(segments[j].profile[0]);
            for (var i = 1; i < profile.length; ++i) profileEntity.addLineTo(segments[j].profile[i], false, _v3_orange);
        }
    }


    // Calc aero data
    calcAero();
}

function getCoef(ang) {
    var lastIndex = profileAeroData.length-1;
    /*
 //alpha   CL      CD
[-12.500, -0.8056, 0.04280],
[-12.250, -0.8431, 0.03834],
...
[16.500, 1.4137, 0.07807],
[16.750, 1.4010, 0.08355] ];
    */
   if (ang < profileAeroData[0][0]) {
        // if ang < first linear int from index 1 trough 0
        var alphaStep = profileAeroData[0][0] - profileAeroData[1][0];
        var mCL    =   (profileAeroData[0][1] - profileAeroData[1][1]) / alphaStep;
        var mCD    =   (profileAeroData[0][2] - profileAeroData[1][2]) / alphaStep;
        var alpha = ang - profileAeroData[0][0];
        return [(mCL * alpha) + profileAeroData[0][1], (mCD * alpha) + profileAeroData[0][2]];
    } else if (ang > profileAeroData[lastIndex][0]) {
        // if ang > last linear int from n-2 trough n-1
        var alphaStep = profileAeroData[lastIndex][0] - profileAeroData[lastIndex-1][0];
        var mCL    =   (profileAeroData[lastIndex][1] - profileAeroData[lastIndex-1][1]) / alphaStep;
        var mCD    =   (profileAeroData[lastIndex][2] - profileAeroData[lastIndex-1][2]) / alphaStep;
        var alpha = ang - profileAeroData[lastIndex][0];
        return [(mCL * alpha) + profileAeroData[lastIndex][1], (mCD * alpha) + profileAeroData[lastIndex][2]];
    } else {
        // lerp
        try {
            var lIndex = 0;
            while (profileAeroData[lIndex][0] < ang) lIndex++;
            lIndex--;
            var hIndex = lIndex + 1;
            var alphaStep = profileAeroData[hIndex][0] - profileAeroData[lIndex][0];
            var dCL = (profileAeroData[hIndex][1] - profileAeroData[lIndex][1]) / alphaStep;
            var dCD = (profileAeroData[hIndex][2] - profileAeroData[lIndex][2]) / alphaStep;
            var alpha = ang - profileAeroData[lIndex][0];
            return [(dCL * alpha) + profileAeroData[lIndex][1], (dCD * alpha) + profileAeroData[lIndex][2]];
        } catch (ex) {
            console.log("coef fail at angle: " + ang);
            return [0, 0];
        }
    }
}

var backupTL = [];
function calcAero() {
    // F = CL * 0.5 * rho * V^2 * A
    /*numSegments = 2;
    segmentsAngles = [0, 0];
    segmentsLengthsFinal = [1000.0, 1000.0];
    segmentsRadius = [1000.0, 2000.0];
*/

    text_output.innerText = "";
    var sos = select_air.options[select_air.selectedIndex].getAttribute("data-sos");
    var aTemp = select_air.options[select_air.selectedIndex].innerText;
    text_output.innerText = "Tip speed: "+ ((number_rpm.value / 60) * Math.PI * 2.0 * maxL / 1000.0).toFixed(1) + " m/s (max: "+sos+"@"+aTemp+")\n";

    // N = 1Kg * 9.80665m/s^2
    //0.224337
    // 1 W = 1 Nm/s 
    // 0.73756
    // 1 N = 1 Kg / s^2
    // 1Nm = 1 Kgm / s^2

    //static
    var aeroData = calcThrustAndTorque(0); 
    var thrust = (aeroData[0] * 0.224337);
    var hp = (number_rpm.value * aeroData[1] * 0.73756 / 5252);
    //console.log("L: " + totalLift + " N, T: " + totalTorque + " Nm, P: " + (number_rpm.value * totalTorque * 0.73756 / 5252) + " hp");
    text_output.innerText += "Static Thrust: " + thrust.toFixed(1) + " Lbf ("+(thrust/hp).toFixed(1)+ "lb/hp)\n";
    text_output.innerText += "Static Power: " + hp.toFixed(1) + " HP (Torque: "+(aeroData[1] * 0.73756).toFixed(1) + " Lbf-ft) \n"

    backupTL = thrustList.splice(0);

    // at max pitch
    var pitch = (2.0 * Math.PI) * helixP;
    var helixAngle = Math.atan( pitch / (maxL * 2.0 * Math.PI) ) * RadToDeg;
    var pSpeed = (pitch / 25.4 * number_rpm.value * 60 / 63360);
    text_output.innerText += "MaxSpeed: " + pSpeed.toFixed(1) + " mph / " + (pSpeed * 1.60934).toFixed(1) + " km/h\n";
    var aeroData = calcThrustAndTorque(helixAngle); 
    thrust = (aeroData[0] * 0.224337);
    hp = (number_rpm.value * aeroData[1] * 0.73756 / 5252);
    //console.log("L: " + totalLift + " N, T: " + totalTorque + " Nm, P: " + (number_rpm.value * totalTorque * 0.73756 / 5252) + " hp");
    text_output.innerText += "MaxSpeed Thrust: " + thrust.toFixed(1) + " Lbf ("+(thrust/hp).toFixed(1)+ "lb/hp)\n";
    text_output.innerText += "MaxSpeed Power: " + hp.toFixed(1) + " HP (Torque: "+(aeroData[1] * 0.73756).toFixed(1) + " Lbf-ft) \n"
}

var thrustList = [];
function calcThrustAndTorque(angle) {
    var stepLen = (maxL - minL) / (numSegments-1) / 1000.0; // mm to m
    var segAeroResults = [];
    thrustList = [];
    // calc forces at segments profile
    for (var j = 0; j < numSegments; ++j) {
        var v = (number_rpm.value / 60) * Math.PI * 2.0 * segments[j].radius / 1000.0; // t/s * m/t = m/s
        //var v = 320.0;
        var coefs = getCoef(segments[j].angle - angle);
        const normalRatio = 0.115;
        var pRatio = segments[j].scale * normalRatio;
        pRatio = pRatio * segments[j].lengthOrig / segments[j].lengthFinal;
        var goodRatio = normalRatio / pRatio;
        var badRatio = 1.0 - goodRatio;
        coefs[0] = (goodRatio * coefs[0]) + (badRatio * Cyl_CL);
        coefs[1] = (goodRatio * coefs[1]) + (badRatio * Cyl_CD);

        var fl = coefs[0] * 0.5 * select_air.value * (v * v) * (segments[j].lengthFinal / 1000.0); // 1 * 1 * Kg/m^3 * m^2/s^2 * m = Kg/s^2
        var fd = coefs[1] * 0.5 * select_air.value * (v * v) * (segments[j].lengthFinal / 1000.0);
        segAeroResults.push([fl, fd]);
    }
    // calc forces for segment's widths
    var totalLift = 0;
    var totalTorque = 0;
    for (var j = 0; j < numSegments-1; ++j) {
        var l = (segAeroResults[j][0] + segAeroResults[j + 1][0]) / 2; // avg between 2 profiles
        var t = l * stepLen; // Kg/s^2 * m = Kgm/s^2 = N
        thrustList.push([l, t]);
        totalLift += t; // N

        l = (segAeroResults[j][1] + segAeroResults[j + 1][1]) / 2; // avg between 2 profiles
        t = l * stepLen; // Kg/s^2 * m = Kgm/s^2 = N
        t = t * (segments[j+1].radius + segments[j].radius) / 2000.0; // N * m = Nm
        totalTorque += t;
    }
    totalLift *= nBlades; // N 
    totalTorque *= nBlades; //Nm
    return [totalLift, totalTorque];
}


function CopyMirrorEntity() {
    var numFloats = meshLoader.positions.length;
    for (var i = 0; i < numFloats; i += 3) {
        meshLoader.positions.push(-meshLoader.positions[i + 0]);
        meshLoader.positions.push( meshLoader.positions[i + 1]);
        meshLoader.positions.push(-meshLoader.positions[i + 2]);

        meshLoader.colors.push(meshLoader.colors[i + 0]);
        meshLoader.colors.push(meshLoader.colors[i + 1]);
        meshLoader.colors.push(meshLoader.colors[i + 2]);

        meshLoader.normals.push(-meshLoader.normals[i + 0]);
        meshLoader.normals.push( meshLoader.normals[i + 1]);
        meshLoader.normals.push(-meshLoader.normals[i + 2]);
    }
}
function CopyRotateEntity(angleList) {
    var numFloats = meshLoader.positions.length;
    if (angleList.length < 1) return;
    for (var a = 0; a < angleList.length; ++a) {
            var c = Math.cos(angleList[a] * DegToRad);
            var s = Math.sin(angleList[a] * DegToRad);
            //x a[2] * s + a[0] * c;
            //y
            //z = a[2] * c - a[0] * s;

        for (var i = 0; i < numFloats; i += 3) {
            meshLoader.positions.push((meshLoader.positions[i + 2] * s) + (meshLoader.positions[i + 0] * c));
            meshLoader.positions.push( meshLoader.positions[i + 1]);
            meshLoader.positions.push((meshLoader.positions[i + 2] * c) - (meshLoader.positions[i + 0] * s));

            meshLoader.colors.push(meshLoader.colors[i + 0]);
            meshLoader.colors.push(meshLoader.colors[i + 1]);
            meshLoader.colors.push(meshLoader.colors[i + 2]);

            meshLoader.normals.push((meshLoader.normals[i + 2] * s) + (meshLoader.normals[i + 0] * c));
            meshLoader.normals.push( meshLoader.normals[i + 1]);
            meshLoader.normals.push((meshLoader.normals[i + 2] * c) - (meshLoader.normals[i + 0] * s));
        }
    }
}
// Setup entity
entity.isVisible = true;
entity.position = [0, 0, 0];
E3D_addEntity(entity);

var paramDiv1 = document.getElementById("paramDiv1");
var paramDiv2 = document.getElementById("paramDiv2");
var paramDiv3 = document.getElementById("paramDiv3");
var paramDiv4 = document.getElementById("paramDiv4");

function E3D_addInput_range(element, name, caption, min, max, value, callback, step = 1, scale = 1, formatter = null) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newElem2 = document.createElement("span");
    newElem2.className = "E3D_input_value";
    newElem2.innerText = value;
    newElem2.id = "range_"+name+"_value";
    element.appendChild(newElem2);

    //<input type="range" id="range_$name" class="E3D_input_range" min="$min" max="$max" step="$step" value="$value" data-scale="$scale"/>
    newElem = document.createElement("input");
    newElem.type = "range";
    newElem.id = "range_"+name;
    newElem.className = "E3D_input_range";
    newElem.setAttribute("min", min);
    newElem.setAttribute("max", max);
    newElem.setAttribute("step", step);
    newElem.value = value;
    newElem.setAttribute("data-scale", scale);
    element.appendChild(newElem);

    newElem.addEventListener("input", function(event) {
        var newValue = event.target.value * scale;
        if (formatter != null) newValue = formatter(newValue);
        newElem2.innerText = newValue;
        callback(event, "range", name, newValue);
    });
}

function E3D_addInput_radio(element, name, caption, group, checked, callback) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newElem2 = document.createElement("span");
    newElem2.className = "E3D_input_value";
    newElem2.innerHTML = "&nbsp;";
    element.appendChild(newElem2);

    //<input type="radio" id="radio_$name" name="$group" class="E3D_input_radio" $checked />
    newElem = document.createElement("input");
    newElem.type = "radio";
    newElem.id = "radio_"+name;
    newElem.className = "E3D_input_radio";
    newElem.setAttribute("name", group);
    if (checked) newElem.setAttribute("checked", true);
    element.appendChild(newElem);

    newElem.addEventListener("input", function(event) { callback(event, "radio", name, event.target.checked); });
}

function E3D_addInput_checkbox(element, name, caption, checked, callback) {
    // <span class="E3D_input_caption">$caption</span>
    var newElem = document.createElement("span");
    newElem.className = "E3D_input_caption";
    newElem.innerText = caption;
    element.appendChild(newElem);

    // <span id="range_$name_value" class="E3D_input_value">$value</span>
    var newElem2 = document.createElement("span");
    newElem2.className = "E3D_input_value";
    newElem2.innerHTML = "&nbsp;";
    element.appendChild(newElem2);

    newElem = document.createElement("input");
    newElem.type = "checkbox";
    newElem.id = "checkbox_"+name;
    newElem.className = "E3D_input_checkbox";
    if (checked) newElem.setAttribute("checked", true);
    element.appendChild(newElem);

    newElem.addEventListener("input", function(event) { callback(event, "checkbox", name, event.target.checked); });
}


E3D_addInput_range(paramDiv1, "dia", "Diameter", 3, 120, 60, paramDiv1CB, 0.125);
E3D_addInput_range(paramDiv1, "pitch", "Pitch*", 0, 40, 11, paramDiv1CB, 0.5);
E3D_addInput_range(paramDiv1, "helix", "Helix Angle*", 0, 45, 3.33, paramDiv1CB, 0.01);
E3D_addInput_range(paramDiv1, "p", "Thrust Point height*", 0, 24, 1.73, paramDiv1CB, 0.01);
E3D_addInput_range(paramDiv1, "alpha", "Base Angle Of Attack", -10, 45, 7.0, paramDiv1CB, 0.25);
E3D_addInput_range(paramDiv1, "width", "Width", 0.125, 36, 6.25, paramDiv1CB, 0.125);
E3D_addInput_range(paramDiv1, "height", "Height", 0.125, 12, 3.0, paramDiv1CB, 0.125);
var paramLock = false;
function paramDiv1CB(event, type, id, value) {
    switch (id) {
        case "dia":
            maxL = value * 25.4 / 2.0;
            break;
        case "pitch":
            var helix = Math.atan( (value * 25.4) / (maxL * 2.0 * Math.PI) ) * RadToDeg;
            document.getElementById("range_helix").value = Math.round(helix * 100) / 100;
            document.getElementById("range_helix_value").innerText = Math.round(helix * 100) / 100;
            helixP = value / ( 2.0 * Math.PI );
            document.getElementById("range_p").value = Math.round(helixP * 100) / 100;
            document.getElementById("range_p_value").innerText = Math.round(helixP * 100) / 100;
            helixP = helixP * 25.4; 
            break;
        case "helix":
            var pitch = Math.tan(value * DegToRad) * (maxL * 2.0 * Math.PI / 25.4);
            document.getElementById("range_pitch").value = Math.round(pitch * 100) / 100;
            document.getElementById("range_pitch_value").innerText = Math.round(pitch * 100) / 100;
            helixP = value / ( 2.0 * Math.PI );
            document.getElementById("range_p").value = Math.round(helixP * 100) / 100;
            document.getElementById("range_p_value").innerText = Math.round(helixP * 100) / 100;
            helixP = helixP * 25.4; 
            break;
        case "p":
            var pitch = (2.0 * Math.PI) * value;
            document.getElementById("range_pitch").value = Math.round(pitch * 2) / 2;
            document.getElementById("range_pitch_value").innerText = Math.round(pitch * 2) / 2;
            var helix = Math.atan( (value * 25.4) / (maxL * 2.0 * Math.PI) )
            document.getElementById("range_helix").value = Math.round(helixP * 100) / 100;
            document.getElementById("range_helix_value").innerText = Math.round(helixP * 100) / 100;
            helixP = value * 25.4; 
            break;
        case "alpha":
            baseAng = value * DegToRad;
            break;
        case "width":
            maxWidth = value * 25.4;
            minL = maxWidth * 0.4;
            break;
        case "height":
            maxHeight = value * 25.4;
            break;
    }
    entity.clear();
    genProp();
}


E3D_addInput_range(paramDiv2, "numSections", "Number of Sections", 2, 256, 42, paramDiv2CB);
E3D_addInput_range(paramDiv2, "puffExp", "Root Puff Exponent", 1, 5, 2.9, paramDiv2CB, 0.1);
E3D_addInput_range(paramDiv2, "puffCoef", "Root Puff Coefficient", 0, 15, 6.4, paramDiv2CB, 0.1);
E3D_addInput_range(paramDiv2, "puffCosExp", "Root Puff Cosine Exp", 0, 5, 1.5, paramDiv2CB, 0.1);
E3D_addInput_range(paramDiv2, "hubDia", "Hub hole diameter", 0, 6, 1, paramDiv2CB, 0.125);
E3D_addInput_checkbox(paramDiv2, "clipTop", "Clip to top of hub", true, paramDiv2CB);

function paramDiv2CB(event, type, id, value) {
    switch (id) {
        case "numSections":
            numSegments = value;
            break;
        case "puffExp":
            puffExp = value;
            break;
        case "puffCoef":
            puffCoef = value;
            break;
        case "puffCosExp":
            cosExp = value;
            break;
        case "hubDia":
            hubBoreRadius = value * 25.4 / 2.0;
        case "clipTop":
            clipTop = value;
            break;
    }
    entity.clear();
    genProp();
}

E3D_addInput_range(paramDiv3, "nBlades", "Number of Blades", 2, 6, 2, paramDiv3CB);
E3D_addInput_range(paramDiv3, "taperL", "Taper Length %", 0, 100, 50, paramDiv3CB);
E3D_addInput_range(paramDiv3, "taperW", "Taper Width %", 0, 100, 50, paramDiv3CB);
E3D_addInput_range(paramDiv3, "minEdge", "Minimum edge Thickness", 0.0, 1, 0.125, paramDiv3CB, 0.0625);

E3D_addInput_range(paramDiv3, "slipAngle", "Profile Slip Angle", -30, 30, 0, paramDiv3CB);
E3D_addInput_checkbox(paramDiv3, "slipRound", "Round Profile", true, paramDiv3CB);

function paramDiv3CB(event, type, id, value) {
    if (id == "nBlades") nBlades = value;
    if (id == "taperL")  taperRatio = (100-value) / 100.0;
    if (id == "taperW")  taperScale = value / 100.0;
    if (id == "minEdge") minEdgeT = value * 25.4;
    if (id == "slipAngle") slipAngle = -value * DegToRad;
    if (id == "slipRound") slipRound = value;


    entity.clear();
    genProp();
}



E3D_addInput_radio(paramDiv4, "flat", "Color: Flat", "colors", false, paramDiv4CB);
E3D_addInput_radio(paramDiv4, "striped", "Color: Striped", "colors", false, paramDiv4CB);
E3D_addInput_radio(paramDiv4, "checkered", "Color: Checkered", "colors", true, paramDiv4CB);
E3D_addInput_checkbox(paramDiv4, "showHub", "Show Hub", true, paramDiv4CB);
E3D_addInput_checkbox(paramDiv4, "model", "Show Model", true, paramDiv4CB);
E3D_addInput_checkbox(paramDiv4, "profile", "Show Profiles", true, paramDiv4CB);

function paramDiv4CB(event, type, id, value) {
    var regen = true;
    switch (id) {
        case "flat":
            colorModel = 0;
            break;
        case "striped":
            colorModel = 1;
            break;
        case "checkered":
            colorModel = 2;
            break;
        case "model":
            //showModel = value;
            entity.isVisible = value;
            regen = false;
            break;
        case "profile":
            showProfile = value;
            profileEntity.isVisible = value;
            regen = false;
            break;
        case "showHub":
            showHub = value;
            break;
    }
    if (regen) {
        entity.clear();
        genProp();
    }
}

var bottomBar = document.getElementById("bottomBar");
CB_tick = function() {
    var t = meshLoader.positions.length/9 + " poly, ";
    for (var i = 0; i < backupTL.length; ++i) t += (backupTL[i][1] * 0.224337).toFixed(1) + " ";
    bottomBar.innerText = t;
}

var select_air = document.getElementById("select_air");
select_air.addEventListener("input", calcAero);
var number_rpm = document.getElementById("number_rpm");
number_rpm.addEventListener("input", calcAero);
var text_output = document.getElementById("text_output");

document.getElementById("button_save").addEventListener("click", saveMesh);
function saveMesh() {
    downloadBlob("mesh.stl", meshLoader.saveModel_ASCIISTL("ver5prop1.js"));
}
document.getElementById("button_clean").addEventListener("click", cleanMesh);

function cleanMesh() {

    var st = performance.now();
    meshLoader.removeArealessTriangles();
    var et = performance.now();
    console.log("t rem area 0 tri : " + (et - st));

    st = performance.now();
    meshLoader.genBoundingBox();
    et = performance.now();
    console.log("t gen bb : " + (et - st));

    st = performance.now();
    meshLoader.genUniqueVertices(); //was 1.4sec for 2blades 5.1 for 4blades 11.5 for 6blades, now .112 for 2blade .146 for 4blades .283 for 6blades
    et = performance.now();
    console.log("t uniques: " + (et - st));

    st = performance.now();
    meshLoader.smoothNormals(0.71); //was 3.0sec for 2blades 11.2 for 4blades 27 for 6blades, .03 for 2blades, .06 for 4blades, .06 for 6blades
    et = performance.now();
    console.log("t smooth : " + (et - st)); 

    st = performance.now();
    meshLoader.genEdges(); //was 4.1sec for 2blades 19.8 for 4blades 35 for 6blades, now .121 for 2blades, .218 for 4blades, .240 for 6blades
    et = performance.now();
    console.log("t edges: " + (et - st)); // 28314 edges

    entity.clear();
    meshLoader.addModelData(entity);

    st = performance.now();
    meshLoader.addStrokeData(entity);   // 0.013 for 2blades, 0.02 for 2blades, 0.04 for 6blades
    et = performance.now();
    console.log("t add stroke data: " + (et - st));
}

genProp();
