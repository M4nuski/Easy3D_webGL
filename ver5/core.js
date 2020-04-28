// Easy3D_WebGL
// Core container for state and engine
// Emmanuel Charette 2017-2020

"use strict"


// Config
//  Camera settings
var E3D_FOV = 45 * DegToRad;
var E3D_NEAR = 0.1;
var E3D_FAR = 500.0;
//  Default viewport size
var E3D_WIDTH = 640;
var E3D_HEIGHT = 480;
 //  Gravitational constant
var E3D_G = 386.22;

// Global members 
var TIMER = new E3D_timing(E3D_onTick_callback); 
var CANVAS = null;
var CONTEXT = null;
var SCENE = new E3D_scene_default("scene0");
var CAMERA = new E3D_camera("camera0");
var INPUTS = new E3D_input();

// Content containers
// Those 3 arrays are linked: the animation and body class at a same given index is used to compute the state of this index's entity.
var ENTITIES = []; // E3D_entity, mesh content and information, transform data, state
var ANIMATIONS = []; // E3D_animation that transforms an entity's position and rotation, or any other properties
var BODIES = []; // E3D_body that transforms an entity's state and it's animation when it reacts with other bodies

// Callbacks
// base events
var CB_input;
var CB_pointerlockMove; 
var CB_pointerlockEvent;
var CB_resize;
var CB_tick;
// engine loop
var CB_processInputs;
var CB_processCamera;
var CB_processAnimations;
var CB_processPreRender;
var CB_processRender;
var CB_processPostRender;



// Engine initialization functions



// Context, timer, perspective camera, all input types, default scene and shaders, lights 
function E3D_InitAll(element) {
    E3D_InitScene(element);
    if (SCENE) {

        log("Camera", false);
        CAMERA = new E3D_camera_persp("camera0p");
        E3D_onResize();

        log("Inputs", false);
        INPUTS.supportKeyboard();
        INPUTS.supportMouse();
        INPUTS.supportTouch();
        INPUTS.supportPointerLock();
         
        log("Timer", false);
        TIMER.onTick = E3D_onTick_default;
        TIMER.run();
    }    
}

// Context, scene, lights
function E3D_InitScene(element) {
    E3D_InitContext(element);
    if (CONTEXT) {
        log("Scene Initialization", false);
        try {

            log("Shader Program", false);
            SCENE.program = new E3D_program("program_default_lights", programData_default);

            SCENE.initialize();
            SCENE.state = E3D_ACTIVE;
        } catch (e) {
            log(e, false);
            return; 
        }
    }
}


// Context only
function E3D_InitContext(element) {
    if (element == undefined) {
        log("No target element provided", false);

        element = document.getElementById("E3D_mainDiv");
        if (element == undefined) {
            log("No target element found", false);
            element = document.createElement("div");
            element.id = "E3D_mainDiv";
            element.style.position = "absolute";
            element.style.width = "100%";
            element.style.height = "100%";
            element.style.left = "0px";
            element.style.top = "0px";
            document.body.appendChild(element);
        }
    }

    if (element.tagName == "CANVAS") {
        CANVAS = element;
    } else {
        CANVAS = document.createElement("canvas");
        CANVAS.id = "E3D_canvas";
        element.appendChild(CANVAS);
        CANVAS.style.width = "100%";
        CANVAS.style.height = "100%";
    }

    CANVAS.width = CANVAS.offsetWidth;
    CANVAS.height = CANVAS.offsetHeight;

    window.addEventListener("resize", E3D_onResize);

    log("Context Initialization", false);
    CONTEXT = CANVAS.getContext("webgl");

    if (!CONTEXT) {
        log("Unable to initialize WebGL. Your browser or machine may not support it.", false);
        TIMER.pause();
        return;
    }
}




// on resize handlers



// Default resize function
function E3D_onResize() {
    // get new size
    E3D_WIDTH = CANVAS.offsetWidth; 
    E3D_HEIGHT = CANVAS.offsetHeight;
    // adjust canvas resolution to fit new size, remove or override to lower the render viewport resolution
    CANVAS.width = E3D_WIDTH;
    CANVAS.height = E3D_HEIGHT;
    // reset viewport and camera
    CONTEXT.viewport(0, 0, E3D_WIDTH, E3D_HEIGHT);
    CAMERA.resize();
    INPUTS.resize(); 
    if (E3D_DEBUG_VERBOSE) log("Resized to " + E3D_WIDTH + "x" + E3D_HEIGHT);
    if (CB_resize) CB_resize();
}



// on tick handlers



// Default timer tick event handler
function E3D_onTick_default() {
    if (CB_tick) CB_tick();
    // Inputs
    INPUTS.processInputs();
    INPUTS.smoothRotation(6);
    INPUTS.smoothPosition(6);

    // Camera
    CAMERA.moveBy(-INPUTS.px_delta_smth, INPUTS.py_delta_smth, INPUTS.pz_delta_smth, 
                   INPUTS.rx_delta_smth, INPUTS.ry_delta_smth, INPUTS.rz_delta_smth);
    CAMERA.updateMatrix();

    // Animations 
    singlePassAnimator();

    // Render
    if (SCENE.state == E3D_ACTIVE) {
        SCENE.preRender();
        SCENE.render();
        SCENE.postRender();
    }   
}

// timer tick handler for scene only, callbacks for the rest
function E3D_onTick_scene() {
    if (CB_processInputs) CB_processInputs();
    if (CB_processCamera) CB_processCamera();
    if (CB_processAnimations) CB_processAnimations();
    // Render
    if (SCENE.state == E3D_ACTIVE) {
        SCENE.preRender();
        if (CB_processPreRender) CB_processPreRender();
        SCENE.render();
        if (CB_processRender) CB_processRender();
        SCENE.postRender();
        if (CB_processPostRender) CB_processPostRender();  
    }   
}

// timer tick handler for callbacks only
function E3D_onTick_callback() {
    if (CB_processInputs) CB_processInputs();
    if (CB_processCamera) CB_processCamera();
    if (CB_processAnimations) CB_processAnimations();
    if (CB_processPreRender) CB_processPreRender();
    if (CB_processRender) CB_processRender();
    if (CB_processPostRender) CB_processPostRender();  
}



// Default Logger



var E3D_logElement = null;
var E3D_logStart = Date.now();
function log(text, silent = true) {
    let ts = Date.now() - E3D_logStart;
    if (!silent) {
        if (E3D_logElement == null) E3D_logElement = document.getElementById("E3D_logDiv");        
        if (E3D_logElement != null) {
            E3D_logElement.innerHTML += "[" + ts + "] " + text + "<br />";
            E3D_logElement.scrollTop = E3D_logElement.scrollHeight - E3D_logElement.offsetHeight;
        } 
    }
    console.log("[" + ts + "] " + text);
}



// Entities management



function E3D_addEntity(ent) {
    if (E3D_getEntityIndexFromId(ent.id) != -1) { 
        log("Duplicate entity ID: " + ent.id);
        return -1;
    }
    // Initialize context data buffers        
    ent.vertexBuffer = CONTEXT.createBuffer();
    ent.colorBuffer = CONTEXT.createBuffer();
    ent.normalBuffer = CONTEXT.createBuffer();
    ent.strokeIndexBuffer = CONTEXT.createBuffer();

    var usage = (ent.isDynamic) ? CONTEXT.DYNAMIC_DRAW : CONTEXT.STATIC_DRAW;

    CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.vertexBuffer);
    CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.vertexArray, usage);        

    CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.colorBuffer);
    CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.colorArray, usage);            

    CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.normalBuffer);
    CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.normalArray, usage);
    if (ent.strokeIndexArray) {
        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, ent.strokeIndexBuffer);
        CONTEXT.bufferData(CONTEXT.ELEMENT_ARRAY_BUFFER, ent.strokeIndexArray, usage);
    }
    
    ent.visibilityDistance = v3_length(E3D_calculate_max_pos(ent.vertexArray));

    ent.updateMatrix();

    ENTITIES.push(ent);
    ANIMATIONS.push(null);
    BODIES.push(null);

    return ENTITIES.length - 1; // return new entity's index in the list
}

function E3D_getEntityIndexFromId(id) {
    for (let i = 0; i < ENTITIES.length; ++i) {
        if (ENTITIES[i].id == id) return i;
    }
    return -1;
}

function E3D_updateEntityData(ent) {
    let idx = E3D_getEntityIndexFromId(ent.id);
    if (idx > -1) {
        ent.dataContentChanged = true;
        ent.dataSizeChanged = true;        
        ent.visibilityDistance = v3_length(E3D_calculate_max_pos(ent.vertexArray));
        ent.updateMatrix();
    } else {
        return E3D_addEntity(ent);
    }
}

function E3D_removeEntity(id, deleteBuffers = true) {
    let idx = this.E3D_getEntityIndexFromId(id);
    if (idx > -1) {
        if (deleteBuffers) {
            CONTEXT.deleteBuffer(ENTITIES[idx].vertexBuffer);
            CONTEXT.deleteBuffer(ENTITIES[idx].colorBuffer);
            CONTEXT.deleteBuffer(ENTITIES[idx].normalBuffer);
            CONTEXT.deleteBuffer(ENTITIES[idx].strokeIndexBuffer);
        }
        ENTITIES.splice(idx, 1);     
        ANIMATIONS.splice(idx, 1);   
        BODIES.splice(idx, 1);      
    }
}

function E3D_clearEntity(id, mesh = true, animation = true, body = true) {
    let idx = this.E3D_getEntityIndexFromId(id);
    if (idx > -1) {
        if (mesh) ENTITIES[idx].clear();
        if (animation && (ANIMATIONS[idx] != null)) ANIMATIONS[idx] = null;
        if (body && (BODIES[idx] != null)) BODIES[idx].clear();
    }
}


function E3D_cloneEntity(id, newId) {
    let idx = E3D_getEntityIndexFromId(id);
    if ((idx > -1) && (id != newId)) {

        var ent = new E3D_entity(newId, ENTITIES[idx].isDynamic);

        ent.cloneData(ENTITIES[idx]);   

        if (ent.isDynamic) {
            ent.vertexBuffer = CONTEXT.createBuffer();
            ent.colorBuffer = CONTEXT.createBuffer();
            ent.normalBuffer = CONTEXT.createBuffer();
            ent.strokeIndexBuffer = CONTEXT.createBuffer();
            CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.vertexBuffer);
            CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.vertexArray, CONTEXT.DYNAMIC_DRAW);
            CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.colorBuffer);
            CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.colorArray, CONTEXT.DYNAMIC_DRAW);
            CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.normalBuffer);
            CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.normalArray, CONTEXT.DYNAMIC_DRAW);
            if (ent.strokeIndexArray) {
                CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.strokeIndexBuffer);
                CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.strokeIndexArray, CONTEXT.DYNAMIC_DRAW);
            }
            ent.dataSizeChanged = true;
        }

        ENTITIES.push(ent);

        var anim = null;
        if (ANIMATIONS[idx] != null) {
            anim = new E3D_animation();
            anim.cloneData(ANIMATIONS[idx]);
        }
        ANIMATIONS.push(anim);

        var body = null;
        if (BODIES[idx] != null) {
            body = new E3D_body();
            body.cloneData(BODIES[idx]);
        } 
        BODIES.push(body);
        return ent; // return reference to new entity
    } else {
        log("Invalid entity ID (not found or duplicate): " + id);
    }
}

function E3D_calculate_max_pos(vertArray) {
    let result = v3_new();
    let pos = v3_new();
    let r_dist2 = 0;
    for (let i = 0; i < vertArray.length; i += 3) {
        v3_val_res(pos, vertArray[i], vertArray[i+1], vertArray[i+2]);
        var currentDist = v3_lengthsquared(pos);
        if (currentDist > r_dist2) {
            v3_copy(result, pos);
            r_dist2 = currentDist;
        }
    }
    return result;
}

var _E3D_check_entity_visible_pos = v3_new();
// Basic culling, only if in front of camera plane
function E3D_check_entity_visible(idx) {
    if (ENTITIES[idx].isVisibiltyCullable) {
        v3_sub_res(_E3D_check_entity_visible_pos, ENTITIES[idx].position, CAMERA.position);
        CAMERA.negateCamera_mod(_E3D_check_entity_visible_pos);
        var dist = -_E3D_check_entity_visible_pos[2]; // only check for Z
        return ( ((dist - ENTITIES[idx].visibilityDistance) < E3D_FAR) && 
        ((dist + ENTITIES[idx].visibilityDistance) > E3D_NEAR) );
    }
    return true;
}
