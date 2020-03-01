// Easy3D_WebGL
// Helper class to load 3D model data into entities
// Emmanuel Charette 2017-2020

"use strict"


class E3D_loader {

    constructor() {

        this.file = "";

        this.numFloats = 0;

        this.colors = [];
        this.positions = [];
        this.normals = [];

        this.uniquesDone = false;
        this.uniques = [];
        this.indices = [];
        this.reverseIndices = [];
        this.maxIndex = 0;

        this.edgesDone = false;
        this.edges = [];

        // TODO create struct with v3s for loading and parsing
        // and convert to array of float only on "add"
    }

    reset() {
        this.file = "";

        this.numFloats = 0;

        this.colors = [];
        this.positions = [];
        this.normals = [];

        this.uniquesDone = false;
        this.uniques = [];
        this.indices = [];
        this.reverseIndices = [];
        this.maxIndex = 0;

        this.edgesDone = false;
        this.edges = [];
    }

// Entity Data Writers

    addModelData(entity){
        entity.file = this.file;

        entity.vertexArray = new Float32Array(this.positions);
        entity.colorArray = new Float32Array(this.colors);
        entity.normalArray = new Float32Array(this.normals);

        entity.numElements = this.numFloats / 3;
    }

    addStrokeData(entity, addOrphanEdges = false, cosineLimit = 0.8)  {       
        entity.numStrokeElements = 0;
        entity.drawStrokes = false;
        
        if (!this.edgesDone) this.genEdges();
        
        var strokeList = [];
        for (var i = 0; i < this.edges.length; ++i) if ( (addOrphanEdges && !this.edges[i].done) ||
             (Math.abs(v3_dot(this.edges[i].normal1, this.edges[i].normal2)) < cosineLimit) ) {
            strokeList.push(this.reverseIndices[this.edges[i].index1]);
            strokeList.push(this.reverseIndices[this.edges[i].index2]);
        }
        
        if (strokeList.length > 0) {
            entity.strokeIndexArray = new Uint16Array(strokeList);
            entity.numStrokeElements = strokeList.length;
            entity.drawStrokes = true;
        }
        log((strokeList.length / 2) + " strokes");  
    }


    addCDFromData(entity) {

        let v1 = [0, 0, 0];
        let v2 = [0, 0, 0];
        let v3 = [0, 0, 0];
        let d21 = [0, 0, 0];
        let d31 = [0, 0, 0];
        let newNormal = [0, 0, 0];

        for (var i = 0; i < this.numFloats / 9; i++) { // for each face

            v3_val_res(v1, this.positions[(i * 9)    ], this.positions[(i * 9) + 1], this.positions[(i * 9) + 2]);
            v3_val_res(v2, this.positions[(i * 9) + 3], this.positions[(i * 9) + 4], this.positions[(i * 9) + 5]);
            v3_val_res(v3, this.positions[(i * 9) + 6], this.positions[(i * 9) + 7], this.positions[(i * 9) + 8]);     

            
            v3_sub_res(d21, v2, v1);
            v3_sub_res(d31, v3, v1);
            v3_cross_res(newNormal, d21, d31);
            v3_normalize_mod(newNormal);
            entity.pushCD_triangle(newNormal, v1, v2, v3);
        }
        log(entity.CD_triangle + " CD triangles");

        if (!this.edgesDone) this.genEdges();

        var centroid1 = v3_new();
        var centroid2 = v3_new();

        for (var i = 0; i < this.edges.length; ++i) { // for each edge

            v3_avg3_res(centroid1, this.uniques[this.edges[i].index1], this.uniques[this.edges[i].index2], this.uniques[this.edges[i].index31]);
            v3_avg3_res(centroid2, this.uniques[this.edges[i].index1], this.uniques[this.edges[i].index2], this.uniques[this.edges[i].index32]);
            v3_sub_mod(centroid1, centroid2);
            
            if (v3_dot(centroid1, this.edges[i].normal2) < -0.001) entity.pushCD_edge2p(this.uniques[this.edges[i].index1], this.uniques[this.edges[i].index2]);
        }

        log(entity.CD_edge + " CD edges");
        entity.collisionDetection = true;
    }


    removeNormals() {
        for (var i = 0; i < this.normals.length; ++i) this.normals[i] = 0.0;
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
                    this.colors.push(colorSweep[this.numFloats % 9]);
                    this.numFloats++;
                }
            }
        }

        // apply scale
        if (scale != _v3_unit) {
            for (var i = 0; i < this.numFloats / 3; i++) { // for each vertex                
               this.positions[(i * 3)    ] = this.positions[(i * 3)]     * scale[0];
               this.positions[(i * 3) + 1] = this.positions[(i * 3) + 1] * scale[1];
               this.positions[(i * 3) + 2] = this.positions[(i * 3) + 2] * scale[2];
            }
        }

        let newNormal = [0, 0, 0];
        let v1 = [0, 0, 0];
        let v2 = [0, 0, 0];
        let v3 = [0, 0, 0];

        // create face normals
        for (var i = 0; i < this.numFloats / 9; i++) { // for each face
            v3_val_res(v1, this.positions[(i * 9)    ], this.positions[(i * 9) + 1], this.positions[(i * 9) + 2] );
            v3_val_res(v2, this.positions[(i * 9) + 3], this.positions[(i * 9) + 4], this.positions[(i * 9) + 5] );
            v3_val_res(v3, this.positions[(i * 9) + 6], this.positions[(i * 9) + 7], this.positions[(i * 9) + 8] );

            v3_sub_mod(v2, v1);
            v3_sub_mod(v3, v1);
            v3_cross_res(newNormal, v2, v3);
            v3_normalize_mod(newNormal);

            this.normals.push(newNormal[0]); // flat shading
            this.normals.push(newNormal[1]); 
            this.normals.push(newNormal[2]); 

            this.normals.push(newNormal[0]); // flat shading
            this.normals.push(newNormal[1]); 
            this.normals.push(newNormal[2]); 

            this.normals.push(newNormal[0]); // flat shading
            this.normals.push(newNormal[1]); 
            this.normals.push(newNormal[2]); 
        }

        log("Loaded " + this.numFloats + " float locations");
        log((this.numFloats / 3) + " vertices");
        log((this.numFloats / 9) + " triangles"); 
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

        let thiscolor = [0, 0, 0];

        let mData = new DataView(rawModelData);

        let NumTriangle = mData.getUint32(80, true);
        this.numFloats = NumTriangle * 9;

        let header = "";
        for (var i = 0; i < 80; ++i) header += String.fromCharCode(mData.getUint8(i));

        log("Header " + header);
        log("num triangles 0x" + NumTriangle.toString(16) + " dec " + NumTriangle);

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

                this.colors.push(thiscolor[0]);this.colors.push(thiscolor[1]);this.colors.push(thiscolor[2]);
                this.colors.push(thiscolor[0]);this.colors.push(thiscolor[1]);this.colors.push(thiscolor[2]);
                this.colors.push(thiscolor[0]);this.colors.push(thiscolor[1]);this.colors.push(thiscolor[2]);
            } else if (color == "sweep") {
                this.colors.push(colorSweep[0]);this.colors.push(colorSweep[1]);this.colors.push(colorSweep[2]);
                this.colors.push(colorSweep[3]);this.colors.push(colorSweep[4]);this.colors.push(colorSweep[5]);
                this.colors.push(colorSweep[6]);this.colors.push(colorSweep[7]);this.colors.push(colorSweep[8]);              
            } else {
                this.colors.push(color[0]);this.colors.push(color[1]);this.colors.push(color[2]);
                this.colors.push(color[0]);this.colors.push(color[1]);this.colors.push(color[2]);
                this.colors.push(color[0]);this.colors.push(color[1]);this.colors.push(color[2]);

            }

            this.positions.push(p0[0]); this.positions.push(p0[1]);this.positions.push(p0[2]);
            this.positions.push(p1[0]); this.positions.push(p1[1]);this.positions.push(p1[2]);
            this.positions.push(p2[0]); this.positions.push(p2[1]);this.positions.push(p2[2]);



            if ((normal[0] == 0) && (normal[1] == 0) && (normal[2] == 0)) {
                v3_sub_mod(p1, p0);
                v3_sub_mod(p2, p0);
                v3_cross_res(normal, p2, p1);
                v3_normalize_mod(normal);
            }

            /*var v1 = new Vector3(p1.X - p0.X, p1.Y - p0.Y, p1.Z - p0.Z);
            var v2 = new Vector3(p2.X - p0.X, p2.Y - p0.Y, p2.Z - p0.Z);
            var res = Vector3.Cross(v1, v2);

            res.Normalize();
            return res;*/

            this.normals.push(normal[0]);this.normals.push(normal[1]);this.normals.push(normal[2]);
            this.normals.push(normal[0]);this.normals.push(normal[1]);this.normals.push(normal[2]);
            this.normals.push(normal[0]);this.normals.push(normal[1]);this.normals.push(normal[2]);

        }

        log(NumTriangle + " triangles"); 
    }




// Data Processing Utilities





    genUniqueVertices() {
        let numVert = this.numFloats / 3;
        let curVert = v3_new();
        this.uniques = [];
        this.indices = [];
        this.reverseIndices = [];

        for (var i = 0; i < numVert; ++i) {
            var unique = true;
            v3_val_res(curVert, this.positions[(i * 3)], this.positions[(i * 3) + 1], this.positions[(i * 3) + 2] );
            for (var j = 0; j < this.uniques.length; ++j) {
                if (v3_equals(this.uniques[j], curVert)) {
                    unique = false;
                    this.indices[i] = j;
                    break;
                }
            }
            if (unique) { 
                this.uniques.push(v3_clone(curVert));
                this.reverseIndices.push(i);
                this.indices[i] = this.uniques.length-1;
            } 
        }

        this.uniquesDone = true;
        log("unique Vert: " + this.uniques.length);
    }



    smoothNormals(cosineLimit) {

        if (!this.uniquesDone) this.genUniqueVertices();

        var avgNorms = new Array(this.uniques.length);        
        
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


    genEdges() {

        if (!this.uniquesDone) this.genUniqueVertices();

        this.edges = []; // of { done, index1, index2, normal1, normal2, index3a, index3b } 

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

    




}




