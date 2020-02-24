var firstHit = [0.0, 0.0, 0.0];
var hitNormal = [0.0, 0.0, 0.0];
var vectOrig = [0.0, 0.0, 0.0];
var pathVect = [0.0, 0.0, 0.0];
var sphOffset = [0.0, 0.0, 0.0];
var vectOffset = [0.0, 0.0, 0.0];
var planePosition = [0.0, 0.0, 0.0];

var DEV_cube_6P_target;
var DEV_cube_BX_target;
var DEV_cube_DS_target;
var DEV_inbox = false;

var DEV_cubeStartTime;
function CheckForAnimationCollisions(self, scn, animations){
/*
prelim stats without edges
CUBE_6P_nt            295.0000
CUBE_6P_nh             96.0000
CUBE_6P_tt             23.0100
CUBE_6P_att             0.0780
CUBE_6P_ath             0.2395
CUBE_BX_nt            280.0000
CUBE_BX_nh             93.0000
CUBE_BX_tt              1.5150
CUBE_BX_att             0.0054
CUBE_BX_ath             0.0163
*/
/* before refactored function
UBE_6P_nt            1146.0000
CUBE_6P_nh            126.0000
CUBE_6P_tt             50.0650
CUBE_6P_att             0.0437
CUBE_6P_ath             0.3969
*/
/* with 3 types but box still buggy
CUBE_6P_nt            976.0000
CUBE_6P_nh            104.0000
CUBE_6P_tt             59.0650
CUBE_6P_ht              8.4900
CUBE_6P_att             0.0605
CUBE_6P_ath             0.0816
CUBE_BX_nt           1682.0000
CUBE_BX_nh            162.0000
CUBE_BX_tt             28.6500
CUBE_BX_ht              3.1650
CUBE_BX_att             0.0170
CUBE_BX_ath             0.0195
CUBE_DS_nt            960.0000
CUBE_DS_nh            114.0000
CUBE_DS_tt             33.9050
CUBE_DS_ht              6.6450
CUBE_DS_att             0.0202
CUBE_DS_ath             0.0426
*/
/* 3 types fixed
CUBE_6P_nt           6864.0000
CUBE_6P_nh           1041.0000
CUBE_6P_tt            123.7250
CUBE_6P_ht             26.9800
CUBE_6P_att             0.0180
CUBE_6P_ath             0.0259
CUBE_BX_nt           7805.0000
CUBE_BX_nh           1043.0000
CUBE_BX_tt             52.3700
CUBE_BX_ht             14.3550
CUBE_BX_att             0.0067
CUBE_BX_ath             0.0138
CUBE_DS_nt           6829.0000
CUBE_DS_nh           1042.0000
CUBE_DS_tt             79.7650
CUBE_DS_ht             17.1350
CUBE_DS_att             0.0102
CUBE_DS_ath             0.0164
*/

    //  [animIndex, entityIndex, t, normal, firstHitPosition] // t is fraction of self.deltaLength done when firstHit        

    // for each candidate entity                      
    for (let i = 0; i < self.candidates.length; ++i) if (self.candidates[i] == true) {

        v3_sub_res(vectOrig, self.target.CD_sph_p[0], self.delta);
        v3_invscale_res(pathVect, self.delta, self.deltaLength); // TODO preserve actual last positions, or effective delta
        
        // collision detection - self.sph to other sph (static sph target) // TODO use path to path interpolation for both

        //stats
        DEV_cubeStartTime = performance.now();

        if (i == DEV_cube_6P_target) {
            hitPoints.set("CUBE_6P_nt", hitPoints.get("CUBE_6P_nt") + 1);
        }
        if (i == DEV_cube_BX_target) {
            hitPoints.set("CUBE_BX_nt", hitPoints.get("CUBE_BX_nt") + 1);
        }
        if (i == DEV_cube_DS_target) {
            hitPoints.set("CUBE_DS_nt", hitPoints.get("CUBE_DS_nt") + 1);
        }

        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_sph > 0)) {           


            for (let j = 0; j < scn.entities[i].CD_sph; ++j) {
                var marker = i+"s"+j;
                if (marker != self.lastHitMarker) {
                    nHitTest++;

                    var hitRes = capsuleSphereIntersect(self.target.CD_sph_r[0], 
                                                         vectOrig, 
                                                          pathVect,
                                                           self.deltaLength,
                                                            scn.entities[i].CD_sph_p[j], 
                                                             scn.entities[i].CD_sph_r[j]);

                    if (hitRes != false) {
                        if (hitRes < 0.0) hitRes = 0.0;

                        v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes);
                        var t0 = v3_distancesquared(firstHit, self.last_position);

                        if ((!self.collisionDetected) || ((self.collisionDetected) && (t0 < self.closestCollision[1]))) {

                            v3_sub_res(hitNormal, firstHit, scn.entities[i].CD_sph_p[j]);
                            self.collisionDetected = true;
                            self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-Sph"];

                            if ((self.target.animIndex != -1) && (scn.entities[i].animIndex != -1)) {
                                animations[scn.entities[i].animIndex].collisionFromOther = true;
                                animations[scn.entities[i].animIndex].otherCollision = [self.target.animIndex + "s" + "0", t0, v3_clone(hitNormal), v3_clone(self.spd), "Sph-Sph"];
                            }
                        }
                    }


                } 
            }
        } // sph - sph



        // collision detection - self.sph to edge (static edge)
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_edge > 0)) {  

            for (let j = 0; j < scn.entities[i].CD_edge; ++j) {
                var marker = i+"e"+j;
                if  (marker != self.lastHitMarker) {
                    nHitTest++;


                    var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                        scn.entities[i].CD_edge_p[j], scn.entities[i].CD_edge_n[j], scn.entities[i].CD_edge_l[j]);

                    if (hitRes != false) {                       

                            v3_addscaled_res(firstHit, vectOrig, self.delta, hitRes);
                            var t0 = v3_distancesquared(firstHit, self.last_position);
                            if ( !self.collisionDetected || ( self.collisionDetected && (t0 < self.closestCollision[1]) ) ) {
                                
                                point_segment_point_res(sphOffset, scn.entities[i].CD_edge_p[j], scn.entities[i].CD_edge_n[j], scn.entities[i].CD_edge_l[j], firstHit);
                                v3_sub_res(hitNormal, firstHit, sphOffset);

                                if (show_DEV_CD) {              
                                 // phyTracers.addWireCross(self.target.CD_sph_p[0], 1, [1, 0, 0]);
                                    phyTracers.addLine(firstHit, sphOffset, false, [0,0,1]);            
                                    phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0.5,0.5], 8, false, 3);
                                 // phyTracers.addWireSphere(ptsonsegment, 3, [1,0,1], 8, false, 3);
                                }               
                                self.collisionDetected = true;
                                self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-edge"];
                            }

                    }
                }//marker different
            }// for edges
        } // sph - edge




        // collision detection - self.sph to plane (static)
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_plane > 0)) {  

            for (let j = 0; j < scn.entities[i].CD_plane; ++j) {
                var marker = i+"p"+j;
                if  (marker != self.lastHitMarker) {
                    nHitTest++;

                    v3_copy(hitNormal, scn.entities[i].CD_plane_n[j]); 

                    v3_sub_res(vectOffset, vectOrig, scn.entities[i].CD_plane_p[j]);// Delta of Origin point and Plane position 

                    var d0 = v3_dot(vectOffset, hitNormal); 
                    if (d0 < 0.0) v3_negate_mod(hitNormal); // if d >= 0 on side of normal, else on opposite side of normal

                    var validHit = false;
                    var parallelHit = false;

                    var p = v3_dot(pathVect, hitNormal);

                    if (Math.abs(p) < _v3_epsilon) { // parallel
                        var hitDist = Math.abs(d0);
                        if (hitDist < self.target.CD_sph_r[0]) { // parallel and closer that radius

                            // check if inside plane rectangle
                            validHit = insidePlane(vectOffset, scn.entities[i].CD_plane_w[j],  scn.entities[i].CD_plane_halfWidth[j],
                                scn.entities[i].CD_plane_h[j], scn.entities[i].CD_plane_halfHeight[j]);

                            if (validHit) {
                                // offset to get the entity out of the plane
                                v3_scale_res(sphOffset, hitNormal, (self.target.CD_sph_r[0] - hitDist) * 1.01);
                                v3_add_mod(self.target.position, sphOffset);
                                self.target.resetMatrix();
                                v3_add_mod(vectOrig, sphOffset);  // offset already calculated point
                                if (show_DEV_CD) log("par hit");                
                                parallelHit = true; // prevent further hit testing with this plane
                            }                       
                        }

                    } else { // if not parallel check if already inside

                        var hitDist =  Math.abs(d0);
                        if (hitDist < self.target.CD_sph_r[0]) { //  closer that radius

                            // check if inside plane rectangle
                            validHit = insidePlane(vectOffset, scn.entities[i].CD_plane_w[j],  scn.entities[i].CD_plane_halfWidth[j],
                                scn.entities[i].CD_plane_h[j], scn.entities[i].CD_plane_halfHeight[j]);

                            if (validHit) {
                                // offset to get the entity out of the plane
                                var penetration = (self.target.CD_sph_r[0] - hitDist);
                                v3_scale_res(sphOffset, hitNormal, penetration);
                                v3_add_mod(self.target.position, sphOffset);
                                self.target.resetMatrix();
                                v3_add_mod(vectOrig, sphOffset);  // offset already calculated point
                                if (show_DEV_CD) log("inside hit");  


                                var t0 = v3_distancesquared(vectOrig, self.last_position);
                                if ( !self.collisionDetected || ( self.collisionDetected && (t0 < self.closestCollision[1])) ) {
                                    if (show_DEV_CD) if (v3_distancesquared(firstHit, vectOrig) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0,0], 8, false, 3);
                                    
                                    self.collisionDetected = true;
                                    self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(vectOrig), "Sph-Plane-Inside"];
                                }
                            }                       
                        } 
                    }

                    var hitRes = false;
                    validHit = false;
                    if (!parallelHit) hitRes = planeIntersect(scn.entities[i].CD_plane_p[j], hitNormal, vectOrig, pathVect);                 

                    if ((hitRes) && (hitRes >= -self.target.CD_sph_r[0])) { // some hit in front of vector

                        // offset for sph radius
                        // new hit = firstHit - pathVect * radius / sin angle
                        var offset = self.target.CD_sph_r[0] / Math.abs(p);
                        var t0 = hitRes - offset;

                        //if (show_DEV_CD) phyTracers.addWireCross(v3_addscaled_new(vectOrig, pathVect, t0), self.target.CD_sph_r[0], [0,0,1]);

                        if ( (t0 >= -self.target.CD_sph_r[0]) && (t0 <= self.deltaLength)) { // if hit is still forward and before end of delta 

                            v3_addscaled_res(firstHit, vectOrig, pathVect, t0); 
                            if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2*self.target.CD_sph_r[0], [0,1,0]);

                            // check if inside
                            v3_sub_res(sphOffset, firstHit, scn.entities[i].CD_plane_p[j]);
                            validHit = insidePlane(sphOffset, scn.entities[i].CD_plane_w[j],  scn.entities[i].CD_plane_halfWidth[j],
                                scn.entities[i].CD_plane_h[j], scn.entities[i].CD_plane_halfHeight[j]);
                        }

                        if (validHit) {
                            var t0 = v3_distancesquared(firstHit, self.last_position);

                            if ( !self.collisionDetected || ( self.collisionDetected && (t0 < self.closestCollision[1])) ) {

                                if (show_DEV_CD) if (v3_distancesquared(firstHit, vectOrig) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0,0], 8, false, 3);
                                                
                                self.collisionDetected = true;
                                self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-plane"];
                            }
                        }
                    }
                }
            }
        } // sph - plane






        // collision detection - self.sph to box (static)
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_box > 0)) {  
            DEV_inbox = true;

            for (let j = 0; j < scn.entities[i].CD_box; ++j) {
                var marker = i+"b"+j;
                if  (marker != self.lastHitMarker) {
                    nHitTest++;


                    // pre cull as capsule vs sph
                    if (capsuleSphereIntersect(self.target.CD_sph_r[0], 
                                                vectOrig, 
                                                 pathVect,
                                                  self.deltaLength,
                                                   scn.entities[i].CD_box_p[j], 
                                                    scn.entities[i].CD_box_preCull_r[j]) != false) {

                        v3_sub_res(vectOffset, vectOrig, scn.entities[i].CD_box_p[j]); // Delta of Origin point and Plane position 

                        // cull on which side the sph is arriving from
                        var pxdot = v3_dot(vectOffset, scn.entities[i].CD_box_x[j]);
                        var pydot = v3_dot(vectOffset, scn.entities[i].CD_box_y[j]);
                        var pzdot = v3_dot(vectOffset, scn.entities[i].CD_box_z[j]);

                        // relative sph movement
                        var dxdot = v3_dot(pathVect, scn.entities[i].CD_box_x[j]);
                        var dydot = v3_dot(pathVect, scn.entities[i].CD_box_y[j]);
                        var dzdot = v3_dot(pathVect, scn.entities[i].CD_box_z[j]);

                        var edgesToCheck = [false, false, false, false,  false, false, false, false,  false, false, false, false];
                        // top back, top right, top front, top left,
                        // back right, front right, front left, back left,
                        // bottom back, bottom right, bottom front, bottom left

                        var planeHit = false; 
                        var edgesToTest = false;
                        var edgeHit = false;
                        var closestHit = Infinity; // t 
                        var hitSuffix = "";

                        var closestP = [0.0, 0.0, 0.0];
                        var closestN = [0.0, 0.0, 0.0];
                        var closestL = 0.0;
                        // firstHit = closestP + closestN * (closestL * closestHit)

                        var apxdot = Math.abs(pxdot);
                        var apydot = Math.abs(pydot);
                        var apzdot = Math.abs(pzdot);

                        if ( (apxdot <= scn.entities[i].CD_box_halfWidth[j] + self.target.CD_sph_r[0]) &&
                        (apydot <= scn.entities[i].CD_box_halfHeight[j] + self.target.CD_sph_r[0]) &&
                        (apzdot <= scn.entities[i].CD_box_halfDepth[j] + self.target.CD_sph_r[0]) ) {
                               // if (show_DEV_CD) log("inside box, level 1");

                            if ( (apxdot <= scn.entities[i].CD_box_halfWidth[j]) &&
                                 (apydot <= scn.entities[i].CD_box_halfHeight[j]) ) {
                                if (show_DEV_CD) log("inside box Z, level 2");
                                var error = scn.entities[i].CD_box_halfDepth[j] + self.target.CD_sph_r[0];
                                error = error - apzdot;

                                v3_scale_res(sphOffset, scn.entities[i].CD_box_z[j], error);
                                v3_add_mod(self.target.position, sphOffset);                            
                                self.target.resetMatrix();

                                v3_add_mod(vectOrig, sphOffset); 
                                v3_copy(firstHit, vectOrig);
                                v3_copy(hitNormal, scn.entities[i].CD_box_z[j]);
                                if (pzdot < 0.0) v3_negate_mod(hitNormal);
                                planeHit = true;
                                hitSuffix = "-Inside";

                            } else if ( (apxdot <= scn.entities[i].CD_box_halfWidth[j]) &&
                                        (apzdot <= scn.entities[i].CD_box_halfDepth[j]) ) {

                                if (show_DEV_CD) log("inside box Y, level 2");

                                var error = scn.entities[i].CD_box_halfHeight[j] + self.target.CD_sph_r[0];
                                error = error - apydot;

                                v3_scale_res(sphOffset, scn.entities[i].CD_box_y[j], error);
                                v3_add_mod(self.target.position, sphOffset);                            
                                self.target.resetMatrix();

                                v3_add_mod(vectOrig, sphOffset); 
                                v3_copy(firstHit, vectOrig);
                                v3_copy(hitNormal, scn.entities[i].CD_box_y[j]);
                                if (pydot < 0.0) v3_negate_mod(hitNormal);
                                planeHit = true;
                                hitSuffix = "-Inside";

                            } else if ( (apzdot <= scn.entities[i].CD_box_halfDepth[j]) &&
                                        (apydot <= scn.entities[i].CD_box_halfHeight[j]) ) {

                                if (show_DEV_CD) log("inside box X, level 2");
                                
                                var error = scn.entities[i].CD_box_halfWidth[j] + self.target.CD_sph_r[0];
                                error = error - apxdot;

                                v3_scale_res(sphOffset, scn.entities[i].CD_box_x[j], error);
                                v3_add_mod(self.target.position, sphOffset);                            
                                self.target.resetMatrix();

                                v3_add_mod(vectOrig, sphOffset); 
                                v3_copy(firstHit, vectOrig);
                                v3_copy(hitNormal, scn.entities[i].CD_box_x[j]);
                                if (pxdot < 0.0) v3_negate_mod(hitNormal);
                                planeHit = true;
                                hitSuffix = "-Inside";
                            }
                        }

                        // check top face
                        var OffsetDist = scn.entities[i].CD_box_halfHeight[j];
                        
                        // check if over face, going down
                        if (!planeHit && (pydot > OffsetDist) && (dydot < 0.0) ) {
                            // offset plane position by height
                            v3_addscaled_res(planePosition, scn.entities[i].CD_box_p[j], scn.entities[i].CD_box_y[j], OffsetDist);

                            // check plane intersect
                            var hitRes = planeIntersect(planePosition, scn.entities[i].CD_box_y[j], vectOrig, pathVect);

                            // check if inside
                            if ( (hitRes) && (hitRes <= self.deltaLength / -dydot)) {                              
                                hitRes = hitRes - (self.target.CD_sph_r[0] / -dydot);

                                v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes); 
                                v3_sub_res(sphOffset, firstHit, planePosition);

                                var edgeRes = insidePlaneOrMargin(sphOffset, scn.entities[i].CD_box_x[j], scn.entities[i].CD_box_halfWidth[j],
                                    scn.entities[i].CD_box_z[j], scn.entities[i].CD_box_halfDepth[j], self.target.CD_sph_r[0]);

                                if (edgeRes == "I") { // inside hit
                                    planeHit = true;
                                    // add to the list of hits.
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2 * self.target.CD_sph_r[0], [1,1,0]);
                                    v3_copy(hitNormal, scn.entities[i].CD_box_y[j]);
                                    closestHit = hitRes;                                       
                                } else if (edgeRes != "F") { // margin hit
                                    edgesToTest = true;
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, self.target.CD_sph_r[0], [0,1,1]);
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
                        if ( !planeHit && scn.entities[i].CD_box_bottom[j] && (pydot < -OffsetDist) && (dydot > 0.0) ) {
                            // offset plane position by height
                            v3_addscaled_res(planePosition, scn.entities[i].CD_box_p[j], scn.entities[i].CD_box_y[j], -OffsetDist);

                            // check plane intersect
                            var hitRes = planeIntersect(planePosition, scn.entities[i].CD_box_y[j], vectOrig, pathVect);

                            // check if inside
                            if ( (hitRes) && (hitRes <= self.deltaLength / dydot)) {
                                hitRes = hitRes - (self.target.CD_sph_r[0] / dydot);
                                v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes); 
                                v3_sub_res(sphOffset, firstHit, planePosition);

                                var edgeRes = insidePlaneOrMargin(sphOffset, scn.entities[i].CD_box_x[j], scn.entities[i].CD_box_halfWidth[j],
                                    scn.entities[i].CD_box_z[j], scn.entities[i].CD_box_halfDepth[j], self.target.CD_sph_r[0]);

                                if (edgeRes == "I") { // inside hit
                                    planeHit = true;
                                    // add to the list of hits.
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2 * self.target.CD_sph_r[0], [1,1,0]);
                                    v3_copy(hitNormal, scn.entities[i].CD_box_y[j]);
                                    v3_negate_mod(hitNormal);
                                    closestHit = hitRes; 
                                } else if (edgeRes != "F") { // margin hit
                                    edgesToTest = true;
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, self.target.CD_sph_r[0], [0,1,1]);
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
                        OffsetDist = scn.entities[i].CD_box_halfDepth[j];
                        
                        // check in front, going backward
                        if ( !planeHit && (pzdot > OffsetDist) && (dzdot < 0.0) ) {
                            // offset plane position by height and radius
                            v3_addscaled_res(planePosition, scn.entities[i].CD_box_p[j], scn.entities[i].CD_box_z[j], OffsetDist);

                            // check plane intersect
                            var hitRes = planeIntersect(planePosition, scn.entities[i].CD_box_z[j], vectOrig, pathVect);

                            // check if inside
                            if ( (hitRes) && (hitRes <= self.deltaLength / -dzdot)) {
                                hitRes = hitRes - (self.target.CD_sph_r[0] / -dzdot);
                                v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes); 
                                v3_sub_res(sphOffset, firstHit, planePosition);

                                var edgeRes = insidePlaneOrMargin(sphOffset, scn.entities[i].CD_box_x[j], scn.entities[i].CD_box_halfWidth[j],
                                    scn.entities[i].CD_box_y[j], scn.entities[i].CD_box_halfHeight[j], self.target.CD_sph_r[0]);

                                if (edgeRes == "I") { // inside hit
                                    planeHit = true;
                                    // add to the list of hits.
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2 * self.target.CD_sph_r[0], [1,1,0]);
                                    v3_copy(hitNormal, scn.entities[i].CD_box_z[j]);
                                    closestHit = hitRes; 
                                } else if (edgeRes != "F") { // margin hit
                                    edgesToTest = true;
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, self.target.CD_sph_r[0], [0,1,1]);
                                    // edge A
                                    if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_FrontRight] = true;         
                                    if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_FrontLeft] = true;
                                    // edge B                                    
                                    if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopFront] = true;
                                    if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomFront] = scn.entities[i].CD_box_bottom[j];
                                }  

                            }
                        }

                        // check back face, behind, going forward 
                        if ( !planeHit && (pzdot < -OffsetDist) && (dzdot > 0.0) ) {
                            // offset plane position by height and radius
                            v3_addscaled_res(planePosition, scn.entities[i].CD_box_p[j], scn.entities[i].CD_box_z[j], -OffsetDist);

                            // check plane intersect
                            var hitRes = planeIntersect(planePosition, scn.entities[i].CD_box_z[j], vectOrig, pathVect);

                            // check if inside
                            if ( (hitRes) && (hitRes <= self.deltaLength / dzdot)) {
                                hitRes = hitRes - (self.target.CD_sph_r[0] / dzdot);
                                v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes); 
                                v3_sub_res(sphOffset, firstHit, planePosition);

                                var edgeRes = insidePlaneOrMargin(sphOffset, scn.entities[i].CD_box_x[j], scn.entities[i].CD_box_halfWidth[j],
                                    scn.entities[i].CD_box_y[j], scn.entities[i].CD_box_halfHeight[j], self.target.CD_sph_r[0]);


                                if (edgeRes == "I") { // inside hit
                                    planeHit = true;
                                    // add to the list of hits.
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2 * self.target.CD_sph_r[0], [1,1,0]);
                                    v3_copy(hitNormal, scn.entities[i].CD_box_z[j]);
                                    v3_negate_mod(hitNormal);
                                    closestHit = hitRes; 
                                } else if (edgeRes != "F") { // margin hit
                                    edgesToTest = true;
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, self.target.CD_sph_r[0], [0,1,1]);
                                    // edge A
                                    if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_BackRight] = true;         
                                    if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_BackLeft] = true;
                                    // edge B                                    
                                    if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopBack] = true;
                                    if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomBack] = scn.entities[i].CD_box_bottom[j];
                                }  

                            }
                        }




                       // check right face, right, going left
                       OffsetDist = scn.entities[i].CD_box_halfWidth[j];
                        
                       // check right, going left
                       if ( !planeHit && (pxdot > OffsetDist) && (dxdot < 0.0) ) {
                           // offset plane position by height and radius
                           v3_addscaled_res(planePosition, scn.entities[i].CD_box_p[j], scn.entities[i].CD_box_x[j], OffsetDist);

                           // check plane intersect
                           var hitRes = planeIntersect(planePosition, scn.entities[i].CD_box_x[j], vectOrig, pathVect);

                           // check if inside
                           if ( (hitRes) && (hitRes <= self.deltaLength / -dxdot)) {
                            hitRes = hitRes - (self.target.CD_sph_r[0] / -dxdot);
                               v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes); 
                               v3_sub_res(sphOffset, firstHit, planePosition);

                               var edgeRes = insidePlaneOrMargin(sphOffset, scn.entities[i].CD_box_z[j], scn.entities[i].CD_box_halfDepth[j],
                                scn.entities[i].CD_box_y[j], scn.entities[i].CD_box_halfHeight[j], self.target.CD_sph_r[0]);


                                if (edgeRes == "I") { // inside hit
                                   planeHit = true;
                                   // add to the list of hits.
                                   if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2 * self.target.CD_sph_r[0], [1,1,0]);
                                   v3_copy(hitNormal, scn.entities[i].CD_box_x[j]);
                                   closestHit = hitRes; 
                                } else if (edgeRes != "F") { // margin hit
                                    edgesToTest = true;
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, self.target.CD_sph_r[0], [0,1,1]);
                                    // edge A
                                    if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_FrontRight] = true;         
                                    if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_BackRight] = true;
                                    // edge B                                    
                                    if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopRight] = true;
                                    if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomRight] = scn.entities[i].CD_box_bottom[j];
                                }  
      
                           }
                       }

                       
                       // check left face, left, going right
                       if ( !planeHit && (pxdot < -OffsetDist) && (dxdot > 0.0) ) {
                           // offset plane position by height and radius
                           v3_addscaled_res(planePosition, scn.entities[i].CD_box_p[j], scn.entities[i].CD_box_x[j], -OffsetDist);

                           // check plane intersect
                           var hitRes = planeIntersect(planePosition, scn.entities[i].CD_box_x[j], vectOrig, pathVect);

                           // check if inside
                           if ( (hitRes) && (hitRes <= self.deltaLength / dxdot)) {
                               hitRes = hitRes - (self.target.CD_sph_r[0] / dxdot);
                               v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes); 
                               v3_sub_res(sphOffset, firstHit, planePosition);

                               var edgeRes = insidePlaneOrMargin(sphOffset, scn.entities[i].CD_box_z[j], scn.entities[i].CD_box_halfDepth[j],
                                scn.entities[i].CD_box_y[j], scn.entities[i].CD_box_halfHeight[j], self.target.CD_sph_r[0]);


                                if (edgeRes == "I") { // inside hit
                                   planeHit = true;
                                   // add to the list of hits.
                                   if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2 * self.target.CD_sph_r[0], [1,1,0]);
                                   v3_copy(hitNormal, scn.entities[i].CD_box_x[j]);
                                   v3_negate_mod(hitNormal);
                                   closestHit = hitRes; 
                                } else if (edgeRes != "F") { // margin hit
                                    edgesToTest = true;
                                    if (show_DEV_CD) phyTracers.addWireCross(firstHit, self.target.CD_sph_r[0], [0,1,1]);
                                    // edge A
                                    if (edgeRes[0] == "P") edgesToCheck[_CD_box_edge_FrontLeft] = true;         
                                    if (edgeRes[0] == "N") edgesToCheck[_CD_box_edge_BackLeft] = true;
                                    // edge B                                    
                                    if (edgeRes[1] == "P") edgesToCheck[_CD_box_edge_TopLeft] = true;
                                    if (edgeRes[1] == "N") edgesToCheck[_CD_box_edge_BottomLeft] = scn.entities[i].CD_box_bottom[j];
                                }  
   
                           }
                        }

                        if (planeHit && edgesToTest) log("both??");
                  //      edgesToCheck = [true, true, true, true,  true, true, true, true,  true, true, true, true];
                        if (/*true)*/  edgesToTest && !planeHit ) {
                            // Z
                            if (edgesToCheck[_CD_box_edge_TopRight]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopBackRight],
                                     scn.entities[i].CD_box_z[j], 
                                      scn.entities[i].CD_box_halfDepth[j] * 2); 
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopBackRight]);
                                    v3_copy(closestN, scn.entities[i].CD_box_z[j]);
                                    closestL = scn.entities[i].CD_box_halfDepth[j] * 2;
                                    if (show_DEV_CD) log("ToRi");
                                }
                            }
                            if (edgesToCheck[_CD_box_edge_BottomRight]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackRight],
                                     scn.entities[i].CD_box_z[j], 
                                      scn.entities[i].CD_box_halfDepth[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackRight]);
                                    v3_copy(closestN, scn.entities[i].CD_box_z[j]);
                                    closestL = scn.entities[i].CD_box_halfDepth[j] * 2;
                                    if (show_DEV_CD) log("BoRi");
                                }
                            }
                            if (edgesToCheck[_CD_box_edge_TopLeft]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopBackLeft],
                                     scn.entities[i].CD_box_z[j], 
                                      scn.entities[i].CD_box_halfDepth[j] * 2);
             
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopBackLeft]);
                                    v3_copy(closestN, scn.entities[i].CD_box_z[j]);
                                    closestL = scn.entities[i].CD_box_halfDepth[j] * 2;
                                    if (show_DEV_CD) log("ToLe");
                                }
                            }
                            if (edgesToCheck[_CD_box_edge_BottomLeft]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft],
                                     scn.entities[i].CD_box_z[j], 
                                      scn.entities[i].CD_box_halfDepth[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft]);
                                    v3_copy(closestN, scn.entities[i].CD_box_z[j]);
                                    closestL = scn.entities[i].CD_box_halfDepth[j] * 2;
                                    if (show_DEV_CD) log("BoLe");
                                }
                            }

                            // Y
                            if (edgesToCheck[_CD_box_edge_BackLeft]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft],
                                     scn.entities[i].CD_box_y[j], 
                                      scn.entities[i].CD_box_halfHeight[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft]);
                                    v3_copy(closestN, scn.entities[i].CD_box_y[j]);
                                    closestL = scn.entities[i].CD_box_halfHeight[j] * 2;
                                    if (show_DEV_CD) log("BaLe");
                                }
                            }

                            if (edgesToCheck[_CD_box_edge_BackRight]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackRight],
                                     scn.entities[i].CD_box_y[j], 
                                      scn.entities[i].CD_box_halfHeight[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackRight]);
                                    v3_copy(closestN, scn.entities[i].CD_box_y[j]);
                                    closestL = scn.entities[i].CD_box_halfHeight[j] * 2;
                                    if (show_DEV_CD) log("BaRi");
                                }
                            }

                            if (edgesToCheck[_CD_box_edge_FrontLeft]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft],
                                     scn.entities[i].CD_box_y[j], 
                                      scn.entities[i].CD_box_halfHeight[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft]);
                                    v3_copy(closestN, scn.entities[i].CD_box_y[j]);
                                    closestL = scn.entities[i].CD_box_halfHeight[j] * 2;
                                    if (show_DEV_CD) log("FrLe");
                                }
                            }

                            if (edgesToCheck[_CD_box_edge_FrontRight]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontRight],
                                     scn.entities[i].CD_box_y[j], 
                                      scn.entities[i].CD_box_halfHeight[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontRight]);
                                    v3_copy(closestN, scn.entities[i].CD_box_y[j]);
                                    closestL = scn.entities[i].CD_box_halfHeight[j] * 2;
                                    if (show_DEV_CD) log("FrRi");
                                }
                            }


                            // X
                            if (edgesToCheck[_CD_box_edge_TopBack]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopBackLeft],
                                        scn.entities[i].CD_box_x[j], 
                                        scn.entities[i].CD_box_halfWidth[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopBackLeft]);
                                    v3_copy(closestN, scn.entities[i].CD_box_x[j]);
                                    closestL = scn.entities[i].CD_box_halfWidth[j] * 2;
                                    if (show_DEV_CD) log("ToBa");
                                }
                            }
                            if (edgesToCheck[_CD_box_edge_BottomBack]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft],
                                        scn.entities[i].CD_box_x[j], 
                                        scn.entities[i].CD_box_halfWidth[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft]);
                                    v3_copy(closestN, scn.entities[i].CD_box_x[j]);
                                    closestL = scn.entities[i].CD_box_halfWidth[j] * 2;
                                    if (show_DEV_CD) log("BoBa");
                                }
                            }

                            if (edgesToCheck[_CD_box_edge_TopFront]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopFrontLeft],
                                        scn.entities[i].CD_box_x[j], 
                                        scn.entities[i].CD_box_halfWidth[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_TopFrontLeft]);
                                    v3_copy(closestN, scn.entities[i].CD_box_x[j]);
                                    closestL = scn.entities[i].CD_box_halfWidth[j] * 2;
                                    if (show_DEV_CD) log("ToFr");
                                }
                            }
                            if (edgesToCheck[_CD_box_edge_BottomFront]) {
                                var hitRes = capsuleEdgeIntersect(self.target.CD_sph_r[0], vectOrig, pathVect, self.deltaLength,
                                    scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft],
                                        scn.entities[i].CD_box_x[j], 
                                        scn.entities[i].CD_box_halfWidth[j] * 2);
                                if ((hitRes != false) && (hitRes < closestHit)) {
                                    edgeHit = true;
                                    closestHit = hitRes;
                                    v3_copy(closestP, scn.entities[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft]);
                                    v3_copy(closestN, scn.entities[i].CD_box_x[j]);
                                    closestL = scn.entities[i].CD_box_halfWidth[j] * 2;
                                    if (show_DEV_CD) log("BoFr");
                                }
                            }

                            if (edgeHit) { // calc firstHit and hitNormal
                                v3_addscaled_res(firstHit, vectOrig, self.delta, closestHit);
                                point_segment_point_res(sphOffset, closestP, closestN, closestL, firstHit);
                                v3_sub_res(hitNormal, firstHit, sphOffset);
                                //if (show_DEV_CD) log("box edge hit");
                                hitSuffix = "-Edge";
                            }   
                        }

                        if (show_DEV_CD && edgesToTest && !edgeHit) log("edge miss", false);

                        if (planeHit || edgeHit) {

                            // check dist, if dist less than current hit declare hit
                            var t0 = v3_distancesquared(firstHit, self.last_position);
                            if ( !self.collisionDetected || ( self.collisionDetected && (t0 < self.closestCollision[1])) ) {

                                if (show_DEV_CD) if (v3_distancesquared(firstHit, vectOrig) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0,0], 8, false, 3);
                                                
                                self.collisionDetected = true;
                                self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-box" + hitSuffix];
                            }

                        }





                    } // pre-cull with sph sph capsule
                 
                }//different marker
            }// for each boxes
            DEV_inbox = false;
        }//sph-box      




        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_triangle > 0)) {  

            // todo pre-cull whole CD stack
            for (let j = 0; j < scn.entities[i].CD_triangle; ++j) {
                var marker = i+"t"+j;
                if  (marker != self.lastHitMarker) {
                    nHitTest++;

                    var hitRes = triangle_capsule_intersect_res(firstHit, vectOrig, pathVect, self.target.CD_sph_r[0],
                        scn.entities[i].CD_triangle_p1[j], scn.entities[i].CD_triangle_p2[j], 
                        scn.entities[i].CD_triangle_p3[j], scn.entities[i].CD_triangle_n[j]);
                    if ((hitRes != false) && (hitRes <= self.deltaLength) ) {      
                        // check dist, if dist less than current hit declare hit
                        var t0 = 0.0;
                     /*   if (hitRes > 0.0)*/ t0 = v3_distancesquared(firstHit, self.last_position);
                        if ( !self.collisionDetected || ( self.collisionDetected && (t0 < self.closestCollision[1])) ) {

                            if (show_DEV_CD) if (v3_distancesquared(firstHit, vectOrig) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,1,0.8], 8, false, 3);
                                            
                            self.collisionDetected = true;
                            self.closestCollision = [marker, t0, v3_clone(scn.entities[i].CD_triangle_n[j]), v3_clone(firstHit), "Sph-Tri"];
                        }


                    } // if hitres

                } // different marker
            } // foreach triangles
        }// sph-triangle






        //stats
        var DEV_cubeStopTime = performance.now();

        if (i == DEV_cube_6P_target) {
            hitPoints.set("CUBE_6P_tt", hitPoints.get("CUBE_6P_tt") + (DEV_cubeStopTime - DEV_cubeStartTime));
            hitPoints.set("CUBE_6P_att", hitPoints.get("CUBE_6P_tt") / hitPoints.get("CUBE_6P_nt"));    
            if (self.collisionDetected) {
                hitPoints.set("CUBE_6P_nh", hitPoints.get("CUBE_6P_nh") + 1);
                hitPoints.set("CUBE_6P_ht", hitPoints.get("CUBE_6P_ht") + (DEV_cubeStopTime - DEV_cubeStartTime));
                hitPoints.set("CUBE_6P_ath", hitPoints.get("CUBE_6P_ht") / hitPoints.get("CUBE_6P_nh"));                
            }
        }
        if (i == DEV_cube_BX_target) {
            hitPoints.set("CUBE_BX_tt", hitPoints.get("CUBE_BX_tt") + (DEV_cubeStopTime - DEV_cubeStartTime));
            hitPoints.set("CUBE_BX_att", hitPoints.get("CUBE_BX_tt") / hitPoints.get("CUBE_BX_nt"));    
            if (self.collisionDetected) {
                hitPoints.set("CUBE_BX_nh", hitPoints.get("CUBE_BX_nh") + 1);
                hitPoints.set("CUBE_BX_ht", hitPoints.get("CUBE_BX_ht") + (DEV_cubeStopTime - DEV_cubeStartTime));
                hitPoints.set("CUBE_BX_ath", hitPoints.get("CUBE_BX_ht") / hitPoints.get("CUBE_BX_nh"));                                      
            }
        }
        if (i == DEV_cube_DS_target) {
            hitPoints.set("CUBE_DS_tt", hitPoints.get("CUBE_DS_tt") + (DEV_cubeStopTime - DEV_cubeStartTime));
            hitPoints.set("CUBE_DS_att", hitPoints.get("CUBE_DS_tt") / hitPoints.get("CUBE_BX_nt"));    
            if (self.collisionDetected) {
                hitPoints.set("CUBE_DS_nh", hitPoints.get("CUBE_DS_nh") + 1);
                hitPoints.set("CUBE_DS_ht", hitPoints.get("CUBE_DS_ht") + (DEV_cubeStopTime - DEV_cubeStartTime));
                hitPoints.set("CUBE_DS_ath", hitPoints.get("CUBE_DS_ht") / hitPoints.get("CUBE_BX_nh"));                                      
            }
        }


    } // end for each other entity perform hit test

}







// Intersection of vector and sphere, as vector advance into static sphere, arrow like
function VectSphHit(v, so, sr2) { // translated to v origin
    var t0 = 0; 
    var t1 = 0;

    var tca = v3_dot(so, v);

    hitPoints.set("v-s tca", tca);

if (isNaN(tca)) throw "VectSphHit tca NaN";
    if  (tca < 0) return false;
    // sph behind origin

    var d2 = v3_lengthsquared(so) - (tca * tca);

    if (d2 > sr2) return false;
    // tangential point farther than radius

    var thc = Math.sqrt(sr2 - d2);
    t0 = tca - thc;
    t1 = tca + thc;
    hitPoints.set("v-s t0" , t0);
    hitPoints.set("v-s t1" , t1);
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


var _planeIntersect_diff = [0.0, 0.0, 0.0];
function planeIntersect(planePos, planeNormal, vectOrigin, vectDirection) {
// https://en.wikipedia.org/wiki/Line%E2%80%93plane_intersection
    var angleCos = v3_dot(planeNormal, vectDirection);
    hitPoints.set("p-v cos", angleCos);
	if (Math.abs(angleCos) < _v3_epsilon) {
      //  log("parallel");
        return false; // parallel, either too far or impossible to get there, edges testing would have catched it
    }
	v3_sub_res(_planeIntersect_diff, planePos, vectOrigin);
    var t = v3_dot(planeNormal, _planeIntersect_diff) / angleCos;

    hitPoints.set("p-v t", t);
  //  if (t < 0.0) return false; // derriere    
    if (t == 0) t = _v3_epsilon;
	return t;
}


function insidePlane(SphPosMinusPlanePos, normalA, halfSizeA, normalB, halfSizeB) {
    if (Math.abs(v3_dot(SphPosMinusPlanePos, normalA)) > halfSizeA) return false;
    if (Math.abs(v3_dot(SphPosMinusPlanePos, normalB)) > halfSizeB) return false;   
    return true;
}


var _t_v_i_v0 = [0.0, 0.0, 0.0];
var _t_v_i_v1 = [0.0, 0.0, 0.0];
var _t_v_i_v2 = [0.0, 0.0, 0.0];
function triangle_vector_intersect_res(firsthit, vOrig, vNormal, triP1, triP2, triP3, triNorm) {
//https://blackpawn.com/texts/pointinpoly/default.html

    var angleCos = v3_dot(triNorm, vNormal);
    if (Math.abs(angleCos) < _v3_epsilon) return false;
    
	v3_sub_res(_t_v_i_v2, vOrig, triP1);
    var t = v3_dot(triNorm, _t_v_i_v2) / -angleCos;

    if (t < 0.0) return false; // behind

    v3_sub_res(_t_v_i_v0, triP3, triP1);
    v3_sub_res(_t_v_i_v1, triP2, triP1);

    v3_addscaled_res(firsthit, vOrig, vNormal, t);
    //if (show_DEV_CD) phyTracers.addWireCross(firsthit, 2, [1, 0, 0]);

    v3_sub_res(_t_v_i_v2, firsthit, triP1);

    var dot00 = v3_lengthsquared(_t_v_i_v0);
    var dot01 = v3_dot(_t_v_i_v0, _t_v_i_v1);
    var dot02 = v3_dot(_t_v_i_v0, _t_v_i_v2);
    var dot11 = v3_lengthsquared(_t_v_i_v1);
    var dot12 = v3_dot(_t_v_i_v1, _t_v_i_v2);

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
        if (show_DEV_CD) phyTracers.addWireCross(firsthit, 4, [0, 1, 0]);
        if (t == 0) t = _v3_epsilon;
        return t;
    } else return false;
}

var _t_c_i_vOrig_corrected = [0.0, 0.0, 0.0];
var _t_c_i_vOrig_P1_delta = [0.0, 0.0, 0.0];
function triangle_capsule_intersect_res(firstHit, vOrig, vNormal, vRad, triP1, triP2, triP3, triNorm) {
    //https://blackpawn.com/texts/pointinpoly/default.html
    
        var angleCos = v3_dot(triNorm, vNormal);
        if (Math.abs(angleCos) < _v3_epsilon) return false;

        v3_addscaled_res(_t_c_i_vOrig_corrected, vOrig, triNorm, -vRad); //offset for sph end radius
        
        v3_sub_res(_t_c_i_vOrig_P1_delta, _t_c_i_vOrig_corrected, triP1);

        var t = v3_dot(triNorm, _t_c_i_vOrig_P1_delta);

        if (t < -vRad) return false; // behind

        t = t / -angleCos; // compensate for angle between vectors

        if (t >= 0.0) {
            v3_addscaled_res(firstHit, vOrig, vNormal, t); //position on plane
        } else {
            v3_addscaled_res(firstHit, vOrig, triNorm, (t * angleCos)); 
        }
        //if (show_DEV_CD) phyTracers.addWireCross(firstHit, 2, [1, 0, 0]);
        
        v3_sub_res(_t_v_i_v0, triP3, triP1); // TODO pre-calc in entity CD data
        v3_sub_res(_t_v_i_v1, triP2, triP1); // pre-calc
        v3_sub_res(_t_v_i_v2, firstHit, triP1);
    
        var dot00 = v3_lengthsquared(_t_v_i_v0); // pre-calc
        var dot01 = v3_dot(_t_v_i_v0, _t_v_i_v1); // pre-calc
        var dot02 = v3_dot(_t_v_i_v0, _t_v_i_v2);
        var dot11 = v3_lengthsquared(_t_v_i_v1); // pre-calc
        var dot12 = v3_dot(_t_v_i_v1, _t_v_i_v2);
    
        var invDenom = 1.0 / (dot00 * dot11 - dot01 * dot01);
        if (isNaN(invDenom)) return false;
        var u = (dot11 * dot02 - dot01 * dot12) * invDenom
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom
    
        if ((u >= 0.0) && (v >= 0.0) && (u + v < 1.0)) {
            if (show_DEV_CD) phyTracers.addWireCross(firstHit, 4, [0, 1, 0]);
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


var _capsuleSphereIntersect_offset = [0.0, 0.0, 0.0];
function capsuleSphereIntersect(capRadius, capOrigin, capNormal, capLength, sphPosition, sphRadius) {
    var sumR = capRadius + sphRadius;
    v3_sub_res(_capsuleSphereIntersect_offset, sphPosition, capOrigin);
    var hitRes = VectSphHit(capNormal, _capsuleSphereIntersect_offset, sumR * sumR); 
    if (isFinite(hitRes) && (hitRes != false) && (hitRes <= capLength)) return hitRes;
    return false;
}

//TODO capsuleCapsuleIntersect(capAradius, capAorigin, capAnormal, capAlength, capBradius, capBorigin, capBnormal, capBlength) {}

var _capsuleEdgeIntersect_edgeVector = [0.0, 0.0, 0.0];
var _capsuleEdgeIntersect_capsuleVector = [0.0, 0.0, 0.0];
var _capsuleEdgeIntersect_p1 = [0.0, 0.0, 0.0];
var _capsuleEdgeIntersect_p2 = [0.0, 0.0, 0.0];
var _capsuleEdgeIntersect_originDelta = [0.0, 0.0, 0.0];
var _capsuleEdgeIntersect_capsuleEnd = [0.0, 0.0, 0.0];
function capsuleEdgeIntersect(capRadius, capOrigin, capNormal, capLength, edgeOrigin, edgeNormal, edgeLength) {
    var distsq;
    var capRadiusSq = capRadius * capRadius;
    // closest points between paths, v1t is t along delta, v2t is t along edge (0.0 - 1.0), -1 is behind

    v3_scale_res(_capsuleEdgeIntersect_edgeVector, edgeNormal, edgeLength);
    v3_scale_res(_capsuleEdgeIntersect_capsuleVector, capNormal, capLength);
    var [v1t, v2t] = vector_vector_t(capOrigin, _capsuleEdgeIntersect_capsuleVector, edgeOrigin, _capsuleEdgeIntersect_edgeVector);

    // check if closest points are within both vectors
    var potentialHit = ( (v1t > 0.0) && (v1t <= 1.0) && (v2t >= 0.0) && (v2t <= 1.0) );

    if (potentialHit) {
        if (DEV_inbox && show_DEV_CD) log("check potential");
        v3_addscaled_res(_capsuleEdgeIntersect_p1, capOrigin, _capsuleEdgeIntersect_capsuleVector, v1t);
        v3_addscaled_res(_capsuleEdgeIntersect_p2, edgeOrigin, _capsuleEdgeIntersect_edgeVector, v2t);
        distsq = v3_distancesquared(_capsuleEdgeIntersect_p1, _capsuleEdgeIntersect_p2);
        potentialHit = distsq <= capRadiusSq;
        if (DEV_inbox && show_DEV_CD && potentialHit) log("closest");
    } //else {
    // not "else", recheck potentialHit as it can be invalidated in previous block
    if (!potentialHit) { // end cap as the sphere at the end of the vector
      //  if (DEV_inbox && show_DEV_CD) log("check endcap");

        v3_add_res(_capsuleEdgeIntersect_capsuleEnd, _capsuleEdgeIntersect_capsuleVector, capOrigin);
        v3_sub_res(_capsuleEdgeIntersect_originDelta, _capsuleEdgeIntersect_capsuleEnd, edgeOrigin);
        var endCap = vector_sph_t(edgeNormal, _capsuleEdgeIntersect_originDelta, capRadiusSq);

        if (endCap != false) {
            var [st0, stca, st1] = endCap;    
            var st0_inside = (st0 >= 0.0) && (st0 <= 1.0);
            var st1_inside = (st1 >= 0.0) && (st1 <= 1.0);

            if (st0_inside && st1_inside) { // check closest point
                v3_addscaled_res(_capsuleEdgeIntersect_p1, edgeOrigin, edgeNormal, st0);
                v3_addscaled_res(_capsuleEdgeIntersect_p2, edgeOrigin, edgeNormal, st1);
                var d1 = v3_lengthsquared(_capsuleEdgeIntersect_p1, capOrigin);                            
                var d2 = v3_lengthsquared(_capsuleEdgeIntersect_p2, capOrigin);
                if (d2 < d1) v3_copy(_capsuleEdgeIntersect_p1, _capsuleEdgeIntersect_p2);
                potentialHit = true;
            } else if (st0_inside) { // use t0
                v3_addscaled_res(_capsuleEdgeIntersect_p1, edgeOrigin, edgeNormal, st0);
                potentialHit = true;
            } else if (st1_inside) { // use t1
                v3_addscaled_res(_capsuleEdgeIntersect_p1, edgeOrigin, edgeNormal, st1);
                potentialHit = true;
            }

            if (potentialHit) {
                if (DEV_inbox && show_DEV_CD) log("endcap hit");
                v1t = 1.0; // end cap hit
                distsq = v3_distancesquared(_capsuleEdgeIntersect_capsuleEnd, _capsuleEdgeIntersect_p1);
                if (Math.abs(distsq - capRadiusSq) > _v3_epsilon) { // last sanity check
                    log("failed, distsq " + distsq + " >  sph rs" + capRadiusSq);
                    throw "Edge check failed as end cap";
                }
            } else {
                if (DEV_inbox && show_DEV_CD) log("endcap miss");
            }

            if (show_DEV_CD) { 
        //        phyTracers.addWireSphere(p1p, 2, [1,7.5,1], 8, false, 3);
         //       phyTracers.addWireSphere(p2p, 2, [0.75,1,1], 8, false, 3);
              //  if (potentialHit) log("endcap");
            }
        }
    }

    if (potentialHit) {

        var penetration = capRadius - Math.sqrt(distsq);
        var vcos = v3_dot(capNormal, edgeNormal); // adjust for "slope"

        penetration = penetration / Math.abs(1.0 - (vcos * vcos));// as path length

        v1t = v1t - (penetration / capLength); // as path t
        if (v1t <= 0.0) v1t = _v3_epsilon;
        hitPoints.set("edge vcos", vcos);

        return v1t;
    } else return false;
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
    hitPoints.set("v-v_t sc", sc);
    hitPoints.set("v-v_t tc", tc);
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
