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
        this.clampPitch = clampPitch;//TODO should be in engine logic
        this.allowPan = allowPan; //TODO should be in engine logic

        this.doPan = true;//TODO should be in engine logic
        this.doRotate = true;//TODO should be in engine logic
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
        this._pinchHysteresis = 10; // How many pixels of difference between finger movements is to be still considered 0
        this._rotateMouseButton = 0; // TODO remove
        this._panMouseButton = 1;// TODO remove

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
        // ["tap"] = "0" // btn 0 1 2 ,  E3D_INP_MAP_prefix + E3D_INP_LMB
        // ["doubleTap"] = "Click"; E3D_INP_MAP_prefix + event.button

        this.pointerMap = {};

        // pointer map buttons : disabled, always on, lmb/touch, mmb/double touch, rmb
        // pointer map axis : x, y, w (wheel / pinch)
        // can be assigned to whatever, the name are just easy placeholders
        // (could have simply been axis0 to axis8 )

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

        this._moveSpeed = 50; // units per sec
        this._rotateSpeed = 90 * DegToRad; // rad per sec

        this._mouseSpeed = 0.0025; // units per mouse position delta 
        this._mouseWheelSpeed = 0.1; // units per wheel rotation delta
        this._smooth = 6.0; // _smooth * delta >= 1.0 : non smoothed inputs. 

        this._doubleTapDelay = 200; //ms

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
        this.keyMap["action0"] = "Click"; // click on mouse lock, double tap on touch //TODO should be in engine logic
        // tap, double tap, double click ?
        this.keyMap["action0"] = "Click"; // click on mouse lock, double tap on touch //TODO should be in engine logic
        this.keyMap["action1"] = "KeyF";

        // Mouse Controls
       // this.panning = false;
//        this.rotating = false;

        this.pinx=0;  this.px=0;  this.px_smth=0;
        this.piny=0;  this.py=0;  this.py_smth=0;
                      this.pz=0;  this.pz_smth=0; // no pin because wheel already gives delta
        this.rx=0; this.rx_sum=0; this.rx_smth=0;
        this.ry=0; this.ry_sum=0; this.ry_smth=0;
        this.rz=0; this.rz_sum=0; this.rz_smth=0;

        // outputs :
/*
        .px_delta
        .py_delta
        .pz_delta
        .px_abs
        .py_abs
        .pz_abs
        .px_smth
        .py_smth
        .pz_smth

        .rx_delta
        .ry_delta
        .rz_delta
        .rx_abs
        .ry_abs
        .rz_abs
        .rx_smth
        .ry_smth
        .rz_smth

*/

// clampR (min, max, x, y, z)
// clampP (min, max, x, y, z)
// smoothR (f, x, y, z)
// smoothP (f, x, y, z)

    }

    checkCommand(cmd, reset = false) {
        if (this.inputTable[this.keyMap[cmd]]) {
            if (reset) this.inputTable[this.keyMap[cmd]] = false;
            return true;
        } 
        return false;
    }


    // Keyboard Inputs


    keyDown(event) {
        if ((!event.metaKey) && (event.code != "F12")  && (event.code != "ControlRight")) {
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

    processInputs(delta = 1.0) {
        // Pos
        if (this.inputTable[this.keyMap["px_dec"]]) {
            this.px -= this._moveSpeed * delta;
        }
        if (this.inputTable[this.keyMap["px_inc"]]) {
            this.px += this._moveSpeed * delta;
        }

        if (this.inputTable[this.keyMap["py_dec"]]) {
            this.py -= this._moveSpeed * delta;
        }
        if (this.inputTable[this.keyMap["py_inc"]]) {
            this.py += this._moveSpeed * delta;
        }

        if (this.inputTable[this.keyMap["pz_dec"]]) {
            this.pz -= this._moveSpeed * delta;
        }
        if (this.inputTable[this.keyMap["pz_inc"]]) {
            this.pz += this._moveSpeed * delta;
        }    

        // Rot
        if (this.inputTable[this.keyMap["rx_dec"]]) {
            this.rx -= this._rotateSpeed * delta;
        }
        if (this.inputTable[this.keyMap["rx_inc"]]) {
            this.rx += this._rotateSpeed * delta;
        }    

        if (this.inputTable[this.keyMap["ry_dec"]]) {
            this.ry -= this._rotateSpeed * delta;
        }
        if (this.inputTable[this.keyMap["rz_inc"]]) {
            this.ry += this._rotateSpeed * delta;
        }    

        if (this.inputTable[this.keyMap["rz_dec"]]) {
            this.rz -= this._rotateSpeed * delta;
        }
        if (this.inputTable[this.keyMap["rz_inc"]]) {
            this.rz += this._rotateSpeed * delta;
        }    
        
        this.rx_sum += this.rx;
        this.ry_sum += this.ry;  
        this.rz_sum += this.rz;  
        
        // some clamping and warping      // todo extract to own method
        if (this.clampPitch) {  
            if (this.ry_sum < -PIdiv2) { this.ry_sum = -PIdiv2; }
            if (this.ry_sum >  PIdiv2) { this.ry_sum =  PIdiv2; }
        } else {
            if (this.ry_sum < 0) { 
                this.ry_sum += PIx2;
                this.ry_smth += PIx2;
            }
            if (this.ry_sum > PIx2) { 
                this.ry_sum -= PIx2; 
                this.ry_smth -= PIx2; 
            }
        }
        if (this.rx_sum < 0) { 
            this.rx_sum += PIx2;
            this.rx_smth += PIx2;
        }
        if (this.rx_sum > PIx2) { 
            this.rx_sum -= PIx2; 
            this.rx_smth -= PIx2; 
        }

        if (this.rz_sum < 0) { 
            this.rz_sum += PIx2;
            this.rz_smth += PIx2;
        }
        if (this.rz_sum > PIx2) { 
            this.rz_sum -= PIx2; 
            this.rz_smth -= PIx2; 
        }

        
        // smooth controls // TODO extract to own method
        let f = delta * this._smooth;
        if (f < 1.0) {
            this.rx_smth += (this.rx_sum - this.rx_smth) * f;
            this.ry_smth += (this.ry_sum - this.ry_smth) * f;
            this.rz_smth += (this.rz_sum - this.rz_smth) * f;
            
            this.px_smth += (this.px - this.px_smth) * f;
            this.py_smth += (this.py - this.py_smth) * f;
            this.pz_smth += (this.pz - this.pz_smth) * f;
        } else {
            this.rx_smth = this.rx_sum;
            this.ry_smth = this.ry_sum;
            this.rz_smth = this.rz_sum;
            
            this.px_smth = this.px;
            this.py_smth = this.py;
            this.pz_smth = this.pz;
        }

            // clean up state changes
        this.px = 0; this.py = 0; this.pz = 0;
        this.rx = 0; this.ry = 0; this.rz = 0;
    }



    // Mouse Inputs


    mouseDown(event) {
        this.pinx = event.pageX; // store relative ref
        this.piny = event.pageY;

        this.keyDown( { code : this.keyMap[E3D_INP_MAP_prefix + event.button] } );

/*    
        if (event.button == this._panMouseButton) {
            this.panning = this.allowPan;
        }
        if (event.button == this._rotateMouseButton) {
            this.rotating = true;
        }
*/

        if (pLockActive) { // TODO re-evaluate
            this.keyDown( { code : this.keyMap["action0"] } );
        } 

        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseUp(event) {

        this.keyUp( { code : this.keyMap[E3D_INP_MAP_prefix + event.button] } );
        /*
        if (event.button == this._panMouseButton) {
            this.panning = false;
        }
        if (event.button == this._rotateMouseButton) {
            this.rotating = false;
        }
        */

        if (pLockActive) { // TODO re-evaluate
            this.keyUp( { code : this.keyMap["action0"] } );
        } 
    }
    
    mouseLeave() {
        /*this.panning = false;
        this.rotating = false;*/
        // TODO : reset on leave ? keyup all mouse button inputs
    }
    
    mouseMove(event) {
        const mx = event.pageX;
        const my = event.pageY;
        
        if (this.panning) {
            this.px -= (mx - this.pinx) * this._mouseSpeed * this._moveSpeed;
            this.py -= (my - this.piny) * this._mouseSpeed * this._moveSpeed;
        }
        
        if (this.rotating) {
            this.rx += (mx - this.pinx) * this._mouseSpeed * this._rotateSpeed;
            this.ry += (my - this.piny) * this._mouseSpeed * this._rotateSpeed;
        }
        
        this.pinx = mx;
        this.piny = my;
    }
    
    mouseLockedMove(x, y) {
        // de facto rotating
        if (pLockActive) { // todo re-evaluate
            this.rx += x * this._mouseSpeed * this._rotateSpeed;
            this.ry += y * this._mouseSpeed * this._rotateSpeed;
        }
    }
    
    mouseWheel(event) {    
        if (event.deltaY > 0) {
            this.pz += this._mouseWheelSpeed * this._moveSpeed;
        } else if (event.deltaY < 0) {
            this.pz -= this._mouseWheelSpeed * this._moveSpeed;
        } 

        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseDblClick(event) {
       // if (pLockSupported) {
        //    pLockRequest(this.element);
       // }
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