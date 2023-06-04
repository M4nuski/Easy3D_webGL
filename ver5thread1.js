// Easy3D_WebGL
// Thread mesh generator 1
// Emmanuel Charette 2023

"use strict"

E3D_DEBUG_LOG_TIMESTAMPS = true;

log("E3D_userInit");

// Load all default engine parts: scene, lights, timer, inputs, camera
E3D_InitAll();
SCENE.strokeColor = _v3_black;


// Create the entities
var groundEntity = new E3D_entity_wireframe_canvas("entity0");

// Ground plane
groundEntity.addPlane(_v3_origin, _v3_null, 12, 12, _v3_black, 120);
groundEntity.addPlane([0.0, 0.001, 0.0], _v3_null, 12, 12, _v3_red, 10);
groundEntity.isVisible = true;
E3D_addEntity(groundEntity);

// Profile wireframe
var profileEntity = new E3D_entity_wireframe_canvas("entity1");
E3D_addEntity(profileEntity);
profileEntity.isVisible = true;
 // Thrust Vectors


// tweak engine params for large models
E3D_NEAR = 0.1;
E3D_FAR = 256.0;
CAMERA = new E3D_camera_model("camera0m");
E3D_onResize();

CONTEXT.disable(CONTEXT.CULL_FACE); 

// Move the camera back and up a little, add some nod 
CAMERA.moveBy(0.5, 0.5, 1, 0.3, 0, 0.0);
SCENE.setClearColor([ 0.85,  0.85,  0.85]);
SCENE.lightA_color = _v3_darkgray; 
INPUTS._posSpeed *= 0.025;
INPUTS._rotSpeed *= 0.5;

// mesh creating utility
var meshLoader = new E3D_mesh();
var entity = new E3D_entity("entity1", true); // dynamic entity, GPU data will be updated when changed
// Setup entity
entity.isVisible = true;
entity.position = [0, 0, 0];
E3D_addEntity(entity);

// Mesh parameters

var majorDia = 1;
var pitch = 14; // TPI
var angle = 60;

var fitCut = 0.003;
var rootCut = 0.250;
var tipCut = 0.125;

var nTurns = 10;
var nSections = 16;
var meshType = "ext"; // ext | int | spec

profileEntity.clear();


// var starter thread ?

/*
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
*/
function genMesh(){

    meshLoader.reset();
// generate thread profile
// revolve over spiral
// close mesh
    // close thread profiles
    // close cylinder
    var points = [];
    points.push(v3_new()); // bottom mid root
    points.push(v3_new()); // bottom

    points.push(v3_new()); // bottom tip
    points.push(v3_new()); // top tip

    points.push(v3_new()); // top 
    points.push(v3_new()); // top mid root

    const majorRadius = majorDia / 2;
    const decimalPitch = (1 / pitch);
    const halfDecPitch = decimalPitch / 2;
    const threadH = decimalPitch / (2 * Math.tan(angle * DegToRad / 2) );
    const angleRatio =  Math.tan(angle * DegToRad / 2);

    // as per standard
    const tipRadius = majorRadius + ( threadH / 8 );
    const minorRadius = majorRadius - ( 5 * threadH / 8 );
    const rootRadius = majorRadius - ( 7 * threadH / 8 );

    // compensated 
    let EffMajorRadius = tipRadius - (tipCut * threadH);
    if (meshType == "int") EffMajorRadius = tipRadius;
    let EffMinorRadius = rootRadius + (rootCut * threadH);
    if (meshType == "ext") EffMinorRadius = rootRadius;

    paramDiv3.innerText  = "10% fit: " + (0.1 / pitch).toFixed(4) + "\n";
    paramDiv3.innerText += "Pitch: " + decimalPitch.toFixed(4) + "\n";
    paramDiv3.innerText += "H: " + threadH.toFixed(4) + "\n";

    let fitVertOffset = 0.5 * fitCut / Math.sin((90-(angle/2)) * DegToRad);
    //if (meshType == "spec") fitVertOffset = 0.0000;
    if (meshType == "int") fitVertOffset = -fitVertOffset;
    if (fitVertOffset > (angleRatio * (tipRadius - EffMajorRadius))) fitVertOffset = (angleRatio * (tipRadius - EffMajorRadius));
    if (fitVertOffset < (-angleRatio * (EffMinorRadius - rootRadius))) fitVertOffset = (-angleRatio * (EffMinorRadius - rootRadius));

    points[0][0] = rootRadius;

    points[1][0] = tipRadius;
    points[1][1] = halfDecPitch;

    points[2][0] = rootRadius;
    points[2][1] = decimalPitch;

    points[3] = v3_val_new(EffMinorRadius, 0, 0.0001);
    points[4] = v3_val_new(EffMinorRadius, (angleRatio * (EffMinorRadius - rootRadius)) + fitVertOffset,  0.0001);
    points[5] = v3_val_new(EffMajorRadius, (halfDecPitch - (angleRatio * (tipRadius - EffMajorRadius))) + fitVertOffset,  0.0001);

    points[6] = v3_val_new(EffMajorRadius, halfDecPitch + (angleRatio * (tipRadius - EffMajorRadius)) - fitVertOffset,  0.0001);
    points[7] = v3_val_new(EffMinorRadius, decimalPitch - (angleRatio * (EffMinorRadius - rootRadius)) - fitVertOffset,  0.0001);
    points[8] = v3_val_new(EffMinorRadius, decimalPitch, 0.0001);

    const p0_bottom_midroot = v3_clone(points[3]);
    const p1_bottom = v3_clone(points[4]);
    const p2_bottom_tip = v3_clone(points[5]);
    const p3_top_tip = v3_clone(points[6]);
    const p4_top = v3_clone(points[7]);
    const p5_top_midroot = v3_clone(points[8]);

    profileEntity.clear();
    profileEntity.addLine([majorRadius, 0, 0], [majorRadius, nTurns * decimalPitch], _v3_darkgreen);
    profileEntity.addLine([minorRadius, 0, 0], [minorRadius, nTurns * decimalPitch], _v3_darkgreen);
    profileEntity.addLine([tipRadius, 0, 0], [tipRadius, nTurns * decimalPitch], _v3_red);
    profileEntity.addLine([rootRadius, 0, 0], [rootRadius, nTurns * decimalPitch], _v3_red);

    for (var i = 0; i < nTurns; ++i) {
        profileEntity.addLine(points[0], points[1], _v3_red);
        profileEntity.addLine(points[1], points[2], _v3_red);

        profileEntity.addLine(points[3], points[4], _v3_blue);
        profileEntity.addLine(points[4], points[5], _v3_blue);
        profileEntity.addLine(points[5], points[6], _v3_blue);
        profileEntity.addLine(points[6], points[7], _v3_blue);
        profileEntity.addLine(points[7], points[8], _v3_blue);

        v3_add_mod(points[0], [0, decimalPitch, 0]);
        v3_add_mod(points[1], [0, decimalPitch, 0]);
        v3_add_mod(points[2], [0, decimalPitch, 0]);

        v3_add_mod(points[3], [0, decimalPitch, 0]);
        v3_add_mod(points[4], [0, decimalPitch, 0]);
        v3_add_mod(points[5], [0, decimalPitch, 0]);
        v3_add_mod(points[6], [0, decimalPitch, 0]);
        v3_add_mod(points[7], [0, decimalPitch, 0]);
        v3_add_mod(points[8], [0, decimalPitch, 0]);
    }



    // generate mesh
    //const p0_bottom_midroot = v3_clone(points[3]);
    //const p1_bottom = v3_clone(points[4]);
    //const p2_bottom_tip = v3_clone(points[5]);
    //const p3_top_tip = v3_clone(points[6]);
    //const p4_top = v3_clone(points[7]);
    //const p5_top_midroot = v3_clone(points[8]);
    const sectionAngle = Math.PI * 2 / nSections;
    const turnOffset = v3_val_new(0, decimalPitch, 0);
    const sectionOffset = v3_val_new(0, decimalPitch / nSections, 0);

    for (var t = 0; t < nTurns; ++t) {
        points[0] = v3_addscaled_new(p0_bottom_midroot, turnOffset, t);
        points[1] = v3_addscaled_new(p1_bottom, turnOffset, t);
        points[2] = v3_addscaled_new(p2_bottom_tip, turnOffset, t);
        points[3] = v3_addscaled_new(p3_top_tip, turnOffset, t);
        points[4] = v3_addscaled_new(p4_top, turnOffset, t);
        points[5] = v3_addscaled_new(p5_top_midroot, turnOffset, t);

        for (var s = 0; s < nSections; ++s) {
            points[6]  = v3_rotateY_new(points[0], sectionAngle);
            points[7]  = v3_rotateY_new(points[1], sectionAngle);
            points[8]  = v3_rotateY_new(points[2], sectionAngle);
            points[9]  = v3_rotateY_new(points[3], sectionAngle);
            points[10] = v3_rotateY_new(points[4], sectionAngle);
            points[11] = v3_rotateY_new(points[5], sectionAngle);

            v3_add_mod(points[6], sectionOffset);
            v3_add_mod(points[7], sectionOffset);
            v3_add_mod(points[8], sectionOffset);
            v3_add_mod(points[9], sectionOffset);
            v3_add_mod(points[10], sectionOffset);
            v3_add_mod(points[11], sectionOffset);

            meshLoader.pushQuad4p(points[0], points[6], points[7], points[1]);
            meshLoader.pushQuad4p(points[1], points[7], points[8], points[2]);
            meshLoader.pushQuad4p(points[2], points[8], points[9], points[3]);
            meshLoader.pushQuad4p(points[3], points[9], points[10], points[4]);
            meshLoader.pushQuad4p(points[4], points[10], points[11], points[5]);

            v3_copy(points[0], points[6]);
            v3_copy(points[1], points[7]);
            v3_copy(points[2], points[8]);
            v3_copy(points[3], points[9]);
            v3_copy(points[4], points[10]);
            v3_copy(points[5], points[11]);
        }
    }

    // bottom cap
    let middle = v3_val_new(0, halfDecPitch, 0);
    for (var s = 0; s < nSections; ++s) {
        points[0]  = v3_rotateY_new(p0_bottom_midroot, sectionAngle * s);
        points[1]  = v3_rotateY_new(p0_bottom_midroot, sectionAngle * (s + 1));

        v3_addscaled_mod(points[0], sectionOffset, s);
        v3_addscaled_mod(points[1], sectionOffset, s + 1);

        meshLoader.pushTriangle3p(points[0], points[1], middle);
    }

    // bottom thread end
    meshLoader.pushTriangle3p(middle, p0_bottom_midroot, p1_bottom);
    meshLoader.pushTriangle3p(middle, p1_bottom, p2_bottom_tip);
    meshLoader.pushTriangle3p(middle, p2_bottom_tip, p3_top_tip);
    meshLoader.pushTriangle3p(middle, p3_top_tip, p4_top);
    meshLoader.pushTriangle3p(middle, p4_top, p5_top_midroot);

    // top cap
    middle = v3_val_new(0, (nTurns * decimalPitch) + halfDecPitch, 0);
    for (var s = 0; s < nSections; ++s) {
        points[0]  = v3_rotateY_new(p5_top_midroot, sectionAngle * s);
        points[1]  = v3_rotateY_new(p5_top_midroot, sectionAngle * (s + 1));

        v3_addscaled_mod(points[0], sectionOffset, ((nTurns - 1) * nSections) + s);
        v3_addscaled_mod(points[1], sectionOffset, ((nTurns - 1) * nSections) + s + 1);

        meshLoader.pushTriangle3p(points[0], points[1], middle);
    }

    // top thread end
    v3_addscaled_mod(p0_bottom_midroot, turnOffset, nTurns);
    v3_addscaled_mod(p1_bottom, turnOffset, nTurns);
    v3_addscaled_mod(p2_bottom_tip, turnOffset, nTurns);
    v3_addscaled_mod(p3_top_tip, turnOffset, nTurns);
    v3_addscaled_mod(p4_top, turnOffset, nTurns);
    v3_addscaled_mod(p5_top_midroot, turnOffset, nTurns);

    meshLoader.pushTriangle3p(middle, p1_bottom, p0_bottom_midroot);
    meshLoader.pushTriangle3p(middle, p2_bottom_tip, p1_bottom);
    meshLoader.pushTriangle3p(middle, p3_top_tip, p2_bottom_tip);
    meshLoader.pushTriangle3p(middle, p4_top, p3_top_tip);
    meshLoader.pushTriangle3p(middle, p5_top_midroot, p4_top);


    meshLoader.addModelData(entity);


  //  profileEntity.addLine(points[2], points[1]);
/*

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
            profileEntity.moveLineCursorTo(segments[j].profile[0]);
            for (var i = 1; i < profile.length; ++i) profileEntity.addLineTo(segments[j].profile[i], _v3_orange);
        }
    }


    // Calc aero data
    calcAero();
    */
}

/*
function getCoef(ang) {
    var lastIndex = profileAeroData.length-1;
 //alpha   CL      CD
//[-12.500, -0.8056, 0.04280],

//[-12.250, -0.8431, 0.03834],
//...
//[16.500, 1.4137, 0.07807],
//[16.750, 1.4010, 0.08355] ];
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
*/
/*
var backupTL = [];
function calcAero() {
    // F = CL * 0.5 * rho * V^2 * A
    //numSegments = 2;
    //segmentsAngles = [0, 0];
    //segmentsLengthsFinal = [1000.0, 1000.0];
    //segmentsRadius = [1000.0, 2000.0];


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
*/
/*
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

*/

var paramDiv1 = document.getElementById("paramDiv1");
var paramDiv2 = document.getElementById("paramDiv2");
var paramDiv3 = document.getElementById("paramDiv3");
//var paramDiv4 = document.getElementById("paramDiv4");
// TODO add to DOM helper class
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
// TODO add E3D_addInput_select

E3D_addInput_range(paramDiv1, "dia", "Maj. Diameter", 0.125, 2, 1.0, paramDiv1CB, 0.005);
E3D_addInput_range(paramDiv1, "pitch", "TPI", 1, 80, 14, paramDiv1CB, 0.5);
E3D_addInput_range(paramDiv1, "angle", "P. Angle", 2, 120, 60, paramDiv1CB, 1);
E3D_addInput_range(paramDiv1, "fit", "Fit", -0.050, 0.050, 0.003, paramDiv1CB, 0.0005);
E3D_addInput_range(paramDiv1, "tip", "Tip cut ratio", 0.005, 0.495, 0.125, paramDiv1CB, 0.005);
E3D_addInput_range(paramDiv1, "root", "Root cut ratio", 0.005, 0.495, 0.25, paramDiv1CB, 0.005);

var paramLock = false;
function paramDiv1CB(event, type, id, value) {
    switch (id) {
        case "dia":
            majorDia = value;
            break;
        case "pitch":
            pitch = value;
            break;
        case "angle":
            angle = value;
            break;
        case "fit":
            fitCut = value;
            break;
        case "tip":
            tipCut = value;
            break;
        case "root":
            rootCut = value;
            break;
    }
    entity.clear();
    genMesh();
}


E3D_addInput_range(paramDiv2, "nSections", "Nb of Sections", 6, 256, 16, paramDiv2CB, 1);
E3D_addInput_range(paramDiv2, "nTurns", "Nb of turns", 1, 128, 10, paramDiv2CB, 1);
E3D_addInput_radio(paramDiv2, "ext", "External Thread", "style", true, paramDiv2CB);
E3D_addInput_radio(paramDiv2, "int", "Internal Thread", "style", false, paramDiv2CB);
E3D_addInput_radio(paramDiv2, "spec", "Spec Profile", "style", false, paramDiv2CB);
//E3D_addInput_checkbox(paramDiv2, "clipTop", "Clip to top of hub", true, paramDiv2CB);

function paramDiv2CB(event, type, id, value) {
    switch (id) {
        case "nSections":
            nSections = value;
            break;
        case "nTurns":
            nTurns = value;
            break;
    }
    if (type == "radio") {
        meshType = id;
    }
    entity.clear();
    genMesh();
}
/*
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
*/
var bottomBar = document.getElementById("bottomBar");
CB_tick = function() {
    var t = meshLoader.positions.length/9 + " poly, ";
    //for (var i = 0; i < backupTL.length; ++i) t += (backupTL[i][1] * 0.224337).toFixed(1) + " ";
    bottomBar.innerText = t;
}

var select_air = document.getElementById("select_air");
//select_air.addEventListener("input", calcAero);
var number_rpm = document.getElementById("number_rpm");
//number_rpm.addEventListener("input", calcAero);
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

genMesh();
