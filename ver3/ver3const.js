// Animation State and commands (exclusives)
const E3D_RESET = 0; // initial, back to start and pause, animator function should build the stateData object
const E3D_PLAY = 1;  // play
const E3D_PAUSE = 2; // pause
const E3D_RESTART = 3; // reset and play

// Scene State (exclusives)
const E3D_CREATED = 0;
const E3D_READY = 1;
const E3D_ACTIVE = 2;

// Ressource Callback
const E3D_RES_FAIL = 0;
const E3D_RES_LOAD = 1;
const E3D_RES_ALL = 2;

// Premade vec and mat to avoid inline creation of instances
const vec3_origin = vec3.fromValues(0, 0, 0);
const vec3_x = vec3.fromValues(1, 0, 0);
const vec3_y = vec3.fromValues(0, 1, 0);
const vec3_z = vec3.fromValues(0, 0, 1);

const mat4_identity = mat4.create();

// Dummy containers to capture temporary results without affecting parameters
var vec3_dummy = vec3.create();
var mat4_dummy = mat4.create();

// General mathematical constants
const PIdiv2 = Math.PI / 2.0;
const PIx2 = Math.PI * 2.0;

const RadToDeg = (180.0 / Math.PI);
const DegToRad = (Math.PI / 180.0);