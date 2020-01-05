// Easy3D_WebGL
// Main engine classes for timing, entities, scene, camera, shaders and lighting
// Emmanuel Charette 2017-2019

"use strict"

// TODO: specify move == moveBy | moveTo ?
// TODO: REMOVE ALL SCALE EXCEPT ON MESH LOAD/COPY (raw data only)
// TODO: add free gimbal mode for model view camera
// TODO: split into appropriate files

// Main timer class for synchronisation, smoothing and basic engine running
class E3D_timing {
    constructor(run, interval, onTick) {

        this.onTick = onTick;

        this.delta = interval / 1000;
        this.tickInterval = interval;

        this.timer; 

        this.start = Date.now();
        this.lastTick = this.start;
        this.active = run;
        this.usage = 0;

        if (run) {
            this.timer = setInterval( () => {this.tickEvent() }, interval);
        }
    }
    smooth(val, target, fact) { 
        let f = this.delta * fact;
        if (f > 1.0) f = 1.0;
        return val + ((target-val) * f);
    }

    run() {
        this.lastTick = Date.now();
        this.timer = setInterval( () => {this.tickEvent() }, this.tickInterval);
        this.active = true;
    }
    pause() {
        clearInterval(this.timer);
        this.active = false;
    }

    tickEvent(){
        const ts = Date.now(); 

        this.delta = (ts - this.lastTick) / 1000;
        this.lastTick = ts;

        if (this.onTick) {             
            this.onTick(); 
        }

        this.usage = 100*(Date.now() - this.lastTick)/this.tickInterval;
    }

    setInterval(interval) {
        this.pause();
        this.tickInterval = interval;
        if (this.active) {
            this.run();
        }

    }

}

// Base class for static entity containing mesh data, hit testing and matrix controls
class E3D_entity {
    constructor(id, filename, dynamic = false) {

        this.id = id; // to find object in list
        this.visible = false;
        this.dynamic = dynamic; // Static (non-dynamic) entities have their data pusehd to the GPU only once when added to scene.
                                // Dynamic entities can have their data modified on the fly (with performance cost).

        this.dataContentChanged = false; // GPU buffers will be updated  
        this.dataSizeChanged = true; // GPU buffers will be reset and updated

        // Properties
        this.position = vec3.create();
        this.rotation = vec3.create();
        this.scale = vec3.fromValues(1.0, 1.0, 1.0);

        // fustrum culling
        this.vis_culling = true;
        this.cull_dist = 0; // current distance along Z axis
        this.cull_max_pos = [0, 0, 0]; // fartest vertex to compute max distance from matrix 
        
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
        this.colorBuffer; // todo replace by texture
        //this.uvBuffer; // todo


        // float32Array of raw data, can be flushed for static entities 
        // this.numElementStore = 1024 // Maximum number of vertices that the data arrays can hold.
        this.vertexArray; 
        this.normalArray;
        this.colorArray;

        //this.textureID = ""; // todo        
        this.filename = filename;

        this.collisionDetection = false;
        // Collision Detection / Hit Test Data (faster split in different array than accessing single array then object attributes)
            // Vector Source 
            this.CD_vec = 0;
            this.CD_vec_p0 = []; // original to model space
            this.CD_vec_p  = []; // transformed to world space
            this.CD_vec_v0 = []; // original to model space
            this.CD_vec_v  = []; // transformed to world space

            // Sphere Source/Target
            this.CD_sph = 0;
            this.CD_sph_p0 = []; // original to model space
            this.CD_sph_p  = []; // transformed to world space
            this.CD_sph_r0 = []; // original to model space
            this.CD_sph_r  = []; // transformed to world space
            this.CD_sph_rs = []; // transformed to world space, squared

            // Infinite Plane Target, on X-Y plane
            this.CD_iPlane = 0;
            this.CD_iPlane_n0 = []; // normal original to model space
            this.CD_iPlane_n  = []; // normal transformed to world space (rotation, scale)
            this.CD_iPlane_d0 = []; // z distance original to model space
            this.CD_iPlane_d  = []; // transformed to world space (scale)

            // Finite Plane Target, X-Y plane 
            this.CD_fPlane = 0;
            this.CD_fPlane_n0 = []; // normal original to model space
            this.CD_fPlane_n  = []; // normal transformed to world space (rotation, scale)
            this.CD_fPlane_d0 = []; // center position original to model space
            this.CD_fPlane_d  = []; // transformed to world space (rotation, scale)
            this.CD_fPlane_w0 = []; // half width vector original to model space
            this.CD_fPlane_w  = []; // transformed to world space (rotation, scale)
            this.CD_fPlane_h0 = []; // half height vector original to model space
            this.CD_fPlane_h  = []; // transformed to world space (rotation, scale)

            // TODO Cubic Target (/Source?)
            this.CD_cube = 0;
            this.CD_cube_p0 = []; // center position original to model space
            this.CD_cube_p  = []; // transformed to world space (rotation, scale)
            this.CD_cube_x0 = []; // half size on X vector original to model space
            this.CD_cube_x  = []; // transformed to world space (rotation, scale)
            this.CD_cube_y0 = []; // half size on Y vector original to model space
            this.CD_cube_y  = []; // transformed to world space (rotation, scale)
            this.CD_cube_z0 = []; // half size on Z vector original to model space
            this.CD_cube_z  = []; // transformed to world space (rotation, scale)


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
        this.cull_max_pos = entity.cull_max_pos.slice();

        if (entity.CD_vec > 0) {
            this.CD_vec = entity.CD_vec;
            this.CD_vec_v0 = copy3fArray(entity.CD_vec_v0);
            this.CD_vec_v  = copy3fArray(entity.CD_vec_v);
        }
        if (entity.CD_sph > 0) {
            this.CD_sph = entity.CD_sph;
            this.CD_sph_p0 = copy3fArray(entity.CD_sph_p0);
            this.CD_sph_p = copy3fArray(entity.CD_sph_p);
            this.CD_sph_r0 = entity.CD_sph_r0.slice();
            this.CD_sph_r = entity.CD_sph_r.slice();
            this.CD_sph_rs = entity.CD_sph_rs.slice();
        }
        if (entity.CD_iPlane > 0) {
            this.CD_iPlane = entity.CD_iPlane;
            this.CD_iPlane_d0 = entity.CD_iPlane_d0.slice();
            this.CD_iPlane_d  = entity.CD_iPlane_d.slice();
            this.CD_iPlane_n0 = copy3fArray(entity.CD_iPlane_n0);
            this.CD_iPlane_n  = copy3fArray(entity.CD_iPlane_n);
        }
        if (entity.CD_fPlane > 0) {
            this.CD_fPlane = entity.CD_fPlane;
            this.CD_fPlane_d0 = copy3fArray(entity.CD_fPlane_d0);
            this.CD_fPlane_d  = copy3fArray(entity.CD_fPlane_d);
            this.CD_fPlane_n0 = copy3fArray(entity.CD_iPlane_n0);
            this.CD_fPlane_n  = copy3fArray(entity.CD_iPlane_n);
            this.CD_fPlane_w0 = copy3fArray(entity.CD_fPlane_w0);
            this.CD_fPlane_w  = copy3fArray(entity.CD_fPlane_w);
            this.CD_fPlane_h0 = copy3fArray(entity.CD_iPlane_h0);
            this.CD_fPlane_h  = copy3fArray(entity.CD_iPlane_h);
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

    // TODO normal matrix in shader, or copy of model matrix with scale and translation reset
    resetMatrix(){
        // recreate matrices from scale, rotation and position
        mat4.rotateZ(this.normalMatrix, mat4_identity, this.rotation[2] );
        mat4.rotateX(this.normalMatrix, this.normalMatrix, this.rotation[0] );
        mat4.rotateY(this.normalMatrix, this.normalMatrix, this.rotation[1] );

        mat4.translate(this.modelMatrix, mat4_identity, this.position);
        mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);
        
        mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2] );
        mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0] );
        mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1] );
        
        this.cull_dist = vec3.length(vec3.multiply([0,0,0], this.cull_max_pos, this.scale));

        if (this.collisionDetection) {
            for (var i = 0; i < this.CD_vec; ++i) {
                vec3.transformMat4(this.CD_vec_p[i], this.CD_vec_p0[i], this.modelMatrix);
                vec3.transformMat4(this.CD_vec_v[i], this.CD_vec_v0[i], this.modelMatrix);
            }
            for (var i = 0; i < this.CD_sph; ++i) {
                vec3.transformMat4(this.CD_sph_p[i], this.CD_sph_p0[i], this.modelMatrix);
                this.CD_sph_r[i] = this.CD_sph_r0[i] * vec3.length(this.scale)/1.73205;
                this.CD_sph_rs[i] = this.CD_sph_r[i] * this.CD_sph_r[i];
            }
            var invScale = vec3.inverse([0, 0, 0], this.scale);
            for (var i = 0; i < this.CD_iPlane; ++i) {
                vec3.transformMat4(this.CD_iPlane_n[i], this.CD_iPlane_n0[i], this.normalMatrix);
                vec3.multiply(this.CD_iPlane_n[i], this.CD_iPlane_n[i], invScale);
            }
            for (var i = 0; i < this.CD_fPlane; ++i) {
                vec3.transformMat4(this.CD_fPlane_n[i], this.CD_fPlane_n0[i], this.normalMatrix);
                vec3.multiply(this.CD_fPlane_n[i], this.CD_fPlane_n[i], invScale);

                vec3.transformMat4(this.CD_fPlane_d[i], this.CD_fPlane_d0[i], this.modelMatrix);
                //vec3.multiply(this.CD_fPlane_d[i], this.CD_fPlane_d[i], invScale);

                vec3.transformMat4(this.CD_fPlane_w[i], this.CD_fPlane_w0[i], this.normalMatrix);
                vec3.multiply(this.CD_fPlane_w[i], this.CD_fPlane_w[i], invScale);

                vec3.transformMat4(this.CD_fPlane_h[i], this.CD_fPlane_h0[i], this.normalMatrix);
                vec3.multiply(this.CD_fPlane_h[i], this.CD_fPlane_h[i], invScale);
            }
            for (var i = 0; i < this.CD_cube; ++i) {
                vec3.transformMat4(this.CD_cube_p[i], this.CD_cube_p0[i], this.normalMatrix);
                vec3.multiply(this.CD_cube_p[i], this.CD_cube_p[i], invScale);

                vec3.transformMat4(this.CD_cube_x[i], this.CD_cube_x0[i], this.normalMatrix);
                vec3.multiply(this.CD_cube_x[i], this.CD_cube_x[i], invScale);

                vec3.transformMat4(this.CD_cube_y[i], this.CD_cube_y0[i], this.normalMatrix);
                vec3.multiply(this.CD_cube_y[i], this.CD_cube_y[i], invScale);

                vec3.transformMat4(this.CD_cube_z[i], this.CD_cube_z0[i], this.normalMatrix);
                vec3.multiply(this.CD_cube_z[i], this.CD_cube_z[i], invScale);
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
    pushCD_sph(p, r) {
        this.CD_sph_p0[this.CD_sph] = p.slice();
        this.CD_sph_p[this.CD_sph] = p.slice(); 
        
        this.CD_sph_r0[this.CD_sph] = r;
        this.CD_sph_r[this.CD_sph] = r;
        this.CD_sph_rs[this.CD_sph] = r*r;
        
        this.CD_sph += 1;
        this.collisionDetection = true;
    }
    pushCD_iPlane(d, n) {
        this.CD_iPlane_d0[this.CD_iPlane] = d; 
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
class E3D_entity_vector extends E3D_entity {
    constructor (id, showAxis, vectorScale, normalize) {
        super(id, "E3D_entity_vector/" + id, true);

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
class E3D_entity_dynamic extends E3D_entity {
    constructor(id) {
        super(id, "E3D_entity_dynamic/"+id, true);
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

    addWireSphere(location, dia, color, sides, addSphCD = false) {
        dia = dia / 2;
        if (addSphCD) this.pushCD_sph(location, dia);

        let idx = this.numElements;
        this.increaseSize(sides*6);
        var x=0, y=0, z=0;

        var si = Math.sin(0) * dia;
        var ci = Math.cos(0) * dia;

        for (var i = 0; i< sides; ++i) { 

            var sip = Math.sin((i+1) * PIx2 / sides) * dia;
            var cip = Math.cos((i+1) * PIx2 / sides) * dia;

            //x
            x = location[0];
            y = location[1] + si;
            z = location[2] + ci;
            this.setVertex3f(idx, [x, y, z]);
            this.setColor3f(idx, color);
            idx++;
            
            x = location[0];
            y = location[1] + sip;
            z = location[2] + cip;
            this.setVertex3f(idx, [x, y, z]);
            this.setColor3f(idx, color);
            idx++;
            
            //y
            x = location[0] + si;
            y = location[1];
            z = location[2] + ci;
            this.setVertex3f(idx, [x, y, z]);
            this.setColor3f(idx, color);
            idx++;

            x = location[0] + sip;
            y = location[1];
            z = location[2] + cip;
            this.setVertex3f(idx, [x, y, z]);
            this.setColor3f(idx, color);
            idx++;

            //z
            x = location[0] + si;
            y = location[1] + ci;
            z = location[2];
            this.setVertex3f(idx, [x, y, z]);
            this.setColor3f(idx, color);
            idx++;

            x = location[0] + sip;
            y = location[1] + cip;
            z = location[2];
            this.setVertex3f(idx, [x, y, z]);
            this.setColor3f(idx, color);
            idx++;

            si = sip;
            ci = cip;
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

    moveTo (p) {
        this.currentPos = p.slice();
    }
    moveBy (p) {
        vec3.add(this.currentPos, this.currentPos, p);
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

        vec3.add(this.currentPos, this.currentPos, p);

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
class E3D_entity_dynamicCopy extends E3D_entity_dynamic {
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

// Base animation class, to handle callbacks and state
class E3D_animation { // State container for animations
    constructor(id, animatorFunct, targetObject, sceneContext, timerclass) { // id ??
        this.id = id;
        this.anim = animatorFunct; // function delegate that perform the animation
        this.target = targetObject;
        this.scn = sceneContext;
        this.timer = timerclass;

        this.state = E3D_RESET;
        this.data = {}; // to store data through the animation

        this.delta2 = -1; // square of movement during animation step for culling, -1 anim target is not a source
        
    }

    animate(CD_Candidate_list) {
        if (this.anim) {
            this.anim(CD_Candidate_list);
        }
    }

    reset() {
        this.state = E3D_RESET;        
    }
    play() {
        this.state = E3D_PLAY;  
    }
    pause() {
        this.state = E3D_PAUSE;  
    }
    restart() {
        this.state = E3D_RESTART;  
    }
    done() {
        this.state = E3D_DONE;  
    }
}

// Scene class, gathering all state and entities, shaders, lights and camera
class E3D_scene {
    constructor(id, context, width, height, vBackColor = vec4.fromValues(0.0, 0.0, 0.1, 1.0), fogLimit = -1) {
        this.id = id;
        this.context = context; // GL rendering context
        this.state = E3D_CREATED;

        this.camera = new E3D_camera(id+"defaultCtorCamera", width, height);

        this.entities = [];

        this.lights = new E3D_lighting();
        this.clearColor = vBackColor;
        this.fogLimit = fogLimit;
        this.fogFactor = 1.0;

        this.program = null; // shader program class

        this.preRenderFunction = null; 
        this.renderFunction = null; 
        this.postRenderFunction = null;

        this.drawnElemenets = 0; // some stats
    }

    initialize() {
        // config GL context        
        this.context.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.context.clearDepth(1.0);
        this.context.enable(this.context.DEPTH_TEST);
        this.context.depthFunc(this.context.LEQUAL);
        this.context.cullFace(this.context.BACK);
        this.context.enable(this.context.CULL_FACE);
        this.state = E3D_READY;
    }

    preRender() {
        // timing, events, controls, camera, animations

        if (this.lights.light0_lockToCamera) {
            this.lights.light0_adjusted = this.camera.adjustToCamera(this.lights.light0_direction);
        }
        if (this.lights.light1_lockToCamera) {
            this.lights.light1_adjusted = this.camera.adjustToCamera(this.lights.light1_direction);
        }


        if (this.fogLimit > 0.0) {
            this.fogFactor = 1.0 / ((this.camera.far - this.camera.near) - this.fogLimit);
        };

       // this.cull_view_axis = this.camera.adjustToCamera(vec3_nz);

        if (this.preRenderFunction) {
            this.preRenderFunction(this);
        }
    }

    render() {
        // entities, sprites, hud



        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);

        this.context.useProgram(this.program.shaderProgram);

        this.context.uniformMatrix4fv(this.program.shaderUniforms["uProjectionMatrix"], false, this.camera.getViewMatrix());     

        this.context.uniform3fv(this.program.shaderUniforms["uLightA_Color"], this.lights.ambiant_color);

        this.context.uniform3fv(this.program.shaderUniforms["uLight0_Color"], this.lights.light0_color);
        this.context.uniform3fv(this.program.shaderUniforms["uLight0_Direction"], this.lights.light0_adjusted);

        this.context.uniform3fv(this.program.shaderUniforms["uLight1_Color"], this.lights.light1_color);
        this.context.uniform3fv(this.program.shaderUniforms["uLight1_Direction"], this.lights.light1_adjusted);

        this.context.uniform4fv(this.program.shaderUniforms["uFogColor"], this.clearColor);
        this.context.uniform1f(this.program.shaderUniforms["uFogLimit"], this.fogLimit);
        this.context.uniform1f(this.program.shaderUniforms["uFogFactor"], this.fogFactor);

        this.drawnElemenets = 0;

        for (let i = 0; i < this.entities.length; ++i) {
            if ((this.entities[i].visible) && (this.entities[i].numElements > 0) && (this.cull_check_visible(i)) ) {

                // Entity Attributes
                if (this.entities[i].dynamic) {
                    if (this.entities[i].dataSizeChanged) { 
                        // reset buffer
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer, this.entities[i].vertexArray);
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer, this.entities[i].normalArray);    
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer, this.entities[i].colorArray);  
                        this.entities[i].dataSizeChanged = false;

                    } else if (this.entities[i].dataContentChanged) { 
                        // update buffer
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer, this.entities[i].vertexArray);
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer, this.entities[i].normalArray);    
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer, this.entities[i].colorArray);  
                        this.entities[i].dataContentChanged = false;

                    } else {
                        // bind buffer
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer);  
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);    
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer);
                    }
                                       

                 } else { // static, bind only
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer);  
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);    
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer);
                }
                // Entity Uniforms
                this.context.uniformMatrix4fv(this.program.shaderUniforms["uModelMatrix"], false, this.entities[i].modelMatrix);
                this.context.uniformMatrix4fv(this.program.shaderUniforms["uNormalMatrix"], false, this.entities[i].normalMatrix);
                
                // Draw
                this.context.drawArrays(this.entities[i].drawMode, 0, this.entities[i].numElements);
                this.drawnElemenets += this.entities[i].numElements;
            }
        }

        if (this.renderFunction) {
            this.renderFunction(this);
        }
    }

    postRender() {
        // cleanup or other events
        if (this.postRenderFunction) {
            this.postRenderFunction(this);
        }
    }


    bind3FloatBuffer(location, buffer) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, buffer);
        this.context.vertexAttribPointer(location, 3, this.context.FLOAT, false, 0, 0);
        this.context.enableVertexAttribArray(location);
    }
    
    bindAndUpdate3FloatBuffer(location, buffer, data) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, buffer);
        this.context.bufferSubData(this.context.ARRAY_BUFFER, 0, data);
        this.context.vertexAttribPointer(location, 3, this.context.FLOAT, false, 0, 0);
        this.context.enableVertexAttribArray(location);
    }

    bindAndReset3FloatBuffer(location, buffer, data) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, buffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, data, this.context.DYNAMIC_DRAW); 
        this.context.vertexAttribPointer(location, 3, this.context.FLOAT, false, 0, 0);
        this.context.enableVertexAttribArray(location);
    }


    addEntity(ent) {

        // Initialize context data buffers        
        ent.vertexBuffer = this.context.createBuffer();
        ent.colorBuffer = this.context.createBuffer();
        ent.normalBuffer = this.context.createBuffer();

        if (!ent.dynamic) { // if static initialize context data buffers and assign data right away

            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.STATIC_DRAW);        
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.STATIC_DRAW);            
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.STATIC_DRAW);

        } else  { // if dynamic prepare buffers
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.DYNAMIC_DRAW);                
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.DYNAMIC_DRAW);            

            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.DYNAMIC_DRAW);

        }


        
        ent.cull_max_pos = E3D_scene.cull_calculate_max_pos(ent.vertexArray);
        
        ent.resetMatrix();

        this.entities.push(ent);

        return this.entities.length - 1; // return new index
    }

    cloneEntity(id, newId) {
        let idx = this.getEntityIndexFromId(id);
        if (idx > -1) {

            var ent = new E3D_entity(newId, this.entities[idx].filename, this.entities[idx].dynamic);

            ent.cloneData(this.entities[idx]);   

            if (ent.dynamic) {
                ent.vertexBuffer = this.context.createBuffer();
                ent.colorBuffer = this.context.createBuffer();
                ent.normalBuffer = this.context.createBuffer();
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.DYNAMIC_DRAW);
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.DYNAMIC_DRAW);
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.DYNAMIC_DRAW);
                ent.dataSizeChanged = true;
            }

            this.entities.push(ent);    
            return ent; // return reference to new entity
        }        
    }

    getEntityIndexFromId(id) { // TODO use map to store index vs ID
        for (let i = 0; i < this.entities.length; ++i) {
            if (this.entities[i].id == id) return i;
        }
        return -1;
    }

    removeEntity(id, deleteBuffers = true) {
        let idx = this.getEntityIndexFromId(id);
        if (idx > -1) {
            if (deleteBuffers) {
                this.context.deleteBuffer(this.entities[idx].vertexBuffer);
                this.context.deleteBuffer(this.entities[idx].colorBuffer);
                this.context.deleteBuffer(this.entities[idx].normalBuffer);
            }
            this.entities.splice(idx, 1);
        }    
    }

    static cull_calculate_max_pos(vertArray) {
        let result = [0, 0, 0];
        let r_dist2 = 0;
        for (let i = 0; i < vertArray.length; i += 3) {
            var currentDist = vec3.squaredLength([vertArray[i], vertArray[i+1], vertArray[i+2] ]);
            if (currentDist > r_dist2) {
                result = [vertArray[i], vertArray[i+1], vertArray[i+2] ];
                r_dist2 = currentDist;
            }
        }
        return result;
    }

    cull_check_visible(idx) {
        if (this.entities[idx].vis_culling) {
            var pos = [0, 0, 0];
            vec3.subtract(pos, this.entities[idx].position, this.camera.position);
            this.camera.negateCamera(pos);
            var dist = -pos[2]; // only check for Z
            return ( ((dist - this.entities[idx].cull_dist) < this.camera.far) && 
            ((dist + this.entities[idx].cull_dist) > this.camera.near) );
        }
        return true;
    }

}

// Entension to allow dual shaders for toon/cell shading of mesh
class E3D_scene_cell_shader extends E3D_scene {
    constructor(id, context, width, height, vBackColor = vec4.fromValues(0.9, 0.9, 0.9, 1.0), fogLimit = -1) {
        super(id, context, width, height, vBackColor, fogLimit);
        this.strokeProgram = null ; // E3D_program for line strokes
    //    this.entitiesStrokeIndices = [];

        this.strokeColor = [0.0, 0.0, 0.0, 1.0];
        this.farColor = [0.75, 0.75, 0.75, 1.0]; // color of stroke line at zFar 
        this.strokeDepth = -0.01; // offset width for stroke generation
    }

    render() {

        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
        this.drawnElemenets = 0;

        // Line strokes 
        this.context.useProgram(this.strokeProgram.shaderProgram);

        this.context.cullFace(this.context.FRONT);
        this.context.depthFunc(this.context.LEQUAL);

        this.context.uniformMatrix4fv(this.strokeProgram.shaderUniforms["uProjectionMatrix"], false, this.camera.getViewMatrix());     
        this.context.uniform4fv(this.strokeProgram.shaderUniforms["uFarColor"], this.farColor );  
        this.context.uniform4fv(this.strokeProgram.shaderUniforms["uStrokeColor"], this.strokeColor );  
        this.context.uniform1f(this.strokeProgram.shaderUniforms["uStrokeDepth"], this.strokeDepth );  

        this.context.uniform1f(this.strokeProgram.shaderUniforms["uFar"], this.camera.far);  
        
        for (let i = 0; i < this.entities.length; ++i)
            if ((this.entities[i].visible) && (this.entities[i].numElements > 0)  && (this.cull_check_visible(i) ) ) {

            // Entity Attributes
            if (this.entities[i].dynamic) {
                this.bindAndUpdate3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexPosition"], this.vertexBuffer, this.entities[i].vertexArray);
                this.bindAndUpdate3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexNormal"], this.normalBuffer, this.entities[i].normalArray);  

            } else {
                this.bind3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer); 
                this.bind3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);   
                
            }
            // Entity Uniforms
            this.context.uniformMatrix4fv(this.strokeProgram.shaderUniforms["uModelMatrix"], false, this.entities[i].modelMatrix);
            
            // Draw
           // this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER,this.entitiesStrokeIndices[i]);
           // this.context.drawElements(this.context.LINES, this.entities[i].numElements * 2, this.context.UNSIGNED_SHORT, 0);
           this.context.drawArrays(this.entities[i].drawMode, 0, this.entities[i].numElements);
           this.drawnElemenets += this.entities[i].numElements;
        }

        this.context.cullFace(this.context.BACK);
        this.context.depthFunc(this.context.LESS);

        this.context.useProgram(this.program.shaderProgram);
        
        this.context.uniformMatrix4fv(this.program.shaderUniforms["uProjectionMatrix"], false, this.camera.getViewMatrix());     
        this.context.uniform3fv(this.program.shaderUniforms["uLight"], this.lights.light0_adjusted);
        
        for (let i = 0; i < this.entities.length; ++i)
            if ((this.entities[i].visible) && (this.entities[i].numElements > 0) && (this.cull_check_visible(i) ) ) {

                // Entity Attributes
                if (this.entities[i].dynamic) {
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.vertexBuffer, this.entities[i].vertexArray);
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.normalBuffer, this.entities[i].normalArray);    
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.colorBuffer, this.entities[i].colorArray);  
                } else {
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer);  
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);    
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer);
                }
                // Entity Uniforms
                this.context.uniformMatrix4fv(this.program.shaderUniforms["uModelMatrix"], false, this.entities[i].modelMatrix);
                this.context.uniformMatrix4fv(this.program.shaderUniforms["uNormalMatrix"], false, this.entities[i].normalMatrix);
                
                // Draw
                this.context.drawArrays(this.entities[i].drawMode, 0, this.entities[i].numElements);
                this.drawnElemenets += this.entities[i].numElements;
        }


        if (this.renderFunction) {
            this.renderFunction(this);
        }
    }
/*
    addStrokeData(entity)  {
        // static only for now
        let indices = new Uint16Array(entity.numElements * 2);
        for (var i = 0; i < entity.numElements / 3; ++i) {
            indices[(6*i) + 0] = (0 + (i*3));
            indices[(6*i) + 1] = (1 + (i*3));

            indices[(6*i) + 2] = (1 + (i*3));
            indices[(6*i) + 3] = (2 + (i*3));

            indices[(6*i) + 4] = (2 + (i*3));
            indices[(6*i) + 5] = (0 + (i*3));
        }
               
        let bfr = this.context.createBuffer();
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, bfr);
        this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, indices, this.context.STATIC_DRAW); 
        
        this.entitiesStrokeIndices.push(bfr);
    }*/

}

// Base class container for GLSL shader program loading and compiling
class E3D_program {
    constructor(id, context) {
        this.id = id;
        this.context = context;

        this.shaderProgram = null;
        this.shaderAttributes = {};
        this.shaderUniforms = {};
    }

    compile(vertexSource, fragmentSource) {
        const vs = E3D_program.loadShader(this.context, this.context.VERTEX_SHADER, vertexSource);
        const fs = E3D_program.loadShader(this.context, this.context.FRAGMENT_SHADER, fragmentSource);

        if ((vs != null) && (fs != null)) {
            this.shaderProgram = this.context.createProgram();
            this.context.attachShader(this.shaderProgram, vs);
            this.context.attachShader(this.shaderProgram, fs);
            this.context.linkProgram(this.shaderProgram);

            if (!this.context.getProgramParameter(this.shaderProgram, this.context.LINK_STATUS)) {
                console.log('Unable to initialize the shader program: ' + this.context.getProgramInfoLog(this.shaderProgram));
                this.shaderProgram = null;
            }
        } else {
            this.shaderProgram = null;
        }
    }


    bindLocations(attribList, uniformList) {
        for (let i = 0; i < attribList.length; ++i) {
            this.shaderAttributes[attribList[i]] = this.context.getAttribLocation(this.shaderProgram, attribList[i]);
        }

        for (let i = 0; i < uniformList.length; ++i) {
            this.shaderUniforms[uniformList[i]] = this.context.getUniformLocation(this.shaderProgram, uniformList[i]);
        }
    }

    static loadShader(context, type, source) {
        const shader = context.createShader(type);       
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            console.log('An error occurred compiling the '+ type +' shaders: ' + context.getShaderInfoLog(shader));
            context.deleteShader(shader);
            return null;
        }
        return shader;
    }



}

// Base class for scene view matrix generation (orthogonal projection)
class E3D_camera {

    constructor(id, width, height) {        
        this.id = id;
        this.rotation = vec3.create();
        this.position = vec3.create();
        this.matrix = mat4.create();
        this.baseMatrix = mat4.create(); 

        this.near = -1.0;
        this.far = 1.0;

        this.fov = -1;

        this.resize(width, height);
        this.updateInternal();
    }

    resize(width, height) {
        let wd2 = width /2;
        let hd2 = height /2;
        let dd2 = wd2;
        
        if (hd2 > wd2) {
            dd2 = hd2;
        }
 
        mat4.ortho(this.baseMatrix, -wd2, wd2, hd2, -hd2, -dd2, dd2);  

        this.near = -dd2;
        this.far = dd2;
    }

    updateInternal() {
        // create matrix per position and rotation
        mat4.translate(this.matrix, this.baseMatrix, vec3.negate(vec3_dummy, this.position) );

        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2] );
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0] );
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );
    }

    update(px, py, pz, rx, ry, rz) {
        // update internal data then matrix
        this.position[0] = px;
        this.position[1] = py;
        this.position[2] = pz;
        
        this.rotation[0] = rx;
        this.rotation[1] = ry;
        this.rotation[2] = rz;
        this.updateInternal();
    }

    moveBy(tx, ty, tz, rx, ry, rz) {
        this.update(this.position[0]+tx, this.position[1]+ty, this.position[2]+tz, rx, ry, rz);
    }

    getViewMatrix() {
        return this.matrix;
    }

    adjustToCamera(vect) {
        let result = [0 ,0 ,0];
        vec3.rotateX(result, vect, vec3_origin, -this.rotation[0]); 
        vec3.rotateY(result, result, vec3_origin, -this.rotation[1]); 
        return result;
    }  

    negateCamera(vect) {
        vec3.rotateY(vect, vect, vec3_origin, this.rotation[1]); 
        return vec3.rotateX(vect, vect, vec3_origin, this.rotation[0]); 
    }  

}

//  Basic free moving perspective camera view
class E3D_camera_persp extends E3D_camera { 
    constructor(id, width, height, fov, near, far) {
        super(id, width, height);

        this.fov = fov;
        this.near = near;
        this.far = far;

        this.resize(width, height, fov, near, far);
        this.updateInternal();
    }

    resize(width, height, fov, near, far) {
        this.fov = fov;
        this.near = near;
        this.far = far;
        mat4.perspective(this.baseMatrix, fov, width / height, near, far);
    }

    updateInternal() {
        // update matrix per internal data        
     //   mat4.rotateZ(this.matrix, this.baseMatrix, this.rotation[2] );
        mat4.rotateX(this.matrix, this.baseMatrix, this.rotation[0] );
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );

        mat4.translate(this.matrix, this.matrix, vec3.negate(vec3_dummy , this.position) );
    }

    move(tx, ty, tz, rx, ry, rz) {
        // adjust translation to current rotation
        const t = vec3.fromValues(tx , ty, tz);
   //     vec3.rotateZ(t, t, vec3_origin, -rz);
        vec3.rotateX(t, t, vec3_origin, -rx);
        vec3.rotateY(t, t, vec3_origin, -ry);
        // update
        this.update(this.position[0]+t[0], this.position[1]+t[1], this.position[2]+t[2], rx, ry, rz);
    }

}

// Model view camera, perspective matrix rotating aroung a pivot point
class E3D_camera_model extends E3D_camera_persp { 
    constructor(id, width, height, fov, near, far) {
        super(id, width, height, fov, near, far);
        this.nvx = vec3.create();
        this.nvy = vec3.create();
        this.zDist = 0; // position is now pivot point for rotation
        this.inverseRotationMatrix = mat4.create();

    }
    updateInternal() {
        // update matrix per internal data
        if (this.zDist != undefined) {
            mat4.translate(this.matrix, this.baseMatrix,  [0, 0, this.zDist]);

            mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );
            mat4.rotateX(this.matrix, this.matrix, this.rotation[0] );

            mat4.translate(this.matrix, this.matrix, vec3.negate(vec3_dummy , this.position) );
            
            mat4.rotate(this.inverseRotationMatrix, mat4_identity, -this.rotation[0], vec3_x);
            mat4.rotate(this.inverseRotationMatrix, this.inverseRotationMatrix ,-this.rotation[1], vec3_y);
        }
    }

    move(tx, ty, tz, rx, ry, rz) { // tx and ty pan and move the pivot point, z is always away from that point
        let t = vec3.fromValues(tx, ty, 0);
        vec3.transformMat4(t, t, this.inverseRotationMatrix);
        this.zDist -= tz;
        if (this.zDist > 0) {
            this.zDist = 0;
        }
        this.update(this.position[0] + t[0], this.position[1] + t[1], this.position[2] + t[2], rx, ry, rz);
    }

    adjustToCamera(vect) {
        let result = vec3.create();
        vec3.transformMat4(result, vect, this.inverseRotationMatrix);
        return result;
    }  

    negateCamera(vect) {
        vec3.rotateX(vect, vect, vec3_origin, this.rotation[0]); 
        vec3.rotateY(vect, vect, vec3_origin, this.rotation[1]); 
        vect[2] += this.zDist;
    }  


}

// Perspective matrix with incremental movements in 3D space
class E3D_camera_space extends E3D_camera_persp { 
    constructor(id, width, height, fov, near, far) {
        super(id, width, height, fov, near, far);

        this.lastRx = 0;
        this.lastRy = 0;
        this.lastRz = 0;
        this.nvx = vec3.create();
        this.nvy = vec3.create();
        this.nvz = vec3.create();
        this.rotationMatrix = mat4.create();
        this.inverseRotationMatrix = mat4.create();
        // start with identity matrix
        // translations are applied according to current matrix
        // then roration are applied incrementally from rotation matrix
        // output matrix is mix of both tx and rotation matrix
    }

    updateInternal() {
        // update matrix per internal data
        // Set new axis reference system
        if (this.nvx) {
            vec3.transformMat4(this.nvx, vec3_x, this.inverseRotationMatrix);
            vec3.transformMat4(this.nvy, vec3_y, this.inverseRotationMatrix);
            vec3.transformMat4(this.nvz, vec3_z, this.inverseRotationMatrix);

            mat4.rotate(this.rotationMatrix,this.rotationMatrix,this.rotation[0] , this.nvx);
            mat4.rotate(this.rotationMatrix,this.rotationMatrix, this.rotation[1] , this.nvy);
            mat4.rotate(this.rotationMatrix,this.rotationMatrix,this.rotation[2] , this.nvz);

            mat4.multiply(this.matrix, this.baseMatrix, this.rotationMatrix);     

            mat4.translate(this.matrix, this.matrix, vec3.negate(vec3_dummy , this.position) );

            mat4.invert(this.inverseRotationMatrix, this.rotationMatrix);
        }
    }

    move(tx, ty, tz, rx, rz, ry) { // rotation are now used with delta

        const t = vec3.fromValues(tx , ty, tz);
        vec3.transformMat4(t, t, this.inverseRotationMatrix);

        this.update(this.position[0]+t[0], this.position[1]+t[1], this.position[2]+t[2], rx - this.lastRx, ry - this.lastRy, rz - this.lastRz);
        this.lastRx = rx;
        this.lastRy = ry;
        this.lastRz = rz;
    }

    adjustToCamera(vect) {
        let result = vec3.create();
        vec3.transformMat4(result, vect, this.inverseRotationMatrix);
        return result;
    }  

    negateCamera(vect) {
    //    let result = vec3.create();
        return vec3.transformMat4(vect, vect, this.rotationMatrix);
      //  return result;
    }  

}

// Base class for ambiant and 2 directional lights for current shader model
class E3D_lighting {
    constructor(vAmbiant = vec3.fromValues(0.1, 0.1, 0.1)) {
        this.ambiant_color = vAmbiant;

        this.light0_color = vec3.fromValues(1.0, 1.0, 1.0);
        this.light0_direction = vec3.create();
        this.light0_adjusted = vec3.create();
        this.light0_lockToCamera = false;

        this.light1_color = vec3.fromValues(0.0, 0.0, 0.0);
        this.light1_direction = vec3.create(); 
        this.light1_adjusted = vec3.create();
        this.light1_lockToCamera = false;
    }

    setColorA(c){
        this.ambiant_color = c;
    }
    setColor0(c){
        this.light0_color = c;
    }
    setDirection0(d) {
        vec3.normalize(this.light0_direction, d);
        vec3.copy(this.light0_adjusted, this.light0_direction);
    }
    setColor1(c) {
        this.light1_color = c;
    }
    setDirection1(d) {
        vec3.normalize(this.light1_direction, d);
        vec3.copy(this.light1_adjusted, this.light1_direction);
    }

}


