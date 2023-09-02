// Easy3D_WebGL
// Scene camera class to handle controls and matrix calculations
// Polyfill and handler classes for fullscreen
// Emmanuel Charette 2017-2022

"use strict"




// Base class for scene view matrix generation (orthogonal projection)
class E3D_camera {

    constructor(id) {
        this.id = id;

        this.rotation = v3_new();
        this.position = v3_new();
        this.matrix = m4_new(); // viewProjection
        this.projectionMatrix = m4_new();
        this.zRatio = 0.0;
        this._neg_position = v3_new();

        this.resize();
        this.updateMatrix();
    }

    // recalculate projection (base) matrix
    resize() {
        //let dd2 = (E3D_WIDTH > E3D_HEIGHT) ? E3D_WIDTH / 2.0 : E3D_HEIGHT / 2.0;
        //E3D_NEAR = -dd2;
        //E3D_FAR = dd2;

        m4_ortho_res(this.projectionMatrix, E3D_WIDTH / E3D_ZOOM, E3D_HEIGHT / E3D_ZOOM, E3D_NEAR, E3D_FAR);
        this.zRatio = (E3D_FAR - E3D_NEAR) / (E3D_FAR + E3D_NEAR) + (2.0 * E3D_NEAR);
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

    rotateToCameraView_new(vect) {
        var res = v3_rotateZ_new(vect, -this.rotation[2]);
        v3_rotateX_mod(res, -this.rotation[0]);
        v3_rotateY_mod(res, -this.rotation[1]);
        return res;
    }
    rotateToCameraView_res(res, vect) {
        v3_rotateZ_res(res, vect, -this.rotation[2]);
        v3_rotateX_mod(res, -this.rotation[0]);
        v3_rotateY_mod(res, -this.rotation[1]);
    }
    rotateToCameraView_mod(vect) {
        v3_rotateZ_mod(vect, -this.rotation[2]);
        v3_rotateX_mod(vect, -this.rotation[0]);
        v3_rotateY_mod(vect, -this.rotation[1]);
    }

    isEntityVisible(index) {
        if (E3D_culling == E3D_cullingMode.NONE) return true;
        if (!ENTITIES[index].isVisibiltyCullable) return true;
        if (E3D_culling == E3D_cullingMode.ZDIST) return this.inRange(ENTITIES[index].position, ENTITIES[index].visibilityDistance);
        if (E3D_culling == E3D_cullingMode.FUSTRUM) return this.inFustrum(ENTITIES[index].position, ENTITIES[index].visibilityDistance);
        return true;
    }

    inRange(point, radius) {
        var offset = v3_rotateY_new(point, this.rotation[1]);
        v3_rotateX_mod(offset, this.rotation[0]);
        v3_rotateZ_mod(offset, this.rotation[2]);
        v3_sub_mod(offset, this.position);
        return ( ((offset[2] - radius) < E3D_FAR) && ((offset[2] + radius) > E3D_NEAR) );
    }
    inFustrum(point, radius) {
        var offset = v3_rotateY_new(point, this.rotation[1]);
        v3_rotateX_mod(offset, this.rotation[0]);
        v3_rotateZ_mod(offset, this.rotation[2]);
        v3_sub_mod(offset, this.position);
        if ( ((offset[2] - radius) > E3D_FAR) || ((offset[2] + radius) < E3D_NEAR) ) return false;
        let w = E3D_WIDTH / E3D_ZOOM / 2.0;
        if ( ((offset[0] + radius) < -w) || ((offset[0] - radius) > w) ) return false;
        let h = E3D_HEIGHT / E3D_ZOOM / 2.0;
        if ( ((offset[1] + radius) < -h) || ((offset[1] - radius) > h) ) return false;
        return true;
    }

    getScreenCoordinates(vect) {
        var v = v3_applym4_new(vect, this.matrix);

        var res = {  x: ( v[0] * E3D_WIDTH  * 0.5) + (E3D_WIDTH  * 0.5),
                     y: (-v[1] * E3D_HEIGHT * 0.5) + (E3D_HEIGHT * 0.5),
                     zVisible: v[2] < 1.0 };
        return res;
/*
        var r = [vect[0], vect[1], vect[2], 1.0];
        v4_applym4_mod(r, this.matrix);

        var res = { visible: false, x: 0.0, y: 0.0, z: 0.0 };
        if ((r[2] < -1.0) || (r[2] > 1.0)) return res;

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
        res.z = r[2] * this.zRatio;
        res.visible = (res.z <= E3D_FAR);
        return res;
*/
    }

    getWorldCoordinates(x, y, distFromViewport = 0.0) {
        // clamp to front of viewport
        if (distFromViewport < 0.0) distFromViewport = 0.0;

        // x and y are on viewport, between -1.0 and 1.0
        x = ((x / E3D_WIDTH) - 0.5);
        y = -((y / E3D_HEIGHT) - 0.5);

        let p = [x * E3D_WIDTH / E3D_ZOOM, y * E3D_HEIGHT / E3D_ZOOM, -distFromViewport + E3D_FAR];

        v3_add_mod(p, this.position);
        this.rotateToCameraView_mod(p);

        return p;
    }



}

//  Basic free moving perspective camera view
class E3D_camera_persp extends E3D_camera {
    constructor(id) {
        super(id);

        this.fustrumMatrix = m4_new(); // TODO standardize secondary matrices

        this.resize();
        this.updateMatrix();
    }

    resize() {
        m4_persp_res(this.projectionMatrix, E3D_FOV, E3D_AR, E3D_NEAR, E3D_FAR);
        this.zRatio = -(E3D_FAR - E3D_NEAR) / (E3D_FAR + E3D_NEAR) + (2.0 * E3D_NEAR);
    }

    updateMatrix() {
        v3_negate_res(this._neg_position, this.position);

        if (this.fustrumMatrix) { // TODO better switch condition
            m4_rotationX_res(this.fustrumMatrix, this.rotation[0]);
            m4_rotateY_mod(this.fustrumMatrix, this.rotation[1]);
            m4_translate_mod(this.fustrumMatrix, this._neg_position);
            m4_multiply_res(this.matrix, this.projectionMatrix, this.fustrumMatrix);
        } else {
            m4_rotateX_res(this.matrix, this.projectionMatrix, this.rotation[0]);
            m4_rotateY_mod(this.matrix, this.rotation[1]);
            m4_translate_mod(this.matrix, this._neg_position);
        }
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

    getScreenCoordinates(vect) {

        var v = v3_applym4_new(vect, this.matrix);

        var res = {  x: ( v[0] * E3D_WIDTH  * 0.5) + (E3D_WIDTH  * 0.5),
                     y: (-v[1] * E3D_HEIGHT * 0.5) + (E3D_HEIGHT * 0.5),
                     zVisible: v[2] < 1.0 };
        return res;
/*
        var r = [vect[0], vect[1], vect[2], 1.0];
        v4_applym4_mod(r, this.matrix);

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
        res.z = r[2] * this.zRatio;
        res.visible = (res.z <= E3D_FAR);
        return res;
*/
    }

    getWorldCoordinates(x, y, distFromViewport = 0.0) {
        // clamp to front of viewport
        if (distFromViewport < 0.0) distFromViewport = 0.0;

        // AR and FOV correction factor
        let f = Math.tan(E3D_FOV / 2.0);

        // projection factors
        let fx = distFromViewport * this.zRatio;
        let fy = fx;
        if (E3D_AR >= 1.0) {
            fx = fx * E3D_AR;
        } else {
            fy = fx / E3D_AR;
        }

        // x and y are on viewport, between -1.0 and 1.0
        x = ((x / E3D_WIDTH) - 0.5) * 2.0;
        y = ((y / E3D_HEIGHT) - 0.5) * -2.0;

        let p = [x * fx * f, y * fy * f, -distFromViewport];

        this.rotateToCameraView_mod(p);
        v3_add_mod(p, this.position);

        return p;
    }

    inRange(point, radius) {
        var offset = v3_applym4_new(point, this.fustrumMatrix);
        return ( ((-offset[2] - radius) < E3D_FAR) && ((-offset[2] + radius) > E3D_NEAR) );
    }
    inFustrum(point, radius) {
        var offset = v3_applym4_new(point, this.fustrumMatrix);

        if ( ((-offset[2] - radius) > E3D_FAR) || ((-offset[2] + radius) < E3D_NEAR) ) return false;

        let f = Math.tan(E3D_FOV / 2.0);

        let fx = -offset[2] * this.zRatio;
        let fy = fx;
        if (E3D_AR >= 1.0) {
            fx = fx * E3D_AR * f;
            fy = fy * f;
        } else {
            fy = fx / E3D_AR * f;
            fx = fx * f;
        }
        if ( ((offset[0] + radius) < -fx) || ((offset[0] - radius) > fx)) return false;
        if ( ((offset[1] + radius) < -fy) || ((offset[1] - radius) > fy)) return false;
        return true;
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

    inRange(point, radius) {
        var offset = v3_sub_new(point, this.position);
        v3_rotateY_mod(offset, this.rotation[1]);
        v3_rotateX_mod(offset, this.rotation[0]);
        offset[2] += this.zDist;

        return ( ((-offset[2] - radius) < E3D_FAR) && ((-offset[2] + radius) > E3D_NEAR) );
    }

    inFustrum(point, radius) {
        var offset = v3_sub_new(point, this.position);
        v3_rotateY_mod(offset, this.rotation[1]);
        v3_rotateX_mod(offset, this.rotation[0]);
        offset[2] += this.zDist;

        if ( ((-offset[2] - radius) > E3D_FAR) || ((-offset[2] + radius) < E3D_NEAR) ) return false;

        let f = Math.tan(E3D_FOV / 2.0);

        let fx = -offset[2] * this.zRatio;
        let fy = fx;
        if (E3D_AR >= 1.0) {
            fx = fx * E3D_AR * f;
            fy = fy * f;
        } else {
            fy = fx / E3D_AR * f;
            fx = fx * f;
        }
        if ( ((offset[0] + radius) < -fx) || ((offset[0] - radius) > fx)) return false;
        if ( ((offset[1] + radius) < -fy) || ((offset[1] - radius) > fy)) return false;
        return true;
    }

    getWorldCoordinates(x, y, distFromViewport = 0.0) {
        // clamp to front of viewport
        if (distFromViewport < 0.0) distFromViewport = 0.0;

        // AR and FOV correction factor
        let f = Math.tan(E3D_FOV / 2.0);

        let fx = distFromViewport * this.zRatio;
        let fy = fx;
        if (E3D_AR >= 1.0) {
            fx = fx * E3D_AR;
        } else {
            fy = fx / E3D_AR;
        }

        // x and y are on viewport, between -1.0 and 1.0
        x = ((x / E3D_WIDTH) - 0.5) * 2.0;
        y = ((y / E3D_HEIGHT) - 0.5) * -2.0;

        let p = [x * fx * f, y * fy * f, -distFromViewport - this.zDist];

        this.rotateToCameraView_mod(p);
        v3_add_mod(p, this.position);

        return p;
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

    moveBy(tx, ty, tz, rx = 0.0, rz = 0.0, ry = 0.0) { // rz and ry are swapped as roll is assigned to "left/right"
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

    inRange(point, radius) {
        var offset = v3_sub_new(point, this.position);
        v3_applym4_mod(offset, this.rotationMatrix);
        return ( ((-offset[2] - radius) < E3D_FAR) && ((-offset[2] + radius) > E3D_NEAR) );
    }
    inFustrum(point, radius) {
        var offset = v3_sub_new(point, this.position);
        v3_applym4_mod(offset, this.rotationMatrix);
        if ( ((-offset[2] - radius) > E3D_FAR) || ((-offset[2] + radius) < E3D_NEAR) ) return false;

        let f = Math.tan(E3D_FOV / 2.0);

        let fx = -offset[2] * this.zRatio;
        let fy = fx;
        if (E3D_AR >= 1.0) {
            fx = fx * E3D_AR * f;
            fy = fy * f;
        } else {
            fy = fx / E3D_AR * f;
            fx = fx * f;
        }
        if ( ((offset[0] + radius) < -fx) || ((offset[0] - radius) > fx)) return false;
        if ( ((offset[1] + radius) < -fy) || ((offset[1] - radius) > fy)) return false;
        return true;
    }
}



// Full screen handlers


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
