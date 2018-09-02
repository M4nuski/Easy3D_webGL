// https://www.html5rocks.com/en/tutorials/pointerlock/intro/


var pLockSupported = 'pointerLockElement' in document ||  'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var pLockMoveEvent; // callback for captured pointer movements
var pLockRequested = false;
var pLockElement; // element that captured the pointer
const _pLockJitterLimit = 100; // max delta per event to avoid warp-around when browser place the cursor back into the center after exiting the client area

function pLockRequest(element) {
    pLockElement = element;    
    if (pLockSupported) {
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock; 
        pLockRequested = true;
        element.requestPointerLock(); 
    } 
}

function pLockActive() {
    let plelm = document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement;
    return (pLockElement != undefined ) && (plelm == pLockElement);
}

function pLockExit() {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
    pLockRequested = false;
    //pLockElement = undefined;
    document.exitPointerLock();
}

function pLockToggle(element) {
  // pLockElement = element;
   console.log("active " + pLockActive());
   console.log("pre requested " + pLockRequested);
    pLockRequested = !pLockActive();
    if (pLockActive()) pLockExit();
    if (pLockRequested) {
        pLockRequest(element);
    } else {
        pLockExit();
    }
}

document.addEventListener('pointerlockchange', pLockChangeCallback, false);
document.addEventListener('mozpointerlockchange', pLockChangeCallback, false);
document.addEventListener('webkitpointerlockchange', pLockChangeCallback, false);

document.addEventListener('pointerlockerror', pLockErrorCallback, false);
document.addEventListener('mozpointerlockerror', pLockErrorCallback, false);
document.addEventListener('webkitpointerlockerror', pLockErrorCallback, false);

function pLockChangeCallback(event) {
    if (pLockActive()) {
            // Lock successful, add event
            pLockElement.addEventListener("mousemove", pLockInternalCallback, false);
    } else {

            // Lock failed, reset event
            pLockElement.removeEventListener("mousemove", pLockInternalCallback, false);
            pLockElement = undefined;
           // pLockExit();
    }
}

function pLockErrorCallback(event) {
    pLockElement.removeEventListener("mousemove", pLockInternalCallback, false);
    pLockElement = undefined;
    console.log("pointerLock Error");
    //pLockExit();
}

function pLockInternalCallback(event) {
    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    if (pLockMoveEvent) {
        if ((movementX < _pLockJitterLimit) && (movementX > -_pLockJitterLimit) && 
            (movementY < _pLockJitterLimit) && (movementY > -_pLockJitterLimit)) {
            pLockMoveEvent(movementX, movementY);
        }
    }
}


