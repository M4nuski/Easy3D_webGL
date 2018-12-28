// Easy3D_WebGL
// STL viewer web app doubling as electron app using version 4
// Emmanuel Charette 2017-2019

"use strict"

document.addEventListener("DOMContentLoaded", function () {

    const can = document.getElementById("GLCanvas");
    const logElement = document.getElementById("logDiv");
    const mainDiv = document.getElementById("mainDiv");
    const statDiv = document.getElementById("statDiv");
   
    var electron = false;
try {
    var userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf(' electron/') > -1) {
        console.log("UA electron");
        electron = true;
    } else {
        console.log("UA not electron");
    }
} catch (ex) { console.log(ex);}

    if (electron) {
        // electron interface with OS calls
        var args = require('electron').remote.process.argv
        var fs = require("fs");
        log("Running in:", false);
        log("NodeJS "  + process.versions.node, false);
        log("Chrome " + process.versions.chrome, false);
        log("Electron " + process.versions.electron, false);

        if (args[1] != "") {
            log("args[1] " + args[1], false);
        } else {
            log("Drag drop file on electron.exe to load stl", false);
        }
    } else {
        log("running in Browser", false);
        log("use thisurl?filepath to load stl", false);
    }

    window.addEventListener("resize", winResize); // To reset camera matrix

    // Engine Config    
    const _fieldOfView = 45 * DegToRad;
    const _zNear = 0.1;
    const _zFar = 2048.0;
    
    // Engine State and stats
    
    var winWidth = 320, winHeight = 200;
    
    // Engine Components
    
    var gl; // webGL canvas rendering context
    var scn;  // E3D_scene
    var timer = new E3D_timing(false, 20, timerTick); // target about 50 fps

    var inputs = new E3D_input(can, true, true, false, false, false, true);

    inputs.onInput = onEngineInput;

    var resMngr = new ressourceManager(onRessource);
    var mdl; // model to show
    var l0v; // pivot point axis origin

    var sc=0;
    var sf=0;
           
    initEngine();
    
    function winResize() {
        gl.canvas.width  = gl.canvas.offsetWidth;
        gl.canvas.height = gl.canvas.offsetHeight;
    
        winWidth = gl.canvas.offsetWidth;
        winHeight = gl.canvas.offsetHeight;
    
        gl.viewport(0, 0, winWidth, winHeight);
    
        log("Resize to " + winWidth + " x " + winHeight, false);

        scn.camera.resize(winWidth, winHeight, _fieldOfView, _zNear, _zFar);
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
            scn = new E3D_scene("mainScene", gl, winWidth, winHeight, vec4.fromValues(0.85, 0.85, 0.85, 1.0), -1);
    
            log("Shader Program Initialization", false);
            scn.program = new E3D_program("mainProgram", gl);
            scn.program.compile(vertShader01, fragShader01);
            scn.program.bindLocations(attribList01, uniformList01);
    
            log("Lighting Initialization", false);
            scn.lights =  new E3D_lighting(vec3.fromValues(0.25, 0.25, 0.25));
            scn.lights.setColor0(vec3.fromValues(1.0, 1.0, 1.0));
            scn.lights.setDirection0(vec3.fromValues(0.0, 0.0, 1.0)); 
            scn.lights.light0_lockToCamera = true;
    
            scn.lights.setColor1(vec3.fromValues(0.9, 0.9, 0.9));
            scn.lights.setDirection1(vec3.fromValues(0.5, 1.0, 0.5));
            scn.lights.light1_lockToCamera = false;

            scn.camera = new E3D_camera_model("model camera", winWidth, winHeight, _fieldOfView, _zNear, _zFar);
    
            log("Camera Initialization", false);
            winResize();
    
            log("Scene Initialization", false);
            scn.initialize();
    
            scn.preRenderFunction = prepRender; // callback to do some custom stuff

            scn.postRenderFunction = postRender;
    
        } catch (e) {
            log(e, false);
    
            return; 
        }

        if (electron) {
            // load from local file
            if (fs.existsSync(args[1])) {
                log("Loading model " + args[1], false);
                var  data = fs.readFileSync(args[1]);    
                if (data) {
                    mdl = E3D_loader.loadModel_STL("toView", args[1], data, 0.0, "source");//][1.0,1.0,1.0]);//"source"]);
                    onRessource("", "ELECTRON_LOAD");
                }
            } else log("File not found", false);
        } else {
            // load from url
            let path = window.location.search.replace("?", "");
            if (path != "") {
                log("Loading model " + path, false);
                resMngr.addRessource(path, "toView", "Model", true);
                resMngr.loadAll("Single obj load useless tag");
            } else log("URL not found", false);
        }



        timer.run();

        scn.state = E3D_ACTIVE;

        // pivot vector
        l0v = new E3D_entity_vector("pivot", false, 0.0, false);
        l0v.scale = vec3.fromValues(3, 3, 3);
        l0v.visible = true;
        l0v.vis_culling = false;    
        scn.addEntity(l0v);

        // origin vector
        let l1v = new E3D_entity_vector("orig", false, 0.0, false);
        l1v.scale = vec3.fromValues(10, 10, 10);
        l1v.visible = true;
        l1v.vis_culling = false;    
        scn.addEntity(l1v);

        let buildbox = new E3D_entity_dynamic("building box");
        buildbox.addWireCube([0,145/2,0], [0,0,0], [240,145,145], [0.75, 0.75, 0.75, 0.5], false, false, false);
        buildbox.visible = true;
        buildbox.vis_culling = false;
        scn.addEntity(buildbox);
   
    }

    function calculate_bounding_box(vertArray) {
        let min_result = [Infinity, Infinity, Infinity];
        let max_result = [-Infinity, -Infinity, -Infinity];

        for (let i = 0; i < vertArray.length; i += 3) {
            max_result[0] = Math.max(max_result[0], vertArray[i]);
            min_result[0] = Math.min(min_result[0], vertArray[i]);

            max_result[1] = Math.max(max_result[1], vertArray[i+1]);
            min_result[1] = Math.min(min_result[1], vertArray[i+1]);

            max_result[2] = Math.max(max_result[2], vertArray[i+2]);
            min_result[2] = Math.min(min_result[2], vertArray[i+2]);
        }
        return { min: min_result, max: max_result };
    }
    
    
    function prepRender() {
        inputs.smoothPosition(6);
        inputs.smoothRotation(6);
        scn.camera.move(-inputs.px_delta, inputs.py_delta, inputs.pz_delta, inputs.rx_smth, inputs.ry_smth, inputs.rz_smth);

        vec3.copy(l0v.position, scn.camera.position);
        l0v.visible = inputs.checkCommand("panPivot", false);
        l0v.resetMatrix();
    }
    
    
    function onEngineInput() {
        // preprocess inputs out of game loop
        if (inputs.checkCommand("toggleFullscreen", true)) {
            fullscreenToggle(mainDiv);
        }
    }
    
    
    function timerTick() {  // Game Loop
  
        inputs.processInputs(timer.delta);
    
      //  if (inputs.checkCommand("action0", true)) {
      //  }

       // if (inputs.checkCommand("action1", true)) {
       // }

        if (scn.state == E3D_ACTIVE) {
            scn.preRender();
            scn.render();
            scn.postRender();
        }   
    
    }

    function p4(t) {
        let s = String(Math.floor(t));
        s = s.padStart(4);
        return s;
    }

    function postRender() {
        let s = "px: " + p4(inputs.px_smth) + " py: " + p4(inputs.py_smth) + " pz: " + p4(inputs.pz_smth) + "<br/>"+
        "rx: " + p4(inputs.rx_smth * RadToDeg) + " ry: " + p4(inputs.ry_smth * RadToDeg) + " rz: " + p4(inputs.rz_smth * RadToDeg)+ "<br/>";

        sc = timer.smooth(sc, timer.usage, 3);
        sf = timer.smooth(sf, 1/timer.delta, 3);


        s += "fr: " + p4(sf) + " cpu:"+ p4(sc) + "% <br/>"; 
        s = s.split(" ").join("&nbsp;");
        statDiv.innerHTML = s;
    }


    function onRessource(name, msg) {
        if (msg == E3D_RES_FAIL) {
            log("Failed to load ressource: " + name, false);        
        }
        if (msg == E3D_RES_ALL) {
            log("All async ressources loaded for tag: " + name, true);       
            resMngr.flushAll();   
        }
    
        if (msg == E3D_RES_LOAD) {
            log("Async ressource loaded: " + name, true);   
            mdl = E3D_loader.loadModel_STL("toView", resMngr.getRessourcePath(name),  resMngr.getData(name), 0.0, "source");//[1.0,1.0,1.0]);//"source"]);
        }



        if ((msg == "ELECTRON_LOAD") || (mdl))
        
         {
            mdl.visible = true;
            mdl.vis_culling = false;

            let bb = calculate_bounding_box(mdl.vertexArray);

            // center object on top of origin
            mdl.position = vec3.fromValues((bb.max[0] + bb.min[0]) / -2 , -bb.min[1], (bb.max[2] + bb.min[2]) / -2);

            scn.addEntity(mdl);

            let biggest = Math.max(bb.max[0] - bb.min[0],  bb.max[1] - bb.min[1] ) / 2;

            let backout = biggest / Math.tan(_fieldOfView/2); 

            scn.camera.move( 0,  (bb.max[1] - bb.min[1]) / 4, backout, 0, 0, 0); //  (bb.max[1] - bb.min[1]) / 2
        }
    }



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