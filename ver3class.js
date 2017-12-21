class E3D_timing {
    constructor(run, interval, onTick) {

        this.onTick = onTick;

        this.delta = interval / 1000;
        this.tickInterval = interval;

        this.timer; 

        this.start = new Date().getTime();
        this.lastTick = this.start;

        if (run) {
            this.timer = setInterval( () => {this.tickEvent() }, interval);
        }
    }
    smooth(val, target, fact) { // TODO upgrade for time independant smoothing
        //return (target * fact) + (val * (1.0 - fact));
        // target Fact + val - val fact
        // target + (target - val) * fact
        return target + ((target - val) * fact);  
    }

    run() {
        this.lastTick = new Date().getTime();
        this.timer = setInterval( () => {this.tickEvent() }, this.tickInterval);
    }
    pause() {
        clearInterval(this.timer);
    }

    tickEvent(){

        const ts = new Date().getTime(); 

        this.delta = (ts - this.lastTick) / 1000;
        this.lastTick = ts;

        if (this.onTick) {             
            this.onTick(); 
        }

    }

    

}