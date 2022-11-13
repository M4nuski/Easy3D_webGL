// Easy3D_WebGL
// Rigid body class for collision detection

// Emmanuel Charette 2019-2022

"use strict"


const CD_type = {  // p nx ny nz lx ly lz pts
    NONE:       0, // 
    POINT:      1, // p
    SPHERE:     2, // p          r
    CAPSULE:    3, // p    n     r  l
    EDGE:       4, // p    n        l
    INFPLANE:   5, // p    n      
    PLANE:      6, // p nw n  nh lw    lh
    BLBOX:      7, // p nx ny nz lx ly lz 4p
    BOX:        8, // p nx ny nz lx ly lz 8p
    TRI:        9 ///   p1 p2 p3 d2 d3 d   
}
const CD_type_strings = [ "None", "Point", "Sphere", "Capsule", "Edge", "Infinite Plane", "Plane", "Bottomless Box", "Box", "Triangle" ];

//TODO default orientation on X-Z plane, up following Y axis

const CD_mode = {
    STATIC:     0, // dosent move, affect dynamic (physics) and controlled (block)
    DYNAMIC:    1, // can move (physics), affect dynamic, react to static, dynamic, controlled
    CONTROLLED: 2  // can be moved, affect dynamic, react to static and controlled (block, rubberband)
}
const CD_mode_strings = [ "Static", "Dynamic", "Controlled"]; 

class E3D_body {
    constructor(mode) {
        this.mode = mode;

        this.pDelta = v3_new(); // entity position delta vector
        this.deltaLength = -1;  // length of this.pDelta during animation step for culling and interpolation
        this.effectiveSpeed = [0.0, 0.0, 0.0];

        this.lastHitTarget = -1;


        this.parts = []; // list of CD_type.point .edge .sph .plane .box etc
        
        this.p0 = []; // center position
        this.p = [];

        // normals or points
        this.nx0 = []; // x normal, p1 for triangle
        this.nx = [];
        this.ny0 = []; // y normal, p2 for triangle
        this.ny = [];
        this.nz0 = []; // z normal, p3 for triangle
        this.nz = [];

        // lengths
        this.lx = []; // half lengths, squared length for triangle
        this.ly = [];
        this.lz = [];

        // optional point lists
        this.p0list = []; // list of edge points for boxes
        this.plist = []; 
    }

    updateCDdata(modelMatrix, normalMatrix) {
        for (var i = 0; i < this.parts.length; ++i) {
            let pType = this.parts[i];
            if (pType > 0) {
                if (pType == CD_type.TRI) {
                    v3_applym4_res(this.nx[i], this.nx0[i], modelMatrix);
                    v3_applym4_res(this.ny[i], this.ny0[i], modelMatrix);
                    v3_applym4_res(this.nz[i], this.nz0[i], modelMatrix);
                } else {
                    v3_applym4_res(this.p[i], this.p0[i], modelMatrix);
                    if (pType >= 6) v3_applym4_res(this.nx[i], this.nx0[i], normalMatrix);
                    if (pType >= 3) v3_applym4_res(this.ny[i], this.ny0[i], normalMatrix);
                    if (pType >= 6) v3_applym4_res(this.nz[i], this.nz0[i], normalMatrix);
                    if (pType >= 7) v3a_applym4_res(this.plist[i], this.p0list[i], modelMatrix);
                }
            }
        }
    }


    pushCD_point(p) {
        this.CD_point_p0[this.CD_point] = v3_clone(p);
        this.CD_point_p[this.CD_point] = v3_clone(p);

        this.CD_point += 1;
    }
    pushCD_edge(p, n, l) {
        this.CD_edge_p0[this.CD_edge] = v3_clone(p);
        this.CD_edge_p[this.CD_edge] = v3_clone(p);
        
        this.CD_edge_n0[this.CD_edge] = v3_clone(n);
        this.CD_edge_n[this.CD_edge] = v3_clone(n);

        this.CD_edge_l[this.CD_edge] = l;
        
        this.CD_edge += 1;
    }
    pushCD_edge2p(p1, p2) {
        var n = v3_sub_new(p2, p1);
        var l = v3_length(n)
        v3_invscale_mod(n, l);
        this.CD_edge_p0[this.CD_edge] = v3_clone(p1);
        this.CD_edge_p[this.CD_edge] = v3_clone(p1);
        
        this.CD_edge_n0[this.CD_edge] = v3_clone(n);
        this.CD_edge_n[this.CD_edge] = v3_clone(n);

        this.CD_edge_l[this.CD_edge] = l;
        
        this.CD_edge += 1;
    }
    pushCD_sph(p, r) {
        this.CD_sph_p0[this.CD_sph] = v3_clone(p); 
        this.CD_sph_p[this.CD_sph] = v3_clone(p); 
        
        this.CD_sph_r[this.CD_sph] = r;
        this.CD_sph_rs[this.CD_sph] = r*r;
        
        this.CD_sph += 1;
    }

    pushCD_plane(p, n, wn, hn, w, h) {
        this.CD_plane_p0[this.CD_plane] = v3_clone(p); // position offset of plane
        this.CD_plane_p[this.CD_plane] = v3_clone(p);  
        this.CD_plane_n0[this.CD_plane] = v3_clone(n); // normal of plane face
        this.CD_plane_n[this.CD_plane] = v3_clone(n);  
        this.CD_plane_w0[this.CD_plane] = v3_clone(wn); // width
        this.CD_plane_w[this.CD_plane] = v3_clone(wn);
        this.CD_plane_h0[this.CD_plane] = v3_clone(hn); // height
        this.CD_plane_h[this.CD_plane] = v3_clone(hn);
        this.CD_plane_halfWidth[this.CD_plane] = w;
        this.CD_plane_halfHeight[this.CD_plane] = h;

        this.CD_plane += 1;
    }

    pushCD_box(p, nx, ny, nz, hwidth, hheight, hdepth, bottom) {
        this.CD_box_p0[this.CD_box] = v3_clone(p); 
        this.CD_box_p[this.CD_box] = v3_clone(p); 

        this.CD_box_x0[this.CD_box] = v3_clone(nx); 
        this.CD_box_x[this.CD_box] = v3_clone(nx); 
        this.CD_box_y0[this.CD_box] = v3_clone(ny); 
        this.CD_box_y[this.CD_box] = v3_clone(ny); 
        this.CD_box_z0[this.CD_box] = v3_clone(nz); 
        this.CD_box_z[this.CD_box] = v3_clone(nz); 

        this.CD_box_halfWidth[this.CD_box]  = hwidth;
        this.CD_box_halfHeight[this.CD_box] = hheight;
        this.CD_box_halfDepth[this.CD_box]  = hdepth; 

        this.CD_box_bottom[this.CD_box] = bottom; 

        // create the corner vertex
        // scale normal by half dim
        var px = v3_scale_new(nx,  hwidth);
        var mx = v3_scale_new(nx, -hwidth);

        var py = v3_scale_new(ny,  hheight);
        var my = v3_scale_new(ny, -hheight);

        var pz = v3_scale_new(nz,  hdepth);
        var mz = v3_scale_new(nz, -hdepth);

        this.CD_box_edge_p0[this.CD_box] = [];

        // top
        this.CD_box_edge_p0[this.CD_box][_CD_box_corner_TopBackRight]  = v3_addaddadd_new(p, py, px, mz);
        this.CD_box_edge_p0[this.CD_box][_CD_box_corner_TopFrontRight] = v3_addaddadd_new(p, py, px, pz);
        this.CD_box_edge_p0[this.CD_box][_CD_box_corner_TopFrontLeft]  = v3_addaddadd_new(p, py, mx, pz);
        this.CD_box_edge_p0[this.CD_box][_CD_box_corner_TopBackLeft]   = v3_addaddadd_new(p, py, mx, mz);

        // bottom 
        this.CD_box_edge_p0[this.CD_box][_CD_box_corner_BottomBackRight]  = v3_addaddadd_new(p, my, px, mz);
        this.CD_box_edge_p0[this.CD_box][_CD_box_corner_BottomFrontRight] = v3_addaddadd_new(p, my, px, pz);
        this.CD_box_edge_p0[this.CD_box][_CD_box_corner_BottomFrontLeft]  = v3_addaddadd_new(p, my, mx, pz);
        this.CD_box_edge_p0[this.CD_box][_CD_box_corner_BottomBackLeft]   = v3_addaddadd_new(p, my, mx, mz);

        this.CD_box_edge_p[this.CD_box] = v3a_clone(this.CD_box_edge_p0[this.CD_box]);

        this.CD_box_preCull_r[this.CD_box] = Math.sqrt(hwidth*hwidth + hheight*hheight + hdepth*hdepth);

        this.CD_box += 1;
    }
    
    pushCD_triangle(n, p1, p2 ,p3) {
        this.CD_triangle_n0[this.CD_triangle]  = v3_clone(n);
        this.CD_triangle_n[this.CD_triangle]   = v3_clone(n);
        this.CD_triangle_p10[this.CD_triangle] = v3_clone(p1);
        this.CD_triangle_p1[this.CD_triangle]  = v3_clone(p1);

        var p3p1 = v3_sub_new(p3, p1);
        var p2p1 = v3_sub_new(p2, p1);

        this.CD_triangle_p3p10[this.CD_triangle] = v3_clone(p3p1);
        this.CD_triangle_p3p1[this.CD_triangle]  = v3_clone(p3p1);
        this.CD_triangle_p2p10[this.CD_triangle] = v3_clone(p2p1);
        this.CD_triangle_p2p1[this.CD_triangle]  = v3_clone(p2p1);

        this.CD_triangle_p3p1lenSq[this.CD_triangle] = v3_lengthsquared(p3p1);
        this.CD_triangle_p2p1lenSq[this.CD_triangle] = v3_lengthsquared(p2p1);
        this.CD_triangle_p3p2p1dot[this.CD_triangle] = v3_dot(p3p1, p2p1);

        this.CD_triangle += 1;
    }
    


    cloneData(targetCDdata) {

  
            if (targetCDdata.CD_point > 0) {
                this.CD_point = targetCDdata.CD_point;
                this.CD_point_p0 = v3a_clone(targetCDdata.CD_point_p0);
                this.CD_point_p  = v3a_clone(targetCDdata.CD_point_p);
            }
            if (targetCDdata.CD_edge > 0) {
                this.CD_edge = targetCDdata.CD_edge;
                this.CD_edge_p0 = v3a_clone(targetCDdata.CD_edge_p0);
                this.CD_edge_p  = v3a_clone(targetCDdata.CD_edge_p);
                this.CD_edge_n0 = v3a_clone(targetCDdata.CD_edge_n0);
                this.CD_edge_n  = v3a_clone(targetCDdata.CD_edge_n);
                this.CD_edge_l  = targetCDdata.CD_edge_l.slice();
            }
            if (targetCDdata.CD_sph > 0) {
                this.CD_sph = targetCDdata.CD_sph;
                this.CD_sph_p0 = v3a_clone(targetCDdata.CD_sph_p0);
                this.CD_sph_p = v3a_clone(targetCDdata.CD_sph_p);
                this.CD_sph_r = targetCDdata.CD_sph_r.slice();
                this.CD_sph_rs = targetCDdata.CD_sph_rs.slice();
            }
            if (targetCDdata.CD_plane > 0) {
                this.CD_plane = targetCDdata.CD_plane;
                this.CD_plane_p0 = v3a_clone(targetCDdata.CD_plane_p0);
                this.CD_plane_p  = v3a_clone(targetCDdata.CD_plane_p);
                this.CD_plane_n0 = v3a_clone(targetCDdata.CD_plane_n0);
                this.CD_plane_n  = v3a_clone(targetCDdata.CD_plane_n);
                this.CD_plane_w0 = v3a_clone(targetCDdata.CD_plane_w0);
                this.CD_plane_w  = v3a_clone(targetCDdata.CD_plane_w);
                this.CD_plane_h0 = v3a_clone(targetCDdata.CD_plane_h0);
                this.CD_plane_h  = v3a_clone(targetCDdata.CD_plane_h);
                this.CD_plane_halfWidth  = targetCDdata.CD_plane_halfWidth.slice();
                this.CD_plane_halfHeight = targetCDdata.CD_plane_halfHeight.slice();
            }
            if (targetCDdata.CD_box > 0) {
                this.CD_box = targetCDdata.CD_box;
    
                this.CD_box_p0  = v3a_clone(targetCDdata.CD_box_p0);
                this.CD_box_p = v3a_clone(targetCDdata.CD_box_p);
                this.CD_box_x0  = v3a_clone(targetCDdata.CD_box_x0);
                this.CD_box_x = v3a_clone(targetCDdata.CD_box_x);
                this.CD_box_y0  = v3a_clone(targetCDdata.CD_box_y0);
                this.CD_box_y = v3a_clone(targetCDdata.CD_box_y);
                this.CD_box_z0  = v3a_clone(targetCDdata.CD_box_z0);
                this.CD_box_z = v3a_clone(targetCDdata.CD_box_z);
    
                this.CD_box_bottom  = targetCDdata.CD_box_bottom.slice();
    
                this.CD_box_edge_p0 = v3a_clone(targetCDdata.CD_box_edge_p0);
                this.CD_box_edge_p = v3a_clone(targetCDdata.CD_box_edge_p);
    
                this.CD_box_halfWidth  = targetCDdata.CD_box_halfWidth.slice();
                this.CD_box_halfHeight = targetCDdata.CD_box_halfHeight.slice();            
                this.CD_box_halfDepth  = targetCDdata.CD_box_halfDepth.slice();
    
                this.CD_box_preCull_r  = targetCDdata.CD_box_preCull_r.slice();
            }
    
            if (targetCDdata.CD_triangle > 0) {
    
                this.CD_triangle = targetCDdata.CD_triangle;
                this.CD_triangle_p10 = v3a_clone(targetCDdata.CD_triangle_p10); 
                this.CD_triangle_p1  = v3a_clone(targetCDdata.CD_triangle_p1);
                this.CD_triangle_n0  = v3a_clone(targetCDdata.CD_triangle_n0); 
                this.CD_triangle_n   = v3a_clone(targetCDdata.CD_triangle_n); 
    
                this.CD_triangle_p3p10 = v3a_clone(targetCDdata.CD_triangle_p3p10); 
                this.CD_triangle_p2p10 = v3a_clone(targetCDdata.CD_triangle_p2p10); 
                this.CD_triangle_p3p1  = v3a_clone(targetCDdata.CD_triangle_p3p1); 
                this.CD_triangle_p2p1  = v3a_clone(targetCDdata.CD_triangle_p2p1); 
        
                this.CD_triangle_p3p1lenSq = targetCDdata.CD_triangle_p3p1lenSq.slice();
                this.CD_triangle_p2p1lenSq = targetCDdata.CD_triangle_p2p1lenSq.slice();
                this.CD_triangle_p3p2p1dot = targetCDdata.CD_triangle_p3p2p1dot.slice();
            }
    }

    clear() {
        this.parts = [];
        this.p0 = [];
        this.p = [];
        this.nx0 = [];
        this.nx = [];
        this.ny0 = [];
        this.ny = [];
        this.nz0 = [];
        this.nz = [];
        this.lx = [];
        this.ly = [];
        this.lz = [];
        this.p0list = [];
        this.plist = []; 
    }


    swapCDdataFrame() {
        // TODO keep track of last positions/rotations with ref swapping between FRAMES 
    }

    resetCollisions() {             
      /*  for (var i = 0; i < this.nbsourceCollision; ++i)this.sourceCollisions[i].reset();
        for (var i = 0; i < this.nbTargetCollision; ++i)this.targetCollisions[i].reset();

        this.nbsourceCollision = 0;
        this.nbTargetCollision = 0;*/
    }

    pushCollisionSource(m, t, n, p, sDesc, scdi, targetIndex, tDesc, tcdi) {
       /* if (this.nbsourceCollision >= this.sourceCollisions.length) this.sourceCollisions.push(new E3D_collisionResult());
        
        this.sourceCollisions[this.nbsourceCollision].marker = ""+m;
        this.sourceCollisions[this.nbsourceCollision].t0 = t;
        v3_copy(this.sourceCollisions[this.nbsourceCollision].n, n);
        v3_copy(this.sourceCollisions[this.nbsourceCollision].p0, p);
        
        this.sourceCollisions[this.nbsourceCollision].source_desc = sDesc;
        this.sourceCollisions[this.nbsourceCollision].source_cdi = scdi;

        this.sourceCollisions[this.nbsourceCollision].entity_index = targetIndex;

        this.sourceCollisions[this.nbsourceCollision].target_desc = tDesc;
        this.sourceCollisions[this.nbsourceCollision].target_cdi = tcdi; 
        
        this.nbsourceCollision++;*/
    }



    pushCollisionTarget(m, t, n, p, sDesc, scdi, sourceIndex, tDesc, tcdi) {
      /*  if (this.nbTargetCollision >=this.targetCollisions.length)this.targetCollisions.push(new E3D_collisionResult());

        this.targetCollisions[this.nbTargetCollision].marker = ""+m;
        this.targetCollisions[this.nbTargetCollision].t0 = t;
        v3_copy(this.targetCollisions[this.nbTargetCollision].n, n);
        v3_copy(this.targetCollisions[this.nbTargetCollision].p0, p);

        this.targetCollisions[this.nbTargetCollision].source_desc = sDesc;
        this.targetCollisions[this.nbTargetCollision].source_cdi = scdi;

        this.targetCollisions[this.nbTargetCollision].entity_index = sourceIndex;

        this.targetCollisions[this.nbTargetCollision].target_desc = tDesc;
        this.targetCollisions[this.nbTargetCollision].target_cdi = tcdi; 

        this.nbTargetCollision++;*/
    }
}


