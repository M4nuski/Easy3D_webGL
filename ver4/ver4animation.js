// Easy3D_WebGL
// State container for animations
// Emmanuel Charette 2017-2019

"use strict"


// TODO merge with entity
/**
 * Animation class
 * 
 * @param {String} id Animation identifier
 * @param {E3D_scene} sceneContext Rendering Scene
 * @param {E3D_timer} timerclass Timer object
 * @param {function} animFirstPass Delegate function for calculating single or ideal animation results
 * @param {function} animNPass Delegate function to recalculate animation result based on collision detections
 * @param {function} animLastPass Delegate function to commit animation results or to post-process
 */
class E3D_animation { 
    constructor(id, targetEntity, sceneContext, timerclass, animFirstPass, animNPass = null, animLastPass =  null, group = "") {
        this.id = id;
        
        this.animFirstPass = animFirstPass; //  calculate ideal next position
        this.animRePass = animNPass; // n+ times, re-calculate after hit was detected
        this.animLastPass = animLastPass; // commit final state after collision detections are completed or prep next pass

        this.target = targetEntity;
        this.scn = sceneContext;
        this.timer = timerclass;

        this.group = group;
        this.state = E3D_RESET;

        this.ttl = 0;

        // Custom data
        this.last_position = v3_new();
        this.delta_position = v3_new();
        this.mainVector = v3_new();
        this.spd = v3_new();
        this.vertOffset = v3_new();
        this.vect = v3_new();
        this.org = v3_new();
        this.vectNorm = v3_new();
        this.act = [];
        this.numPellets = 10;
        this.startObject = null;
        this.startedYDelta = 0;

        this.collidingNormal = v3_new();

        // For CD
        this.delta = [0, 0, 0]; // Position delta
        this.deltaLength = -1; // length of this.delta during animation step for culling, -1 anim target is not a source

        this.collisionDetected = false;
        this.closestCollision = []; // targetIndex, t0, n, hitPos, hitDescriptionText when this is the source

        this.collisionFromOther = false;
        this.otherCollision = []; // sourceIndex, t0, -n, hitPos, hitDescriptionText when this was the target

        this.candidates = []; // for all other entities, bool to test for CD after culling pass
        this.lastHitMarker = ""; // marker of last hit target
    }

    animateFirstPass(x) {
        if (this.animFirstPass) {
            this.animFirstPass(x);
        }
    }

    animateRePass(x) {
        if (this.animRePass) {
            return this.animRePass(x);
        }
    }

    animateLastPass(x) {
        if (this.animLastPass) {
            this.animLastPass(x);
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
    restart(x) {
        this.startObject = x;
        this.state = E3D_RESTART;  
    }
    done() {
        this.state = E3D_DONE;  
    }
}


function singlePassAnimator(animList /*, animGroup*/) {
    for (let i = 0; i < animList.length; ++i) animList[i].animateFirstPass();
}

function multiPassAnimator(animList /*, animGroup*/) {
    for (let i = 0; i < animList.length; ++i) animList[i].animateFirstPass();
    for (let i = 0; i < animList.length; ++i) animList[i].animateRePass();
    for (let i = 0; i < animList.length; ++i) animList[i].animateLastPass();
}

function collisionDetectionAnimator(animList, scn, /*animGroup, */ maxCDIterations = 10) {
    // Animate / Calculate Expected target position and state

    // First pass, calculate expected next position
    for (let i = 0; i < animList.length; ++i) {
        animList[i].animateFirstPass();
        animList[i].collisionDetected = false;
        animList[i].collisionFromOther = false;
    } 

    // calc distance every time top 100% of 0.050s at 800 entities 
    // map with distance and hash of ID 100 at 200 entities
    // list in animation target entity at 700
    //  list in both and map to lookup at 600
    //  multi pass, only add if closest max at 600

    // Cull Collission Detection
    for (let i = 0; i < animList.length; ++i) { // CD culling
        if (animList[i].deltaLength > -1) {
            animList[i].candidates = [];
            for (let j = 0; j < scn.entities.length; ++j) {// all entities are targets
                animList[i].candidates[j] = false;
                if ((scn.entities[j].collisionDetection) && (animList[i].target.id != scn.entities[j].id) ) { 
                    var deltaP = v3_distance( animList[i].target.position, scn.entities[j].position);
                    var deltaD = animList[i].deltaLength + animList[i].target.cull_dist + scn.entities[j].cull_dist; 
                    animList[i].candidates[j] = deltaP <= deltaD;  
                }
            }
        }
    }

    var numIter = maxCDIterations;
    var hitDetected = true;

    while ((numIter > 0) && (hitDetected)){

        // Collision Detection
        hitDetected = false;
        for (let i = 0; i < animList.length; ++i) if (animList[i].deltaLength > 0.0) CheckForAnimationCollisions(animList[i], scn, animList);
        
        // Collision Response
        for (let i = 0; i < animList.length; ++i) if ((animList[i].collisionDetected) || (animList[i].collisionFromOther)) {
            animList[i].animateRePass(maxCDIterations - numIter); 
            hitDetected = true;
        }
        numIter--;
    }

    // Last pass, post-process animation state after collisions are resolved
    for (let i = 0; i < animList.length; ++i) animList[i].animateLastPass();
    
    return maxCDIterations - numIter;
}

