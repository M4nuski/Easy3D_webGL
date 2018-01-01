class E3D_input {
    constructor (element, supportMouse, supportKeyboard, supportTouch, lockMouse, clampPitch= true, allowPan = true) {

        this.element = element;

        this.supportMouse = supportMouse;
        this.supportKeyboard = supportKeyboard;
        this.supportTouch = supportTouch;
        this.lockMouse = lockMouse;
        this.clampPitch = clampPitch;
        this.allowPan = allowPan;

        this.doPan = true;
        this.doRotate = true;
        this.mouseMoveWhenLockedOnly = false;

        this.touchDist = 0;        
        this.ongoingTouches = [];
        this.doubleTapping = false;

        this.inputTable = {};

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

        if (lockMouse) {
            if (pLockSupported) { 
                pLockMoveEvent = (x, y) => { this.mouseLockedMove(x, y) } ; 
            }
        } else console.log("Mouse lock requested but not supported");

        if (supportTouch) {
            element.addEventListener("touchstart", (e) => {this.touchStart(e) } );
            element.addEventListener("touchend", (e) => {this.touchEnd(e) } );
            element.addEventListener("touchcancel", (e) => {this.touchCancel(e) } );
            element.addEventListener("touchmove", (e) => {this.touchMove(e) } );
        }

        // Config
        this._pinchHysteresis = 10;
        this._rotateMouseButton = 0;
        this._panMouseButton = 1;

        this._moveSpeed = 50; // units per sec
        this._rotateSpeed = 90 * DegToRad; // rad per sec

        this._mouseSpeed = 0.0025;
        this._mouseWheelSpeed = 0.001;
        this._smooth = 6.0;

        this._doubleTapDelay = 200;

        // Keyboard Controls
        this.keyMap = {}; // this.keyMap[command name] = event.key
        this.keyMap["moveUp"] = " ";
        this.keyMap["moveDown"] = "c";

        this.keyMap["strafeLeft"] = "a";
        this.keyMap["strafeRight"] = "d";

        this.keyMap["moveForward"] = "w";
        this.keyMap["moveBackward"] = "s";

        this.keyMap["rollLeft"] = "q";
        this.keyMap["rollRight"] = "e";

        this.keyMap["action0"] = "Click"; // click on mouse lock, double tap on touch
        this.keyMap["action1"] = "f";


        // Mouse Controls
        this.panning = false;
        this.rotating = false;

        this.pinx=0;  this.px=0;  this.px_smth=0;
        this.piny=0;  this.py=0;  this.py_smth=0;
                      this.pz=0;  this.pz_smth=0; // no pin because wheel already gives delta
        this.rx=0; this.rx_sum=0; this.rx_smth=0;
        this.ry=0; this.ry_sum=0; this.ry_smth=0;
        this.rz=0; this.rz_sum=0; this.rz_smth=0;

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
        this.inputTable[event.key] = true;    
        if ((pLockActive) && (event.key == "Escape")) {
            pLockExit();
        }
        if ((event.target) && (event.target == document.body) && (event.key == " ")) event.preventDefault(); 
    }
    
    keyUp(event) {    
        if (this.inputTable[event.key] != undefined) {
            this.inputTable[event.key] = false;
        }    
    }

    processInputs(delta = 1.0) {
        if (this.inputTable[this.keyMap["moveUp"]]) {
            this.py -= this._moveSpeed * delta;
        }
        if (this.inputTable[this.keyMap["moveDown"]]) {
            this.py += this._moveSpeed * delta;
        }

        if (this.inputTable[this.keyMap["strafeLeft"]]) {
            this.px -= this._moveSpeed * delta;
        }
        if (this.inputTable[this.keyMap["strafeRight"]]) {
            this.px += this._moveSpeed * delta;
        }

        if (this.inputTable[this.keyMap["moveForward"]]) {
            this.pz -= this._moveSpeed * delta;
        }
        if (this.inputTable[this.keyMap["moveBackward"]]) {
            this.pz += this._moveSpeed * delta;
        }    

        if (this.inputTable[this.keyMap["rollRight"]]) {
            this.rz += this._rotateSpeed * delta;
        }
        if (this.inputTable[this.keyMap["rollLeft"]]) {
            this.rz -= this._rotateSpeed * delta;
        }    
        
        this.rx_sum += this.rx;
        this.ry_sum += this.ry;  
        this.rz_sum += this.rz;  
        
        // some clamping and warping      
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

        
        // smooth controls
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
    
        if (event.button == this._panMouseButton) {
            this.panning = this.allowPan;
        }
        if (event.button == this._rotateMouseButton) {
            this.rotating = true;
        }

        if (pLockActive) { 
            this.keyDown( { key : this.keyMap["action0"] } );
        } 

        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseUp(event) {
        if (event.button == this._panMouseButton) {
            this.panning = false;
        }
        if (event.button == this._rotateMouseButton) {
            this.rotating = false;
        }
    }
    
    mouseLeave(event) {
        this.panning = false;
        this.rotating = false;
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
        if (pLockActive) {
            this.rx += x * this._mouseSpeed * this._rotateSpeed;
            this.ry += y * this._mouseSpeed * this._rotateSpeed;
        }
    }
    
    mouseWheel(event) {    
        if (event.deltaY != 0) {
            this.pz += event.deltaY * this._mouseWheelSpeed * this._moveSpeed;
        }    
        if (event.preventDefault) { event.preventDefault(); };
    }
    
    mouseDblClick(event) {
        if (pLockSupported) {
            pLockRequest(this.element);
        }
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
            this.keyDown( { key : this.keyMap["action0"] } );
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
            this.inputClass.keyDown( { key : k } );
        }
        event.preventDefault();
    }

    vKeyUp(event) {
        let k = event.target.getAttribute("vKey");
        if (k) {
            this.inputClass.keyUp( { key : k } );
        }
    }

    vDblClk(event) {
        event.preventDefault();
    }
}

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





class E3D_input_virtual_thumbstick {
    constructor (element, inputClass) {

        this.inputClass = inputClass;
        this.element = element;

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
    }

    onTouchEnd(event) {
        event.preventDefault();
        if (this.Touch == event.changedTouches[0].identifier) {
            this.Touch = -1;
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