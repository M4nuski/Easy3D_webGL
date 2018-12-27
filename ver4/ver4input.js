// Easy3D_WebGL
// Human interface input classes and handlers
// Emmanuel Charette 2017-2019

// Bind events to an element to capture and manage inputs
class E3D_input {
    constructor (element, supportMouse, supportKeyboard, supportTouch, supportPointerLock, clampPitch= true, allowPan = true) {

        this.element = element;

        this.supportMouse = supportMouse;
        this.supportKeyboard = supportKeyboard;
        this.supportTouch = supportTouch;
        this.supportPointerLock = supportPointerLock;

        this.mouseMoveWhenLockedOnly = false;//TODO should be in engine logic

        this.touchDist = 0; // distance between 2 touches
        this.ongoingTouches = [];
        this.doubleTapping = false;

        this.inputTable = {}; // keys that are pressed down
        this.inputDoneTable = {}; // keys that got released but trigger again without keydown (keyboard auto-repeat)

        this.onInput = null; // callback for direct input change notification

        if (supportMouse) {
            element.addEventListener("mousedown", (e) => { this.mouseDown(e) } );
            element.addEventListener("mouseup", (e) => { this.mouseUp(e) } );
            element.addEventListener("mousemove", (e) => {this.mouseMove(e) } );
            element.addEventListener("mouseleave",(e) => { this.mouseLeave(e) } );
            element.addEventListener("wheel", (e) => {this.mouseWheel(e) } );
        }
        element.addEventListener("dblclick", (e) => {this.mouseDblClick(e) } );

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
            element.addEventListener("touchcancel", (e) => {this.touchCancel(e) } );
            element.addEventListener("touchmove", (e) => {this.touchMove(e) } );
        }

        // Config        
        this._posSpeed = 50; // units per sec
        this._rotSpeed = 90 * DegToRad; // rad per sec
        
        this._mouseSpeed = 0.0025; // units per mouse position delta 
        this._mouseWheelSpeed = 0.1; // units per wheel rotation delta
        
        this._doubleTapDelay = 200; //ms
        this._pinchHysteresis = 10; // How many pixels of difference between finger movements is to be still considered 0

        this._smooth = 6.0; // _smooth * delta >= 1.0 : non smoothed inputs. // todo move to game config

        // TODO callback on pointer lock / unlock to allow to record current values

        // button priority
        //this.buttonPriority = [0, 1, 2]; // TODO implement, otherwise always last btn input

        // mouse inputs:
        // click, doubleClick

        // mouse moves:
        // no button: x, y, w
        // lmb : x, y
        // mmb : x, y
        // rmb : x, y

        // touch inputs:
        // tap, doubleTap

        // touch moves:
        // tap-drag
        // pinch
        // pinch-drag

        this.touchMap = {};
        // ["tap"] = "0" // btn 0 1 2 ,   E3D_INP_LMB
        // ["doubleTap"] = "Click";  event.button

        this.pointerMap = {};

        // pointer map buttons : disabled, always on, lmb/touch, mmb/double touch, rmb
        // pointer map axis : x, y, w (wheel / pinch)
        // can be assigned to whatever, the name are just easy placeholders
        // (could have simply been axis0 to axis8 or input0 to input8)

        // p inputs, "position"
        this.pointerMap["px_btn"] = E3D_INP_RMB;
        this.pointerMap["px_axis"] = E3D_INP_X;

        this.pointerMap["py_btn"] = E3D_INP_RMB;
        this.pointerMap["py_axis"] = E3D_INP_Y;

        this.pointerMap["pz_btn"] = E3D_INP_MMB;
        this.pointerMap["pz_axis"] = E3D_INP_Y;

        // r inputs, "rotation", clamped +/- 360 deg
        this.pointerMap["rx_btn"] = E3D_INP_LMB;
        this.pointerMap["rx_axis"] = E3D_INP_Y;

        this.pointerMap["ry_btn"] = E3D_INP_LMB;
        this.pointerMap["ry_axis"] = E3D_INP_X;

        this.pointerMap["rz_btn"] = E3D_INP_MMB;
        this.pointerMap["rz_axis"] = E3D_INP_X;

        // key binds as rotation x/y/z +/- instead of premade aliases



        // Keyboard Controls, maps commands to keyboardEvent.code
        this.keyMap = {}; 
        // this.keyMap[command] = key.code;

        this.keyMap["px_dec"] = "KeyA";
        this.keyMap["px_inc"] = "KeyD";

        this.keyMap["py_dec"] = "KeyC";
        this.keyMap["py_inc"] = "Space";

        this.keyMap["pz_dec"] = "KeyS";
        this.keyMap["pz_inc"] = "KeyW";

        this.keyMap["rx_dec"] = "KeyF";
        this.keyMap["rx_inc"] = "KeyR";
        
        this.keyMap["ry_dec"] = "KeyQ";
        this.keyMap["ry_inc"] = "KeyE";

        this.keyMap["rz_dec"] = "KeyZ";
        this.keyMap["rz_inc"] = "KeyC";

        this.keyMap["togglePointerlock"] = "ControlRight";
        this.keyMap["toggleFullscreen"] = "F11";

        // "custom" actions, binds can be added for anything
        this.keyMap["action0"] = "Click"; // click on mouse lock, double tap on touch //TODO should be in engine logic, or constant defined
        // tap, double tap, double click ?
        this.keyMap["action2"] = "dblClick"; // click on mouse lock, double tap on touch //TODO should be in engine logic
        this.keyMap["action1"] = "KeyF";
        // Could also be this.keyMap["px_dec"] = E3D_INP_RMB;



        // Raw pointer data
        this.pinx = 0;
        this.piny = 0; 
        this.mx = 0;
        this.my = 0;
        this.mw = 0;

        // no pin because wheel already gives delta

// Outputs
    // Positions
        // Delta
        this.px_delta = 0;
        this.py_delta = 0;
        this.pz_delta = 0;
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

        this.px_delta = 0; this.py_delta = 0; this.pz_delta = 0;
        this.rx_delta = 0; this.ry_delta = 0; this.rz_delta = 0;

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
        if (this.inputTable[this.keyMap["rz_inc"]]) {
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
        if ((this.pointerMap["px_btn"] == E3D_INP_ALWAYS) || this.keyMap[this.pointerMap["px_btn"]]) {
            if (this.pointerMap["px_axis"] == E3D_INP_X) this.px_delta += this.mx * this._posSpeed;
            if (this.pointerMap["px_axis"] == E3D_INP_Y) this.px_delta += this.my * this._posSpeed;
            if (this.pointerMap["px_axis"] == E3D_INP_W) this.px_delta += this.mw * this._posSpeed;
        }

        if ((this.pointerMap["py_btn"] == E3D_INP_ALWAYS) || this.keyMap[this.pointerMap["py_btn"]]) {
            if (this.pointerMap["py_axis"] == E3D_INP_X) this.py_delta += this.mx * this._posSpeed;
            if (this.pointerMap["py_axis"] == E3D_INP_Y) this.py_delta += this.my * this._posSpeed;
            if (this.pointerMap["py_axis"] == E3D_INP_W) this.py_delta += this.mw * this._posSpeed;
        }

        if ((this.pointerMap["pz_btn"] == E3D_INP_ALWAYS) || this.keyMap[this.pointerMap["pz_btn"]]) {
            if (this.pointerMap["pz_axis"] == E3D_INP_X) this.pz_delta += this.mx * this._posSpeed;
            if (this.pointerMap["pz_axis"] == E3D_INP_Y) this.pz_delta += this.my * this._posSpeed;
            if (this.pointerMap["pz_axis"] == E3D_INP_W) this.pz_delta += this.mw * this._posSpeed;
        }

        // Rotations
        if ((this.pointerMap["rx_btn"] == E3D_INP_ALWAYS) || this.keyMap[this.pointerMap["rx_btn"]]) {
            if (this.pointerMap["rx_axis"] == E3D_INP_X) this.rx_delta += this.mx * this._rotSpeed;
            if (this.pointerMap["rx_axis"] == E3D_INP_Y) this.rx_delta += this.my * this._rotSpeed;
            if (this.pointerMap["rx_axis"] == E3D_INP_W) this.rx_delta += this.mw * this._rotSpeed;
        }

        if ((this.pointerMap["ry_btn"] == E3D_INP_ALWAYS) || this.keyMap[this.pointerMap["ry_btn"]]) {
            if (this.pointerMap["ry_axis"] == E3D_INP_X) this.ry_delta += this.mx * this._rotSpeed;
            if (this.pointerMap["ry_axis"] == E3D_INP_Y) this.ry_delta += this.my * this._rotSpeed;
            if (this.pointerMap["ry_axis"] == E3D_INP_W) this.ry_delta += this.mw * this._rotSpeed;
        }

        if ((this.pointerMap["rz_btn"] == E3D_INP_ALWAYS) || this.keyMap[this.pointerMap["rz_btn"]]) {
            if (this.pointerMap["rz_axis"] == E3D_INP_X) this.rz_delta += this.mx * this._rotSpeed;
            if (this.pointerMap["rz_axis"] == E3D_INP_Y) this.rz_delta += this.my * this._rotSpeed;
            if (this.pointerMap["rz_axis"] == E3D_INP_W) this.rz_delta += this.mw * this._rotSpeed;
        }
        
        this.px += this.px_delta * delta;
        this.py += this.py_delta * delta; 
        this.pz += this.pz_delta * delta;

        this.rx += this.rx_delta * delta;
        this.ry += this.ry_delta * delta;
        this.rz += this.rz_delta * delta;

        // Warp rotations
        if (this.rx < 0) { 
            this.rx += PIx2;
            this.rx_smth += PIx2;
        }
        if (this.rx > PIx2) { 
            this.rx -= PIx2; 
            this.rx_smth -= PIx2; 
        }

        if (this.ry < 0) { 
            this.ry += PIx2;
            this.ry_smth += PIx2;
        }
        if (this.ry > PIx2) { 
            this.ry -= PIx2; 
            this.ry_smth -= PIx2; 
        }

        if (this.rz < 0) { 
            this.rz += PIx2;
            this.rz_smth += PIx2;
        }
        if (this.rz > PIx2) { 
            this.rz -= PIx2; 
            this.rz_smth -= PIx2; 
        }


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

    smoothRotation(f, x = true, y = true, z = true) {
        let f = delta * this._smooth;

        if (f < 1.0) {
            if (x) this.rx_smth += (this.rx - this.rx_smth) * f;
            if (y) this.ry_smth += (this.ry - this.ry_smth) * f;
            if (z) this.rz_smth += (this.rz - this.rz_smth) * f;
        } else {
            this.rx_smth = this.rx;
            this.ry_smth = this.ry;
            this.rz_smth = this.rz;
        }
    }

    smoothPosition(f, x = true, y = true, z = true) {
        let f = delta * this._smooth;

        if (f < 1.0) {
            if (x) this.px_smth += (this.px - this.px_smth) * f;
            if (y) this.py_smth += (this.py - this.py_smth) * f;
            if (z) this.pz_smth += (this.pz - this.pz_smth) * f;
        } else {
            this.px_smth = this.px;
            this.py_smth = this.py;
            this.pz_smth = this.pz;
        }
    }

    // Check if a command has been triggered, and reset it if needed
    checkCommand(cmd, reset = false) {
        if (this.inputTable[this.keyMap[cmd]]) {
            if (reset) this.inputTable[this.keyMap[cmd]] = false;
            return true;
        } 
        return false;
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


        //if (this.onInput) this.onInput(); // direct callback keydown preview

       // if ((pLockActive) && (event.code == "Escape")) {
       //     pLockExit();
       // }
   //     if ((event.target) && (event.target == document.body) && (event.code == " ")) event.preventDefault(); 
    }
    
    keyUp(event) {    

        if (this.onInput) this.onInput(); // callback from event for user input dependant request to browser (fullscreen, pointerlock)

        if (this.inputTable[event.code] != undefined) {
            this.inputTable[event.code] = false;
            this.inputDoneTable[event.code] = true;
        }    
    }


    // Mouse Inputs


    mouseDown(event) {
        this.pinx = event.pageX; // store relative position
        this.piny = event.pageY; // TODO evaluate page vs screen

        this.keyDown( { code : event.button } );

        //if (pLockActive) { // TODO re-evaluate
        //    this.keyDown( { code : this.keyMap["action0"] } );
        //} 

        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseUp(event) {
        this.keyUp( { code : event.button } );
    }
    
    mouseLeave() {
        for (let i = 0; i < 3; ++i) this.keyUp( { code : i } );
    }
    
    mouseMove(event) {
        this.mx += (event.pageX - this.pinx) * this._mouseSpeed;
        this.my += (event.pageY - this.piny) * this._mouseSpeed;

        this.pinx = event.pageX; // TODO evaluate page vs screen
        this.piny = event.pageY;
    }
    
    mouseLockedMove(x, y) {
        // de facto rotating
       // if (pLockActive) { // todo re-evaluate
       //     this.rx += x * this._mouseSpeed * this._rotSpeed;
       //     this.ry += y * this._mouseSpeed * this._rotSpeed;
       // }

        this.mx += x * this._mouseSpeed;
        this.my += y * this._mouseSpeed;

    }
    
    mouseWheel(event) {   
        // Override cross browser/OS wheel delta discrepencies
        this.nw += (event.deltaY > 0) ? this._mouseWheelSpeed : -this._mouseWheelSpeed;

        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseDblClick(event) {
       // if (pLockSupported) {
        //    pLockRequest(this.element);
       // }

        this.keyDown( { code : "dbl" + event.button } );

        if (event.preventDefault) { event.preventDefault(); };
    }


    // Touch Inputs 


    touchStart(event) {

        if (event.preventDefault) { event.preventDefault(); };
        var touches = event.changedTouches;

        for (var i = 0; i < touches.length; i++) {

            this.ongoingTouches.push(this.copyTouch(touches[i]));
        }

        if (this.ongoingTouches.length == 1) {
            //process as mouse down
            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseDown(this.ongoingTouches[0]);

        } else if (this.ongoingTouches.length == 2) {
            //process as mouse up and then wheel / pan

            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseUp(this.ongoingTouches[0]);

            this.ongoingTouches[0].button = this._panMouseButton;

            this.mouseDown( E3D_input.touchToButton( (this.ongoingTouches[0].pageX + this.ongoingTouches[1].pageX) / 2,
                                    (this.ongoingTouches[0].pageY + this.ongoingTouches[1].pageY) / 2,
                                    this._panMouseButton) );

            var tdx = this.ongoingTouches[1].pageX - this.ongoingTouches[0].pageX;
            var tdy = this.ongoingTouches[1].pageY - this.ongoingTouches[0].pageY;

            this.touchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));
        }

        if (this.doubleTapping) {
            this.keyDown( { code : this.keyMap["action0"] } );
            this.doubleTapping = false;
        } else {
            this.doubleTapping = true;
            setTimeout( ()  => { this.doubleTapping = false; }, this._doubleTapDelay );
        }
    }


    touchEnd(event) {

        if (event.preventDefault) { event.preventDefault(); };
        var touches = event.changedTouches;

        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseUp(this.ongoingTouches[0]);
        }

        if (this.ongoingTouches.length == 2) {
            this.ongoingTouches[0].button = this._panMouseButton;
            this.mouseUp(this.ongoingTouches[0]);
        }

        for (var i = 0; i < touches.length; i++) {
            var idx = this.ongoingTouchIndexById(touches[i].identifier);
            if (idx >= 0) {
                this.ongoingTouches.splice(idx, 1);
            } 
            else console.log("(touchEnd) Touch Id not found");
        }
        this.keyUp( { code : this.keyMap["action0"] } );
    }

    touchCancel(event) {

        if (event.preventDefault) { event.preventDefault(); };

        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseUp(ongoingTouches[0]);
        }

        if (this.ongoingTouches.length == 2) {
            this.ongoingTouches[0].button = this._panMouseButton;
            this.mouseUp(this.ongoingTouches[0]);
        }

        var touches = event.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var idx = this.ongoingTouchIndexById(touches[i].identifier);
            this.ongoingTouches.splice(idx, 1);
        } 
    }

    touchMove(event) {

        if (event.preventDefault) { event.preventDefault(); };
        var touches = event.changedTouches;

        for (var i = 0; i < touches.length; i++) {
            var idx = this.ongoingTouchIndexById(touches[i].identifier);
            if (idx >= 0) {
                this.ongoingTouches.splice(idx, 1, this.copyTouch(touches[i]));  // swap in the new touch record
            } else console.log("(touchMove) Touch Id not found");
        }


        if (this.ongoingTouches.length == 1) {
            this.ongoingTouches[0].button = this._rotateMouseButton;
            this.mouseMove(this.ongoingTouches[0]);

        } else if (this.ongoingTouches.length == 2) {

            var tdx = this.ongoingTouches[1].pageX - this.ongoingTouches[0].pageX;
            var tdy = this.ongoingTouches[1].pageY - this.ongoingTouches[0].pageY;
            var newTouchDist = Math.sqrt((tdx * tdx) + (tdy * tdy));

            // pinch panning
            this.ongoingTouches[0].button = this._panMouseButton;
            this.mouseMove( E3D_input.touchToButton( (this.ongoingTouches[0].pageX + this.ongoingTouches[1].pageX) / 2,
                                        (this.ongoingTouches[0].pageY + this.ongoingTouches[1].pageY) / 2,
                                        this._panMouseButton) );

            if (Math.abs(this.touchDist - newTouchDist) > this._pinchHysteresis) {        
                // mouse wheel zoom
                var delta = (this.touchDist - newTouchDist) / Math.abs(this.touchDist - newTouchDist) * this._pinchHysteresis;
                this.mouseWheel({ deltaY: 5*((this.touchDist - newTouchDist) - delta) });
                this.touchDist = newTouchDist;
            }

        } // 2 touches

    }

    static touchToButton(x, y, btn) {
        return { pageX: x, pageY: y, button: btn } ;
    }

    copyTouch(touch) {
        return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY, button: this._rotateMouseButton };
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

        element.addEventListener("mousedown", (e) => this.vKeyDown(e) );
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

// Virtual trackpad handler from and DOM element
class E3D_input_virtual_trackpad {
    constructor (element, inputClass) {

        this.inputClass = inputClass;
        this.element = element;
        this.xScale = 1.0;
        this.yScale = 1.0;

        this.xOffset = 0;
        this.yOffset = 0;

        element.addEventListener("touchstart",  (e) => this.onTouchStart(e));
        element.addEventListener("touchend", (e) => this.onTouchEnd(e));
        element.addEventListener("touchmove", (e) => this.onTouchMove(e));
        element.addEventListener("touchcancel",  (e) => this.onTouchCancel(e));

        element.addEventListener("resize",  (e) => this.onResize(e));

        this.onResize();
    } 

    onResize(event) {
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




// Virtual thumb stick input from an DOM element
class E3D_input_virtual_thumbstick {
    constructor (element, inputClass, doubleTapCommand = "action0") {

        this.inputClass = inputClass;
        this.element = element;

        this.doubleTapCommand = doubleTapCommand;
        this._doubleTapDelay = 200;
        this.doubleTapping = false;

        this.Speed = 0.015; // touch to mouse factor
        this.Touch = -1; // current touch to follow (1st hit)

        // Center of element in pageX/Y
        this.xMid = 0.5;
        this.yMid = 0.5;

        this.xMax = 100;
        this.yMax = 100;

        // Current position
        this.x = 0;
        this.y = 0;

        // average touch, send mouse data
        element.addEventListener("touchstart",  (e) => this.onTouchStart(e));
        element.addEventListener("touchend", (e) => this.onTouchEnd(e));
        element.addEventListener("touchmove", (e) => this.onTouchMove(e));
        element.addEventListener("touchcancel",  (e) => this.onTouchEnd(e));

        element.addEventListener("resize",  (e) => this.onResize(e));

        this.onResize();
        //this.keyDown( { key : this.keyMap["action0"] } );
    } 

    onResize(event) {
        let o = getTotalPageOffset(this.element);

        this.xMax = this.element.offsetWidth / 2;
        this.yMax = this.element.offsetHeight / 2;

        this.xMid = o.x + this.xMax;
        this.yMid = o.y + this.yMax;
    }

    processInputs(xTarget = "rz", yTarget = "pz", delta = 1) {
        if (this.Touch != -1) {
            var dx = this.x - this.xMid;
            var dy = this.y - this.yMid; 

            if (dx < -this.xMax) dx = -this.xMax;
            if (dx >  this.xMax) dx =  this.xMax;
            if (dy < -this.yMax) dy = -this.yMax;
            if (dy >  this.yMax) dy =  this.yMax;
 

            var f = xTarget.indexOf("p") > -1 ? this.inputClass._moveSpeed : this.inputClass._rotateSpeed;  
            if (xTarget.indexOf("-") > -1) {
                f = -f;
                xTarget = xTarget.substring(1);
            }  
            this.inputClass[xTarget] += dx * this.Speed * delta * f;

            f = yTarget.indexOf("p") > -1 ? this.inputClass._moveSpeed : this.inputClass._rotateSpeed; 
            if (xTarget.indexOf("-") > -1) {
                f = -f;
                xTarget = xTarget.substring(1);
            }  
            this.inputClass[yTarget] += dy * this.Speed * delta * f;

        }
        //injection targets :
        //px : strafe left/right
        //pz : move forward/backward
        //rz : roll left/right
    }

    onTouchStart(event) {
        event.preventDefault();
        this.Touch = event.changedTouches[0].identifier;
        this.x = event.changedTouches[0].pageX;
        this.y = event.changedTouches[0].pageY;

        if (this.doubleTapping) {
            this.inputClass.keyDown( { code : this.inputClass.keyMap[this.doubleTapCommand] } );
            this.doubleTapping = false;
        } else {
            this.doubleTapping = true;
            setTimeout( ()  => { this.doubleTapping = false; }, this._doubleTapDelay );
        }

    }

    onTouchEnd(event) {
        event.preventDefault();
        if (this.Touch == event.changedTouches[0].identifier) {
            this.Touch = -1;
            this.inputClass.keyUp( { code : this.inputClass.keyMap[this.doubleTapCommand] } );
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