// Easy3D_WebGL
// Entities classes ontaining mesh data, hit testing and matrix controls
// Emmanuel Charette 2017-2020

"use strict"


// Base class for static entity, optionnally dynamic
class E3D_entity {
    constructor(id, dynamic = false) {

        this.id = id; // to find object in list
        this.isVisible = false;
        this.isDynamic = dynamic; // Static (non-dynamic) entities have their data pushed to the GPU memory only once when added to scene.
                                  // Dynamic entities can have their data modified on the fly (at a performance cost).

        this.dataContentChanged = false; // GPU buffers will be updated  
        this.dataSizeChanged = true; // GPU buffers will be reset and updated

        // Properties
        this.position = v3_new();
        this.rotation = v3_new();

        // fustrum culling
        this.isVisibiltyCullable = true; // Setting to false will force the entity to always be redrawn
        this.visibilityDistance = 0; // maximum vertex distance from object center for culling (spherical envelope)
        
        // Computed matrix
        this.modelMatrix = m4_new();
        this.normalMatrix = m4_new(); // (model matrix without translations)

        // Data
        this.numElements = 0; // Actual number of vertices to draw.
        this.drawMode = CONTEXT.TRIANGLES;

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

        this.vertexBuffer;
        this.normalBuffer;
        this.colorBuffer; // TODO replace by texture with this.uvBuffer;

        this.strokeIndexBuffer;

        // float32Array of raw data, can be flushed for static entities 
        this.vertexArray; 
        this.normalArray;
        this.colorArray;

        // int16Array
        this.strokeIndexArray;


        // TODO this.textureID = ""; 
        // TODO isTransparent // z-sort before render, dont write to depth buffer



        // Animation
        // TODO isAnimated
        this.isAnimated = false;
        this.animation = null; // E3D_animationData

        //Collisions
        this.isCollisionSource = false;
        this.isCollisionTarget = false;
        this.collision = new E3D_collisionData();
        // TODO isCollisionFragmented // CD object is a list of multiple CD object with sph pre-cull
    
        this.updateMatrix();
    } 

    collisionDetection() {
        return this.isCollisionSource || this.isCollisionTarget || this.isVisible;
    }

    clear() {
        this.isVisible = false;
        this.dataContentChanged = true; // GPU buffers will be updated  
        this.dataSizeChanged = true; // GPU buffers will be reset and updated

        // Properties
        this.position = v3_new();
        this.rotation = v3_new();

        this.isVisibiltyCullable = true;
        this.visibilityDistance = 0;
        
        // Computed matrix
        this.modelMatrix = m4_new();
        this.normalMatrix = m4_new();

        // Data
        this.numElements = 0; // Actual number of vertices to draw.
        this.drawMode = CONTEXT.TRIANGLES; // Triangles

        if (this.vertexBuffer) CONTEXT.deleteBuffer(this.vertexBuffer);
        if (this.normalBuffer) CONTEXT.deleteBuffer(this.normalBuffer);
        if (this.colorBuffer) CONTEXT.deleteBuffer(this.colorBuffer);
        if (this.strokeIndexBuffer) CONTEXT.deleteBuffer(this.strokeIndexBuffer);

        this.vertexArray = null; 
        this.normalArray = null;
        this.colorArray = null;
        this.strokeIndexArray = null

        this.drawStrokes = false;
        this.numStrokeElements = 0;

        this.isAnimated = false;
        this.animation = new E3D_animationData();

        this.isCollisionSource = false;
        this.isCollisionTarget = false;
        this.collision = new E3D_collisionData();
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

        if (this.collisionDetection()) this.collision.updateCDdata(this.modelMatrix, this.normalMatrix);
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
        super("E3D_entity_wireframe_canvas/" + id, true);
        this.drawMode = CONTEXT.LINES;
        this.arraySize = 512;
        this.arrayIncrement = 512; // 256 lines

        this.vertexArray = new Float32Array(this.arraySize*3);
        this.colorArray = new Float32Array(this.arraySize*3);
        this.normalArray = new Float32Array(this.arraySize*3);

        this.colSweep =  [ [1,0,0], [1,1,0] ,[0,1,0] ,[0,1,1] ,[0,0,1], [1,0,1] ];
        this.colSweepIndex = 0;

        this.currentPos = v3_new();

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

        if (this.collisionDetection()) this.collision.clear();

        this.isCollisionSource = false;
        this.isCollisionTarget = false;

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
        if (addSphCD) this.collision.pushCD_sph(location, dia);
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

            this.collision.pushCD_plane(pos, n, w, h, width, height);

            let p = [-width, height, 0];
            n = [1, 0, 0];
            v3_applym4_mod(p, m);
            v3_applym4_mod(n, rm);

            this.collision.pushCD_edge(p, n, width * 2);

            p = [-width, -height, 0];
            v3_applym4_mod(p, m);

            this.collision.pushCD_edge(p, n, width * 2);

            p = [-width, -height, 0];
            n = [0, 1, 0];
            v3_applym4_mod(p, m);
            v3_applym4_mod(n, rm);
            this.collision.pushCD_edge(p, n, height * 2);

            p = [width, -height, 0];
            v3_applym4_mod(p, m);
            this.collision.pushCD_edge(p, n, height * 2);

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

    addWireCube(loc, rot, size, color, addBoxCD = false, centerCross = false, sideCross = false) {
        if (!Array.isArray(size)) size = [size, size, size];
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

            this.collision.pushCD_box(loc, x, y, z, size[0], size[1], size[2], true); 
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
            this.collision.pushCD_triangle(n, p1, p2, p3);
        }
    }


}




// Dynamic copy of entity
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
    copySource() {
        this.vertexArray.set(this.srcVertex, this.numElements * 3);
        this.colorArray.set( this.srcColor,  this.numElements * 3);
        this.normalArray.set(this.srcNormal, this.numElements * 3);

        this.numElements += this.srcNumElements;

        this.dataContentChanged = true;
        this.dataSizeChanged = true;
    }


}