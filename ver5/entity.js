// Easy3D_WebGL
// Entities classes ontaining mesh data, hit testing and matrix controls
// Emmanuel Charette 2017-2020

"use strict"



// Base class for static entity, optionnally dynamic
class E3D_entity {
    constructor(id, dynamic = false, finiteSize = false) {
        this.index = -1; // index in global data stores for ENTITIES, ANIMATIONS and BODIES

        this.id = id; // to find object in list
        this.isVisible = false;

        // Spatial properties
        this.position = v3_new();
        this.rotation = v3_new();

        // Computed model matrix from position and rotation
        this.modelMatrix = m4_new();
        this.normalMatrix = m4_new(); // (model matrix without translations)

        // Animations
        this.hasAnimation = false;

        // Rigid body collisions
        this.hasBody = false;

        // For scene fustrum culling
        this.isVisibiltyCullable = true; // Setting to false will force the entity to always be redrawn
        this.visibilityDistance = 0; // maximum vertex distance from object center for culling (spherical envelope)
        
        // Mesh data
        this.isDynamic = dynamic; // Static (non-dynamic) entities have their data pushed to the GPU memory only once when added to scene.
                                  // Dynamic entities can have their data modified on the fly (at a performance cost).
        this.arraySize = 512; // base data array size for dynamic
        this.arrayIncrement = 512; // data increment step when adding new data beyond current array size
        this.arrayIndex = 0; // current position in the array of data
        this.finiteSize = finiteSize; // warp around a limit when adding new data

        this.dataContentChanged = false; // GPU buffers will be updated  
        this.dataSizeChanged = true; // GPU buffers will be reset and updated

        this.numElements = 0; // Actual number of vertices to draw.
        this.drawMode = CONTEXT.TRIANGLES;

        // To draw lines or overlay on model
        this.numStrokeElements = 0;
        this.drawStrokes = false;

        // GL buffer data stores
        // TODO: combine to single data store (v1 v2 v3 n1 n2 n3  u  v = face // smooth shaded
        //                                      3  3  3  3  3  3  1  1 = 20 floats / 80 bytes
        // _dataOffset_v1 = 0
        // _dataOffset_v2 = 3
        // _dataOffset_v3 = 6
        // _dataOffset_n1 = 9
        // _dataOffset_n2 = 12
        // _dataOffset_n3 = 15
        // _dataOffset_u = 18
        // _dataOffset_v = 19

        // OpenGL GPU buffer references
        this.vertexBuffer;
        this.normalBuffer;
        this.colorBuffer; // TODO replace by texture with this.uvBuffer;

        this.strokeIndexBuffer;

        // float32Array of raw data
        if (dynamic) {                            
            this.vertexArray = new Float32Array(this.arraySize * 3);
            this.normalArray = new Float32Array(this.arraySize * 3);
            this.colorArray  = new Float32Array(this.arraySize * 3);
        } else {
            this.vertexArray; 
            this.normalArray;
            this.colorArray;
        }

        // int32Array
        this.strokeIndexArray;

        // TODO this.textureID = "";
        // TODO material other than texture
        // TODO isTransparent // z-sort before render, dont write to depth buffer
        // this.zPos = 0; relative to fustrum, for z-sort

        this.updateMatrix();
    } 

    collisionDetection() {
        return this.isVisible && this.hasBody;
    }


    // Base transform properties


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

    updateMatrix(){
        // Recreate matrices from rotation and position
        // TODO Evaluate rotation as Pitch Yaw Roll vs quaternion

        m4_rotationZ_res(this.normalMatrix, this.rotation[2]);
        m4_rotateX_mod(this.normalMatrix, this.rotation[0]);
        m4_rotateY_mod(this.normalMatrix, this.rotation[1]);
        m4_copy(this.modelMatrix, this.normalMatrix);
        this.modelMatrix[12] =  this.position[0];
        this.modelMatrix[13] =  this.position[1];
        this.modelMatrix[14] =  this.position[2];

        if (this.collisionDetection()) BODIES[this.index].updateCDdata(this.modelMatrix, this.normalMatrix);
    }


    // Data management and access for dynamic data
    setSize(newSize) {
        if (newSize > this.arraySize) this.increaseSize(newSize - this.arraySize);
    }

    increaseSize(by = 1) {
        if (by < 0) throw new Error("Cannot increase size by negative value");

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
        
        this.numStrokeElements = 0;
        this.drawStrokes = false;

        this.arrayIndex = 0;
    }

    getColor(elem) {
        return this.colorArray.subarray(elem*3, (elem+1)*3);
    }    
    setColor(elem, col) {
        this.colorArray.set(col, elem * 3);
        this.dataContentChanged = true;
    }
    
    getNormal(elem) {
        return this.normalArray.subarray(elem*3, (elem+1)*3);
    }    
    setNormal(elem, norm) {
        this.normalArray.set(norm, elem*3);
        this.dataContentChanged = true;
    }
    
    getVertex(elem) {
        return this.vertexArray.subarray(elem*3, (elem+1)*3);
    }    
    setVertex(elem, vert) {
        this.vertexArray.set(vert, elem*3);
        this.dataContentChanged = true;
    }

    addV(vert) {
        if (this.arrayIndex >= this.numElements) this.increaseSize();
        this.setVertex(this.arrayIndex, vert);
        this.setColor(this.arrayIndex, this.currentColor);
        this.arrayIndex++;
        if ((this.finiteSize != false) && (this.arrayIndex >= this.finiteSize)) this.arrayIndex = 0;
    }
    addVC(vert, col) {
        if (this.arrayIndex >= this.numElements) this.increaseSize();
        this.setVertex(this.arrayIndex, vert);
        this.setColor(this.arrayIndex, col);
        this.arrayIndex++;
        if ((this.finiteSize != false) && (this.arrayIndex >= this.finiteSize)) this.arrayIndex = 0;
    }
    addVCN(vert, col, norm) {
        if (this.arrayIndex >= this.numElements) this.increaseSize();
        this.setVertex(this.arrayIndex, vert);
        this.setColor(this.arrayIndex, col);
        this.setNormal(this.arrayIndex, norm);
        this.arrayIndex++;
        if ((this.finiteSize != false) && (this.arrayIndex > this.finiteSize)) this.arrayIndex = 0;
    }
    addVN(vert, norm) {
        if (this.arrayIndex >= this.numElements) this.increaseSize();
        this.setVertex(this.arrayIndex, vert);
        this.setColor(this.arrayIndex, this.currentColor);
        this.setNormal(this.arrayIndex, norm);
        this.arrayIndex++;
        if ((this.finiteSize != false) && (this.arrayIndex >= this.finiteSize)) this.arrayIndex = 0;
    }
}




// 3 axis shown with optionnal vector. Wireframe rendering.
class E3D_entity_axis extends E3D_entity {
    constructor (id, showAxis, vectorScale, normalize) {
        super(id, true);

        this.vectorScale = vectorScale;
        this.normalize = normalize;
        this.drawMode = CONTEXT.LINES;

        this.isVisibiltyCullable = false;

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
        if (this.normalize) v3_normalize_mod(nv);

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
        super("E3D_entity_wireframe_canvas/" + id, true, finiteSize);

        this.drawMode = CONTEXT.LINES;

        this.vertexArray = new Float32Array(this.arraySize*3);
        this.colorArray = new Float32Array(this.arraySize*3);
        this.normalArray = new Float32Array(this.arraySize*3);

        this.colSweepIndex = 0;
        this.currentColor = _v3_white;

        this.currentPos = v3_new(); // draw cursor position
    }

    addSphere(location, radius, color = [1.0,1.0,1.0], sides = 16, segments = 1, addCD = false) {
        this.currentColor = color;

        var baseOffset = PIdiv2 / segments;

        var matX = m4_new();
        var matY = m4_new();
        var matZ = m4_new();
        
        for (var offsetIndex = 1; offsetIndex <= segments; ++offsetIndex) {
          
            var si = Math.sin(0) * radius;
            var ci = Math.cos(0) * radius;
          
            var offsetAngle = baseOffset + (2 * offsetIndex * PIdiv2 / segments);
          
            m4_rotationX_res(matX, offsetAngle);
            m4_rotationY_res(matY, offsetAngle);
            m4_rotationZ_res(matZ, offsetAngle); 
            
            var newLoc = v3_new();

            for (var i = 0; i < sides; ++i) { 

                var sip = Math.sin((i+1) * PIx2 / sides) * radius;
                var cip = Math.cos((i+1) * PIx2 / sides) * radius;

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

        if (addCD && this.hasBody) BODY[this.index].pushCD_sphere(location, radius);
    }
        
    addCross(location, size, color = [1.0,1.0,1.0], addCD = false) {
        this.currentColor = color;

        size = size / 2;

        this.addV( [ location[0] + size, location[1], location[2] ] );
        this.addV( [ location[0] - size, location[1], location[2] ] );

        this.addV( [ location[0], location[1] + size, location[2] ] );
        this.addV( [ location[0], location[1] - size, location[2] ] );

        this.addV( [ location[0], location[1], location[2] + size ] );
        this.addV( [ location[0], location[1], location[2] - size ] );

        if (addCD && this.hasBody) BODY[this.index].pushCD_point(location);
    }

    // on X Z plane
    addPlane(location, rotation, width, depth, color = [1.0,1.0,1.0], numSubdiv = 1, addCD = false) {
        this.currentColor = color;

        width = width / 2;
        depth = depth / 2;

        let p0 = [ width, 0.0,  depth];
        let p1 = [ width, 0.0, -depth];
        let p2 = [-width, 0.0, -depth];
        let p3 = [-width, 0.0,  depth];
        
        let m = m4_transform_new(location, rotation);

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
        numSubdiv--;
        if (numSubdiv > 0) {
            let a = [0,0,0];
            let b = [0,0,0];
            let c = [0,0,0];
            let d = [0,0,0];

            for (var i = 1; i <= numSubdiv; ++i){

                let t = i / (numSubdiv + 1);

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

        if (addCD && this.hasBody) {

            let up = [0, 1, 0];
            let rg = [1, 0, 0];
            let fr = [0, 0, 1];

            let rm = m4_rotationZ_new(rotation[2]);
            m4_rotateX_mod(rm, rotation[0]);
            m4_rotateY_mod(rm, rotation[1]);

            v3_applym4_mod(up, rm);
            v3_applym4_mod(rg, rm);
            v3_applym4_mod(fr, rm);

            BODY[this.index].pushCD_plane(location, up, rg, fr, width * 2.0, depth * 2.0, true);
        }
    }

    addCircle(location, rotation, radius, color = [1.0,1.0,1.0], sides = 16) {
        this.currentColor = color;
        if (sides < 3) sides = 3;

        var si = Math.sin(0) * radius;
        var ci = Math.cos(0) * radius;
        var v = [0.0, 0.0, 0.0];
        let m = m4_transform_new(location, rotation);

        for (var i = 0; i < sides; ++i) {
            var sip = Math.sin((i+1) * PIx2 / sides) * radius;
            var cip = Math.cos((i+1) * PIx2 / sides) * radius;

            v3_applym4_res(v, [si, 0, ci], m);
            this.addV(v);
            v3_applym4_res(v, [sip, 0, cip], m);
            this.addV(v);

            si = sip;            
            ci = cip;
        }
    }

    // upward along Y
    addCylinder(location, rotation, radius, height, color = [1.0,1.0,1.0], sides = 16, sideLines = 8, sections = 1) {
        this.currentColor = color;

        if (sections < 1) sections = 1;

        var si = Math.sin(0) * radius;
        var ci = Math.cos(0) * radius;

        let m = m4_transform_new(location, rotation);

        for (var i = 0; i < sides; ++i) { 

            var sip = Math.sin((i+1) * PIx2 / sides) * radius;
            var cip = Math.cos((i+1) * PIx2 / sides) * radius;
            
            // base
            var v = [si, 0, ci];
            v3_applym4_mod(v, m);
            this.addV(v);

            v = [sip, 0, cip];
            v3_applym4_mod(v, m);
            this.addV(v);
 
            
            // top
            v = [si, height, ci];  
            v3_applym4_mod(v, m);
            this.addV(v);  

            v = [sip, height, cip];            
            v3_applym4_mod(v, m);
            this.addV(v);
    

            if ( (sideLines > 0) && ((i % Math.ceil(sides / sideLines)) == 0) ) {
                // side
                v = [si, 0, ci];    
                v3_applym4_mod(v, m);
                this.addV(v);

                v = [si, height, ci];
                v3_applym4_mod(v, m);
                this.addV(v);
            }

            for (var j = 1; j < sections; ++j) {

                var v = [si, j * height / sections, ci];
                v3_applym4_mod(v, m);
                this.addV(v);

                v = [sip, j * height / sections, cip];
                v3_applym4_mod(v, m);
                this.addV(v);
            }

            si = sip;
            ci = cip;
  
        }

    }


    nextColor() {
        this.colSweepIndex++;
        return v3_colorsweep_RGBCMY_new(this.colSweepIndex);
    }

    moveLineCursorTo (p) {
        v3_copy(this.currentPos, p);
    }
    moveLineCursorBy (p) {
        v3_add_mod(this.currentPos, p);
    }

    addLineTo(p, color = [1.0,1.0,1.0]) {
        this.addVC(this.currentPos, color);
        this.addVC(p, color);

        v3_copy(this.currentPos, p);
    }

    addLine(p0, p1, color = [1.0,1.0,1.0]) {
        this.addVC(p0, color);
        this.addVC(p1, color);
    }


    addLineByOffset(p, color = [1.0,1.0,1.0]) {
        this.addVC(this.currentPos, color);
        v3_add_mod(this.currentPos, p);
        this.addVC(this.currentPos, color);  
    }

    addLineByNormalAndLength(n, l, color = [1.0,1.0,1.0]) {
        this.addVC(this.currentPos, color);
        v3_addscaled_mod(this.currentPos, n, l);
        this.addVC(this.currentPos, color);
    }

    
    addLineByPosNormLen(p, n, l, color = [1.0,1.0,1.0]) {
        v3_copy(this.currentPos, p);
        this.addVC(this.currentPos, color);
        v3_addscaled_mod(this.currentPos, n, l);
        this.addVC(this.currentPos, color);
    }

    addCube(location, rotation, size, color = [1.0,1.0,1.0], centerCross = false, sideCross = false, bottom = true, addCD = false) {
        if (!Array.isArray(size)) size = [size, size, size];
        size[0] = Math.abs(size[0]) / 2;
        size[1] = Math.abs(size[1]) / 2;
        size[2] = Math.abs(size[2]) / 2;

        let m = m4_transform_new(location, rotation);

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

        this.addLine(tfr, tfl, color);
        this.addLine(tfl, trl, color);
        this.addLine(trl, trr, color);
        this.addLine(trr, tfr, color);

        this.addLine(bfr, bfl, color);
        this.addLine(bfl, brl, color);
        this.addLine(brl, brr, color);
        this.addLine(brr, bfr, color);


        this.addLine(tfr, bfr, color);
        this.addLine(tfl, bfl, color);
        this.addLine(trl, brl, color);
        this.addLine(trr, brr, color);

        if (centerCross) {
            this.addLine(tfr, brl, color);
            this.addLine(tfl, brr, color);
            this.addLine(trl, bfr, color);
            this.addLine(trr, bfl, color);
        }
        if (sideCross) {
            this.addLine(tfr, bfl, color); //f
            this.addLine(tfl, bfr, color);

            this.addLine(tfr, brr, color); //ri
            this.addLine(trr, bfr, color);

            this.addLine(tfl, brl, color);//l
            this.addLine(trl, bfl, color);

            this.addLine(trl, brr, color);//re
            this.addLine(trr, brl, color);

            this.addLine(tfr, trl, color);//t
            this.addLine(tfl, trr, color);
            if (bottom) {
                this.addLine(brl, bfr, color); //b
                this.addLine(brr, bfl, color);
            }
        }
        if (addCD && this.hasBody) {

            let x = [1, 0, 0];
            let y = [0, 1, 0];
            let z = [0, 0, 1];

            m = m4_rotationZ_new(rotation[2]);
            m4_rotateX_mod(m, rotation[0]);
            m4_rotateY_mod(m, rotation[1]);

            v3_applym4_mod(x, m);
            v3_applym4_mod(y, m);
            v3_applym4_mod(z, m);

            BODIES[this.index].pushCD_box(location, x, y, z, size[0], size[1], size[2], bottom); 
        }
    }


    addTriangle(p1, p2, p3, color = [1.0,1.0,1.0], addCD = false) {
        this.currentColor = color;

        this.addV(p1);
        this.addV(p2);

        this.addV(p2);
        this.addV(p3);

        this.addV(p3);
        this.addV(p1);

        if (addCD && this.hasBody) BODIES[this.index].pushCD_triangle(p1, p2, p3, true);
    }

    addCapsule(location, rotation, length, radius, color = [1.0,1.0,1.0], sides = 16, sideLines = 8, sections = 1, addCD = false) {
        this.currentColor = color;

        let m = m4_transform_new(location, rotation);

        var v = [0.0, 0.0, 0.0];
        let p1 = [0.0, 0.0, 0.0];
        v3_applym4_res(v, p1, m);
        this.addV(v);
        let p2 = [0.0, length, 0.0];
        v3_applym4_res(v, p2, m);
        this.addV(v);
        var si = Math.sin(0) * radius;
        var ci = Math.cos(0) * radius;

        for (var i = 0; i < sides; ++i) {
            var sip = Math.sin((i+1) * PIx2 / sides) * radius;
            var cip = Math.cos((i+1) * PIx2 / sides) * radius;

            for (var j = 0; j <= sections; ++j) {
                let h = j * length / sections;
                v3_applym4_res(v, [si, h, ci], m);
                this.addV(v);
                v3_applym4_res(v, [sip, h, cip], m);
                this.addV(v);
            }

            for (var j = 0; j < sideLines; ++j) {
                let ang = PIx2 * j / sideLines;
                if (i >= sides / 2) {
                    v3_rotateY_res(v, [0.0, si, ci], ang);
                    v3_applym4_mod(v, m);
                    this.addV(v);
                    v3_rotateY_res(v, [0.0, sip, cip], ang);
                    v3_applym4_mod(v, m);
                    this.addV(v);
                } else {
                    v3_rotateY_res(v,[0.0, si + length, ci], ang);
                    v3_applym4_mod(v, m);
                    this.addV(v);
                    v3_rotateY_res(v,[0.0, sip + length, cip], ang);
                    v3_applym4_mod(v, m);
                    this.addV(v);
                }
            }

            if ( (sideLines > 0) && ((i % Math.ceil(sides / sideLines)) == 0) ) {
                // side
                v = [si, 0, ci];    
                v3_applym4_mod(v, m);
                this.addV(v);

                v = [si, length, ci];
                v3_applym4_mod(v, m);
                this.addV(v);
            }


            si = sip;
            ci = cip;
        }
        if (addCD && this.hasBody) {
            let n = [0, 1, 0];
            v3_rotateZ_mod(n, rotation[2]);
            v3_rotateX_mod(n, rotation[0]);
            v3_rotateY_mod(n, rotation[1]);
            BODIES[this.index].pushCD_capsule(location, n, radius, length);
        }
    }

    // TODO addBodyParts()

}




// Dynamic entity that allow to re-copy a source entity multiple times (ex: for particules)
class E3D_entity_dynamicCopy extends E3D_entity {
    constructor (id, sourceEntity) {
        super(id, true);

        this.srcVertex = new Float32Array(sourceEntity.vertexArray);
        this.srcColor  = new Float32Array(sourceEntity.colorArray);
        this.srcNormal = new Float32Array(sourceEntity.normalArray);
        this.srcNumElements = sourceEntity.numElements;

        this.dataContentChanged = true;
        this.dataSizeChanged = true;
    }
    copySource(offset = _v3_null) {
        this.setSize(this.numElements + this.srcNumElements);
        this.vertexArray.set(this.srcVertex, this.numElements * 3);
        this.colorArray.set( this.srcColor,  this.numElements * 3);
        this.normalArray.set(this.srcNormal, this.numElements * 3);

        for (var i = 0; i < this.srcNumElements; ++i) {
            var vertex = this.vertexArray.subarray((this.numElements + i) * 3, (this.numElements + i + 1) * 3);
            v3_add_mod(vertex, offset);
        }    

        this.numElements += this.srcNumElements;

        this.dataContentChanged = true;
        this.dataSizeChanged = true;
    }


}