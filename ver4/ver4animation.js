// Easy3D_WebGL
// State container for animations
// Emmanuel Charette 2017-2019

"use strict"





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
class E3D_animation {  // TODO merge with entity
    constructor(id, targetEntity, sceneContext, timerclass, animFirstPass, animNPass = null, animLastPass =  null, group = "") {
        this.id = id;
        
        this.animFirstPass = animFirstPass; //  calculate ideal next position
        this.animRePass = animNPass; // n+ times, re-calculate after hit was detected
        this.animLastPass = animLastPass; // commit final state after collision detections are completed or prep next pass

        this.target = targetEntity;
        //this.scn = sceneContext;
        this.timer = timerclass;

        this.group = group;
        this.state = E3D_RESET;

        this.ttl = 0;

        // Custom data
        this.last_position = v3_new();
        this.delta_position = v3_new();
        this.mainVector = v3_new();
        this.spd = v3_new();
        this.rspd = v3_new();
        this.endState = E3D_DONE;
        this.vertOffset = v3_new();
        this.vect = v3_new();
        this.org = v3_new();
        this.vectNorm = v3_new();
        this.act = [];
        this.nbPart = 10;
        this.startObject = null;
        this.startedYDelta = 0;
        this.gravity = 0.0;

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
    for (let i = 0; i < animList.length; ++i) // CD culling
    if ((animList[i].target.collisionDetection) && (animList[i].deltaLength > -1)) { 

        animList[i].candidates = [];
        for (let j = 0; j < scn.entities.length; ++j) {// all entities are targets
            animList[i].candidates[j] = false;
            if ((scn.entities[j].collisionDetection == true) && (animList[i].target.id != scn.entities[j].id) ) { 
                var deltaP = v3_distance( animList[i].target.position, scn.entities[j].position);
                var deltaD = animList[i].deltaLength + animList[i].target.cull_dist + scn.entities[j].cull_dist; 
                animList[i].candidates[j] = deltaP <= deltaD;  
            }
        }

    }

    var numIter = maxCDIterations;
    var hitDetected = true;

    while ((numIter > 0) && (hitDetected)){

        // Collision Detection
        hitDetected = false;
        for (let i = 0; i < animList.length; ++i) if ((animList[i].target.collisionDetection) && (animList[i].deltaLength > 0)) {
            if (animList[i].target.CD_sph > 0) CheckForAnimationCollisions_SphSource(animList[i], scn, animList);
            if (animList[i].target.CD_point > 0) CheckForAnimationCollisions_PointSource(animList[i], scn, animList);
        }
        
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


function newTransformAnim(entity, pos_speed, rot_speed, ttl = -1, CD = false, endState = E3D_DONE) {
    var repassFunct = (CD) ? anim_Base_rePass : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;

    var anim = new E3D_animation("", entity, null, timer, anim_Transform_firstPass, repassFunct, endFunct, "");

    v3_copy(anim.spd, pos_speed);
    v3_copy(anim.rspd, rot_speed);

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = false;
    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.resetMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}

function newBaseAnim(entity, pos_speed, rot_speed, gravity = false, ttl = -1, CD = false, endState = E3D_DONE) {

    var repassFunct = (CD) ? anim_Base_rePass : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;

    var anim = new E3D_animation("", entity, null, timer, anim_Base_firstPass, repassFunct, endFunct, "");

    v3_copy(anim.spd, pos_speed);

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = gravity;
    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.resetMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    

function addNoise(v3val, v3range) {
    v3val[0] += rndPM(v3range[0]);
    v3val[1] += rndPM(v3range[1]);
    v3val[2] += rndPM(v3range[2]);
    return v3val;
}

function newBaseAnim_RelativeToCamera(entity, camera, pos_speed, rot_speed, gravity = false, ttl = -1, CD = false, endState = E3D_DONE) {
    var repassFunct = (CD) ? anim_Base_rePass : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;

    var anim = new E3D_animation("", entity, null, timer, anim_Base_firstPass, repassFunct, endFunct, "");

    var offset = camera.adjustToCamera(anim.target.position);
    v3_copy(anim.target.position, camera.position);
    v3_add_mod(anim.target.position, offset);

    anim.spd = camera.adjustToCamera(pos_speed);

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = gravity;
    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.resetMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    


function newParticuleAnim(entity, pos_speed, rot_speed, nbPart, partPosFunc, partDirFunc, gravity = false, ttl = -1, CD = false, endState = E3D_DONE) {

}    


function newParticuleAnim_RelativeToCamera(entity, camera, pos_speed, rot_speed, nbPart, partPosFunc, partDirFunc, gravity = false, ttl = -1, CD = false, endState = E3D_DONE) {
    var repassFunct = (CD) ? anim_Base_rePass : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;

    var anim = new E3D_animation("", entity, null, timer, anim_Part_firstPass, repassFunct, endFunct, "");

    var offset = camera.adjustToCamera(anim.target.position);
    v3_copy(anim.target.position, camera.position);
    v3_add_mod(anim.target.position, offset);

    anim.spd = camera.adjustToCamera(pos_speed); // also now this.mainVector

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = gravity;


    anim.nbPart = nbPart;

    anim.vertOffset = Array(nbPart); // vect noise for vertex
    anim.vect = Array(nbPart); // mainVect + vect noise
    anim.vectNorm = Array(nbPart); //opt normalized vect for CD
    anim.org = Array(nbPart); // each pass org = org + vect, world coordinates
    anim.act = Array(nbPart); // active

    anim.target.setSize(anim.target.srcNumElements * anim.nbPart);


    // gen starting positions
    for (let i = 0; i < anim.nbPart; ++i) {
        //new pellet
        anim.target.copySource(anim.target.srcNumElements * i);
        anim.act[i] = true; // TODO remove and replace by particule removal in collision resolver
        anim.vertOffset[i] = camera.adjustToCamera(    ((partPosFunc != null) ? partPosFunc(i, nbPart) : v3_new())  );
        anim.org[i] = v3_new(anim.vertOffset[i]);
    }

    // gen particules direction
    for (let i = 0; i < anim.nbPart; ++i) {

        anim.vect[i] = camera.adjustToCamera(   ((partDirFunc != null) ? partPosFunc(anim.vertOffset[i], i, nbPart) : v3_new())  );
        anim.vectNorm[i] = v3_normalize_new(anim.vect[i]);

        //offset pelets vertex by new origin
        for (var j = 0; j < anim.target.srcNumElements; ++j ) {
            var idx = ( i * anim.target.srcNumElements) + j;
            var b = anim.target.getVertex3f(idx);
            v3_add_mod(b, anim.vertOffset[i])
        }

        if (CD) anim.target.pushCD_point(anim.org[i]);
    }



    anim.target.collisionDetection = CD;
    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.resetMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    


function collisionResult_asSource_bounce(){

}

function collisionResult_asSource_mark(){

}

function collisionResult_asTarget_bounce(){

}

function collisionResult_asTarget_mark(){

}


// First Passes

function anim_Base_firstPass(){
    if (this.state == E3D_PLAY) {

        v3_copy(this.last_position, this.target.position);

        v3_scale_res(this.delta, this.spd, timer.delta);  

        if (this.gravity) this.spd[1] = this.spd[1] - gAccel;

        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        this.target.resetMatrix();
        this.lastHitMarker = ""; 
    }
}

function anim_Transform_firstPass() {
    if (this.state == E3D_PLAY) {

        v3_copy(this.last_position, this.target.position);

        v3_scale_res(this.delta, this.spd, timer.delta);  
        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        v3_addscaled_mod(this.target.rotation, this.rspd, timer.delta);

        this.target.resetMatrix();
        this.lastHitMarker = ""; 
    }
}

function anim_Part_firstPass() {

    v3_copy(this.last_position, this.target.position);

    v3_scale_res(this.delta, this.spd, timer.delta);  

    if (this.gravity) this.spd[1] = this.spd[1] - gAccel;

    v3_add_mod(this.target.position, this.delta);
    this.deltaLength = v3_length(this.delta);

    // animate particules
    for (let i = 0; i < this.nbPart; ++i) if (this.act[i]) { // i is pellet index

        // translate pellet entity elements
        for (var j = 0; j < this.target.srcNumElements; ++j ) {
            var b = this.target.getVertex3f((i*this.target.srcNumElements) + j); // b is a view in float32array
            v3_addscaled_mod(b, this.vertOffset[i], timer.delta);
        }

        v3_copy(this.org[i], this.target.CD_point_p[i]);
        v3_addscaled_mod(this.target.CD_point_p0[i], this.vertOffset[i], timer.delta);
    }

    this.target.resetMatrix();
    this.lastHitMarker = ""; 



}

// Re Passes

function anim_Base_rePass(itr) {

    if ((this.deltaLength > 0) && (this.collisionDetected)) {


  //TODO replace by functions for source and target such as collisionResult_asSource_bounce


            nHits++;
            this.lastHitMarker = this.closestCollision[0];
            // closestCollision = [marker, penetration, n, firstHit, "SphVect-plane"];
            //                       0          1       2     3              4
            if (this.closestCollision[1] < 0.0) throw "col behind initial position: " + this.closestCollision[1];

            v3_normalize_mod(this.closestCollision[2]);

            if (this.gravity) this.spd[1] += gAccel;
            
            if (v3_dot(this.closestCollision[2], this.delta) < 0.0) { // face to face

                v3_reflect_mod(this.spd, this.closestCollision[2]); // reflect per hit normal          
                v3_copy(this.last_position, this.closestCollision[3]); // resset position as per firstHit
           
                var remainder = 1.0 - (Math.sqrt(this.closestCollision[1]) / this.deltaLength) ; // fraction remaining
                remainder = remainder - 0.2;
                if (remainder < 0.0) remainder = 0.0;
                // TODO if less than 0.0, inside hit before move, cancel speed and delta, add error offset to direction

                var drag = 0.8;
                v3_scale_mod(this.spd, drag); // hit speed "drag"
                var spdl = v3_lengthsquared(this.spd);
                hitPoints.set("spd len", spdl);

                v3_scale_res(this.delta, this.spd, remainder * timer.delta * drag); // new delta
                this.deltaLength = v3_length(this.delta);
                v3_add_res(this.target.position, this.last_position, this.delta); // new positions 
            
           
                this.target.resetMatrix();
            } // end face to face

            if (this.gravity) this.spd[1] -= gAccel;

        } // end collisionDetected
// if both, check and resolve first to happend
        if (this.collisionFromOther) {

            v3_normalize_mod(this.otherCollision[2]); // change direction on hit
            v3_addscaled_mod(this.spd, this.otherCollision[2], -0.15 * v3_length(this.otherCollision[3])); 

            v3_scale_mod(this.spd, 0.8); // hit "drag"

            v3_scale_res(this.delta, this.spd, timer.delta);            
            this.deltaLength = v3_length(this.delta);
            if (this.deltaLength < _v3_epsilon) this.deltaLength = _v3_epsilon;
            v3_add_res(this.target.position, this.last_position, this.delta); 

            this.target.resetMatrix();
        } // end collisionFromOther

        this.collisionDetected = false;
        this.collisionFromOther = false;
}


// End passes


function anim_Base_endPass_ttl() {
    this.ttl -= timer.delta;

    if (this.ttl < 0) {
        this.state = this.endState;
        this.target.visible = false;
    }
}

function anim_Base_endPass() {
    if (this.state == E3D_DONE) this.target.visible = false;
}



function cleanupDoneAnimations(animations, scn) {
    var someremoved = false;
    for (let i = animations.length -1; i >=0; --i) if (animations[i].state == E3D_DONE) {
        scn.removeEntity(animations[i].target.id, false);
        animations.splice(i, 1);
        someremoved = true;
    }
    // Recalc indices
    if (someremoved) for (let i = 0; i < animations.length; ++i) animations[i].target.animIndex = i;
}
