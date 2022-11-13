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
var ENTITIES = []; // E3D_entity, mesh content and information, spatial data, state
var ANIMATIONS = []; // E3D_animation that transforms an entity's position and rotation, or any other properties
var BODIES = []; // E3D_body to interract with other entity's body

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
    CONTEXT.getExtension("OES_element_index_uint");

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
    INPUTS.smoothRotation(0.8);
    INPUTS.smoothPosition(0.8);

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


function E3D_getEntityIndexById(id) {
    for (let i = 0; i < ENTITIES.length; ++i) if (ENTITIES[i].id == id) return i;
    return -1;
}


// Add a new entity to the current scene and setup the GPU buffers
function E3D_addEntity(entityObj, addAnimation = false, addBody = false) {
    if (E3D_getEntityIndexById(entityObj.id) != -1) { 
        log("Duplicate entity ID: " + entityObj.id);
        return -1;
    }
    // Initialize context data buffers
    entityObj.vertexBuffer = CONTEXT.createBuffer();
    entityObj.colorBuffer = CONTEXT.createBuffer();
    entityObj.normalBuffer = CONTEXT.createBuffer();
    entityObj.strokeIndexBuffer = CONTEXT.createBuffer();

    var usage = (entityObj.isDynamic) ? CONTEXT.DYNAMIC_DRAW : CONTEXT.STATIC_DRAW;

    CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, entityObj.vertexBuffer);
    CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, entityObj.vertexArray, usage);        

    CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, entityObj.colorBuffer);
    CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, entityObj.colorArray, usage);            

    CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, entityObj.normalBuffer);
    CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, entityObj.normalArray, usage);
    if (entityObj.strokeIndexArray) {
        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, entityObj.strokeIndexBuffer);
        CONTEXT.bufferData(CONTEXT.ELEMENT_ARRAY_BUFFER, entityObj.strokeIndexArray, usage);
    }
    
    entityObj.visibilityDistance = v3_length(E3D_calculate_max_pos(entityObj.vertexArray));

    // update lists
    ENTITIES.push(entityObj);
    ANIMATIONS.push(addAnimation ? new E3D_animation() : null);
    BODIES.push(addBody ? new E3D_body() : null);
    // backreferences
    entityObj.index = ENTITIES.length - 1;
    if (addAnimation) {
        ANIMATIONS[entityObj.index].index = entityObj.index;
        entityObj.hasAnimation = true;
    }
    if (addBody) {
        BODIES[entityObj.index].index = entityObj.index;
        entityObj.hasBody = true;
    }
    entityObj.updateMatrix();

    return entityObj.index; 
}


function E3D_updateEntityData(entityObj) {
    entityObj.dataContentChanged = true;
    entityObj.dataSizeChanged = true;        
    entityObj.visibilityDistance = v3_length(E3D_calculate_max_pos(entityObj.vertexArray));
    entityObj.updateMatrix();
}
function E3D_updateEntityDataById(id) {
    let index = E3D_getEntityIndexById(id);
    if (index == -1) return;
    E3D_updateEntityData(ENTITIES[index]);
}
function E3D_updateEntityDataByIndex(index) {
    if (index == -1) return;
    if (index > ENTITIES.length - 1) return;
    E3D_updateEntityData(ENTITIES[index]);
}

function E3D_removeEntity(entityObj, deleteBuffers = true) {
    E3D_removeEntityByIndex(entityObj.index, deleteBuffers);
}
function E3D_removeEntityById(id, deleteBuffers = true) {
    E3D_removeEntityByIndex(E3D_getEntityIndexById(id), deleteBuffers);
}
function E3D_removeEntityByIndex(index, deleteBuffers = true) {
    if (index == -1) return;
    if (index > ENTITIES.length - 1) return;

    if (deleteBuffers) {
        CONTEXT.deleteBuffer(ENTITIES[index].vertexBuffer);
        CONTEXT.deleteBuffer(ENTITIES[index].colorBuffer);
        CONTEXT.deleteBuffer(ENTITIES[index].normalBuffer);
        CONTEXT.deleteBuffer(ENTITIES[index].strokeIndexBuffer);
    }
    ENTITIES.splice(index, 1);
    ANIMATIONS.splice(index, 1);
    BODIES.splice(index, 1);        
    for (var i = index; i < ENTITIES.length; ++i) {
        ENTITIES[i].index = i;
        if (ANIMATIONS[i]) ANIMATIONS[i].index = i;
        if (BODIES[i]) BODIES[i].index = i;
    }
}

function E3D_clearEntity(entityObj, mesh = true, animation = true, body = true) {
    E3D_clearEntityByIndex(entityObj.index, mesh, animation, body);
}
function E3D_clearEntityById(id, mesh = true, animation = true, body = true) {
    E3D_clearEntityByIndex(E3D_getEntityIndexById(id), mesh, animation, body);
}
function E3D_clearEntityByIndex(index, mesh = true, animation = true, body = true) {
    if (index == -1) return;
    if (index > ENTITIES.length - 1) return;

    if (mesh) ENTITIES[index].clear();
    if (animation && (ANIMATIONS[index] != null)) ANIMATIONS[index] = null; // TODO ??
    if (body && (BODIES[index] != null)) BODIES[index].clear();
}


function E3D_cloneEntity(entityObj, newId) {
    if (entityObj.index == -1) {
        log("E3D_cloneEntity: source entity not assigned");
        return -1;
    }
    if (E3D_getEntityIndexById(newId) != -1) {
        log("E3D_cloneEntity: newId already in use");
        return -1;
    }

    let newEntity = new E3D_entity(newId, entityObj.isDynamic);

    newEntity.cloneData(entityObj);   

    if (newEntity.isDynamic) {
        newEntity.vertexBuffer = CONTEXT.createBuffer();
        newEntity.colorBuffer = CONTEXT.createBuffer();
        newEntity.normalBuffer = CONTEXT.createBuffer();
        newEntity.strokeIndexBuffer = CONTEXT.createBuffer();
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, newEntity.vertexBuffer);
        CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, newEntity.vertexArray, CONTEXT.DYNAMIC_DRAW);
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, newEntity.colorBuffer);
        CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, newEntity.colorArray, CONTEXT.DYNAMIC_DRAW);
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, newEntity.normalBuffer);
        CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, newEntity.normalArray, CONTEXT.DYNAMIC_DRAW);
        if (newEntity.strokeIndexArray) {
            CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, newEntity.strokeIndexBuffer);
            CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, newEntity.strokeIndexArray, CONTEXT.DYNAMIC_DRAW);
        }
        newEntity.dataSizeChanged = true;
    }

    // update lists
    ENTITIES.push(newEntity);
    newEntity.index = ENTITIES.length - 1;

    var anim = null;
    if (ANIMATIONS[entityObj.index] != null) {
        anim = new E3D_animation();
        anim.cloneData(ANIMATIONS[entityObj.index]);
        newEntity.hasAnimation = true;
    }
    ANIMATIONS.push(anim);

    var body = null;
    if (BODIES[entityObj.index] != null) {
        body = new E3D_body();
        body.cloneData(BODIES[entityObj.index]);
        newEntity.hasBody = true;
    } 
    BODIES.push(body);

    newEntity.updateMatrix();

    return newEntity.index;
}
function E3D_cloneEntityByIndex(index, newId) {
    if (index == -1) return -1;
    if (index > ENTITIES.length - 1) return -1;
    return E3D_cloneEntity(ENTITIES[index], newId);
}
function E3D_cloneEntityById(id, newId) {
    let index = E3D_getEntityIndexById(id);
    if (index == -1) return -1;
    if (index > ENTITIES.length - 1) return -1;
    return E3D_cloneEntity(ENTITIES[index], newId);
}


// Animations
// Add
function E3D_addEntityAnimation(entityObj, animationObj) {
    E3D_addEntityAnimationByIndex(entityObj.index, animationObj);
}
function E3D_addEntityAnimationById(id, animationObj) {
    E3D_addEntityAnimationByIndex(E3D_getEntityIndexById(id), animationObj);
}
function E3D_addEntityAnimationByIndex(index, animationObj) {
    if (index == -1) return;
    if (index > ENTITIES.length - 1) return;
    ANIMATIONS[index] = animationObj;
    ENTITIES[index].hasAnimation = true;
}

// Remove
function E3D_removeEntityAnimation(entityObj) {
    E3D_removeEntityAnimationByIndex(entityObj.index);
}
function E3D_removeEntityAnimationById(id) {
    E3D_removeEntityAnimationByIndex(E3D_getEntityIndexById(id));
}
function E3D_removeEntityAnimationByIndex(index) {
    if (index == -1) return;
    if (index > ENTITIES.length - 1) return;
    ANIMATIONS[index] = null;
    ENTITIES[index].hasAnimation = false;
}

// Bodies
// Add
function E3D_addEntityBody(entityObj, bodyObj) {
    E3D_addEntityBodyByIndex(entityObj.index, bodyObj);
}
function E3D_addEntityBodyById(id, bodyObj) {
    E3D_addEntityBodyByIndex(E3D_getEntityIndexById(id), bodyObj);
}
function E3D_addEntityBodyByIndex(index, bodyObj) {
    if (index == -1) return;
    if (index > ENTITIES.length - 1) return;
    BODIES[index] = bodyObj;
    ENTITIES[index].hasBody = true;
}

// Remove
function E3D_removeEntityBody(entityObj) {
    E3D_removeEntityBodyByIndex(entityObj.index);
}
function E3D_removeEntityBodyById(id) {
    E3D_removeEntityBodyByIndex(E3D_getEntityIndexById(id));
}
function E3D_removeEntityBodyByIndex(index) {
    if (index == -1) return;
    if (index > ENTITIES.length - 1) return;
    BODIES[index] = null;
    ENTITIES[index].hasBody = false;
}


// Basic culling, only if in front of camera plane

function E3D_checkEntityVisible(entityObj) {
    return E3D_checkEntityVisibleByIndex(entityObj.index);
} 
function E3D_checkEntityVisibleBiId(id) {
    let index = E3D_getEntityIndexById(id);
    if (index == -1) return;
    return E3D_checkEntityVisibleByIndex(index);
} 
var __E3D_checkEntityVisibleByIndex_pos = v3_new();
function E3D_checkEntityVisibleByIndex(index) {
    if (ENTITIES[index].isVisibiltyCullable) {
        v3_sub_res(__E3D_checkEntityVisibleByIndex_pos, ENTITIES[index].position, CAMERA.position);
        CAMERA.negateCamera_mod(__E3D_checkEntityVisibleByIndex_pos);
        var dist = -__E3D_checkEntityVisibleByIndex_pos[2]; // only check for Z
        return ( ((dist - ENTITIES[index].visibilityDistance) < E3D_FAR) && 
        ((dist + ENTITIES[index].visibilityDistance) > E3D_NEAR) );
    }
    return true;
}


// utilities


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
