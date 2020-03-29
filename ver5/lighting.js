// Easy3D_WebGL
// Base class for ambiant and 2 directional lights for current shader model
// Emmanuel Charette 2017-2019

"use strict"

// TODO merge with shader / scene as it is dependant
class E3D_lighting {
    constructor(vAmbiant = v3_val_new(0.1, 0.1, 0.1)) {
        this.ambiant_color = vAmbiant;

        this.light0_color = v3_new();
        this.light0_direction = v3_new();
        this.light0_adjusted = v3_new();
        this.light0_lockToCamera = false;

        this.light1_color = v3_new();
        this.light1_direction = v3_new();
        this.light1_adjusted = v3_new();
        this.light1_lockToCamera = false;
    }

    setColorA(c){
        this.ambiant_color = c;
    }
    setColor0(c){
        this.light0_color = c;
    }
    setDirection0(d) {
        v3_normalize_res(this.light0_direction, d);
        v3_copy(this.light0_adjusted, this.light0_direction);
    }
    setColor1(c) {
        this.light1_color = c;
    }
    setDirection1(d) {
        v3_normalize_res(this.light1_direction, d);
        v3_copy(this.light1_adjusted, this.light1_direction);
    }

}
