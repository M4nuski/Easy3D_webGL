// Easy3D_WebGL
// Main timer class for synchronisation, smoothing and basic engine running
// Emmanuel Charette 2017-2020

"use strict"



class E3D_timing {

    constructor(onTick, run = false, interval = 2) {

        this.onTick = onTick;

        this.delta = 1.0 / 30.0;
        if (interval < 1) interval = 1;
        this.interval = interval;
        this.frame = 0;
        this.elapsed = 0;

        this.start = performance.now();
        this.lastTick = this.start;
        this.active = run;

        this.usage = 0; // % of time spent in the game loop vs available time between frames
        this.usageSmoothed = 0;
        this.fps = 60;
        this.fpsSmoothed = 60;

        this.g = E3D_G;
        this.smoothFactor = 0.5;

        if (run) window.requestAnimationFrame( (t) => this.tickEvent(t) );
    }

    smooth(val, target, fact) { 
        let f = this.delta * fact;
        if (f > 1.0) f = 1.0;
        return val + ((target - val) * f);
    }

    run() {
        this.active = true;
        this.lastTick = performance.now();
        window.requestAnimationFrame( (t) => this.tickEvent(t) );
    }

    pause() {
        this.active = false;
    }

    tickEvent(time){
        this.elapsed = (time - this.start) * 0.001;
        if (this.active) {
            this.frame++;
            if (this.frame % this.interval == 0) {

                this.delta = (time - this.lastTick) * 0.001;
                this.lastTick = time;

                this.g = this.delta * E3D_G; // current frame G accelleration

                if (this.onTick) this.onTick(); 

                this.usage = 0.01 * (performance.now() - time) / this.delta;
                
                this.usageSmoothed = this.smooth(this.usageSmoothed, this.usage, this.smoothFactor);

                if (this.delta > 0) {
                    this.fps = 1.0 / this.delta;
                    this.fpsSmoothed = this.smooth(this.fpsSmoothed, this.fps, this.smoothFactor);
                }
            }
            window.requestAnimationFrame( (t) => this.tickEvent(t) );
        }
    }

    setInterval(interval) {
        if (!isNaN(Number(interval))) {
            if (interval < 1) interval = 1;
            this.interval = interval;
        } else if (E3D_DEBUG_VERBOSE) log("attemp to set timing interval with something else than a number");
    }


}