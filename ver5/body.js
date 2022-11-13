// Easy3D_WebGL
// Rigid body class for collision detection

// Emmanuel Charette 2019-2022

"use strict"


const CD_type = {  // p  r  nx ny nz lx ly lz pts
    NONE:       0, // 
    POINT:      1, // p
    SPHERE:     2, // p  r         
    CAPSULE:    3, // p  r     n        l
    EDGE:       4, // p        n        l
    INFPLANE:   5, // p        n      
    PLANE:      6, // p  r? nw n  nh lw    lh
    BLBOX:      7, // p  r  nx ny nz lx ly lz 4p
    BOX:        8, // p  r  nx ny nz lx ly lz 8p
    TRI:        9 /// n     p1 p2 p3 do d2 d3   
}
const CD_type_strings = [ "None", "Point", "Sphere", "Capsule", "Edge", "Infinite Plane", "Plane", "Bottomless Box", "Box", "Triangle" ];

//TODO default orientation on X-Z plane, up following Y axis

const CD_mode = {
    STATIC:     0, // dosent move, affect dynamic (physics) and controlled (block)
    DYNAMIC:    1, // can move (physics), affect dynamic, react to static, dynamic, controlled
    CONTROLLED: 2  // can be moved, affect dynamic, react to static and controlled (block, rubberband)
}
const CD_mode_strings = [ "Static", "Dynamic", "Controlled" ]; 

// Index constant for CD data
const CD_boxEdge = {
    TopBack   : 0,    TopRight   : 1,    TopFront   : 2,    TopLeft   : 3,
    BackRight : 4,    FrontRight : 5,    FrontLeft  : 6,    BackLeft  : 7,
    BottomBack: 8,    BottomRight: 9,    BottomFront: 10,   BottomLeft: 11
}
const CD_boxCorner = {
    TopBackRight   : 0,    TopFrontRight   : 1,    TopFrontLeft   : 2,    TopBackLeft   : 3,
    BottomBackRight: 4,    BottomFrontRight: 5,    BottomFrontLeft: 6,    BottomBackLeft: 7
}

class E3D_body {
    constructor(mode) {
        this.index = -1; // index in global stores to back-reference other information
        
        this.mode = mode;

        this.pDelta = v3_new(); // entity position delta vector
        this.deltaLength = -1;  // length of this.pDelta during animation step for culling and interpolation
        this.effectiveSpeed = [0.0, 0.0, 0.0];

        //this.lastHitTarget = -1; should be in HIT ?


        this.parts = []; // list of CD_type.point .edge .sph .plane .box etc
        
        this.p0 = []; // center position
        this.p = [];

        this.r = []; // radius

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
                    v3_applym4_res(this.p[i], this.p0[i], normalMatrix);
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
        let idx = this.parts.push(CD_type.POINT)-1;
        this.p0[idx] = v3_clone(p);
        this.p[idx]  = v3_clone(p);
    }

    pushCD_sphere(p, r) {
        let idx = this.parts.push(CD_type.SPHERE)-1;
        this.p0[idx] = v3_clone(p);
        this.p[idx]  = v3_clone(p);
        this.r[idx] = r;
    }

    pushCD_capsule(p, n, r, l) {
        let idx = this.parts.push(CD_type.CAPSULE)-1;
        this.p0[idx]  = v3_clone(p);
        this.p[idx]   = v3_clone(p);
        this.ny0[idx] = v3_clone(n);
        this.ny[idx]  = v3_clone(n);
        this.r[idx]   = r;
        this.ly[idx]  = l;
    }
    pushCD_capsule2p(p1, p2, r) {
        let seg = v3_unpack(p1, p2);
        this.pushCD_capsule(p1, seg.normal, r, seg.length);
    }

    pushCD_edge(p, n, l) {
        let idx = this.parts.push(CD_type.EDGE)-1;
        this.p0[idx]  = v3_clone(p);
        this.p[idx]   = v3_clone(p);
        this.ny0[idx] = v3_clone(n);
        this.ny[idx]  = v3_clone(n);
        this.ly[idx]  = l;
    }
    pushCD_edge2p(p1, p2) {
        let seg = v3_unpack(p1, p2);
        this.pushCD_edge(p1, seg.normal, seg.length);
    }

    pushCD_infPlane(p, n) {
        let idx = this.parts.push(CD_type.INFPLANE)-1;
        this.p0[idx]  = v3_clone(p);
        this.p[idx]   = v3_clone(p);
        this.ny0[idx] = v3_clone(n);
        this.ny[idx]  = v3_clone(n);
    }

    pushCD_plane(p, n, right_n, front_n, width, depth, addEdges = false) {
        let idx = this.parts.push(CD_type.PLANE)-1;
        this.p0[idx]  = v3_clone(p); // position offset of plane
        this.p[idx]   = v3_clone(p);        
        this.ny0[idx] = v3_clone(n); // normal of plane face
        this.ny[idx]  = v3_clone(n);

        this.nx0[idx] = v3_clone(right_n); // width normal
        this.nx[idx]  = v3_clone(right_n);
        this.lx[idx]  = width  / 2.0;

        this.nz0[idx] = v3_clone(front_n); // depth
        this.nz[idx]  = v3_clone(front_n);
        this.lz[idx]  = depth / 2.0;

        if (addEdges) {
            let p1 = v3_addscaledaddscaled_new(p, right_n, -0.5 * width, front_n, -0.5 * depth);
            let p2 = v3_addscaledaddscaled_new(p, right_n,  0.5 * width, front_n, -0.5 * depth);
            this.pushCD_edge2p(p1, p2);
            v3_addscaled_res(p1, p2, front_n, depth);
            this.pushCD_edge2p(p2, p1);
            v3_addscaled_res(p2, p1, hw, -width);
            this.pushCD_edge2p(p1, p2);
            v3_addscaled_res(p1, p2, front_n, -depth);
            this.pushCD_edge2p(p2, p1);
        }
    }
    pushCD_plane3p(TL, TR, BL, addEdges = false) {
        let n = v3_normal_new(TL, TR, BL);
        let p = v3_addscaled_new(TL, TR, 0.5);
        v3_addscaled_mod(p, BL, 0.5);
        let segw = v3_unpack(TL, TR);
        let segh = v3_unpack(TL, BL);
        this.pushCD_plane(p, n, segw.normal, segh.normal, segw.length, segh.length, addEdges);
    }

    pushCD_box(p, right_n, up_n, front_n, width, height, depth, bottom = true) {
        let idx = this.parts.push( (bottom) ? CD_type.BOX : CD_type.BLBOX )-1;

        let hwidth  = width  / 2.0;
        let hheight = height / 2.0;
        let hdepth  = depth  / 2.0;

        this.p0[idx]  = v3_clone(p);
        this.p[idx]   = v3_clone(p);

        this.nx0[idx] = v3_clone(right_n);
        this.nx[idx]  = v3_clone(right_n);
        this.ny0[idx] = v3_clone(up_n);
        this.ny[idx]  = v3_clone(up_n);
        this.nz0[idx] = v3_clone(front_n);
        this.nz[idx]  = v3_clone(front_n);

        this.lx[idx] = hwidth;
        this.ly[idx] = hheight;
        this.lz[idx] = hdepth; 

        // create the corner vertex
        // scale normal by half dim
        var px = v3_scale_new(right_n,  hwidth);
        var mx = v3_scale_new(right_n, -hwidth);

        var py = v3_scale_new(up_n,  hheight);
        var my = v3_scale_new(up_n, -hheight);

        var pz = v3_scale_new(front_n,  hdepth);
        var mz = v3_scale_new(front_n, -hdepth);

        this.p0list[idx] = [];

        // top
        this.p0list[idx][CD_boxCorner.TopBackRight]  = v3_addaddadd_new(p, py, px, mz);
        this.p0list[idx][CD_boxCorner.TopFrontRight] = v3_addaddadd_new(p, py, px, pz);
        this.p0list[idx][CD_boxCorner.TopFrontLeft]  = v3_addaddadd_new(p, py, mx, pz);
        this.p0list[idx][CD_boxCorner.TopBackLeft]   = v3_addaddadd_new(p, py, mx, mz);

        if (bottom) {
            this.p0list[idx][CD_boxCorner.BottomBackRight]  = v3_addaddadd_new(p, my, px, mz);
            this.p0list[idx][CD_boxCorner.BottomFrontRight] = v3_addaddadd_new(p, my, px, pz);
            this.p0list[idx][CD_boxCorner.BottomFrontLeft]  = v3_addaddadd_new(p, my, mx, pz);
            this.p0list[idx][CD_boxCorner.BottomBackLeft]   = v3_addaddadd_new(p, my, mx, mz);
        }

        this.plist[idx] = v3a_clone(this.p0list[idx]);

        this.r[idx] = Math.sqrt(hwidth*hwidth + hheight*hheight + hdepth*hdepth);
    }
    
    pushCD_triangle(p1, p2 ,p3, addEdges = false) {
        let idx = this.parts.push(CD_type.TRI)-1;

        let p2p1 = v3_sub_new(p2, p1);
        let p3p1 = v3_sub_new(p3, p1);

        this.p0[idx] = v3_normal_new(p1, p2, p3);
        this.p[idx]  = v3_clone(this.p0[idx]);

        this.nx0[idx] = v3_clone(p1);
        this.nx[idx]  = v3_clone(p1);
        this.ny0[idx] = v3_clone(p2p1);
        this.ny[idx]  = v3_clone(p2p1);        
        this.nz0[idx] = v3_clone(p3p1);
        this.nz[idx]  = v3_clone(p3p1);

        this.lx[idx] = v3_dot(p2p1, p3p1);
        this.ly[idx] = v3_lengthsquared(p2p1);
        this.lz[idx] = v3_lengthsquared(p3p1);

        if (addEdges) {
            this.pushCD_edge2p(p1, p2);
            this.pushCD_edge2p(p2, p3);
            this.pushCD_edge2p(p3, p1);
        }
    }
    


    cloneData(targetCDdata) {
        this.clear();
        for (var i = 0; i < targetCDdata.parts.length; ++i) {
            switch (targetCDdata[i].parts) {
                case CD_type.POINT:
                    this.pushCD_point(targetCDdata[i].p0);
                    break;
                case CD_type.SPHERE:
                    this.pushCD_sphere(targetCDdata[i].p0, targetCDdata[i].r);
                    break;
                case CD_type.CAPSULE:
                    this.pushCD_capsule(targetCDdata[i].p0, targetCDdata[i].ny0, targetCDdata[i].r, targetCDdata[i].ly);
                    break;
                case CD_type.EDGE:
                    this.pushCD_edge(targetCDdata[i].p0, targetCDdata[i].ny0, targetCDdata[i].ly);
                    break;
                case CD_type.INFPLANE:
                    this.pushCD_infPlane(targetCDdata[i].p0, targetCDdata[i].ny0);
                    break;
                case CD_type.PLANE:
                    this.pushCD_plane(targetCDdata[i].p0, targetCDdata[i].ny0, targetCDdata[i].nx0, targetCDdata[i].nz0, targetCDdata[i].lx / 2.0, targetCDdata[i].lz / 2.0);
                    break;
                case CD_type.BLBOX:
                    this.pushCD_box(targetCDdata[i].p0, targetCDdata[i].nx0, targetCDdata[i].ny0, targetCDdata[i].nz0,
                        targetCDdata[i].lx * 2.0, targetCDdata[i].ly * 2.0, targetCDdata[i].lz * 2.0, false);
                    break;
                case CD_type.BOX:
                    this.pushCD_box(targetCDdata[i].p0, targetCDdata[i].nx0, targetCDdata[i].ny0, targetCDdata[i].nz0,
                        targetCDdata[i].lx * 2.0, targetCDdata[i].ly * 2.0, targetCDdata[i].lz * 2.0, true);
                    break;
                case CD_type.TRI:
                    this.pushCD_triangle(targetCDdata[i].nx0, v3_add_new(targetCDdata[i].nx0, targetCDdata[i].ny0), v3_add_new(targetCDdata[i].nx0, targetCDdata[i].nz0));
                    break;
            }
        }
    }

    clear() {
        this.parts = [];
        this.p0 = [];
        this.p = [];
        this.r = [];
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
