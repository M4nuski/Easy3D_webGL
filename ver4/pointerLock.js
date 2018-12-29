// Easy3D_WebGL
// Pointer lock classes and handlers
// Emmanuel Charette 2017-2019

"use strict"

// https://www.html5rocks.com/en/tutorials/pointerlock/intro/


var pLockSupported = 'pointerLockElement' in document ||  'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var pLockMoveEvent; // callback for captured pointer movements
var pLockCallback; // callback for lock/unlock/error
var pLockRequested = false;
var pLockElement; // element that captured the pointer
const _pLockJitterLimit = 300; // max delta per event to avoid warp-around when browser place the cursor back into the center after exiting the client area

function pLockRequest(element) {
    pLockElement = element;    
    if (pLockSupported) {
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock; 
        pLockRequested = true;
        element.requestPointerLock(); 
        if (pLockCallback) pLockCallback("request");
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
    if (pLockCallback) pLockCallback("toggle (was active: " + pLockActive() + ", was pre requested: " + pLockRequested + ")");
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

function pLockChangeCallback() {
    if (pLockActive()) {
        // Lock successful, add event
        pLockElement.addEventListener("mousemove", pLockInternalCallback, false);
        if (pLockCallback) pLockCallback("lock");
    } else {

        // Lock failed, reset event
        pLockElement.removeEventListener("mousemove", pLockInternalCallback, false);
        pLockElement = undefined;
        // pLockExit();
        if (pLockCallback) pLockCallback("unlock");
    }
}

function pLockErrorCallback() {
    pLockElement.removeEventListener("mousemove", pLockInternalCallback, false);
    pLockElement = undefined;
    if (pLockCallback) pLockCallback("error");
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


