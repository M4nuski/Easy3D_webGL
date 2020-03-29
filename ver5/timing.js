// Easy3D_WebGL
// Main timer class for synchronisation, smoothing and basic engine running
// Emmanuel Charette 2017-2020

"use strict"

// TODO merge with core

class E3D_timing {

    constructor(run, interval, onTick) {

        this.onTick = onTick;

        this.delta = interval / 1000;
        this.tickInterval = interval;

        this.timer; 

        this.start = Date.now();
        this.lastTick = this.start;
        this.active = run;

        this.usage = 0;
        this.usageSmoothed = 0;
        this.fps = 60;
        this.fpsSmoothed = 60;

        this.g = E3D_G;

        this.smoothFactor = 2.5;

        if (run) {
            this.timer = setInterval( () => {this.tickEvent() }, interval);
        }
    }

    smooth(val, target, fact) { 
        let f = this.delta * fact;
        if (f > 1.0) f = 1.0;
        return val + ((target-val) * f);
    }

    run() {
        this.lastTick = Date.now();
        this.timer = setInterval( () => {this.tickEvent() }, this.tickInterval);
        this.active = true;
    }

    pause() {
        clearInterval(this.timer);
        this.active = false;
    }

    tickEvent(){
        const ts = Date.now(); 

        this.delta = (ts - this.lastTick) / 1000;
        this.lastTick = ts;

        this.g = this.delta * E3D_G;

        if (this.onTick) {             
            this.onTick(); 
        }

        this.usage = 100 * (Date.now() - this.lastTick) / this.tickInterval;
        this.usageSmoothed = this.smooth(this.usageSmoothed, this.usage, this.smoothFactor);

        if (this.delta > 0) {
            this.fps = 1.0 / this.delta;
            this.fpsSmoothed = this.smooth(this.fpsSmoothed, this.fps, this.smoothFactor);
        }
    }

    setInterval(interval) {
        this.pause();
        this.tickInterval = interval;
        if (this.active) {
            this.run();
        }
    }


}