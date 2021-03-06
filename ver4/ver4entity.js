// Easy3D_WebGL
// Entities classes ontaining mesh data, hit testing and matrix controls
// Emmanuel Charette 2017-2020

"use strict"


// Base class for static entity, optionnally dynamic
class E3D_entity {
    constructor(id, filename, dynamic = false) {

        this.id = id; // to find object in list
        this.visible = false;
        this.dynamic = dynamic; // Static (non-dynamic) entities have their data pushed to the GPU memory only once when added to scene.
                                // Dynamic entities can have their data modified on the fly (with performance cost).

        this.dataContentChanged = false; // GPU buffers will be updated  
        this.dataSizeChanged = true; // GPU buffers will be reset and updated

        // Properties
        this.position = v3_new();
        this.rotation = v3_new();

        // fustrum culling
        this.vis_culling = true; // Setting to false will force the entity to always be redrawn
        this.cull_dist = 0; // maximum vertex distance from object center for culling
        
        // Computed matrix
        this.modelMatrix = m4_new();
        this.normalMatrix = m4_new();

        // Data
        this.numElements = 0; // Actual number of vertices to draw.
        this.drawMode = 4;

        // GL buffer data stores
        // TODO: combine to single data store (v1 v2 v3 n1 n2 n3 u  v  pad = face // smooth shaded
        //                                      3  3  3  3  3  3 1  1  4   = (20) 24 float = 96 bytes
        //    in color mode instead of texture v1 v2 v3 n1 n2 n3 r  g  b  a (22) 24
        //    stroke mode                      v1 v2  c pad // 8 float = 32 bytes
        //    face flat shaded textured        v1 v2 v3 n  u  v    14 floats
        //    face flat shaded color           v1 v2 v3 n  r g b a 16 floats

        // _dataOffset_v1 = 0
        // _dataOffset_v2 = 3
        // _dataOffset_v3 = 6
        // _dataOffset_n1 = 9
        // _dataOffset_n2 = 12
        // _dataOffset_n3 = 15

        // _dataOffset_u = 18
        // _dataOffset_v = 19
        // _dataOffsetDummy = 20 21 22 23

        // _dataOffset_r = 18
        // _dataOffset_g = 19
        // _dataOffset_b = 20
        // _dataOffset_a = 21
        // _dataOffsetDummy = 22 23

        this.vertexBuffer;
        this.normalBuffer;
        this.colorBuffer; // TODO replace by texture
        //this.uvBuffer;
        this.strokeIndexBuffer;

        // float32Array of raw data, can be flushed for static entities 
        this.vertexArray; 
        this.normalArray;
        this.colorArray;
        this.strokeIndexArray = new Uint16Array(0);

        this.drawStrokes = false;
        this.numStrokeElements = 0;

        //this.textureID = ""; // todo        
        this.filename = filename;


        // Animation
        this.animIndex = -1;

        this.collisionDetection = false;
        // TODO isDynamic
        // TODO isVisibiltyCullable
        // TODO isVisible
        // TODO isAnimated
        // TODO isCollisionSource
        // TODO isCollisionTarget
        // TODO isCollisionFragmented // CD object is a list of multiple CD object with sph pre-cull
        // TODO isTransparent // z-sort before render, dont write to depth buffer
     

        // TODO CD shapes as object

        // TODO new CD shapes:
        /*
            CD_point
                Source
                Interpolate as vector

            CD_edge
                Source and Target
                Interpolate as plane

            CD_sphere
                Source and Target
                Interpolate as capsule

            CD_capsule ???
                Source and Target
                Interpolate as plane with radius ???
                
            CD_triangle
                Source and Target
                Interpolated first in capsule with other triangles

            CD_plane
                Target
                No Interpolation (static)
                
            CD_box (not aligned)
                Target
                No Interpolation (static)
                optional bottom (dont CD bottom plane and 4 bottom edges)
        */

        // Collision Detection / Hit Test Data (faster split in different array than accessing single object.array[i].property)

            // Point Source
            this.CD_point = 0;
            this.CD_point_p0 = []; // original to model space
            this.CD_point_p  = []; // transformed to world space

            // Edge Target
            this.CD_edge = 0;
            this.CD_edge_p0 = []; // original to model space
            this.CD_edge_p  = []; // transformed to world space
            this.CD_edge_n0 = []; // original to model space
            this.CD_edge_n  = []; // transformed to world space (rotation)
            this.CD_edge_l  = [];

            // Sphere Source/Target
            this.CD_sph = 0;
            this.CD_sph_p0 = []; // original to model space
            this.CD_sph_p  = []; // transformed to world space
            this.CD_sph_r  = []; // radius
            this.CD_sph_rs = []; // radius squared

            // Plane Target, on X-Y plane
            this.CD_plane = 0;
            this.CD_plane_p0 = []; // center position original to model space
            this.CD_plane_p  = []; // transformed to world space
            this.CD_plane_n0 = []; // surface normal original to model space
            this.CD_plane_n  = []; // surface normal transformed to world space (rotation)
            this.CD_plane_w0 = []; // half-width normal original to model space
            this.CD_plane_w  = []; // half-width normal transformed to world space (rotation)
            this.CD_plane_h0 = []; // half-height normal original to model space
            this.CD_plane_h  = []; // half-height normal transformed to world space (rotation)
            this.CD_plane_halfWidth  = [];
            this.CD_plane_halfHeight = [];

            // Box Target 
            this.CD_box = 0;
            this.CD_box_p0 = []; // center position original to model space
            this.CD_box_p  = []; // transformed to world space
            this.CD_box_x0 = []; // width normal X original to model space
            this.CD_box_x  = []; // transformed to world space (rotation)
            this.CD_box_y0 = []; // height normal Y original to model space
            this.CD_box_y  = []; // transformed to world space (rotation)
            this.CD_box_z0 = []; // depth normal Z original to model space
            this.CD_box_z  = []; // transformed to world space (rotation)

            this.CD_box_bottom = []; // bool to include bottom face and edges

            this.CD_box_edge_p0 = []; // 8 box edges corners pos in model space
            this.CD_box_edge_p  = []; // pos in world space
 
            this.CD_box_halfWidth  = []; //x
            this.CD_box_halfHeight = []; //y
            this.CD_box_halfDepth  = []; //z 
            
            this.CD_box_preCull_r = [];

            // Triangle Target
            this.CD_triangle = 0;
            this.CD_triangle_n0 = [];  // original to model space
            this.CD_triangle_n  = [];  // transformed to world space (rotation)
            this.CD_triangle_p10 = []; // original to model space
            this.CD_triangle_p1  = []; // transformed to world space

            this.CD_triangle_p3p10 = []; // original to model space
            this.CD_triangle_p3p1 = []; // original to model space (rotation)
            this.CD_triangle_p2p10  = []; // transformed to world space
            this.CD_triangle_p2p1  = []; // transformed to world space (rotation)

            this.CD_triangle_p3p1lenSq = [];
            this.CD_triangle_p2p1lenSq = [];
            this.CD_triangle_p3p2p1dot = [];

        this.resetMatrix();
    } 

    cloneData(entity) {
        this.numElements = entity.numElements;
        this.drawMode = entity.drawMode;
        this.vis_culling = entity.vis_culling;
        this.collisionDetection = entity.collisionDetection;

        this.numStrokeElements = entity.numStrokeElements;
        this.drawStrokes = entity.drawStrokes;

        if (entity.dynamic) {
            this.vertexArray = new Float32Array(entity.vertexArray); 
            this.normalArray = new Float32Array(entity.normalArray);
            this.colorArray = new Float32Array(entity.colorArray);
            this.strokeIndexArray = new Uint16Array(entity.strokeIndexArray);
        } else {
            this.vertexBuffer = entity.vertexBuffer;
            this.normalBuffer = entity.normalBuffer;
            this.colorBuffer = entity.colorBuffer;
            this.strokeIndexBuffer = entity.strokeIndexBuffer;
        }

        this.cull_dist = entity.cull_dist;

        if (entity.CD_point > 0) {
            this.CD_point = entity.CD_point;
            this.CD_point_p0 = v3a_clone(entity.CD_point_p0);
            this.CD_point_p  = v3a_clone(entity.CD_point_p);
        }
        if (entity.CD_edge > 0) {
            this.CD_edge = entity.CD_edge;
            this.CD_edge_p0 = v3a_clone(entity.CD_edge_p0);
            this.CD_edge_p  = v3a_clone(entity.CD_edge_p);
            this.CD_edge_n0 = v3a_clone(entity.CD_edge_n0);
            this.CD_edge_n  = v3a_clone(entity.CD_edge_n);
            this.CD_edge_l  = entity.CD_edge_l.slice();
        }
        if (entity.CD_sph > 0) {
            this.CD_sph = entity.CD_sph;
            this.CD_sph_p0 = v3a_clone(entity.CD_sph_p0);
            this.CD_sph_p = v3a_clone(entity.CD_sph_p);
            this.CD_sph_r = entity.CD_sph_r.slice();
            this.CD_sph_rs = entity.CD_sph_rs.slice();
        }
        if (entity.CD_plane > 0) {
            this.CD_plane = entity.CD_plane;
            this.CD_plane_p0 = v3a_clone(entity.CD_plane_p0);
            this.CD_plane_p  = v3a_clone(entity.CD_plane_p);
            this.CD_plane_n0 = v3a_clone(entity.CD_plane_n0);
            this.CD_plane_n  = v3a_clone(entity.CD_plane_n);
            this.CD_plane_w0 = v3a_clone(entity.CD_plane_w0);
            this.CD_plane_w  = v3a_clone(entity.CD_plane_w);
            this.CD_plane_h0 = v3a_clone(entity.CD_plane_h0);
            this.CD_plane_h  = v3a_clone(entity.CD_plane_h);
            this.CD_plane_halfWidth  = entity.CD_plane_halfWidth.slice();
            this.CD_plane_halfHeight = entity.CD_plane_halfHeight.slice();
        }
        if (entity.CD_box > 0) {
            this.CD_box = entity.CD_box;

            this.CD_box_p0  = v3a_clone(entity.CD_box_p0);
            this.CD_box_p = v3a_clone(entity.CD_box_p);
            this.CD_box_x0  = v3a_clone(entity.CD_box_x0);
            this.CD_box_x = v3a_clone(entity.CD_box_x);
            this.CD_box_y0  = v3a_clone(entity.CD_box_y0);
            this.CD_box_y = v3a_clone(entity.CD_box_y);
            this.CD_box_z0  = v3a_clone(entity.CD_box_z0);
            this.CD_box_z = v3a_clone(entity.CD_box_z);

            this.CD_box_bottom  = entity.CD_box_bottom.slice();

            this.CD_box_edge_p0 = v3a_clone(entity.CD_box_edge_p0);
            this.CD_box_edge_p = v3a_clone(entity.CD_box_edge_p);

            this.CD_box_halfWidth  = entity.CD_box_halfWidth.slice();
            this.CD_box_halfHeight = entity.CD_box_halfHeight.slice();            
            this.CD_box_halfDepth  = entity.CD_box_halfDepth.slice();

            this.CD_box_preCull_r  = entity.CD_box_preCull_r.slice();
        }

        if (entity.CD_triangle > 0) {

            this.CD_triangle = entity.CD_triangle;
            this.CD_triangle_p10 = v3a_clone(entity.CD_triangle_p10); 
            this.CD_triangle_p1  = v3a_clone(entity.CD_triangle_p1);
            this.CD_triangle_n0  = v3a_clone(entity.CD_triangle_n0); 
            this.CD_triangle_n   = v3a_clone(entity.CD_triangle_n); 

            this.CD_triangle_p3p10 = v3a_clone(entity.CD_triangle_p3p10); 
            this.CD_triangle_p2p10 = v3a_clone(entity.CD_triangle_p2p10); 
            this.CD_triangle_p3p1  = v3a_clone(entity.CD_triangle_p3p1); 
            this.CD_triangle_p2p1  = v3a_clone(entity.CD_triangle_p2p1); 
    
            this.CD_triangle_p3p1lenSq = entity.CD_triangle_p3p1lenSq.slice();
            this.CD_triangle_p2p1lenSq = entity.CD_triangle_p2p1lenSq.slice();
            this.CD_triangle_p3p2p1dot = entity.CD_triangle_p3p2p1dot.slice();
        }
    }

    // TODO add clear from context (buffers)
    clear() {
        this.visible = false;
        this.dataContentChanged = true; // GPU buffers will be updated  
        this.dataSizeChanged = true; // GPU buffers will be reset and updated

        // Properties
        this.position = v3_new();
        this.rotation = v3_new();

        // fustrum culling
        this.vis_culling = true; // Setting to false will force the entity to always be redrawn
        this.cull_dist = 0; // maximum vertex distance from object center for culling
        
        // Computed matrix
        this.modelMatrix = m4_new();
        this.normalMatrix = m4_new();

        // Data
        this.numElements = 0; // Actual number of vertices to draw.
        this.drawMode = 4;

        /*this.vertexBuffer;
        this.normalBuffer;
        this.colorBuffer; // TODO replace by texture
        //this.uvBuffer;
        this.strokeIndexBuffer;*/

        // float32Array of raw data, can be flushed for static entities 
        this.vertexArray = null; 
        this.normalArray = null;
        this.colorArray = null;
        this.strokeIndexArray = new Uint16Array(0);

        this.drawStrokes = false;
        this.numStrokeElements = 0;

        // Animation
        this.animIndex = -1;

        this.collisionDetection = false;

        this.CD_point = 0;
        this.CD_edge = 0;
        this.CD_sph = 0;
        this.CD_plane = 0;
        this.CD_box = 0;
        this.CD_triangle = 0;
    }


    moveTo(p){
        v3_copy(this.position, p);
    }
    moveBy(p){
        v3_add_mod(this.position, p);
    }
    moveByLocal(p){
        var offset = v3_applym4_new(p, this.normalMatrix);
        v3_add_mod(this.position, offset);
    }
    moveByParent(p, parent){
        var offset = v3_applym4_new(p, parent.normalMatrix);
        v3_add_mod(this.position, offset);
    }
    
    rotateTo(r){
        v3_copy(this.rotation, r);
    }
    rotateBy(r) {
        v3_add_mod(this.rotation, r);
    }
    rotateByLocal(r){
        var offset = v3_applym4_new(r, this.normalMatrix);
        v3_add_mod(this.rotation, offset);
    }
    rotateByParent(r, parent){
        var offset = v3_applym4_new(r, parent.normalMatrix);
        v3_add_mod(this.rotation, offset);
    }

    resetMatrix(){
        // Recreate matrices from rotation and position
        // TODO Evaluate rotation as Pitch Yaw Roll vs quaternion

        m4_rotationZ_res(this.normalMatrix, this.rotation[2]);
        m4_rotateX_mod(this.normalMatrix, this.rotation[0]);
        m4_rotateY_mod(this.normalMatrix, this.rotation[1]);
        m4_copy(this.modelMatrix, this.normalMatrix);
        this.modelMatrix[12] =  this.position[0];
        this.modelMatrix[13] =  this.position[1];
        this.modelMatrix[14] =  this.position[2];

        if (this.collisionDetection) { // TODO extract to own method, keep track of last positions with ref swapping
            for (var i = 0; i < this.CD_point; ++i) {
                v3_applym4_res(this.CD_point_p[i], this.CD_point_p0[i], this.modelMatrix);
            }
            for (var i = 0; i < this.CD_edge; ++i) {
                v3_applym4_res(this.CD_edge_p[i], this.CD_edge_p0[i], this.modelMatrix);
                v3_applym4_res(this.CD_edge_n[i], this.CD_edge_n0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_sph; ++i) {
                v3_applym4_res(this.CD_sph_p[i], this.CD_sph_p0[i], this.modelMatrix);
            }
            for (var i = 0; i < this.CD_plane; ++i) {
                v3_applym4_res(this.CD_plane_p[i], this.CD_plane_p0[i], this.modelMatrix);
                v3_applym4_res(this.CD_plane_n[i], this.CD_plane_n0[i], this.normalMatrix);
                v3_applym4_res(this.CD_plane_w[i], this.CD_plane_w0[i], this.normalMatrix);
                v3_applym4_res(this.CD_plane_h[i], this.CD_plane_h0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_box; ++i) {
                v3_applym4_res(this.CD_box_p[i], this.CD_box_p0[i], this.modelMatrix);
                v3_applym4_res(this.CD_box_x[i], this.CD_box_x0[i], this.normalMatrix);
                v3_applym4_res(this.CD_box_y[i], this.CD_box_y0[i], this.normalMatrix);
                v3_applym4_res(this.CD_box_z[i], this.CD_box_z0[i], this.normalMatrix);
                for (var j = 0; j < 8; ++j) v3_applym4_res(this.CD_box_edge_p[i][j], this.CD_box_edge_p0[i][j], this.modelMatrix);
            }
            
            for (var i = 0; i < this.CD_triangle; ++i) {
                v3_applym4_res(this.CD_triangle_n[i],  this.CD_triangle_n0[i],  this.normalMatrix);
                v3_applym4_res(this.CD_triangle_p1[i], this.CD_triangle_p10[i], this.modelMatrix);         
                v3_applym4_res(this.CD_triangle_p3p1[i], this.CD_triangle_p3p10[i],  this.normalMatrix); 
                v3_applym4_res(this.CD_triangle_p2p1[i], this.CD_triangle_p2p10[i],  this.normalMatrix); 
            }


        }
    }

    pushCD_point(p) {
        this.CD_point_p0[this.CD_point] = v3_clone(p);
        this.CD_point_p[this.CD_point] = v3_clone(p);
        
        //this.CD_vec_v0[this.CD_vec] = v3_clone(v);
        //this.CD_vec_v[this.CD_vec] = v3_clone(v);
        
        this.CD_point += 1;
        this.collisionDetection = true;
    }
    pushCD_edge(p, n, l) {
        this.CD_edge_p0[this.CD_edge] = v3_clone(p);
        this.CD_edge_p[this.CD_edge] = v3_clone(p);
        
        this.CD_edge_n0[this.CD_edge] = v3_clone(n);
        this.CD_edge_n[this.CD_edge] = v3_clone(n);

        this.CD_edge_l[this.CD_edge] = l;
        
        this.CD_edge += 1;
        this.collisionDetection = true;
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
        this.collisionDetection = true;
    }
    pushCD_sph(p, r) {
        this.CD_sph_p0[this.CD_sph] = v3_clone(p); 
        this.CD_sph_p[this.CD_sph] = v3_clone(p); 
        
        this.CD_sph_r[this.CD_sph] = r;
        this.CD_sph_rs[this.CD_sph] = r*r;
        
        this.CD_sph += 1;
        this.collisionDetection = true;
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
        this.collisionDetection = true;
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
        this.collisionDetection = true;


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
        this.collisionDetection = true;
    }

}


// 3 axis shown with optionnal vector. Wireframe rendering.
class E3D_entity_axis extends E3D_entity {
    constructor (id, showAxis, vectorScale, normalize) {
        super(id, "E3D_entity_axis/" + id, true);

        this.vectorScale = vectorScale;
        this.normalize = normalize;
        this.drawMode = 1; // gl.LINES;

        this.vis_culling = false;

        this.vertexArray = new Float32Array([0, 0, 0, 1, 0, 0,
                                             0, 0, 0, 0, 1, 0,
                                             0, 0, 0, 0, 0, 1,
                                             0, 0, 0, 1, 1, 1]);

        this.colorArray = new Float32Array([1, 0, 0, 1, 0, 0,
                                            0, 1, 0, 0, 1, 0,
                                            0, 0, 1, 0, 0, 1,
                                            1, 1, 1, 1, 1, 1 ]);

        this.normalArray = new Float32Array(24);
        this.numElements = (showAxis) ? 8 : 6;        
    }

    updateVector(vec) {
        let nv = v3_clone(vec);
        if (this.normalize) {
            v3_normalize_mod(nv);
        }
        v3_scale_mod(nv, this.vectorScale);
        this.vertexArray[21] = nv[0];
        this.vertexArray[22] = nv[1];
        this.vertexArray[23] = nv[2];

        this.dataContentChanged = true;
    }
}


// Entity which data is re-processed each frame, can be modified on the fly in code. Wireframe rendering.
class E3D_entity_wireframe_canvas extends E3D_entity {
    constructor(id, finiteSize = false) {
        super(id, "E3D_entity_wireframe_canvas/"+id, true);
        this.drawMode = 1; // gl.LINES;      
        this.arraySize = 512;
        this.arrayIncrement = 512; // 256 lines

        this.vertexArray = new Float32Array(this.arraySize*3);
        this.colorArray = new Float32Array(this.arraySize*3);
        this.normalArray = new Float32Array(this.arraySize*3);

        this.colSweep =  [ [1,0,0], [1,1,0] ,[0,1,0] ,[0,1,1] ,[0,0,1], [1,0,1] ];
        this.colSweepIndex = 0;

        this.currentPos = [ 0, 0, 0 ];

        this.finiteSize = finiteSize;
        this.arrayIndex = 0;
        this.currentColor = _v3_white;
    }

    setSize(nElements) {        
        this.increaseSize(nElements - this.numElements);
    }

    increaseSize(by = 1) {
        if (by < 0) throw "Cannot increase size by negative value";

        if (this.arraySize >= (this.numElements + by)) {
            this.numElements += by;
        } else {
            if (this.numElements > 0) {     
                
                let end = this.numElements * 3;

                this.arraySize += Math.ceil(by / this.arrayIncrement) * this.arrayIncrement;
                this.numElements += by;

                let oldV = this.vertexArray.subarray(0, end);
                let oldC = this.colorArray.subarray(0, end);
                let oldN = this.normalArray.subarray(0, end);
                
                this.vertexArray = new Float32Array(this.arraySize * 3);
                this.colorArray  = new Float32Array(this.arraySize * 3);
                this.normalArray = new Float32Array(this.arraySize * 3);
                
                this.vertexArray.set(oldV, 0);
                this.colorArray.set( oldC, 0);
                this.normalArray.set(oldN, 0);
                
            } else {
                this.numElements = by; 
                this.arraySize = Math.ceil(by / this.arrayIncrement) * this.arrayIncrement;
                this.vertexArray = new Float32Array(this.arraySize * 3);
                this.colorArray  = new Float32Array(this.arraySize * 3);
                this.normalArray = new Float32Array(this.arraySize * 3);
            }
        }
        this.dataSizeChanged = true;
    }
    
    clear() {
        this.numElements = 0;
        this.dataContentChanged = true;

        this.CD_point = 0;
        this.CD_edge = 0;
        this.CD_sph = 0;
        this.CD_plane = 0;
        this.CD_box = 0;
        this.CD_triangle = 0;
        this.collisionDetection = false;

        this.arrayIndex = 0;
    }

    getColor3f(elem) {
        return this.colorArray.subarray(elem*3, (elem+1)*3);
    }    
    setColor3f(elem, col) {
        this.colorArray.set(col, elem * 3);
        this.dataContentChanged = true;
    }
    
    getNormal3f(elem) {
        return this.normalArray.subarray(elem*3, (elem+1)*3);
    }    
    setNormal3f(elem, norm) {
        this.normalArray.set(norm, elem*3);
        this.dataContentChanged = true;
    }
    
    getVertex3f(elem) {
        return this.vertexArray.subarray(elem*3, (elem+1)*3);
    }    
    setVertex3f(elem, vert) {
        this.vertexArray.set(vert, elem*3);
        this.dataContentChanged = true;
    }

    addV(vert) {
        if (this.arrayIndex >= this.numElements) this.increaseSize();
        this.setVertex3f(this.arrayIndex, vert);
        this.setColor3f(this.arrayIndex, this.currentColor);
        this.arrayIndex++;
        if ((this.finiteSize != false) && (this.arrayIndex >= this.finiteSize)) this.arrayIndex = 0;
    }
    addVC(vert, col) {
        if (this.arrayIndex >= this.numElements) this.increaseSize();
        this.setVertex3f(this.arrayIndex, vert);
        this.setColor3f(this.arrayIndex, col);
        this.arrayIndex++;
        if ((this.finiteSize != false) && (this.arrayIndex >= this.finiteSize)) this.arrayIndex = 0;
    }
    addVCN(vert, col, norm) {
        if (this.arrayIndex >= this.numElements) this.increaseSize();
        this.setVertex3f(this.arrayIndex, vert);
        this.setColor3f(this.arrayIndex, col);
        this.setNormal3f(this.arrayIndex, norm);
        this.arrayIndex++;
        if ((this.finiteSize != false) && (this.arrayIndex > this.finiteSize)) this.arrayIndex = 0;
    }
    addVN(vert, norm) {
        if (this.arrayIndex >= this.numElements) this.increaseSize();
        this.setVertex3f(this.arrayIndex, vert);
        this.setColor3f(this.arrayIndex, this.currentColor);
        this.setNormal3f(this.arrayIndex, norm);
        this.arrayIndex++;
        if ((this.finiteSize != false) && (this.arrayIndex >= this.finiteSize)) this.arrayIndex = 0;
    }

    addWireSphere(location, dia, color, sides, addSphCD = false, numSegments = 1) {

        dia = dia / 2;
        if (addSphCD) this.pushCD_sph(location, dia);
        this.currentColor = color;

        var baseOffset = PIdiv2 / numSegments;

        var matX = m4_new();
        var matY = m4_new();
        var matZ = m4_new();
        
        for (var offsetIndex = 1; offsetIndex <= numSegments; ++offsetIndex) {
          
            var si = Math.sin(0) * dia;
            var ci = Math.cos(0) * dia;
          
            var offsetAngle = baseOffset + (2 * offsetIndex * PIdiv2 / numSegments);
          
            m4_rotationX_res(matX, offsetAngle);
            m4_rotationY_res(matY, offsetAngle);
            m4_rotationZ_res(matZ, offsetAngle); 
            
            var newLoc = v3_new();

            for (var i = 0; i < sides; ++i) { 

                var sip = Math.sin((i+1) * PIx2 / sides) * dia;
                var cip = Math.cos((i+1) * PIx2 / sides) * dia;

                //x
                var v = [0, si, ci];
                v3_applym4_mod(v, matY);
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);

                v = [0, sip, cip];
                v3_applym4_mod(v, matY);
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);
   
                
                //y
                v = [si, 0, ci];
                v3_applym4_mod(v, matZ);
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);

                v = [sip, 0, cip];
                v3_applym4_mod(v, matZ);
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);


                //z
                v = [si, ci, 0];
                v3_applym4_mod(v, matX);
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);

                v = [sip, cip, 0];
                v3_applym4_mod(v, matX);
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);

                si = sip;
                ci = cip;
            }
        }
    }
        
    addWireCross(location, size, color = [1,1,1]) {
        size = size / 2;
        this.currentColor = color;

        this.addV( [ location[0] + size, location[1], location[2] ] );
        this.addV( [ location[0] - size, location[1], location[2] ] );

        this.addV( [ location[0], location[1] + size, location[2] ] );
        this.addV( [ location[0], location[1] - size, location[2] ] );

        this.addV( [ location[0], location[1], location[2] + size ] );
        this.addV( [ location[0], location[1], location[2] - size ] );
    }

    addPlane(pos, rot, width, height, numSubdiv, color = [1,1,1], addCD = false) {
        this.currentColor = color;

        width = width / 2;
        height = height / 2;

        let p0 = [ width, height, 0];
        let p1 = [ width,-height, 0];
        let p2 = [-width,-height, 0];
        let p3 = [-width, height, 0];
        
        let m = m4_translation_new(pos);
        m4_rotateZ_mod(m, rot[2]);
        m4_rotateX_mod(m, rot[0]);
        m4_rotateY_mod(m, rot[1]);

        v3_applym4_mod(p0, m);
        v3_applym4_mod(p1, m);
        v3_applym4_mod(p2, m);
        v3_applym4_mod(p3, m);

        
        // around
        this.addV(p0);
        this.addV(p1);

        this.addV(p1);
        this.addV(p2);

        this.addV(p2);
        this.addV(p3);

        this.addV(p3);  
        this.addV(p0);

        if (numSubdiv == -1) {
            // X
            this.addV(p0);
            this.addV(p2);

            this.addV(p1);
            this.addV(p3);
        }

        if (numSubdiv > 0) {
            let a = [0,0,0];
            let b = [0,0,0];
            let c = [0,0,0];
            let d = [0,0,0];

            for (var i = 0; i < numSubdiv; ++i){

                let t = (i + 1) / (numSubdiv + 1);

                v3_lerp_res(a, p1, p0, t);
                v3_lerp_res(b, p2, p3, t);

                v3_lerp_res(c, p1, p2, t);
                v3_lerp_res(d, p0, p3, t);

                this.addV(a);
                this.addV(b); 

                this.addV(c);
                this.addV(d);
            }
        } 

        if (addCD) {

            let n = [0, 0, 1];
            let w = [1, 0, 0];
            let h = [0, 1, 0];

            let rm = m4_rotationZ_new(rot[2]);
            m4_rotateX_mod(rm, rot[0]);
            m4_rotateY_mod(rm, rot[1]);

            v3_applym4_mod(n, rm);
            v3_applym4_mod(w, rm);
            v3_applym4_mod(h, rm);

            this.pushCD_plane(pos, n, w, h, width, height);

            let p = [-width, height, 0];
            n = [1, 0, 0];
            v3_applym4_mod(p, m);
            v3_applym4_mod(n, rm);

            this.pushCD_edge(p, n, width * 2);

            p = [-width, -height, 0];
            v3_applym4_mod(p, m);

            this.pushCD_edge(p, n, width * 2);

            p = [-width, -height, 0];
            n = [0, 1, 0];
            v3_applym4_mod(p, m);
            v3_applym4_mod(n, rm);
            this.pushCD_edge(p, n, height * 2);

            p = [width, -height, 0];
            v3_applym4_mod(p, m);
            this.pushCD_edge(p, n, height * 2);

        }
    }

    addCylinder(location, dia, height, color, sides = 8, sideLineStep = 1, sections = 1, addCD = false) {
        this.currentColor = color;
        dia = dia / 2;
        if (sections < 1) sections = 1;

        var si = Math.sin(0) * dia;
        var ci = Math.cos(0) * dia;

        var newLoc = v3_new();
          
        for (var i = 0; i < sides; ++i) { 

            var sip = Math.sin((i+1) * PIx2 / sides) * dia;
            var cip = Math.cos((i+1) * PIx2 / sides) * dia;

            // base
            var v = [si, 0, ci];
            v3_add_res(newLoc, v, location);
            this.addV(newLoc);

            v = [sip, 0, cip];
            v3_add_res(newLoc, v, location);
            this.addV(newLoc);
 
            
            // top
            v = [si, height, ci];  
            v3_add_res(newLoc, v, location);
            this.addV(newLoc);  

            v = [sip, height, cip];            
            v3_add_res(newLoc, v, location);
            this.addV(newLoc);
    

            if ( (sideLineStep > 0) && ((i % sideLineStep) == 0) ) {
                // side
                v = [si, 0, ci];    
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);

                v = [si, height, ci];
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);
            }

            for (var j = 1; j < sections; ++j) {

                var v = [si, j * height / sections, ci];
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);

                v = [sip, j * height / sections, cip];
                v3_add_res(newLoc, v, location);
                this.addV(newLoc);
            }

            si = sip;
            ci = cip;
  
        }

    }


    getNextSweepColor() {
        this.colSweepIndex++;
        if (this.colSweepIndex >= this.colSweep.length)  this.colSweepIndex = 0;
        return this.colSweep[this.colSweepIndex];
    }

    moveCursorTo (p) {
        v3_copy(this.currentPos, p);
    }
    moveCursorBy (p) {
        v3_add_mod(this.currentPos, p);
    }

    addLineTo(p, sweep, col= [1,1,1]) {
        var color = (sweep) ? this.getNextSweepColor() : col;

        this.addVC(this.currentPos, color);
        this.addVC(p, color);

        v3_copy(this.currentPos, p);
    }

    addLine(p0, p1, sweep, col= [1,1,1]) {
        var color = (sweep) ? this.getNextSweepColor() : col;

        this.addVC(p0, color);
        this.addVC(p1, color);
    }


    addLineByOffset(p, sweep, col= [1,1,1]) {
        var color = (sweep) ? this.getNextSweepColor() : col;

        this.addVC(this.currentPos, color);

        v3_add_mod(this.currentPos, p);

        this.addVC(this.currentPos, color);  
    }

    addLineByNormalAndLength(n, l, sweep, col= [1,1,1]) {
        var color = (sweep) ? this.getNextSweepColor() : col;

        this.addVC(this.currentPos, color);

        v3_addscaled_mod(this.currentPos, n, l);

        this.addVC(this.currentPos, color);
    }

    
    addLineByPosNormLen(p, n, l, sweep, col= [1,1,1]) {
        var color = (sweep) ? this.getNextSweepColor() : col;

        v3_copy(this.currentPos, p);
        this.addVC(this.currentPos, color);

        v3_addscaled_mod(this.currentPos, n, l);

        this.addVC(this.currentPos, color);
    }

    addWireCube(loc, rot, size, color, addBoxCD, centerCross = false, sideCross = false) {
        size[0] = Math.abs(size[0]) / 2;
        size[1] = Math.abs(size[1]) / 2;
        size[2] = Math.abs(size[2]) / 2;

        let m = m4_translation_new(loc);
       
        m4_rotateZ_mod(m, rot[2]);
        m4_rotateX_mod(m, rot[0]);
        m4_rotateY_mod(m, rot[1]);

        let tfr = [size[0], size[1], size[2]];
        let tfl = [-size[0], size[1], size[2]];
        let trr = [size[0], size[1], -size[2]];
        let trl = [-size[0], size[1], -size[2]];

        let bfr = [size[0], -size[1], size[2]];
        let bfl = [-size[0], -size[1], size[2]];
        let brr = [size[0], -size[1], -size[2]];
        let brl = [-size[0], -size[1], -size[2]];

        v3_applym4_mod(tfr, m);
        v3_applym4_mod(tfl, m);
        v3_applym4_mod(trr, m);
        v3_applym4_mod(trl, m);

        v3_applym4_mod(bfr, m);
        v3_applym4_mod(bfl, m);
        v3_applym4_mod(brr, m);
        v3_applym4_mod(brl, m);

         this.addLine(tfr, tfl, false, color);
         this.addLine(tfl, trl, false, color);
         this.addLine(trl, trr, false, color);
         this.addLine(trr, tfr, false, color);

         this.addLine(bfr, bfl, false, color);
         this.addLine(bfl, brl, false, color);
         this.addLine(brl, brr, false, color);
         this.addLine(brr, bfr, false, color);

         this.addLine(tfr, bfr, false, color);
         this.addLine(tfl, bfl, false, color);
         this.addLine(trl, brl, false, color);
         this.addLine(trr, brr, false, color);

        if (centerCross) {
            this.addLine(tfr, brl, false, color);
            this.addLine(tfl, brr, false, color);
            this.addLine(trl, bfr, false, color);
            this.addLine(trr, bfl, false, color);
        }
        if (sideCross) {
            this.addLine(tfr, bfl, false, color); //f
            this.addLine(tfl, bfr, false, color);

            this.addLine(tfr, brr, false, color); //ri
            this.addLine(trr, bfr, false, color);

            this.addLine(tfl, brl, false, color);//l
            this.addLine(trl, bfl, false, color);

            this.addLine(trl, brr, false, color);//re
            this.addLine(trr, brl, false, color);

            this.addLine(tfr, trl, false, color);//t
            this.addLine(tfl, trr, false, color);

            this.addLine(brl, bfr, false, color); //b
            this.addLine(brr, bfl, false, color);
        }
        if (addBoxCD) {

            let x = [1, 0, 0];
            let y = [0, 1, 0];
            let z = [0, 0, 1];

            m = m4_rotationZ_new(rot[2]);
            m4_rotateX_mod(m, rot[0]);
            m4_rotateY_mod(m, rot[1]);

            v3_applym4_mod(x, m);
            v3_applym4_mod(y, m);
            v3_applym4_mod(z, m);

            this.pushCD_box(loc, x, y, z, size[0], size[1], size[2], true); 
        }
    }


    addTriangle(p1, p2, p3, color = [1, 1, 1], addCD = false) {
        this.currentColor = color;

        this.addV(p1);
        this.addV(p2);

        this.addV(p2);
        this.addV(p3);

        this.addV(p3);
        this.addV(p1);

        if (addCD) {
            var da = v3_sub_new(p2, p1);
            var db = v3_sub_new(p3, p1);
            var n  = v3_cross_new(da, db);
            v3_normalize_mod(n);
            this.pushCD_triangle(n, p1, p2, p3);
        }
    }


}


// Dynamic copy of entity
class E3D_entity_dynamicCopy extends E3D_entity_wireframe_canvas {
    constructor (id, sourceEntity) {
        super(id, true);

        this.numElements = 0;
        this.drawMode = 4;//gl.TRIANGLES;

        this.srcVertex = new Float32Array(sourceEntity.vertexArray);
        this.srcColor  = new Float32Array(sourceEntity.colorArray);
        this.srcNormal = new Float32Array(sourceEntity.normalArray);
        this.srcNumElements = sourceEntity.numElements;
        this.dataContentChanged = true;
        this.dataSizeChanged = true;
    }

    copySource(offset) { // offset in elements     
        this.vertexArray.set(this.srcVertex, offset * 3);
        this.colorArray.set( this.srcColor,  offset * 3);
        this.normalArray.set(this.srcNormal, offset * 3);
    }


}