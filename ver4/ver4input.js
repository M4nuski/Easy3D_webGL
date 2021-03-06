// Easy3D_WebGL
// Human interface input classes and handlers
// Emmanuel Charette 2017-2020

"use strict"

// Bind events to an element to capture and manage inputs
class E3D_input {
    constructor (element, supportMouse, supportKeyboard, supportTouch, supportPointerLock) {

        this.element = element;

        this.lastDelta = 1;

        // Touch properties
        this.touchDist = 0; // distance between 2 touches
        this.ongoingTouches = new Map();
        this.doubleTapping = false;
        this.doubleTapTimer = false;
        this.liftTapping = false;
        this.liftTimer = false;

        // Input states
        this.inputTable = new Map(); // keys that are pressed down
        this.inputTable.set(E3D_INP_ALWAYS, true);

        this.inputDoneTable = new Map(); // keys that got released but trigger again without keydown (keyboard auto-repeat)
        this.inputDoneTable.set(E3D_INP_ALWAYS, false);

        // Callback
        this.onInput = null;

        if (supportMouse) {    

            element.addEventListener("contextmenu", (e) => { e.preventDefault(); } );

            element.addEventListener("mousedown", (e) => { this.mouseDown(e) } );
            element.addEventListener("mouseup", (e) => { this.mouseUp(e) } );
            element.addEventListener("mousemove", (e) => { this.mouseMove(e) } );
            element.addEventListener("mouseleave", (e) => { this.mouseLeave(e) } );
            element.addEventListener("wheel", (e) => { this.mouseWheel(e) } );
            element.addEventListener("dblclick", (e) => { this.mouseDblClick(e) } );
        }

        if (supportKeyboard) {
            document.addEventListener("keydown", (e) => { this.keyDown(e) } );
            document.addEventListener("keyup", (e) => { this.keyUp(e) } );
        }

        if  ((supportPointerLock) && (pLockSupported)) { 
            pLockMoveEvent = (x, y) => { this.mouseLockedMove(x, y) } ; 
        }

        if (supportTouch) {
            element.addEventListener("touchstart", (e) => { this.touchStart(e) } );
            element.addEventListener("touchend", (e) => { this.touchEnd(e) } );
            element.addEventListener("touchcancel", (e) => { this.touchEnd(e) } );
            element.addEventListener("touchmove", (e) => { this.touchMove(e) } );
        }

        // Config        
        this._posSpeed = 50; // units per sec for position outputs
        this._rotSpeed = 90 * DegToRad; // rad per sec for rotation outputs

        this.mousePosDirection = 1; 
        this.mouseRotDirection = 1;
        
        this._mouseSpeed = 50; // units per mouse position delta
        this._mouseWheelSpeed = 5.0; // units per wheel rotation delta

        this.elemScaleX = 1.0 / element.offsetWidth; // screen pixels to element's relative size
        this.elemScaleY = 1.0 / element.offsetHeight; 
        
        this._doubleTapDelay = 200; //ms
        this._pinchHysteresis = 10; // How many pixels of difference between finger movements is to be still considered 0

        this.pointerMap = new Map(); // Map of inputs for pointer
        // pointer map buttons : disabled, always on, lmb, mmb, rmb
        // buttons are the trigger that activate the axis and position values changes
        // pointer map axis : x/y/w (wheel)
        // can be assigned to whatever, the name are just easy placeholders
        // (could have been axis0 to axis7 or input0 to input7)

        // p inputs, "position"
        this.pointerMap.set("px_btn", E3D_INP_RMB);
        this.pointerMap.set("px_axis", E3D_INP_X);

        this.pointerMap.set("py_btn", E3D_INP_RMB);
        this.pointerMap.set("py_axis", E3D_INP_Y);

        this.pointerMap.set("pz_btn", E3D_INP_ALWAYS);
        this.pointerMap.set("pz_axis", E3D_INP_W);

        // r inputs, "rotation", warping around 0-2pi
        this.pointerMap.set("rx_btn", E3D_INP_LMB);
        this.pointerMap.set("rx_axis", E3D_INP_Y);

        this.pointerMap.set("ry_btn", E3D_INP_LMB);
        this.pointerMap.set("ry_axis", E3D_INP_X);

        this.pointerMap.set("rz_btn", E3D_INP_MMB);
        this.pointerMap.set("rz_axis", E3D_INP_X);


        // Touch to pointer and key mappings
        this.touchMap = new Map();

        this.touchMap.set("touch_single", E3D_INP_LMB); // single touch point as LMB down or up, moves when down will affect pointer X Y axis
        this.touchMap.set("touch_double", E3D_INP_RMB); // double touch points as RMB down or up, moves when down will affect pointer X Y axis
        //this.touchMap.set("pinch_axis", E3D_INP_W);  // Distance between 2 touch points. mapped to pointer axis W (mouse wheel)
        this.touchMap.set("doubleTap_single", E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_LMB); // trigger when single touch is up-down-up-down within _doubleTapDelay
        this.touchMap.set("doubleTap_double", "KeyF");// E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_RMB; // trigger when both touches are up-down-up-down within _doubleTapDelay
        this.touchMap.set("lift_single", E3D_INP_MMB); // "reverse doubleTap_single", trigger when single touch is lifted for less than _doubleTapDelay
        this.touchMap.set("lift_double", E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_MMB); // "reverse doubleTap_double", trigger when both touches are lifted for less than _doubleTapDelay
        //mappings for testing
        /*
        this.touchMap.set("touch_single", 1001);
        this.touchMap.set("touch_double", 1002);
        this.touchMap.set("doubleTap_single", 2001);
        this.touchMap.set("doubleTap_double", 2002);
        this.touchMap.set("lift_single", 3001);
        this.touchMap.set("lift_double", 3002);
        */

        // Keyboard Controls, maps commands to keyboardEvent.code
        this.keyMap = new Map(); 
        // this.keyMap.set(command, key.code);
        // Could also be this.keyMap.set("px_dec", E3D_INP_RMB); to change a position input with a mouse button
        
        // internal default commands
        this.keyMap.set("px_dec", "KeyD");
        this.keyMap.set("px_inc", "KeyA");

        this.keyMap.set("py_dec", "KeyC");
        this.keyMap.set("py_inc", "Space");

        this.keyMap.set("pz_dec", "KeyW");
        this.keyMap.set("pz_inc", "KeyS");

        this.keyMap.set("rx_dec", "KeyT");
        this.keyMap.set("rx_inc", "KeyG");
        
        this.keyMap.set("ry_dec", "KeyG");
        this.keyMap.set("ry_inc", "KeyJ");

        this.keyMap.set("rz_dec", "KeyY");
        this.keyMap.set("rz_inc", "KeyH");

        // "custom" commands, binds can be added for anything
        this.keyMap.set("action0", E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_LMB);
        this.keyMap.set("action1", "KeyF");
        this.keyMap.set("action2", "KeyX");
      //  this.keyMap.set("panPivot", E3D_INP_RMB);
        //this.keyMap.set("togglePointerlock", "ControlRight");
        //this.keyMap.set("toggleFullscreen", "F11");
        //this.keyMap.set("exitLock", "Escape");



        // Raw pointer data
        this.pinx = 0;
        this.piny = 0; 
        this.mx = 0;
        this.my = 0;
        this.mw = 0;

        // Delta data injection
        this.px_offset = 0;
        this.py_offset = 0;
        this.pz_offset = 0;
        this.rx_offset = 0;
        this.ry_offset = 0;
        this.rz_offset = 0;

// Outputs
    // Positions
        // Delta
        this.px_delta = 0;
        this.py_delta = 0;
        this.pz_delta = 0;        
        // Smoothed Delta
        this.px_delta_smth = 0;
        this.py_delta_smth = 0;
        this.pz_delta_smth = 0;
        // Sums
        this.px = 0;
        this.py = 0;
        this.pz = 0;
        // Smoothed sums
        this.px_smth = 0;
        this.py_smth = 0;
        this.pz_smth = 0;

    // Rotations
        // Delta
        this.rx_delta = 0;
        this.ry_delta = 0;
        this.rz_delta = 0;
        // Smoothed Delta
        this.rx_delta_smth = 0;
        this.ry_delta_smth = 0;
        this.rz_delta_smth = 0;
        // Sums
        this.rx = 0;
        this.ry = 0;
        this.rz = 0;
        // Smoothed sums
        this.rx_smth = 0;
        this.ry_smth = 0;
        this.rz_smth = 0;
    }


// Methods 


    reset() {
        // Delta
        this.px_delta = 0;
        this.py_delta = 0;
        this.pz_delta = 0;        
        // Smoothed Delta
        this.px_delta_smth = 0;
        this.py_delta_smth = 0;
        this.pz_delta_smth = 0;
        // Sums
        this.px = 0;
        this.py = 0;
        this.pz = 0;
        // Smoothed sums
        this.px_smth = 0;
        this.py_smth = 0;
        this.pz_smth = 0;

        // Delta
        this.rx_delta = 0;
        this.ry_delta = 0;
        this.rz_delta = 0;
        // Smoothed Delta
        this.rx_delta_smth = 0;
        this.ry_delta_smth = 0;
        this.rz_delta_smth = 0;
        // Sums
        this.rx = 0;
        this.ry = 0;
        this.rz = 0;
        // Smoothed sums
        this.rx_smth = 0;
        this.ry_smth = 0;
        this.rz_smth = 0;

    }


    // Process keys and pointer inputs to get final output values
    processInputs(delta = 1.0) {

        this.px_delta = this.px_offset; 
        this.py_delta = this.py_offset; 
        this.pz_delta = this.pz_offset;
        this.rx_delta = this.rx_offset; 
        this.ry_delta = this.ry_offset;
        this.rz_delta = this.rz_offset;

        // Keyboard
        // Position
        if (this.inputTable.get(this.keyMap.get("px_dec"))) {
            this.px_delta -= this._posSpeed;
        }
        if (this.inputTable.get(this.keyMap.get("px_inc"))) {
            this.px_delta += this._posSpeed;
        }

        if (this.inputTable.get(this.keyMap.get("py_dec"))) {
            this.py_delta -= this._posSpeed;
        }
        if (this.inputTable.get(this.keyMap.get("py_inc"))) {
            this.py_delta += this._posSpeed;
        }

        if (this.inputTable.get(this.keyMap.get("pz_dec"))) {
            this.pz_delta -= this._posSpeed;
        }
        if (this.inputTable.get(this.keyMap.get("pz_inc"))) {
            this.pz_delta += this._posSpeed;
        }    

        // Rotation
        if (this.inputTable.get(this.keyMap.get("rx_dec"))) {
            this.rx_delta -= this._rotSpeed;
        }
        if (this.inputTable.get(this.keyMap.get("rx_inc"))) {
            this.rx_delta += this._rotSpeed;
        }    

        if (this.inputTable.get(this.keyMap.get("ry_dec"))) {
            this.ry_delta -= this._rotSpeed;
        }
        if (this.inputTable.get(this.keyMap.get("ry_inc"))) {
            this.ry_delta += this._rotSpeed;
        }    

        if (this.inputTable.get(this.keyMap.get("rz_dec"))) {
            this.rz_delta -= this._rotSpeed;
        }
        if (this.inputTable.get(this.keyMap.get("rz_inc"))) {
            this.rz_delta += this._rotSpeed;
        }

        // Pointer
        // Position        
        var mps = this._posSpeed * this.mousePosDirection;
        var mrs = this._rotSpeed * this.mouseRotDirection;

        if (this.inputTable.get(this.pointerMap.get("px_btn"))) {
            if (this.pointerMap.get("px_axis") == E3D_INP_X) this.px_delta += this.mx * mps;
            if (this.pointerMap.get("px_axis") == E3D_INP_Y) this.px_delta += this.my * mps;
            if (this.pointerMap.get("px_axis") == E3D_INP_W) this.px_delta += this.mw * mps;
        }

        if (this.inputTable.get(this.pointerMap.get("py_btn"))) {
            if (this.pointerMap.get("py_axis") == E3D_INP_X) this.py_delta += this.mx * mps;
            if (this.pointerMap.get("py_axis") == E3D_INP_Y) this.py_delta += this.my * mps;
            if (this.pointerMap.get("py_axis") == E3D_INP_W) this.py_delta += this.mw * mps;
        }

        if (this.inputTable.get(this.pointerMap.get("pz_btn"))) {
            if (this.pointerMap.get("pz_axis") == E3D_INP_X) this.pz_delta += this.mx * mps;
            if (this.pointerMap.get("pz_axis") == E3D_INP_Y) this.pz_delta += this.my * mps;
            if (this.pointerMap.get("pz_axis") == E3D_INP_W) this.pz_delta += this.mw * mps;
        }

        // Rotations
        if (this.inputTable.get(this.pointerMap.get("rx_btn"))) {
            if (this.pointerMap.get("rx_axis") == E3D_INP_X) this.rx_delta += this.mx * mrs;
            if (this.pointerMap.get("rx_axis") == E3D_INP_Y) this.rx_delta += this.my * mrs;
            if (this.pointerMap.get("rx_axis") == E3D_INP_W) this.rx_delta += this.mw * mrs;
        }

        if (this.inputTable.get(this.pointerMap.get("ry_btn"))) {
            if (this.pointerMap.get("ry_axis") == E3D_INP_X) this.ry_delta += this.mx * mrs;
            if (this.pointerMap.get("ry_axis") == E3D_INP_Y) this.ry_delta += this.my * mrs;
            if (this.pointerMap.get("ry_axis") == E3D_INP_W) this.ry_delta += this.mw * mrs;
        }

        if (this.inputTable.get(this.pointerMap.get("rz_btn"))) {
            if (this.pointerMap.get("rz_axis") == E3D_INP_X) this.rz_delta += this.mx * mrs;
            if (this.pointerMap.get("rz_axis") == E3D_INP_Y) this.rz_delta += this.my * mrs;
            if (this.pointerMap.get("rz_axis") == E3D_INP_W) this.rz_delta += this.mw * mrs;
        }


        this.px_delta *= delta;
        this.py_delta *= delta;
        this.pz_delta *= delta;

        this.rx_delta *= delta;
        this.ry_delta *= delta;
        this.rz_delta *= delta;
        
        this.px += this.px_delta;
        this.py += this.py_delta; 
        this.pz += this.pz_delta;

        this.rx += this.rx_delta;
        this.ry += this.ry_delta;
        this.rz += this.rz_delta;

        // Warp rotations
        if (this.rx < -PIx2) { 
            this.rx += PIx2;
            this.rx_smth += PIx2;
        }
        if (this.rx > PIx2) { 
            this.rx -= PIx2; 
            this.rx_smth -= PIx2; 
        }

        if (this.ry < -PIx2) { 
            this.ry += PIx2;
            this.ry_smth += PIx2;
        }
        if (this.ry > PIx2) { 
            this.ry -= PIx2; 
            this.ry_smth -= PIx2; 
        }

        if (this.rz < -PIx2) { 
            this.rz += PIx2;
            this.rz_smth += PIx2;
        }
        if (this.rz > PIx2) { 
            this.rz -= PIx2; 
            this.rz_smth -= PIx2; 
        }

        this.lastDelta = delta;

        this.mx = 0;
        this.my = 0;
        this.mw = 0;
        this.px_offset = 0;
        this.py_offset = 0;
        this.pz_offset = 0;
        this.rx_offset = 0;
        this.ry_offset = 0;
        this.rz_offset = 0;

    }


    clampRotation(min, max, x = true, y = true, z = true) {
        if (x) {
            if (this.rx > max) {
                this.rx = max;
                this.rx_smth = max;
            } else if (this.rx < min) {
                this.rx = min;
                this.rx_smth = min;
            }
        }
        if (y) {
            if (this.ry > max) {
                this.ry = max;
                this.ry_smth = max;
            } else if (this.ry < min) {
                this.ry = min;
                this.ry_smth = min;
            }
        }
        if (z) {
            if (this.rz > max) {
                this.rz = max;
                this.rz_smth = max;
            } else if (this.rz < min) {
                this.rz = min;
                this.rz_smth = min;
            }
        }
    }

    clampRotationSmooth(min, max, x = true, y = true, z = true) {
        if (x) {
            if (this.rx_smth > max) {
                this.rx = max;
                this.rx_smth = max;
                this.rx_delta_smth = 0;
            } else if (this.rx_smth < min) {
                this.rx = min;
                this.rx_smth = min;
                this.rx_delta_smth = 0;
            }
        }
        if (y) {
            if (this.ry_smth > max) {
                this.ry = max;
                this.ry_smth = max;
                this.ry_delta_smth = 0;
            } else if (this.ry_smth < min) {
                this.ry = min;
                this.ry_smth = min;
                this.ry_delta_smth = 0;
            }
        }
        if (z) {
            if (this.rz_smth > max) {
                this.rz = max;
                this.rz_smth = max;
                this.rz_delta_smth = 0;
            } else if (this.rz_smth < min) {
                this.rz = min;
                this.rz_smth = min;
                this.rz_delta_smth = 0;
            }
        }
    }

    clampPosition(min, max, x = true, y = true, z = true) {
        if (x) {
            if (this.px > max) {
                this.px = max;
                this.px_smth = max;
            } else if (this.px < min) {
                this.px = min;
                this.px_smth = min;
            }
        }
        if (y) {
            if (this.py > max) {
                this.py = max;
                this.py_smth = max;
            } else if (this.py < min) {
                this.py = min;
                this.py_smth = min;
            }
        }
        if (z) {
            if (this.pz > max) {
                this.pz = max;
                this.pz_smth = max;
            } else if (this.pz < min) {
                this.pz = min;
                this.pz_smth = min;
            }
        }
    }

    smoothRotation(smoothFactor, x = true, y = true, z = true) {
        let f = this.lastDelta * smoothFactor;

        if (f < 1.0) {
            if (x) {
                this.rx_smth += (this.rx - this.rx_smth) * f;
                this.rx_delta_smth += (this.rx_delta - this.rx_delta_smth) * f;
            }            
            if (y) {
                this.ry_smth += (this.ry - this.ry_smth) * f;  
                this.ry_delta_smth += (this.ry_delta - this.ry_delta_smth) * f; 
            } 
            if (z) {
                this.rz_smth += (this.rz - this.rz_smth) * f;
                this.rz_delta_smth += (this.rz_delta - this.rz_delta_smth) * f;
            }
        } else {
            this.rx_smth = this.rx;
            this.ry_smth = this.ry;
            this.rz_smth = this.rz;

            this.rx_delta_smth = this.rx_delta;
            this.ry_delta_smth = this.ry_delta;
            this.rz_delta_smth = this.rz_delta;
        }
    }

    smoothPosition(smoothFactor, x = true, y = true, z = true) {
        let f = this.lastDelta * smoothFactor;

        if (f < 1.0) {
            if (x) {
                this.px_smth += (this.px - this.px_smth) * f;
                this.px_delta_smth += (this.px_delta - this.px_delta_smth) * f;
            }            
            if (y) {
                this.py_smth += (this.py - this.py_smth) * f;
                this.py_delta_smth += (this.py_delta - this.py_delta_smth) * f;
            }    
            if (z) {
                this.pz_smth += (this.pz - this.pz_smth) * f;
                this.pz_delta_smth += (this.pz_delta - this.pz_delta_smth) * f;
            }    
        } else {
            this.px_smth = this.px;
            this.py_smth = this.py;
            this.pz_smth = this.pz;

            this.px_delta_smth = this.px_delta;
            this.py_delta_smth = this.py_delta;
            this.pz_delta_smth = this.pz_delta;
        }
    }

    // Check if a command has been triggered, and reset it if needed
    // Make sure that no 2 commands or button inputs conflicts otherwise they might reset each others
    checkCommand(cmd, reset = false) {
        let res = this.inputTable.get(this.keyMap.get(cmd));        
        if (reset && res) this.inputTable.set(this.keyMap.get(cmd), false);
        return res;
    }

    
    // Resize


    resize() {
        this.elemScaleX = 1.0 / this.element.offsetWidth;
        this.elemScaleY = 1.0 / this.element.offsetHeight;
    }


    // Keyboard Inputs


    keyDown(event) {
        if ((!event.metaKey) && (event.code != "F12") && (event.code != "ControlRight")) {
            if (event.preventDefault) event.preventDefault();
        }

        var inpDone = this.inputDoneTable.get(event.code);
        if ((inpDone == undefined) || (inpDone == true)) {
            this.inputTable.set(event.code, true);   
            this.inputDoneTable.set(event.code, false);
        }    
        if (event.type == undefined) event.type = "keyDown";
        if (this.onInput) this.onInput( event ); // direct callback keydown preview

        //prevent scroll down on spacebar
        if ((event.target) && (event.target == document.body) && (event.code == " ")) event.preventDefault(); 
    }
    
    keyUp(event) {    
        if (event.type == undefined) event.type = "keyUp";
        if (this.onInput) this.onInput( event ); // callback from event for user input dependant request to browser (fullscreen, pointerlock)

        this.inputTable.set(event.code, false);
        this.inputDoneTable.set(event.code, true);
    }


    // Mouse Inputs


    mouseDown(event) {
        this.pinx = event.pageX; // store relative position
        this.piny = event.pageY;

        this.keyDown( { code : event.button, type:"mouseDown" } );

        if (event.preventDefault) { event.preventDefault(); };
        return false;
    }
    
    mouseUp(event) {
        this.keyUp( { code : event.button, type:"mouseUp" } );

        if (event.preventDefault) { event.preventDefault(); };
        return false;
    }
    
    mouseLeave() {
        for (let i = 0; i < 3; ++i) this.keyUp( { code : i } );
    }
    
    mouseMove(event) {
        this.mx += (event.pageX - this.pinx) * this._mouseSpeed * this.elemScaleX;
        this.my += (event.pageY - this.piny) * this._mouseSpeed * this.elemScaleY;

        this.pinx = event.pageX;
        this.piny = event.pageY;
    }
    
    mouseLockedMove(x, y) {
        this.mx += x * this._mouseSpeed * this.elemScaleX;
        this.my += y * this._mouseSpeed * this.elemScaleY;
    }
    
    mouseWheel(event) {   
        // Override cross browser/OS wheel delta discrepencies
        this.mw += (event.deltaY > 0) ? this._mouseWheelSpeed : -this._mouseWheelSpeed;

        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseDblClick(event) {
        this.keyUp( { code : E3D_INP_DOUBLE_PREFIX_CODE + event.button } );
        this.keyDown( { code : E3D_INP_DOUBLE_PREFIX_CODE + event.button } );

        if (event.preventDefault) { event.preventDefault(); };
    }


    // Touch Inputs 


    touchStart(event) {

        if (event.preventDefault && event.cancelable) { event.preventDefault(); };

        for (var i = 0; i < event.changedTouches.length; i++) // append changed touches to the map
            this.ongoingTouches.set(event.changedTouches[i].identifier, this.copyTouch(event.changedTouches[i]));

        var touchesIter = this.ongoingTouches.values();

        if (this.ongoingTouches.size == 1) {
            var firstTouch = touchesIter.next().value;

            //process as mouse down with single touch code
            firstTouch.button = this.touchMap.get("touch_single");
            this.mouseDown(firstTouch);

        } else if (this.ongoingTouches.size == 2) {
            var firstTouch = touchesIter.next().value;
            var secondTouch = touchesIter.next().value;

            //reset single touch mouse down
            firstTouch.button = this.touchMap.get("touch_single");
            this.mouseUp(firstTouch);

            //mousedown with double touch code
            secondTouch.button = this.touchMap.get("touch_double");

            this.mouseDown( { pageX: (firstTouch.pageX + secondTouch.pageX) / 2,
                              pageY: (firstTouch.pageY + secondTouch.pageY) / 2,
                              button: secondTouch.button } );

            var tdx = secondTouch.pageX - firstTouch.pageX;
            var tdy = secondTouch.pageY - firstTouch.pageY;
            this.touchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));
        }


        if (this.doubleTapping) {
            var touchCode = (this.ongoingTouches.size == 1) ? this.touchMap.get("doubleTap_single") : this.touchMap.get("doubleTap_double")
            this.keyUp( { code : touchCode } );
            this.keyDown( { code : touchCode } );
            this.doubleTapping = false;

            if (this.doubleTapTimer) {
                clearTimeout(this.doubleTapTimer); 
                this.doubleTapTimer = false; 
            }
        } else {
            this.doubleTapping = true;
            this.doubleTapTimer = setTimeout( () => { this.doubleTapping = false; }, this._doubleTapDelay);
        }

        if (this.liftTapping) {
            var touchCode = (this.ongoingTouches.size == 1) ? this.touchMap.get("lift_single") : this.touchMap.get("lift_double");
            this.keyUp( { code : touchCode } );
            this.keyDown( { code : touchCode } );
            this.liftTapping = false;

            if (this.liftTimer) { 
                clearTimeout(this.liftTimer); 
                this.liftTimer = false; 
            }
        }
    }


    touchEnd(event) {

        if (event.preventDefault) { event.preventDefault(); };
        
        if (this.ongoingTouches.size == 1) {
            var firstTouch = this.ongoingTouches.get(event.changedTouches[0].identifier);
            if (firstTouch) {
                firstTouch.button = this.touchMap.get("touch_single");
                this.mouseUp(firstTouch);
            }
        }
        
        if (this.ongoingTouches.size == 2) {
            var touchesIter = this.ongoingTouches.values();
            var firstTouch = touchesIter.next().value;
            var secondTouch = touchesIter.next().value;
            secondTouch.button = this.touchMap.get("touch_double");
            this.mouseUp(secondTouch);
        }

        if (!this.liftTapping) {
            this.liftTapping = true;
            if (this.liftTimer) { 
                clearTimeout(this.liftTimer); 
                this.liftTimer = false; 
            }
            this.liftTimer = setTimeout( () => { this.liftTapping = false; }, this._doubleTapDelay );
        }
        
        for (var i = 0; i < event.changedTouches.length; i++) this.ongoingTouches.delete(event.changedTouches[i].identifier);

    }



    touchMove(event) {

        if (event.preventDefault) { event.preventDefault(); };
       
        for (var i = 0; i < event.changedTouches.length; ++i) 
            this.ongoingTouches.set(event.changedTouches[i].identifier, this.copyTouch(event.changedTouches[i]) ); // update objects

        if (this.ongoingTouches.size == 1) {
            var firstTouch = this.ongoingTouches.get(event.changedTouches[0].identifier);
            if (firstTouch) {
                firstTouch.button = this.touchMap.get("touch_single");
                this.mouseMove(firstTouch);
            }

        } else if (this.ongoingTouches.size == 2) {
            var touchesIter = this.ongoingTouches.values();
            var firstTouch = touchesIter.next().value;
            var secondTouch = touchesIter.next().value;

            var tdx = secondTouch.pageX - firstTouch.pageX;
            var tdy = secondTouch.pageY - firstTouch.pageY;
            var newTouchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));

            // pinch panning
            secondTouch.button = this.touchMap.get("touch_double");

            this.mouseMove( { pageX: (firstTouch.pageX + secondTouch.pageX) / 2,
                              pageY: (firstTouch.pageY + secondTouch.pageY) / 2,
                              button: secondTouch.button } );

            if (Math.abs(this.touchDist - newTouchDist) > this._pinchHysteresis) {
                //var delta = (this.touchDist - newTouchDist) * this._mouseSpeed;
                this.mw += (this.touchDist - newTouchDist) * this._mouseSpeed * this.elemScaleX;
                this.touchDist = newTouchDist;
                //if (this.touchMap.get("pinch_axis") == E3D_INP_X) this.mx += delta;
                //if (this.touchMap.get("pinch_axis") == E3D_INP_Y) this.my += delta;
                //if (this.touchMap.get("pinch_axis") == E3D_INP_W) this.mw += delta;
            }

        } // end 2 touches

    } // end touch move

    copyTouch(touch) {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, button: E3D_INP_NONE };
    }

}




// Virtual keybaord: binds event on element and transpose "vKey=" DOM element attribute value to keyboard input handler
class E3D_input_virtual_kb {
    constructor(element, inputClass, supportTouch) {

        this.inputClass = inputClass;

        element.addEventListener("mousedown", (e) => this.vKeyDown(e));
        element.addEventListener("mouseup",  (e) => this.vKeyUp(e));
        element.addEventListener("mouseleave",  (e) => this.vKeyUp(e));
        element.addEventListener("dblclick",  (e) => this.vDblClk(e));

        if (supportTouch) {
            element.addEventListener("touchstart",  (e) => this.vKeyDown(e));
            element.addEventListener("touchend", (e) => this.vKeyUp(e));
            element.addEventListener("touchcancel",  (e) => this.vKeyUp(e));
        }
    }

    vKeyDown(event) {
        let k = event.target.getAttribute("vKey");
        if (k) {
            this.inputClass.keyDown( { code : k } );
        }
        event.preventDefault();
    }

    vKeyUp(event) {
        let k = event.target.getAttribute("vKey");
        if (k) {
            this.inputClass.keyUp( { code : k } );
        }
    }

    vDblClk(event) {
        event.preventDefault();
    }
}

// Virtual trackpad handler from a DOM element
class E3D_input_virtual_trackpad {
    constructor (element, inputClass) {

        this.inputClass = inputClass;
        this.element = element;
        this.xScale = 1.0;
        this.yScale = 1.0;

        this.xOffset = 0;
        this.yOffset = 0;

        element.addEventListener("touchstart", (e) => this.onTouchStart(e));
        element.addEventListener("touchend", (e) => this.onTouchEnd(e));
        element.addEventListener("touchmove", (e) => this.onTouchMove(e));
        element.addEventListener("touchcancel", (e) => this.onTouchCancel(e));

        element.addEventListener("resize", (e) => this.onResize(e));

        this.onResize();
    } 

    onResize() {
        this.xScale = this.inputClass.element.offsetWidth / this.element.offsetWidth;
        this.yScale = this.inputClass.element.offsetHeight / this.element.offsetHeight;

        this.xOffset = this.inputClass.element.offsetLeft - this.element.offsetLeft;
        this.yOffset = this.inputClass.element.offsetTop - this.element.offsetTop;
    }

    onTouchStart(event) {
        event.preventDefault();
        this.inputClass.touchStart( { changedTouches : [this.offsetTouch(event.changedTouches[0])] } );
    }

    onTouchEnd(event) {
        event.preventDefault();
        this.inputClass.touchEnd( { changedTouches : [this.offsetTouch(event.changedTouches[0])] } );
    }

    onTouchMove(event) {
        event.preventDefault();
        this.inputClass.touchMove( { changedTouches : [this.offsetTouch(event.changedTouches[0])] } );
    }

    onTouchCancel(event) {
        event.preventDefault();
        this.inputClass.touchCancel( { changedTouches : [this.offsetTouch(event.changedTouches[0])] } );
    }
    

    offsetTouch(touch) {
        return { identifier: touch.identifier, 
            pageX: (touch.pageX - this.xOffset) * this.xScale, 
            pageY: (touch.pageY - this.yOffset) * this.yScale            
            };
    }

}




// Virtual thumb stick input from a DOM element
class E3D_input_virtual_thumbstick {
    constructor (element, inputClass, doubleTapCommand = "", liftTapCommand = "action0") {

        this.inputClass = inputClass;
        this.element = element;

        this.doubleTapCommand = doubleTapCommand;        
        this.doubleTapping = false;
        this.doubleTapTimer = false; 
        this.liftTapCommand = liftTapCommand;     
        this.liftTapping = false;
        this.liftTimer = false;

        this.Xspeed = 0.015; // touch to delta factor
        this.Yspeed = 0.015; // touch to delta factor
        this.Touch = -1; // current touch to follow (1st hit)

        this.deadZone = 0.1;

        // Center of element in pageX/Y
        this.xMid = 0.5;
        this.yMid = 0.5;

        // Edge distance of element
        this.xMax = 100;
        this.yMax = 100;

        // Current position
        this.x = 0;
        this.y = 0;

        element.addEventListener("touchstart", (e) => this.onTouchStart(e));
        element.addEventListener("touchend", (e) => this.onTouchEnd(e));
        element.addEventListener("touchmove", (e) => this.onTouchMove(e));
        element.addEventListener("touchcancel", (e) => this.onTouchEnd(e));

        element.addEventListener("resize", (e) => this.onResize(e));

        this.onResize();
    } 

    onResize() {
        this.xMax = this.element.offsetWidth / 2;
        this.yMax = this.element.offsetHeight / 2;
        
        let o = getTotalPageOffset(this.element);
        this.xMid = o.x + this.xMax;
        this.yMid = o.y + this.yMax;
    }

    // add values to input's delta offsets
    processInputs(xTarget = "rx_offset", yTarget = "ry_offset") {
        if (this.Touch != -1) {

            //delta
            var dx = (this.x - this.xMid) / this.xMax;
            var dy = (this.y - this.yMid) / this.yMax;

            //clamp
            if (dx < -1.0) dx = -1.0;
            if (dx >  1.0) dx =  1.0;
            if (dy < -1.0) dy = -1.0;
            if (dy >  1.0) dy =  1.0;     

            // X
            if (Math.abs(dx) > this.deadZone) {
                //Normalize
                dx = (dx - this.deadZone) / (1.0 - this.deadZone);
                //Inject
                if (this.inputClass[xTarget] != undefined) this.inputClass[xTarget] += dx * this.Xspeed;
            }

            // Y
            if (Math.abs(dy) > this.deadZone) {
                //Normalize
                dy = (dy - this.deadZone) / (1.0 - this.deadZone);
                //Inject
                if (this.inputClass[yTarget] != undefined) this.inputClass[yTarget] += dy * this.Yspeed;
            }
        }
    }

    onTouchStart(event) {
        event.preventDefault();
        this.Touch = event.changedTouches[0].identifier;
        this.x = event.changedTouches[0].pageX;
        this.y = event.changedTouches[0].pageY;

        if (this.doubleTapping) {
            if (this.doubleTapCommand != "") {
                this.inputClass.keyUp( { code : this.inputClass.keyMap.get(this.doubleTapCommand) } );
                this.inputClass.keyDown( { code : this.inputClass.keyMap.get(this.doubleTapCommand) } );
            }
            this.doubleTapping = false;
            if (this.doubleTapTimer) {
                clearTimeout(this.doubleTapTimer); 
                this.doubleTapTimer = false; 
            }
        } else {
            this.doubleTapping = true;
            this.doubleTapTimer = setTimeout( () => { this.doubleTapping = false; }, this.inputClass._doubleTapDelay );
        }

        if (this.liftTapping) {
            if (this.liftTapCommand != "") {
                this.inputClass.keyUp( { code : this.inputClass.keyMap.get(this.liftTapCommand) } );
                this.inputClass.keyDown( { code : this.inputClass.keyMap.get(this.liftTapCommand) } );
            }
            this.liftTapping = false;
            if (this.liftTimer) { 
                clearTimeout(this.liftTimer); 
                this.liftTimer = false; 
            }
        }

    }

    onTouchEnd(event) {
        event.preventDefault();
        if (this.Touch == event.changedTouches[0].identifier) this.Touch = -1;

        if (!this.liftTapping) {
            this.liftTapping = true;
            if (this.liftTimer) { 
                clearTimeout(this.liftTimer); 
                this.liftTimer = false; 
            }
            this.liftTimer = setTimeout( () => { this.liftTapping = false; }, this.inputClass._doubleTapDelay );
        }
    }

    onTouchMove(event) {
        event.preventDefault();
        if (this.Touch == event.changedTouches[0].identifier) {
            this.x = event.changedTouches[0].pageX;
            this.y = event.changedTouches[0].pageY;
        }
    }    

}

// Helper function to recursively find the absolute position of an element
function getTotalPageOffset(element) {
    var xo = element.offsetLeft;
    var yo = element.offsetTop;
    var currentElement = element;
    while ((currentElement.offsetParent) && (currentElement.offsetParent != document.body)) {
        xo += currentElement.offsetParent.offsetLeft;
        yo += currentElement.offsetParent.offsetTop;
        currentElement = currentElement.offsetParent;
    }
    return { x: xo, y: yo };
}