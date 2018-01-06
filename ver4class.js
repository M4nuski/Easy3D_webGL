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


class E3D_entity {
    constructor(id, filename, dynamic = false) {

        this.id = id; // to find object in list
        this.visible = false;
        this.dynamic = dynamic;

        // Properties
        this.position = vec3.create();
        this.rotation = vec3.create();
        this.scale = vec3.fromValues(1.0, 1.0, 1.0);

        // fustrum culling
        this.cull_dist = 0; // 0 disable
        this.cull_dist_scale = 1.0;
        
        // Computed matrix
        this.modelMatrix = mat4.create();
        this.normalMatrix = mat4.create();

        // Data
        this.numElements = 0;
        this.drawMode = 4;//gl.TRIANGLES;

        // GL buffer data stores
        this.vertexBuffer;
        this.normalBuffer;
        this.colorBuffer; // todo replace by texture
        //this.uvBuffer; // todo
        //this.indiceBuffer; // todo 

        // float32Array of raw data for dynamic rendering
        this.vertexArray; 
        this.normalArray;
        this.colorArray;

        //this.textureID = ""; // todo        
        this.filename = filename;

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
            this.CD_iPlane_d0 = []; // original to model space
            this.CD_iPlane_d  = []; // transformed to world space (scale)
            this.CD_iPlane_n0 = []; // normal original to model space
            this.CD_iPlane_n  = []; // normal transformed to world space (rotation, scale)

            // TODO Finite Plane Target
            // TODO Cubic Target (/Source?)

        this.resetMatrix();
    } 

    cloneData(entity) {
        this.numElements = entity.numElements;
        this.drawMode = entity.drawMode;

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

    }


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
        
        this.cull_dist_scale = vec3.length(this.scale)/1.732;

        for (var i = 0; i < this.CD_vec; ++i) {
            vec3.transformMat4(this.CD_vec_p[i], this.CD_vec_p0[i], this.modelMatrix);
            vec3.transformMat4(this.CD_vec_v[i], this.CD_vec_v0[i], this.modelMatrix);
        }
        for (var i = 0; i < this.CD_sph; ++i) {
            vec3.transformMat4(this.CD_sph_p[i], this.CD_sph_p0[i], this.modelMatrix);
            this.CD_sph_r[i] = this.CD_sph_r0[i] * this.cull_dist_scale;
            this.CD_sph_rs[i] = this.CD_sph_r[i] * this.CD_sph_r[i];
        }
        for (var i = 0; i < this.CD_iPlane; ++i) {
            vec3.transformMat4(this.CD_iPlane_n[i], this.CD_iPlane_n0[i], this.normalMatrix);
            // norm * 1/scale
            vec3.multiply(this.CD_iPlane_n[i], this.CD_iPlane_n[i], vec3.inverse(vec3_dummy ,this.scale));
        }
    }

    pushCD_vec(p, v) {
        this.CD_vec_p0[this.CD_vec] = p.slice(); 
        this.CD_vec_p[this.CD_vec] = p.slice();
        
        this.CD_vec_v0[this.CD_vec] = p.slice(); 
        this.CD_vec_v[this.CD_vec] = p.slice(); 
        
        this.CD_vec += 1;
    }
    pushCD_sph(p, r) {
        this.CD_sph_p0[this.CD_sph] = p.slice();
        this.CD_sph_p[this.CD_sph] = p.slice(); 
        
        this.CD_sph_r0[this.CD_sph] = r;
        this.CD_sph_r[this.CD_sph] = r;
        this.CD_sph_rs[this.CD_sph] = r*r;
        
        this.CD_sph += 1;
    }
    pushCD_iPlane(d, n) {
        this.CD_iPlane_d0[this.CD_iPlane] = d; 
        this.CD_iPlane_d[this.CD_iPlane] = d; 
        this.CD_iPlane_n0[this.CD_iPlane] = n.slice(); 
        this.CD_iPlane_n[this.CD_iPlane] = n.slice();

        this.CD_iPlane += 1;
    }

}


class E3D_entity_vector extends E3D_entity {
    constructor (id, showAxis, vectorScale, normalize) {
        super(id, "E3D_entity_vector/" + id, true);
        this.showAxis = showAxis; // todo
        this.vectorScale = vectorScale;
        this.normalize = normalize;
        this.drawMode = 1; // gl.LINES;

        this.vertexArray = new Float32Array([0, 0, 0, 1, 0, 0,
                                             0, 0, 0, 0, 1, 0,
                                             0, 0, 0, 0, 0, 1,
                                             0, 0, 0, 1, 1, 1]);

        this.colorArray = new Float32Array([1, 0, 0, 1, 0, 0,
                                            0, 1, 0, 0, 1, 0,
                                            0, 0, 1, 0, 0, 1,
                                            1, 1, 1, 1, 1, 1 ]);

        this.normalArray = new Float32Array(24);

        this.numElements = 8;
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
    }
}


class E3D_entity_dynamic extends E3D_entity {
    constructor(id) {
        super(id, "E3D_entity_dynamic/"+id, true);
        this.drawMode = 1; // gl.LINES;      
        this.arraySize = 0;
        this.arrayIncrement = 128 ;// 3 vertex * 128;

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
    }
    
    
    getColor3f(elem) {
        return this.colorArray.subarray(elem*3, (elem+1)*3);
    }    
    setColor3f(elem, col) {
        this.colorArray.set(col, elem*3);
    }
    
    getNormal3f(elem) {
        return this.normalArray.subarray(elem*3, (elem+1)*3);
    }    
    setNormal3f(elem, norm) {
        this.normalArray.set(norm, elem*3);
    }
    
    getVertex3f(elem) {
        return this.vertexArray.subarray(elem*3, (elem+1)*3);
    }    
    setVertex3f(elem, vert) {
        this.vertexArray.set(vert, elem*3);
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
        //    let n = [0, 0, 1];
         //   vec3.rotateZ(n, n, vec3_origin, rot[2]); 
         //   vec3.rotateX(n, n, vec3_origin, rot[0]); 
         //   vec3.rotateY(n, n, vec3_origin, rot[1]); 
            this.pushCD_iPlane(-vec3.dot(pos, n), n);// vec3.length(pos), n);

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



}

class E3D_entity_dynamicCopy extends E3D_entity_dynamic {
    constructor (id, sourceEntity) {
        super(id, true);

        this.numElements = 0;
        this.cull_dist = 0;
        this.drawMode = 4;//gl.TRIANGLES;

        this.srcVertex = new Float32Array(sourceEntity.vertexArray);
        this.srcColor = new Float32Array(sourceEntity.colorArray);
        this.srcNormal = new Float32Array(sourceEntity.normalArray);
        this.srcNumElements = sourceEntity.numElements;
    }

    copySource(offset) { // offset in elements     
        this.vertexArray.set(this.srcVertex, offset*3);
        this.colorArray.set(this.srcColor, offset*3);
        this.normalArray.set(this.srcNormal, offset*3);
    }


}

class E3D_animation {
    constructor(id, animatorFunct, targetObject, sceneContext, timerclass) { // id ??
        this.id = id;
        this.anim = animatorFunct; // function delegate that perform the animation
        this.target = targetObject;
        this.scn = sceneContext;
        this.timer = timerclass;

        this.state = E3D_RESET;
        this.data = {}; // to store data through the animation
    }

    animate() {
        if (this.anim) {
            this.anim();
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

        // context data buffers for dynamic entities
        this.vertexBuffer = context.createBuffer();
        this.colorBuffer  = context.createBuffer();
        this.normalBuffer = context.createBuffer();

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
        this.context.bufferData(this.context.ARRAY_BUFFER, data, this.context.DYNAMIC_DRAW);
        this.context.vertexAttribPointer(location, 3, this.context.FLOAT, false, 0, 0);
        this.context.enableVertexAttribArray(location);
    }


    addEntity(ent, visibility_culling = true) {
        // Initialize context data buffers
        
        if (!ent.dynamic) { // if static initialize context data buffers and assign data right away

            ent.vertexBuffer = this.context.createBuffer();
            ent.colorBuffer = this.context.createBuffer();
            ent.normalBuffer = this.context.createBuffer();

            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.STATIC_DRAW);        
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.STATIC_DRAW);            
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.STATIC_DRAW);
        }

        ent.resetMatrix();

        if (visibility_culling) {
            ent.cull_dist = E3D_scene.cull_calculate_max_dist(ent.vertexArray);
        } else {
            ent.cull_dist = 0;
        }

        // Add entity to list
        this.entities.push(ent);

        return this.entities.length - 1; // return new index
    }

    cloneEntity(id, newId) {
        let idx = this.getEntityIndexFromId(id);
        if (idx > -1) {
            var ent = new E3D_entity(newId, this.entities[idx].filename, this.entities[idx].dynamic);
            ent.cloneData(this.entities[idx]);   
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

    removeEntity(id) {
        let idx = this.getEntityIndexFromId(id);
        if (idx > -1) {
            this.entities.splice(idx, 1);
        }    
    }

    static cull_calculate_max_dist(vertArray) {
        let result = 0;
        for (let i = 0; i < vertArray.length; i += 3) {
            var currentDist = vec3.length([vertArray[i], vertArray[i+1], vertArray[i+2] ]);
            if (currentDist > result) result = currentDist;
        }
        return result;
    }

    cull_check_visible(idx) {
        if (this.entities[idx].cull_dist > 0) {
            var pos = [0, 0, 0];
            vec3.subtract(pos, this.entities[idx].position, this.camera.position);
            this.camera.negateCamera(pos);
            var dist = -pos[2];
            return (((dist - (this.entities[idx].cull_dist*this.entities[idx].cull_dist_scale)) < this.camera.far) && 
            ((dist + (this.entities[idx].cull_dist*this.entities[idx].cull_dist_scale)) > this.camera.near) );
        }
        return true;
    }

}

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

class E3D_camera { // base camera, orthogonal

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

    move(tx, ty, tz, rx, ry, rz) {
        this.update(this.position[0]+tx, this.position[1]+ty, this.position[2]+tz, rx, ry, rz);
    }

    getViewMatrix() {
        return this.matrix;
    }

    adjustToCamera(vect) {
        let result = vec3.create();
        vec3.rotateX(result, vect, vec3_origin, -this.rotation[0]); 
        vec3.rotateY(result, result, vec3_origin, -this.rotation[1]); 
        return result;
    }  

    negateCamera(vect) {
        vec3.rotateY(vect, vect, vec3_origin, this.rotation[1]); 
        return vec3.rotateX(vect, vect, vec3_origin, this.rotation[0]); 
    }  

}

class E3D_camera_persp extends E3D_camera { // basic perspective based matrix view (free move)
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

class E3D_camera_model extends E3D_camera_persp { // perspective view around center point
    constructor(id, width, height, fov, near, far) {
        super(id, width, height, fov, near, far);
    }
    updateInternal() {
        // update matrix per internal data
        mat4.translate(this.matrix, this.baseMatrix, vec3.negate(vec3_dummy , this.position) );

        mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0] );
    //    mat4.rotateZ(this.matrix, this.matrix, this.rotation[2] );        
    }

    move(tx, ty, tz, rx, ry, rz) {
        this.update(this.position[0] + tx, this.position[1] + ty, this.position[2] + tz, rx, ry, rz);
    }
}

class E3D_camera_space extends E3D_camera_persp { // free 3D view incremental direction and position
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


