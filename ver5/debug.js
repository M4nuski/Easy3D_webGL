// Easy3D_WebGL v0.5
// Debug script
// Emmanuel Charette 2020

// Visual markers
var E3D_DEBUG_SHOW_CD = false; // display hitboxes
var E3D_DEBUG_SHOW_HIT_RESULT = false; // mark final hit 
var E3D_DEBUG_SHOW_HIT_TEST = false; // mark all detected hits 
var E3D_DEBUG_SHOW_TRACE = false; // trace path of animations


// Logging
//E3D_DEBUG_VERBOSE is in main script loader "E3D_Engine.js"
var E3D_DEBUG_LOG_INPUT_STATES = false; // log mouse/touch enter/leave/click etc
var E3D_DEBUG_LOG_INPUT_MOVES = false; // log mouse/touch moves


// Stats
// Collision Detection
var E3D_DEBUG_CD_NB_TEST = 0; // number of hit tests
var E3D_DEBUG_CD_NB_HIT = 0; // number of final hit
var E3D_DEBUG_CD_NB_PASSES = 0;

// Data
// Collision Detection
var E3D_DEBUG_DATA_CD = new Map(); // process and result data from CD functions


// Entities
var phyTracers, dev_Hits; // TODO setup initialization and handling, change names