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
        this.index = -1; // index in global stores to back-reference other information

        this.group = group; // animation metadata ex to use different animators that only process specific groups

        this.ttl = -1; // time to live in seconds, -1 to disable
        this.initial_ttl  = -1;
        this.state = E3D_RESET;
        this.endState = E3D_DONE; // state to set after ttl reaches 0

        this.animFunction = null; // function(entityIndex) to calculate next step of animation (handle .state)
        this.sourceColResolver = null; // function(entityIndex) to resolve collisions when entity is a source
        this.targetColResolver = null; // function(entityIndex) to resolve collisions when entity is a target
        this.endFunction = null; // function(entityIndex) to call when TTL reaches 0 (handle .endState)

        // Custom data
        this.initial_position = v3_new(); // for RESET
        this.initial_rotation = v3_new();
        this.last_position = v3_new(); // for body interpolation
        this.last_rotation = v3_new();
        this.gravity = 1.0; // factor to tweak how much global gravity affect animation
        this.frameGravity = 0.0; // calculated gravity for this frame
        
        // Tranforms
        this.trans_initial_pos_spd = v3_new(); // for RESET
        this.trans_initial_rot_spd = v3_new();
        this.trans_pos_spd = v3_new(); // can be modified by gravity and collisions with other bodies
        this.trans_rot_spd = v3_new();

        // Particules
        this.part_nb = 1;

        this.part_last_pos = []; // of v3 
        this.part_pos = []; // of v3
        this.part_dir = []; // of v3: normalized direction vectors
        this.part_ttl = []; // of float for each particules
        this.part_scale = []; // of float
        this.part_alpha = []; // of float

        this.part_CD = false; // register and process particules CD as Point
        this.part_updateFunction = null;
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
        throw new Error("NOT IMPLEMENTED: E3D_animation.cloneData(target)");
    }

}



// Animator methods


// Call animation function on each entities of a group. Even invisible ones.
function singlePassAnimator(animGroup = 0) {
    for (let i = 0; i < ENTITIES.length; ++i) 
        if ( ENTITIES[i].isAnimaed && 
            (ANIMATIONS[i].group == animGroup) &&
            (ANIMATIONS[i].animFunction != null) ) ANIMATIONS[i].animFunction(i);
}



function collisionDetectionAnimator(animGroup = 0, maxCDIterations = 10) {
     // build list of all entities with animations, and CD sources
    var actors = new Array(ENTITIES.length); // entities with animations
    var sources = new Array(ENTITIES.length); // entities with animations that have bodies that can be sources
    for (let i = 0; i < ENTITIES.length; ++i)
        if ( ENTITIES[i].isAnimaed && (ANIMATIONS[i].group == animGroup) && (ANIMATIONS[i].animFunction != null) ) {
            actors[i] = true;
            sources[i] = ENTITIES[i].isVisible && ENTITIES[i].isCollisionSource && (BODIES[i].deltaLength > 0.0);
        } else actors[i] = false;


    // First pass, calculate expected next position
    for (let i = 0; i < ENTITIES.length; ++i) if (actors[i]) {
        ANIMATIONS[i].animFunction(i);
        BODIES[i].resetCollisions();
    } 


    // Cull Collission Detection
    for (let i = 0; i < ENTITIES.length; ++i) if (sources[i]) { 
        BODIES[i].candidates = new Array(ENTITIES.length);
        for (let j = 0; j < ENTITIES.length; ++j) { // all other entities are targets
            BODIES[i].candidates[j] = false; // default 
            if ((i != j) && ENTITIES[j].isVisible && ENTITIES[j].collisionDetection()) {  // different visible entity with CD
                
                var deltaPosition = 0;

                //if (j > i) { // TODO cache distances 
                deltaPosition = v3_distance(ENTITIES[i].position, ENTITIES[j].position); 
                //   BODIES[i].distances[j] = deltaPosition;
                //   BODIES[j].distances[i] = deltaPosition;
                //} else deltaPosition = BODIES[j].distances[i];

                var totalVolume = BODIES[i].deltaLength + ENTITIES[i].visibilityDistance + 
                                  BODIES[j].deltaLength + ENTITIES[j].visibilityDistance; 

                BODIES[i].candidates[j] = deltaPosition <= totalVolume;
            }
        }
    }

    var numIter = maxCDIterations;
    var hitDetected = true;
    E3D_DEBUG_CD_NB_HIT = 0;

    while ((numIter > 0) && hitDetected) {

        // Collision Detection
        hitDetected = false;
        for (let i = 0; i < ENTITIES.length; ++i) if (sources[i]) {
            if (BODIES[i].CD_point > 0) CheckForBodyCollisions_PointSource(i);
            if (BODIES[i].CD_sph > 0) CheckForBodyCollisions_SphSource(i);
            //if (BODIES[i].CD_edge > 0) CheckForBodyCollisions_EdgeSource(i);
            //if (BODIES[i].CD_capsule > 0) CheckForBodyCollisions_CapSource(i);
        }
        
        // Collision Response
        for (let i = 0; i < ENTITIES.length; ++i) if (actors[i]) 
        if ((BODIES[i].nbSourceCollision > 0) || (BODIES[i].nbTargetCollision > 0)) {
            resolverPass(i); 
            hitDetected = true;
            E3D_DEBUG_CD_NB_HIT++;
        }
        numIter--;
    }

    E3D_DEBUG_CD_NB_PASSES = maxCDIterations - numIter;
}


function resolverPass(index) {
    var anim = ANIMATIONS[index];
    var body = BODIES[index];
    if ((body.nbSourceCollision > 0) && (body.nbTargetCollision > 0)) { // both source and target
        if (anim.sourceColResolver && anim.targetColResolver) { // resolver for both source and target
            if (body.closestCollision.t0 < body.otherCollision.t0) { // closest event
                anim.sourceColResolver(index);
            } else {
                anim.targetColResolver(index);
            }
        } else if (anim.sourceColResolver) { // source resolver only
            anim.sourceColResolver(index);
        } else if (anim.targetColResolver) { // target resolver only
            anim.targetColResolver(index);
        }
    } else if ((BODIES[i].nbSourceCollision > 0) && anim.sourceColResolver) { // only a source with a source resolver
        anim.sourceColResolver(index);
    } else if ((BODIES[i].nbTargetCollision > 0) && anim.targetColResolver) { // only a target with a target resolver
        anim.targetColResolver(index);
    }
    
    body.nbSourceCollision = 0;
    body.nbTargetCollision = 0;
}



// Animation factories

function addTransformAnim(entity, pos_speed, rot_speed = _v3_null, group = 0, gravity = 0.0, ttl = -1, endState = E3D_DONE) {

    var idx = E3D_getEntityIndexFromId(entity.id);
    var anim =  new E3D_animation(group);
    ANIMATIONS[idx] = anim;

    entity.isAnimaed = true;

    v3_copy(anim.trans_initial_pos_spd, pos_speed);
    v3_copy(anim.trans_initial_rot_spd, rot_speed);

    anim.animFunction = animFunction_transform;
    anim.endFunction = (ttl > 0.0) ? endFunction_setState : null;
    anim.endState = endState;
    anim.initial_ttl = ttl;
    anim.gravity = gravity;

    v3_copy(anim.initial_position, entity.position);
    v3_copy(anim.initial_rotation, entity.rotation);

    return anim;
}

function addTransformAnim_fromCamera(entity, pos_speed, rot_speed = _v3_null, group = 0, gravity = 0.0, ttl = -1, endState = E3D_DONE) {

    var newPosSpeed = CAMERA.adjustToCamera_new(pos_speed);
    var newRotSpeed = CAMERA.adjustToCamera_new(rot_speed);

    v3_add_mod(entity.position, CAMERA.position);
    v3_add_mod(entity.rotation, CAMERA.rotation);

    entity.updateMatrix();

    return newTransformAnim(entity, newPosSpeed, newRotSpeed, group, gravity, ttl, endState);
}

function addPhysicsAnim(entity, pos_speed, rot_speed = _v3_null, group = 0, gravity = 0.0, ttl = -1, endState = E3D_DONE) {

    var anim = newTransformAnim(entity, pos_speed, rot_speed, group, gravity, ttl, endState);

    anim.sourceColResolver = collisionResult_asSource_slide;
    anim.targetColResolver = collisionResult_asTarget_bounce;
    anim.endFunction = (ttl > 0.0) ? endFunction_setState_Hide : null;

    return anim;
}    


function addPhysicsAnim_fromCamera(entity, pos_speed, rot_speed = _v3_null, group = 0, gravity = 0.0, ttl = -1, endState = E3D_DONE) {

    var newPosSpeed = CAMERA.adjustToCamera_new(pos_speed);
    var newRotSpeed = CAMERA.adjustToCamera_new(rot_speed);

    v3_add_mod(entity.position, CAMERA.position);
    v3_add_mod(entity.rotation, CAMERA.rotation);

    entity.updateMatrix();

    return newPhysicsAnim(entity, newPosSpeed, newRotSpeed, group, gravity, ttl, endState);
}    

// entity has to be a E3D_entity_dynamicCopy
// basic pos and rot transform for entity
// each particules is a copy of mesh from source entity data.
// spawn function(i, anim) : set initial pos, dir, scale, ttl and alpha per particules
// update function(i, anim) : update dir, scale and alpha (then pos is += dir, ttl -= TIMER.delta done in animator) each frame 
// if CD the anim function will register center of each particules as the target body's point CD data
// the functions receive index and anim as parameters
function addParticuleAnim(entity, pos_speed, rot_speed, nbPart, spawnFunction, updateFunction, gravity = 0, ttl = -1, endState = E3D_DONE, CD = false) {
     
    var anim = newTransformAnim(entity, pos_speed, rot_speed, group, gravity, ttl, endState); // base transform anim for whole entity
    
    anim.animFunction = animFunction_particule;
    anim.endFunct = (ttl > 0.0) ? endFunction_setState_Hide : endFunction_setState;

    anim.part_nb = nbPart;    

    anim.part_last_pos = v3a_new(nbPart); // of v3

    anim.part_pos = v3a_new(nbPart); // of v3
    anim.part_dir = v3a_new(nbPart); // of v3: direction vectors
    anim.part_ttl = Array(nbPart); // of float: ttl of individual particules
    anim.part_scale = Array(nbPart); // of float: scale
    anim.part_alpha = Array(nbPart); // of float: alpha

    anim.part_CD = CD;
    anim.part_updateFunction = updateFunction;
    
    // clone elements to make the number of particules
    entity.setSize(entity.srcNumElements * anim.part_nb);

    var idx = E3D_getEntityIndexFromId(entity.id);    
    if (CD && (BODIES[idx] == null)) BODIES[idx] = new E3D_body();

    // using spawnFunction
    // gen starting state
    for (let i = 0; i < anim.part_nb; ++i) {
        // gen data for this particule
        if (spawnFunction != undefined) spawnFunction(i, anim); 
        v3_copy(anim.part_last_pos, anim.part_pos);
        if (CD) BODIES[idx].pushCD_point(anim.part_pos[i]);
        
        // copy source 
        entity.copySource(entity.srcNumElements * i);

        // offset particule vertex by new position
        for (var j = 0; j < entity.srcNumElements; ++j ) v3_add_mod(entity.getVertex3f(( i * entity.srcNumElements) + j ), anim.part_pos[i]);
    }
    return anim;
}    


function addParticuleAnim_fromCamera(entity, pos_speed, rot_speed, nbPart, spawnFunction, updateFunction, gravity = 0, ttl = -1, endState = E3D_DONE, CD = false) {
    var newPosSpeed = CAMERA.adjustToCamera_new(pos_speed);
    var newRotSpeed = CAMERA.adjustToCamera_new(rot_speed);

    v3_add_mod(entity.position, CAMERA.position);
    v3_add_mod(entity.rotation, CAMERA.rotation);

    entity.updateMatrix();

    return addParticuleAnim(entity, newPosSpeed, newRotSpeed, nbPart, spawnFunction, updateFunction, gravity, ttl, endState, CD);

/*
    var offset = camera.adjustToCamera(anim.target.position);
    v3_copy(anim.target.position, camera.position);
    v3_add_mod(anim.target.position, offset);

    anim.pspd = camera.adjustToCamera(pos_speed);
    anim.rspd = camera.adjustToCamera(rot_speed);
*/
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
            phyTracers.addCross(this.last_position, 1, _v3_red);
            phyTracers.addCross(firstCol.p0, 1, _v3_green);
            phyTracers.addCross(this.target.position, 1, _v3_blue);
        }*/
        
        
        //if (firstCol.t0 < 0.0) { //throw new Error("collision behind initial position: " + firstCol.marker + "@" + firstCol.t0);
        
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
            phyTracers.addCross(this.closestCollision[i].p0, 2, _v3_green);
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
            phyTracers.addCross(this.isCollisionTarget[i].p0, 2, _v3_red);
            phyTracers.addLineByPosNormLen(this.isCollisionTarget[i].p0, this.isCollisionTarget[i].n, 2, false, _v3_white);
        }
    }
}



// Animation functions



// Basic linear transform for position and rotation
var _animFunction_transform_dp = v3_new();
var _animFunction_transform_dr = v3_new();
function animFunction_transform(index) {
    switch (this.state) {
        case E3D_RESET:
            this.ttl = this.initial_ttl;
            v3_copy(this.trans_pos_spd, this.trans_initial_pos_spd);
            v3_copy(this.trans_rot_spd, this.trans_initial_rot_spd);
            v3_copy(ENTITIES[index].position, this.initial_position);
            v3_copy(ENTITIES[index].rotation, this.initial_rotation);
        break;
        case E3D_PLAY:

            // gravity
            this.frameGravity = this.gravity * TIMER.g;
            this.trans_pos_spd[1] -= this.frameGravity;            

            // transform
            v3_scale_res(_animFunction_transform_dp, this.trans_pos_spd, TIMER.delta);
            v3_scale_res(_animFunction_transform_dr, this.trans_rot_spd, TIMER.delta);

            // body data
            if (BODIES[i] != null) { // TODO keep in animation ?
                v3_copy(BODIES[i].delta, _animFunction_transform_dp);
                BODIES[i].deltaLength = v3_length(_animFunction_transform_dp);
            }

            v3_copy(this.last_position, ENTITIES[index].position);
            v3_copy(this.last_rotation, ENTITIES[index].rotation);

            v3_add_mod(ENTITIES[index].position, _animFunction_transform_dp);
            v3_add_mod(ENTITIES[index].rotation, _animFunction_transform_dr);
            ENTITIES[index].updateMatrix();

            // ttl
            if (this.ttl == -1) {
                this.ttl -= TIMER.delta;
                if (this.ttl < 0.0) this.state = E3D_DONE;
            }
        break;
        case E3D_PAUSE:
            // do nothing   
        break;
        case E3D_RESTART:
            this.ttl = this.initial_ttl;
            v3_copy(this.trans_pos_spd, this.trans_initial_pos_spd);
            v3_copy(this.trans_rot_spd, this.trans_initial_rot_spd);
            v3_copy(ENTITIES[index].position, this.initial_position);
            v3_copy(ENTITIES[index].rotation, this.initial_rotation);

            this.state = E3D_PLAY;
        break;
        case E3D_DONE:
            if (this.endFunct != null) this.endFunct(i);
        break;
      }
}

// Transform function with particules handing
function animFunction_particule(index) {
    // transform
    animFunction_transform(index);

    // particules
    if (this.state == E3D_PLAY) {
        // ttl 
        if (this.ttl != -1) {
            // apply ttl and remove dead particules 
            for (let i = this.part_nb - 1; i >= 0; --i) {
                this.part_ttl[i] -= TIMER.delta;
                if (this.part_ttl[i] < 0.0) {

                    this.part_nb--;

                    this.part_last_pos.splice(i, 1);
                    this.part_pos.splice(i, 1);
                    this.part_dir.splice(i, 1);
                    this.part_spd.splice(i, 1);
                    this.part_ttl.splice(i, 1);
                    this.part_scale.splice(i, 1);
                    this.part_alpha.splice(i, 1);

                    // bubble up the remeaining vertex
                    for (var k = i + 1; k < this.part_nb; ++k) { 
                        for (var j = 0; j < ENTITIES[index].srcNumElements; ++j ) {
                            var nextIndex = ( k * ENTITIES[index].srcNumElements) + j;
                            var prevIndex = ( (k-1) * ENTITIES[index].srcNumElements) + j;
                            ENTITIES[index].setVertex3f(prevIndex, ENTITIES[index].getVertex3f(nextIndex));
                        }
                    }
                    ENTITIES[index].numElements -= ENTITIES[index].srcNumElements;
                    if (this.part_CD) {
                        ENTITIES[index].CD_point--; // TODO remCD_point in E3D_body
                        ENTITIES[index].CD_point_p0.splice(i, 1);
                        ENTITIES[index].CD_point_p.splice(i, 1);
                    }
                }
            } 
        } // tll != -1

        // Animate particules
        var max = v3_new();

        for (let i = 0; i < this.part_nb; ++i) { 

            if (this.part_updateFunction) this.part_updateFunction(i, this);
    
            v3_copy(this.part_last_pos[i], this.part_pos[i]);
            v3_addscaled_mod(this.part_pos[i], this.part_dir[i], TIMER.delta);

            // translate pellet entity elements
            for (var j = 0; j < ENTITIES[index].srcNumElements; ++j ) {
                var b = ENTITIES[index].getVertex3f( ( i * this.target.srcNumElements ) + j); // b is a view in float32array
                v3_addscaled_mod(b, this.part_dir[i], TIMER.delta);
                if (ENTITIES[index].isVisibiltyCullable) {
                    if (Math.abs(b[0]) > max[0]) max[0] = Math.abs(b[0]);
                    if (Math.abs(b[1]) > max[1]) max[1] = Math.abs(b[1]);
                    if (Math.abs(b[2]) > max[2]) max[2] = Math.abs(b[2]);
                }
            }

            if (this.part_CD) v3_copy(BODIES[index].CD_point_p0[i], this.part_pos[i]); 
        }




    } // E3D_PLAY

    if (ENTITIES[index].isVisibiltyCullable) ENTITIES[index].visibilityDistance = v3_length(max);
    ENTITIES[index].dataContentChanged = true;
}



// End of TTL functions



function endFunction_setState() {
    this.state = this.endState;
}

function endFunction_setState_Hide() {
    this.state = this.endState;
    this.isVisible = false;
}



// Helper functions



function cleanupDoneAnimations() {
    for (let i = ENTITIES.length-1; i >= 0; --i) 
        if ( (ENTITIES[i].isAnimaed) && (ANIMATIONS[i].state == E3D_DONE) ) SCENE.removeEntity(ENTITIES[i].id, false);
}

