class E3D_timing {
    constructor(run, interval, onTick) {

        this.onTick = onTick;

        this.delta = interval / 1000;
        this.tickInterval = interval;

        this.timer; 

        this.start = Date.now();
        this.lastTick = this.start;
        this.active = run;
        this.usage = this.start;

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
        //fill own buffers with other entity's buffer data

    }

    resetMatrix(){
        // recreate matrices from scale, rotation and position
        mat4.rotateZ(this.normalMatrix, mat4_identity, this.rotation[2] );
        mat4.rotateX(this.normalMatrix, this.normalMatrix, this.rotation[0] );
        mat4.rotateY(this.normalMatrix, this.normalMatrix, this.rotation[1] );

        mat4.rotateZ(this.modelMatrix, mat4_identity, this.rotation[2] );
        mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0] );
        mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1] );

        mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        
        mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);
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

        mat4.translate(this.matrix, this.matrix, vec3.negate(vec3_dummy , this.position) );
    }

    move(tx, ty, tz, rx, ry, rz) {
        // adjust translation to current rotation
        const t = vec3.fromValues(tx , ty, tz);
        vec3.rotateZ(t, t, vec3_origin, -rz);
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




class E3D_input {
    constructor (element, supportMouse, supportKeyboard, supportTouch, lockMouse) {

        this.element = element;

        this.supportMouse = supportMouse;
        this.supportKeyboard = supportKeyboard;
        this.supportTouch = supportTouch;
        this.lockMouse = lockMouse;

        this.doPan = true;
        this.doRotate = true;
        this.mouseMoveWhenLockedOnly = false;

        this.touchDist = 0;
        this.ongoingTouches = [];
        this.inputTable = {};

        if (supportMouse) {
            element.addEventListener("mousedown", (e) => { this.mouseDown(e) } );
            element.addEventListener("mouseup", (e) => { this.mouseUp(e) } );
            element.addEventListener("mousemove", (e) => {this.mouseMove(e) } );
            element.addEventListener("mouseleave",(e) => { this.mouseLeave(e) } );
            element.addEventListener("wheel", (e) => {this.mouseWheel(e) } );
            element.addEventListener("dblclick", (e) => {this.mouseDblClick(e) } );
        }

        if (supportKeyboard) {
            document.addEventListener("keydown",(e) => { this.keyDown(e) } );
            document.addEventListener("keyup",(e) => { this.keyUp(e) } );
        }

        if (lockMouse) {
            if (pLockSupported) { 
                pLockMoveEvent = (x, y) => { this.mouseLockedMove(x, y) } ; 
            }
        } else console.log("Mouse lock requested but not supported");

        if (supportTouch) {
            element.addEventListener("touchstart", (e) => {this.touchStart(e) } );
            element.addEventListener("touchend", (e) => {this.touchEnd(e) } );
            element.addEventListener("touchcancel", (e) => {this.touchCancel(e) } );
            element.addEventListener("touchmove", (e) => {this.touchMove(e) } );
        }

        // Config
        this._pinchHysteresis = 10;
        this._rotateMouseButton = 0;
        this._panMouseButton = 1;

        this._moveSpeed = 50; // units per sec
        this._rotateSpeed = 90 * DegToRad; // rad per sec

        this._mouseSpeed = 0.0025;
        this._mouseWheelSpeed = 0.001;

        this._keyUP = " "; // change to objects of attrib: event.key
        this._keyDN = "c"; // ex keyConfig["Down"] = "c"
        this._keyLT = "a";
        this._keyRT = "d"; // or keyConfig[event.key] = "Down"
        this._keyFD = "w"; // to better handle multiple key inputs ?
        this._keyBD = "s";

        this._smooth = 6.0;
        this.panning = false;
        this.rotating = false;

        this.mx=0;this.pinx=0;this.dx=0;this.rx=0;this.sumRX=0;
        this.my=0;this.piny=0;this.dy=0;this.ry=0;this.sumRY=0;
        this.dz=0;this.tadx=0;this.tady=0;this.tadz=0;this.tarx=0;this.tary=0;



    }


    // Keyboard Inputs


    keyDown(event) {
        this.inputTable[event.key] = true;    
        if ((pLockActive) && (event.key == "Escape")) {
            pLockExit();
        }
    }
    
    keyUp(event) {    
        if (this.inputTable[event.key] != undefined) {
            this.inputTable[event.key] = false;
        }    
    }

    processInputs(timer) {
        if (this.inputTable[this._keyUP]) {
            this.dy -= this._moveSpeed * timer.delta;
        }
        if (this.inputTable[this._keyDN]) {
            this.dy += this._moveSpeed * timer.delta;
        }
        if (this.inputTable[this._keyLT]) {
            this.dx -= this._moveSpeed * timer.delta;
        }
        if (this.inputTable[this._keyRT]) {
            this.dx += this._moveSpeed * timer.delta;
        }
        if (this.inputTable[this._keyFD]) {
            this.dz -= this._moveSpeed * timer.delta;
        }
        if (this.inputTable[this._keyBD]) {
            this.dz += this._moveSpeed * timer.delta;
        }    
        
        this.sumRX += this.rx;
        this.sumRY += this.ry;  
        
        // some clamping and warping        
        if (this.sumRY < -PIdiv2) { this.sumRY = -PIdiv2; }
        if (this.sumRY >  PIdiv2) { this.sumRY =  PIdiv2; }
        
        if (this.sumRX < 0) { 
            this.sumRX += PIx2;
            this.tarx += PIx2;
        }
        if (this.sumRX > PIx2) { 
            this.sumRX -= PIx2; 
            this.tarx -= PIx2; 
        }
        
        // smooth controls
        this.tarx = timer.smooth(this.tarx, this.sumRX, this._smooth);
        this.tary = timer.smooth(this.tary, this.sumRY, this._smooth);
        
        this.tadx = timer.smooth(this.tadx, this.dx, this._smooth);
        this.tady = timer.smooth(this.tady, this.dy, this._smooth);
        this.tadz = timer.smooth(this.tadz, this.dz, this._smooth);

            // clean up state changes
            this.dx = 0; this.dy = 0; this.dz = 0;
            this.rx = 0; this.ry = 0;
    }



    // Mouse Inputs


    mouseDown(event) {
        this.pinx = event.pageX; // store relative ref
        this.piny = event.pageY;
    
        if (event.button == this._panMouseButton) {
            this.panning = true;
        }
        if (event.button == this._rotateMouseButton) {
            this.rotating = true;
        }
        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseUp(event) {
        if (event.button == this._panMouseButton) {
            this.panning = false;
        }
        if (event.button == this._rotateMouseButton) {
            this.rotating = false;
        }
    }
    
    mouseLeave(event) {
        this.panning = false;
        this.rotating = false;
    }
    
    mouseMove(event) {
        this.mx = event.pageX;
        this.my = event.pageY;
        
        if (this.panning) {
            this.dx -= (this.mx - this.pinx) * this._mouseSpeed * this._moveSpeed;
            this.dy -= (this.my - this.piny) * this._mouseSpeed * this._moveSpeed;
        }
        
        if (this.rotating) {
            this.rx += (this.mx - this.pinx) * this._mouseSpeed * this._rotateSpeed;
            this.ry += (this.my - this.piny) * this._mouseSpeed * this._rotateSpeed;
        }
        
        this.pinx = this.mx;
        this.piny = this.my;
    }
    
    mouseLockedMove(x, y) {
        // de facto rotating
        if (pLockActive) {
            this.rx += x * this._mouseSpeed * this._rotateSpeed;
            this.ry += y * this._mouseSpeed * this._rotateSpeed;
        }
    }
    
    mouseWheel(event) {
    
        if (event.deltaY != 0) {
            this.dz += event.deltaY * this._mouseWheelSpeed * this._moveSpeed;
        }
    
        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseDblClick(event) {
        if (pLockSupported) {
            pLockRequest(this.element);
        }
        if (event.preventDefault) { event.preventDefault(); };
    }


    // Touch Inputs 


    touchStart(event) {

        event.preventDefault(); // to revise
        var touches = event.changedTouches;

        for (var i = 0; i < touches.length; i++) {

            this.ongoingTouches.push(copyTouch(touches[i]));
        }

        if (this.ongoingTouches.length == 1) {
            //process as mouse down
            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseDown(this.ongoingTouches[0]);

        } else if (this.ongoingTouches.length == 2) {
            //process as mouse up and then wheel / pan

            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseUp(this.ongoingTouches[0]);

            this.ongoingTouches[0].button = this._panMouseButton;

            this.mouseDown( E3D_input.touchToButton( (this.ongoingTouches[0].pageX + this.ongoingTouches[1].pageX) / 2,
                                    (this.ongoingTouches[0].pageY + this.ongoingTouches[1].pageY) / 2,
                                    this._panMouseButton) );

            var tdx = this.ongoingTouches[1].pageX - this.ongoingTouches[0].pageX;
            var tdy = this.ongoingTouches[1].pageY - this.ongoingTouches[0].pageY;

            this.touchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));
        }
    }


    touchEnd(event) {

        event.preventDefault();
        var touches = event.changedTouches;

        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseUp(this.ongoingTouches[0]);
        }

        if (this.ongoingTouches.length == 2) {
            this.ongoingTouches[0].button = this._panMouseButton;
            this.mouseUp(ongoingTouches[0]);
        }

        for (var i = 0; i < touches.length; i++) {
            var idx = this.ongoingTouchIndexById(touches[i].identifier);
            if (idx >= 0) {
                this.ongoingTouches.splice(idx, 1);
            } 
            else console.log("(touchEnd) Touch Id not found");
        }
    }

    touchCancel(event) {

        event.preventDefault();

        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseUp(ongoingTouches[0]);
        }

        if (this.ongoingTouches.length == 2) {
            this.ongoingTouches[0].button = this._panMouseButton;
            this.mouseUp(this.ongoingTouches[0]);
        }

        var touches = event.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var idx = this.ongoingTouchIndexById(touches[i].identifier);
            this.ongoingTouches.splice(idx, 1);
        } 
    }

    touchMove(event) {

        event.preventDefault();
        var touches = event.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var idx = this.ongoingTouchIndexById(touches[i].identifier);
            if (idx >= 0) {
                this.ongoingTouches.splice(idx, 1, this.copyTouch(touches[i]));  // swap in the new touch record
            } else console.log("(touchMove) Touch Id not found");
        }


        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseMove(this.ongoingTouches[0]);

        } else if (this.ongoingTouches.length == 2) {

            var tdx = this.ongoingTouches[1].pageX - this.ongoingTouches[0].pageX;
            var tdy = this.ongoingTouches[1].pageY - this.ongoingTouches[0].pageY;
            var newTouchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));

            // pinch panning
            this.ongoingTouches[0].button = this._panMouseButton;
            this.mouseMove( E3D_input.touchToButton( (this.ongoingTouches[0].pageX + this.ongoingTouches[1].pageX) / 2,
                                        (this.ongoingTouches[0].pageY + this.ongoingTouches[1].pageY) / 2,
                                        this._panMouseButton) );

            if (Math.abs(this.touchDist - newTouchDist) > this._pinchHysteresis) {        
                // mouse wheel zoom
                var delta = (this.touchDist - newTouchDist) / Math.abs(this.touchDist - newTouchDist) * this._pinchHysteresis;
                this.mouseWheel({ deltaY: 5*((this.touchDist - newTouchDist) - delta) });
                this.touchDist = newTouchDist;
            }

        } // 2 touches

    }

    static touchToButton(x, y, btn) {
        return { pageX: x, pageY: y, button: btn } ;
    }

    copyTouch(touch) {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, button: this._rotateMouseButton };
    }

    ongoingTouchIndexById(idToFind) {
        for (var i = 0; i < this.ongoingTouches.length; i++) {
            var id = this.ongoingTouches[i].identifier;

            if (id == idToFind) {
                return i;
            }
        }
        return -1;    // not found
    }


}
