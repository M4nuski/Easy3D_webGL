// Easy3D_WebGL
// Scene camera class to handle controls and matrix calculations
// Emmanuel Charette 2017-2019

"use strict"

// Base class for scene view matrix generation (orthogonal projection)
class E3D_camera {

    constructor(id, width, height) {        
        this.id = id;
        this.rotation = v3_new();
        this.position = v3_new();
        this.matrix = m4_new(); // viewProjection
        this.projectionMatrix = m4_new();

        this.near = -1.0;
        this.far = 1.0;

        this.fov = 1;

        this._neg_position = v3_new();

        this.resize(width, height);
        this.updateMatrix();
    }

    // recalculate projection (base) matrix
    resize(width, height) {

        let dd2 = (width > height) ? width / 2 : height / 2;
 
        m4_ortho_res(this.projectionMatrix, width, height, -dd2, dd2);  

        this.near = -dd2;
        this.far = dd2;
    }

    // calculate viewProjection matrix per position and rotation
    updateMatrix() {
        v3_negate_res(this._neg_position, this.position)
        m4_translate_res(this.matrix, this.projectionMatrix, this._neg_position);

        m4_rotateZ_mod(this.matrix, this.rotation[2]);
        m4_rotateX_mod(this.matrix, this.rotation[0]);
        m4_rotateY_mod(this.matrix, this.rotation[1]);
    }

    moveBy(tx, ty, tz, rx = 0, ry = 0, rz = 0) {        
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

    adjustToCamera(vect) {
        var res = v3_rotateX_new(vect, -this.rotation[0]); 
        v3_rotateY_mod(res, -this.rotation[1]); 
        return res;
    }  

    negateCamera(vect) {
        var res = v3_rotateY_new(vect, this.rotation[1]); 
        v3_rotateX_mod(res, this.rotation[0]); 
        return res;
    }  

}

//  Basic free moving perspective camera view
class E3D_camera_persp extends E3D_camera { 
    constructor(id, width, height, fov, near, far) {
        super(id, width, height);

        this.fov = fov;
        this.near = near;
        this.far = far;

        this.resize(width, height, fov, near, far);
        this.updateMatrix();
    }

    resize(width, height, fov = this.fov, near = this.near, far = this.far) {
        this.fov = fov;
        this.near = near;
        this.far = far;
        var ar = width / height;
        m4_persp_res(this.projectionMatrix, fov, ar, near, far);
    }

    updateMatrix() {
        m4_rotateX_res(this.matrix, this.projectionMatrix, this.rotation[0] );
        m4_rotateY_mod(this.matrix, this.rotation[1] );

        v3_negate_res(this._neg_position, this.position);
        m4_translate_mod(this.matrix, this._neg_position);
    }

    moveBy(tx, ty, tz, rx = 0, ry = 0, rz = 0) {
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

}

// Model view camera, perspective matrix rotating aroung a pivot point
class E3D_camera_model extends E3D_camera_persp { 
    constructor(id, width, height, fov, near, far) {
        super(id, width, height, fov, near, far);
        this.nvx = v3_new();
        this.nvy = v3_new();
        this.zDist = 0; // position is now pivot point for rotation
        this.inverseRotationMatrix = m4_new();

    }
    updateMatrix() {
        // update matrix per internal data
        if (this.zDist != undefined) {
            m4_translate_res(this.matrix, this.projectionMatrix,  [0, 0, this.zDist]);

            m4_rotateY_mod(this.matrix, this.rotation[1]);
            m4_rotateX_mod(this.matrix, this.rotation[0]);

            v3_negate_res(this._neg_position, this.position);
            m4_translate_mod(this.matrix, this._neg_position);
            
            m4_rotationX_res(this.inverseRotationMatrix, -this.rotation[0]);
            m4_rotateY_mod(this.inverseRotationMatrix , -this.rotation[1]);
        }
    }

    moveBy(tx, ty, tz, rx = 0, ry = 0, rz = 0) { // tx and ty pan and move the pivot point, z is always away from that point
        let t = v3_val_new(tx, ty, 0);
        v3_applym4_mod(t, this.inverseRotationMatrix);
        this.zDist -= tz;
        if (this.zDist > 0) {
            this.zDist = 0;
        }

        v3_add_mod(this.position, t);
        
        this.rotation[0] += rx;
        this.rotation[1] += ry;
        this.rotation[2] += rz;

        this.updateMatrix();

    }

    adjustToCamera(vect) {
        return v3_applym4_new(vect, this.inverseRotationMatrix);
    }  

    negateCamera(vect) {
        let res = v3_rotateX_new(vect, this.rotation[0]); 
        v3_rotateY_mod(res, this.rotation[1]); 
        res[2] += this.zDist;
        return res;
    }  


}

// Perspective matrix with incremental movements in 3D space
class E3D_camera_space extends E3D_camera_persp { 
    constructor(id, width, height, fov, near, far) {
        super(id, width, height, fov, near, far);

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

    moveBy(tx, ty, tz, rx = 0, rz = 0, ry = 0) {
        //transform translation to local
        const t = v3_val_new(tx, ty, tz);
        v3_applym4_mod(t, this.inverseRotationMatrix);

        v3_add_mod(this.position, t);

        this.rotation[0] = rx;
        this.rotation[1] = ry;
        this.rotation[2] = rz;

        this.updateMatrix();

        //reset rotations, incremental
        this.rotation[0] = 0;
        this.rotation[1] = 0;
        this.rotation[2] = 0;
    }

    adjustToCamera(vect) {
        return v3_applym4_new(vect, this.inverseRotationMatrix);
    }  

    negateCamera(vect) {
        return v3_applym4_new(vect, this.rotationMatrix);
    }  

}