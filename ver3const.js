// Animation State and commands (exclusives)
const E3D_RESET = 0; // initial, back to start and pause, animator function should build the stateData object
const E3D_PLAY = 1;  // play
const E3D_PAUSE = 2; // pause
const E3D_RESTART = 3; // reset and play

// Scene State (exclusives)
const E3D_CREATED = 0;
const E3D_READY = 1;
const E3D_ACTIVE = 2;

const vec3_origin = vec3.fromValues(0, 0, 0);
const vec3_x = vec3.fromValues(1, 0, 0);
const vec3_y = vec3.fromValues(0, 1, 0);
const vec3_z = vec3.fromValues(0, 0, 1);

const mat4_identity = mat4.create();

var vec3_dummy = vec3.create();
var mat4_dummy = mat4.create();