"use strict"

document.addEventListener("DOMContentLoaded", function () {

    const can = document.getElementById("GLCanvas");
    const logElement = document.getElementById("logDiv");

    const pLockActive = false; // global override, pointer lock module is not used
    
    // electron interface with OS calls
    var args = require('electron').remote.process.argv
    var fs = require("fs");
    //var arguments = remote.getGlobal('sharedObject').prop1;

   log(args, false);

    window.addEventListener("resize", winResize); // To reset camera matrix

   // todo add electron global var passers


    // Engine Config
    
    const _fieldOfView = 45 * DegToRad;
    const _zNear = 0.1;
    const _zFar = 2048.0;
    
    // Engine State and stats
    
    var winWidth = 10, winHeight = 10;
    
    // Engine Components
    
    var gl; // webGL canvas rendering context
    var scn;  // E3D_scene
    var timer = new E3D_timing(false, 20, timerTick); // target about 50 fps

    // ? load directly ? var resMngr = new ressourceManager(onRessource);
    
    var inputs = new E3D_input(can, true, true, false, false, false, true);
    // (element, supportMouse, supportKeyboard, supportTouch, supportPointerLock, clampPitch= true, allowPan = true) 

    inputs.onInput = onEngineInput;
           
    initEngine();
    
    function winResize() {
        gl.canvas.width  = gl.canvas.offsetWidth;
        gl.canvas.height = gl.canvas.offsetHeight;
    
        winWidth = gl.canvas.offsetWidth;
        winHeight = gl.canvas.offsetHeight;
    
        gl.viewport(0, 0, winWidth, winHeight);
    
        log("Resize to " + winWidth + " x " + winHeight, false);

        scn.camera.resize(winWidth, winHeight, _fieldOfView, _zNear, _zFar);

     //   scn.lights.light0_lockToCamera = true;
       // inputs.clampPitch = true;
       // inputs.allowPan = false;    

     //   scn.camera.move(0,0,100,30,30,30);
    }
    
    function initEngine() {
    
        log("Context Initialization", false);
        gl = can.getContext("webgl");
    
        if (!gl) {
            log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
            return;
        }
    
        log("Scene Creation", false);
        try {
            scn = new E3D_scene("mainScene", gl, winWidth, winHeight, vec4.fromValues(0.0, 0.0, 0.25, 1.0), -1);
    
            log("Shader Program Initialization", false);
            scn.program = new E3D_program("mainProgram", gl);
            scn.program.compile(vertShader01, fragShader01);
            scn.program.bindLocations(attribList01, uniformList01);
    
            log("Lighting Initialization", false);
            scn.lights =  new E3D_lighting(vec3.fromValues(0.0, 0.0, 0.15));
            scn.lights.setColor0(vec3.fromValues(1.0, 1.0, 1.0));
            scn.lights.setDirection0(vec3.fromValues(-0.2, -0.2, -1.0)); 
          //  scn.lights.light0_lockToCamera = true;
    
            scn.lights.setColor1(vec3.fromValues(1.0, 1.0, 0.85));
            scn.lights.setDirection1(vec3.fromValues(1.0, -1.0, 0.8));
            scn.lights.light1_lockToCamera = false;

            scn.camera = new E3D_camera_model("model camera", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    
            log("Camera Initialization", false);
            winResize();
    
            log("Scene Initialization", false);
            scn.initialize();
    
            scn.preRenderFunction = prepRender; // callback to do some custom stuff
    
        } catch (e) {
            log(e, false);
    
            return; 
        }


        if (fs.existsSync(args[1])) {
            log("Loading model " + args[1], false);
            var  data = fs.readFileSync(args[1]);    
            if (data) {
                let mdl = E3D_loader.loadModel_STL("toView", args[1], data, 0.0, "source");
                mdl.visible = true;
                mdl.vis_culling = false;
                mdl.resetMatrix();
                scn.addEntity(mdl);
            }
        }

        log("Model loaded", false);

        timer.run();

        scn.state = E3D_ACTIVE;

        let l0v = new E3D_entity_vector("orig", false, 0.0, false);
      //  l0v.position = vec3.fromValues(, 20, -5);
        l0v.scale = vec3.fromValues(10, 10, 10);
        l0v.visible = true;
        l0v.vis_culling = false;
    
        scn.addEntity(l0v);
   
   
    }
    
    
    function prepRender() {
        // move camera per inputs
        let yf = false ? -1.0 : 1.0; // option ?
        scn.camera.move(inputs.px_smth, -inputs.py_smth, inputs.pz_smth, inputs.ry_smth*yf, inputs.rx_smth, inputs.rz_smth);
    }
    
    
    function onEngineInput() { // preprocess inputs out of game loop
    }
    
    
    function timerTick() {  // Game Loop
  
        inputs.processInputs(timer.delta);

    
        if (inputs.checkCommand("action0", true)) {
        }

        if (inputs.checkCommand("action1", true)) {
        }

        if (scn.state == E3D_ACTIVE) {
            scn.preRender();
            scn.render();
            scn.postRender();
        }   
    
    }

                //    let nm = E3D_loader.loadModel_RAW(name, resMngr.getRessourcePath(name), resMngr.getData(name), 2, vec3.fromValues(1,1,1));
                 //   nm.position[2] = -120;
                  //  nm.visible = true;
    
                   // animations.push(new E3D_animation("ST rotate", rot0, nm, scn, timer));
                   // animations[animations.length-1].play();
                   // scn.addEntity(nm);  

    // Logging and status information    
    function log(text, silent = true) {
        let ts = 0;
        try {
            ts = Date.now() - timer.start;
        } catch (e) {
            // timer was not yet defined
        } 
    
        console.log("E3D[" + ts + "] " + text);
        if (!silent) {
            logElement.innerHTML += "[" + ts + "] " + text + "<br />";
            logElement.scrollTop = logElement.scrollHeight - logElement.offsetHeight;
        }
    
    }
    

    
});