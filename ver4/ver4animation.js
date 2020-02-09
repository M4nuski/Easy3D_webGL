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
    constructor(id, targetEntity, sceneContext, timerclass, animFirstPass, animNPass = null, animLastPass =  null) {
        this.id = id;
        
        this.animFirstPass = animFirstPass; //  calculate ideal next position
        this.animRePass = animNPass; // n+ times, re-calculate after hit was detected
        this.animLastPass = animLastPass; // commit final state after collision detections are completed or prep next pass

        this.target = targetEntity;
        this.scn = sceneContext;
        this.timer = timerclass;

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

    animateFirstPass() {
        if (this.animFirstPass) {
            this.animFirstPass();
        }
    }

    animateRePass() {
        if (this.animRePass) {
            return this.animRePass();
        }
    }

    animateLastPass() {
        if (this.animLastPass) {
            this.animLastPass();
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
