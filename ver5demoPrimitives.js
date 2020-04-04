// Easy3D_WebGL
// Main demo program for version 0.5
// Generation and loading of shape primitives simple out-of-engine animation
// Emmanuel Charette 2020

"use strict"


function E3D_userInit() {

var paramText = document.getElementById("params");

    log("E3D_userInit");
    
    // Load all default engine parts: scene, lights, timer, inputs, camera
    E3D_InitAll();
    
    
    // Create the entities
    var groundEntity = new E3D_entity_wireframe_canvas("entity0");
    // Large ground plane
    groundEntity.addPlane(_v3_origin, _v3_90x, 2048, 2048, 128, _v3_lightgray);
    groundEntity.isVisible = true;
    E3D_addEntity(groundEntity);
    
    // Move the camera back and up a little, add some nod 
    CAMERA.moveTo(0, 80, 100, 0.5);
    

    

    var meshLoader = new E3D_mesh();
    // Create a solid cube
    var entity = new E3D_entity("entity1", "", true); // dynamic entity, GPU data will be updated when changed

    // Create mesh
    meshLoader.pushBox(_v3_origin, _v3_null, 48, 48, 48);
    paramText.innerText = "Box 48.00 x 48.00 x 48.00";

    // Change colors
    for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

    // Load data from mesh to entity
    meshLoader.addModelData(entity);

    // Setup entity
    entity.isVisible = true;
    entity.position = [0, 24, 0];
    E3D_addEntity(entity);


    // checkboxes
    var check_colored = document.getElementById("chk_colored");
    if (!check_colored) check_colored = { checked: false }; 
    var check_smooth = document.getElementById("chk_smooth");
    if (!check_smooth) check_smooth = { checked: false }; 

    // Register the button events
    var btn = document.getElementById("btn_s1"); // plane
    if (btn) btn.addEventListener("click", x => {

        meshLoader.reset();
        var w = 24 + rndPM(12);
        var h = 24 + rndPM(12);

        meshLoader.pushDoubleSidedPlane(_v3_origin, _v3_null, w, h, 0.001);


        if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

        paramText.innerText = `Plane ${w*2} x ${h*2}`;

    } );
    var btn = document.getElementById("btn_s2"); // box
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();
        var w = 36 + rndPM(18);
        var h = 36 + rndPM(18);
        var d = 36 + rndPM(18);

        meshLoader.pushBox(_v3_origin, _v3_null, w, h, d);     

        if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
        if (check_smooth.checked) meshLoader.smoothNormals(-0.9);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

        paramText.innerText = `Box ${w.toFixed(2)} x ${h.toFixed(2)} x ${d.toFixed(2)}`;

    } );
    var btn = document.getElementById("btn_s3"); // pyramid
    if (btn) btn.addEventListener("click", x => {

        meshLoader.reset();
        var nbSide = rndInt(12) + 3;
        var height = 36 + rndPM(20);
        var radius = 24 + rndPM(12);

        meshLoader.pushPyramid(_v3_origin, _v3_null, radius, height, nbSide);

        if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
        if (check_smooth.checked) meshLoader.smoothNormals(0.7);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

        paramText.innerText = `Pyramid ${radius.toFixed(2)} x ${height.toFixed(2)}, ${nbSide} sides`;

    } );
    var btn = document.getElementById("btn_s4"); // prism
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();
        var nbSide = rndInt(12) + 3;
        var height = 36 + rndPM(20);
        var radius = 24 + rndPM(10);

        meshLoader.pushPrism(_v3_origin, _v3_null, radius, height, nbSide);

        if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
        if (check_smooth.checked) meshLoader.smoothNormals(0.7);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

        paramText.innerText = `Prism ${radius.toFixed(2)} x ${height.toFixed(2)}, ${nbSide} sides`;

    } );
    var btn = document.getElementById("btn_s5"); // sphere
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();

        var radius = 32 + rndPM(10);
        var depth = rndInt(6);
        var type = rndInt(meshLoader.sphereBaseType.qty);

        meshLoader.pushSphere(_v3_origin, _v3_null, radius, depth, _v3_white, type);

        if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);
        if (check_smooth.checked) meshLoader.smoothNormals(0.0);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);
        
        paramText.innerText = `Sphere radius ${radius.toFixed(2)} base type: ${meshLoader.sphereBaseType.strings[type]} recursion depth of ${depth}`;
    } );

    var btn = document.getElementById("btn_s6"); // torus
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();

        var radius = 32 + rndPM(16);
        var sectionRadius = 12 + rndPM(8);
        var sections = 4 + rndInt(48);
        var sides = 4 + rndInt(24);

        meshLoader.pushTorus(_v3_origin, _v3_null, radius, sectionRadius, sections, sides);
        
        if (check_colored.checked) for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);        
        if (check_smooth.checked) meshLoader.smoothNormals(0.2);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);
        
        paramText.innerText = `Torus radius ${radius.toFixed(2)}, section radius: ${sectionRadius.toFixed(2)}, sections:${sections}, sides: ${sides}`;
    } );




    // use the engine OnTick event callback to change the rotation of the entity
    CB_tick = function() {
        // rotate around Y
        entity.rotation[1] += TIMER.delta * 0.4;
        entity.updateMatrix();
    }    
}

