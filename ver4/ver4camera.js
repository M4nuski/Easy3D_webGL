// Easy3D_WebGL
// Scene camera class to handle controls and matrix calculations
// Emmanuel Charette 2017-2019

"use strict"

// Base class for scene view matrix generation (orthogonal projection)
class E3D_camera {

    constructor(id, width, height) {        
        this.id = id;
        this.rotation = vec3.create();
        this.position = vec3.create();
        this.matrix = mat4.create(); // viewProjection
        this.projectionMatrix = mat4.create(); 

        this.near = -1.0;
        this.far = 1.0;

        this.fov = -1;

        this.resize(width, height);
        this.updateMatrix();
    }

    // recalculate projection (base) matrix
    resize(width, height) {
        let wd2 = width /2;
        let hd2 = height /2;
        let dd2 = wd2;
        
        if (hd2 > wd2) {
            dd2 = hd2;
        }
 
        mat4.ortho(this.projectionMatrix, -wd2, wd2, hd2, -hd2, -dd2, dd2);  

        this.near = -dd2;
        this.far = dd2;
    }

    // calculate viewProjection matrix per position and rotation
    updateMatrix() {
        mat4.translate(this.matrix, this.projectionMatrix, vec3.negate(vec3_dummy, this.position) );

        mat4.rotateZ(this.matrix, this.matrix, this.rotation[2] );
        mat4.rotateX(this.matrix, this.matrix, this.rotation[0] );
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );
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
        let result = [0 ,0 ,0];
        vec3.rotateX(result, vect, vec3_origin, -this.rotation[0]); 
        vec3.rotateY(result, result, vec3_origin, -this.rotation[1]); 
        return result;
    }  

    negateCamera(vect) {
        vec3.rotateY(vect, vect, vec3_origin, this.rotation[1]); 
        return vec3.rotateX(vect, vect, vec3_origin, this.rotation[0]); 
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

    resize(width, height, fov, near, far) {
        this.fov = fov;
        this.near = near;
        this.far = far;
        mat4.perspective(this.projectionMatrix, fov, width / height, near, far);
    }

    updateMatrix() {
     //   mat4.rotateZ(this.matrix, this.projectionMatrix, this.rotation[2] ); // do not use Z
        mat4.rotateX(this.matrix, this.projectionMatrix, this.rotation[0] );
        mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );

        mat4.translate(this.matrix, this.matrix, vec3.negate(vec3_dummy , this.position) );
    }

    moveBy(tx, ty, tz, rx = 0, ry = 0, rz = 0) {
        // adjust translation to current rotation
        const t = vec3.fromValues(tx, ty, tz);
   //     vec3.rotateZ(t, t, vec3_origin, -rz); // do not use Z
        vec3.rotateX(t, t, vec3_origin, -this.rotation[0]);
        vec3.rotateY(t, t, vec3_origin, -this.rotation[1]);

        this.position[0] += t[0];
        this.position[1] += t[1];
        this.position[2] += t[2];
        
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
        this.nvx = vec3.create();
        this.nvy = vec3.create();
        this.zDist = 0; // position is now pivot point for rotation
        this.inverseRotationMatrix = mat4.create();

    }
    updateMatrix() {
        // update matrix per internal data
        if (this.zDist != undefined) {
            mat4.translate(this.matrix, this.projectionMatrix,  [0, 0, this.zDist]);

            mat4.rotateY(this.matrix, this.matrix, this.rotation[1] );
            mat4.rotateX(this.matrix, this.matrix, this.rotation[0] );

            mat4.translate(this.matrix, this.matrix, vec3.negate(vec3_dummy , this.position) );
            
            mat4.rotate(this.inverseRotationMatrix, mat4_identity, -this.rotation[0], vec3_x);
            mat4.rotate(this.inverseRotationMatrix, this.inverseRotationMatrix ,-this.rotation[1], vec3_y);
        }
    }

    moveBy(tx, ty, tz, rx = 0, ry = 0, rz = 0) { // tx and ty pan and move the pivot point, z is always away from that point
        let t = vec3.fromValues(tx, ty, 0);
        vec3.transformMat4(t, t, this.inverseRotationMatrix);
        this.zDist -= tz;
        if (this.zDist > 0) {
            this.zDist = 0;
        }

        this.position[0] += t[0];
        this.position[1] += t[1];
        this.position[2] += t[2];
        
        this.rotation[0] += rx;
        this.rotation[1] += ry;
        this.rotation[2] += rz;

        this.updateMatrix();

    }

    adjustToCamera(vect) {
        let result = vec3.create();
        vec3.transformMat4(result, vect, this.inverseRotationMatrix);
        return result;
    }  

    negateCamera(vect) {
        vec3.rotateX(vect, vect, vec3_origin, this.rotation[0]); 
        vec3.rotateY(vect, vect, vec3_origin, this.rotation[1]); 
        vect[2] += this.zDist;
    }  


}

// Perspective matrix with incremental movements in 3D space
class E3D_camera_space extends E3D_camera_persp { 
    constructor(id, width, height, fov, near, far) {
        super(id, width, height, fov, near, far);

        // local references
        this.nvx = vec3.create();
        this.nvy = vec3.create();
        this.nvz = vec3.create();

        this.rotationMatrix = mat4.create();
        this.inverseRotationMatrix = mat4.create();
        // start with identity matrix
        // translations are applied according to current matrix
        // then roration are applied incrementally from rotation matrix
        // output matrix is mix of both tx and rotation matrix
    }

    updateMatrix() {
        // update matrix per internal data
        // Set new axis reference system
        if (this.nvx) {
            vec3.transformMat4(this.nvx, vec3_x, this.inverseRotationMatrix);
            vec3.transformMat4(this.nvy, vec3_y, this.inverseRotationMatrix);
            vec3.transformMat4(this.nvz, vec3_z, this.inverseRotationMatrix);

            mat4.rotate(this.rotationMatrix, this.rotationMatrix, this.rotation[0], this.nvx);
            mat4.rotate(this.rotationMatrix, this.rotationMatrix, this.rotation[1], this.nvy);
            mat4.rotate(this.rotationMatrix, this.rotationMatrix, this.rotation[2], this.nvz);

            mat4.multiply(this.matrix, this.projectionMatrix, this.rotationMatrix);     

            mat4.translate(this.matrix, this.matrix, vec3.negate(vec3_dummy , this.position) );

            mat4.invert(this.inverseRotationMatrix, this.rotationMatrix);
        }
    }

    moveBy(tx, ty, tz, rx = 0, rz = 0, ry = 0) {
        //transform translation to local
        const t = vec3.fromValues(tx, ty, tz);
        vec3.transformMat4(t, t, this.inverseRotationMatrix);

        this.position[0] += t[0];
        this.position[1] += t[1];
        this.position[2] += t[2];

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
        let result = vec3.create();
        vec3.transformMat4(result, vect, this.inverseRotationMatrix);
        return result;
    }  

    negateCamera(vect) {
        return vec3.transformMat4(vect, vect, this.rotationMatrix);
    }  

}