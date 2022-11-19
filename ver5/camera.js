// Easy3D_WebGL
// Scene camera class to handle controls and matrix calculations
// Polyfill and handler classes for fullscreen
// Emmanuel Charette 2017-2020

"use strict"




// Base class for scene view matrix generation (orthogonal projection)
class E3D_camera {

    constructor(id) {        
        this.id = id;

        this.rotation = v3_new();
        this.position = v3_new();
        this.matrix = m4_new(); // viewProjection
        this.projectionMatrix = m4_new();

        this._neg_position = v3_new();

        this.resize();
        this.updateMatrix();
    }

    // recalculate projection (base) matrix
    resize() {
        let dd2 = (E3D_WIDTH > E3D_HEIGHT) ? E3D_WIDTH / 2.0 : E3D_HEIGHT / 2.0;
        //E3D_NEAR = -dd2;
        //E3D_FAR = dd2;
 
        m4_ortho_res(this.projectionMatrix, E3D_WIDTH / E3D_ZOOM, E3D_HEIGHT / E3D_ZOOM, -dd2, dd2);  

    }

    // calculate viewProjection matrix per position and rotation
    updateMatrix() {
        v3_negate_res(this._neg_position, this.position)
        m4_translate_res(this.matrix, this.projectionMatrix, this._neg_position);

        m4_rotateZ_mod(this.matrix, this.rotation[2]);
        m4_rotateX_mod(this.matrix, this.rotation[0]);
        m4_rotateY_mod(this.matrix, this.rotation[1]);
    }

    moveBy(tx, ty, tz, rx = 0.0, ry = 0.0, rz = 0.0) {        
        this.position[0] += tx;
        this.position[1] += ty;
        this.position[2] += tz;
        
        this.rotation[0] += rx;
        this.rotation[1] += ry;
        this.rotation[2] += rz;

        this.updateMatrix();
    }

    moveTo(px, py, pz, rx = this.rotation[0], ry = this.rotation[1], rz = this.rotation[2]) {
        this.position[0] = px;
        this.position[1] = py;
        this.position[2] = pz;
        
        this.rotation[0] = rx;
        this.rotation[1] = ry;
        this.rotation[2] = rz;

        this.updateMatrix();
    }

    getProjectionViewMatrix() {
        return this.matrix;
    }

    rotateToCameraView_new(vect) {
        var res = v3_rotateX_new(vect, -this.rotation[0]); 
        v3_rotateY_mod(res, -this.rotation[1]); 
        return res;
    }  
    rotateToCameraView_res(res, vect) {
        v3_rotateX_res(res, vect, -this.rotation[0]); 
        v3_rotateY_mod(res, -this.rotation[1]); 
    }   
    rotateToCameraView_mod(vect) {
        v3_rotateX_mod(vect, -this.rotation[0]); 
        v3_rotateY_mod(vect, -this.rotation[1]); 
    }  

    inCameraSpace_new(vect) {
        var res = v3_sub_res(res, vect, this.position);
        v3_rotateY_mod(res, this.rotation[1]); 
        v3_rotateX_mod(res, this.rotation[0]);
        return res;
    }  
    inCameraSpace_res(res, vect) {
        v3_sub_res(res, vect, this.position);
        v3_rotateY_mod(res, this.rotation[1]); 
        v3_rotateX_mod(res, this.rotation[0]);
    } 
    inCameraSpace_mod(vect) {
        v3_sub_mod(vect, this.position);
        v3_rotateY_mod(vect, this.rotation[1]); 
        v3_rotateX_mod(vect, this.rotation[0]);
    }

    getScreenCoordinates(vect) {
        var r = [0.0, 0.0, 0.0, 1.0];
        r[0] = (this.matrix[0] * vect[0] + this.matrix[4] * vect[1] + this.matrix[8]  * vect[2] + this.matrix[12]); 
        r[1] = (this.matrix[1] * vect[0] + this.matrix[5] * vect[1] + this.matrix[9]  * vect[2] + this.matrix[13]);
        r[2] = (this.matrix[2] * vect[0] + this.matrix[6] * vect[1] + this.matrix[10] * vect[2] + this.matrix[14]);
        r[3] = (this.matrix[3] * vect[0] + this.matrix[7] * vect[1] + this.matrix[11] * vect[2] + this.matrix[15]);

        var res = { visible: false, x: 0.0, y: 0.0, z: 0.0 };
        if (r[2] <= 0.0) return res;

        r[0] /= r[3];
        if (r[0] <= -1.0) res.x = 0.0; else 
        if (r[0] >=  1.0) res.x = E3D_WIDTH; else {
            res.x = (r[0] * 0.5) + 0.5;
            res.x *= E3D_WIDTH;
        }
        r[1] /= r[3];
        if (r[1] <= -1.0) res.y = E3D_HEIGHT; else 
        if (r[1] >=  1.0) res.y = 0.0; else {
            res.y = (-r[1] * 0.5) + 0.5;
            res.y *= E3D_HEIGHT;
        }
        res.z = r[2] * (E3D_FAR - E3D_NEAR) / (E3D_FAR + E3D_NEAR) + (2.0 * E3D_NEAR);
        res.visible = (res.z <= E3D_FAR);
        return res;
    }

    getworldCoordinates(x, y, distFromViewport = 0.0) {
        // clamp to front of viewport
        if (distFromViewport < 0.0) distFromViewport = 0.0;

        let f = E3D_AR * Math.tan(E3D_FOV / 2.0);
        // slopes for projection
        // TODO replace by zoom in orthogonal projection
        let fx = (distFromViewport + E3D_NEAR) / E3D_NEAR;
        let fy = (E3D_AR >= 1.0) ? fx / E3D_AR : fx * E3D_AR;
        
        // x and y are on viewport, between -1.0 and 1.0
        x = ((x / E3D_WIDTH) - 0.5) * 2.0 * f;
        y = ((y / E3D_HEIGHT) - 0.5) * -2.0 * f;

        let p = [x * fx, y * fy, -distFromViewport];

        this.rotateToCameraView_mod(p);
        v3_add_mod(p, this.position);

        return p;
    }



}

//  Basic free moving perspective camera view
class E3D_camera_persp extends E3D_camera { 
    constructor(id) {
        super(id);

        this.resize();
        this.updateMatrix();
    }

    resize() {
        m4_persp_res(this.projectionMatrix, E3D_FOV, E3D_AR, E3D_NEAR, E3D_FAR);
    }

    updateMatrix() {
        m4_rotateX_res(this.matrix, this.projectionMatrix, this.rotation[0]);
        m4_rotateY_mod(this.matrix, this.rotation[1]);

        v3_negate_res(this._neg_position, this.position);
        m4_translate_mod(this.matrix, this._neg_position);
    }

    moveBy(tx, ty, tz, rx = 0.0, ry = 0.0, rz = 0.0) {
        // adjust translation to current rotation
        const t = v3_val_new(tx, ty, tz);
        v3_rotateX_mod(t, -this.rotation[0]);
        v3_rotateY_mod(t, -this.rotation[1]);

        v3_add_mod(this.position, t);
        
        this.rotation[0] += rx;
        this.rotation[1] += ry;
        this.rotation[2] += rz;

        this.updateMatrix();
    }

    getworldCoordinates(x, y, distFromViewport = 0.0) {
        // clamp to front of viewport
        if (distFromViewport < 0.0) distFromViewport = 0.0;

        // AR and FOV correction factor
        let f = E3D_AR * Math.tan(E3D_FOV / 2.0);

        // projection factors
        let fx = (distFromViewport + E3D_NEAR) / E3D_NEAR;
        let fy = (E3D_AR >= 1.0) ? fx / E3D_AR : fx * E3D_AR;
        
        // x and y are on viewport, between -1.0 and 1.0
        x = ((x / E3D_WIDTH) - 0.5) * 2.0;
        y = ((y / E3D_HEIGHT) - 0.5) * -2.0;

        let p = [x * fx * f, y * fy * f, -distFromViewport];

        this.rotateToCameraView_mod(p);
        v3_add_mod(p, this.position);

        return p;
    }
}

// Model view camera, perspective matrix rotating aroung a pivot point
class E3D_camera_model extends E3D_camera_persp { 
    constructor(id) {
        super(id);
        this.nvx = v3_new();
        this.nvy = v3_new();
        this.zDist = 0.0; // position is now pivot point for rotation
        this.inverseRotationMatrix = m4_new();

    }
    updateMatrix() {
        // update matrix per internal data
        if (this.zDist != undefined) {
            m4_translate_res(this.matrix, this.projectionMatrix,  [0.0, 0.0, this.zDist]);

            m4_rotateX_mod(this.matrix, this.rotation[0]);
            m4_rotateY_mod(this.matrix, this.rotation[1]);

            v3_negate_res(this._neg_position, this.position);
            m4_translate_mod(this.matrix, this._neg_position);
            
            m4_rotationY_res(this.inverseRotationMatrix , -this.rotation[1]);
            m4_rotateX_mod(this.inverseRotationMatrix, -this.rotation[0]);
        }
    }

    moveBy(tx, ty, tz, rx = 0.0, ry = 0.0, rz = 0.0) { // tx and ty pan and move the pivot point, z is always away from that point
        let t = v3_val_new(tx, ty, 0.0);
        v3_applym4_mod(t, this.inverseRotationMatrix);
        this.zDist -= tz;
        if (this.zDist > 0.0) {
            this.zDist = 0.0;
        }

        v3_add_mod(this.position, t);
        
        this.rotation[0] += rx;
        this.rotation[1] += ry;
        this.rotation[2] += rz;

        this.updateMatrix();

    }

    rotateToCameraView_new(vect) {
        return v3_applym4_new(vect, this.inverseRotationMatrix);
    }  
    rotateToCameraView_res(res, vect) {
        v3_applym4_res(res, vect, this.inverseRotationMatrix);
    }  
    rotateToCameraView_mod(vect) {
        v3_applym4_mod(vect, this.inverseRotationMatrix);
    }  

    inCameraSpace_new(vect) {
        let res = v3_rotateX_new(vect, this.rotation[0]); 
        v3_rotateY_mod(res, this.rotation[1]); 
        res[2] += this.zDist;
        return res;
    }  
    inCameraSpace_res(res, vect) {
        v3_rotateX_res(res, vect, this.rotation[0]); 
        v3_rotateY_mod(res, this.rotation[1]); 
        res[2] += this.zDist;
    } 
    inCameraSpace_mod(vect) {
        v3_rotateX_mod(vect, this.rotation[0]); 
        v3_rotateY_mod(vect, this.rotation[1]); 
        vect[2] += this.zDist;
    } 


}

// Perspective matrix with incremental movements in 3D space
class E3D_camera_space extends E3D_camera_persp { 
    constructor(id) {
        super(id);

        // local references
        this.nvx = v3_new();
        this.nvy = v3_new();
        this.nvz = v3_new();

        this.rotationMatrix = m4_new();
        this.inverseRotationMatrix = m4_new();
        // start with identity matrix
        // translations are applied according to current matrix
        // then roration are applied incrementally from rotation matrix
        // output matrix is mix of both tx and rotation matrix
    }

    updateMatrix() {
        // update matrix per internal data
        // Set new axis reference system
        if (this.nvx) {
            v3_applym4_res(this.nvx, _v3_x, this.inverseRotationMatrix);
            v3_applym4_res(this.nvy, _v3_y, this.inverseRotationMatrix);
            v3_applym4_res(this.nvz, _v3_z, this.inverseRotationMatrix);

            m4_rotate_mod(this.rotationMatrix, this.rotation[0], this.nvx);
            m4_rotate_mod(this.rotationMatrix, this.rotation[1], this.nvy);
            m4_rotate_mod(this.rotationMatrix, this.rotation[2], this.nvz);

            m4_multiply_res(this.matrix, this.projectionMatrix, this.rotationMatrix);     

            v3_negate_res(this._neg_position, this.position);
            m4_translate_mod(this.matrix, this._neg_position);

            m4_invert_res(this.inverseRotationMatrix, this.rotationMatrix);
        }
    }

    moveBy(tx, ty, tz, rx = 0.0, rz = 0.0, ry = 0.0) { // TODO verify rz vs ry
        //transform translation to local
        const t = v3_val_new(tx, ty, tz);
        v3_applym4_mod(t, this.inverseRotationMatrix);

        v3_add_mod(this.position, t);

        this.rotation[0] = rx;
        this.rotation[1] = ry;
        this.rotation[2] = rz;

        this.updateMatrix();

        //reset rotations, incremental
        this.rotation[0] = 0.0;
        this.rotation[1] = 0.0;
        this.rotation[2] = 0.0;
    }

    rotateToCameraView_new(vect) {
        return v3_applym4_new(vect, this.inverseRotationMatrix);
    }  
    rotateToCameraView_res(res, vect) {
        v3_applym4_res(res, vect, this.inverseRotationMatrix);
    }  
    rotateToCameraView_mod(vect) {
        v3_applym4_mod(vect, this.inverseRotationMatrix);
    }  


    inCameraSpace_new(vect) {
        return v3_applym4_new(vect, this.rotationMatrix);
    }  
    inCameraSpace_res(res, vect) {
        v3_applym4_res(res, vect, this.rotationMatrix);
    }  
    inCameraSpace_mod(vect) {
        v3_applym4_mod(vect, this.rotationMatrix);
    } 

}






document.exitFullscreen = document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;

document.addEventListener("webkitfullscreenchange", _fullscreenChange);
document.addEventListener("mozfullscreenchange", _fullscreenChange);
document.addEventListener("MSFullscreenChange", _fullscreenChange);

var fullscreenChangeCallback;
var fullscreenlastelement;

function fullscreenActive() {
    document.fullscreenElement = document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    return !(!document.fullscreenElement);  
}

function _fullscreenChange() {
    if (E3D_DEBUG_LOG_INPUT_MODE) log("FullScreen Changed.");
    if (fullscreenChangeCallback) fullscreenChangeCallback(fullscreenActive(), fullscreenlastelement);  
}

function fullscreenToggle(elem) {
    fullscreenlastelement = elem;    
    elem.requestFullscreen = elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;

    if (fullscreenActive()) {
        document.exitFullscreen();        
    } else {
        elem.requestFullscreen();
    }
}

function fullscreenEnable(elem) {
    fullscreenlastelement = elem;
    elem.requestFullscreen = elem.webkitRequestFullScreen || elem.mozRequestFullScreen || elem.msRequestFullscreen;
    if (E3D_DEBUG_LOG_INPUT_MODE) log("Requesting FullScreen.");
    if (!fullscreenActive())  elem.requestFullscreen();
}

function fullscreenDisable() {
    fullscreenlastelement = undefined;
    if (E3D_DEBUG_LOG_INPUT_MODE) log("Exiting FullScreen.");
    document.exitFullscreen();
}
