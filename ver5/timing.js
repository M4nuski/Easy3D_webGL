// Easy3D_WebGL
// Main timer class for synchronisation, smoothing and basic engine running
// Emmanuel Charette 2017-2020

"use strict"



class E3D_timing {

    constructor(onTick, run = false, fpsCap = 144, onSlowTick = null, slowTickInterval = 0.1) {

        this.onTick = onTick;

        if (fpsCap < 1) fpsCap = 1;
        this.fpsCap = fpsCap;
        this.minInterval = 1000.0 / fpsCap;

        this.delta = 1.0 / fpsCap; // time between frames
        this.innerDelta = 0.0; // time in game loop frame

        this.frame = 0;
        this.time = 0.0;

        this.start = performance.now();
        this.lastTick = this.start;
        this.active = run;

        this.usage = 0.0; // % of time spent in the game loop vs available time between frames
        this.usageSmoothed = 0.0;
        this.fps = 60.0;
        this.fpsSmoothed = 60.0;

        this.g = E3D_G;
        this.smoothFactor = 0.1;

        this.onSlowTick = onSlowTick;
        this.slowTickInterval = slowTickInterval;
        this.lastSlowTick = 0.0;

        if (run) window.requestAnimationFrame( (t) => this.tickEvent(t) );
    }

    smooth(val, target, fact, compensate = true) {
        if (compensate) fact = -(Math.pow(1.0 - fact, (this.delta / 0.1)) - 1.0);
        if (fact > 1.0) fact = 1.0;
        return val + ((target - val) * fact);
    }
    compensateSmoothingFactor(fact) {
        let f = -(Math.pow(1.0 - fact, (this.delta / 0.1)) - 1.0);
        if (f > 1.0) f = 1.0;
        return f;
    }

    run() {
        this.active = true;
        this.lastTick = performance.now();
        window.requestAnimationFrame( (t) => this.tickEvent(t) );
    }

    pause() {
        this.active = false;
    }

    tickEvent(frameTime){
        if (this.active) {
            this.time = (frameTime - this.start) * 0.001;

            if (frameTime - this.lastTick >= this.minInterval) {
                this.frame++;
                this.delta = (frameTime - this.lastTick) * 0.001;
                this.lastTick = frameTime;

                this.g = this.delta * E3D_G; // current frame G accelleration

                if (this.onTick) this.onTick();

                if (this.delta > 0.0) {
                    this.fps = 1.0 / (this.delta - 0.00001);
                    this.fpsSmoothed = this.smooth(this.fpsSmoothed, this.fps, this.smoothFactor);
                }

                if (((frameTime - this.lastSlowTick) * 0.001 >= this.slowTickInterval) && (this.onSlowTick)) {
                    this.onSlowTick();
                    this.lastSlowTick = frameTime;
                }

                this.innerDelta = (performance.now() - frameTime) * 0.001;
                this.usage = 100.0 * this.innerDelta / this.delta;
                this.usageSmoothed = this.smooth(this.usageSmoothed, this.usage, this.smoothFactor);
                if (E3D_DEBUG_RENDER_TIME) {
                    E3D_DEBUG_RENDER_USAGE = this.smooth(E3D_DEBUG_RENDER_USAGE, 100.0 * (E3D_DEBUG_RENDER_ACCUM * 0.001) / this.delta, this.smoothFactor);
                    E3D_DEBUG_RENDER_ACCUM = 0.0;
                }
            }

            window.requestAnimationFrame( (t) => this.tickEvent(t) );
        }
    }

    setFpsCap(fpsCap) {
        if (!isNaN(Number(fpsCap))) {
            if (fpsCap < 1) fpsCap = 1;
            this.fpsCap = fpsCap;
            this.minInterval = 1000.0 / fpsCap;
        } else if (E3D_DEBUG_VERBOSE) log("attemp to set FPS cap with something else than a number");
    }

    beginRender() {
        E3D_DEBUG_RENDER_START = performance.now();
    }
    endRender() {
        E3D_DEBUG_RENDER_ACCUM += performance.now() - E3D_DEBUG_RENDER_START;
    }


}