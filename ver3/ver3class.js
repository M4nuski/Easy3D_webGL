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

        // float32Array of raw data
        this.vertexArray; 
        this.normalArray;
        this.colorArray;

        //this.textureID = ""; // todo        
        this.filename = filename;

        if (filename != "") {
            this.loadFromMS3DRAW(filename);
        }

        this.resetMatrix();
    } 

    loadFromMS3DRAW(filename) {

    }

    cloneBuffers(entity) {
        this.numElements = entity.numElements;
        this.drawMode = entity.drawMode;

        this.vertexBuffer = entity.vertexBuffer;
        this.normalBuffer = entity.normalBuffer;
        this.colorBuffer = entity.colorBuffer;

        if (entity.dynamic) {
            this.vertexArray = entity.vertexArray; 
            this.normalArray = entity.normalArray;
            this.colorArray = entity.colorArray;
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
        
        
    }

}


class E3D_entity_vector extends E3D_entity {
    constructor (id, showAxis, vectorScale, normalize) {
        super(id, "", true);
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


class E3D_animation {
    constructor(id, funct) {
        this.id = id;
        this.state = E3D_RESET;
        this.stateData = {}; // to store data through the animation
        this.anim = funct; // function delegate that perform the animation
    }

    animate(toAnimate) {
        if (this.anim) {
            this.anim(toAnimate, this); // object to animate, animation 
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
    animator(funct) {
        this.state = E3D_RESET;
        this.stateData = {}; 
        this.anim = funct;
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
            if ((this.entities[i].visible) && (this.entities[i].numElements > 0)) {

                // Entity Attributes
                if (this.entities[i].dynamic) {
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer, this.entities[i].vertexArray);
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer, this.entities[i].normalArray);    
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer, this.entities[i].colorArray);  
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


    addEntity(ent) {
        // Initialize context data buffers
        ent.vertexBuffer = this.context.createBuffer();
        ent.colorBuffer = this.context.createBuffer();
        ent.normalBuffer = this.context.createBuffer();

        if (!ent.dynamic) { // if static already assign data
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.STATIC_DRAW);
        
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.STATIC_DRAW);
            
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.STATIC_DRAW);
        }

        // Add entity to list
        this.entities.push(ent);

        return this.entities.length - 1; // return new index
    }

    cloneStaticEntity(id, newId) {
        let idx = this.getEntityIndexFromId(id);
        if ((idx > -1) && (!this.entities[idx].dynamic)){
            let ent = new E3D_entity(newId, this.entities[idx].filename, false);
            ent.cloneBuffers(this.entities[idx]);            
            this.entities.push(ent);
    
            return this.entities.length - 1; // return new index
        }        
    }

    getEntityIndexFromId(id) {
        for (let i = 0; i < this.entities.length; ++i) {
            if (this.entities[i].id == id) return i;
        }
        return -1;
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


