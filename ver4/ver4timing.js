// Easy3D_WebGL
// Main timer class for synchronisation, smoothing and basic engine running
// Emmanuel Charette 2017-2019

"use strict"

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

        this.fps = 60;
        this.smoothfps = 60;

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

        if (this.onTick) {             
            this.onTick(); 
        }

        this.usage = 100*(Date.now() - this.lastTick)/this.tickInterval;

        if (this.delta > 0) {
            this.fps = 1.0 / this.delta;
            this.smoothfps = this.smooth(this.smoothfps, this.fps, 5);
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