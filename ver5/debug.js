// Easy3D_WebGL v0.5
// Debug script
// Emmanuel Charette 2020

// Visual markers

// CD hit box
var E3D_DEBUG_SHOW_CD_ENTITY = null;
function E3D_DEBUG_HIDE_CD() {
    if (E3D_DEBUG_SHOW_CD_ENTITY != null) E3D_DEBUG_SHOW_CD_ENTITY.isVisible = false;
}
function E3D_DEBUG_SHOW_CD() {
    // Create or show entity
    if (E3D_DEBUG_SHOW_CD_ENTITY == null) {
        E3D_DEBUG_SHOW_CD_ENTITY = new E3D_entity_wireframe_canvas("E3D_DEBUG_SHOW_CD_ENTITY");
        addEntity(E3D_DEBUG_SHOW_CD_ENTITY);
        E3D_DEBUG_SHOW_CD_ENTITY.isVisibiltyCullable = false;
    }

    E3D_DEBUG_SHOW_CD_ENTITY.isVisible = true;
    E3D_DEBUG_SHOW_CD_ENTITY.clear();

    for (let i = 0; i < ENTITIES.length; ++i) {

        // vis culling
        if (ENTITIES[i].isVisibiltyCullable) E3D_DEBUG_SHOW_CD_ENTITY.addSphere(ENTITIES[i].position, ENTITIES[i].cull_dist * 2, _v3_orange, 24, false);

        // sph
        for (let j = 0; j < ENTITIES[i].CD_sph; ++j) E3D_DEBUG_SHOW_CD_ENTITY.addSphere(ENTITIES[i].CD_sph_p[j], ENTITIES[i].CD_sph_r[j] * 2, _v3_lightred, 4, false);

        // plane
        for (let j = 0; j < ENTITIES[i].CD_plane; ++j) {
            E3D_DEBUG_SHOW_CD_ENTITY.addLineByPosNormLen(ENTITIES[i].CD_plane_p[j], ENTITIES[i].CD_plane_n[j], 10, _v3_white);

            E3D_DEBUG_SHOW_CD_ENTITY.addLineByPosNormLen(ENTITIES[i].CD_plane_p[j], ENTITIES[i].CD_plane_w[j],  ENTITIES[i].CD_plane_halfWidth[j], _v3_lightred);
            E3D_DEBUG_SHOW_CD_ENTITY.addLineByPosNormLen(ENTITIES[i].CD_plane_p[j], ENTITIES[i].CD_plane_w[j], -ENTITIES[i].CD_plane_halfWidth[j], _v3_red);

            E3D_DEBUG_SHOW_CD_ENTITY.addLineByPosNormLen(ENTITIES[i].CD_plane_p[j], ENTITIES[i].CD_plane_h[j],  ENTITIES[i].CD_plane_halfHeight[j], _v3_lightgreen);
            E3D_DEBUG_SHOW_CD_ENTITY.addLineByPosNormLen(ENTITIES[i].CD_plane_p[j], ENTITIES[i].CD_plane_h[j], -ENTITIES[i].CD_plane_halfHeight[j], _v3_green);
        }

        // edge
        for (let j = 0; j < ENTITIES[i].CD_edge; ++j) E3D_DEBUG_SHOW_CD_ENTITY.addLineByPosNormLen(ENTITIES[i].CD_edge_p[j], ENTITIES[i].CD_edge_n[j], ENTITIES[i].CD_edge_l[j], _v3_orange);

        // box
        for (let j = 0; j < ENTITIES[i].CD_box; ++j) {
            E3D_DEBUG_SHOW_CD_ENTITY.addLine( ENTITIES[i].CD_box_edge_p[j][_CD_box_corner_TopBackRight],
                            ENTITIES[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontLeft], false, _v3_orange);

            E3D_DEBUG_SHOW_CD_ENTITY.addLine( ENTITIES[i].CD_box_edge_p[j][_CD_box_corner_TopBackLeft],
                            ENTITIES[i].CD_box_edge_p[j][_CD_box_corner_BottomFrontRight], false, _v3_orange);

            E3D_DEBUG_SHOW_CD_ENTITY.addLine( ENTITIES[i].CD_box_edge_p[j][_CD_box_corner_BottomBackRight],
                            ENTITIES[i].CD_box_edge_p[j][_CD_box_corner_TopFrontLeft], false, _v3_orange);

            E3D_DEBUG_SHOW_CD_ENTITY.addLine( ENTITIES[i].CD_box_edge_p[j][_CD_box_corner_BottomBackLeft],
                            ENTITIES[i].CD_box_edge_p[j][_CD_box_corner_TopFrontRight], false, _v3_orange);
        }

        // triangle
        var midpoint = [0,0,0];
        var p2 = [0,0,0];
        var p3 = [0,0,0];
        for (let j = 0; j < ENTITIES[i].CD_triangle; ++j) {
            v3_add_res(p2, ENTITIES[i].CD_triangle_p1[j], ENTITIES[i].CD_triangle_p2p1[j]);
            v3_add_res(p3, ENTITIES[i].CD_triangle_p1[j], ENTITIES[i].CD_triangle_p3p1[j]);
            v3_avg3_res(midpoint, ENTITIES[i].CD_triangle_p1[j], p2, p3);

            E3D_DEBUG_SHOW_CD_ENTITY.addLineByPosNormLen(midpoint, ENTITIES[i].CD_triangle_n[j], 10, _v3_white);
            E3D_DEBUG_SHOW_CD_ENTITY.addLine(midpoint, ENTITIES[i].CD_triangle_p1[j], false, _v3_lightred);
            E3D_DEBUG_SHOW_CD_ENTITY.addLine(midpoint, p2, false, _v3_lightgreen);
            E3D_DEBUG_SHOW_CD_ENTITY.addLine(midpoint, p3, false, _v3_lightblue);
        }
    }
}

// Logging
//E3D_DEBUG_VERBOSE is in main script loader "E3D_Engine.js"
var E3D_DEBUG_LOG_TIMESTAMPS = false;
var E3D_DEBUG_LOG_INPUT_STATES = false; // log mouse/touch enter/leave/click etc
var E3D_DEBUG_LOG_INPUT_MOVES = false; // log mouse/touch moves
var E3D_DEBUG_LOG_INPUT_MODE = false; // log fullscreen, mouse lock


// Stats
// Rendering
var E3D_DEBUG_RENDER_NB_ELEMENTS = 0;
var E3D_DEBUG_RENDER_NB_ENTITIES = 0;

// Collision Detection
var E3D_DEBUG_CD_NB_TEST = 0; // number of hit tests
var E3D_DEBUG_CD_NB_HIT = 0; // number of final hit
var E3D_DEBUG_CD_NB_PASSES = 0; // number of CD passes for this current frame

// Data
// Collision Detection
var E3D_DEBUG_DATA_CD = new Map(); // process and result data from CD functions
function DEBUG_FORMAT_DATA_CD(precision = 4, length = 30) {
    var result = "";
    for (var [k, v] of E3D_DEBUG_DATA_CD) tc += justify(k, v.toFixed(precision), length) + "\n";
    return result;
}

// Collision detection hit test markers
var E3D_DEBUG_SHOW_HITTEST_ENTITY = null;
var _E3D_DEBUG_SHOW_HITTEST = false;
function E3D_DEBUG_HIDE_HITTEST() {
    if (E3D_DEBUG_SHOW_HITTEST_ENTITY != null) E3D_DEBUG_SHOW_HITTEST_ENTITY.isVisible = false;
    _E3D_DEBUG_SHOW_HITTEST = false;
}
function E3D_DEBUG_CLEAR_HITTEST() {
    if (E3D_DEBUG_SHOW_HITTEST_ENTITY != null) E3D_DEBUG_SHOW_HITTEST_ENTITY.clear();
}
function E3D_DEBUG_SHOW_HITTEST() {
    // Create or show entity
    if (E3D_DEBUG_SHOW_HITTEST_ENTITY == null) {
        E3D_DEBUG_SHOW_HITTEST_ENTITY = new E3D_entity_wireframe_canvas("E3D_DEBUG_SHOW_HITTEST_ENTITY", 1024 * 32 * 6); // 32k lines
        addEntity(E3D_DEBUG_SHOW_HITTEST_ENTITY);
        E3D_DEBUG_SHOW_HITTEST_ENTITY.isVisibiltyCullable = false;
    }
    E3D_DEBUG_SHOW_HITTEST_ENTITY.isVisible = true;
    _E3D_DEBUG_SHOW_HITTEST = true;
}
// TODO function E3D_DEBUG_HITTEST_SPHERE(...) _LINE _CROSS
// if (_E3D_DEBUG_SHOW_HITTEST) {E3D_DEBUG_SHOW_HITTEST_ENTITY.addSphere(...)}

// Collision detection detected hits markers
var E3D_DEBUG_SHOW_HIT_ENTITY = null;
var _E3D_DEBUG_SHOW_HIT = false;
function E3D_DEBUG_HIDE_HIT() {
    if (E3D_DEBUG_SHOW_HIT_ENTITY != null) E3D_DEBUG_SHOW_HIT_ENTITY.isVisible = false;
    _E3D_DEBUG_SHOW_HIT = false;
}
function E3D_DEBUG_CLEAR_HIT() {
    if (E3D_DEBUG_SHOW_HIT_ENTITY != null) E3D_DEBUG_SHOW_HIT_ENTITY.clear();
}
function E3D_DEBUG_SHOW_HIT() {
    // Create or show entity
    if (E3D_DEBUG_SHOW_HIT_ENTITY == null) {
        E3D_DEBUG_SHOW_HIT_ENTITY = new E3D_entity_wireframe_canvas("E3D_DEBUG_SHOW_HIT_ENTITY", 1024 * 32 * 6); // 32k lines
        addEntity(E3D_DEBUG_SHOW_HIT_ENTITY);
        E3D_DEBUG_SHOW_HIT_ENTITY.isVisibiltyCullable = false;
    }
    E3D_DEBUG_SHOW_HIT_ENTITY.isVisible = true;
    _E3D_DEBUG_SHOW_HIT = true;
}
// TODO function E3D_DEBUG_HIT_SPHERE(...) _LINE _CROSS
// if (_E3D_DEBUG_SHOW_HIT) {E3D_DEBUG_SHOW_HIT_ENTITY.addSphere(...)}

// Animation path markers
var E3D_DEBUG_SHOW_PATH_ENTITY = null;

function E3D_DEBUG_HIDE_PATH() {
    if (E3D_DEBUG_SHOW_PATH_ENTITY != null) E3D_DEBUG_SHOW_PATH_ENTITY.isVisible = false;

}
function E3D_DEBUG_CLEAR_PATH() {
    if (E3D_DEBUG_SHOW_PATH_ENTITY != null) E3D_DEBUG_SHOW_PATH_ENTITY.clear();
}
function E3D_DEBUG_SHOW_PATH() {
    // Create or show entity
    if (E3D_DEBUG_SHOW_PATH_ENTITY == null) {
        E3D_DEBUG_SHOW_PATH_ENTITY = new E3D_entity_wireframe_canvas("E3D_DEBUG_SHOW_PATH_ENTITY", 1024 * 64 * 6); // 64k lines
        addEntity(E3D_DEBUG_SHOW_PATH_ENTITY);
        E3D_DEBUG_SHOW_PATH_ENTITY.isVisibiltyCullable = false;
    }
    E3D_DEBUG_SHOW_PATH_ENTITY.isVisible = true;

    for (var i = 0; i < ENTITIES.length; ++i) if (ANIMATIONS[i] != null) E3D_DEBUG_SHOW_PATH_ENTITY.addLine(ANIMATIONS[i].last_position, ENTITIES[i].position, true);

}

// Animation direction markers
var E3D_DEBUG_SHOW_DIR_ENTITY = null;
var _E3D_DEBUG_SHOW_DIR = false;

function E3D_DEBUG_HIDE_DIR() {
    if (E3D_DEBUG_SHOW_DIR_ENTITY != null) E3D_DEBUG_SHOW_DIR_ENTITY.isVisible = false;
    _E3D_DEBUG_SHOW_DIR = false;

}
function E3D_DEBUG_SHOW_DIR() {
    // Create or show entity
    if (E3D_DEBUG_SHOW_DIR_ENTITY == null) {
        E3D_DEBUG_SHOW_DIR_ENTITY = new E3D_entity_wireframe_canvas("E3D_DEBUG_SHOW_DIR_ENTITY", 1024 * 64 * 6); // 64k lines
        addEntity(E3D_DEBUG_SHOW_DIR_ENTITY);
        E3D_DEBUG_SHOW_DIR_ENTITY.isVisibiltyCullable = false;
    }
    E3D_DEBUG_SHOW_DIR_ENTITY.isVisible = true;
    _E3D_DEBUG_SHOW_DIR = true;

    E3D_DEBUG_SHOW_DIR_ENTITY.clear();
}

function E3D_DEBUG_DIR_ADDLINE_2P(p1, p2) {
    var delta = v3_sub_new(p2, p1);
    if (_E3D_DEBUG_SHOW_DIR) E3D_DEBUG_SHOW_DIR_ENTITY.addLineByPosNormLen(p1, delta, 10, false, _v3_green);
}
function E3D_DEBUG_DIR_ADDLINE_PN(p, n) {
    if (_E3D_DEBUG_SHOW_DIR) E3D_DEBUG_SHOW_DIR_ENTITY.addLineByPosNormLen(p, n, 10, false, _v3_green);
}