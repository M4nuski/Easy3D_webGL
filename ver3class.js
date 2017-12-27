class E3D_timing {
    constructor(run, interval, onTick) {

        this.onTick = onTick;

        this.delta = interval / 1000;
        this.tickInterval = interval;

        this.timer; 

        this.start = new Date().getTime();
        this.lastTick = this.start;
        this.active = run;

        if (run) {
            this.timer = setInterval( () => {this.tickEvent() }, interval);
        }
    }
    smooth(val, target, fact) { // TODO upgrade for time independant smoothing
        return val + ((target-val) * fact);
        // target Fact + val - val fact
        // target + (target - val) * fact
        //return target + ((target - val) * fact);  
    }

    run() {
        this.lastTick = new Date().getTime();
        this.timer = setInterval( () => {this.tickEvent() }, this.tickInterval);
        this.active = true;
    }
    pause() {
        clearInterval(this.timer);
        this.active = false;
    }

    tickEvent(){
        const ts = new Date().getTime(); 

        this.delta = (ts - this.lastTick) / 1000;
        this.lastTick = ts;

        if (this.onTick) {             
            this.onTick(); 
        }
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
        //fill own buffers with other entity's buffer data
    }

    resetMatrix(){
        // recreate matrices from scale, rotation and position
        mat4.rotateZ(this.normalMatrix, mat4.create(), this.rotation[2] );
        mat4.rotateX(this.normalMatrix, this.normalMatrix, this.rotation[0] );
        mat4.rotateY(this.normalMatrix, this.normalMatrix, this.rotation[1] );

        mat4.rotateZ(this.modelMatrix, mat4.create(), this.rotation[2] );
        mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0] );
        mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1] );

        mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        
        mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);
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
    constructor(id, context, width, height, vBackColor = vec4.fromValues(0.0, 0.0, 0.1, 1.0)) {
        this.id = id;
        this.context = context; // GL rendering context
        this.state = E3D_CREATED;

        this.camera = new E3D_camera();
        this.camera.resize(width, height);
        this.camera.updateInternal(); // finalize view matrix

        this.entities = [];

        this.lights = new E3D_lighting();
        this.clearColor = vBackColor;

        //this.setupFunction = null; // callback to setup scene before rendering
        //this.renderFunction = null; // callback to render scene
        this.program = null; // shader program class

    }

    initialize() {
        // config GL context        
        this.context.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.context.clearDepth(1.0);
        this.context.enable(this.context.DEPTH_TEST);
        this.context.depthFunc(this.context.LEQUAL);
        this.context.cullFace(this.context.BACK);
        this.context.enable(this.context.CULL_FACE);
    }

    preRender() {
        // timing, events, controls, camera, animations
    }
    render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // entities, sprites, hud


    }
    postRender() {
        // cleanup or other events
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

  /*  programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
            vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
            vertexNormal:  gl.getAttribLocation(shaderProgram, 'aVertexNormal')
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
            modelNormalMatrix: gl.getUniformLocation(shaderProgram, 'uModelNormalMatrix'),
            light:  gl.getUniformLocation(shaderProgram, 'uLight')
        },
    };*/




    static loadShader(gl, type, source) {
        const shader = gl.createShader(type);       
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log('An error occurred compiling the '+ type +' shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }



}

class E3D_camera { // base camera, orthogonal

    constructor(id) {        
        this.id = id;
        this.rotation = vec3.create();
        this.position = vec3.create();
        this.matrix = mat4.create();
        this.baseMatrix = mat4.create(); 
    }

    resize(width, height) {
        let wd2 = width /2;
        let hd2 = height /2;
        let dd2 = wd2;
        
        if (hd2 > wd2) {
            dd2 = hd2;
        }
        
        this.baseMatrix = mat4.create();
        mat4.ortho(this.baseMatrix, -wd2, wd2, hd2, -hd2, -dd2, dd2);  
    }

    updateInternal() {
        // create matrix per position and rotation
        mat4.translate(this.matrix, this.baseMatrix, [-this.position[0], -this.position[1], -this.position[2]] );

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
        vec3.rotateX(result, vect, [0, 0, 0], -this.rotation[0]); 
        vec3.rotateY(result, result, [0, 0, 0], -this.rotation[1]); 
        return result;
    }  

}

class E3D_camera_persp extends E3D_camera { // basic perspective based matrix view (free move)
    constructor(id, width, height, fov, near, far) {
        super(id);

        this.fov = fov;
        this.near = near;
        this.far = far;
        this.baseMatrix = mat4.perspective(mat4.create(), fov, width / height, near, far);
    }

    resize(width, height, fov, near, far) {
        this.fov = fov;
        this.near = near;
        this.far = far;
        this.baseMatrix = mat4.perspective(mat4.create(), fov, width / height, near, far);
    }

    updateInternal() {
        // update matrix per internal data        
        mat4.rotateZ(this.matrix, this.baseMatrix, this.rotation[2] );
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0] );
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );

        mat4.translate(this.matrix, this.matrix, [-this.position[0], -this.position[1], -this.position[2]] );
    }

    move(tx, ty, tz, rx, ry, rz) {
        // adjust translation to current rotation
        const t = vec3.fromValues(tx , ty, tz);
        vec3.rotateZ(t, t, [0,0,0], -rz);
        vec3.rotateX(t, t, [0,0,0], -rx);
        vec3.rotateY(t, t, [0,0,0], -ry);
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
        mat4.translate(this.matrix, this.baseMatrix,  [-this.position[0], -this.position[1], -this.position[2]] );

        mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0] );
        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2] );        
    }

    move(tx, ty, tz, rx, ry, rz) {
        this.update(this.position[0] + tx, this.position[1] + ty, this.position[2] + tz, rx, ry, rz);
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
        this.light0_adjusted = vec3.clone(this.light0_direction);
    }
    setColor1(c) {
        this.light1_color = c;
    }
    setDirection1(d) {
        vec3.normalize(this.light1_direction, d);
        this.light1_adjusted = vec3.clone(this.light1_direction);
    }

}



