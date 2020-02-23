// Easy3D_WebGL
// Helper class to load 3D model data into entities
// Emmanuel Charette 2017-2019

"use strict"

class E3D_loader {

 /**
 * Load entity from raw ascii data (milkshape3D)
 *
 * @param {string} name / id of the new entity
 * @param {string} file / path of the new entity
 * @param {string} rawModelData the source data to parse
 * @param {float} smoothShading if > -1.0, max angle cosine to perform smooth shading, otherwise flat shaded
 * @param {vec3} color the entity color, if === "sweep" per vertex r/g/b sweep applied
 * @param {bool} dynamic default == false, dynamic entities are not stored in GPU ram so that their data can be modified
 * @param {vec3} scale scale modifier of the entity data
 * @returns {E3D_entity} the resulting model and entity data
 */
    static loadModel_RAW(name, file, rawModelData, smoothShading, color, dynamic = false, scale = _v3_unit) {
        
        let entity = new E3D_entity(name, file, dynamic);

        console.log("Parsing data for entity " + entity.id);

        let numFloats = 0;
        let colors = [];
        let positions = [];
        let normals = [];

        let colorSweep;
        if (color === "sweep") {
            colorSweep = [
                1.0, 0.5, 0.5,
                0.5, 1.0, 0.5,
                0.5, 0.5, 1.0
            ];
        } else {
            colorSweep = [
                color[0], color[1], color[2],
                color[0], color[1], color[2],
                color[0], color[1], color[2]
            ];   
        }

        // remove empty and text lines
        let data = rawModelData.split("\n");
        var ModelData = [];
        for (var i = 0; i < data.length; i++) {
            if ((data[i] != "") && (data[i].split(" ").length != 1)) {
                ModelData.push(data[i]);
            }
        }

        // parse locations
        for (var i = 0; i < ModelData.length; i++) {
            var chunk = ModelData[i].split(" ");
            for (var j = 0; j < chunk.length; j++) {
                var n = chunk[j].trim();
                if (n != "") {
                    positions.push(Number(chunk[j].trim()));
                    colors.push(colorSweep[numFloats % 9]);
                    numFloats++;
                }
            }
        }

        // apply scale
        if (scale != _v3_unit) {
            for (var i = 0; i < numFloats / 3; i++) { // for each vertex                
               positions[(i * 3)] =     positions[(i * 3)]     * scale[0];
               positions[(i * 3) + 1] = positions[(i * 3) + 1] * scale[1];
               positions[(i * 3) + 2] = positions[(i * 3) + 2] * scale[2];
            }
        }

        let newNormal = [0, 0, 0];
        let v1 = [0, 0, 0];
        let v2 = [0, 0, 0];
        let v3 = [0, 0, 0];

        // create face normals
        for (var i = 0; i < numFloats / 9; i++) { // for each face
            v3_val_res(v1, positions[(i * 9)],     positions[(i * 9) + 1], positions[(i * 9) + 2] );
            v3_val_res(v2, positions[(i * 9) + 3], positions[(i * 9) + 4], positions[(i * 9) + 5] );
            v3_val_res(v3, positions[(i * 9) + 6], positions[(i * 9) + 7], positions[(i * 9) + 8] );

            v3_sub_mod(v2, v1);
            v3_sub_mod(v3, v1);
            v3_cross_res(newNormal, v3, v2);
            v3_normalize_mod(newNormal);

            normals.push(newNormal[0]); // flat shading
            normals.push(newNormal[1]); 
            normals.push(newNormal[2]); 

            normals.push(newNormal[0]); // flat shading
            normals.push(newNormal[1]); 
            normals.push(newNormal[2]); 

            normals.push(newNormal[0]); // flat shading
            normals.push(newNormal[1]); 
            normals.push(newNormal[2]); 
        }

        if (smoothShading > -1.0) {
            console.log("Smooth Shading Normals");

            var indices = [];
            var uniques = [];
            this.getUniqueVertices(positions, uniques, indices);
            console.log("unique Vert: " + uniques.length);

            console.log("Smoothing...");
            this.smoothNormals(indices, uniques.length, normals, smoothShading);
        }

        console.log("Loaded " + numFloats + " float locations");
        console.log((numFloats / 3) + " vertices");
        console.log((numFloats / 9) + " triangles");

        entity.vertexArray = new Float32Array(positions);
        entity.colorArray = new Float32Array(colors);
        entity.normalArray = new Float32Array(normals);

        entity.numElements = numFloats / 3;

        return entity;
    }

   
 /**
 * Load entity from BINARY STL file
 *
 * @param {string} name / id of the new entity
 * @param {string} file / path of the new entity
 * @param {DataView} rawModelData the source data
 * @param {float} smoothShading if > 1.0 max angle cosine to perform smooth shading, otherwise flat shaded
 * @param {vec3} color if === "source" use source color, if === "sweep" per vertex r/g/b sweep, else single provided color is applied
 * @param {bool} dynamic default == false, dynamic entities are not optimally store in GPU ram so that their data can be modified
 * @param {vec3} scale scale modifier of the entity data
 * @returns {E3D_entity} the resulting model E3D_Entity data
 */
    static loadModel_STL(name, file, rawModelData, smoothShading, color, dynamic = false, scale = _v3_unit) {
            
        let entity = new E3D_entity(name, file, dynamic);

        console.log("Loading data for entity " + entity.id);

        let colors = [];
        let positions = [];
        let normals = [];

        let colorSweep = [
            1.0, 0.5, 0.5,
            0.5, 1.0, 0.5,
            0.5, 0.5, 1.0
        ];

        let thiscolor = [0, 0, 0];

        let mData = new DataView(rawModelData);

        let NumTriangle = mData.getUint32(80, true);

        let header = "";
        for (var i = 0; i < 80; ++i) header += String.fromCharCode(mData.getUint8(i));

        console.log("Header " + header);
        console.log("num triangles 0x" + NumTriangle.toString(16) + " dec " + NumTriangle);

        let idx = 0;
        if (NumTriangle > 0) for (let i = 0 ; i < NumTriangle; ++i) {
            // each triangle is
            // 4 points X 3 axis X 32 bit float 
            // 16 bit packed color data
            idx = 84 + (i * 50); // base offset + triangle * stride 

            let normal = [0, 0, 0];
            let p0 = [0, 0, 0];
            let p1 = [0, 0, 0];
            let p2 = [0, 0, 0];

            normal[0] = mData.getFloat32(idx, true);  //x
            normal[2] = -mData.getFloat32(idx+4, true);//y
            normal[1] = mData.getFloat32(idx+8, true);//z

            // Load positions and apply scale
            p0[0] =  mData.getFloat32(idx+12, true) * scale[0];//x
            p0[2] = -mData.getFloat32(idx+16, true) * scale[1];//y
            p0[1] =  mData.getFloat32(idx+20, true) * scale[2];//z

            p1[0] =  mData.getFloat32(idx+24, true) * scale[0];//x
            p1[2] = -mData.getFloat32(idx+28, true) * scale[1];//y
            p1[1] =  mData.getFloat32(idx+32, true) * scale[2];//z

            p2[0] =  mData.getFloat32(idx+36, true) * scale[0];//x
            p2[2] = -mData.getFloat32(idx+40, true) * scale[1];//y
            p2[1] =  mData.getFloat32(idx+44, true) * scale[2];//z 

            // color data
            if (color === "source") {
                let rawColor = mData.getUint16(idx+48, true);
                thiscolor[0] = (rawColor & 0x001F) / 31.0;
                thiscolor[1] = ((rawColor & 0x03E0) >> 5) / 31.0;
                thiscolor[2] = ((rawColor & 0x7C00) >> 10) / 31.0;

                colors.push(thiscolor[0]);colors.push(thiscolor[1]);colors.push(thiscolor[2]);
                colors.push(thiscolor[0]);colors.push(thiscolor[1]);colors.push(thiscolor[2]);
                colors.push(thiscolor[0]);colors.push(thiscolor[1]);colors.push(thiscolor[2]);
            } else if (color == "sweep") {
                colors.push(colorSweep[0]);colors.push(colorSweep[1]);colors.push(colorSweep[2]);
                colors.push(colorSweep[3]);colors.push(colorSweep[4]);colors.push(colorSweep[5]);
                colors.push(colorSweep[6]);colors.push(colorSweep[7]);colors.push(colorSweep[8]);              
            } else {
                colors.push(color[0]);colors.push(color[1]);colors.push(color[2]);
                colors.push(color[0]);colors.push(color[1]);colors.push(color[2]);
                colors.push(color[0]);colors.push(color[1]);colors.push(color[2]);

            }

            positions.push(p0[0]); positions.push(p0[1]);positions.push(p0[2]);
            positions.push(p1[0]); positions.push(p1[1]);positions.push(p1[2]);
            positions.push(p2[0]); positions.push(p2[1]);positions.push(p2[2]);



            if ((normal[0] == 0) && (normal[1] == 0) && (normal[2] == 0)) {
                v3_sub_mod(p1, p0);
                v3_sub_mod(p2, p0);
                v3_cross_res(normal, p2, p1);
                v3_normalize_mod(normal);
            }

            normals.push(normal[0]);normals.push(normal[1]);normals.push(normal[2]);
            normals.push(normal[0]);normals.push(normal[1]);normals.push(normal[2]);
            normals.push(normal[0]);normals.push(normal[1]);normals.push(normal[2]);

        }

        if (smoothShading > -1.0) {
            console.log("Smooth Shading Normals");

            var indices = [];
            var uniques = [];
            this.getUniqueVertices(positions, uniques, indices);
            console.log("unique Vert: " + uniques.length);

            console.log("Smoothing...");
            this.smoothNormals(indices, uniques.length, normals, smoothShading);
        }

        // Dump data into entity
        entity.vertexArray = new Float32Array(positions);
        entity.colorArray = new Float32Array(colors);
        entity.normalArray = new Float32Array(normals);
        entity.numElements = NumTriangle * 3;

        return entity;
    }


        
    /**
     * Load triangle and edge CD data from Milkshape3D ascii raw data
     *
     * @param {E3D_entity} entity to apply the CD data
     * @param {string} rawModelData the source data to parse
     * @param {vec3} scale scale modifier of the entity data
     * 
     */
    static loadCD_fromRAW(entity, rawModelData, scale = _v3_unit) {

        console.log("Parsing triangle CD data for entity " + entity.id);

        let numFloats = 0;
        let positions = [];
        let normals = [];

        // remove empty and text lines
        let data = rawModelData.split("\n");
        var ModelData = [];
        for (var i = 0; i < data.length; i++) {
            if ((data[i] != "") && (data[i].split(" ").length != 1)) {
                ModelData.push(data[i]);
            }
        }

        // parse locations
        for (var i = 0; i < ModelData.length; i++) {
            var chunk = ModelData[i].split(" ");
            for (var j = 0; j < chunk.length; j++) {
                var n = chunk[j].trim();
                if (n != "") {
                    positions.push(Number(chunk[j].trim()));
                // colors.push(colorSweep[numFloats % 9]);
                    numFloats++;
                }
            }
        }

        // apply scale
        if (scale != _v3_unit) {
            for (var i = 0; i < numFloats / 3; i++) { // for each vertex                
            positions[(i * 3)] =     positions[(i * 3)]     * scale[0];
            positions[(i * 3) + 1] = positions[(i * 3) + 1] * scale[1];
            positions[(i * 3) + 2] = positions[(i * 3) + 2] * scale[2];
            }
        }

        let newNormal = [0, 0, 0];
        let d21 = [0, 0, 0];
        let d31 = [0, 0, 0];

        let v1 = [0, 0, 0];
        let v2 = [0, 0, 0];
        let v3 = [0, 0, 0];

        // create face normals and triangle CD
        for (var i = 0; i < numFloats / 9; i++) { // for each face
            v3_val_res(v1, positions[i * 9      ], positions[(i * 9) + 1], positions[(i * 9) + 2]);
            v3_val_res(v2, positions[(i * 9) + 3], positions[(i * 9) + 4], positions[(i * 9) + 5]);
            v3_val_res(v3, positions[(i * 9) + 6], positions[(i * 9) + 7], positions[(i * 9) + 8]);


            v3_sub_res(d21, v2, v1);
            v3_sub_res(d31, v3, v1);
            v3_cross_res(newNormal, d21, d31);
            v3_normalize_mod(newNormal);

            normals.push(newNormal[0]); // flat shading
            normals.push(newNormal[1]); 
            normals.push(newNormal[2]); 

            normals.push(newNormal[0]); // flat shading
            normals.push(newNormal[1]); 
            normals.push(newNormal[2]); 

            normals.push(newNormal[0]); // flat shading
            normals.push(newNormal[1]); 
            normals.push(newNormal[2]);             

            // add CD for the triangle face
            entity.pushCD_triangle(newNormal, v1, v2, v3);
        }

        // get edges 
        var indices = [];
        var uniques = [];
        this.getUniqueVertices(positions, uniques, indices);
        console.log("unique Vert: " + uniques.length);

        var edges = this.getEdges(indices, normals);
        console.log("edges: " + edges.length);


        var centroid1 = v3_new();
        var centroid2 = v3_new();
        for (var i = 0; i < edges.length; ++i) { // for each edge

            v3_avg3_res(centroid1, uniques[edges[i].index1], uniques[edges[i].index2], uniques[edges[i].index31]);
            v3_avg3_res(centroid2, uniques[edges[i].index1], uniques[edges[i].index2], uniques[edges[i].index32]);
            v3_sub_mod(centroid1, centroid2);
            
            if (v3_dot(centroid1, edges[i].normal2) < -0.001) entity.pushCD_edge2p(uniques[edges[i].index1], uniques[edges[i].index2]);
        }


        console.log("Loaded " + numFloats + " float locations");
        console.log((numFloats / 3) + " vertices");
        console.log((numFloats / 9) + " triangles");
        console.log(entity.CD_edge + " CD edges");
        entity.collisionDetection = true;
    }



   
 /**
 * Load entity from BINARY STL file
 *
 * @param {[float]} vertexArray expanded vertex array of float, 3 float per vertex (3 vertex per face)
 * @param {[int]} indexArray resulting list of indices matching vertexArray/3

 */
    static getUniqueVertices(vertexArray, uniqueV3Array, indexArray) {

        let numVert = vertexArray.length / 3;


        let curVert = [0, 0, 0];

        for (var i = 0; i < numVert; ++i) {
            var unique = true;
            v3_val_res(curVert, vertexArray[(i * 3)], vertexArray[(i * 3) + 1], vertexArray[(i * 3) + 2] );
            for (var j = 0; j < uniqueV3Array.length; ++j) {
                if (v3_equals(uniqueV3Array[j], curVert)) {
                    unique = false;
                    indexArray[i] = j;
                    break;
                }
            }
            if (unique) { 
                uniqueV3Array.push(v3_clone(curVert));
                indexArray[i] = uniqueV3Array.length-1;
            } 
        }
    }



    static smoothNormals(indexArray, maxIndex, normalArray, cosineLimit) {

        var avgNorms = new Array(maxIndex);        
        
        // for all unique, average normals
        let curNorm = [0, 0, 0];
        for (var i = 0; i < maxIndex; ++i) { 
            avgNorms[i] = v3_new();

            for (var j = 0; j < indexArray.length; ++j) { 
                if (indexArray[j] == i) {
                    v3_val_res(curNorm, normalArray[j * 3], normalArray[(j * 3) + 1], normalArray[(j * 3) + 2] );
                    v3_add_mod(avgNorms[i], curNorm);
                }
            }

            v3_normalize_mod(avgNorms[i]);
        }

        // Smoothing
        for (var i = 0; i < maxIndex; ++i) { 

            for (var j = 0; j < indexArray.length; ++j) {
                if (indexArray[j] == i) {
                    v3_val_res(curNorm, normalArray[j * 3], normalArray[(j * 3) + 1], normalArray[(j * 3) + 2] );

                    if (v3_dot(avgNorms[i], curNorm) >= cosineLimit) {
                        normalArray[(j * 3)]     = avgNorms[i][0];
                        normalArray[(j * 3) + 1] = avgNorms[i][1];
                        normalArray[(j * 3) + 2] = avgNorms[i][2];
                    }
                }
            }
        }

    }


    static getEdges(indexArray, normalArray) {
        var edgeArray = []; // of { done, index1, index2, normal1, normal2, index3a, index3b } 

        // foreach face
        for (var i = 0; i < indexArray.length / 3; ++i) { 

            // edge 1
            var unique = true;
            for (var j = 0; j < edgeArray.length; ++j) if (!edgeArray[j].done) {
                if ( ((edgeArray[j].index1 == indexArray[(i * 3)    ]) && (edgeArray[j].index2 == indexArray[(i * 3) + 1])) ||
                     ((edgeArray[j].index1 == indexArray[(i * 3) + 1]) && (edgeArray[j].index2 == indexArray[(i * 3)    ])) ) {
                    unique = false;
                    v3_val_res(edgeArray[j].normal2, normalArray[i * 9], normalArray[i * 9 + 1], normalArray[i * 9 + 2] );
                    edgeArray[j].done = true;
                    edgeArray[j].index32 = indexArray[(i * 3) + 2];
                    break;
                }
            }
            if (unique)  {
                edgeArray.push( {
                    done : false,
                    index1 : indexArray[(i * 3)    ],
                    index2 : indexArray[(i * 3) + 1],
                    normal1 : v3_val_new(normalArray[i * 9], normalArray[i * 9 + 1], normalArray[i * 9 + 2] ),
                    normal2 : v3_new(),
                    index31 : indexArray[(i * 3) + 2],
                    index32 : 0
                 }
                );
            }


            // edge 2
            unique = true;
            for (var j = 0; j < edgeArray.length; ++j) if (!edgeArray[j].done) {
                if ( ((edgeArray[j].index1 == indexArray[(i * 3) + 2]) && (edgeArray[j].index2 == indexArray[(i * 3) + 1])) ||
                     ((edgeArray[j].index1 == indexArray[(i * 3) + 1]) && (edgeArray[j].index2 == indexArray[(i * 3) + 2])) ) {
                    unique = false;
                    v3_val_res(edgeArray[j].normal2, normalArray[i * 9], normalArray[i * 9 + 1], normalArray[i * 9 + 2] );
                    edgeArray[j].done = true;
                    edgeArray[j].index32 = indexArray[(i * 3)    ];
                    break;
                }
            }
            if (unique)  {
                edgeArray.push( {
                    done : false,
                    index1 : indexArray[(i * 3) + 2],
                    index2 : indexArray[(i * 3) + 1],
                    normal1 : v3_val_new(normalArray[i * 9], normalArray[i * 9 + 1], normalArray[i * 9 + 2] ),
                    normal2 : v3_new(),
                    index31 : indexArray[(i * 3)    ],
                    index32 : 0
                 }
                );
            }


            // edge 3
            unique = true;
            for (var j = 0; j < edgeArray.length; ++j) if (!edgeArray[j].done) {
                if ( ((edgeArray[j].index1 == indexArray[(i * 3)    ]) && (edgeArray[j].index2 == indexArray[(i * 3) + 2])) ||
                     ((edgeArray[j].index1 == indexArray[(i * 3) + 2]) && (edgeArray[j].index2 == indexArray[(i * 3)    ])) ) {
                    unique = false;
                    v3_val_res(edgeArray[j].normal2,  normalArray[i * 9], normalArray[i * 9 + 1], normalArray[i * 9 + 2] );
                    edgeArray[j].done = true;
                    edgeArray[j].index32 = indexArray[(i * 3) + 1];
                    break;
                }
            }
            if (unique)  {
                edgeArray.push( {
                    done : false,
                    index1 : indexArray[(i * 3)    ],
                    index2 : indexArray[(i * 3) + 2],
                    normal1 : v3_val_new(normalArray[i * 9], normalArray[i * 9 + 1], normalArray[i * 9 + 2] ),
                    normal2 : v3_new(),
                    index31 : indexArray[(i * 3) + 1],
                    index32 : 0
                 }
                );
            }




        }


        return edgeArray;
    }

}




