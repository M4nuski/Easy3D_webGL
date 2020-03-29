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
