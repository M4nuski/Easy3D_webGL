// Easy3D_WebGL
// State container object for animations
// Animator functions
// Sample animation functions
// Sample collision resolver functions
// Emmanuel Charette 2017-2020

"use strict"


// Animation State and commands (exclusives)
const E3D_RESET = 0; // initial, back to start and pause, setup animation data
const E3D_PLAY = 1;  // call animation function
const E3D_PAUSE = 2; // pause
const E3D_RESTART = 3; // reset and play
const E3D_DONE = 4; // call end function



class E3D_animation {
    constructor(group = 0) {
        this.group = group; // animation can use different animators that only process specific groups

        this.ttl = -1; // time to live in seconds, -1 to disable
        this.state = E3D_RESET;
        this.endState = E3D_DONE; // state to set after ttl reaches 0

        this.animFunction = null; // function to calculate next step of animation
        this.sourceResolver = null; // function to resolve collisions when entity is a source
        this.targetResolver = null; // function to resolve collisions when entity is a target
        this.endFunction = null; // function to call when TTL reaches 0

        // Custom data
        this.last_position = v3_new();
        this.last_rotation = v3_new();
        this.gravity = 1.0; // factor to tweak how much global gravity affect animation
        this.frameGravity = 0.0; // calculated gravity for this frame
        
        // Tranforms
        this.trans_pos_spd = v3_new();
        this.trans_rot_spd = v3_new();

        // Particules
        this.part_nb = 1;
        this.part_active = [];
        this.part_last_pos = [];
        this.part_pos = [];
        this.part_dir = []; // normalized direction vectors
        this.part_spd = []; // direction vertors lengths
        this.part_CD = false; // register and process particules CD as Point
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

    cloneData(target) {
        throw "NOT IMPLEMENTED: E3D_animation.cloneData(target)";
    }

}



// Animator methods



function singlePassAnimator(animGroup = 0) {
    for (let i = 0; i < ENTITIES.length; ++i) 
        if ( ENTITIES[i].isAnimaed && 
                (ENTITIES[i].animation.animGroup == animGroup) && 
                    (ENTITIES[i].animation.animFunction != null)) ENTITIES[i].animation.animFunction(ENTITIES[i]);
}



function collisionDetectionAnimator(animGroup = 0, maxCDIterations = 10) {
     // build list of all entities with animations, and CD sources
    var ACTOR = [];
    var SOURCE = [];
    for (let i = 0; i < ENTITIES.length; ++i) if 
    ( ENTITIES[i].isAnimaed && ENTITIES[i].isVisible &&
                (ENTITIES[i].animation.animGroup == animGroup) && 
                    (ENTITIES[i].animation.animFunction != null) ) {
                        ACTOR[i] = true;
                        SOURCE[i] = ENTITIES[i].collisionDetection() && (ENTITIES[i].collision.deltaLength > 0.0);
                    } else ACTOR[i] = false;


    // First pass, calculate expected next position
    for (let i = 0; i < ENTITIES.length; ++i) if (ACTOR[i]) {
        ENTITIES[i].animation.animFunction(ENTITIES[i]);
        ENTITIES[i].collision.resetCollisions();
    } 


    // Cull Collission Detection
    for (let i = 0; i < ENTITIES.length; ++i) if (SOURCE[i]) { 
        ENTITIES[i].animation.candidates = new Array(ENTITIES.length);
        for (let j = 0; j < ENTITIES.length; ++j) { // all entities are targets
            ENTITIES[i].collision.candidates[j] = false; // default 
            if ((i != j) && ENTITIES[j].collisionDetection()) {  // different entity with CD
                
                var deltaP = 0;
                if (j > i) { // distance not checked yet
                    deltaP = v3_distance(ENTITIES[i].position, ENTITIES[j].position); 
                    ENTITIES[j].collision.othersDistances[i] = deltaP;
                    ENTITIES[i].collision.othersDistances[j] = deltaP;
                } else deltaP = ENTITIES[j].collision.othersDistances[i];

                var deltaD = ENTITIES[i].collision.deltaLength + ENTITIES[i].visibilityDistance + 
                             ENTITIES[j].collision.deltaLength + ENTITIES[j].visibilityDistance; 

                ENTITIES[i].collision.candidates[j] = deltaP <= deltaD;
            }
        }
    }

    var numIter = maxCDIterations;
    var hitDetected = true;

    while ((numIter > 0) && hitDetected){

        // Collision Detection
        hitDetected = false;
        for (let i = 0; i < ENTITIES.length; ++i) if (SOURCE[i]) {
            if (ENTITIES[i].collision.CD_sph > 0) CheckForAnimationCollisions_SphSource(ENTITIES[i]);
            if (ENTITIES[i].collision.CD_point > 0) CheckForAnimationCollisions_PointSource(ENTITIES[i]);
        }
        
        // Collision Response
        for (let i = 0; i < ENTITIES.length; ++i) if (ACTOR[i]) 
        if ((ENTITIES[i].collision.isCollisionSource) || (ENTITIES[i].collision.isCollisionTarget)) {
            resolverPass(ENTITIES[i].collision, ENTITIES[i].animation); 
            hitDetected = true;
        }
        numIter--;
    }

    return maxCDIterations - numIter;
}


function resolverPass(entCol, entAnim) {
    if (entCol.isCollisionSource && entCol.isCollisionTarget) { // both source and target
        if (entAnim.sourceColResolver && entAnim.targetColResolver) { // resolver for both source and target
            if (entCol.closestCollision.t0 < entCol.otherCollision.t0) { // closest event
                entAnim.sourceColResolver();
            } else {
                entAnim.targetColResolver();
            }
        } else if (entAnim.sourceColResolver) { // source resolver only
            entAnim.sourceColResolver();
        } else if (entAnim.targetColResolver) { // target resolver only
            entAnim.targetColResolver();
        }
    } else if (entCol.isCollisionSource && entAnim.sourceColResolver) { // only a source with a source resolver
        entAnim.sourceColResolver();
    } else if (entCol.isCollisionTarget && entAnim.targetColResolver) { // only a target with a target resolver
        entAnim.targetColResolver();
    }
    
    entCol.isCollisionSource = false;
    entCol.isCollisionTarget = false;
}


// Animation factories
// TODO fix for new flat engine structure


function newTransformAnim(entity, pos_speed, rot_speed, ttl = -1, CD = false, endState = E3D_DONE) {
  //  var repassFunct = (CD) ? anim_Base_rePass : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;

    var anim = new E3D_animation("", entity, anim_Transform_firstPass, null, null, endFunct, 0);

    v3_copy(anim.pspd, pos_speed);
    v3_copy(anim.rspd, rot_speed);

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = false;
    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.updateMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}

function newBaseAnim(entity, pos_speed, rot_speed, gravity = 0, ttl = -1, CD = false, endState = E3D_DONE) {

    var SrepassFunct = (CD) ? collisionResult_asSource_bounce : null;
    var TrepassFunct = (CD) ? collisionResult_asTarget_bounce : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;
    var anim = new E3D_animation("", entity, anim_Base_firstPass, SrepassFunct, TrepassFunct, endFunct, 0);

    v3_copy(anim.pspd, pos_speed);
    v3_copy(anim.rspd, rot_speed);

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = gravity;
    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.updateMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    


function newBaseAnim_RelativeToCamera(entity, camera, pos_speed, rot_speed, gravity = 0, ttl = -1, CD = false, endState = E3D_DONE) {

    var SrepassFunct = (CD) ? collisionResult_asSource_bounce : null;
    var TrepassFunct = (CD) ? collisionResult_asTarget_bounce : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;

    var anim = new E3D_animation("", entity, anim_Base_firstPass, SrepassFunct, TrepassFunct, endFunct, 0);

    var offset = camera.adjustToCamera(anim.target.position);
    v3_copy(anim.target.position, camera.position);
    v3_add_mod(anim.target.position, offset);

    anim.pspd = camera.adjustToCamera(pos_speed);
    anim.rspd = camera.adjustToCamera(rot_speed);

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = gravity;
    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.updateMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    


function newParticuleAnim(entity, pos_speed, rot_speed, nbPart, partPosFunc, partDirFunc, gravity = 0, ttl = -1, CD = false, endState = E3D_DONE) {
    var SrepassFunct = (CD) ? collisionResult_asSource_mark : null;
    //var TrepassFunct = (CD) ? collisionResult_asTarget_mark : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;

    var anim = new E3D_animation("", entity, anim_Part_firstPass, SrepassFunct, null, endFunct, 0);

    v3_copy(anim.pspd, pos_speed);
    v3_copy(anim.rspd, rot_speed);

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = gravity;
    anim.pCD = CD;

    anim.pNum = nbPart;
    anim.pActive = Array(nbPart);
    anim.pLastPos = Array(nbPart);
    anim.pPos = Array(nbPart);
    anim.pSpd = Array(nbPart);
    anim.pSpdLength = Array(nbPart);

    // clone elements to make the number of particules
    anim.target.setSize(anim.target.srcNumElements * anim.pNum);

    // gen starting positions
    for (let i = 0; i < anim.pNum; ++i) {
        //new pellet
        anim.target.copySource(anim.target.srcNumElements * i);
        anim.pActive[i] = true;
        anim.pLastPos[i] = ((partPosFunc != null) ? partPosFunc(i, nbPart) : v3_new());
    }
    
    // gen particules direction
    for (let i = 0; i < anim.pNum; ++i) {
        anim.pSpd[i] = ((partDirFunc != null) ? partPosFunc(anim.pPos[i], i, nbPart) : v3_new());
        anim.pSpdLength[i] = v3_length(anim.pSpd[i]);        
        anim.pPos[i] = v3_clone(anim.pLastPos[i]);

        //offset pelets vertex by new origin
        for (var j = 0; j < anim.target.srcNumElements; ++j ) {
            var idx = ( i * anim.target.srcNumElements) + j;
            var b = anim.target.getVertex3f(idx);
            v3_add_mod(b, anim.pPos[i])
        }

        if (CD) anim.target.pushCD_point(anim.pPos[i]);
    }

    entity.isCollisionSource = CD;

    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.updateMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    


function newParticuleAnim_RelativeToCamera(entity, camera, pos_speed, rot_speed, nbPart, partPosFunc, partDirFunc, gravity = 0, ttl = -1, CD = false, endState = E3D_DONE) {
    var SrepassFunct = (CD) ? collisionResult_asSource_mark : null;
    //var TrepassFunct = (CD) ? collisionResult_asTarget_mark : null;
    var endFunct = (ttl > 0.0) ? anim_Base_endPass_ttl : anim_Base_endPass;

    var anim = new E3D_animation("", entity, anim_Part_firstPass, SrepassFunct, null, endFunct, 0);

    var offset = camera.adjustToCamera(anim.target.position);
    v3_copy(anim.target.position, camera.position);
    v3_add_mod(anim.target.position, offset);

    anim.pspd = camera.adjustToCamera(pos_speed);
    anim.rspd = camera.adjustToCamera(rot_speed);

    anim.endState = endState;
    anim.ttl = ttl;
    anim.gravity = gravity;
    anim.pCD = CD;

    anim.pNum = nbPart;
    anim.pActive = Array(nbPart);
    anim.pLastPos = Array(nbPart);
    anim.pPos = Array(nbPart);
    anim.pSpd = Array(nbPart);
    anim.pSpdLength = Array(nbPart);

    // clone elements to make the number of particules
    anim.target.setSize(anim.target.srcNumElements * anim.pNum);

    // gen starting positions
    for (let i = 0; i < anim.pNum; ++i) {
        //new pellet
        anim.target.copySource(anim.target.srcNumElements * i);
        anim.pActive[i] = true;
        anim.pLastPos[i] = ((partPosFunc != null) ? partPosFunc(i, nbPart) : v3_new());
    }
    
    // gen particules direction
    for (let i = 0; i < anim.pNum; ++i) {
        anim.pSpd[i] = camera.adjustToCamera( ((partDirFunc != null) ? partPosFunc(anim.pPos[i], i, nbPart) : v3_new()) );
        anim.pSpdLength[i] = v3_length(anim.pSpd[i]);        

        anim.pLastPos[i] = camera.adjustToCamera(anim.pLastPos[i]);
        anim.pPos[i] = v3_clone(anim.pLastPos[i]);

        //offset pelets vertex by new origin
        for (var j = 0; j < anim.target.srcNumElements; ++j ) {
            var idx = ( i * anim.target.srcNumElements) + j;
            var b = anim.target.getVertex3f(idx);
            v3_add_mod(b, anim.pPos[i])
        }

        if (CD) anim.target.pushCD_point(anim.pPos[i]);
    }

    entity.isCollisionSource = CD;

    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.updateMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    



// Collision resolver functions



function collisionResult_asSource_bounce(){
    if (this.deltaLength > 0) {

        E3D_DEBUG_CD_NB_HIT++;
        var firstCol = this.closestCollision[0];
        if (this.colNum > 1) {
            var firstColt0 = this.closestCollision[0].t0;
            for (var i = 1; i < this.colNum; ++i) if (this.closestCollision[i].t0 < firstColt0) {
                firstColt0 = this.closestCollision[i].t0;
                firstCol = this.closestCollision[i]; 
            }
        }

        this.lastHitMarker = ""+firstCol.marker;        

        /*if (E3D_DEBUG_SHOW_HIT_RESULT) { 
            phyTracers.addWireCross(this.last_position, 1, _v3_red);
            phyTracers.addWireCross(firstCol.p0, 1, _v3_green);
            phyTracers.addWireCross(this.target.position, 1, _v3_blue);
        }*/
        
        
        //if (firstCol.t0 < 0.0) { //throw "collision behind initial position: " + firstCol.marker + "@" + firstCol.t0;
        
       // }
        firstCol.t0 = Math.sqrt(Math.abs(firstCol.t0));
        v3_normalize_mod(firstCol.n);
        
        this.pspd[1] += this.frameG;
        
        if (v3_dot(firstCol.n, this.delta) < 0.0) { // face to face
            
            v3_reflect_mod(this.pspd, firstCol.n);
            v3_copy(this.last_position, firstCol.p0); // reset position as per firstHit
            
            var remainder = 1.0 - firstCol.t0; // remaining fraction
            remainder = remainder - 0.2;
            if (remainder < 0.0) remainder = 0.0;

            var drag = 0.8;
            v3_scale_mod(this.pspd, drag); // hit speed "drag"

            v3_scale_res(this.delta, this.pspd, remainder * timer.delta * drag); // new delta
            this.deltaLength = v3_length(this.delta);
            v3_add_res(this.target.position, this.last_position, this.delta); // new position        
        
            this.target.updateMatrix();
        }  //else v3_copy(this.target.position, firstCol.p0);
      
        this.pspd[1] -= this.frameG;

    } //else v3_copy(this.last_position, firstCol.p0); // resset position as per firstHit
}

function collisionResult_asTarget_bounce(){
    var firstCol = this.otherCollision[0];
    if (this.otherColNum > 1) {
        var firstColt0 = this.otherCollision[0].t0;
        for (var i = 1; i < this.otherColNum; ++i) if (this.otherCollision[i].t0 < firstColt0) {
            firstColt0 = this.otherCollision[i].t0;
            firstCol = this.otherCollision[i]; 
        }
    }

    firstCol.t0 = Math.sqrt(Math.abs(firstCol.t0));
    v3_normalize_mod(firstCol.n); // change direction on hit
    v3_addscaled_mod(this.pspd, firstCol.n, -0.15 * v3_length(firstCol.s)); 

    v3_scale_mod(this.pspd, 0.8); // hit "drag"

    v3_scale_res(this.delta, this.pspd, timer.delta);            
    this.deltaLength = v3_length(this.delta);
    if (this.deltaLength < _v3_epsilon) this.deltaLength = _v3_epsilon;
    v3_add_res(this.target.position, this.last_position, this.delta); 

    this.target.updateMatrix();
}


function collisionResult_asSource_mark(){
    this.lastHitMarker = "";
    for (var i = 0; i < this.colNum; ++i) {
        v3_normalize_mod(this.closestCollision[i].n);
        if (E3D_DEBUG_SHOW_HIT_RESULT) { 
            phyTracers.addWireCross(this.closestCollision[i].p0, 2, _v3_green);
            phyTracers.addLineByPosNormLen(this.closestCollision[i].p0, this.closestCollision[i].n, 2, false, _v3_white);
        }
        if (this.closestCollision[i].source_desc == "Point") {
            this.pActive[this.closestCollision[i].source_cdi] = false;
        }
    }
}


function collisionResult_asSource_slide(){
    if (this.deltaLength > 0) {

        E3D_DEBUG_CD_NB_HIT++;
        var firstCol = this.closestCollision[0];
        if (this.colNum > 1) {
            var firstColt0 = this.closestCollision[0].t0;
            for (var i = 1; i < this.colNum; ++i) if (this.closestCollision[i].t0 < firstColt0) {
                firstColt0 = this.closestCollision[i].t0;
                firstCol = this.closestCollision[i]; 
            }
        }

        this.lastHitMarker = ""+firstCol.marker;        

        if (firstCol.t0 < 0.0) { // inside

            firstCol.t0 = Math.sqrt(-firstCol.t0);
            v3_normalize_mod(firstCol.n);
            this.pspd[1] += this.frameG;
            v3_copy(this.last_position, firstCol.p0); 

            v3_addscaled_mod(this.pspd, firstCol.n, this.deltaLength * firstCol.t0);

            var remainder = 1.0 - (firstCol.t0 / this.deltaLength); // remaining fraction
            if (remainder < 0.0) remainder = 0.0;

            v3_scale_res(this.delta, this.pspd, timer.delta * remainder);
            this.deltaLength = v3_length(this.delta);
            v3_add_res(this.target.position, this.last_position, this.delta);
            this.target.updateMatrix();
            this.pspd[1] -= this.frameG;

        } else { // along path
            firstCol.t0 = Math.sqrt(firstCol.t0);
            v3_normalize_mod(firstCol.n);
            this.pspd[1] += this.frameG;
            
            if (v3_dot(firstCol.n, this.delta) < 0.0) { // face to face
                
                v3_copy(this.last_position, firstCol.p0); // reset position as per firstHit

                
                v3_reflect_mod(this.pspd, firstCol.n);
                
                var remainder = 1.0 - (firstCol.t0 / this.deltaLength); // remaining fraction
                remainder = remainder - 0.2;
                if (remainder < 0.0) remainder = 0.0;

                var drag = 0.8;
                v3_scale_mod(this.pspd, drag); // hit speed "drag"
                //if (this.pspd[1] > 0.0) this.pspd[1] *= drag;

                v3_scale_res(this.delta, this.pspd, remainder * timer.delta * drag); // new delta
                
                // project remaining delta on hit plane
                //var offset = v3_mult_new(this.pspd, firstCol.n);
                //v3_sub_mod(this.pspd, offset);
                
            //    v3_addscaled_mod(this.pspd, firstCol.n, v3_length(offset) );

                this.deltaLength = v3_length(this.delta);
                v3_add_res(this.target.position, this.last_position, this.delta); // new position        
            
                this.target.updateMatrix();
            } // face to face  
            this.pspd[1] -= this.frameG;
        } // t0 < 0
    } // deltalength > 0
}



function collisionResult_asTarget_mark(){
    for (var i = 0; i < this.otherColNum; ++i) {
        v3_normalize_mod(this.isCollisionTarget[i].n);
        if (E3D_DEBUG_SHOW_HIT_RESULT) { 
            phyTracers.addWireCross(this.isCollisionTarget[i].p0, 2, _v3_red);
            phyTracers.addLineByPosNormLen(this.isCollisionTarget[i].p0, this.isCollisionTarget[i].n, 2, false, _v3_white);
        }
    }
}



// First pass basic methods



function anim_Base_firstPass(){
    if (this.state == E3D_PLAY) {

        v3_copy(this.last_position, this.target.position);
        v3_scale_res(this.delta, this.pspd, timer.delta);  

        this.frameG = TIMER.g * this.gravity;
        this.pspd[1] -= this.frameG;

        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        this.target.updateMatrix();
        this.lastHitMarker = ""; 
    }
}

function anim_Transform_firstPass() {
    if (this.state == E3D_PLAY) {

        v3_copy(this.last_position, this.target.position);

        v3_scale_res(this.delta, this.pspd, timer.delta);  
        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        v3_addscaled_mod(this.target.rotation, this.rspd, timer.delta);

        this.target.updateMatrix();
        this.lastHitMarker = ""; 
    }
}

function anim_Part_firstPass() {
    if (this.state == E3D_PLAY) {

        // Transform
        v3_copy(this.last_position, this.target.position);
        v3_scale_res(this.delta, this.pspd, timer.delta);  

        this.frameG = TIMER.g * this.gravity;
        this.pspd[1] -= this.frameG;

        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        // Remove deactivated particules
        for (let i = this.pNum-1; i >= 0; --i) if (!this.pActive[i]) {
            this.pNum--;
            this.pActive.splice(i, 1);
            this.pLastPos.splice(i, 1);
            this.pPos.splice(i, 1);
            this.pSpd.splice(i, 1);
            this.pSpdLength.splice(i, 1);

            for (var k = i+1; k < this.pNum; ++k) { // bubble up the remeaining vertex
                for (var j = 0; j < this.target.srcNumElements; ++j ) {
                    var nextIndex = ( k * this.target.srcNumElements) + j;
                    var prevIndex = ( (k-1) * this.target.srcNumElements) + j;
                    this.target.setVertex3f(prevIndex, this.target.getVertex3f(nextIndex));
                }
            }
            this.target.numElements -= this.target.srcNumElements;
            if (this.pCD) {
                this.target.CD_point--;
                this.target.CD_point_p0.splice(i, 1);
                this.target.CD_point_p.splice(i, 1);
            }

        }

        var max = v3_new();
        // Animate particules
        for (let i = 0; i < this.pNum; ++i) { 

            v3_copy(this.pLastPos[i], this.pPos[i]);
            v3_addscaled_mod(this.pPos[i], this.pSpd[i], timer.delta);

            // translate pellet entity elements
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var b = this.target.getVertex3f( ( i * this.target.srcNumElements ) + j); // b is a view in float32array
                v3_addscaled_mod(b, this.pSpd[i], timer.delta);
                if (Math.abs(b[0]) > max[0]) max[0] = Math.abs(b[0]);
                if (Math.abs(b[1]) > max[1]) max[1] = Math.abs(b[1]);
                if (Math.abs(b[2]) > max[2]) max[2] = Math.abs(b[2]);
            }

            if (this.pCD) v3_copy(this.target.CD_point_p0[i], this.pPos[i]); 
        }

        this.target.visibilityDistance = v3_length(max);
        this.target.dataContentChanged = true;
        this.target.updateMatrix();
        this.lastHitMarker = ""; 
    }
}



// End pass basic functions



function anim_Base_endPass_ttl() {
    this.ttl -= timer.delta;

    if (this.ttl < 0) {
        this.state = this.endState;
        this.isVisible = false;
    }
}

function anim_Base_endPass() {
    if (this.state == E3D_DONE) this.isVisible = false;
}



// Helper functions



function cleanupDoneAnimations() {
    //var someremoved = false;
    for (let i = ENTITIES.length-1; i >= 0; --i) if ( (ENTITIES[i].isAnimaed) && (ENTITIES[i].animation.state == E3D_DONE) ) {

        SCENE.removeEntity(ENTITIES[i].id, false);

      //  someremoved = true;
    }
    // Recalc indices until animations are merged with entities
    //if (someremoved) for (let i = 0; i < animations.length; ++i) animations[i].target.animIndex = i;
}

