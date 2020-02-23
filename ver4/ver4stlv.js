// Easy3D_WebGL
// STL viewer web app doubling as electron app using version 4
// Emmanuel Charette 2017-2019

"use strict"

document.addEventListener("DOMContentLoaded", function () {

    const can = document.getElementById("GLCanvas");
    const logElement = document.getElementById("logDiv");
    const mainDiv = document.getElementById("mainDiv");
    const statDiv = document.getElementById("statDiv");
    const colSel = document.getElementById("colSel");
    const OverRideColor = document.getElementById("ORcolor");
    colSel.addEventListener("change", changeColor);
    OverRideColor.addEventListener("click", changeColor);

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
    var mdl_colors; // original model colors
    var l0v; // pivot point axis origin

    var sc=0;
    var sf=0;
    var polycount = 0;

    var p_mode= 0;
           
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
            scn.lights =  new E3D_lighting(v3_val_new(0.25, 0.25, 0.25));
            scn.lights.setColor0(v3_val_new(1.0, 1.0, 1.0));
            scn.lights.setDirection0(v3_val_new(0.0, 0.0, 1.0)); 
            scn.lights.light0_lockToCamera = true;
    
            scn.lights.setColor1(v3_val_new(0.9, 0.9, 0.9));
            scn.lights.setDirection1(v3_val_new(0.5, 1.0, 0.5));
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
                    mdl = E3D_loader.loadModel_STL("toView", args[1], data.buffer, 0.0, "source", true);
                    onRessource("", "ELECTRON_LOAD");
                }
            } else log("File not found", false);
        } else {
            // load from url
            let path = window.location.search.replace("?", "");
            if (path != "") {
                log("Loading model " + path, false);
                resMngr.addRessource(path, "toView", "Model", true);
                resMngr.loadAll("Single");
            } else log("URL not found", false);
        }

        timer.run();

        scn.state = E3D_ACTIVE;

        l0v = new E3D_entity_vector("pivot", false, 3.0, false);
        //l0v.scale = v3_val_new(3, 3, 3);
        l0v.visible = true;
        l0v.vis_culling = false;    
        scn.addEntity(l0v);

        let l1v = new E3D_entity_vector("origin", false, 3.0, false);
        //l1v.scale = v3_val_new(10, 10, 10);
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

        scn.camera.moveBy(-inputs.px_delta, inputs.py_delta, inputs.pz_delta, inputs.rx_smth, inputs.ry_smth, inputs.rz_smth);

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
        inputs.smoothPosition(6);
        inputs.smoothRotation(6);
    
        if (inputs.checkCommand("action2", true)) {
            p_mode++;
            let pmt = ["update data on change", "force buffer update", "force buffer reset"];
            if (p_mode > 2) p_mode = 0;
             log("p_mode " + p_mode + " " + pmt[p_mode], false);
        }

        // p_mode == 0, normal mode
        if (p_mode == 1) mdl.dataContentChanged = true;        
        if (p_mode == 2) mdl.dataSizeChanged = true;
       

       // if (inputs.checkCommand("action1", true)) {
       // }

        if (scn.state == E3D_ACTIVE) {
            scn.preRender();
            scn.render();
            scn.postRender();
        }   
    
    }

    function pad(t, n) {
        let s = String(Math.floor(t));
        s = s.padStart(n);
        return s;
    }

    function postRender() {
        let s = "px: " + pad(inputs.px_smth, 4) + " py: " + pad(inputs.py_smth, 4) + " pz: " + pad(inputs.pz_smth, 4) + "<br/>"+
        "rx: " + pad(inputs.rx_smth * RadToDeg, 4) + " ry: " + pad(inputs.ry_smth * RadToDeg, 4) + " rz: " + pad(inputs.rz_smth * RadToDeg ,4)+ "<br/>";

        sc = timer.smooth(sc, timer.usage, 3);
        sf = timer.smooth(sf, 1/timer.delta, 3);


        s += "fps: " + pad(sf, 3) + " gpu:"+ pad(sc, 3) + "% poly: "+ polycount +"<br/>"; 
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
            mdl = E3D_loader.loadModel_STL("toView", resMngr.getRessourcePath(name),  resMngr.getData(name), 0.0, "source", true);
        }

        if ((msg == "ELECTRON_LOAD") || (mdl)) {
            mdl_colors = new Float32Array(mdl.colorArray);
            mdl.visible = true;
            mdl.vis_culling = false;

            polycount = mdl_colors.length / 3;

            let bb = calculate_bounding_box(mdl.vertexArray);

            // center object on top of origin
            mdl.position = v3_val_new((bb.max[0] + bb.min[0]) / -2 , -bb.min[1], (bb.max[2] + bb.min[2]) / -2);
            scn.addEntity(mdl);

            let biggest = Math.max(bb.max[0] - bb.min[0],  bb.max[1] - bb.min[1] ) / 2;
            let backout = biggest / Math.tan(_fieldOfView/2); 
         //   scn.camera.position = vec3_origin;
            scn.camera.moveTo( 0,  (bb.max[1] - bb.min[1]) / 4, backout, 0, 0, 0); //  (bb.max[1] - bb.min[1]) / 2
        }
    }
    

    function changeColor() {
        if (OverRideColor.checked) {
            let cs = colSel.value.replace("#", "");
            let ca = [0 ,0 ,0 ];

            ca[0] = parseInt(cs.substring(0,2), 16) / 255;
            ca[1] = parseInt(cs.substring(2,4), 16) / 255;
            ca[2] = parseInt(cs.substring(4,6), 16) / 255;

            for (var i = 0; i < mdl.colorArray.length; i+=3) {
                mdl.colorArray.set(ca, i);
            }
                
        } else {
            mdl.colorArray.set(mdl_colors, 0); 
        }
        mdl.dataContentChanged = true;
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