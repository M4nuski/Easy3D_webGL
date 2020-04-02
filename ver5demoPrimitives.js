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





    // Register the button events
    var btn = document.getElementById("btn_s1"); // plane
    if (btn) btn.addEventListener("click", x => {

        meshLoader.reset();
        var w = 24 + rndPM(12);
        var h = 24 + rndPM(12);
        meshLoader.pushQuad4p([-w, -h,  0.01], [ w, -h,  0.01], [ w,  h,  0.01], [-w,  h,  0.01]);
        meshLoader.pushQuad4p([-w, -h, -0.01], [-w,  h, -0.01], [ w,  h, -0.01], [ w, -h, -0.01]);

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

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

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

        paramText.innerText = `Box ${w.toFixed(2)} x ${h.toFixed(2)} x ${d.toFixed(2)}`;

    } );
    var btn = document.getElementById("btn_s3"); // pyramid
    if (btn) btn.addEventListener("click", x => {

        meshLoader.reset();
        var nbSide = rndInt(6) + 3;
        var height = 36 + rndPM(20);
        var radius = 24 + rndPM(12);

        // points
        var ps = [0, height, 0];
        var pb = [0, 0, 0];
        var pts = [];
        pts[0] = [radius, 0, 0];        
        for (var i = 1; i < nbSide; ++i) pts.push(v3_rotateY_new(pts[0], (PIx2 / nbSide) * i));

        // faces
        for (var i = 0; i < nbSide; ++i) meshLoader.pushTriangle3p(pts[(i + 1) % nbSide]  , ps, pts[i]);     
        for (var i = 0; i < nbSide; ++i) meshLoader.pushTriangle3p(pts[i], pb, pts[(i + 1) % nbSide ]  );   

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

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

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

        paramText.innerText = `Prism ${radius.toFixed(2)} x ${height.toFixed(2)}, ${nbSide} sides`;

    } );
    var btn = document.getElementById("btn_s5"); // sphere
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();

        var radius = 32 + rndPM(10);
        var depth = rndInt(6);
        var pts = [];
        var faces = [];

        /*
        // points, mirrored triangular pyramid
        pts[0] = [0,  1, 0];
        pts[1] = [0, -1, 0];
        pts[2] = [1,  0, 0];        
        for (var i = 1; i < 3; ++i) pts.push(v3_rotateY_new(pts[2], (PIx2 / 3) * i)); // 2 3 4 are the middle points

        faces.push([0, 2, 3]);
        faces.push([0, 3, 4]);
        faces.push([0, 4, 2]);
        faces.push([1, 4, 3]);
        faces.push([1, 3, 2]);
        faces.push([1, 2, 4]);
        */

        /*
        // points, cube
        pts[0] = [ 0.5,  0.5,  0.5]; //tfr
        pts[1] = [ 0.5,  0.5, -0.5]; //tbr
        pts[2] = [-0.5,  0.5, -0.5]; //tbl
        pts[3] = [-0.5,  0.5,  0.5]; //tfl

        pts[4] = [ 0.5, -0.5,  0.5]; //bfr
        pts[5] = [ 0.5, -0.5, -0.5]; //bbr
        pts[6] = [-0.5, -0.5, -0.5]; //bbl
        pts[7] = [-0.5, -0.5,  0.5]; //bfl

 
        faces.push([0, 1, 2]);
        faces.push([0, 2, 3]);

        faces.push([4, 6, 5]);
        faces.push([4, 7, 6]);


        faces.push([0, 3, 7]);
        faces.push([0, 7, 4]);
         
        faces.push([2, 1, 5]);
        faces.push([2, 5, 6]);


        faces.push([0, 4, 5]);
        faces.push([0, 5, 1]);
        
        faces.push([2, 6, 7]);
        faces.push([2, 7, 3]);
       */
        /*
        // points, tetrahedron based
        pts[0] = [ 0.0000,  1.0000,  0.0000];
        pts[1] = [ 0.9428, -0.3333,  0.0000];
        pts[2] = [-0.4714, -0.3333,  0.8165];     
        pts[3] = [-0.4714, -0.3333, -0.8165];  
        faces.push([0, 1, 3]);
        faces.push([0, 3, 2]);
        faces.push([0, 2, 1]);
        faces.push([1, 2, 3]);
        */


        // points, icoharedon based
        //https://wiki.unity3d.com/index.php/ProceduralPrimitives

        var t = 1.618;
 
        pts.push([-1,  t,  0]);
        pts.push([ 1,  t,  0]);
        pts.push([-1, -t,  0]);
        pts.push([ 1, -t,  0]);
 
        pts.push([ 0, -1,  t]);
        pts.push([ 0,  1,  t]);
        pts.push([ 0, -1, -t]);
        pts.push([ 0,  1, -t]);
 
        pts.push([ t,  0, -1]);
        pts.push([ t,  0,  1]);
        pts.push([-t,  0, -1]);
        pts.push([-t,  0,  1]);
  
        // 5 faces around point 0
        faces.push([0, 11, 5]);
        faces.push([0, 5, 1]);
        faces.push([0, 1, 7]);
        faces.push([0, 7, 10]);
        faces.push([0, 10, 11]);
 
        // 5 adjacent faces 
        faces.push([1, 5, 9]);
        faces.push([5, 11, 4]);
        faces.push([11, 10, 2]);
        faces.push([10, 7, 6]);
        faces.push([7, 1, 8]);
 
        // 5 faces around point 3
        faces.push([3, 9, 4]);
        faces.push([3, 4, 2]);
        faces.push([3, 2, 6]);
        faces.push([3, 6, 8]);
        faces.push([3, 8, 9]);
 
        // 5 adjacent faces 
        faces.push([4, 9, 5]);
        faces.push([2, 4, 11]);
        faces.push([6, 2, 10]);
        faces.push([8, 6, 7]);
        faces.push([9, 8, 1]);

        paramText.innerText = `Ico Sphere radius ${radius.toFixed(2)} recursion depth of ${depth}`;



        for (var i = 0; i < pts.length; ++i) v3_normalize_mod(pts[i]);

        // subdivide faces 
        for (var d = 0; d < depth; ++d) {
            var newFaces = [];
            for (var i = 0; i < faces.length; ++i) {

                // divide edges
                pts.push(v3_avg2_new(pts[faces[i][0]], pts[faces[i][1]] ));
                var newpts01 = pts.length-1;
                pts.push(v3_avg2_new(pts[faces[i][1]], pts[faces[i][2]] ));
                var newpts12 = pts.length-1;
                pts.push(v3_avg2_new(pts[faces[i][2]], pts[faces[i][0]] ));
                var newpts20 = pts.length-1;

                // normalize the new points
                v3_normalize_mod(pts[newpts01]);
                v3_normalize_mod(pts[newpts12]);
                v3_normalize_mod(pts[newpts20]);

                // create the new faces
                newFaces.push([newpts01,    newpts12, newpts20]);
                newFaces.push([faces[i][0], newpts01, newpts20]);
                newFaces.push([faces[i][1], newpts12, newpts01]);
                newFaces.push([faces[i][2], newpts20, newpts12]);
            }
            faces = newFaces.slice();
        }

        // size the points to radius
        for (var i = 0; i < pts.length; ++i) v3_scale_mod(pts[i], radius);

        // write the faces to the mesh
        for (var i = 0; i < faces.length; ++i) meshLoader.pushTriangle3p(pts[faces[i][0]], pts[faces[i][1]], pts[faces[i][2]]);

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

        meshLoader.addModelData(entity);
        E3D_updateEntity(entity);

    } );

    var btn = document.getElementById("btn_s6"); // torus
    if (btn) btn.addEventListener("click", x =>  {

        meshLoader.reset();

        var radius = 32 + rndPM(16);
        var sectionRadius = 12 + rndPM(8);
        var sections = 4 + rndInt(48);
        var sides = 4 + rndInt(24);

        paramText.innerText = `Torus radius ${radius.toFixed(2)}, section radius: ${sectionRadius.toFixed(2)}, sections:${sections}, sides: ${sides}`;

        meshLoader.pushTorus(_v3_origin, _v3_null, radius, sectionRadius, sections, sides);

        for (var i = 0; i < meshLoader.colors.length; ++i) meshLoader.colors[i] = float_colorsweep_RGBCMY(i);

        meshLoader.smoothNormals(0.7);
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

