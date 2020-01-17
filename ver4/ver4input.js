// Easy3D_WebGL
// Human interface input classes and handlers
// Emmanuel Charette 2017-2019

"use strict"

// Bind events to an element to capture and manage inputs
class E3D_input {
    constructor (element, supportMouse, supportKeyboard, supportTouch, supportPointerLock) {

        this.element = element;

        this.lastDelta = 1;

        // Touch properties
        this.touchDist = 0; // distance between 2 touches
        this.ongoingTouches = [];
        this.doubleTapping = false;
        this.doubleTapTimer = false;
        this.liftTapping = false;
        this.liftTimer = false;

        // Input states
        this.inputTable = {}; // keys that are pressed down
        this.inputDoneTable = {}; // keys that got released but trigger again without keydown (keyboard auto-repeat)

        // Callback
        this.onInput = null;

        // Setup element's events
        if (supportMouse) {
            element.addEventListener("mousedown", (e) => { this.mouseDown(e) } );
            element.addEventListener("mouseup", (e) => { this.mouseUp(e) } );
            element.addEventListener("mousemove", (e) => {this.mouseMove(e) } );
            element.addEventListener("mouseleave",(e) => { this.mouseLeave(e) } );
            element.addEventListener("wheel", (e) => {this.mouseWheel(e) } );
            element.addEventListener("dblclick", (e) => {this.mouseDblClick(e) } );
        }

        if (supportKeyboard) {
            document.addEventListener("keydown",(e) => { this.keyDown(e) } );
            document.addEventListener("keyup",(e) => { this.keyUp(e) } );
        }

        if  ((supportPointerLock) && (pLockSupported)) { 
            pLockMoveEvent = (x, y) => { this.mouseLockedMove(x, y) } ; 
        }

        if (supportTouch) {
            element.addEventListener("touchstart", (e) => {this.touchStart(e) } );
            element.addEventListener("touchend", (e) => {this.touchEnd(e) } );
            element.addEventListener("touchcancel", (e) => {this.touchEnd(e) } );
            element.addEventListener("touchmove", (e) => {this.touchMove(e) } );
        }

        // Config        
        this._posSpeed = 50; // units per sec for position outputs
        this._rotSpeed = 90 * DegToRad; // rad per sec for rotation outputs
        
        this._mouseSpeed = 0.05; // units per mouse position delta 
        this._mouseWheelSpeed = 5.0; // units per wheel rotation delta
        
        this._doubleTapDelay = 200; //ms
        this._pinchHysteresis = 10; // How many pixels of difference between finger movements is to be still considered 0

        this.pointerMap = {}; // Map of inputs for pointer
        // pointer map buttons : disabled, always on, lmb, mmb, rmb
        // buttons are the trigger that activate the axis and position values changes
        // pointer map axis : x/y/w (wheel)
        // can be assigned to whatever, the name are just easy placeholders
        // (could have been axis0 to axis7 or input0 to input7)

        // p inputs, "position"
        this.pointerMap["px_btn"] = E3D_INP_RMB;
        this.pointerMap["px_axis"] = E3D_INP_X;

        this.pointerMap["py_btn"] = E3D_INP_RMB;
        this.pointerMap["py_axis"] = E3D_INP_Y;

        this.pointerMap["pz_btn"] = E3D_INP_ALWAYS;
        this.pointerMap["pz_axis"] = E3D_INP_W;

        // r inputs, "rotation", warping around 0-2pi
        this.pointerMap["rx_btn"] = E3D_INP_LMB;
        this.pointerMap["rx_axis"] = E3D_INP_Y;

        this.pointerMap["ry_btn"] = E3D_INP_LMB;
        this.pointerMap["ry_axis"] = E3D_INP_X;

        this.pointerMap["rz_btn"] = E3D_INP_MMB;
        this.pointerMap["rz_axis"] = E3D_INP_X;


        // Touch to pointer and key mappings
        this.touchMap = {}; 

       // this.touchMap["tap"] = E3D_INP_LMB; // single touch LMB down/up, single touch drag mouse move with LMB down
       // this.touchMap["doubleTap"] = E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_LMB; // LMB double click
       // this.touchMap["pinch"] = E3D_INP_RMB; // double touch RMB down/up, double touch drag mouse move with RMB down

        this.touchMap["touch_single"] = E3D_INP_LMB; // single touch point as LMB down or up, moves when down will affect pointer X Y axis
        this.touchMap["touch_double"] = E3D_INP_RMB; // double touch points as RMB down or up, moves when down will affect pointer X Y axis
        //this.touchMap["pinch_axis"] = E3D_INP_W;  // Distance between 2 touch points. mapped to pointer axis W (mouse wheel)
        this.touchMap["doubleTap_single"] = E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_LMB; // trigger when single touch is up-down-up-down within _doubleTapDelay
        this.touchMap["doubleTap_double"] = "KeyF";// E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_RMB; // trigger when both touches are up-down-up-down within _doubleTapDelay
        this.touchMap["lift_single"] = E3D_INP_MMB; // "reverse doubleTap_single", trigger when single touch is lifted for less than _doubleTapDelay
        this.touchMap["lift_double"] = E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_MMB; // "reverse doubleTap_double", trigger when both touches are lifted for less than _doubleTapDelay

        // Keyboard Controls, maps commands to keyboardEvent.code
        this.keyMap = {}; 
        // this.keyMap[command] = key.code;
        // Could also be this.keyMap["px_dec"] = E3D_INP_RMB; to change a position input with a mouse button
        
        // internal default commands
        this.keyMap["px_dec"] = "KeyD";
        this.keyMap["px_inc"] = "KeyA";

        this.keyMap["py_dec"] = "KeyC";
        this.keyMap["py_inc"] = "Space";

        this.keyMap["pz_dec"] = "KeyW";
        this.keyMap["pz_inc"] = "KeyS";

        this.keyMap["rx_dec"] = "KeyF";
        this.keyMap["rx_inc"] = "KeyR";
        
        this.keyMap["ry_dec"] = "KeyQ";
        this.keyMap["ry_inc"] = "KeyE";

        this.keyMap["rz_dec"] = "KeyZ";
        this.keyMap["rz_inc"] = "KeyX";

        // "custom" commands, binds can be added for anything
        this.keyMap["action0"] = E3D_INP_LMB;
        this.keyMap["action1"] = "KeyF";
        this.keyMap["action2"] = E3D_INP_DOUBLE_PREFIX_CODE + E3D_INP_LMB;
        this.keyMap["panPivot"] = E3D_INP_RMB;
        this.keyMap["togglePointerlock"] = "ControlRight";
        this.keyMap["toggleFullscreen"] = "F11";
        //this.keyMap["exitLock"] = "Escape";



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
        if (this.inputTable[this.keyMap["px_dec"]]) {
            this.px_delta -= this._posSpeed;
        }
        if (this.inputTable[this.keyMap["px_inc"]]) {
            this.px_delta += this._posSpeed;
        }

        if (this.inputTable[this.keyMap["py_dec"]]) {
            this.py_delta -= this._posSpeed;
        }
        if (this.inputTable[this.keyMap["py_inc"]]) {
            this.py_delta += this._posSpeed;
        }

        if (this.inputTable[this.keyMap["pz_dec"]]) {
            this.pz_delta -= this._posSpeed;
        }
        if (this.inputTable[this.keyMap["pz_inc"]]) {
            this.pz_delta += this._posSpeed;
        }    

        // Rotation
        if (this.inputTable[this.keyMap["rx_dec"]]) {
            this.rx_delta -= this._rotSpeed;
        }
        if (this.inputTable[this.keyMap["rx_inc"]]) {
            this.rx_delta += this._rotSpeed;
        }    

        if (this.inputTable[this.keyMap["ry_dec"]]) {
            this.ry_delta -= this._rotSpeed;
        }
        if (this.inputTable[this.keyMap["ry_inc"]]) {
            this.ry_delta += this._rotSpeed;
        }    

        if (this.inputTable[this.keyMap["rz_dec"]]) {
            this.rz_delta -= this._rotSpeed;
        }
        if (this.inputTable[this.keyMap["rz_inc"]]) {
            this.rz_delta += this._rotSpeed;
        }

        // Pointer
        // Positions
        // todo replace within inputTable E3D_INP_ALWAYS as true
        if ((this.pointerMap["px_btn"] == E3D_INP_ALWAYS) || this.inputTable[this.pointerMap["px_btn"]]) {
            if (this.pointerMap["px_axis"] == E3D_INP_X) this.px_delta += this.mx * this._posSpeed;
            if (this.pointerMap["px_axis"] == E3D_INP_Y) this.px_delta += this.my * this._posSpeed;
            if (this.pointerMap["px_axis"] == E3D_INP_W) this.px_delta += this.mw * this._posSpeed;
        }

        if ((this.pointerMap["py_btn"] == E3D_INP_ALWAYS) || this.inputTable[this.pointerMap["py_btn"]]) {
            if (this.pointerMap["py_axis"] == E3D_INP_X) this.py_delta += this.mx * this._posSpeed;
            if (this.pointerMap["py_axis"] == E3D_INP_Y) this.py_delta += this.my * this._posSpeed;
            if (this.pointerMap["py_axis"] == E3D_INP_W) this.py_delta += this.mw * this._posSpeed;
        }

        if ((this.pointerMap["pz_btn"] == E3D_INP_ALWAYS) || this.inputTable[this.pointerMap["pz_btn"]]) {
            if (this.pointerMap["pz_axis"] == E3D_INP_X) this.pz_delta += this.mx * this._posSpeed;
            if (this.pointerMap["pz_axis"] == E3D_INP_Y) this.pz_delta += this.my * this._posSpeed;
            if (this.pointerMap["pz_axis"] == E3D_INP_W) this.pz_delta += this.mw * this._posSpeed;
        }

        // Rotations
        if ((this.pointerMap["rx_btn"] == E3D_INP_ALWAYS) || (this.inputTable[this.pointerMap["rx_btn"]])) {
            if (this.pointerMap["rx_axis"] == E3D_INP_X) this.rx_delta += this.mx * this._rotSpeed;
            if (this.pointerMap["rx_axis"] == E3D_INP_Y) this.rx_delta += this.my * this._rotSpeed;
            if (this.pointerMap["rx_axis"] == E3D_INP_W) this.rx_delta += this.mw * this._rotSpeed;
        }

        if ((this.pointerMap["ry_btn"] == E3D_INP_ALWAYS) || (this.inputTable[this.pointerMap["ry_btn"]])) {
            if (this.pointerMap["ry_axis"] == E3D_INP_X) this.ry_delta += this.mx * this._rotSpeed;
            if (this.pointerMap["ry_axis"] == E3D_INP_Y) this.ry_delta += this.my * this._rotSpeed;
            if (this.pointerMap["ry_axis"] == E3D_INP_W) this.ry_delta += this.mw * this._rotSpeed;
        }

        if ((this.pointerMap["rz_btn"] == E3D_INP_ALWAYS) || (this.inputTable[this.pointerMap["rz_btn"]])) {
            if (this.pointerMap["rz_axis"] == E3D_INP_X) this.rz_delta += this.mx * this._rotSpeed;
            if (this.pointerMap["rz_axis"] == E3D_INP_Y) this.rz_delta += this.my * this._rotSpeed;
            if (this.pointerMap["rz_axis"] == E3D_INP_W) this.rz_delta += this.mw * this._rotSpeed;
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
            } else if (this.rx_smth < min) {
                this.rx = min;
                this.rx_smth = min;
            }
        }
        if (y) {
            if (this.ry_smth > max) {
                this.ry = max;
                this.ry_smth = max;
            } else if (this.ry_smth < min) {
                this.ry = min;
                this.ry_smth = min;
            }
        }
        if (z) {
            if (this.rz_smth > max) {
                this.rz = max;
                this.rz_smth = max;
            } else if (this.rz_smth < min) {
                this.rz = min;
                this.rz_smth = min;
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
    checkCommand(cmd, reset = false) {
        let res = this.inputTable[this.keyMap[cmd]];        
        if (reset && res) this.inputTable[this.keyMap[cmd]] = false;
        return res;
    }


    // Keyboard Inputs


    keyDown(event) {
        if ((!event.metaKey) && (event.code != "F12") && (event.code != "ControlRight")) {
            if (event.preventDefault) event.preventDefault();
        }


        if ((this.inputDoneTable[event.code] == undefined) || (this.inputDoneTable[event.code] === true)) {
            this.inputTable[event.code] = true;   
            this.inputDoneTable[event.code] = false;
        }    

        if (this.onInput) this.onInput(event); // direct callback keydown preview

        //prevent scroll down on spacebar
        if ((event.target) && (event.target == document.body) && (event.code == " ")) event.preventDefault(); 
    }
    
    keyUp(event) {    

        if (this.onInput) this.onInput(event); // callback from event for user input dependant request to browser (fullscreen, pointerlock)

        if (this.inputTable[event.code] != undefined) {
            this.inputTable[event.code] = false;
            this.inputDoneTable[event.code] = true;
        }   



    }


    // Mouse Inputs


    mouseDown(event) {
        this.pinx = event.pageX; // store relative position
        this.piny = event.pageY;

        this.keyDown( { code : event.button } );

        if (event.preventDefault) { event.preventDefault(); };
        return false;
    }
    
    mouseUp(event) {
        this.keyUp( { code : event.button } );
        if (event.preventDefault) { event.preventDefault(); };
        return false;
    }
    
    mouseLeave() {
        for (let i = 0; i < 3; ++i) this.keyUp( { code : i } );
    }
    
    mouseMove(event) {
        this.mx += (event.pageX - this.pinx) * this._mouseSpeed;
        this.my += (event.pageY - this.piny) * this._mouseSpeed;

        this.pinx = event.pageX;
        this.piny = event.pageY;
    }
    
    mouseLockedMove(x, y) {
        this.mx += x * this._mouseSpeed;
        this.my += y * this._mouseSpeed;
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

        if (event.preventDefault) { event.preventDefault(); };

        for (var i = 0; i < event.changedTouches.length; i++) this.ongoingTouches.push(this.copyTouch(event.changedTouches[i]));

        if (this.ongoingTouches.length == 1) {
            //process as mouse down with single touch code
            this.ongoingTouches[0].button = this.touchMap["touch_single"];
            this.mouseDown(this.ongoingTouches[0]);

        } else if (this.ongoingTouches.length == 2) {
            //reset single touch mouse down
            this.ongoingTouches[0].button = this.touchMap["touch_single"];
            this.mouseUp(this.ongoingTouches[0]);

            //mousedown with double touch code
            this.ongoingTouches[0].button = this.touchMap["touch_double"];
            this.mouseDown( E3D_input.touchToButton( (this.ongoingTouches[0].pageX + this.ongoingTouches[1].pageX) / 2,
                                    (this.ongoingTouches[0].pageY + this.ongoingTouches[1].pageY) / 2,
                                    this.touchMap["touch_double"]) );

            var tdx = this.ongoingTouches[1].pageX - this.ongoingTouches[0].pageX;
            var tdy = this.ongoingTouches[1].pageY - this.ongoingTouches[0].pageY;
            this.touchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));
        }


        if (this.doubleTapping) {
            this.keyUp( { code : (this.ongoingTouches.length == 1) ? this.touchMap["doubleTap_single"] : this.touchMap["doubleTap_double"] } );
            this.keyDown( { code : (this.ongoingTouches.length == 1) ? this.touchMap["doubleTap_single"] : this.touchMap["doubleTap_double"] } );
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
            //if (this.liftTapCommand != "") {
            this.keyUp( { code : (this.ongoingTouches.length == 1) ? this.touchMap["lift_single"] : this.touchMap["lift_double"] } );
            this.keyDown( { code :  (this.ongoingTouches.length == 1) ? this.touchMap["lift_single"] : this.touchMap["lift_double"] } );
            //}
            this.liftTapping = false;
            if (this.liftTimer) { 
                clearTimeout(this.liftTimer); 
                this.liftTimer = false; 
            }
        }
    }


    touchEnd(event) {

        if (event.preventDefault) { event.preventDefault(); };
        
        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this.touchMap["touch_single"];
            this.mouseUp(this.ongoingTouches[0]);
        }
        
        if (this.ongoingTouches.length == 2) {
            this.ongoingTouches[0].button = this.touchMap["touch_double"];
            this.mouseUp(this.ongoingTouches[0]);
        }

        if (!this.liftTapping) {
            this.liftTapping = true;
            if (this.liftTimer) { 
                clearTimeout(this.liftTimer); 
                this.liftTimer = false; 
            }
            this.liftTimer = setTimeout( () => { this.liftTapping = false; }, this._doubleTapDelay );
        }
        
        //var touches = event.changedTouches;
        for (var i = 0; i < event.changedTouches.length; i++) {
            var idx = this.ongoingTouchIndexById(event.changedTouches[i].identifier);
            if (idx >= 0) this.ongoingTouches.splice(idx, 1);
           // else console.log("(touchEnd) Touch Id not found");
        }

        //this.keyUp( { code : this.touchMap["doubleTap_single"] } );
        //this.keyUp( { code : this.touchMap["doubleTap_double"] } );
    }


    /*touchCancel(event) {

        if (event.preventDefault && event.cancelable) { event.preventDefault(); };

        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this.touchMap["touch_single"];
            this.mouseUp(this.ongoingTouches[0]);
        }

        if (this.ongoingTouches.length == 2) {
            this.ongoingTouches[0].button = this.touchMap["touch_double"];
            this.mouseUp(this.ongoingTouches[0]);
        }

        //var touches = event.changedTouches;
        for (var i = 0; i < event.changedTouches.length; i++) {
            var idx = this.ongoingTouchIndexById(event.changedTouches[i].identifier);
            if (idx >= 0) this.ongoingTouches.splice(idx, 1);
        } 

        this.keyUp( { code : this.touchMap["doubleTap_single"] } );
        this.keyUp( { code : this.touchMap["doubleTap_double"] } );
    }*/

    touchMove(event) {

        if (event.preventDefault) { event.preventDefault(); };
        //var touches = event.changedTouches;

        for (var i = 0; i < event.changedTouches.length; i++) {
            var idx = this.ongoingTouchIndexById(event.changedTouches[i].identifier);
            if (idx >= 0) this.ongoingTouches.splice(idx, 1, this.copyTouch(event.changedTouches[i])); // swap in the new touch record
            //{
                
            //} else console.log("(touchMove) Touch Id not found");
        }


        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this.touchMap["touch_single"];
            this.mouseMove(this.ongoingTouches[0]);

        } else if (this.ongoingTouches.length == 2) {

            var tdx = this.ongoingTouches[1].pageX - this.ongoingTouches[0].pageX;
            var tdy = this.ongoingTouches[1].pageY - this.ongoingTouches[0].pageY;
            var newTouchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));

            // pinch panning
            this.ongoingTouches[0].button = this.touchMap["touch_double"];
            this.mouseMove( E3D_input.touchToButton( (this.ongoingTouches[0].pageX + this.ongoingTouches[1].pageX) / 2,
                                        (this.ongoingTouches[0].pageY + this.ongoingTouches[1].pageY) / 2,
                                        this.touchMap["touch_double"]) );

            if (Math.abs(this.touchDist - newTouchDist) > this._pinchHysteresis) { 
                //Pinch
               // var delta = (this.touchDist - newTouchDist) * this._mouseSpeed;
                this.mw += (this.touchDist - newTouchDist) * this._mouseSpeed; //delta;
                this.touchDist = newTouchDist;

             //   if (this.touchMap["pinch_axis"] == E3D_INP_X) this.mx += delta;
             //   if (this.touchMap["pinch_axis"] == E3D_INP_Y) this.my += delta;
             //   if (this.touchMap["pinch_axis"] == E3D_INP_W) this.mw += delta;
        /*
                // mouse wheel zoom
                var delta = (this.touchDist - newTouchDist) / Math.abs(this.touchDist - newTouchDist) * this._pinchHysteresis;
                this.mouseWheel({ deltaY: 5*((this.touchDist - newTouchDist) - delta) });
        */
            }

        } // 2 touches

    }

    static touchToButton(x, y, btn) {
        return { pageX: x, pageY: y, button: btn } ;
    }

    copyTouch(touch) {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, button: this.touchMap["touch_single"] };
    }

    ongoingTouchIndexById(idToFind) {
        for (var i = 0; i < this.ongoingTouches.length; i++) {
            var id = this.ongoingTouches[i].identifier;

            if (id == idToFind) {
                return i;
            }
        }
        return -1;    // not found
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
        this.inputClass.touchEnd( { changedTouches : [this.offsetTouch(event.changedTouches[0])]  } );
    }

    onTouchMove(event) {
        event.preventDefault();
        this.inputClass.touchMove( { changedTouches : [this.offsetTouch(event.changedTouches[0])] });
    }

    onTouchCancel(event) {
        event.preventDefault();
        this.inputClass.touchCancel( { changedTouches : [this.offsetTouch(event.changedTouches[0])]  });
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

        //this._doubleTapDelay = 200;
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

        // average touch, send mouse data
        element.addEventListener("touchstart", (e) => this.onTouchStart(e));
        element.addEventListener("touchend", (e) => this.onTouchEnd(e));
        element.addEventListener("touchmove", (e) => this.onTouchMove(e));
        element.addEventListener("touchcancel", (e) => this.onTouchEnd(e));

        element.addEventListener("resize", (e) => this.onResize(e));

        this.onResize();
    } 

    onResize() {
        let o = getTotalPageOffset(this.element);

        this.xMax = this.element.offsetWidth / 2;
        this.yMax = this.element.offsetHeight / 2;

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
                this.inputClass.keyUp( { code : this.inputClass.keyMap[this.doubleTapCommand] } );
                this.inputClass.keyDown( { code : this.inputClass.keyMap[this.doubleTapCommand] } );
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
                this.inputClass.keyUp( { code : this.inputClass.keyMap[this.liftTapCommand] } );
                this.inputClass.keyDown( { code : this.inputClass.keyMap[this.liftTapCommand] } );
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
        if (this.Touch == event.changedTouches[0].identifier) {
            this.Touch = -1;
          //  if (this.doubleTapCommand != "") this.inputClass.keyUp( { code : this.inputClass.keyMap[this.doubleTapCommand] } );
        }

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
    return { x: xo, y:yo };
}