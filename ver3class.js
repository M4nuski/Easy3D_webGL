class E3D_timing {
    constructor(run, interval, onTick) {

        this.onTick = onTick;

        this.delta = interval / 1000;
        this.tickInterval = interval;

        this.timer; 

        this.start = new Date().getTime();
        this.lastTick = this.start;
        this.active = run;

        if (run) {
            this.timer = setInterval( () => {this.tickEvent() }, interval);
        }
    }
    smooth(val, target, fact) { // TODO upgrade for time independant smoothing
        return (val * fact) + (target * (1.0 - fact));
        // target Fact + val - val fact
        // target + (target - val) * fact
        //return target + ((target - val) * fact);  
    }

    run() {
        this.lastTick = new Date().getTime();
        this.timer = setInterval( () => {this.tickEvent() }, this.tickInterval);
        this.active = true;
    }
    pause() {
        clearInterval(this.timer);
        this.active = false;
    }

    tickEvent(){
        const ts = new Date().getTime(); 

        this.delta = (ts - this.lastTick) / 1000;
        this.lastTick = ts;

        if (this.onTick) {             
            this.onTick(); 
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


class E3D_entity {
    constructor(id, filename) {

        this.id = id; // to find object in list
        this.visible = false;

        // Properties
        this.position = vec3.create();
        this.angle = vec3.create();
        this.scale = vec3.fromValues(1.0, 1.0, 1.0);
        
        // Computed matrix
        this.modelMatrix = mat4.create();
        this.normalMatrix = mat4.create();

        // Data
        this.numElements = 0;
        this.vertexBuffer;
        this.normalBuffer;
        this.colorBuffer; // todo replace by texture
        //this.uvBuffer; // todo
        //this.indiceBuffer; // todo 

        //this.textureID = ""; // todo        
        this.filename = filename;

        if (filename != "") {
            this.loadFromMS3DRAW(filename);
        }

        this.resetMatrix();
    } 

    loadFromMS3DRAW(filename) {

    }

    resetMatrix(){
        // recreate matrices from scale, rotation and position
    }


}