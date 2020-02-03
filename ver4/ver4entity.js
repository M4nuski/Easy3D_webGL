// Easy3D_WebGL
// Entities classes ontaining mesh data, hit testing and matrix controls
// Emmanuel Charette 2017-2019

"use strict"

// Base class for static entity, optionnally dynamic
class E3D_entity {
    constructor(id, filename, dynamic = false) {

        this.id = id; // to find object in list
        this.visible = false;
        this.dynamic = dynamic; // Static (non-dynamic) entities have their data pushedd to the GPU memory only once when added to scene.
                                // Dynamic entities can have their data modified on the fly (with performance cost).

        this.dataContentChanged = false; // GPU buffers will be updated  
        this.dataSizeChanged = true; // GPU buffers will be reset and updated

        // Properties
        this.position = v3_new();
        this.rotation = v3_new();

        // fustrum culling
        this.vis_culling = true;
        this.cull_dist = 0; // maximum vertex distance from object center for culling
        
        // Computed matrix
        this.modelMatrix = m4_new();
        this.normalMatrix = m4_new();

        // Data
        this.numElements = 0; // Actual number of vertices to draw.
        this.drawMode = 4;//gl.TRIANGLES;

        // GL buffer data stores
        // TODO: combine to single data store (v1 v2 v3 n1 n2 n3 u v) 
        this.vertexBuffer;
        this.normalBuffer;
        this.colorBuffer; // TODO replace by texture
        //this.uvBuffer;


        // float32Array of raw data, can be flushed for static entities 
        // this.numElementStore = 1024 // Maximum number of vertices that the data arrays can hold.
        this.vertexArray; 
        this.normalArray;
        this.colorArray;

        //this.textureID = ""; // todo        
        this.filename = filename;

        this.collisionDetection = false;
     
        // Collision Detection / Hit Test Data (faster split in different array than accessing single object.array[i].property)
            // Vector Source (arrow)
            this.CD_vec = 0;
            this.CD_vec_p0 = []; // original to model space
            this.CD_vec_p  = []; // transformed to world space
            this.CD_vec_v0 = []; // original to model space
            this.CD_vec_v  = []; // transformed to world space (rotation)

            // Vector Target (edge)
            this.CD_edge = 0;
            this.CD_edge_p0 = []; // original to model space
            this.CD_edge_p  = []; // transformed to world space
            this.CD_edge_n0 = []; // original to model space
            this.CD_edge_n  = []; // transformed to world space (rotation)
            this.CD_edge_l  = [];

            // Sphere Source/Target
            // TODO generalize as ellipsoid
            this.CD_sph = 0;
            this.CD_sph_p0 = []; // original to model space
            this.CD_sph_p  = []; // transformed to world space
            this.CD_sph_r  = []; // radius
            this.CD_sph_rs = []; // radius squared

            // Infinite Plane Target, on X-Y plane
            this.CD_iPlane = 0;
            this.CD_iPlane_n0 = []; // normal original to model space
            this.CD_iPlane_n  = []; // normal transformed to world space (rotation)
            this.CD_iPlane_d  = []; // z distance original to model space

            // Finite Plane Target, X-Y plane 
            this.CD_fPlane = 0;
            this.CD_fPlane_n0 = []; // normal original to model space
            this.CD_fPlane_n  = []; // normal transformed to world space (rotation)
            this.CD_fPlane_d0 = []; // center position original to model space
            this.CD_fPlane_d  = []; // transformed to world space (rotation)
            this.CD_fPlane_w0 = []; // half width vector original to model space
            this.CD_fPlane_w  = []; // transformed to world space (rotation)
            this.CD_fPlane_h0 = []; // half height vector original to model space
            this.CD_fPlane_h  = []; // transformed to world space (rotation)

            // TODO Cuboid Target (/Source?)
            this.CD_cube = 0;
            this.CD_cube_p0 = []; // center position original to model space
            this.CD_cube_p  = []; // transformed to world space (rotation)
            this.CD_cube_x0 = []; // half size on X vector original to model space
            this.CD_cube_x  = []; // transformed to world space (rotation)
            this.CD_cube_y0 = []; // half size on Y vector original to model space
            this.CD_cube_y  = []; // transformed to world space (rotation)
            this.CD_cube_z0 = []; // half size on Z vector original to model space
            this.CD_cube_z  = []; // transformed to world space (rotation)


        this.resetMatrix();
    } 

    cloneData(entity) {
        this.numElements = entity.numElements;
        this.drawMode = entity.drawMode;
        this.vis_culling = entity.vis_culling;
        this.collisionDetection = entity.collisionDetection;

        if (entity.dynamic) {
            this.vertexArray = new Float32Array(entity.vertexArray); 
            this.normalArray = new Float32Array(entity.normalArray);
            this.colorArray = new Float32Array(entity.colorArray);
        } else {
            this.vertexBuffer = entity.vertexBuffer;
            this.normalBuffer = entity.normalBuffer;
            this.colorBuffer = entity.colorBuffer;
        }

        this.cull_dist = entity.cull_dist;

        if (entity.CD_vec > 0) {
            this.CD_vec = entity.CD_vec;
            this.CD_vec_v0 = v3a_clone(entity.CD_vec_v0);
            this.CD_vec_v  = v3a_clone(entity.CD_vec_v);
            this.CD_vec_p0 = v3a_clone(entity.CD_vec_p0);
            this.CD_vec_p  = v3a_clone(entity.CD_vec_p);
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
        if (entity.CD_iPlane > 0) {
            this.CD_iPlane = entity.CD_iPlane;
            this.CD_iPlane_d  = entity.CD_iPlane_d.slice();
            this.CD_iPlane_n0 = v3a_clone(entity.CD_iPlane_n0);
            this.CD_iPlane_n  = v3a_clone(entity.CD_iPlane_n);
        }
        if (entity.CD_fPlane > 0) {
            this.CD_fPlane = entity.CD_fPlane;
            this.CD_fPlane_d0 = v3a_clone(entity.CD_fPlane_d0);
            this.CD_fPlane_d  = v3a_clone(entity.CD_fPlane_d);
            this.CD_fPlane_n0 = v3a_clone(entity.CD_fPlane_n0);
            this.CD_fPlane_n  = v3a_clone(entity.CD_fPlane_n);
            this.CD_fPlane_w0 = v3a_clone(entity.CD_fPlane_w0);
            this.CD_fPlane_w  = v3a_clone(entity.CD_fPlane_w);
            this.CD_fPlane_h0 = v3a_clone(entity.CD_fPlane_h0);
            this.CD_fPlane_h  = v3a_clone(entity.CD_fPlane_h);
        }
        if (entity.CD_cube > 0) {
            this.CD_cube = entity.CD_cube;
            this.CD_cube_p0  = v3a_clone(entity.CD_cube_p0);
            this.CD_cube_p = v3a_clone(entity.CD_cube_p);
            this.CD_cube_x0  = v3a_clone(entity.CD_cube_x0);
            this.CD_cube_x = v3a_clone(entity.CD_cube_x);
            this.CD_cube_y0  = v3a_clone(entity.CD_cube_y0);
            this.CD_cube_y = v3a_clone(entity.CD_cube_y);
            this.CD_cube_z0  = v3a_clone(entity.CD_cube_z0);
            this.CD_cube_z = v3a_clone(entity.CD_cube_z);
        }

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
        // recreate matrices from rotation and position
        m4_rotationZ_res(this.normalMatrix, this.rotation[2]);
        m4_rotateX_mod(this.normalMatrix, this.rotation[0]);
        m4_rotateY_mod(this.normalMatrix, this.rotation[1]);

        m4_translation_res(this.modelMatrix, this.position);
        
        m4_rotateZ_mod(this.modelMatrix, this.rotation[2]);
        m4_rotateX_mod(this.modelMatrix, this.rotation[0]);
        m4_rotateY_mod(this.modelMatrix, this.rotation[1]);

        if (this.collisionDetection) {
            for (var i = 0; i < this.CD_vec; ++i) {
                v3_applym4_res(this.CD_vec_p[i], this.CD_vec_p0[i], this.modelMatrix);
                v3_applym4_res(this.CD_vec_v[i], this.CD_vec_v0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_edge; ++i) {
                v3_applym4_res(this.CD_edge_p[i], this.CD_edge_p0[i], this.modelMatrix);
                v3_applym4_res(this.CD_edge_n[i], this.CD_edge_n0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_sph; ++i) {
                v3_applym4_res(this.CD_sph_p[i], this.CD_sph_p0[i], this.modelMatrix);
            }
            for (var i = 0; i < this.CD_iPlane; ++i) {
                v3_applym4_res(this.CD_iPlane_n[i], this.CD_iPlane_n0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_fPlane; ++i) {
                v3_applym4_res(this.CD_fPlane_n[i], this.CD_fPlane_n0[i], this.normalMatrix);
                v3_applym4_res(this.CD_fPlane_d[i], this.CD_fPlane_d0[i], this.modelMatrix);
                v3_applym4_res(this.CD_fPlane_w[i], this.CD_fPlane_w0[i], this.normalMatrix);
                v3_applym4_res(this.CD_fPlane_h[i], this.CD_fPlane_h0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_cube; ++i) {
                v3_applym4_res(this.CD_cube_p[i], this.CD_cube_p0[i], this.modelMatrix);
                v3_applym4_res(this.CD_cube_x[i], this.CD_cube_x0[i], this.normalMatrix);
                v3_applym4_res(this.CD_cube_y[i], this.CD_cube_y0[i], this.normalMatrix);
                v3_applym4_res(this.CD_cube_z[i], this.CD_cube_z0[i], this.normalMatrix);
            }
        }
    }

    pushCD_vec(p, v) {
        this.CD_vec_p0[this.CD_vec] = v3_clone(p);
        this.CD_vec_p[this.CD_vec] = v3_clone(p);
        
        this.CD_vec_v0[this.CD_vec] = v3_clone(v);
        this.CD_vec_v[this.CD_vec] = v3_clone(v);
        
        this.CD_vec += 1;
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
    pushCD_sph(p, r) {
        this.CD_sph_p0[this.CD_sph] = v3_clone(p); 
        this.CD_sph_p[this.CD_sph] = v3_clone(p); 
        
        this.CD_sph_r[this.CD_sph] = r;
        this.CD_sph_rs[this.CD_sph] = r*r;
        
        this.CD_sph += 1;
        this.collisionDetection = true;
    }
    pushCD_iPlane(d, n) {
        this.CD_iPlane_d[this.CD_iPlane] = d; 
        this.CD_iPlane_n0[this.CD_iPlane] = v3_clone(n);
        this.CD_iPlane_n[this.CD_iPlane] = v3_clone(n);

        this.CD_iPlane += 1;
        this.collisionDetection = true;
    }
    pushCD_fPlane(d, hw, hh, n) {
        this.CD_fPlane_n0[this.CD_fPlane] = v3_clone(n); // normal of plane face
        this.CD_fPlane_n[this.CD_fPlane] = v3_clone(n);  
        this.CD_fPlane_d0[this.CD_fPlane] = v3_clone(d); // position offset of plane
        this.CD_fPlane_d[this.CD_fPlane] = v3_clone(d);  
        this.CD_fPlane_w0[this.CD_fPlane] = v3_clone(hw); // width
        this.CD_fPlane_w[this.CD_fPlane] = v3_clone(hw);
        this.CD_fPlane_h0[this.CD_fPlane] = v3_clone(hh); // height
        this.CD_fPlane_h[this.CD_fPlane] = v3_clone(hh);
        
        this.CD_fPlane += 1;
        this.collisionDetection = true;
    }

    pushCD_cube(p, x, y, z) {
        this.CD_cube_p0[this.CD_cube] = v3_clone(p); 
        this.CD_cube_p[this.CD_cube] = v3_clone(p); 
        this.CD_cube_x0[this.CD_cube] = v3_clone(x); 
        this.CD_cube_x[this.CD_cube] = v3_clone(x); 
        this.CD_cube_y0[this.CD_cube] = v3_clone(y); 
        this.CD_cube_y[this.CD_cube] = v3_clone(y); 
        this.CD_cube_z0[this.CD_cube] = v3_clone(z); 
        this.CD_cube_z[this.CD_cube] = v3_clone(z); 

        this.CD_cube += 1;
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
    constructor(id) {
        super(id, "E3D_entity_wireframe_canvas/"+id, true);
        this.drawMode = 1; // gl.LINES;      
        this.arraySize = 128;
        this.arrayIncrement = 128 ;// 3 vertex * 128;

        this.vertexArray = new Float32Array(this.arraySize*3);
        this.colorArray = new Float32Array(this.arraySize*3);
        this.normalArray = new Float32Array(this.arraySize*3);

        this.colSweep =  [ [1,0,0], [1,1,0] ,[0,1,0] ,[0,1,1] ,[0,0,1], [1,0,1] ];
        this.colSweepIndex = 0;

        this.currentPos = [ 0, 0, 0 ];
    }

    setSize(nElements) {        
        this.increaseSize(nElements - this.numElements);
    }

    increaseSize(by) {
        if (this.arraySize > (this.numElements + by)) {
            this.numElements += by;
        } else {
            if (this.numElements > 0) {     
                
                let end = (by >= 0) ? this.numElements*3 : (this.numElements - by)*3;

                this.arraySize += by + this.arrayIncrement;
                this.numElements += by;

                let oldV = this.vertexArray.subarray(0, end);
                let oldN = this.colorArray.subarray(0, end);
                let oldC = this.normalArray.subarray(0, end);
                
                this.vertexArray = new Float32Array(this.arraySize*3);
                this.colorArray = new Float32Array(this.arraySize*3);
                this.normalArray = new Float32Array(this.arraySize*3);
                
                this.vertexArray.set(oldV, 0);
                this.colorArray.set(oldN, 0);
                this.normalArray.set(oldC, 0);
                
            } else {
                this.numElements = by; 
                this.arraySize = by + this.arrayIncrement;
                this.vertexArray = new Float32Array(this.arraySize*3);
                this.colorArray = new Float32Array(this.arraySize*3);
                this.normalArray = new Float32Array(this.arraySize*3);
            }
        }
        this.dataSizeChanged = true;
    }
    
    clear() {
        this.numElements = 0;
        this.dataContentChanged = true;
    }

    getColor3f(elem) {
        return this.colorArray.subarray(elem*3, (elem+1)*3);
    }    
    setColor3f(elem, col) {
        this.colorArray.set(col, elem*3);
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

    addWireSphere(location, dia, color, sides, addSphCD = false, numSegments = 1) {
        dia = dia / 2;
        if (addSphCD) this.pushCD_sph(location, dia);

        let idx = this.numElements;
      //  var x=0, y=0, z=0;

      var baseOffset = PIdiv2 / numSegments;

      var matX = m4_new();
      var matY = m4_new();
      var matZ = m4_new();
      
      for (var offsetIndex = 1; offsetIndex <= numSegments; ++offsetIndex) {
          
          this.increaseSize(sides*6);
          var si = Math.sin(0) * dia;
          var ci = Math.cos(0) * dia;
          
          var offsetAngle = baseOffset + (2 * offsetIndex * PIdiv2 / numSegments);
          
            m4_rotationX_res(matX, offsetAngle);
            m4_rotationY_res(matY, offsetAngle);
            m4_rotationZ_res(matZ, offsetAngle);  

            for (var i = 0; i < sides; ++i) { 

                var sip = Math.sin((i+1) * PIx2 / sides) * dia;
                var cip = Math.cos((i+1) * PIx2 / sides) * dia;

                //x
                var v = [0, si, ci];
                v3_applym4_mod(v, matY);
                this.setVertex3f(idx, v3_add_new(v, location));
                this.setColor3f(idx, color);
                idx++;

                v = [0, sip, cip];
                v3_applym4_mod(v, matY);
                this.setVertex3f(idx, v3_add_new(v, location));
                this.setColor3f(idx, color);
                idx++;
                
                //y
                v = [si, 0, ci];
                v3_applym4_mod(v, matZ);
                this.setVertex3f(idx, v3_add_new(v, location));
                this.setColor3f(idx, color);
                idx++;

                v = [sip, 0, cip];
                v3_applym4_mod(v, matZ);
                this.setVertex3f(idx, v3_add_new(v, location));
                this.setColor3f(idx, color);
                idx++;

                //z
                v = [si, ci, 0];
                v3_applym4_mod(v, matX);
                this.setVertex3f(idx, v3_add_new(v, location));
                this.setColor3f(idx, color);
                idx++;

                v = [sip, cip, 0];
                v3_applym4_mod(v, matX);
                this.setVertex3f(idx, v3_add_new(v, location));
                this.setColor3f(idx, color);
                idx++;

                si = sip;
                ci = cip;
            }
        }

    }
        
    addWireCross(location, size, color = [1,1,1]) {
        let idx = this.numElements;
        size = size / 2;
        this.increaseSize(6);
            this.setVertex3f(idx, [location[0] + size, location[1], location[2] ]);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx, [location[0] - size, location[1], location[2] ]);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx, [location[0], location[1] + size, location[2] ]);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx, [location[0], location[1] - size, location[2] ]);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx, [location[0], location[1], location[2] + size]);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx, [location[0], location[1], location[2] - size]);
            this.setColor3f(idx, color);
    }

    addPlane(pos, rot, width, height, numSubdiv, color = [1,1,1], addIPCD = false, addFPCD = false) {
        let idx = this.numElements;

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

        this.increaseSize(8);
        
            // around
            this.setVertex3f(idx, p0);
            this.setColor3f(idx, color);
            idx++;
            this.setVertex3f(idx, p1);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx, p1);
            this.setColor3f(idx, color);
            idx++;
            this.setVertex3f(idx,p2);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx,p2);
            this.setColor3f(idx, color);
            idx++;
            this.setVertex3f(idx,p3);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx,p3);
            this.setColor3f(idx, color);
            idx++;
            this.setVertex3f(idx,p0);
            this.setColor3f(idx, color);



        if (numSubdiv == -1) {
            this.increaseSize(4);   
            // X
            idx++;
            this.setVertex3f(idx,p0);
            this.setColor3f(idx, color);
            idx++;
            this.setVertex3f(idx,p2);
            this.setColor3f(idx, color);

            idx++;
            this.setVertex3f(idx,p1);
            this.setColor3f(idx, color);
            idx++;
            this.setVertex3f(idx,p3);
            this.setColor3f(idx, color);
        }
        if (numSubdiv > 0) {
            this.increaseSize(4*numSubdiv); 
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

                idx++;
                this.setVertex3f(idx, a);
                this.setColor3f(idx, color);
                idx++;
                this.setVertex3f(idx, b);
                this.setColor3f(idx, color);
    
                idx++;
                this.setVertex3f(idx, c);
                this.setColor3f(idx, color);
                idx++;
                this.setVertex3f(idx, d);
                this.setColor3f(idx, color);


            }
        } 

        if (addIPCD) {

            let n = [0, 0, 1];
            
            m = m4_rotationZ_new(rot[2]);
            m4_rotateX_mod(m, rot[0]);
            m4_rotateY_mod(m, rot[1]);

            v3_applym4_mod(n, m);

            this.pushCD_iPlane(v3_dot(pos, n), n);
        }
        if (addFPCD) {

            let n = [0, 0, 1];
            let w = [1/width, 0, 0];
            let h = [0, 1/height, 0];

            m = m4_rotationZ_new(m, rot[2]);
            m4_rotateX_mod(m, rot[0]);
            m4_rotateY_mod(m, rot[1]);

            v3_applym4_mod(n, m);
            v3_applym4_mod(w, m);
            v3_applym4_mod(h, m);

            this.pushCD_fPlane(pos, h, w, n);
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

    lineTo(p, sweep, col= [1,1,1]) {
        let idx = this.numElements;
        this.increaseSize(2);

        var color = (sweep) ? this.getNextSweepColor() : col;

        this.setVertex3f(idx, this.currentPos);
        this.setColor3f(idx, color);
        idx++;
        this.setVertex3f(idx, p);
        this.setColor3f(idx, color);

        v3_copy(this.currentPos, p);
    }

    line(p0, p1, sweep, col= [1,1,1]) {
        let idx = this.numElements;
        this.increaseSize(2);

        var color = (sweep) ? this.getNextSweepColor() : col;

        this.setVertex3f(idx, p0);
        this.setColor3f(idx, color);
        idx++;
        this.setVertex3f(idx, p1);
        this.setColor3f(idx, color);
    }

    lineBy(p, sweep, col= [1,1,1]) {
        let idx = this.numElements;
        this.increaseSize(2);

        var color = (sweep) ? this.getNextSweepColor() : col;

        this.setVertex3f(idx, this.currentPos);
        this.setColor3f(idx, color);

        v3_add_mod(this.currentPos, p);

        idx++;
        this.setVertex3f(idx, this.currentPos);
        this.setColor3f(idx, color);  
    }

    addWireCube(loc, rot, size, color, addCubeCD, centerCross = false, sideCross = false) {
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

         this.line(tfr, tfl, false, color);
         this.line(tfl, trl, false, color);
         this.line(trl, trr, false, color);
         this.line(trr, tfr, false, color);

         this.line(bfr, bfl, false, color);
         this.line(bfl, brl, false, color);
         this.line(brl, brr, false, color);
         this.line(brr, bfr, false, color);

         this.line(tfr, bfr, false, color);
         this.line(tfl, bfl, false, color);
         this.line(trl, brl, false, color);
         this.line(trr, brr, false, color);

        if (centerCross) {
            this.line(tfr, brl, false, color);
            this.line(tfl, brr, false, color);
            this.line(trl, bfr, false, color);
            this.line(trr, bfl, false, color);
        }
        if (sideCross) {
            this.line(tfr, bfl, false, color); //f
            this.line(tfl, bfr, false, color);

            this.line(tfr, brr, false, color); //ri
            this.line(trr, bfr, false, color);

            this.line(tfl, brl, false, color);//l
            this.line(trl, bfl, false, color);

            this.line(trl, brr, false, color);//re
            this.line(trr, brl, false, color);

            this.line(tfr, trl, false, color);//t
            this.line(tfl, trr, false, color);

            this.line(brl, bfr, false, color); //b
            this.line(brr, bfl, false, color);
        }
        if (addCubeCD) {

            let x = [1/size[0], 0, 0];
            let y = [0, 1/size[1], 0];
            let z = [0, 0, 1/size[2]];

            m = m4_rotationZ_new(rot[2]);
            m4_rotateX_mod(m, rot[0]);
            m4_rotateY_mod(m, rot[1]);

            v3_applym4_mod(x, m);
            v3_applym4_mod(y, m);
            v3_applym4_mod(z, m);

            this.pushCD_cube(loc, x, y, z);
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
        this.srcColor = new Float32Array(sourceEntity.colorArray);
        this.srcNormal = new Float32Array(sourceEntity.normalArray);
        this.srcNumElements = sourceEntity.numElements;
        this.dataContentChanged = true;
        this.dataSizeChanged = true;
    }

    copySource(offset) { // offset in elements     
        this.vertexArray.set(this.srcVertex, offset*3);
        this.colorArray.set(this.srcColor, offset*3);
        this.normalArray.set(this.srcNormal, offset*3);
    }


}