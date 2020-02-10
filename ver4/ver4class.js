// Easy3D_WebGL
// Main class container for dev
// Emmanuel Charette 2017-2019

"use strict"

/*
        // collision detection - self.sph to plane (static)
        if ((self.target.CD_sph > 0) && (scn.entities[i].CD_plane > 0)) {  

            for (let j = 0; j < scn.entities[i].CD_plane; ++j) {
                var marker = i+"p"+j;
                if  (marker != self.lastHitMarker) {
                    nHitTest++;

                    v3_copy(hitNormal, scn.entities[i].CD_plane_n[j]);
                    v3_copy(planePosition, scn.entities[i].CD_plane_p[j]);
                    v3_sub_res(vectOffset, vectOrig, planePosition);


                    var d = v3_dot(vectOffset, hitNormal);
                    // if d >= 0 on side of normal, else on opposite side of normal
                    if (d < 0.0) v3_negate_mod(hitNormal);

                  //  if (d >= 0.0) {
                        v3_addscaled_mod(planePosition, hitNormal,  self.target.CD_sph_r[0]);
                  //  } else {
                   //     v3_addscaled_mod(planePosition, hitNormal, -self.target.CD_sph_r[0]);           
                    //}

                    var hitRes = planeIntersect(planePosition, hitNormal, vectOrig, pathVect);
                    
                    if ((hitRes) && (hitRes <= self.deltaLength) ) {
                        var t0 = hitRes / self.deltaLength;

                        // test if inside rectangle
                        v3_addscaled_res(firstHit, vectOrig, pathVect, hitRes - 0.05);     
                        v3_sub_mod(firstHit, scn.entities[i].CD_plane_p[j]);

                        var validHit = true;

                        // check if inside
                        if (Math.abs(v3_dot(firstHit, scn.entities[i].CD_plane_w[j])) > scn.entities[i].CD_plane_halfWidth[j]) validHit = false;
                        if (validHit) {
                            if (Math.abs(v3_dot(firstHit, scn.entities[i].CD_plane_h[j])) > scn.entities[i].CD_plane_halfHeight[j]) validHit = false; 
                        }

                        if (((!self.collisionDetected) && validHit) || (validHit && (self.collisionDetected) && (t0 < self.closestCollision[1]))) {

                            v3_add_mod(firstHit, scn.entities[i].CD_plane_p[j]);

                            if (show_DEV_CD) {
                                if (v3_distancesquared(firstHit, vectOrig) > _v3_epsilon) phyTracers.addWireSphere(firstHit, 2 * self.target.CD_sph_r[0], [1,0,0], 8, false, 3);
                            }
                            
                            self.collisionDetected = true;
                            if (t0 < 0.0) t0 = 0;
                            self.closestCollision = [marker, t0, v3_clone(hitNormal), v3_clone(firstHit), "Sph-plane"];
                        }
                    }
                }
            }
        } // sph - plane
*/