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
    constructor(id, targetEntity, animFirstPass, collResolver_asSource = null, collResolver_asTarget = null, animLastPass =  null, group = 0) {

        this.id = id;
        
        this.animFirstPass = animFirstPass; //  calculate ideal next position
        this.sourceCollResolver = collResolver_asSource;
        this.targetCollResolver = collResolver_asTarget;
        this.animLastPass = animLastPass; // commit final state after collision detections are completed or prep next pass

        this.target = targetEntity;
        this.group = group;
        
        this.ttl = 0; // -1 to disable
        this.state = E3D_RESET;
        this.endState = E3D_DONE; // once ttl reached 0

        // Custom data
        this.last_position = v3_new();
        
        // Tranforms
        this.pspd = v3_new();
        this.rspd = v3_new();
        this.gravity = 0.0;

        // Particules
        this.pNum = 10;
        this.pActive = [];
        this.pLastPos = [];
        this.pPos = [];
        this.pSpd = [];
        this.pSpdLength = [];
        this.pCD = false;

        // For Collision Detection
        this.delta = [0, 0, 0]; // Position delta
        this.deltaLength = -1; // length of this.delta during animation step for culling, -1 anim target is not a source

        this.collisionDetected = false;
        this.closestCollision = new CDresult(); 

        this.collisionFromOther = false;
        this.otherCollision = new CDresult(); 

        this.candidates = []; // for all other entities, bool to test for CD after culling pass
        this.lastHitMarker = ""; // marker of last hit target to ignore on next pass
    }

    animateFirstPass(x) {
        if (this.animFirstPass) {
            this.animFirstPass(x);
        }
    }

    animateResolvePass(x) {
        if (this.collisionDetected && this.collisionFromOther) { 
            if (this.sourceCollResolver && this.targetCollResolver) {
                if (this.closestCollision.t0 < this.otherCollision.t0) {
                    this.sourceCollResolver(x);
                } else {
                    this.targetCollResolver(x);
                }
            } else if (this.sourceCollResolver) {
                this.sourceCollResolver(x);
            } else if (this.targetCollResolver) {
                this.targetCollResolver(x);
            }
        } else if (this.collisionDetected && this.sourceCollResolver) {
            this.sourceCollResolver(x);
        } else if (this.collisionFromOther && this.targetCollResolver) {
            this.targetCollResolver(x);
        }
        
        this.collisionDetected = false;
        this.collisionFromOther = false;
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


    resetCollisions() {             
        this.closestCollision.reset();
        this.otherCollision.reset();   
        this.collisionDetected = false;
        this.collisionFromOther = false;
    }

    collisionSource(m, t, n, p, sDesc, tDesc, sei, scdi, tcdi) {
        this.closestCollision.marker = m;
        this.closestCollision.t0 = t;
        v3_copy(this.closestCollision.n, n);
        v3_copy(this.closestCollision.p0, p);

        this.closestCollision.source_desc = sDesc;
        this.closestCollision.target_desc = tDesc;
        this.closestCollision.source_ei = sei;
        this.closestCollision.source_cdi = scdi;
        this.closestCollision.target_cdi = tcdi; 

        this.collisionDetected = true;
    }



    collisionTarget(m, t, n, p, sDesc, tDesc, sei, scdi, tcdi, s) {
        if (t < this.otherCollision.t0) {            
            this.otherCollision.marker = m;
            this.otherCollision.t0 = t;
            v3_copy(this.otherCollision.n, n);
            v3_copy(this.otherCollision.p0, p);
            
            this.otherCollision.source_desc = sDesc;
            this.otherCollision.target_desc = tDesc;
            this.otherCollision.source_ei = sei;
            this.otherCollision.source_cdi = scdi;
            this.otherCollision.target_cdi = tcdi; 
            
            v3_copy(this.otherCollision.s, s);

            this.collisionFromOther = true;
        } 
    }


}



// Animator methods



function singlePassAnimator(animList /*, animGroup*/) {
    for (let i = 0; i < animList.length; ++i) animList[i].animateFirstPass();
}

function multiPassAnimator(animList /*, animGroup*/) {
    for (let i = 0; i < animList.length; ++i) animList[i].animateFirstPass();
    for (let i = 0; i < animList.length; ++i) animList[i].animateResolvePass();
    for (let i = 0; i < animList.length; ++i) animList[i].animateLastPass();
}

function collisionDetectionAnimator(animList, scn, /*animGroup, */ maxCDIterations = 10) {
    // Animate / Calculate Expected target position and state

    // First pass, calculate expected next position
    for (let i = 0; i < animList.length; ++i) {
        animList[i].animateFirstPass();
        animList[i].resetCollisions();
    } 

    // calc distance every time top 100% of 0.050s at 800 entities 
    // map with distance and hash of ID 100 at 200 entities
    // list in animation target entity at 700
    //  list in both and map to lookup at 600
    //  multi pass, only add if closest max at 600

    // Cull Collission Detection
    for (let i = 0; i < animList.length; ++i) // CD culling
    if ((animList[i].target.collisionDetection) && (animList[i].deltaLength > -1)) { 

        animList[i].candidates = new Array(scn.entities.length);
        for (let j = 0; j < scn.entities.length; ++j) {// all entities are targets
            animList[i].candidates[j] = false;
            if ((scn.entities[j].collisionDetection == true) && (animList[i].target.id != scn.entities[j].id) ) { 
                var deltaP = v3_distance( animList[i].target.position, scn.entities[j].position); // TODO cache in entity
                var deltaD = animList[i].deltaLength + animList[i].target.cull_dist + scn.entities[j].cull_dist; // TODO add other ent deltaLength
                animList[i].candidates[j] = deltaP <= deltaD;  
            }
        }

    }

    var numIter = maxCDIterations;
    var hitDetected = true;

    while ((numIter > 0) && (hitDetected)){

        // Collision Detection
        hitDetected = false;
        for (let i = 0; i < animList.length; ++i) if ((animList[i].target.collisionDetection) && (animList[i].deltaLength > 0.0)) {
            if (animList[i].target.CD_sph > 0) CheckForAnimationCollisions_SphSource(animList[i], scn, animList);
            if (animList[i].target.CD_point > 0) CheckForAnimationCollisions_PointSource(animList[i], scn, animList);
        }
        
        // Collision Response
        for (let i = 0; i < animList.length; ++i) if ((animList[i].collisionDetected) || (animList[i].collisionFromOther)) {
            animList[i].animateResolvePass(maxCDIterations - numIter); 
            hitDetected = true;
        }
        numIter--;
    }

    // Last pass, post-process animation state after collisions are resolved
    for (let i = 0; i < animList.length; ++i) animList[i].animateLastPass();
    
    return maxCDIterations - numIter;
}



// Animation factories



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
    anim.target.resetMatrix();
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
    anim.target.resetMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    

function addNoise(v3val, v3range) { // TODO extract to ver4const
    v3val[0] += rndPM(v3range[0]);
    v3val[1] += rndPM(v3range[1]);
    v3val[2] += rndPM(v3range[2]);
    return v3val;
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
    anim.target.resetMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    


function newParticuleAnim(entity, pos_speed, rot_speed, nbPart, partPosFunc, partDirFunc, gravity = 0, ttl = -1, CD = false, endState = E3D_DONE) {

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

    anim.target.collisionDetection = CD;
    anim.state = E3D_PLAY;
    anim.target.visible = true;
    anim.target.resetMatrix();
    anim.last_position = v3_clone(anim.target.position);

    return anim;
}    



// Collision resolver functions



function collisionResult_asSource_bounce(){
    if (this.deltaLength > 0) {

        nHits++;
        this.lastHitMarker = ""+this.closestCollision.marker;
// sort hit ascending
// select closest
        //if (this.closestCollision.t0 < 0.0) throw "collision behind initial position: " + this.closestCollision.marker + "@" + this.closestCollision.t0;
      
        v3_normalize_mod(this.closestCollision.n);
      
        if (this.gravity) this.pspd[1] += gAccel * this.gravity;
                  
        if (v3_dot(this.closestCollision.n, this.delta) < 0.0) { // face to face
      
            v3_reflect_mod(this.pspd, this.closestCollision.n);       
            v3_copy(this.last_position, this.closestCollision.p0); // resset position as per firstHit
        
            var remainder = 1.0 - (Math.sqrt(this.closestCollision.t0) / this.deltaLength) ; // fraction remaining
            remainder = remainder - 0.2;
            if (remainder < 0.0) remainder = 0.0;

            var drag = 0.8;
            v3_scale_mod(this.pspd, drag); // hit speed "drag"

            v3_scale_res(this.delta, this.pspd, remainder * timer.delta * drag); // new delta
            this.deltaLength = v3_length(this.delta);
            v3_add_res(this.target.position, this.last_position, this.delta); // new position        
        
            this.target.resetMatrix();
        } 
      
        if (this.gravity) this.pspd[1] -= gAccel * this.gravity;

    } else v3_copy(this.last_position, this.closestCollision.p0); // resset position as per firstHit
}

function collisionResult_asTarget_bounce(){
    v3_normalize_mod(this.otherCollision.n); // change direction on hit
    v3_addscaled_mod(this.pspd, this.otherCollision.n, -0.15 * v3_length(this.otherCollision.s)); 

    v3_scale_mod(this.pspd, 0.8); // hit "drag"

    v3_scale_res(this.delta, this.pspd, timer.delta);            
    this.deltaLength = v3_length(this.delta);
    if (this.deltaLength < _v3_epsilon) this.deltaLength = _v3_epsilon;
    v3_add_res(this.target.position, this.last_position, this.delta); 

    this.target.resetMatrix();
}


function collisionResult_asSource_mark(){
    this.lastHitMarker = "";
    v3_normalize_mod(this.closestCollision.n);
    if (show_DEV_CD) { 
        phyTracers.addWireCross(this.closestCollision.p0, 2, _v3_green);
        phyTracers.addLineByPosNormLen(this.closestCollision.p0, this.closestCollision.n, 2, false, _v3_white);
    }
    if (this.closestCollision.source_desc == "Point") {
        this.pActive[this.closestCollision.source_cdi] = false;
    }
}

function collisionResult_asTarget_mark(){
    v3_normalize_mod(this.collisionFromOther.n);
    if (show_DEV_CD) { 
        phyTracers.addWireCross(this.collisionFromOther.p0, 2, _v3_red);
        phyTracers.addLineByPosNormLen(this.collisionFromOther.p0, this.collisionFromOther.n, 2, false, _v3_white);
    }
}



// First pass basic methods



function anim_Base_firstPass(){
    if (this.state == E3D_PLAY) {

        v3_copy(this.last_position, this.target.position);

        v3_scale_res(this.delta, this.pspd, timer.delta);  

        if (this.gravity) this.pspd[1] = this.pspd[1] - (gAccel * this.gravity);

        v3_add_mod(this.target.position, this.delta);
        this.deltaLength = v3_length(this.delta);

        this.target.resetMatrix();
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

        this.target.resetMatrix();
        this.lastHitMarker = ""; 
    }
}

function anim_Part_firstPass() {
    if (this.state == E3D_PLAY) {

        // Transform
        v3_copy(this.last_position, this.target.position);
        v3_scale_res(this.delta, this.pspd, timer.delta);  
        if (this.gravity) this.pspd[1] = this.pspd[1] - (gAccel * this.gravity);
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
            if (this.pCD) {
                this.target.CD_point--;
                this.target.CD_point_p0.splice(i, 1);
                this.target.CD_point_p.splice(i, 1);
            }
        }

        // Animate particules
        for (let i = 0; i < this.pNum; ++i) { 

            v3_copy(this.pLastPos[i], this.pPos[i]);
            v3_addscaled_mod(this.pPos[i], this.pSpd[i], timer.delta);

            // translate pellet entity elements
            for (var j = 0; j < this.target.srcNumElements; ++j ) {
                var b = this.target.getVertex3f( ( i * this.target.srcNumElements ) + j); // b is a view in float32array
                v3_addscaled_mod(b, this.pSpd[i], timer.delta);
            }

            if (this.pCD) v3_copy(this.target.CD_point_p0[i], this.pPos[i]); 
        }

        this.target.resetMatrix();
        this.lastHitMarker = ""; 
    }
}



// End pass basic functions



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



// Helper functions



function cleanupDoneAnimations(animations, scn) {
    var someremoved = false;
    for (let i = animations.length -1; i >=0; --i) if (animations[i].state == E3D_DONE) {
        scn.removeEntity(animations[i].target.id, false);
        animations.splice(i, 1);
        someremoved = true;
    }
    // Recalc indices until animations are merged with entities
    if (someremoved) for (let i = 0; i < animations.length; ++i) animations[i].target.animIndex = i;
}
