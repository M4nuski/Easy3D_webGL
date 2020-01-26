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
        this.position = vec3.create();
        this.rotation = vec3.create();

        // fustrum culling
        this.vis_culling = true;
        this.cull_dist = 0; // maximum vertex distance from object center for culling
        
        // Computed matrix
        this.modelMatrix = mat4.create();
        this.normalMatrix = mat4.create();

        // Data
        this.numElements = 0; // Actual number of vertices to draw.
        this.drawMode = 4;//gl.TRIANGLES;

        // GL buffer data stores
        // TODO: combine to single data store (v1 v2 v3 n1 n2 n3 u v) 
        this.vertexBuffer;
        this.normalBuffer;
        this.colorBuffer; // TODO replace by texture
        //this.uvBuffer; // TODO textures into single data store


        // float32Array of raw data, can be flushed for static entities 
        // this.numElementStore = 1024 // Maximum number of vertices that the data arrays can hold.
        this.vertexArray; 
        this.normalArray;
        this.colorArray;

        //this.textureID = ""; // todo        
        this.filename = filename;

        this.collisionDetection = false;
        // TODO use ref to external object from ver4physics.js
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
            this.CD_edge_v0 = []; // original to model space
            this.CD_edge_v  = []; // transformed to world space (rotation)

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
            this.CD_vec_v0 = copy3fArray(entity.CD_vec_v0);
            this.CD_vec_v  = copy3fArray(entity.CD_vec_v);
            this.CD_vec_p0 = copy3fArray(entity.CD_vec_p0);
            this.CD_vec_p  = copy3fArray(entity.CD_vec_p);
        }
        if (entity.CD_edge > 0) {
            this.CD_edge = entity.CD_edge;
            this.CD_edge_v0 = copy3fArray(entity.CD_edge_v0);
            this.CD_edge_v  = copy3fArray(entity.CD_edge_v);
            this.CD_edge_p0 = copy3fArray(entity.CD_edge_p0);
            this.CD_edge_p  = copy3fArray(entity.CD_edge_p);
        }
        if (entity.CD_sph > 0) {
            this.CD_sph = entity.CD_sph;
            this.CD_sph_p0 = copy3fArray(entity.CD_sph_p0);
            this.CD_sph_p = copy3fArray(entity.CD_sph_p);
            this.CD_sph_r = entity.CD_sph_r.slice();
            this.CD_sph_rs = entity.CD_sph_rs.slice();
        }
        if (entity.CD_iPlane > 0) {
            this.CD_iPlane = entity.CD_iPlane;
            this.CD_iPlane_d  = entity.CD_iPlane_d.slice();
            this.CD_iPlane_n0 = copy3fArray(entity.CD_iPlane_n0);
            this.CD_iPlane_n  = copy3fArray(entity.CD_iPlane_n);
        }
        if (entity.CD_fPlane > 0) {
            this.CD_fPlane = entity.CD_fPlane;
            this.CD_fPlane_d0 = copy3fArray(entity.CD_fPlane_d0);
            this.CD_fPlane_d  = copy3fArray(entity.CD_fPlane_d);
            this.CD_fPlane_n0 = copy3fArray(entity.CD_fPlane_n0);
            this.CD_fPlane_n  = copy3fArray(entity.CD_fPlane_n);
            this.CD_fPlane_w0 = copy3fArray(entity.CD_fPlane_w0);
            this.CD_fPlane_w  = copy3fArray(entity.CD_fPlane_w);
            this.CD_fPlane_h0 = copy3fArray(entity.CD_fPlane_h0);
            this.CD_fPlane_h  = copy3fArray(entity.CD_fPlane_h);
        }
        if (entity.CD_cube > 0) {
            this.CD_cube = entity.CD_cube;
            this.CD_cube_p0  = copy3fArray(entity.CD_cube_p0);
            this.CD_cube_p = copy3fArray(entity.CD_cube_p);
            this.CD_cube_x0  = copy3fArray(entity.CD_cube_x0);
            this.CD_cube_x = copy3fArray(entity.CD_cube_x);
            this.CD_cube_y0  = copy3fArray(entity.CD_cube_y0);
            this.CD_cube_y = copy3fArray(entity.CD_cube_y);
            this.CD_cube_z0  = copy3fArray(entity.CD_cube_z0);
            this.CD_cube_z = copy3fArray(entity.CD_cube_z);
        }

    }


    moveTo(p){
        this.position = p.slice();
    }
    moveBy(p){
        add3f3fm(this.position, p);
    }
    moveByLocal(p){
        var offset = vec3.transformMat4(vec3_dummy, p, this.normalMatrix);
        add3f3fm(this.position, offset);
    }
    moveByParent(p, parent){
        var offset = vec3.transformMat4(vec3_dummy, p, parent.normalMatrix);
        add3f3fm(this.position, offset);
    }
    
    rotateTo(r){
        this.rotation = r.slice();
    }
    rotateBy(r) {
        add3f3fm(this.rotation, r);
    }
    rotateByLocal(r){
        var offset = vec3.transformMat4(vec3_dummy, r, this.normalMatrix);
        add3f3fm(this.rotation, offset);
    }
    rotateByParent(r, parent){
        var offset = vec3.transformMat4(vec3_dummy, r, parent.normalMatrix);
        add3f3fm(this.rotation, offset);
    }

    resetMatrix(){
        // recreate matrices from rotation and position
        mat4.rotateZ(this.normalMatrix, mat4_identity,     this.rotation[2] );
        mat4.rotateX(this.normalMatrix, this.normalMatrix, this.rotation[0] );
        mat4.rotateY(this.normalMatrix, this.normalMatrix, this.rotation[1] );

        mat4.translate(this.modelMatrix, mat4_identity, this.position);
        
        mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2] );
        mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0] );
        mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1] );

        if (this.collisionDetection) {
            for (var i = 0; i < this.CD_vec; ++i) {
                vec3.transformMat4(this.CD_vec_p[i], this.CD_vec_p0[i], this.modelMatrix);
                vec3.transformMat4(this.CD_vec_v[i], this.CD_vec_v0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_edge; ++i) {
                vec3.transformMat4(this.CD_edge_p[i], this.CD_edge_p0[i], this.modelMatrix);
                vec3.transformMat4(this.CD_edge_v[i], this.CD_edge_v0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_sph; ++i) {
                vec3.transformMat4(this.CD_sph_p[i], this.CD_sph_p0[i], this.modelMatrix);
            }
            for (var i = 0; i < this.CD_iPlane; ++i) {
                vec3.transformMat4(this.CD_iPlane_n[i], this.CD_iPlane_n0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_fPlane; ++i) {
                vec3.transformMat4(this.CD_fPlane_n[i], this.CD_fPlane_n0[i], this.normalMatrix);
                vec3.transformMat4(this.CD_fPlane_d[i], this.CD_fPlane_d0[i], this.modelMatrix);
                vec3.transformMat4(this.CD_fPlane_w[i], this.CD_fPlane_w0[i], this.normalMatrix);
                vec3.transformMat4(this.CD_fPlane_h[i], this.CD_fPlane_h0[i], this.normalMatrix);
            }
            for (var i = 0; i < this.CD_cube; ++i) {
                vec3.transformMat4(this.CD_cube_p[i], this.CD_cube_p0[i], this.modelMatrix);
                vec3.transformMat4(this.CD_cube_x[i], this.CD_cube_x0[i], this.normalMatrix);
                vec3.transformMat4(this.CD_cube_y[i], this.CD_cube_y0[i], this.normalMatrix);
                vec3.transformMat4(this.CD_cube_z[i], this.CD_cube_z0[i], this.normalMatrix);
            }
        }
    }

    pushCD_vec(p, v) {
        this.CD_vec_p0[this.CD_vec] = p.slice(); 
        this.CD_vec_p[this.CD_vec] = p.slice();
        
        this.CD_vec_v0[this.CD_vec] = v.slice(); 
        this.CD_vec_v[this.CD_vec] = v.slice(); 
        
        this.CD_vec += 1;
        this.collisionDetection = true;
    }
    pushCD_edge(p, v) {
        this.CD_edge_p0[this.CD_edge] = p.slice(); 
        this.CD_edge_p[this.CD_edge] = p.slice();
        
        this.CD_edge_v0[this.CD_edge] = v.slice(); 
        this.CD_edge_v[this.CD_edge] = v.slice(); 
        
        this.CD_edge += 1;
        this.collisionDetection = true;
    }
    pushCD_sph(p, r) {
        this.CD_sph_p0[this.CD_sph] = p.slice();
        this.CD_sph_p[this.CD_sph] = p.slice(); 
        
        this.CD_sph_r[this.CD_sph] = r;
        this.CD_sph_rs[this.CD_sph] = r*r;
        
        this.CD_sph += 1;
        this.collisionDetection = true;
    }
    pushCD_iPlane(d, n) {
        this.CD_iPlane_d[this.CD_iPlane] = d; 
        this.CD_iPlane_n0[this.CD_iPlane] = n.slice(); 
        this.CD_iPlane_n[this.CD_iPlane] = n.slice();

        this.CD_iPlane += 1;
        this.collisionDetection = true;
    }
    pushCD_fPlane(d, hw, hh, n) {
        this.CD_fPlane_n0[this.CD_fPlane] = n.slice(); // normal of plane face
        this.CD_fPlane_n[this.CD_fPlane] = n.slice();  
        this.CD_fPlane_d0[this.CD_fPlane] = d.slice(); // position offset of plane
        this.CD_fPlane_d[this.CD_fPlane] = d.slice();  
        this.CD_fPlane_w0[this.CD_fPlane] = hw.slice(); // width
        this.CD_fPlane_w[this.CD_fPlane] = hw.slice();
        this.CD_fPlane_h0[this.CD_fPlane] = hh.slice(); // height
        this.CD_fPlane_h[this.CD_fPlane] = hh.slice();
        
        this.CD_fPlane += 1;
        this.collisionDetection = true;
    }

    pushCD_cube(p, x, y, z) {
        this.CD_cube_p0[this.CD_cube] = p.slice();
        this.CD_cube_p[this.CD_cube] = p.slice();
        this.CD_cube_x0[this.CD_cube] = x.slice();
        this.CD_cube_x[this.CD_cube] = x.slice();
        this.CD_cube_y0[this.CD_cube] = y.slice();
        this.CD_cube_y[this.CD_cube] = y.slice();
        this.CD_cube_z0[this.CD_cube] = z.slice();
        this.CD_cube_z[this.CD_cube] = z.slice();

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
        let nv = [vec[0], vec[1], vec[2]];
        if (this.normalize) {
            vec3.normalize(nv, vec);
        }
        vec3.scale(nv, nv, this.vectorScale);
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
        
        for (var offsetIndex = 1; offsetIndex <= numSegments; ++offsetIndex) {
            this.increaseSize(sides*6);
            var si = Math.sin(0) * dia;
            var ci = Math.cos(0) * dia;
            var offsetAngle = baseOffset + (2 * offsetIndex * PIdiv2 / numSegments);
      //      offsetAngle += offsetAngle/2;
            var matX = mat4.clone(mat4_identity);
            var matY = mat4.clone(mat4_identity);
            var matZ = mat4.clone(mat4_identity);
            mat4.rotateX(matX, matX, offsetAngle);
            mat4.rotateY(matY, matY, offsetAngle);
            mat4.rotateZ(matZ, matZ, offsetAngle);
       // vec3.transformMat4(this.CD_vec_p[i], this.CD_vec_p0[i], this.modelMatrix);

            for (var i = 0; i < sides; ++i) { 

                var sip = Math.sin((i+1) * PIx2 / sides) * dia;
                var cip = Math.cos((i+1) * PIx2 / sides) * dia;

                //x
             /*   x = location[0];
                y = location[1] + si;
                z = location[2] + ci;*/
                var v = [0, si, ci];
                vec3.transformMat4(v, v, matY);
                this.setVertex3f(idx, add3f(v, location));
                this.setColor3f(idx, color);
                idx++;
            
              /*  x = location[0];
                y = location[1] + sip;
                z = location[2] + cip;*/
                v = [0, sip, cip];
                vec3.transformMat4(v, v, matY);
                this.setVertex3f(idx, add3f(v, location));
            // this.setVertex3f(idx, [x, y, z]);
                this.setColor3f(idx, color);
                idx++;
                
                //y
               /* x = location[0] + si;
                y = location[1];
                z = location[2] + ci;*/
                v = [si, 0, ci];
                vec3.transformMat4(v, v, matZ);
                this.setVertex3f(idx, add3f(v, location));
            // this.setVertex3f(idx, [x, y, z]);
                this.setColor3f(idx, color);
                idx++;

             /*   x = location[0] + sip;
                y = location[1];
                z = location[2] + cip;*/
                v = [sip, 0, cip];
                vec3.transformMat4(v, v, matZ);
                this.setVertex3f(idx, add3f(v, location));
            // this.setVertex3f(idx, [x, y, z]);
                this.setColor3f(idx, color);
                idx++;

                //z
             /*   x = location[0] + si;
                y = location[1] + ci;
                z = location[2];*/
                v = [si, ci, 0];
                vec3.transformMat4(v, v, matX);
                this.setVertex3f(idx, add3f(v, location));
            //   this.setVertex3f(idx, [x, y, z]);
                this.setColor3f(idx, color);
                idx++;

             /*   x = location[0] + sip;
                y = location[1] + cip;
                z = location[2];*/
                v = [sip, cip, 0];
                vec3.transformMat4(v, v, matX);
                this.setVertex3f(idx, add3f(v, location));
            //  this.setVertex3f(idx, [x, y, z]);
                this.setColor3f(idx, color);
                idx++;

                si = sip;
                ci = cip;
            }
        }

       /* if (numSegments > 1) {
            var offsetAngle = PIdiv2 / numSegments;
            for (var i = 1; i < numSegments; ++i) {
                this.increaseSize(sides * 6);
       //         mat4.translate(this.modelMatrix, mat4_identity, this.position);        
                mat4.rotateZ(this.modelMatrix, mat4_identity, this.rotation[2] );
                vec3.transformMat4(this.CD_vec_p[i], this.CD_vec_p0[i], this.modelMatrix);

            }
        }*/
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
        
        let m = mat4.create();

        mat4.translate(m, m, pos);
        
        mat4.rotateZ(m, m, rot[2]);
        mat4.rotateX(m, m, rot[0]);
        mat4.rotateY(m, m, rot[1]);

        vec3.transformMat4(p0, p0, m);
        vec3.transformMat4(p1, p1, m);
        vec3.transformMat4(p2, p2, m);
        vec3.transformMat4(p3, p3, m);

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
                vec3.lerp(a, p1, p0, t);
                vec3.lerp(b, p2, p3, t);

                vec3.lerp(c, p1, p2, t);
                vec3.lerp(d, p0, p3, t);

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
            m = mat4.create();
            let n = [0, 0, 1];
            
            mat4.rotateZ(m, m, rot[2]);
            mat4.rotateX(m, m, rot[0]);
            mat4.rotateY(m, m, rot[1]);

            vec3.transformMat4(n, n, m);

            this.pushCD_iPlane(vec3.dot(pos, n), n);
        }
        if (addFPCD) {
            m = mat4.create();
            let n = [0, 0, 1];
            let w = [1/width, 0, 0];
            let h = [0, 1/height, 0];
            mat4.rotateZ(m, m, rot[2]);
            mat4.rotateX(m, m, rot[0]);
            mat4.rotateY(m, m, rot[1]);

            vec3.transformMat4(n, n, m);
            vec3.transformMat4(w, w, m);
            vec3.transformMat4(h, h, m);

            this.pushCD_fPlane(pos, h, w, n);
        }
    }

    getNextSweepColor() {
        this.colSweepIndex++;
        if (this.colSweepIndex >= this.colSweep.length)  this.colSweepIndex = 0;
        return this.colSweep[this.colSweepIndex];
    }

    moveCursorTo (p) {
        this.currentPos = p.slice();
    }
    moveCursorBy (p) {
        add3f3fm(this.currentPos, p);
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

        this.currentPos = p.slice();
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

        add3f3fm(this.currentPos, p);

        idx++;
        this.setVertex3f(idx, p);
        this.setColor3f(idx, color);  
    }

    addWireCube(loc, rot, size, color, addCubeCD, centerCross = false, sideCross = false) {
        size[0] = Math.abs(size[0]) / 2;
        size[1] = Math.abs(size[1]) / 2;
        size[2] = Math.abs(size[2]) / 2;

        let m = mat4.create();

        mat4.translate(m, m, loc);
        
        mat4.rotateZ(m, m, rot[2]);
        mat4.rotateX(m, m, rot[0]);
        mat4.rotateY(m, m, rot[1]);

        let tfr = [size[0], size[1], size[2]];
        let tfl = [-size[0], size[1], size[2]];
        let trr = [size[0], size[1], -size[2]];
        let trl = [-size[0], size[1], -size[2]];

        let bfr = [size[0], -size[1], size[2]];
        let bfl = [-size[0], -size[1], size[2]];
        let brr = [size[0], -size[1], -size[2]];
        let brl = [-size[0], -size[1], -size[2]];

        vec3.transformMat4(tfr, tfr, m);
        vec3.transformMat4(tfl, tfl, m);
        vec3.transformMat4(trr, trr, m);
        vec3.transformMat4(trl, trl, m);

        vec3.transformMat4(bfr, bfr, m);
        vec3.transformMat4(bfl, bfl, m);
        vec3.transformMat4(brr, brr, m);
        vec3.transformMat4(brl, brl, m);

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
            m = mat4.create();
            let x = [1/size[0], 0, 0];
            let y = [0, 1/size[1], 0];
            let z = [0, 0, 1/size[2]];
            mat4.rotateZ(m, m, rot[2]);
            mat4.rotateX(m, m, rot[0]);
            mat4.rotateY(m, m, rot[1]);

            vec3.transformMat4(x, x, m);
            vec3.transformMat4(y, y, m);
            vec3.transformMat4(z, z, m);

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