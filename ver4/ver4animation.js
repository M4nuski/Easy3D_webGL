// Easy3D_WebGL
// State container for animations
// Emmanuel Charette 2017-2019

"use strict"

class E3D_animation { 
    constructor(id, animatorFunct, targetObject, sceneContext, timerclass) { // id ??
        this.id = id;
        this.anim = animatorFunct; // function delegate that perform the animation
        this.target = targetObject;
        this.scn = sceneContext;
        this.timer = timerclass;

        this.state = E3D_RESET;
        this.data = {}; // to store data through the animation

        this.delta2 = -1; // square of movement during animation step for culling, -1 anim target is not a source
        
    }

    animate(CD_Candidate_list) {
        if (this.anim) {
            this.anim(CD_Candidate_list);
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
    restart() {
        this.state = E3D_RESTART;  
    }
    done() {
        this.state = E3D_DONE;  
    }
}
