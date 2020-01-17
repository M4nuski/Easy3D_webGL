// Easy3D_WebGL
// Base class for ambiant and 2 directional lights for current shader model
// Emmanuel Charette 2017-2019

"use strict"

class E3D_lighting {
    constructor(vAmbiant = vec3.fromValues(0.1, 0.1, 0.1)) {
        this.ambiant_color = vAmbiant;

        this.light0_color = vec3.fromValues(1.0, 1.0, 1.0);
        this.light0_direction = vec3.create();
        this.light0_adjusted = vec3.create();
        this.light0_lockToCamera = false;

        this.light1_color = vec3.fromValues(0.0, 0.0, 0.0);
        this.light1_direction = vec3.create(); 
        this.light1_adjusted = vec3.create();
        this.light1_lockToCamera = false;
    }

    setColorA(c){
        this.ambiant_color = c;
    }
    setColor0(c){
        this.light0_color = c;
    }
    setDirection0(d) {
        vec3.normalize(this.light0_direction, d);
        vec3.copy(this.light0_adjusted, this.light0_direction);
    }
    setColor1(c) {
        this.light1_color = c;
    }
    setDirection1(d) {
        vec3.normalize(this.light1_direction, d);
        vec3.copy(this.light1_adjusted, this.light1_direction);
    }

}
