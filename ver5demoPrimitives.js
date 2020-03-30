// Easy3D_WebGL
// Main demo program for version 0.5
// Generation and loading of shape primitives simple out-of-engine animation
// Emmanuel Charette 2020

"use strict"


function E3D_userInit() {

    
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
    

    

    var meshLoader = new E3D_loader();
    // Create a solid cube
    var entity = new E3D_entity("entity1", "", true); // dynamic entity, GPU data will be updated when changed

    // Create mesh
    meshLoader.pushBox(48, 48, 48);     
    // Randomize colors
    for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = Math.random();

    // Load data from mesh to entity
    meshLoader.addModelData(entity);

    // Setup entity
    entity.isVisible = true;
    entity.position = [0, 24, 0];
    E3D_addEntity(entity);





    // Register the button events
    var btn = document.getElementById("btn_s1"); // plane
    if (btn) btn.addEventListener("click", x => {

        meshLoader.reset();
        var w = 24 + rndPM(10);
        var h = 24 + rndPM(10);
        meshLoader.pushQuad4p([-w, -h,  0.01], [ w, -h,  0.01], [ w,  h,  0.01], [-w,  h,  0.01]);
        meshLoader.pushQuad4p([-w, -h, -0.01], [-w,  h, -0.01], [ w,  h, -0.01], [ w, -h, -0.01]);

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = Math.random();

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

    } );
    var btn = document.getElementById("btn_s2"); // box
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();
        meshLoader.pushBox(48 + rndPM(10), 48 + rndPM(10), 48 + rndPM(10));     

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = Math.random();

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

    } );
    var btn = document.getElementById("btn_s3"); // pyramid
    if (btn) btn.addEventListener("click", x => {

        meshLoader.reset();
        var nbSide = rndInt(6) + 3;
        var height = 48 + rndPM(20);
        var radius = 24 + rndPM(10);

        // points
        var ps = [0, height, 0];
        var pb = [0, 0, 0];
        var pts = [];
        pts[0] = [radius, 0, 0];        
        for (var i = 1; i < nbSide; ++i) pts.push(v3_rotateY_new(pts[0], (PIx2 / nbSide) * i));

        // faces
        for (var i = 0; i < nbSide; ++i) meshLoader.pushTriangle3p(pts[(i + 1) % nbSide]  , ps, pts[i]);     
        for (var i = 0; i < nbSide; ++i) meshLoader.pushTriangle3p(pts[i], pb, pts[(i + 1) % nbSide ]  );   

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = Math.random();

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

    } );
    var btn = document.getElementById("btn_s4"); // prism
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();
        var nbSide = rndInt(12) + 3;
        var height = 48 + rndPM(20);
        var radius = 24 + rndPM(10);

        // points
        var pt = [0, height, 0];
        var pb = [0, 0, 0];
        var ptsb = [];
        var ptst = [];
        ptsb[0] = [radius, 0, 0]; 
        ptst[0] = [radius, height, 0]; 
        for (var i = 1; i < nbSide; ++i) ptsb.push(v3_rotateY_new(ptsb[0], (PIx2 / nbSide) * i));
        for (var i = 1; i < nbSide; ++i) ptst.push(v3_add_new(ptsb[i], pt));

        // faces
        for (var i = 0; i < nbSide; ++i) meshLoader.pushQuad4p(ptsb[(i + 1) % nbSide], ptst[(i + 1) % nbSide], ptst[i] , ptsb[i] );    
        // top 
        for (var i = 0; i < nbSide; ++i) meshLoader.pushTriangle3p(ptst[(i + 1) % nbSide], pt, ptst[i]  );   
        // bottom
        for (var i = 0; i < nbSide; ++i) meshLoader.pushTriangle3p(ptsb[i], pb, ptsb[(i + 1) % nbSide ]  );   

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = Math.random();

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

    } );
    var btn = document.getElementById("btn_s5"); // sphere
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();
        meshLoader.pushBox(48, 48, 48);     

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = Math.random();

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

    } );
    var btn = document.getElementById("btn_s6"); // torus
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();
        meshLoader.pushBox(48, 48, 48);     

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = Math.random();

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

    } );

    // use the engine OnTick event callback to change the rotation of the entity
    CB_tick = function() {
        // rotate around Y
        entity.rotation[1] += TIMER.delta * 0.33;
        entity.updateMatrix();
    }    
}

