// Easy3D_WebGL
// Collision detection methods
// Emmanuel Charette 2019-2020

"use strict"


// Index constant for CD data
const _CD_box_edge_TopBack  = 0;
const _CD_box_edge_TopRight = 1;
const _CD_box_edge_TopFront = 2;
const _CD_box_edge_TopLeft  = 3;

const _CD_box_edge_BackRight  = 4;
const _CD_box_edge_FrontRight = 5;
const _CD_box_edge_FrontLeft  = 6;
const _CD_box_edge_BackLeft   = 7;

const _CD_box_edge_BottomBack  = 8;
const _CD_box_edge_BottomRight = 9;
const _CD_box_edge_BottomFront = 10;
const _CD_box_edge_BottomLeft  = 11;

const _CD_box_corner_TopBackRight  = 0; 
const _CD_box_corner_TopFrontRight = 1; 
const _CD_box_corner_TopFrontLeft  = 2; 
const _CD_box_corner_TopBackLeft   = 3; 

const _CD_box_corner_BottomBackRight  = 4; 
const _CD_box_corner_BottomFrontRight = 5; 
const _CD_box_corner_BottomFrontLeft  = 6; 
const _CD_box_corner_BottomBackLeft   = 7; 

// Number of CD results objects to create at first as a default
const E3D_initial_nb_CDresult = 3;



var phyTracers, dev_Hits; // TODO extract to debug.js and setup auto initialization


class E3D_CDdata {
    constructor() {
        this.delta = v3_new(); // Position delta
        this.deltaLength = -1; // length of this.delta during animation step for culling and interpolation

        this.collisionDetected = false;
        this.colNum = 0;
        this.closestCollision = new Array(E3D_initial_nb_CDresult);
        for (var i = 0; i < E3D_initial_nb_CDresult; ++i) this.closestCollision[i] = new E3D_CDresult(); 

        this.collisionFromOther = false;
        this.otherColNum = 0;
        this.otherCollision = new Array(E3D_initial_nb_CDresult);
        for (var i = 0; i < E3D_initial_nb_CDresult; ++i) this.otherCollision[i] = new E3D_CDresult(); 


        this.candidates = []; // for all other entities, bool to test for CD after culling pass
        this.lastHitMarker = ""; // marker of last hit target to ignore on next pass
    }

    resetCollisions() {             
        for (var i = 0; i < this.colNum; ++i) this.closestCollision[i].reset();
        for (var i = 0; i < this.otherColNum; ++i) this.otherCollision[i].reset();

        this.collisionDetected = false;
        this.collisionFromOther = false;

        this.colNum = 0;
        this.otherColNum = 0;
    }

    pushCollisionSource(m, t, n, p, sDesc, scdi, tei, tDesc, tcdi) {
        if (this.colNum >= this.closestCollision.length) this.closestCollision.push(new CDresult());
        
        this.closestCollision[this.colNum].marker = ""+m;
        this.closestCollision[this.colNum].t0 = t;
        v3_copy(this.closestCollision[this.colNum].n, n);
        v3_copy(this.closestCollision[this.colNum].p0, p);
        
        this.closestCollision[this.colNum].source_desc = sDesc;
        this.closestCollision[this.colNum].source_cdi = scdi;
        this.closestCollision[this.colNum].target_ei = tei;
        this.closestCollision[this.colNum].target_desc = tDesc;
        this.closestCollision[this.colNum].target_cdi = tcdi; 
        
        this.colNum++;
        this.collisionDetected = true;
    }



    pushCollisionTarget(m, t, n, p, sDesc, scdi, tei, tDesc, tcdi, s) {
        if (this.otherColNum >= this.otherCollision.length) this.otherCollision.push(new CDresult());
       
        this.otherCollision[this.otherColNum].marker = ""+m;
        this.otherCollision[this.otherColNum].t0 = t;
        v3_copy(this.otherCollision[this.otherColNum].n, n);
        v3_copy(this.otherCollision[this.otherColNum].p0, p);
        
        this.otherCollision[this.otherColNum].source_desc = sDesc;
        this.otherCollision[this.otherColNum].source_cdi = scdi;
        this.otherCollision[this.otherColNum].target_ei = tei;
        this.otherCollision[this.otherColNum].target_desc = tDesc;
        this.otherCollision[this.otherColNum].target_cdi = tcdi; 
        
        v3_copy(this.otherCollision[this.otherColNum].s, s);

        this.otherColNum++;
        this.collisionFromOther = true;

    }
}




class E3D_CDresult {
    constructor() {
        this.marker = "";
        this.t0 = Infinity;
        this.n = v3_new(); 
        this.p0 = v3_new(); 
        this.source_desc = ""; // CD desc
        this.source_cdi = 0; // CD index
        this.target_ei = 0; // entity index
        this.target_desc = "";
        this.target_cdi = 0; 
        this.s = v3_new(); // TODO remove when source_ai is source_ei and animations/entities are global, replace by target entity index
    }

    reset() {
        this.marker = "";
        this.t0 = Infinity;
    }
}






function CheckForAnimationCollisions_SphSource(self, SCENE, animations){

var firstHit  = v3_new();
var hitNormal = v3_new();

var posOffset  = v3_new();
var posDelta = v3_new();

var planePosition = v3_new();

var sourceSph_p0 = v3_new();
var sourceSph_n  = v3_new();


// for each sph CD as source
for (var sphIndex = 0; sphIndex < self.target.CD_sph; ++sphIndex) {
        
    let sourceSph_p = self.target.CD_sph_p[sphIndex];
    let sourceSph_r = self.target.CD_sph_r[sphIndex];
    v3_sub_res(sourceSph_p0, sourceSph_p, self.delta);
    v3_invscale_res(sourceSph_n, self.delta, self.deltaLength);  
    //if (E3D_DEBUG_SHOW_HIT_TEST && (dev_Hits != undefined)) {
    //    dev_Hits.addWireSphere(sourceSph_p0, 2.0 * sourceSph_r, _v3_blue, 8, false, 3);
     //   dev_Hits.addWireSphere(sourceSph_p, 2.0 * sourceSph_r, _v3_green, 8, false, 3);    
    //}
    var _tempCDRes_t0  = Infinity;
    var _tempCDRes_n   = v3_new();
    var _tempCDRes_p0  = v3_new();
    var _tempCDRes_source_desc = "Sph";
    var _tempCDRes_source_cdi  = sphIndex;
    
    var _tempCDRes_marker = "";
    var _tempCDRes_target_desc = "";
    var _tempCDRes_target_cdi = 0;
    var _tempCDRes_target_ei = 0;

// for each candidate entity       
    for (let targetIndex = 0; targetIndex < self.candidates.length; ++targetIndex) if (self.candidates[targetIndex] == true) {
        _tempCDRes_target_ei = targetIndex;

    // TODO special cases when deltaLength is 0.0
       
        // collision detection - self.sph to other sph (static sph target)
        // TODO use path to path interpolation for both     
        for (let j = 0; j < ENTITIES[targetIndex].CD_sph; ++j) {
            var marker = "s"+targetIndex+"s"+j;
            if (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;

                var hitRes = capsuleSphereIntersect(sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                                    ENTITIES[targetIndex].CD_sph_p[j], ENTITIES[targetIndex].CD_sph_r[j]);

                if (hitRes != false) {
                    if (hitRes < 0.0) hitRes = 0.0;

                    v3_addscaled_res(firstHit, sourceSph_p0, sourceSph_n, hitRes);
                    var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);

                    if (t0 < _tempCDRes_t0) {

                        v3_sub_res(hitNormal, firstHit, ENTITIES[targetIndex].CD_sph_p[j]);

                        _tempCDRes_marker = ""+marker;
                        _tempCDRes_t0 = t0;
                        v3_copy(_tempCDRes_n, hitNormal);
                        v3_copy(_tempCDRes_p0, firstHit);
                        _tempCDRes_target_desc = "Sph";
                        _tempCDRes_target_cdi = j;

                        if ((self.target.animIndex != -1) && (ENTITIES[targetIndex].animIndex != -1)) {
                            animations[ENTITIES[targetIndex].animIndex].pushCollisionTarget(marker, t0 / self.deltaLength, hitNormal, firstHit, "Sph", "Sph", targetIndex, sphIndex, j, self.pspd);
                        }                            
                    }
                }
            } 
        } // sph - sph



        // collision detection - self.sph to edge (static edge)
        for (let j = 0; j < ENTITIES[targetIndex].CD_edge; ++j) {
            var marker = "s"+targetIndex+"e"+j;
            if  (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;


                var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                    ENTITIES[targetIndex].CD_edge_p[j], ENTITIES[targetIndex].CD_edge_n[j], ENTITIES[targetIndex].CD_edge_l[j]);

                if (hitRes != false) {

                    v3_addscaled_res(firstHit, sourceSph_p0, sourceSph_n, hitRes * self.deltaLength);
                    var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);

                    if ( t0 < _tempCDRes_t0 ) {        

                        //point_segment_point_res(posOffset, ENTITIES[targetIndex].CD_edge_p[j], ENTITIES[targetIndex].CD_edge_n[j], ENTITIES[targetIndex].CD_edge_l[j], firstHit);
                        v3_sub_res(hitNormal, firstHit, posOffset);   
                        
                        if (E3D_DEBUG_SHOW_HIT_TEST) dev_Hits.addWireSphere(firstHit, 2.0 * sourceSph_r, [1.0,0.25,0.25], 8, false, 3);

                        _tempCDRes_marker = ""+marker;
                        _tempCDRes_t0 = t0;
                        v3_copy(_tempCDRes_n, hitNormal);
                        v3_copy(_tempCDRes_p0, firstHit);
                        _tempCDRes_target_desc = "Edge";
                        _tempCDRes_target_cdi = j;
                    }

                }
            }//marker different
        }// for edges





        // collision detection - self.sph to plane (static)
        for (let j = 0; j < ENTITIES[targetIndex].CD_plane; ++j) {
            var marker = "s"+targetIndex+"p"+j;
            if  (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;

                v3_copy(hitNormal, ENTITIES[targetIndex].CD_plane_n[j]);
                var hitRes = capsulePlaneIntersect_res(firstHit, sourceSph_r, sourceSph_p0, sourceSph_n,
                    hitNormal, ENTITIES[targetIndex].CD_plane_p[j],
                    ENTITIES[targetIndex].CD_plane_w[j], ENTITIES[targetIndex].CD_plane_halfWidth[j],
                    ENTITIES[targetIndex].CD_plane_h[j], ENTITIES[targetIndex].CD_plane_halfHeight[j]);
                    
                    if ((hitRes != false) && (hitRes <= self.deltaLength)) {

                        v3_sub_res(posDelta, sourceSph_p0, ENTITIES[targetIndex].CD_plane_p[j]);// Delta of Origin point and Plane position 

                        var d0 = v3_dot(posDelta, hitNormal);                         
                        if (d0 < 0.0) v3_negate_mod(hitNormal); // if d >= 0 on side of normal, else on opposite side of normal

                        var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);
                        if ( t0 <= _tempCDRes_t0 ) {
                            if (E3D_DEBUG_SHOW_HIT_TEST) if (v3_distancesquared(firstHit, sourceSph_p0) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * sourceSph_r, (d0 > 0.0) ? [1, 0, 0] : [ 1, 0.25, 0.25], 8, false, 3);
                            _tempCDRes_marker = ""+marker;
                            _tempCDRes_t0 = t0;
                            v3_copy(_tempCDRes_n, hitNormal);
                            v3_copy(_tempCDRes_p0, firstHit);
                            _tempCDRes_target_desc = "Plane";
                            _tempCDRes_target_cdi = j;
                        }
                }
            } // different marker
        } // sph - plane






        // collision detection - self.sph to box (static)
        for (let j = 0; j < ENTITIES[targetIndex].CD_box; ++j) {
            var marker = "s"+targetIndex+"b"+j;
            if  (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;


                // pre cull as capsule vs sph
                if (capsuleSphereIntersect(sourceSph_r, 
                                            sourceSph_p0, 
                                                sourceSph_n,
                                                self.deltaLength,
                                                ENTITIES[targetIndex].CD_box_p[j], 
                                                ENTITIES[targetIndex].CD_box_preCull_r[j]) != false) {

                    v3_sub_res(posDelta, sourceSph_p0, ENTITIES[targetIndex].CD_box_p[j]); // Delta of Origin point and Plane position 

                    // cull on which side the sph is arriving from
                    var pxdot = v3_dot(posDelta, ENTITIES[targetIndex].CD_box_x[j]);
                    var pydot = v3_dot(posDelta, ENTITIES[targetIndex].CD_box_y[j]);
                    var pzdot = v3_dot(posDelta, ENTITIES[targetIndex].CD_box_z[j]);

                    // relative sph movement
                    var dxdot = v3_dot(sourceSph_n, ENTITIES[targetIndex].CD_box_x[j]);
                    var dydot = v3_dot(sourceSph_n, ENTITIES[targetIndex].CD_box_y[j]);
                    var dzdot = v3_dot(sourceSph_n, ENTITIES[targetIndex].CD_box_z[j]);

                    var edgesToCheck = [false, false, false, false,  false, false, false, false,  false, false, false, false];
                    // top back, top right, top front, top left,
                    // back right, front right, front left, back left,
                    // bottom back, bottom right, bottom front, bottom left

                    var planeHit = false; 
                    var edgesToTest = false;
                    var edgeHit = false;
                    var closestHit = Infinity; // t 
                    var hitSuffix = "";

                    var closestP = v3_new();
                    var closestT = v3_new();
                    var closestN = v3_new();
                    var closestL = 0.0;
                    // firstHit = closestP + closestN * (closestL * closestHit)

                    var apxdot = Math.abs(pxdot);
                    var apydot = Math.abs(pydot);
                    var apzdot = Math.abs(pzdot);

                    if ( (apxdot <= ENTITIES[targetIndex].CD_box_halfWidth[j] + sourceSph_r) &&
                    (apydot <= ENTITIES[targetIndex].CD_box_halfHeight[j] + sourceSph_r) &&
                    (apzdot <= ENTITIES[targetIndex].CD_box_halfDepth[j] + sourceSph_r) ) {
                            // if (E3D_DEBUG_SHOW_HIT_TEST) log("inside box, level 1");

                        if ( (apxdot <= ENTITIES[targetIndex].CD_box_halfWidth[j]) &&
                                (apydot <= ENTITIES[targetIndex].CD_box_halfHeight[j]) ) {
                            if (E3D_DEBUG_SHOW_HIT_TEST) log("inside box Z, level 2");
                            var error = ENTITIES[targetIndex].CD_box_halfDepth[j] + sourceSph_r;
                            error = error - apzdot;

                            v3_scale_res(posOffset, ENTITIES[targetIndex].CD_box_z[j], error);
                            v3_add_mod(self.target.position, posOffset);                            
                            self.target.updateMatrix();

                            v3_add_mod(sourceSph_p0, posOffset); 
                            v3_copy(firstHit, sourceSph_p0);
                            v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_z[j]);
                            if (pzdot < 0.0) v3_negate_mod(hitNormal);
                            planeHit = true;
                            hitSuffix = "-Inside";

                        } else if ( (apxdot <= ENTITIES[targetIndex].CD_box_halfWidth[j]) &&
                                    (apzdot <= ENTITIES[targetIndex].CD_box_halfDepth[j]) ) {

                            if (E3D_DEBUG_SHOW_HIT_TEST) log("inside box Y, level 2");

                            var error = ENTITIES[targetIndex].CD_box_halfHeight[j] + sourceSph_r;
                            error = error - apydot;

                            v3_scale_res(posOffset, ENTITIES[targetIndex].CD_box_y[j], error);
                            v3_add_mod(self.target.position, posOffset);                            
                            self.target.updateMatrix();

                            v3_add_mod(sourceSph_p0, posOffset); 
                            v3_copy(firstHit, sourceSph_p0);
                            v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_y[j]);
                            if (pydot < 0.0) v3_negate_mod(hitNormal);
                            planeHit = true;
                            hitSuffix = "-Inside";

                        } else if ( (apzdot <= ENTITIES[targetIndex].CD_box_halfDepth[j]) &&
                                    (apydot <= ENTITIES[targetIndex].CD_box_halfHeight[j]) ) {

                            if (E3D_DEBUG_SHOW_HIT_TEST) log("inside box X, level 2");
                            
                            var error = ENTITIES[targetIndex].CD_box_halfWidth[j] + sourceSph_r;
                            error = error - apxdot;

                            v3_scale_res(posOffset, ENTITIES[targetIndex].CD_box_x[j], error);
                            v3_add_mod(self.target.position, posOffset);                            
                            self.target.updateMatrix();

                            v3_add_mod(sourceSph_p0, posOffset); 
                            v3_copy(firstHit, sourceSph_p0);
                            v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_x[j]);
                            if (pxdot < 0.0) v3_negate_mod(hitNormal);
                            planeHit = true;
                            hitSuffix = "-Inside";
                        }
                    }

                    // check top face
                    var OffsetDist = ENTITIES[targetIndex].CD_box_halfHeight[j];
                    
                    // check if over face, going down
                    if (!planeHit && (pydot > OffsetDist) && (dydot < 0.0) ) {
                        // offset plane position by height
                        v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_y[j], OffsetDist);

                        // check plane intersect
                        var hitRes = planeIntersect(planePosition, ENTITIES[targetIndex].CD_box_y[j], sourceSph_p0, sourceSph_n);

                        // check if inside
                        if ( (hitRes) && (hitRes <= self.deltaLength / -dydot)) {                              
                            hitRes = hitRes - (sourceSph_r / -dydot);

                            v3_addscaled_res(firstHit, sourceSph_p0, sourceSph_n, hitRes); 
                            v3_sub_res(posOffset, firstHit, planePosition);

                            var edgeRes = insidePlaneOrMargin(posOffset, ENTITIES[targetIndex].CD_box_x[j], ENTITIES[targetIndex].CD_box_halfWidth[j],
                                ENTITIES[targetIndex].CD_box_z[j], ENTITIES[targetIndex].CD_box_halfDepth[j], sourceSph_r);

                            if (edgeRes == "I") { // inside hit
                                planeHit = true;
                                // add to the list of hits.
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2 * sourceSph_r, [1,1,0]);
                                v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_y[j]);
                                closestHit = hitRes;                                       
                            } else if (edgeRes != "F") { // margin hit
                                edgesToTest = true;
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, sourceSph_r, [0,1,1]);
                                // edge A
                                if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_TopRight] = true;         
                                if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_TopLeft] = true;
                                // edge B                                    
                                if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopFront] = true;
                                if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_TopBack] = true;
                            }                  
                        }
                    }

                    // check bottom face, under, going up
                    if ( !planeHit && ENTITIES[targetIndex].CD_box_bottom[j] && (pydot < -OffsetDist) && (dydot > 0.0) ) {
                        // offset plane position by height
                        v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_y[j], -OffsetDist);

                        // check plane intersect
                        var hitRes = planeIntersect(planePosition, ENTITIES[targetIndex].CD_box_y[j], sourceSph_p0, sourceSph_n);

                        // check if inside
                        if ( (hitRes) && (hitRes <= self.deltaLength / dydot)) {
                            hitRes = hitRes - (sourceSph_r / dydot);
                            v3_addscaled_res(firstHit, sourceSph_p0, sourceSph_n, hitRes); 
                            v3_sub_res(posOffset, firstHit, planePosition);

                            var edgeRes = insidePlaneOrMargin(posOffset, ENTITIES[targetIndex].CD_box_x[j], ENTITIES[targetIndex].CD_box_halfWidth[j],
                                ENTITIES[targetIndex].CD_box_z[j], ENTITIES[targetIndex].CD_box_halfDepth[j], sourceSph_r);

                            if (edgeRes == "I") { // inside hit
                                planeHit = true;
                                // add to the list of hits.
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2 * sourceSph_r, [1,1,0]);
                                v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_y[j]);
                                v3_negate_mod(hitNormal);
                                closestHit = hitRes; 
                            } else if (edgeRes != "F") { // margin hit
                                edgesToTest = true;
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, sourceSph_r, [0,1,1]);
                                // edge A
                                if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_BottomRight] = true;         
                                if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_BottomLeft] = true;
                                // edge B                                    
                                if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_BottomFront] = true;
                                if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomBack] = true;
                            }                            

                        }
                    }



                    // check front face
                    OffsetDist = ENTITIES[targetIndex].CD_box_halfDepth[j];
                    
                    // check in front, going backward
                    if ( !planeHit && (pzdot > OffsetDist) && (dzdot < 0.0) ) {
                        // offset plane position by height and radius
                        v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_z[j], OffsetDist);

                        // check plane intersect
                        var hitRes = planeIntersect(planePosition, ENTITIES[targetIndex].CD_box_z[j], sourceSph_p0, sourceSph_n);

                        // check if inside
                        if ( (hitRes) && (hitRes <= self.deltaLength / -dzdot)) {
                            hitRes = hitRes - (sourceSph_r / -dzdot);
                            v3_addscaled_res(firstHit, sourceSph_p0, sourceSph_n, hitRes); 
                            v3_sub_res(posOffset, firstHit, planePosition);

                            var edgeRes = insidePlaneOrMargin(posOffset, ENTITIES[targetIndex].CD_box_x[j], ENTITIES[targetIndex].CD_box_halfWidth[j],
                                ENTITIES[targetIndex].CD_box_y[j], ENTITIES[targetIndex].CD_box_halfHeight[j], sourceSph_r);

                            if (edgeRes == "I") { // inside hit
                                planeHit = true;
                                // add to the list of hits.
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2 * sourceSph_r, [1,1,0]);
                                v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_z[j]);
                                closestHit = hitRes; 
                            } else if (edgeRes != "F") { // margin hit
                                edgesToTest = true;
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, sourceSph_r, [0,1,1]);
                                // edge A
                                if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_FrontRight] = true;         
                                if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_FrontLeft] = true;
                                // edge B                                    
                                if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopFront] = true;
                                if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomFront] = ENTITIES[targetIndex].CD_box_bottom[j];
                            }  

                        }
                    }

                    // check back face, behind, going forward 
                    if ( !planeHit && (pzdot < -OffsetDist) && (dzdot > 0.0) ) {
                        // offset plane position by height and radius
                        v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_z[j], -OffsetDist);

                        // check plane intersect
                        var hitRes = planeIntersect(planePosition, ENTITIES[targetIndex].CD_box_z[j], sourceSph_p0, sourceSph_n);

                        // check if inside
                        if ( (hitRes) && (hitRes <= self.deltaLength / dzdot)) {
                            hitRes = hitRes - (sourceSph_r / dzdot);
                            v3_addscaled_res(firstHit, sourceSph_p0, sourceSph_n, hitRes); 
                            v3_sub_res(posOffset, firstHit, planePosition);

                            var edgeRes = insidePlaneOrMargin(posOffset, ENTITIES[targetIndex].CD_box_x[j], ENTITIES[targetIndex].CD_box_halfWidth[j],
                                ENTITIES[targetIndex].CD_box_y[j], ENTITIES[targetIndex].CD_box_halfHeight[j], sourceSph_r);


                            if (edgeRes == "I") { // inside hit
                                planeHit = true;
                                // add to the list of hits.
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2 * sourceSph_r, [1,1,0]);
                                v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_z[j]);
                                v3_negate_mod(hitNormal);
                                closestHit = hitRes; 
                            } else if (edgeRes != "F") { // margin hit
                                edgesToTest = true;
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, sourceSph_r, [0,1,1]);
                                // edge A
                                if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_BackRight] = true;         
                                if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_BackLeft] = true;
                                // edge B                                    
                                if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopBack] = true;
                                if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomBack] = ENTITIES[targetIndex].CD_box_bottom[j];
                            }  

                        }
                    }




                    // check right face, right, going left
                    OffsetDist = ENTITIES[targetIndex].CD_box_halfWidth[j];
                    
                    // check right, going left
                    if ( !planeHit && (pxdot > OffsetDist) && (dxdot < 0.0) ) {
                        // offset plane position by height and radius
                        v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_x[j], OffsetDist);

                        // check plane intersect
                        var hitRes = planeIntersect(planePosition, ENTITIES[targetIndex].CD_box_x[j], sourceSph_p0, sourceSph_n);

                        // check if inside
                        if ( (hitRes) && (hitRes <= self.deltaLength / -dxdot)) {
                        hitRes = hitRes - (sourceSph_r / -dxdot);
                            v3_addscaled_res(firstHit, sourceSph_p0, sourceSph_n, hitRes); 
                            v3_sub_res(posOffset, firstHit, planePosition);

                            var edgeRes = insidePlaneOrMargin(posOffset, ENTITIES[targetIndex].CD_box_z[j], ENTITIES[targetIndex].CD_box_halfDepth[j],
                            ENTITIES[targetIndex].CD_box_y[j], ENTITIES[targetIndex].CD_box_halfHeight[j], sourceSph_r);


                            if (edgeRes == "I") { // inside hit
                                planeHit = true;
                                // add to the list of hits.
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2 * sourceSph_r, [1,1,0]);
                                v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_x[j]);
                                closestHit = hitRes; 
                            } else if (edgeRes != "F") { // margin hit
                                edgesToTest = true;
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, sourceSph_r, [0,1,1]);
                                // edge A
                                if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_FrontRight] = true;         
                                if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_BackRight] = true;
                                // edge B                                    
                                if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopRight] = true;
                                if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomRight] = ENTITIES[targetIndex].CD_box_bottom[j];
                            }  
    
                        }
                    }

                    
                    // check left face, left, going right
                    if ( !planeHit && (pxdot < -OffsetDist) && (dxdot > 0.0) ) {
                        // offset plane position by height and radius
                        v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_x[j], -OffsetDist);

                        // check plane intersect
                        var hitRes = planeIntersect(planePosition, ENTITIES[targetIndex].CD_box_x[j], sourceSph_p0, sourceSph_n);

                        // check if inside
                        if ( (hitRes) && (hitRes <= self.deltaLength / dxdot)) {
                            hitRes = hitRes - (sourceSph_r / dxdot);
                            v3_addscaled_res(firstHit, sourceSph_p0, sourceSph_n, hitRes); 
                            v3_sub_res(posOffset, firstHit, planePosition);

                            var edgeRes = insidePlaneOrMargin(posOffset, ENTITIES[targetIndex].CD_box_z[j], ENTITIES[targetIndex].CD_box_halfDepth[j],
                            ENTITIES[targetIndex].CD_box_y[j], ENTITIES[targetIndex].CD_box_halfHeight[j], sourceSph_r);


                            if (edgeRes == "I") { // inside hit
                                planeHit = true;
                                // add to the list of hits.
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2 * sourceSph_r, [1,1,0]);
                                v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_x[j]);
                                v3_negate_mod(hitNormal);
                                closestHit = hitRes; 
                            } else if (edgeRes != "F") { // margin hit
                                edgesToTest = true;
                                if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, sourceSph_r, [0,1,1]);
                                // edge A
                                if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_FrontLeft] = true;         
                                if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_BackLeft] = true;
                                // edge B                                    
                                if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopLeft] = true;
                                if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomLeft] = ENTITIES[targetIndex].CD_box_bottom[j];
                            }  

                        }
                    }

                    if (planeHit && edgesToTest) log("both??");
                //      edgesToCheck = [true, true, true, true,  true, true, true, true,  true, true, true, true];
                    if (/*true)*/  edgesToTest && !planeHit ) {
                        // Z
                        if (edgesToCheck[_CD_box_edge_TopRight]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_TopBackRight],
                                    ENTITIES[targetIndex].CD_box_z[j], 
                                    ENTITIES[targetIndex].CD_box_halfDepth[j] * 2); 
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_TopBackRight]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_z[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfDepth[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("ToRi");
                            }
                        }
                        if (edgesToCheck[_CD_box_edge_BottomRight]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackRight],
                                    ENTITIES[targetIndex].CD_box_z[j], 
                                    ENTITIES[targetIndex].CD_box_halfDepth[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackRight]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_z[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfDepth[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("BoRi");
                            }
                        }
                        if (edgesToCheck[_CD_box_edge_TopLeft]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_TopBackLeft],
                                    ENTITIES[targetIndex].CD_box_z[j], 
                                    ENTITIES[targetIndex].CD_box_halfDepth[j] * 2);
            
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_TopBackLeft]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_z[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfDepth[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("ToLe");
                            }
                        }
                        if (edgesToCheck[_CD_box_edge_BottomLeft]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft],
                                    ENTITIES[targetIndex].CD_box_z[j], 
                                    ENTITIES[targetIndex].CD_box_halfDepth[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_z[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfDepth[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("BoLe");
                            }
                        }

                        // Y
                        if (edgesToCheck[_CD_box_edge_BackLeft]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft],
                                    ENTITIES[targetIndex].CD_box_y[j], 
                                    ENTITIES[targetIndex].CD_box_halfHeight[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_y[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfHeight[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("BaLe");
                            }
                        }

                        if (edgesToCheck[_CD_box_edge_BackRight]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackRight],
                                    ENTITIES[targetIndex].CD_box_y[j], 
                                    ENTITIES[targetIndex].CD_box_halfHeight[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackRight]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_y[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfHeight[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("BaRi");
                            }
                        }

                        if (edgesToCheck[_CD_box_edge_FrontLeft]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft],
                                    ENTITIES[targetIndex].CD_box_y[j], 
                                    ENTITIES[targetIndex].CD_box_halfHeight[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_y[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfHeight[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("FrLe");
                            }
                        }

                        if (edgesToCheck[_CD_box_edge_FrontRight]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomFrontRight],
                                    ENTITIES[targetIndex].CD_box_y[j], 
                                    ENTITIES[targetIndex].CD_box_halfHeight[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomFrontRight]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_y[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfHeight[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("FrRi");
                            }
                        }


                        // X
                        if (edgesToCheck[_CD_box_edge_TopBack]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_TopBackLeft],
                                    ENTITIES[targetIndex].CD_box_x[j], 
                                    ENTITIES[targetIndex].CD_box_halfWidth[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_TopBackLeft]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_x[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfWidth[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("ToBa");
                            }
                        }
                        if (edgesToCheck[_CD_box_edge_BottomBack]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft],
                                    ENTITIES[targetIndex].CD_box_x[j], 
                                    ENTITIES[targetIndex].CD_box_halfWidth[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_x[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfWidth[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("BoBa");
                            }
                        }

                        if (edgesToCheck[_CD_box_edge_TopFront]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_TopFrontLeft],
                                    ENTITIES[targetIndex].CD_box_x[j], 
                                    ENTITIES[targetIndex].CD_box_halfWidth[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_TopFrontLeft]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_x[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfWidth[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("ToFr");
                            }
                        }
                        if (edgesToCheck[_CD_box_edge_BottomFront]) {
                            var hitRes = capsuleEdgeIntersect_res(posOffset, sourceSph_r, sourceSph_p0, sourceSph_n, self.deltaLength,
                                ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft],
                                    ENTITIES[targetIndex].CD_box_x[j], 
                                    ENTITIES[targetIndex].CD_box_halfWidth[j] * 2);
                            if ((hitRes != false) && (hitRes < closestHit)) {
                                edgeHit = true;
                                closestHit = hitRes;
                                v3_copy(closestP, ENTITIES[targetIndex].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft]);
                                v3_copy(closestN, ENTITIES[targetIndex].CD_box_x[j]);
                                v3_copy(closestT, posOffset);
                                closestL = ENTITIES[targetIndex].CD_box_halfWidth[j] * 2;
                                if (E3D_DEBUG_SHOW_HIT_TEST) log("BoFr");
                            }
                        }

                        if (edgeHit) { // calc firstHit and hitNormal
                         //   v3_addscaled_res(firstHit, sourceSph_p0, self.delta, closestHit);
                         //   point_segment_point_res(posOffset, closestP, closestN, closestL, firstHit);
                            v3_sub_res(hitNormal, firstHit, closestT);
                            //if (E3D_DEBUG_SHOW_HIT_TEST) log("box edge hit");
                            hitSuffix = "-Edge";
                        }   
                    }

                    if (E3D_DEBUG_SHOW_HIT_TEST && edgesToTest && !edgeHit) log("edge miss", false);

                    if (planeHit || edgeHit) {

                        // check dist, if dist less than current hit declare hit
                        var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);
                        if ( t0 < _tempCDRes_t0 ) {

                            if (E3D_DEBUG_SHOW_HIT_TEST) if (v3_distancesquared(firstHit, sourceSph_p0) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * sourceSph_r, [1,0,0], 8, false, 3);
                            _tempCDRes_marker = ""+marker;
                            _tempCDRes_t0 = t0;
                            v3_copy(_tempCDRes_n, hitNormal);
                            v3_copy(_tempCDRes_p0, firstHit);
                            _tempCDRes_target_desc = "Box" + hitSuffix;
                            _tempCDRes_target_cdi = j;
                            //self.pushCollisionSource(marker, t0 / self.deltaLength, hitNormal, firstHit, "Sph", "Box" + hitSuffix, i, sphIndex, j);
                        }
                    }
                } // pre-cull with sph sph capsule                
            }//different marker
        }// for each boxes






        for (let j = 0; j < ENTITIES[targetIndex].CD_triangle; ++j) {
            var marker = "s"+targetIndex+"t"+j;
            if  (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;

                var hitRes = triangle_capsule_intersect_res(firstHit, sourceSph_p0, sourceSph_n, sourceSph_r,
                    ENTITIES[targetIndex].CD_triangle_p1[j], ENTITIES[targetIndex].CD_triangle_p3p1[j], ENTITIES[targetIndex].CD_triangle_p2p1[j], 
                    ENTITIES[targetIndex].CD_triangle_p3p1lenSq[j], ENTITIES[targetIndex].CD_triangle_p2p1lenSq[j],
                    ENTITIES[targetIndex].CD_triangle_p3p2p1dot[j], ENTITIES[targetIndex].CD_triangle_n[j]);

                if ((hitRes != false) && (hitRes <= self.deltaLength)/* && (hitRes >= -sourceSph_r)*/ ) {      

                    var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);

                    if ( t0 <= _tempCDRes_t0 ) {          
                        if (E3D_DEBUG_SHOW_HIT_TEST) if (v3_distancesquared(firstHit, sourceSph_p0) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * sourceSph_r, [1,1,0.8], 8, false, 3);
                        _tempCDRes_marker = ""+marker;
                        _tempCDRes_t0 = t0;
                        v3_copy(_tempCDRes_n, ENTITIES[targetIndex].CD_triangle_n[j]);
                        v3_copy(_tempCDRes_p0, firstHit);
                        _tempCDRes_target_desc = "Triangle";
                        _tempCDRes_target_cdi = j;
                        //self.pushCollisionSource(marker, t0 / self.deltaLength, ENTITIES[targetIndex].CD_triangle_n[j], firstHit, "Sph", "Triangle" + hitSuffix, i, sphIndex, j);
                    }
                } // if hitres

            } // different marker
        } // foreach triangles




    } // end for each other entity perform hit test

    // if t0 is less than infinity push new CDresult
    if (_tempCDRes_t0 < Infinity) {
        self.pushCollisionSource(_tempCDRes_marker, _tempCDRes_t0 / self.deltaLength, _tempCDRes_n, _tempCDRes_p0, 
            _tempCDRes_source_desc,  _tempCDRes_source_cdi, _tempCDRes_target_ei, _tempCDRes_target_desc, _tempCDRes_target_cdi);
    }

} // end for each sph as source
}






function CheckForAnimationCollisions_PointSource(self, SCENE, animations){
    //  [pointIndex] // t is fraction of self.deltaLength done when firstHit
    
    var firstHit  = v3_new();
    var hitNormal = v3_new();
    
    var posOffset  = v3_new();
    var posDelta_n = v3_new();
    
    var planePosition = v3_new();
    var planeOffset = v3_new();

    var sourcePts_p0 = v3_new();
    var sourcePts_p1 = v3_new();

    var sourcePts_v = v3_new();
    var sourcePts_n = v3_new();
    var sourcePts_l = 0.0;


    
// for each point CD as source
for (var pointIndex = 0; pointIndex < self.target.CD_point; ++pointIndex) {
        
    v3_add_res(sourcePts_p0, self.pLastPos[pointIndex], self.last_position);
    v3_copy(sourcePts_p1, self.target.CD_point_p[pointIndex]);
    v3_sub_res(sourcePts_v, sourcePts_p1, sourcePts_p0);
    var sourcePts_l = v3_length(sourcePts_v);
    v3_invscale_res(sourcePts_n, sourcePts_v, sourcePts_l);

    //if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addLine(sourcePts_p0, sourcePts_p1, true);

    var _tempCDRes_t0  = Infinity;
    var _tempCDRes_n   = v3_new();
    var _tempCDRes_p0  = v3_new();
    var _tempCDRes_source_desc = "Point";
    var _tempCDRes_source_cdi  = pointIndex;

    var _tempCDRes_marker = "";
    var _tempCDRes_target_desc = "";
    var _tempCDRes_target_cdi = 0;
    var _tempCDRes_target_ei = 0;

    for (var targetIndex = 0; targetIndex < ENTITIES.length; ++targetIndex) if (self.candidates[targetIndex]) { // for each candidate entities
        _tempCDRes_target_ei = targetIndex;

        // collision detection - self.point vs targetEntity.sph
        for (let j = 0; j < ENTITIES[targetIndex].CD_sph; ++j) {
            var marker = "p"+targetIndex+"s"+j;
            if (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;

                if (ENTITIES[targetIndex].animIndex != -1) { // dynamic
                    var targetSphOrigin = v3_sub_new(ENTITIES[targetIndex].CD_sph_p[j], ENTITIES[targetIndex].position);
                    v3_sub_mod(targetSphOrigin, animations[ENTITIES[targetIndex].animIndex].last_position);

                    v3_sub_res(posDelta_n, ENTITIES[targetIndex].CD_sph_p[j], targetSphOrigin); 
                    var targetSph_deltaLength = v3_length(posDelta_n);
                    v3_invscale_mod(posDelta_n, targetSph_deltaLength);

                    var hitRes = capsuleEdgeIntersect(ENTITIES[targetIndex].CD_sph_r[j], targetSphOrigin,
                        posDelta_n, targetSph_deltaLength, sourcePts_p0, sourcePts_n, sourcePts_l);

                    if (hitRes != false) {
                        v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);
                        var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes); 
                        if ( t0 < _tempCDRes_t0) {
                            v3_sub_res(hitNormal, firstHit, ENTITIES[targetIndex].CD_sph_p[j]);
                            if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2, _v3_red);
                            _tempCDRes_marker = ""+marker;
                            _tempCDRes_t0 = t0;
                            v3_copy(_tempCDRes_n, hitNormal);
                            v3_copy(_tempCDRes_p0, firstHit);
                            _tempCDRes_target_desc = "Sph";
                            _tempCDRes_target_cdi = j;

                            if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2, _v3_white);
                            if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireSphere(firstHit,ENTITIES[targetIndex].CD_sph_p[j] * 2, _v3_red, 8, false);
                            //self.pushCollisionSource(marker, t0 / self.deltaLength, hitNormal, firstHit, "Point", "Sph", targetIndex, pointIndex, j);
                        } // end <t0
                    }// end hitres

                } else { // static
                    v3_sub_res(posOffset, ENTITIES[targetIndex].CD_sph_p[j], sourcePts_p0);
                    var hitRes = vector_sph_min_t(sourcePts_n, posOffset, ENTITIES[targetIndex].CD_sph_rs[j]);  
                    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= sourcePts_l)) {

                        v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);
                        
                        var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);  
                        if ( t0 < _tempCDRes_t0) {    
                            v3_sub_res(hitNormal, firstHit, ENTITIES[targetIndex].CD_sph_p[j]);
                            _tempCDRes_marker = ""+marker;
                            _tempCDRes_t0 = t0;
                            v3_copy(_tempCDRes_n, hitNormal);
                            v3_copy(_tempCDRes_p0, firstHit);
                            _tempCDRes_target_desc = "Sph";
                            _tempCDRes_target_cdi = j;

                            if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2, _v3_white);
                            //self.pushCollisionSource(marker, t0 / self.deltaLength, hitNormal, firstHit, "Point", "Sph", targetIndex, pointIndex, j);
                        }
                    }
                }
            } 
        } // point - sph



        // collision detection - self.point to plane (static)
        for (let j = 0; j < ENTITIES[targetIndex].CD_plane; ++j) {
            var marker = "p"+targetIndex+"p"+j;
            if  (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;

                v3_copy(hitNormal, ENTITIES[targetIndex].CD_plane_n[j]);
                v3_sub_res(posOffset, sourcePts_p0, ENTITIES[targetIndex].CD_plane_p[j]);// Delta of Origin point and Plane position 

                var hitRes = vectorPlaneIntersect(posOffset, hitNormal, sourcePts_n);
                
                if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= sourcePts_l)) {
                    
                    var d0 = v3_dot(posOffset, hitNormal); 
                    v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);

                    v3_sub_res(posOffset, firstHit, ENTITIES[targetIndex].CD_plane_p[j]);
                    if (insidePlane(posOffset, ENTITIES[targetIndex].CD_plane_h[j], ENTITIES[targetIndex].CD_plane_halfHeight[j],
                        ENTITIES[targetIndex].CD_plane_w[j],  ENTITIES[targetIndex].CD_plane_halfWidth[j]) ) {

                        if (d0 < 0.0) v3_negate_mod(hitNormal); // if d >= 0 on side of normal, else on opposite side of normal

                        var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);
                        if ( t0 < _tempCDRes_t0 ) {
                        //    if (E3D_DEBUG_SHOW_HIT_TEST) if (v3_distancesquared(firstHit, sourceSph_p0) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * sourceSph_r, [1,0,0], 8, false, 3);
                            _tempCDRes_marker = ""+marker;
                            _tempCDRes_t0 = t0;
                            v3_copy(_tempCDRes_n, hitNormal);
                            v3_copy(_tempCDRes_p0, firstHit);
                            _tempCDRes_target_desc = "Plane";
                            _tempCDRes_target_cdi = j;
                        } // <t0 
                    } // inside plane
                } // plane intersect
            } // different marker
        } // point - plane


        // collision detection - self.point to box (static)
        for (let j = 0; j < ENTITIES[targetIndex].CD_box; ++j) {
            var marker = "p"+targetIndex+"b"+j;
            if  (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;

                v3_sub_res(posOffset, sourcePts_p0, ENTITIES[targetIndex].CD_box_p[j]);// Delta of Origin point and Box position 

                // start position
                var pxdot = v3_dot(posOffset, ENTITIES[targetIndex].CD_box_x[j]);
                var pydot = v3_dot(posOffset, ENTITIES[targetIndex].CD_box_y[j]);
                var pzdot = v3_dot(posOffset, ENTITIES[targetIndex].CD_box_z[j]);

                // relative movement
                var dxdot = v3_dot(sourcePts_n, ENTITIES[targetIndex].CD_box_x[j]);
                var dydot = v3_dot(sourcePts_n, ENTITIES[targetIndex].CD_box_y[j]);
                var dzdot = v3_dot(sourcePts_n, ENTITIES[targetIndex].CD_box_z[j]);

                var planeHit = false;
                var hitRes;

                var OffsetDist = ENTITIES[targetIndex].CD_box_halfHeight[j];
                // top
                // check if over face, going down
                if (!planeHit && (pydot >  OffsetDist) && (dydot < 0.0)) {
                    v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_y[j],  OffsetDist);
                    v3_sub_res(posOffset, sourcePts_p0, planePosition);
                    hitRes = vectorPlaneIntersect(posOffset, ENTITIES[targetIndex].CD_box_y[j], sourcePts_n);
                    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= sourcePts_l)) {
                        v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);
                        v3_sub_res(posOffset, firstHit, planePosition);
                        if (insidePlane(posOffset, ENTITIES[targetIndex].CD_box_x[j], ENTITIES[targetIndex].CD_box_halfWidth[j],
                            ENTITIES[targetIndex].CD_box_z[j], ENTITIES[targetIndex].CD_box_halfDepth[j]) ) {

                            v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_y[j]);
                            planeHit = true;
                        }
                    }
                } 
                // bottom
                // check if under face, going up
                if (!planeHit && (pydot < -OffsetDist) && (dydot > 0.0)) {
                    v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_y[j], -OffsetDist);
                    v3_sub_res(posOffset, sourcePts_p0, planePosition);
                    hitRes = vectorPlaneIntersect(posOffset, ENTITIES[targetIndex].CD_box_y[j], sourcePts_n);
                    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= sourcePts_l)) {
                        v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);
                        v3_sub_res(posOffset, firstHit, planePosition);
                        if (insidePlane(posOffset, ENTITIES[targetIndex].CD_box_x[j], ENTITIES[targetIndex].CD_box_halfWidth[j],
                            ENTITIES[targetIndex].CD_box_z[j], ENTITIES[targetIndex].CD_box_halfDepth[j]) ) {

                            v3_negate_res(hitNormal, ENTITIES[targetIndex].CD_box_y[j]);   
                            planeHit = true;
                        }
                    }
                }


                OffsetDist = ENTITIES[targetIndex].CD_box_halfWidth[j];
                // right
                // check if to the right side, going left
                if (!planeHit && (pxdot >  OffsetDist) && (dxdot < 0.0)) {
                    v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_x[j],  OffsetDist);
                    v3_sub_res(posOffset, sourcePts_p0, planePosition);
                    hitRes = vectorPlaneIntersect(posOffset, ENTITIES[targetIndex].CD_box_x[j], sourcePts_n);
                    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= sourcePts_l)) {
                        v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);
                        v3_sub_res(posOffset, firstHit, planePosition);
                        if (insidePlane(posOffset, ENTITIES[targetIndex].CD_box_y[j], ENTITIES[targetIndex].CD_box_halfHeight[j],
                            ENTITIES[targetIndex].CD_box_z[j], ENTITIES[targetIndex].CD_box_halfDepth[j]) ) {

                            v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_x[j]);
                            planeHit = true;
                        }
                    }

                } 
                // left
                // check if on the left side, going right
                if (!planeHit && (pxdot < -OffsetDist) && (dxdot > 0.0)) {
                    v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_x[j], -OffsetDist);
                    v3_sub_res(posOffset, sourcePts_p0, planePosition);
                    hitRes = vectorPlaneIntersect(posOffset, ENTITIES[targetIndex].CD_box_x[j], sourcePts_n);
                    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= sourcePts_l)) {
                        v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);
                        v3_sub_res(posOffset, firstHit, planePosition);
                        if (insidePlane(posOffset, ENTITIES[targetIndex].CD_box_y[j], ENTITIES[targetIndex].CD_box_halfHeight[j],
                            ENTITIES[targetIndex].CD_box_z[j], ENTITIES[targetIndex].CD_box_halfDepth[j]) ) {

                            v3_negate_res(hitNormal, ENTITIES[targetIndex].CD_box_x[j]);
                            planeHit = true;
                        }
                    }
                }


                OffsetDist = ENTITIES[targetIndex].CD_box_halfDepth[j];
                // back
                // check if behind, going forward
                if (!planeHit && (pzdot >  OffsetDist) && (dzdot < 0.0)) {
                    v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_z[j],  OffsetDist);
                    v3_sub_res(posOffset, sourcePts_p0, planePosition);
                    hitRes = vectorPlaneIntersect(posOffset, ENTITIES[targetIndex].CD_box_z[j], sourcePts_n);
                    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= sourcePts_l)) {
                        v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);
                        v3_sub_res(posOffset, firstHit, planePosition);
                        if (insidePlane(posOffset, ENTITIES[targetIndex].CD_box_y[j], ENTITIES[targetIndex].CD_box_halfHeight[j],
                            ENTITIES[targetIndex].CD_box_x[j], ENTITIES[targetIndex].CD_box_halfWidth[j]) ) {

                            v3_copy(hitNormal, ENTITIES[targetIndex].CD_box_z[j]);
                            planeHit = true;
                        }
                    }
                } 
                // front
                // check if in front, going backward
                if (!planeHit && (pzdot < -OffsetDist) && (dzdot > 0.0)) {
                    v3_addscaled_res(planePosition, ENTITIES[targetIndex].CD_box_p[j], ENTITIES[targetIndex].CD_box_z[j], -OffsetDist);
                    v3_sub_res(posOffset, sourcePts_p0, planePosition);
                    hitRes = vectorPlaneIntersect(posOffset, ENTITIES[targetIndex].CD_box_z[j], sourcePts_n);
                    if ((hitRes != false) && (hitRes >= 0.0) && (hitRes <= sourcePts_l)) {
                        v3_addscaled_res(firstHit, sourcePts_p0, sourcePts_n, hitRes);
                        v3_sub_res(posOffset, firstHit, planePosition);
                        if (insidePlane(posOffset, ENTITIES[targetIndex].CD_box_y[j], ENTITIES[targetIndex].CD_box_halfHeight[j],
                            ENTITIES[targetIndex].CD_box_x[j], ENTITIES[targetIndex].CD_box_halfWidth[j]) ) {

                            v3_negate_res(hitNormal, ENTITIES[targetIndex].CD_box_z[j]);
                            planeHit = true;
                        }
                    }
                }


                if (planeHit) {
                    var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);
                    if ( t0 < _tempCDRes_t0 ) {
                        _tempCDRes_marker = ""+marker;
                        _tempCDRes_t0 = t0;
                        v3_copy(_tempCDRes_n, hitNormal);
                        v3_copy(_tempCDRes_p0, firstHit);
                        _tempCDRes_target_desc = "Box";
                        _tempCDRes_target_cdi = j;
                    } // <t0 
                }

            } // different marker
        } // point - plane





        // Point - Triangle
        for (let j = 0; j < ENTITIES[targetIndex].CD_triangle; ++j) {
            var marker = "p"+targetIndex+"t"+j;
            if  (marker != self.lastHitMarker) {
                E3D_DEBUG_CD_NB_TEST++;

                var hitRes = triangle_vector_intersect_res(firstHit, sourcePts_p0, sourcePts_n, 
                    ENTITIES[targetIndex].CD_triangle_p1[j], ENTITIES[targetIndex].CD_triangle_p3p1[j], ENTITIES[targetIndex].CD_triangle_p2p1[j], 
                    ENTITIES[targetIndex].CD_triangle_p3p1lenSq[j], ENTITIES[targetIndex].CD_triangle_p2p1lenSq[j],
                    ENTITIES[targetIndex].CD_triangle_p3p2p1dot[j], ENTITIES[targetIndex].CD_triangle_n[j]);

                if ((hitRes != false) && (hitRes <= sourcePts_l) && (hitRes >= 0.0) ) {      

                    var t0 = v3_distancesquared(firstHit, self.last_position) * Math.sign(hitRes);

                    if ( t0 < _tempCDRes_t0 ) {          
                       // if (E3D_DEBUG_SHOW_HIT_TEST) if (v3_distancesquared(firstHit, sourceSph_p0) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * sourceSph_r, [1,1,0.8], 8, false, 3);
                        _tempCDRes_marker = ""+marker;
                        _tempCDRes_t0 = t0;
                        v3_copy(_tempCDRes_n, ENTITIES[targetIndex].CD_triangle_n[j]);
                        v3_copy(_tempCDRes_p0, firstHit);
                        _tempCDRes_target_desc = "Triangle";
                        _tempCDRes_target_cdi = j;                 
                    }
                } // if hitres
            } // different marker
        } // foreach triangles






    } // end for each other candidate


    // if t0 is less than infinity push new CDresult
    if (_tempCDRes_t0 < Infinity) {
        self.pushCollisionSource(_tempCDRes_marker, _tempCDRes_t0 / self.deltaLength, _tempCDRes_n, _tempCDRes_p0, 
            _tempCDRes_source_desc, _tempCDRes_source_cdi, _tempCDRes_target_ei, _tempCDRes_target_desc, _tempCDRes_target_cdi);
    }


} // end for each point
}









// TODO refactor names to clarify result type
// _tn 0.0-1.0 along n
// _tv 0.0-1.0 along v
// _ln 0.0-len along n
//    pos / _res


// Intersection of vector and sphere, as vector advance into static sphere, arrow like
function VectSphHit(v, so, sr2) { // translated to v origin
    var t0 = 0; 
    var t1 = 0;

    var tca = v3_dot(so, v);

    E3D_DEBUG_DATA_CD.set("v-s tca", tca);

if (isNaN(tca)) throw "VectSphHit tca NaN";
    if  (tca < 0) return false;
    // sph behind origin

    var d2 = v3_lengthsquared(so) - (tca * tca);

    if (d2 > sr2) return false;
    // tangential point farther than radius

    var thc = Math.sqrt(sr2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;
    E3D_DEBUG_DATA_CD.set("v-s t0" , t0);
    E3D_DEBUG_DATA_CD.set("v-s t1" , t1);
if (isNaN(thc)) throw "VectSphHit thc NaN";
    return (t0 < t1) ? t0 : t1;
}

function vector_sph_t(n, sphO_minus_vectO, sphRadSquared) { // translated to v origin
    var t0 = 0; 
    var t1 = 0;
    var tca = v3_dot(sphO_minus_vectO, n);

if (isNaN(tca)) throw "vector_sph_t tca NaN";

  //  if  (tca < 0) return false;

    var d2 = v3_lengthsquared(sphO_minus_vectO) - (tca * tca);
    if (d2 > sphRadSquared) return false;
    var thc = Math.sqrt(sphRadSquared - d2);

if (isNaN(thc)) throw "vector_sph_t thc NaN";

    t0 = tca - thc;
    t1 = tca + thc;
    return [t0, tca, t1];
}

function vector_sph_min_t(n, sphO_minus_vectO, sphRadSquared) { 
    var tca = v3_dot(sphO_minus_vectO, n);    
    if (tca < 0) return false;

    var d2 = v3_lengthsquared(sphO_minus_vectO) - (tca * tca);
    if (d2 > sphRadSquared) return false;

    return tca - Math.sqrt(sphRadSquared - d2);
}

var _planeIntersect_diff = v3_new();
function planeIntersect(planePos, planeNormal, vectPos, vectDirection) {
// https://en.wikipedia.pLastPos/wiki/Line%E2%80%93plane_intersection
    var angleCos = v3_dot(planeNormal, vectDirection);
    E3D_DEBUG_DATA_CD.set("p-v cos", angleCos);
	if (Math.abs(angleCos) < _v3_epsilon) {
      //  log("parallel");
        return false; // parallel, either too far or impossible to get there, edges testing would have catched it
    }
	v3_sub_res(_planeIntersect_diff, planePos, vectPos);
    var t = v3_dot(planeNormal, _planeIntersect_diff) / angleCos;

    E3D_DEBUG_DATA_CD.set("p-v t", t);
  //  if (t < 0.0) return false; // derriere    
    if (t == 0) t = _v3_epsilon;
	return t;
}
function vectorPlaneIntersect(vectPosMinusPlanePos, planeNormal, vectNormal) {
    var angleCos = v3_dot(planeNormal, vectNormal);
    if (Math.abs(angleCos) < _v3_epsilon) return false; // parallel
    var t = v3_dot(planeNormal, vectPosMinusPlanePos) / -angleCos;
    if (t == 0) t = _v3_epsilon;
    return t;
}


function insidePlane(PointPosMinusPlanePos, normalA, halfSizeA, normalB, halfSizeB) {
    if (Math.abs(v3_dot(PointPosMinusPlanePos, normalA)) > halfSizeA) return false;
    if (Math.abs(v3_dot(PointPosMinusPlanePos, normalB)) > halfSizeB) return false;   
    return true;
}


//var _t_v_i_v0 = v3_new();
//var _t_v_i_v1 = v3_new();
var _t_v_i_v2 = v3_new();
function triangle_vector_intersect_res(firsthit, vOrig, vNormal, triP1, triP3P1, triP2P1, triP3len, triP2len, tridP3P2dot, triNorm) {
//https://blackpawn.com/texts/pointinpoly/default.html

    var angleCos = v3_dot(triNorm, vNormal);
    if (Math.abs(angleCos) < _v3_epsilon) return false;
    
	v3_sub_res(_t_v_i_v2, vOrig, triP1);
    var t = v3_dot(triNorm, _t_v_i_v2) / -angleCos;

    if (t < 0.0) return false; // behind

    //v3_sub_res(_t_v_i_v0, triP3, triP1);
    //v3_sub_res(_t_v_i_v1, triP2, triP1);

    v3_addscaled_res(firsthit, vOrig, vNormal, t);
    //if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firsthit, 2, [1, 0, 0]);

    v3_sub_res(_t_v_i_v2, firsthit, triP1);

    var dot00 = triP3len;//v3_lengthsquared(triP3P1);
    var dot01 = tridP3P2dot;//v3_dot(_t_v_i_v0, _t_v_i_v1);
    var dot02 = v3_dot(triP3P1, _t_v_i_v2);
    var dot11 = triP2len;//v3_lengthsquared(triP2P1);
    var dot12 = v3_dot(triP2P1, _t_v_i_v2);

/*   
v0 = C - A
v1 = B - A
v2 = P - A

dot00 = dot(v0, v0)
dot01 = dot(v0, v1)
dot02 = dot(v0, v2)
dot11 = dot(v1, v1)
dot12 = dot(v1, v2)

// Compute barycentric coordinates
invDenom = 1 / (dot00 * dot11 - dot01 * dot01)
u = (dot11 * dot02 - dot01 * dot12) * invDenom
v = (dot00 * dot12 - dot01 * dot02) * invDenom

// Check if point is in triangle
return (u >= 0) && (v >= 0) && (u + v < 1)
*/

    var invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
    if (isNaN(invDenom)) return false;
    var u = (dot11 * dot02 - dot01 * dot12) * invDenom
    var v = (dot00 * dot12 - dot01 * dot02) * invDenom

    if ((u >= 0.0) && (v >= 0.0) && (u + v < 1.0)) {
    //    if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firsthit, 4, [0, 1, 0]);
        if (t == 0) t = _v3_epsilon;
        return t;
    } else return false;
}

var _t_c_i_vOrig_corrected = v3_new();
var _t_c_i_vOrig_P1_delta = v3_new();
function triangle_capsule_intersect_res(firstHit, vOrig, vNormal, vRad, triP1, triP3P1, triP2P1, triP3len, triP2len, tridP3P2dot, triNorm) {
    //https://blackpawn.com/texts/pointinpoly/default.html
    
        var angleCos = v3_dot(triNorm, vNormal);
        if (Math.abs(angleCos) < _v3_epsilon) return false;

        v3_addscaled_res(_t_c_i_vOrig_corrected, vOrig, triNorm, -vRad); //offset for sph end radius
        
        v3_sub_res(_t_c_i_vOrig_P1_delta, _t_c_i_vOrig_corrected, triP1);

        var t = v3_dot(triNorm, _t_c_i_vOrig_P1_delta);

        //E3D_DEBUG_DATA_CD.set("tri-cap t", t);
        //E3D_DEBUG_DATA_CD.set("tri-cap acos", angleCos);

        if (t < -vRad) return false; // behind
        if (angleCos > -_v3_epsilon) return false; // facing away
       
        t = t / -angleCos; // compensate for angle between vectors

        if (t >= 0.0) {
            v3_addscaled_res(firstHit, vOrig, vNormal, t); //position on plane
        } else {
            v3_addscaled_res(firstHit, vOrig, triNorm, t * angleCos); //corret position over plane
        }
        //if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 2, [1, 0, 0]);
        
        v3_sub_res(_t_v_i_v2, firstHit, triP1);
    
        var dot02 = v3_dot(triP3P1, _t_v_i_v2);
        var dot12 = v3_dot(triP2P1, _t_v_i_v2);
    
        var invDenom = 1.0 / (triP3len * triP2len - tridP3P2dot * tridP3P2dot);
        if (isNaN(invDenom)) return false;
        var u = (triP2len * dot02 - tridP3P2dot * dot12) * invDenom
        var v = (triP3len * dot12 - tridP3P2dot * dot02) * invDenom
    
        if ((u >= 0.0) && (v >= 0.0) && (u + v < 1.0)) {
            if (E3D_DEBUG_SHOW_HIT_TEST) phyTracers.addWireCross(firstHit, 4, [0, 1, 0]);
            if (t == 0) t = _v3_epsilon;
            return t;
        } else return false;
    }
    




// "F" no hit
// "I" inside
// "PA" inside margin A, positive side
// "NA" inside margin A, negative side
// "BP" inside margin B, positive side
// "BN" inside margin B, negative side
// "PP" inside margin corner, positive A and positive B
// "PN" inside margin corner, positive A and negative B
// "NP" inside margin corner, negative A and positive B
// "NN" inside margin corner, negative A and negative B
function insidePlaneOrMargin(SphPosMinusPlanePos, normalA, halfSizeA, normalB, halfSizeB, margin) {

    var da = v3_dot(SphPosMinusPlanePos, normalA);
    var db = v3_dot(SphPosMinusPlanePos, normalB);
    var ada = Math.abs(da);
    var adb = Math.abs(db);    

    if ((ada > halfSizeA + margin) || (adb > halfSizeB + margin)) return "F";
    if ((ada <= halfSizeA) && (adb <= halfSizeB)) return "I";

    // inside the margin
    if (ada <= halfSizeA) { // inside A
        if (db > 0.0) { // positive B
            return "BP";
        } else { // negative B
            return "BN";
        }
    } else if (adb <= halfSizeB) { // inside B but not A
        if (da > 0.0) { // positive A
            return "PA";
        } else { // negative A
            return "NA";
        }
    } else { // not inside A nor B (corner)
        if (da > 0.0) { // positive A
            if (db > 0.0) { // positive B
                return "PP";
            } else { // negative B
                return "PN";
            }
        } else { // negative A
            if (db > 0.0) { // positive B
                return "NP";
            } else { // negative B
                return "NN";
            }
        }
    }
}






var _capsuleSphereIntersect_offset = v3_new();

function capsuleSphereIntersect(capRadius, capOrigin, capNormal, capLength, sphPosition, sphRadius) {
    var sumR = capRadius + sphRadius;
    v3_sub_res(_capsuleSphereIntersect_offset, sphPosition, capOrigin);
    var hitRes = VectSphHit(capNormal, _capsuleSphereIntersect_offset, sumR * sumR); 
    if (isFinite(hitRes) && (hitRes != false) && (hitRes <= capLength)) return hitRes;
    return false;
}



//TODO capsuleCapsuleIntersect(capAradius, capAorigin, capAnormal, capAlength, capBradius, capBorigin, capBnormal, capBlength) {}




var _capsuleEdgeIntersect_edgeVector = v3_new();
var _capsuleEdgeIntersect_capsuleVector = v3_new();
var _capsuleEdgeIntersect_p1 = v3_new();
var _capsuleEdgeIntersect_p2 = v3_new();
var _capsuleEdgeIntersect_originDelta = v3_new();
var _capsuleEdgeIntersect_capsuleEnd = v3_new();

function capsuleEdgeIntersect(capRadius, capOrigin, capNormal, capLength, edgeOrigin, edgeNormal, edgeLength) {
    //E3D_DEBUG_DATA_CD.set("edge step", 0);

    var distsq;    
    var capRadiusSq = capRadius * capRadius;
    var vcos = v3_dot(capNormal, edgeNormal); // adjust for "slope"
    var vsin = Math.sqrt(1.0 - (vcos * vcos));

    //E3D_DEBUG_DATA_CD.set("edge vcos", vcos);
    //E3D_DEBUG_DATA_CD.set("edge vsin", vsin);
    
    var capRadiusMargin = capRadius / vsin;
    
    v3_scale_res(_capsuleEdgeIntersect_edgeVector, edgeNormal, edgeLength);
    v3_scale_res(_capsuleEdgeIntersect_capsuleVector, capNormal, capLength);

    // closest points between paths, v1t is t along delta, v2t is t along edge (0.0 - 1.0), -1 is behind
    var [v1t, v2t] = vector_vector_t(capOrigin, _capsuleEdgeIntersect_capsuleVector, edgeOrigin, _capsuleEdgeIntersect_edgeVector); // TODO replace by normal

    //E3D_DEBUG_DATA_CD.set("edge v1t", v1t);
    //E3D_DEBUG_DATA_CD.set("edge v2t", v2t);

    // check if closest points are within both vectors
    var potentialHit = ( (v1t >= 0.0) && (v1t <= ((capLength + capRadiusMargin) / capLength)) && (v2t >= (-capRadiusMargin / edgeLength)) && (v2t <= (capRadiusMargin + edgeLength) / edgeLength) );

    if (!potentialHit) return false;

    //E3D_DEBUG_DATA_CD.set("edge step", 1);

    v3_addscaled_res(_capsuleEdgeIntersect_p1, capOrigin, _capsuleEdgeIntersect_capsuleVector, v1t);
    v3_addscaled_res(_capsuleEdgeIntersect_p2, edgeOrigin, _capsuleEdgeIntersect_edgeVector, v2t);

    distsq = v3_distancesquared(_capsuleEdgeIntersect_p1, _capsuleEdgeIntersect_p2);
    potentialHit = distsq <= capRadiusSq;

    //E3D_DEBUG_DATA_CD.set("edge closest dist",  Math.sqrt(distsq));
    
    if (!potentialHit) return false;
    
    //E3D_DEBUG_DATA_CD.set("edge step", 2);
    
    var penetration = Math.sqrt(capRadiusSq - distsq);
    penetration = penetration / vsin;// as path length
    v1t = v1t - (penetration / capLength); // as path t

    //E3D_DEBUG_DATA_CD.set("edge v1t'", v1t);
    
    // update firstHit after slope offset
    v3_addscaled_res(_capsuleEdgeIntersect_p1, capOrigin, _capsuleEdgeIntersect_capsuleVector, v1t);

    
    v3_sub_res(_capsuleEdgeIntersect_originDelta, _capsuleEdgeIntersect_p1, edgeOrigin);
    
    v2t = v3_dot(_capsuleEdgeIntersect_originDelta, edgeNormal) / edgeLength;
    //E3D_DEBUG_DATA_CD.set("edge v2t'", v2t);
    
    // inside edge
    if ( (v1t >= 0.0) && (v1t <= 1.0) && (v2t >= 0.0) && (v2t <= 1.0) ) {
        if (v1t == 0.0) v1t =_v3_epsilon;
        //if (E3D_DEBUG_SHOW_HIT_TEST) log("along edge");
        return v1t;
    }
    
    //E3D_DEBUG_DATA_CD.set("edge step", 3);
    
    if (v2t <= 0.5) { // test as sphere cap at edge origin
        v3_sub_res(_capsuleEdgeIntersect_originDelta, edgeOrigin, capOrigin);
        var endCap = vector_sph_min_t(capNormal, _capsuleEdgeIntersect_originDelta, capRadiusSq);

        if (endCap == false) return false;
        //E3D_DEBUG_DATA_CD.set("edge step", 3.1);
        v1t = endCap / capLength;;
        if (v1t > 1.0) return false;
        if (v1t == 0.0) v1t =_v3_epsilon;
        //if (E3D_DEBUG_SHOW_HIT_TEST) log("edge orig cap");
        return v1t;

    } else if (v2t >= 0.5) { // test as sphere cap at end of edge        
        v3_sub_res(_capsuleEdgeIntersect_originDelta, edgeOrigin, capOrigin);
        v3_add_mod(_capsuleEdgeIntersect_originDelta, _capsuleEdgeIntersect_edgeVector);
        var endCap = vector_sph_min_t(capNormal, _capsuleEdgeIntersect_originDelta, capRadiusSq);

        if (endCap == false) return false;
        //E3D_DEBUG_DATA_CD.set("edge step", 3.2);

        v1t = endCap / capLength;
        if (v1t > 1.0) return false;
        if (v1t == 0.0) v1t =_v3_epsilon;
       // if (E3D_DEBUG_SHOW_HIT_TEST) log("edge end cap");
        return v1t;
    }

    //E3D_DEBUG_DATA_CD.set("edge step", 4);

    return false;
}


function capsuleEdgeIntersect_res(firstHit, capRadius, capOrigin, capNormal, capLength, edgeOrigin, edgeNormal, edgeLength) {
    //E3D_DEBUG_DATA_CD.set("edge step", 0);

    var distsq;    
    var capRadiusSq = capRadius * capRadius;
    var vcos = v3_dot(capNormal, edgeNormal); // adjust for "slope"
    var vsin = Math.sqrt(1.0 - (vcos * vcos));
    
    var capRadiusMargin = capRadius / vsin;
    
    v3_scale_res(_capsuleEdgeIntersect_edgeVector, edgeNormal, edgeLength);
    v3_scale_res(_capsuleEdgeIntersect_capsuleVector, capNormal, capLength);

    // closest points between paths, v1t is t along delta, v2t is t along edge (0.0 - 1.0), -1 is behind
    var [v1t, v2t] = vector_vector_t(capOrigin, _capsuleEdgeIntersect_capsuleVector, edgeOrigin, _capsuleEdgeIntersect_edgeVector);

    // check if closest points are within both vectors
    var potentialHit = ( (v1t >= 0.0) && (v1t <= ((capLength + capRadiusMargin) / capLength)) && (v2t >= (-capRadiusMargin / edgeLength)) && (v2t <= (capRadiusMargin + edgeLength) / edgeLength) );

    if (!potentialHit) return false;

    v3_addscaled_res(_capsuleEdgeIntersect_p1, capOrigin, _capsuleEdgeIntersect_capsuleVector, v1t);
    v3_addscaled_res(_capsuleEdgeIntersect_p2, edgeOrigin, _capsuleEdgeIntersect_edgeVector, v2t);

    distsq = v3_distancesquared(_capsuleEdgeIntersect_p1, _capsuleEdgeIntersect_p2);
    potentialHit = distsq <= capRadiusSq;

    if (!potentialHit) return false;

    var penetration = Math.sqrt(capRadiusSq - distsq);
    penetration = penetration / vsin;// as path length
    v1t = v1t - (penetration / capLength); // as path t
   
    // update firstHit after slope offset
    v3_addscaled_res(_capsuleEdgeIntersect_p1, capOrigin, _capsuleEdgeIntersect_capsuleVector, v1t);
    v3_sub_res(_capsuleEdgeIntersect_originDelta, _capsuleEdgeIntersect_p1, edgeOrigin);    
    v2t = v3_dot(_capsuleEdgeIntersect_originDelta, edgeNormal) / edgeLength;
    
    // inside edge
    if ( (v1t >= 0.0) && (v1t <= 1.0) && (v2t >= 0.0) && (v2t <= 1.0) ) {
        if (v1t == 0.0) v1t =_v3_epsilon;
        v3_addscaled_res(firstHit, edgeOrigin, _capsuleEdgeIntersect_edgeVector, v2t);
        return v1t;
    }

    if (v2t <= 0.5) { // test as sphere cap at edge origin
        v3_sub_res(_capsuleEdgeIntersect_originDelta, edgeOrigin, capOrigin);
        var endCap = vector_sph_min_t(capNormal, _capsuleEdgeIntersect_originDelta, capRadiusSq);
        if (endCap == false) return false;
        v1t = endCap / capLength;;
        if (v1t > 1.0) return false;
        if (v1t == 0.0) v1t =_v3_epsilon;
        v3_copy(firstHit, edgeOrigin);
        return v1t;

    } else if (v2t >= 0.5) { // test as sphere cap at end of edge        
        v3_sub_res(_capsuleEdgeIntersect_originDelta, edgeOrigin, capOrigin);
        v3_add_mod(_capsuleEdgeIntersect_originDelta, _capsuleEdgeIntersect_edgeVector);
        var endCap = vector_sph_min_t(capNormal, _capsuleEdgeIntersect_originDelta, capRadiusSq);
        if (endCap == false) return false;
        v1t = endCap / capLength;
        if (v1t > 1.0) return false;
        if (v1t == 0.0) v1t =_v3_epsilon;
        v3_add_res(firstHit, edgeOrigin, _capsuleEdgeIntersect_edgeVector);
        return v1t;
    }
    return false;
}




// dir normalize vector
// rpos relative position of ray vs cylinder axis (ray.pos - cyl.pos)
// rad2 squared radius of cylinder
// height height of cylinder
// returns [ t , normal ]
function cylinderIntersect(dir, rpos, rad2, height) {
    var t = -1, t1 = -1, t2 = -1;
 
	var a = (dir[0] * dir[0]) + (dir[2] * dir[2]);
    if (a == 0.0) return false; // parallel

    var b = 2.0 * ((dir[0] * rpos[0]) + (dir[2] * rpos[2]));
	var c = (rpos[0] * rpos[0]) + (rpos[2] * rpos[2]) - (rad2);

    var sfact = Math.sqrt((b * b) - (4.0 * a * c));
    if (isNaN(sfact)) return false;
	var t1 = (-b + sfact) / (2.0 * a);
    var t2 = (-b - sfact) / (2.0 * a);
    
    if ((rpos[1] + (dir[1] * t1)) > height) t1 = Infinity;
	if ((rpos[1] + (dir[1] * t1)) < 0.0) t1 = Infinity;
	if ((rpos[1] + (dir[1] * t2)) > height) t2 = Infinity;
    if ((rpos[1] + (dir[1] * t2)) < 0.0) t2 = Infinity;
    
	if (t1 < 0.0) t1 = Infinity;
    if (t2 < 0.0) t2 = Infinity;
    
    if ((t1 == Infinity) && (t2 == Infinity)) return false;

	t = Math.min(t1, t2);

	var h = v3_addscaled_new(rpos, dir, t * (1 - _v3_epsilon));
	h[1] = 0.0;

    if (v3_lengthsquared(h) < rad2) v3_negate_mod(h);

	return [t, h];
}



var _point_vector_t_offset = [0, 0, 0];
function point_vector_t(orig, norm, point) {
    // http://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
    v3_sub_res(_point_vector_t_offset, orig, point);
    return -v3_dot(_point_vector_t_offset, norm);
}

function point_vector_point(orig, norm, point) {
    return v3_addscaled_new(orig, norm, point_vector_t(orig, norm, point));
}

function point_vector_distance(orig, norm, point) {
    return v3_distance(point, point_vector_point(orig, norm, point));
}
function point_segment_point(orig, norm, len, point) {
    var t = point_vector_t(orig, norm, point);
    if (t < 0.0) t = 0.0;
    if (t > len) t = len;

    return v3_addscaled_new(orig, norm, t);
}
function point_segment_point_res(res, orig, norm, len, point) {
    var t = point_vector_t(orig, norm, point);
    if (t < 0.0) t = 0.0;
    if (t > len) t = len;
    v3_addscaled_res(res, orig, norm, t);
}
function point_segment_distance(orig, norm, len, point) {
    return v3_distance(point, point_segment_point(orig, norm, len, point));
}


var _path_path_closest_t_Vdelta = [0, 0, 0];
var _path_path_closest_t_Odelta = [0, 0, 0];
function path_path_closest_t(orig1, v1, orig2, v2) {
    // http://geomalgorithms.com/a07-_distance.html
    v3_sub_res(_path_path_closest_t_Vdelta, v1, v2);
    var dvlen = v3_lengthsquared(_path_path_closest_t_Vdelta);
    if (dvlen < _v3_epsilon) return -1.0;
    v3_sub_res(_path_path_closest_t_Odelta, orig1, orig2);
    return -v3_dot(_path_path_closest_t_Odelta, _path_path_closest_t_Vdelta) / dvlen;
}

var _path_path_closest_distance_p1 = [0, 0, 0];
var _path_path_closest_distance_p2 = [0, 0, 0];
function path_path_closest_distance(orig1, v1, orig2, v2) {
    var t = path_path_closest_t(orig1, v1, orig2, v2);
    v3_addscaled_res(_path_path_closest_distance_p1, orig1, v1, t);
    v3_addscaled_res(_path_path_closest_distance_p2, orig2, v2, t);
    return v3_distance(_path_path_closest_distance_p1, _path_path_closest_distance_p2);
}

var _vector_vector_distance_Odelta = [0, 0, 0]; // w
var _vector_vector_distance_dP = [0, 0, 0]; // dP
var _vector_vector_distance_tcv = [0, 0, 0]; // tc * v

function vector_vector_t(orig1, v1, orig2, v2) {
    // http://geomalgorithms.com/a07-_distance.html
    v3_sub_res(_vector_vector_distance_Odelta, orig1, orig2);
    var a = v3_lengthsquared(v1);
    var b = v3_dot(v1, v2);
    var c = v3_lengthsquared(v2);
    var d = v3_dot(v1, _vector_vector_distance_Odelta);
    var e = v3_dot(v2, _vector_vector_distance_Odelta);

    var D = a * c - b * b;
    var sc = 0.0;
    var tc = 0.0;

    if (D < _v3_epsilon) {
        sc = -1.0;
        tc = (b > c) ? d / b : e / c;      
    } else {
        sc = (b * e - c * d) / D;
        tc = (a * e - b * d) / D;
    }
    E3D_DEBUG_DATA_CD.set("v-v_t sc", sc);
    E3D_DEBUG_DATA_CD.set("v-v_t tc", tc);
    return [sc, tc];
   // v3_addscaled_res(_vector_vector_distance_dP, _vector_vector_distance_Odelta, v1, sc);
   // v3_scale_res(_vector_vector_distance_tcv, v2, tc);
   // v3_sub_mod(_vector_vector_distance_dP, _vector_vector_distance_tcv);

   // return v3_length(_vector_vector_distance_dP);
}
function vector_vector_distance(orig1, v1, orig2, v2) {
    // http://geomalgorithms.com/a07-_distance.html
    v3_sub_res(_vector_vector_distance_Odelta, orig1, orig2);
    var a = v3_lengthsquared(v1);
    var b = v3_dot(v1, v2);
    var c = v3_lengthsquared(v2);
    var d = v3_dot(v1, _vector_vector_distance_Odelta);
    var e = v3_dot(v2, _vector_vector_distance_Odelta);

    var D = a*c - b*b;
    var sc = 0.0;
    var tc = 0.0;

    if (D < _v3_epsilon) {
        sc = 0.0;
        tc = (b > c) ? d / b : e / c;      
    } else {
        sc = (b*e - c*d) / D;
        tc = (a*e - b*d) / D;
    }

    v3_addscaled_res(_vector_vector_distance_dP, _vector_vector_distance_Odelta, v1, sc);
    v3_scale_res(_vector_vector_distance_tcv, v2, tc);
    v3_sub_mod(_vector_vector_distance_dP, _vector_vector_distance_tcv);

    return v3_length(_vector_vector_distance_dP);
}




var _capsulePlaneIntersect_n = v3_new(); 
var _capsulePlaneIntersect_pDelta = v3_new(); 

function capsulePlaneIntersect(capRadius, capOrigin, capNormal, capLength, planeNormal, planeOrigin, planeWNorm, planeHWidth, planeHNorm, planeHHeight) {

    v3_copy(_capsulePlaneIntersect_n, planeNormal); 
    v3_sub_res(_capsulePlaneIntersect_pDelta, capOrigin, planeOrigin);// Delta of Origin point and Plane position 

    var p0 = v3_dot(capNormal, _capsulePlaneIntersect_n);
    var d0 = v3_dot(_capsulePlaneIntersect_pDelta, _capsulePlaneIntersect_n); 
    if (d0 < 0.0) v3_negate_mod(_capsulePlaneIntersect_n); // if d >= 0 on side of normal, else on opposite side of normal

    var validHit = false;
    var parallelHit = false;

    var p = v3_dot(capNormal, _capsulePlaneIntersect_n);

    if (Math.abs(p) < _v3_epsilon) return false;  // parallel
        
     // if not parallel check if already inside
    var hitDist = Math.abs(d0);
    if (hitDist < capRadius) { // closer that radius

        // check if inside plane rectangle
        validHit = insidePlane(_capsulePlaneIntersect_pDelta, planeWNorm, planeHWidth, planeHNorm, planeHHeight);

        if (validHit) {
            // offset to get the entity out of the plane
            var penetration = (capRadius - hitDist);
            penetration = penetration / p0;
            return (Math.sign(d0) * penetration) / capLength;
        }                    
    }

    var hitRes = false;
    validHit = false;
    if (!parallelHit) hitRes = vectorPlaneIntersect(_capsulePlaneIntersect_pDelta, _capsulePlaneIntersect_n, capNormal);

    if ((hitRes) && (hitRes >= -capRadius)) { // some hit in front of vector

        // offset for sph radius
        // new hit = firstHit - sourceSph_n * radius / sin angle
        var offset = capRadius / Math.abs(p);
        hitRes = hitRes - offset;
        if ( (hitRes >= -capRadius) && (hitRes <= capLength) ) { // if hit is still forward and before end of delta 

            v3_addscaled_res(_capsulePlaneIntersect_pDelta, capOrigin, capNormal, hitRes); 
            // check if inside
            v3_sub_mod(_capsulePlaneIntersect_pDelta, planeOrigin);
            validHit = insidePlane(_capsulePlaneIntersect_pDelta, planeWNorm, planeHWidth, planeHNorm, planeHHeight);
            if (validHit) return hitRes / capLength;
        }
    }
    return false;
}




function capsulePlaneIntersect_res(firstHit, capRadius, capOrigin, capNormal, planeNormal, planeOrigin, planeWNorm, planeHWidth, planeHNorm, planeHHeight) {
    var posOffset = [0,0,0];
    v3_copy(_capsulePlaneIntersect_n, planeNormal); 
    v3_sub_res(_capsulePlaneIntersect_pDelta, capOrigin, planeOrigin);// Delta of Origin point and Plane position 

    var p0 = v3_dot(capNormal, _capsulePlaneIntersect_n);
    var d0 = v3_dot(_capsulePlaneIntersect_pDelta, _capsulePlaneIntersect_n); 
    if (d0 < 0.0) v3_negate_mod(_capsulePlaneIntersect_n); // if d >= 0 on side of normal, else on opposite side of normal

    var validHit = false;
    var parallelHit = false;

    var p = v3_dot(capNormal, _capsulePlaneIntersect_n);

    if (Math.abs(p) < _v3_epsilon) return false;  // parallel
        
     // if not parallel check if already inside
    var hitDist = Math.abs(d0);
    if (hitDist < capRadius) { // closer that radius

        // check if inside plane rectangle
        validHit = insidePlane(_capsulePlaneIntersect_pDelta, planeWNorm, planeHWidth, planeHNorm, planeHHeight);

        if (validHit) {
            // offset to get the entity out of the plane
            var penetration = (capRadius - hitDist);
            v3_addscaled_res(firstHit, capOrigin, _capsulePlaneIntersect_n, penetration); 
            return (Math.sign(d0) * penetration / p0);
        }                    
    }

    var hitRes = false;
    validHit = false;
    if (!parallelHit) hitRes = vectorPlaneIntersect(_capsulePlaneIntersect_pDelta, _capsulePlaneIntersect_n, capNormal);

    if ((hitRes) && (hitRes >= -capRadius)) { // some hit in front of vector

        // offset for sph radius
        // new hit = firstHit - sourceSph_n * radius / sin angle
        var offset = capRadius / Math.abs(p);
        hitRes = hitRes - offset;
        if (hitRes >= -capRadius) { // if hit is still forward and before end of delta 
            v3_addscaled_res(firstHit, capOrigin, capNormal, hitRes); 
            // check if inside
            v3_sub_res(posOffset, firstHit, planeOrigin);
            validHit = insidePlane(posOffset, planeWNorm, planeHWidth, planeHNorm, planeHHeight);
            if (validHit) return hitRes;
        }
    }
    return false;
}