// https://www.html5rocks.com/en/tutorials/pointerlock/intro/


var pLockSupported = 'pointerLockElement' in document ||  'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
var pLockMoveEvent;
var pLockActive = false;
var pLockElement;

function pLockRequest(element) {
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock; 
    pLockElement = element;
    pLockActive = false;
    element.requestPointerLock();  
}

function pLockExit() {
    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
    pLockActive = false;
    document.exitPointerLock();
}

document.addEventListener('pointerlockchange', pLockChangeCallback, false);
document.addEventListener('mozpointerlockchange', pLockChangeCallback, false);
document.addEventListener('webkitpointerlockchange', pLockChangeCallback, false);
document.addEventListener('pointerlockerror', pLockErrorCallback, false);
document.addEventListener('mozpointerlockerror', pLockErrorCallback, false);
document.addEventListener('webkitpointerlockerror', pLockErrorCallback, false);


function pLockChangeCallback(event) {
    if (document.pointerLockElement === pLockElement ||
        document.mozPointerLockElement === pLockElement ||
        document.webkitPointerLockElement === pLockElement) {
            // Lock successful, add event
            pLockElement.addEventListener("mousemove", pLockInternalCallback, false);
            pLockActive = true;
    } else {
            // Lock failed, reset event
            pLockElement.removeEventListener("mousemove", pLockInternalCallback, false);
            pLockExit();
    }
}

function pLockErrorCallback(event) {
    pLockElement.removeEventListener("mousemove", pLockInternalCallback, false);
    pLockExit();
}

function pLockInternalCallback(event) {
    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    if (pLockMoveEvent) {
        pLockMoveEvent(movementX, movementY);
    }
}


