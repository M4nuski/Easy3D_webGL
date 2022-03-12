// Easy3D_WebGL
// Helper class to parse model data or create primitives, and load them into entities
// Emmanuel Charette 2017-2022

"use strict"


var _mesh_prim_mat = m4_new();


class E3D_mesh {

    constructor() {

        this.file = "";

        // raw float data
        this.colors = [];
        this.positions = [];
        this.normals = [];

        // vertex data
        this.uniquesDone = false;
        this.uniques = []; // v3 vertex position
        this.indices = []; // index to unique vertices array
        this.boundTriangles = []; // triangle index array bound to unique vertex
        this.boundIndices = []; // original index array bound to unique vertex

        this.edgesDone = false;
        this.edges = [];

        this.boundingboxDone = false;
        this.boundingboxMin = [0, 0, 0];
        this.boundingboxMax = [0, 0, 0];
        this.boundingboxLength = 0.0;

        // moved in constructor to avoir error in Edge
        this.sphereBaseType = {
            ICO: 0,
            OCTA: 1,
            BITETRA: 2,
            TETRA: 3,
            CUBE: 4,
            strings: ["Icosahedron", "Octahedron", "Bi-Tetrahedron", "Tetrahedron", "Cube"],
            qty: 5
          };
    }

    reset() {
        this.file = "";

        this.colors = [];
        this.positions = [];
        this.normals = [];

        this.uniquesDone = false;
        this.uniques = [];
        this.indices = [];

        this.boundTriangles = [];
        this.boundIndices = []; 

        this.edgesDone = false;
        this.edges = [];

        this.boundingboxDone = false;
        this.boundingboxMin = [0, 0, 0];
        this.boundingboxMax = [0, 0, 0];
        this.boundingboxLength = 0.0;
    }

// Entity Data Writers

    addModelData(entity){
        entity.vertexArray = new Float32Array(this.positions);
        entity.colorArray = new Float32Array(this.colors);
        entity.normalArray = new Float32Array(this.normals);

        entity.numElements = this.positions.length / 3;

        entity.dataContentChanged = true;
        entity.dataSizeChanged = true;
    }

    addStrokeData(entity, addOrphanEdges = false, cosineLimit = 0.8) {
        entity.numStrokeElements = 0;
        entity.drawStrokes = false;
        
        if (!this.edgesDone) this.genEdges();
        
        var strokeList = [];
        for (var i = 0; i < this.edges.length; ++i) if ( (addOrphanEdges && !this.edges[i].done) ||
            (this.edges[i].done && (v3_dot(this.edges[i].normal1, this.edges[i].normal2)) < cosineLimit) ) {
            strokeList.push(this.boundIndices[this.edges[i].index1][0]);
            strokeList.push(this.boundIndices[this.edges[i].index2][0]);
        }
        
        if (strokeList.length > 0) {
            entity.strokeIndexArray = new Uint32Array(strokeList);
            entity.numStrokeElements = strokeList.length;
            entity.drawStrokes = true;
        }

        log((strokeList.length / 2) + " strokes");  
    }

    addCDFromData(entity, addOrphanEdges = true) {

        let v1 = [0, 0, 0];
        let v2 = [0, 0, 0];
        let v3 = [0, 0, 0];
        let newNormal = [0, 0, 0];

        for (var i = 0; i < this.positions.length; i += 9) { // for each face

            v3_val_res(v1, this.positions[i + 0], this.positions[i + 1], this.positions[i + 2]);
            v3_val_res(v2, this.positions[i + 3], this.positions[i + 4], this.positions[i + 5]);
            v3_val_res(v3, this.positions[i + 6], this.positions[i + 7], this.positions[i + 8]);     

            v3_normal_res(newNormal, v1, v2, v3);

            entity.pushCD_triangle(newNormal, v1, v2, v3);
        }
        log(entity.CD_triangle + " CD triangles");

        if (!this.edgesDone) this.genEdges();

        var centroid1 = v3_new();
        var centroid2 = v3_new();

        for (var i = 0; i < this.edges.length; ++i) { // for each edge
            if (addOrphanEdges && !this.edges[i].done) {
                entity.pushCD_edge2p(this.uniques[this.edges[i].index1], this.uniques[this.edges[i].index2]);
            } else if (this.edges[i].done) {
                v3_avg3_res(centroid1, this.uniques[this.edges[i].index1], this.uniques[this.edges[i].index2], this.uniques[this.edges[i].index31]);
                v3_avg3_res(centroid2, this.uniques[this.edges[i].index1], this.uniques[this.edges[i].index2], this.uniques[this.edges[i].index32]);
                v3_sub_mod(centroid1, centroid2);

                if (v3_dot(centroid1, this.edges[i].normal2) < -0.001) entity.pushCD_edge2p(this.uniques[this.edges[i].index1], this.uniques[this.edges[i].index2]);
            }
        }

        log(entity.CD_edge + " CD edges");

    }




// Mesh Data Loaders



 /**
 * Load entity from raw ascii data (milkshape3D)
 *
 * @param {string} dataSourcePath the source data file path or URI
 * @param {string} rawModelData the source data to parse
 * @param {vec3} color the entity color, if === "sweep" per vertex r/g/b sweep applied
 * @param {vec3} scale scale modifier of the entity data
 */
    loadModel_RAW(dataSourcePath, rawModelData, color = _v3_white, scale = _v3_unit) {  

        log("Parsing RAW data (Milkshape3D)");

        this.reset();

        this.file = dataSourcePath;


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
                    this.positions.push(Number(chunk[j].trim()));
                    this.colors.push(colorSweep[this.positions.length % 9]);
                }
            }
        }

        // apply scale
        if (scale != _v3_unit) {
            for (var i = 0; i < this.positions.length; i += 3) { // for each vertex                
               this.positions[i + 0] = this.positions[i + 0] * scale[0];
               this.positions[i + 1] = this.positions[i + 1] * scale[1];
               this.positions[i + 2] = this.positions[i + 2] * scale[2];
            }
        }

        let newNormal = [0, 0, 0];
        let v1 = [0, 0, 0];
        let v2 = [0, 0, 0];
        let v3 = [0, 0, 0];

        // create face normals
        for (var i = 0; i < this.positions.length; i += 9) { // for each face
            v3_val_res(v1, this.positions[i + 0], this.positions[i + 1], this.positions[i + 2] );
            v3_val_res(v2, this.positions[i + 3], this.positions[i + 4], this.positions[i + 5] );
            v3_val_res(v3, this.positions[i + 6], this.positions[i + 7], this.positions[i + 8] );

            v3_normal_res(newNormal, v1, v2, v3);

            this.normals[i + 0] = newNormal[0]; // flat shading
            this.normals[i + 1] = newNormal[1]; 
            this.normals[i + 2] = newNormal[2]; 

            this.normals[i + 3] = newNormal[0]; // flat shading
            this.normals[i + 4] = newNormal[1]; 
            this.normals[i + 5] = newNormal[2]; 

            this.normals[i + 6] = newNormal[0]; // flat shading
            this.normals[i + 7] = newNormal[1]; 
            this.normals[i + 8] = newNormal[2]; 
        }

        log("Loaded " + this.positions.length + " float locations");
        log((this.positions.length / 3) + " vertices");
        log((this.positions.length / 9) + " triangles"); 
    }

   
 /**
 * Load entity from BINARY STL file
 *
 * @param {string} dataSourcePath the source data file path or URI
 * @param {DataView} rawModelData the source data
 * @param {vec3} color if === "source" use source color, if === "sweep" per vertex r/g/b sweep, else single provided color is applied
 * @param {vec3} scale scale modifier of the entity data
 */
    loadModel_STL(dataSourcePath, rawModelData, color = _v3_white, scale = _v3_unit) {

        log("Loading STL data");

        this.reset();

        this.file = dataSourcePath;

        let colorSweep = [
            1.0, 0.5, 0.5,
            0.5, 1.0, 0.5,
            0.5, 0.5, 1.0
        ];

        let thiscolor = [0, 0, 0,  0, 0, 0,  0, 0, 0];

        let mData = new DataView(rawModelData);

        let NumTriangle = mData.getUint32(80, true);

        let header = "";
        for (var i = 0; i < 80; ++i) header += String.fromCharCode(mData.getUint8(i));

        log("Header " + header);
        log("num triangles 0x" + NumTriangle.toString(16) + " dec " + NumTriangle);

        let idx = 0;
        if (NumTriangle > 0) for (let i = 0 ; i < NumTriangle; ++i) {
            // each triangle is
            // 3 points X 3 axis X 32 bit float (48 bytes)
            // 16 bit packed color data (2 bytes)
            idx = 84 + (i * 50); // base offset + triangle * stride 
            var vIndex = i * 9;

            let normal = [0, 0, 0];
            let p0 = [0, 0, 0];
            let p1 = [0, 0, 0];
            let p2 = [0, 0, 0];

            normal[0] = mData.getFloat32(idx, true);  //x
            normal[2] = -mData.getFloat32(idx+4, true);//y
            normal[1] = mData.getFloat32(idx+8, true);//z

            // Load this.positions and apply scale
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

                thiscolor[3] = thiscolor[0];
                thiscolor[4] = thiscolor[1];
                thiscolor[5] = thiscolor[2];

                thiscolor[6] = thiscolor[0];
                thiscolor[7] = thiscolor[1];
                thiscolor[8] = thiscolor[2];
            } else if (color == "sweep") {
                thiscolor[0] = colorSweep[0];
                thiscolor[1] = colorSweep[1];
                thiscolor[2] = colorSweep[2];
                
                thiscolor[3] = colorSweep[3];
                thiscolor[4] = colorSweep[4];
                thiscolor[5] = colorSweep[5];

                thiscolor[6] = colorSweep[6];
                thiscolor[7] = colorSweep[7];
                thiscolor[8] = colorSweep[8];
            } else {
                thiscolor[0] = color[0];
                thiscolor[1] = color[1];
                thiscolor[2] = color[2];
                
                thiscolor[3] = color[0];
                thiscolor[4] = color[1];
                thiscolor[5] = color[2];

                thiscolor[6] = color[0];
                thiscolor[7] = color[1];
                thiscolor[8] = color[2];
            }

            this.colors[vIndex + 0] = thiscolor[0];
            this.colors[vIndex + 1] = thiscolor[1];
            this.colors[vIndex + 2] = thiscolor[2];

            this.colors[vIndex + 3] = thiscolor[3];
            this.colors[vIndex + 4] = thiscolor[4];
            this.colors[vIndex + 5] = thiscolor[5];

            this.colors[vIndex + 6] = thiscolor[6];
            this.colors[vIndex + 7] = thiscolor[7];
            this.colors[vIndex + 8] = thiscolor[8];

            this.positions[vIndex + 0] = p0[0];
            this.positions[vIndex + 1] = p0[1];
            this.positions[vIndex + 2] = p0[2];

            this.positions[vIndex + 3] = p1[0];
            this.positions[vIndex + 4] = p1[1];
            this.positions[vIndex + 5] = p1[2];

            this.positions[vIndex + 6] = p2[0];
            this.positions[vIndex + 7] = p2[1];
            this.positions[vIndex + 8] = p2[2];

            if ((normal[0] == 0) && (normal[1] == 0) && (normal[2] == 0)) {
                v3_sub_mod(p1, p0);
                v3_sub_mod(p2, p0);
                v3_cross_res(normal, p2, p1);
                v3_normalize_mod(normal);
            }

            this.normals[vIndex + 0] = normal[0];
            this.normals[vIndex + 1] = normal[1];
            this.normals[vIndex + 2] = normal[2];

            this.normals[vIndex + 3] = normal[0];
            this.normals[vIndex + 4] = normal[1];
            this.normals[vIndex + 5] = normal[2];

            this.normals[vIndex + 6] = normal[0];
            this.normals[vIndex + 7] = normal[1];
            this.normals[vIndex + 8] = normal[2];

        }

        log(NumTriangle + " triangles"); 
    }


// Save Model
    saveModel_ASCIISTL(name) {
        var data = "solid " + name + "\n";
        for (var i = 0; i < this.positions.length / 9; ++i) {
            data += "\tfacet normal " + this.normals[i * 9 + 0].toExponential(6) +" "+ this.normals[i * 9 + 1].toExponential(6) +" "+ this.normals[i * 9 + 2].toExponential(6) +"\n";
            data += "\t\touter loop\n";
            data += "\t\t\tvertex " + this.positions[i * 9 + 0].toExponential(6) +" "+ this.positions[i * 9 + 1].toExponential(6) +" "+ this.positions[i * 9 + 2].toExponential(6) +"\n";
            data += "\t\t\tvertex " + this.positions[i * 9 + 3].toExponential(6) +" "+ this.positions[i * 9 + 4].toExponential(6) +" "+ this.positions[i * 9 + 5].toExponential(6) +"\n";
            data += "\t\t\tvertex " + this.positions[i * 9 + 6].toExponential(6) +" "+ this.positions[i * 9 + 7].toExponential(6) +" "+ this.positions[i * 9 + 8].toExponential(6) +"\n";
            data += "\t\tendloop\n";
            data += "\tendfacet\n";
        }
        data += "endsolid " + name;
        return data;
    }


// Data Processing Utilities


    removeNormals() {
        for (var i = 0; i < this.normals.length; ++i) this.normals[i] = 0.0;
    }

    genNormals() {
        this.normals = [];
        var v1 = v3_new();
        var v2 = v3_new();
        var v3 = v3_new();
        var newNormal = v3_new();
        // create face normals
        for (var i = 0; i < this.positions.length; i += 9) { // for each face
            v3_val_res(v1, this.positions[i + 0], this.positions[i + 1], this.positions[i + 2] );
            v3_val_res(v2, this.positions[i + 3], this.positions[i + 4], this.positions[i + 5] );
            v3_val_res(v3, this.positions[i + 6], this.positions[i + 7], this.positions[i + 8] );

            v3_normal_res(newNormal, v1, v2, v3);

            this.normals[i + 0] = newNormal[0]; // flat shading
            this.normals[i + 1] = newNormal[1];
            this.normals[i + 2] = newNormal[2];

            this.normals[i + 3] = newNormal[0]; // flat shading
            this.normals[i + 4] = newNormal[1];
            this.normals[i + 5] = newNormal[2];

            this.normals[i + 6] = newNormal[0]; // flat shading
            this.normals[i + 7] = newNormal[1];
            this.normals[i + 8] = newNormal[2];
        }
    }

    genUniqueVertices_OLD(epsilon = _v3_epsilon) {
        let curVert = v3_new();
        this.uniques = [];
        this.indices = [];
        this.boundIndices = [];

        for (var i = 0; i < this.positions.length; i += 3) {
            var unique = true;
            var idx = Math.floor(i / 3);
            v3_val_res(curVert, this.positions[i + 0], this.positions[i + 1], this.positions[i + 2] );
            for (var j = 0; j < this.uniques.length; ++j) {
                if (v3_equals(this.uniques[j], curVert, epsilon)) {
                    unique = false;
                    this.indices[idx] = j;
                    this.boundIndices[j].push(idx);
                    break;
                }
            }
            if (unique) { 
                this.uniques.push(v3_clone(curVert));
                this.boundIndices.push([idx]);
                this.indices[idx] = this.uniques.length-1;
            } 
        }

        this.uniquesDone = true;
        log(this.uniques.length + " uniques out of " + (this.positions.length/3) + " raw vertices. ");
    }

    genUniqueVertices(epsilon = _v3_epsilon) {
        this.uniques = [];
        this.indices = [];
        this.boundIndices = [];
        this.boundTriangles = [];

        //pack
        var data = [];        
        for (var i = 0; i < this.positions.length; i += 3) data.push( [
            this.positions[i + 0],  //0
            this.positions[i + 1], 
            this.positions[i + 2],
            0,                          //3 dot(pos,n)
            Math.floor(i/3),            //4 original vertex index
            true,                       //5 isUnique
            0,                          //6 index to sorted unique
            0                           //7 index to extracted unique
        ]);
        
        if (!this.boundingboxDone) this.genBoundingBox();        
        var n = v3_normalize_new([this.boundingboxMax[0] - this.boundingboxMin[0], this.boundingboxMax[1] - this.boundingboxMin[1], this.boundingboxMax[2] - this.boundingboxMin[2]]);
        if (v3_lengthsquared(n) < _v3_epsilon) n = [0.57735, 0.57735, 0.57735];

        for (var i = 0; i < data.length; ++i) data[i][3] = v3_dot(data[i], n);
        data = data.sort( (v1, v2) => (v1[3] - v2[3]) );

        // walk the array and flag vertex that are not unique anymore
        for (var i = 0; i < data.length-1; ++i) if (data[i][5]) {
            data[i][6] = i;
            var j = i + 1;
            while ((j < data.length) && (Math.abs(data[i][3] - data[j][3]) < epsilon)) {
                if (v3_equals(data[i], data[j], epsilon)) {
                    data[j][5] = false;
                    data[j][6] = i;
                }
                ++j;
            }
        }

        // extract unique vertex and assign indices
        for (var i = 0; i < data.length; ++i) {
            if (data[i][5]) {
                this.uniques.push(v3_clone(data[i]));
                data[i][7] = this.uniques.length - 1;
                this.boundTriangles.push( [ Math.floor(data[i][4] / 3) ] );
                this.boundIndices.push( [ data[i][4] ] );
            } else {
                this.boundTriangles[data[data[i][6]][7]].push( Math.floor(data[i][4] / 3) );
                this.boundIndices[data[data[i][6]][7]].push( data[i][4] );
            }
            this.indices[data[i][4]] = data[data[i][6]][7];
        }

        this.uniquesDone = true;
        log(this.uniques.length + " uniques out of " + (this.positions.length/3) + " raw vertices. ");
    }

    removeArealessTriangles(epsilon = _v3_epsilon) {
        var v1 = v3_new();
        var v2 = v3_new();
        var v3 = v3_new();
        var count = 0;

        for (var i = this.positions.length - 9; i >= 0; i -= 9) { // for each face
            v3_val_res(v1, this.positions[i + 0], this.positions[i + 1], this.positions[i + 2] );
            v3_val_res(v2, this.positions[i + 3], this.positions[i + 4], this.positions[i + 5] );
            v3_val_res(v3, this.positions[i + 6], this.positions[i + 7], this.positions[i + 8] );

            if (v3_equals(v1, v2, epsilon) || v3_equals(v1, v3, epsilon) || v3_equals(v2, v3, epsilon)) {
                count++;
                this.positions.splice(i, 9);
                this.normals.splice(i, 9);
                this.colors.splice(i, 9);
            }
        }

        console.log("Discarded " + count + " triangles out of " + this.positions.length / 9);
    }

    smoothNormals(cosineLimit = 0.8) {

        if (!this.uniquesDone) this.genUniqueVertices();

        var avgNorms = [];        
        
        // for all unique, average normals
        for (var i = 0; i < this.uniques.length; ++i) { 
            avgNorms[i] = v3_new();
            for (var j = 0; j < this.boundIndices[i].length; ++j) v3_add_mod(avgNorms[i], this.getNormal(this.boundIndices[i][j]));
            v3_normalize_mod(avgNorms[i]);
        }

        // Smoothing
        for (var i = 0; i < this.boundIndices.length; ++i) 
            for (var j = 0; j < this.boundIndices[i].length; ++j) 
                if (v3_dot(avgNorms[i], this.getNormal(this.boundIndices[i][j])) >= cosineLimit) this.setNormal(this.boundIndices[i][j], avgNorms[i]);

    }

    smoothNormals_OLD(cosineLimit = 0.8) {

        if (!this.uniquesDone) this.genUniqueVertices();

        var avgNorms = [];
        
        // for all unique, average normals
        let curNorm = [0, 0, 0];
        for (var i = 0; i < this.uniques.length; ++i) { 

            avgNorms[i] = v3_new();

            for (var j = 0; j < this.indices.length; ++j) { 
                if (this.indices[j] == i) {
                    v3_val_res(curNorm, this.normals[j * 3], this.normals[(j * 3) + 1], this.normals[(j * 3) + 2] );
                    v3_add_mod(avgNorms[i], curNorm);
                }
            }

            v3_normalize_mod(avgNorms[i]);
        }

        // Smoothing
        for (var i = 0; i <  this.uniques.length; ++i) { 

            for (var j = 0; j < this.indices.length; ++j) {
                if (this.indices[j] == i) {

                    v3_val_res(curNorm, this.normals[j * 3], this.normals[(j * 3) + 1], this.normals[(j * 3) + 2] );

                    if (v3_dot(avgNorms[i], curNorm) >= cosineLimit) {
                        this.normals[(j * 3)]     = avgNorms[i][0];
                        this.normals[(j * 3) + 1] = avgNorms[i][1];
                        this.normals[(j * 3) + 2] = avgNorms[i][2];
                    }
                }
            }
        }

    }

    genEdges_OLD() {
        if (!this.uniquesDone) this.genUniqueVertices();

        this.edges = []; // of { done, index1, index2, normal1, normal2 } 
        
        // foreach face
        for (var i = 0; i < this.indices.length / 3; ++i) { 

            // edge 1
            var unique = true;
            for (var j = 0; j < this.edges.length; ++j) if (!this.edges[j].done) {
                if ( ((this.edges[j].index1 == this.indices[(i * 3)    ]) && (this.edges[j].index2 == this.indices[(i * 3) + 1])) ||
                     ((this.edges[j].index1 == this.indices[(i * 3) + 1]) && (this.edges[j].index2 == this.indices[(i * 3)    ])) ) {
                    unique = false;
                    v3_val_res(this.edges[j].normal2, this.normals[i * 9], this.normals[i * 9 + 1], this.normals[i * 9 + 2] );
                    this.edges[j].done = true;
                    this.edges[j].index32 = this.indices[(i * 3) + 2];
                    break;
                }
            }
            if (unique)  {
                this.edges.push( {
                    done : false,
                    index1 : this.indices[(i * 3)    ],
                    index2 : this.indices[(i * 3) + 1],
                    normal1 : v3_val_new(this.normals[i * 9], this.normals[i * 9 + 1], this.normals[i * 9 + 2] ),
                    normal2 : v3_new(),
                    index31 : this.indices[(i * 3) + 2],
                    index32 : 0
                 }
                );
            }


            // edge 2
            unique = true;
            for (var j = 0; j < this.edges.length; ++j) if (!this.edges[j].done) {
                if ( ((this.edges[j].index1 == this.indices[(i * 3) + 2]) && (this.edges[j].index2 == this.indices[(i * 3) + 1])) ||
                     ((this.edges[j].index1 == this.indices[(i * 3) + 1]) && (this.edges[j].index2 == this.indices[(i * 3) + 2])) ) {
                    unique = false;
                    v3_val_res(this.edges[j].normal2, this.normals[i * 9], this.normals[i * 9 + 1], this.normals[i * 9 + 2] );
                    this.edges[j].done = true;
                    this.edges[j].index32 = this.indices[(i * 3)    ];
                    break;
                }
            }
            if (unique)  {
                this.edges.push( {
                    done : false,
                    index1 : this.indices[(i * 3) + 2],
                    index2 : this.indices[(i * 3) + 1],
                    normal1 : v3_val_new(this.normals[i * 9], this.normals[i * 9 + 1], this.normals[i * 9 + 2] ),
                    normal2 : v3_new(),
                    index31 : this.indices[(i * 3)    ],
                    index32 : 0
                 }
                );
            }


            // edge 3
            unique = true;
            for (var j = 0; j < this.edges.length; ++j) if (!this.edges[j].done) {
                if ( ((this.edges[j].index1 == this.indices[(i * 3)    ]) && (this.edges[j].index2 == this.indices[(i * 3) + 2])) ||
                     ((this.edges[j].index1 == this.indices[(i * 3) + 2]) && (this.edges[j].index2 == this.indices[(i * 3)    ])) ) {
                    unique = false;
                    v3_val_res(this.edges[j].normal2,  this.normals[i * 9], this.normals[i * 9 + 1], this.normals[i * 9 + 2] );
                    this.edges[j].done = true;
                    this.edges[j].index32 = this.indices[(i * 3) + 1];
                    break;
                }
            }
            if (unique)  {
                this.edges.push( {
                    done : false,
                    index1 : this.indices[(i * 3)    ],
                    index2 : this.indices[(i * 3) + 2],
                    normal1 : v3_val_new(this.normals[i * 9], this.normals[i * 9 + 1], this.normals[i * 9 + 2] ),
                    normal2 : v3_new(),
                    index31 : this.indices[(i * 3) + 1],
                    index32 : 0
                 }
                );
            }
        }

        this.edgesDone = true;
        log("edges: " + this.edges.length);
    }

    genEdges() {
        if (!this.uniquesDone) this.genUniqueVertices();

        this.edges = []; // of { done, index1, index2, normal1, normal2, index31, index32 } 
        // for a closed hull theres is (numFaces * 3 / 2 edges), each face has 3 edges, each edges is shared by 2 faces

        // each triangle has its flat normal, and the index of the 3 other adjascent triangles
        var triangles = [];
        for (var i = 0; i < this.indices.length; i += 3) {
            var nv1 = this.getPosition(i + 0);
            var nv2 = this.getPosition(i + 1);
            var nv3 = this.getPosition(i + 2);
            var uia =  [ this.indices[i + 0], this.indices[i + 1], this.indices[i + 2] ];
            triangles.push( { 
                ui : uia.slice(),
                n : v3_normal_new(nv1, nv2, nv3),
                t1i : findIn2ArrayExcept(this.boundTriangles[uia[0]], this.boundTriangles[uia[1]], Math.floor(i/3)), //neighbour triangles indices
                t2i : findIn2ArrayExcept(this.boundTriangles[uia[1]], this.boundTriangles[uia[2]], Math.floor(i/3)),
                t3i : findIn2ArrayExcept(this.boundTriangles[uia[2]], this.boundTriangles[uia[0]], Math.floor(i/3)) } );
        }

        // fill edge data
        for (var i = 0; i < triangles.length; ++i) {
            var usedIndices = new Map();
            var numOrphan = 0;

            usedIndices.set(triangles[i].ui[0], 0);
            usedIndices.set(triangles[i].ui[1], 0);
            usedIndices.set(triangles[i].ui[2], 0);

            // edge with t1
            if (triangles[i].t1i.length > 0) {
                if (triangles[i].t1i[0] > i) {
                    var edgeindices = findIn2Array( triangles[i].ui, triangles[triangles[i].t1i[0]].ui );

                    this.edges.push( { done: true,
                                    normal1: triangles[i].n,
                                    normal2: triangles[triangles[i].t1i[0]].n,
                                    index1: edgeindices[0],
                                    index2: edgeindices[1],
                                    index31: findNotIn2Array(edgeindices, triangles[i].ui)[0],
                                    index32: findNotIn2Array(edgeindices, triangles[triangles[i].t1i[0]].ui)[0]
                                    } );

                    usedIndices.set(edgeindices[0], usedIndices.get(edgeindices[0]) + 1);
                    usedIndices.set(edgeindices[1], usedIndices.get(edgeindices[1]) + 1);
                }
            } else numOrphan++;

            //edge with t2
            if (triangles[i].t2i.length > 0) {
                if (triangles[i].t2i[0] > i) {
                    var edgeindices = findIn2Array( triangles[i].ui, triangles[triangles[i].t2i[0]].ui );

                    this.edges.push( { done: true,
                                    normal1: triangles[i].n,
                                    normal2: triangles[triangles[i].t2i[0]].n,
                                    index1: edgeindices[0],
                                    index2: edgeindices[1],
                                    index31: findNotIn2Array(edgeindices, triangles[i].ui)[0],
                                    index32: findNotIn2Array(edgeindices, triangles[triangles[i].t2i[0]].ui)[0]
                                    } );

                    usedIndices.set(edgeindices[0], usedIndices.get(edgeindices[0]) + 1);
                    usedIndices.set(edgeindices[1], usedIndices.get(edgeindices[1]) + 1);
                }
            } else numOrphan++;

            //edge with t3
            if (triangles[i].t3i.length > 0) {
                if (triangles[i].t3i[0] > i) {
                    var edgeindices = findIn2Array( triangles[i].ui, triangles[triangles[i].t3i[0]].ui );

                    this.edges.push( { done: true,
                                    normal1: triangles[i].n,
                                    normal2: triangles[triangles[i].t3i[0]].n,
                                    index1: edgeindices[0],
                                    index2: edgeindices[1],
                                    index31: findNotIn2Array(edgeindices, triangles[i].ui)[0],
                                    index32: findNotIn2Array(edgeindices, triangles[triangles[i].t3i[0]].ui)[0]
                                    } );
                    usedIndices.set(edgeindices[0], usedIndices.get(edgeindices[0]) + 1);
                    usedIndices.set(edgeindices[1], usedIndices.get(edgeindices[1]) + 1);
                }
            } else numOrphan++;

            // 1 orphan
            // [ 2, 1a, 1b ]
            // edge is between 1a and 1b
            // 2 orphans
            // [ 0, 1a, 1b ]
            // edge1 is between 0 and 1a, and 0 and 1b
            if (numOrphan == 1) {
                var oIndices = [];
                for (var k of usedIndices.keys()) if (usedIndices.get(k) == 1) oIndices.push(k);
                this.edges.push( {  done: false,
                                    normal1: triangles[i].n,
                                    normal2: [0, 0, 0],
                                    index1: oIndices[0],
                                    index2: oIndices[1],
                                    index31: -1,
                                    index32: -1
                                    } );
            } else if (numOrphan == 2) {
                var oIndices = [];
                var summit = 0;
                for (var k of usedIndices.keys()) if (usedIndices.get(k) == 1) oIndices.push(k); else summit = k;
                this.edges.push( {  done: false,
                                    normal1: triangles[i].n,
                                    normal2: [0, 0, 0],
                                    index1: oIndices[0],
                                    index2: summit,
                                    index31: -1,
                                    index32: -1
                                    } );   
                this.edges.push( {  done: false,
                                    normal1: triangles[i].n,
                                    normal2: [0, 0, 0],
                                    index1: summit,
                                    index2: oIndices[1],
                                    index31: -1,
                                    index32: -1
                                    } );  
            } else if (numOrphan == 3) {
                this.edges.push( {  done: false,
                                    normal1: triangles[i].n,
                                    normal2: [0, 0, 0],
                                    index1: triangles[i].ui[0],
                                    index2: triangles[i].ui[1],
                                    index31: -1,
                                    index32: -1
                                    } );   
                this.edges.push( {  done: false,
                                    normal1: triangles[i].n,
                                    normal2: [0, 0, 0],
                                    index1: triangles[i].ui[1],
                                    index2: triangles[i].ui[2],
                                    index31: -1,
                                    index32: -1
                                    } );  
                this.edges.push( {  done: false,
                                    normal1: triangles[i].n,
                                    normal2: [0, 0, 0],
                                    index1: triangles[i].ui[2],
                                    index2: triangles[i].ui[0],
                                    index31: -1,
                                    index32: -1
                                    } );  
            }
        }

        this.edgesDone = true;
        log("edges: " + this.edges.length);
    }

    genBoundingBox() {
        this.boundingboxMax = [-Infinity, -Infinity, -Infinity];
        this.boundingboxMin = [ Infinity,  Infinity,  Infinity];
        this.boundingboxLength = -1.0;
        var v = v3_new();
        for (var i = 0; i < this.positions.length; i += 3) {
            v[0] = this.positions[i + 0];
            v[1] = this.positions[i + 1];
            v[2] = this.positions[i + 2];

            var l = v3_lengthsquared(v);
            if (l > this.boundingboxLength) this.boundingboxLength = l;

            if (v[0] < this.boundingboxMin[0]) this.boundingboxMin[0] = v[0];
            if (v[1] < this.boundingboxMin[1]) this.boundingboxMin[1] = v[1];
            if (v[2] < this.boundingboxMin[2]) this.boundingboxMin[2] = v[2];

            if (v[0] > this.boundingboxMax[0]) this.boundingboxMax[0] = v[0];
            if (v[1] > this.boundingboxMax[1]) this.boundingboxMax[1] = v[1];
            if (v[2] > this.boundingboxMax[2]) this.boundingboxMax[2] = v[2];
        }
        this.boundingboxLength = Math.sqrt(this.boundingboxLength);
        this.boundingboxDone = true;
    }



// Mesh creation methods


// Vertex, positions, normals, colors
    pushVertex(p, n, c) {        
        this.positions.push(p[0]);      this.positions.push(p[1]);      this.positions.push(p[2]);  
        this.normals.push(n[0]);        this.normals.push(n[1]);        this.normals.push(n[2]);   
        this.colors.push(c[0]);         this.colors.push(c[1]);         this.colors.push(c[2]);
    }

    getVertex(vertex_index) {
        if ((vertex_index+1) * 3 > this.positions.length) throw new Error("E3D_mesh.getVertex index out of bound");
        return { p: [this.positions[vertex_index * 3 + 0], this.positions[vertex_index * 3 + 1], this.positions[vertex_index * 3 + 2]],
                 n: [  this.normals[vertex_index * 3 + 0],   this.normals[vertex_index * 3 + 1],   this.normals[vertex_index * 3 + 2]],
                 c: [   this.colors[vertex_index * 3 + 0],    this.colors[vertex_index * 3 + 1],    this.colors[vertex_index * 3 + 2]]
                };
    }

    setVertex(vertex_index, p, n, c) {
        if ((vertex_index+1) * 3 > this.positions.length) throw new Error("E3D_mesh.setVertex index out of bound");
        var idx = vertex_index * 3;
        this.positions[idx + 0] = p[0];
        this.positions[idx + 1] = p[1];
        this.positions[idx + 2] = p[2];

        this.normals[idx + 0] = n[0];
        this.normals[idx + 1] = n[1];
        this.normals[idx + 2] = n[2];

        this.colors[idx + 0] = c[0];
        this.colors[idx + 1] = c[1];
        this.colors[idx + 2] = c[2];
    }

    getPosition(vertex_index) {
        if ((vertex_index+1) * 3 > this.positions.length) throw new Error("E3D_mesh.getPosition index out of bound");
        return [this.positions[vertex_index * 3 + 0], this.positions[vertex_index * 3 + 1], this.positions[vertex_index * 3 + 2] ];
    }

    getNormal(vertex_index) {
        if ((vertex_index+1) * 3 > this.normals.length) throw new Error("E3D_mesh.getNormal index out of bound");
        return [this.normals[vertex_index * 3 + 0],   this.normals[vertex_index * 3 + 1],   this.normals[vertex_index * 3 + 2] ];
    }

    getColor(vertex_index) {
        if ((vertex_index+1) * 3 > this.colors.length) throw new Error("E3D_mesh.getColor index out of bound");
        return [this.colors[vertex_index * 3 + 0],   this.colors[vertex_index * 3 + 1],   this.colors[vertex_index * 3 + 2] ];
    }

    setPosition(vertex_index, p) {
        if ((vertex_index+1) * 3 > this.positions.length) throw new Error("E3D_mesh.setPosition index out of bound");
        this.positions[vertex_index * 3 + 0] = p[0];
        this.positions[vertex_index * 3 + 1] = p[1];
        this.positions[vertex_index * 3 + 2] = p[2];
    }

    setNormal(vertex_index, n) {
        if ((vertex_index+1) * 3 > this.normals.length) throw new Error("E3D_mesh.setNormal index out of bound");
        this.normals[vertex_index * 3 + 0] = n[0];
        this.normals[vertex_index * 3 + 1] = n[1];
        this.normals[vertex_index * 3 + 2] = n[2];
    }

    setColor(vertex_index, c) {
        if ((vertex_index+1) * 3 > this.colors.length) throw new Error("E3D_mesh.setColor index out of bound");
        this.colors[vertex_index * 3 + 0] = c[0];
        this.colors[vertex_index * 3 + 1] = c[1];
        this.colors[vertex_index * 3 + 2] = c[2];
    }

// Triangles
    pushTriangle(p1, p2, p3, n1, n2, n3, c1, c2, c3) {
        this.pushVertex(p1, n1, c1);
        this.pushVertex(p2, n2, c2);
        this.pushVertex(p3, n3, c3);
    }

    getTriangle(triangle_index) {
        if ((triangle_index+1) * 9 > this.positions.length) throw new Error("E3D_mesh.getTriangle index out of bound");
        return {
            p1: this.getVertex(triangle_index * 3 + 0),
            p2: this.getVertex(triangle_index * 3 + 1),
            p3: this.getVertex(triangle_index * 3 + 2)
        }
    }
    
    pushTriangle3p(p1, p2, p3, color = _v3_white, c2 = null, c3 = null) {
        if (c2 == null) {
            c2 = color;
            c3 = color;
        }
        var n = v3_normal_new(p1, p2, p3);
        this.pushTriangle(p1, p2, p3, n, n, n, color, c2, c3);
    }

// Quads
    pushQuad(p1, p2, p3, p4, n1, n2, n3, n4, c1, c2, c3, c4) {
        this.pushVertex(p1, n1, c1);
        this.pushVertex(p2, n2, c2);
        this.pushVertex(p3, n3, c3);

        this.pushVertex(p3, n3, c3);
        this.pushVertex(p4, n4, c4);
        this.pushVertex(p1, n1, c1);
    }

    pushQuad4p(p1, p2, p3, p4, color = _v3_white, c2 = null, c3 = null, c4 = null) {
        if (c2 == null) {
            c2 = color;
            c3 = color;
            c4 = color;
        }
        var n = v3_normal_new(p1, p2, p3);
        this.pushQuad(p1, p2, p3, p4, n, n, n, n, color, c2, c3, c4);
    }

    
    pushDoubleSidedQuad4p(p1, p2, p3, p4, color = _v3_white, c2 = null, c3 = null, c4 = null) {
        if (c2 == null) {
            c2 = color;
            c3 = color;
            c4 = color;
        }
        var n = v3_normal_new(p1, p2, p3);
        this.pushQuad(p1, p2, p3, p4, n, n, n, n, color, c2, c3, c4);
        v3_negate_mod(n);
        this.pushQuad(p4, p3, p2, p1, n, n, n, n, c4, c3, c2, color);
    }



// Wall
    // Add quad, vertical, facing viewer
    pushWall(pleft, pright, height, color = _v3_white) {
        var pleftTop = v3_val_new(pleft[0], pleft[1] + height, pleft[2]);
        var prightTop = v3_val_new(pright[0], pright[1] + height, pright[2]);

        this.pushQuad4p(prightTop, pleftTop, pleft, pright, color);
    }

// Plane
    pushPlane(position, rotation, width, height, depthOffset = 0.0, color = _v3_white, c2 = null, c3 = null, c4 = null) {
        m4_transform_res(_mesh_prim_mat, position, rotation);
        width /= 2;
        height /= 2;
        this.pushQuad4p(v3_applym4_new([-width, -height, depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([ width, -height, depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([ width,  height, depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([-width,  height, depthOffset], _mesh_prim_mat), 
                        color, c2, c3, c4);
    }
  
    pushDoubleSidedPlane(position, rotation, width, height, depthOffset = 0.0, color = _v3_white, c2 = null, c3 = null, c4 = null) {
        m4_transform_res(_mesh_prim_mat, position, rotation);
        width /= 2;
        height /= 2;
        depthOffset /= 2;
        if (c4 == null) c4 = color;
        this.pushQuad4p(v3_applym4_new([-width, -height, depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([ width, -height, depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([ width,  height, depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([-width,  height, depthOffset], _mesh_prim_mat), 
                        color, c2, c3, c4);
        this.pushQuad4p(v3_applym4_new([-width,  height, -depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([ width,  height, -depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([ width, -height, -depthOffset], _mesh_prim_mat), 
                        v3_applym4_new([-width, -height, -depthOffset], _mesh_prim_mat), 
                        c4, c3, c2, color);
    }



    
// Primitives
    pushBox(position, rotation, width, height, depth, color = _v3_white, cback = null, ctop = null, cbottom = null, cright = null, cleft = null) {
        if (cback == null) {
            cback = color;
            ctop = color;
            cbottom = color;
            cright = color;
            cleft = color;
        }
        m4_transform_res(_mesh_prim_mat, position, rotation);
        width /= 2;
        height /= 2;
        depth /= 2;
        var lbb = v3_applym4_new([-width, -height, -depth], _mesh_prim_mat);
        var rbb = v3_applym4_new([ width, -height, -depth], _mesh_prim_mat);
        var rbf = v3_applym4_new([ width, -height,  depth], _mesh_prim_mat);
        var lbf = v3_applym4_new([-width, -height,  depth], _mesh_prim_mat);
        var ltb = v3_applym4_new([-width,  height, -depth], _mesh_prim_mat);
        var rtb = v3_applym4_new([ width,  height, -depth], _mesh_prim_mat);
        var rtf = v3_applym4_new([ width,  height,  depth], _mesh_prim_mat);
        var ltf = v3_applym4_new([-width,  height,  depth], _mesh_prim_mat);

        this.pushQuad4p(lbb, rbb, rbf, lbf, cbottom); /// bottom
        this.pushQuad4p(ltb, ltf, rtf, rtb, ctop); /// top

        this.pushQuad4p(lbb, lbf, ltf, ltb, cleft); /// left
        this.pushQuad4p(rbf, rbb, rtb, rtf, cright); /// right

        this.pushQuad4p(lbb, ltb, rtb, rbb, cback); /// back
        this.pushQuad4p(lbf, rbf, rtf, ltf, color); /// front
    }
    
    pushPyramid(position, rotation, radius, height, nbSides, color = _v3_white, closedBase = true) {
        m4_transform_res(_mesh_prim_mat, position, rotation);

        // points
        var ps = [0, height, 0];
        var pb = [0, 0, 0];
        var pts = [];
        pts[0] = [radius, 0, 0];
        for (var i = 1; i < nbSides; ++i) pts.push(v3_rotateY_new(pts[0], (PIx2 / nbSides) * i));

        // adjust for position and rotation
        v3a_applym4_mod(pts, _mesh_prim_mat);

        // faces
        for (var i = 0; i < nbSides; ++i) {
            this.pushTriangle3p( pts[(i + 1) % nbSides], ps, pts[i], color); //sides
            if (closedBase) this.pushTriangle3p( pts[i], pb, pts[(i + 1) % nbSides], color); //base
        }
    }
    pushBiPyramid(position, rotation, radius, height, nbSides, color = _v3_white) {
        m4_transform_res(_mesh_prim_mat, position, rotation);

        // points
        var ps = [0,  height / 2, 0];
        var pb = [0, -height / 2, 0];
        var pts = [];
        pts[0] = [radius, 0, 0];
        for (var i = 1; i < nbSides; ++i) pts.push(v3_rotateY_new(pts[0], (PIx2 / nbSides) * i));

        // adjust for position and rotation
        v3a_applym4_mod(pts, _mesh_prim_mat);

        // faces
        for (var i = 0; i < nbSides; ++i) {
            this.pushTriangle3p( pts[(i + 1) % nbSides], ps, pts[i], color); //top sides
            this.pushTriangle3p( pts[i], pb, pts[(i + 1) % nbSides], color); //bottom sides
        }
    }

    pushPrism(position, rotation, radius, height, nbSides, color = _v3_white, closedBase = true, closedTop = true) {
        m4_transform_res(_mesh_prim_mat, position, rotation);

        // points
        var pt = [0, height, 0];
        var pb = [0, 0, 0];
        var ptst = [];
        var ptsb = [];
        ptsb[0] = [radius, 0, 0]; 
        for (var i = 1; i < nbSides; ++i) ptsb.push(v3_rotateY_new(ptsb[0], (PIx2 / nbSides) * i));
        for (var i = 0; i < nbSides; ++i) ptst.push(v3_add_new(ptsb[i], pt));

        // adjust for position and rotation
        v3a_applym4_mod(ptsb, _mesh_prim_mat);
        v3a_applym4_mod(ptst, _mesh_prim_mat);
        
        // faces
        for (var i = 0; i < nbSides; ++i) {
            this.pushQuad4p(ptsb[(i + 1) % nbSides], ptst[(i + 1) % nbSides], ptst[i] , ptsb[i], color); //sides 
            if (closedBase) this.pushTriangle3p(ptsb[i], pb, ptsb[(i + 1) % nbSides ], color); //base  
            if (closedTop) this.pushTriangle3p(ptst[(i + 1) % nbSides], pt, ptst[i], color); //top   
        }

    }

    pushTorus(position, rotation, radius, sectionRadius, nbSections, nbSides, color = _v3_white) {
        m4_transform_res(_mesh_prim_mat, position, rotation);

        var pts = [];
        // create section circle around Z
        pts.push([-sectionRadius, 0, 0]);
        for (var i = 1; i < nbSides; ++i) pts.push(v3_rotateZ_new(pts[0], (PIx2 / nbSides) * i));

        // move circle to radius
        var offset = [radius, 0, 0];
        for (var i = 0; i < nbSides; ++i) v3_add_mod(pts[i], offset);

        // copy and rotate section around Y center at radius
        for (var j = 1; j < nbSections; ++j) for (var i = 0; i < nbSides; ++i) pts.push(v3_rotateY_new(pts[i], (PIx2 / nbSections) * j));

        // adjust for position and rotation
        v3a_applym4_mod(pts, _mesh_prim_mat);

        // create faces
        for (var j = 0; j < nbSections; ++j) for (var i = 0; i < nbSides; ++i) {
            var nextI = (i + 1) % nbSides;
            var nextJ = (j + 1) % nbSections;
            this.pushQuad4p( pts[i     + (j     * nbSides) ], 
                                pts[i     + (nextJ * nbSides) ], 
                                pts[nextI + (nextJ * nbSides) ], 
                                pts[nextI + (j     * nbSides) ], color);   
        }
    }

    pushSphere(position, rotation, radius, depth = 3, color = _v3_white, baseType = this.sphereBaseType.ICO) {
        m4_transform_res(_mesh_prim_mat, position, rotation);

        var pts = [];
        var faces = [];

        switch(baseType) {
            case this.sphereBaseType.CUBE:
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
            break;

            case this.sphereBaseType.TETRA:
                pts[0] = [ 0.0000,  1.0000,  0.0000];
                pts[1] = [ 0.9428, -0.3333,  0.0000];
                pts[2] = [-0.4714, -0.3333,  0.8165];     
                pts[3] = [-0.4714, -0.3333, -0.8165];  

                faces.push([0, 1, 3]);
                faces.push([0, 3, 2]);
                faces.push([0, 2, 1]);
                faces.push([1, 2, 3]);
            break;

            case this.sphereBaseType.BITETRA:
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
            break;

            case this.sphereBaseType.OCTA:
                pts[0] = [ 0,  1,  0]; // top
                pts[1] = [ 0, -1,  0]; // bottom
                pts[2] = [ 1,  0,  0]; // right
                pts[3] = [-1,  0,  0]; // left
                pts[4] = [ 0,  0,  1]; // front
                pts[5] = [ 0,  0, -1]; // back
                         
                faces.push([0, 4, 2]);
                faces.push([0, 3, 4]);        
                faces.push([0, 5, 3]);
                faces.push([0, 2, 5]);        
        
                faces.push([1, 2, 4]);
                faces.push([1, 4, 3]);                 
                faces.push([1, 3, 5]);
                faces.push([1, 5, 2]);
            break;

            case this.sphereBaseType.ICO:
                // icoharedon
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
            break;
        }

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
        v3a_scale_mod(pts, radius);

        // adjust for position and rotation
        v3a_applym4_mod(pts, _mesh_prim_mat);

        // write the faces to the mesh
        for (var i = 0; i < faces.length; ++i) this.pushTriangle3p(pts[faces[i][0]], pts[faces[i][1]], pts[faces[i][2]], color);


    }
    
    
    pushTube(position, rotation, innerRadius, outerRadius, height, nbSides, color = _v3_white, closedBase = true, closedTop = true) {
        m4_transform_res(_mesh_prim_mat, position, rotation);

        // points
        var pt = [0, height, 0];
        var ptst = []; // side top
        var ptsb = []; // side base
        ptsb[0] = [outerRadius, 0, 0]; 
        var ptbt = []; // bore top
        var ptbb = []; // bore base
        ptbb[0] = [innerRadius, 0, 0]; 

        for (var i = 1; i < nbSides; ++i) {
            ptsb.push(v3_rotateY_new(ptsb[0], (PIx2 / nbSides) * i));
            ptbb.push(v3_rotateY_new(ptbb[0], (PIx2 / nbSides) * i));
        }
        for (var i = 0; i < nbSides; ++i) {
            ptst.push(v3_add_new(ptsb[i], pt));
            ptbt.push(v3_add_new(ptbb[i], pt));
        }

        // adjust for position and rotation
        v3a_applym4_mod(ptsb, _mesh_prim_mat);       
        v3a_applym4_mod(ptst, _mesh_prim_mat);
        
        // faces
        for (var i = 0; i < nbSides; ++i) {

            this.pushQuad4p(ptsb[(i + 1) % nbSides], ptst[(i + 1) % nbSides], ptst[i] , ptsb[i], color); //outer sides 
            this.pushQuad4p(ptbb[i], ptbt[i], ptbt[(i + 1) % nbSides] , ptbb[(i + 1) % nbSides], color); //inner sides (bore)

            if (closedBase) this.pushQuad4p(ptsb[i], ptbb[i], ptbb[(i + 1) % nbSides], ptsb[(i + 1) % nbSides], color); //base  
            if (closedTop) this.pushQuad4p(ptst[i], ptst[(i + 1) % nbSides], ptbt[(i + 1) % nbSides], ptbt[i] , color); //top   

        }

    }



}


