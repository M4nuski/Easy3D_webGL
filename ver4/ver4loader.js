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
 * @param {float} smoothShading if > 0.0 limit angle to perform smooth shading, otherwise flat shaded
 * @param {vec3} color the entity color, if === "sweep" per vertex r/g/b sweep applied
 * @returns {E3D_entity} the resulting model and entity data
 */
    static loadModel_RAW(name, file, rawModelData, smoothShading, color, dynamic = false) {
        
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
        rawModelData = [];
        for (var i = 0; i < data.length; i++) {
            if ((data[i] != "") && (data[i].split(" ").length != 1)) {
                rawModelData.push(data[i]);
            }
        }

        // parse locations
        for (var i = 0; i < rawModelData.length; i++) {
            var chunk = rawModelData[i].split(" ");
            for (var j = 0; j < chunk.length; j++) {
                var n = chunk[j].trim();
                if (n != "") {
                    positions.push(Number(chunk[j].trim()));
                    colors.push(colorSweep[numFloats % 9]);
                    numFloats++;
                }
            }
        }

        let newNormal = [0, 0, 0];
        // create face normals
        for (var i = 0; i < numFloats / 9; i++) { // for each face
            var v1 = [positions[i * 9], positions[(i * 9) + 1], positions[(i * 9) + 2]];
            var v2 = [positions[(i * 9) + 3], positions[(i * 9) + 4], positions[(i * 9) + 5]];
            var v3 = [positions[(i * 9) + 6], positions[(i * 9) + 7], positions[(i * 9) + 8]];

            v2 = vec3.subtract(v2, v2, v1);
            v3 = vec3.subtract(v3, v3, v1);
            vec3.cross(newNormal, v3, v2);
            vec3.normalize(newNormal, newNormal);

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

        if (smoothShading > 0.0) {
            console.log("Smooth Shading Normals");
            // group vertex by locality (list of unique location)
            // average normals per locality
            // if diff < smoothShading normal is average
            // else keep flat normal
            // expand back
            let numVert =  (numFloats / 3);
            console.log("numVert: " + numVert);
            var uniqueVertex = [];
            var indices = [numVert];

            for (var i = 0; i < numVert; ++i) {
                var unique = true;
                var curVert = [positions[i*3], positions[(i*3)+1], positions[(i*3)+2] ];
                for (var j = 0; j < uniqueVertex.length; ++j) {
                    if ((unique) && (vec3.equals(uniqueVertex[j], curVert))) {
                        unique = false;
                        indices[i] = j;
                    }
                }
                if (unique) { 
                    uniqueVertex.push(vec3.clone(curVert));
                    indices[i] = uniqueVertex.length-1;
                } 
            }

            console.log("unique Vert: " + uniqueVertex.length);

            var avgNorms = [uniqueVertex.length];
            // for all unique, average normals
            //
            for (var i = 0; i < uniqueVertex.length; ++i) { // i index in uniqueVertex and avgNorms
                avgNorms[i] = [0, 0, 0];

                for (var j = 0; j < indices.length; ++j) {// j index in indices and normals*3 
                    if (indices[j] == i) {
                        var curNorm = [normals[j*3], normals[(j*3)+1], normals[(j*3)+2] ];
                        vec3.add(avgNorms[i] , avgNorms[i], curNorm);
                    }
                }

                vec3.normalize(avgNorms[i], avgNorms[i]);
            }

            console.log("Smoothing...");

            for (var i = 0; i < uniqueVertex.length; ++i) { // i index in uniqueVertex and avgNorms

                for (var j = 0; j < indices.length; ++j) {// j index in indices and normals*3 
                    if (indices[j] == i) {
                        var curNorm = [normals[j*3], normals[(j*3)+1], normals[(j*3)+2] ];

                        if (vec3.angle(avgNorms[i], curNorm) < smoothShading) {
                            normals[j*3] = avgNorms[i][0];
                            normals[(j*3)+1] = avgNorms[i][1];
                            normals[(j*3)+2] = avgNorms[i][2];
                        }
                    }
                }
            }

            console.log("Expanding...");
            for (var i = 0; i < numVert; ++i) {
                var unique = true;
                var curVert = [positions[i*3], positions[(i*3)+1], positions[(i*3)+2] ];
                for (var j = 0; j < uniqueVertex.length; ++j) {
                    if ((unique) && (vec3.equals(uniqueVertex[j], curVert))) unique = false;
                }
                if (unique) uniqueVertex.push(vec3.clone(curVert));
            }
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
 * Load entity from raw stl data
 *
 * @param {string} name / id of the new entity
 * @param {string} file / path of the new entity
 * @param {DataView} rawModelData the source data
 * @param {float} smoothShading if > 0.0 limit angle to perform smooth shading, otherwise flat shaded
 * @param {vec3} color if === "source" use source color, if === "sweep" per vertex r/g/b sweep, else single provided color is applied
 * @returns {E3D_entity} the resulting model E3D_Entity data
 */
    static loadModel_STL(name, file, rawModelData, smoothShading, color, dynamic = false) {
            
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

            p0[0] = mData.getFloat32(idx+12, true);//x
            p0[2] = -mData.getFloat32(idx+16, true);//y
            p0[1] = mData.getFloat32(idx+20, true);//z

            p1[0] = mData.getFloat32(idx+24, true);//x
            p1[2] = -mData.getFloat32(idx+28, true);//y
            p1[1] = mData.getFloat32(idx+32, true);//z

            p2[0] = mData.getFloat32(idx+36, true);//x
            p2[2] = -mData.getFloat32(idx+40, true);//y
            p2[1] = mData.getFloat32(idx+44, true);//z 

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
                vec3.subtract(p1, p1, p0);
                vec3.subtract(p2, p2, p0);
                vec3.cross(normal, p2, p1);
                vec3.normalize(normal, normal);
                //TODO add smoothing
                //TODO extract from all loaders 
            }

            normals.push(normal[0]);normals.push(normal[1]);normals.push(normal[2]);
            normals.push(normal[0]);normals.push(normal[1]);normals.push(normal[2]);
            normals.push(normal[0]);normals.push(normal[1]);normals.push(normal[2]);

        }

        // Dump data into entity
        entity.vertexArray = new Float32Array(positions);
        entity.colorArray = new Float32Array(colors);
        entity.normalArray = new Float32Array(normals);
        entity.numElements = NumTriangle * 3;

/*
        if (smoothShading > 0.0) {
            console.log("Smooth Shading Normals");
            // group vertex by locality (list of unique location)
            // average normals per locality
            // if diff < smoothShading normal is average
            // else keep flat normal
            // expand back
            let numVert =  (numFloats / 3);
            console.log("numVert: " + numVert);
            var uniqueVertex = [];
            var indices = [numVert];

            for (var i = 0; i < numVert; ++i) {
                var unique = true;
                var curVert = [positions[i*3], positions[(i*3)+1], positions[(i*3)+2] ];
                for (var j = 0; j < uniqueVertex.length; ++j) {
                    if ((unique) && (vec3.equals(uniqueVertex[j], curVert))) {
                        unique = false;
                        indices[i] = j;
                    }
                }
                if (unique) { 
                    uniqueVertex.push(vec3.clone(curVert));
                    indices[i] = uniqueVertex.length-1;
                } 
            }

            console.log("unique Vert: " + uniqueVertex.length);

            var avgNorms = [uniqueVertex.length];
            // for all unique, average normals
            //
            for (var i = 0; i < uniqueVertex.length; ++i) { // i index in uniqueVertex and avgNorms
                avgNorms[i] = [0, 0, 0];

                for (var j = 0; j < indices.length; ++j) {// j index in indices and normals*3 
                    if (indices[j] == i) {
                        var curNorm = [normals[j*3], normals[(j*3)+1], normals[(j*3)+2] ];
                        vec3.add(avgNorms[i] , avgNorms[i], curNorm);
                    }
                }

                vec3.normalize(avgNorms[i], avgNorms[i]);
            }

            console.log("Smoothing...");

            for (var i = 0; i < uniqueVertex.length; ++i) { // i index in uniqueVertex and avgNorms

                for (var j = 0; j < indices.length; ++j) {// j index in indices and normals*3 
                    if (indices[j] == i) {
                        var curNorm = [normals[j*3], normals[(j*3)+1], normals[(j*3)+2] ];

                        if (vec3.angle(avgNorms[i], curNorm) < smoothShading) {
                            normals[j*3] = avgNorms[i][0];
                            normals[(j*3)+1] = avgNorms[i][1];
                            normals[(j*3)+2] = avgNorms[i][2];
                        }
                    }
                }
            }


            for (var i = 0; i < numVert; ++i) {
                var unique = true;
                var curVert = [positions[i*3], positions[(i*3)+1], positions[(i*3)+2] ];
                for (var j = 0; j < uniqueVertex.length; ++j) {
                    if ((unique) && (vec3.equals(uniqueVertex[j], curVert))) unique = false;
                }
                if (unique) uniqueVertex.push(vec3.clone(curVert));
            }
        }


*/
        return entity;
    }


}



/*

internal struct VertexData
    {
        public Vector4 Color;
        public Vector3 Normal, V1, V2, V3;
    }

    class STL_Loader
    {
        public readonly UInt32 NumTriangle;
        public readonly VertexData[] Triangles;

        private static Vector3 ReadVector3(BinaryReader reader)
        {
            return new Vector3(
                reader.ReadSingle(),
                reader.ReadSingle(),
                reader.ReadSingle()
                );
        }

        private static VertexData ReadVertexData(BinaryReader reader)
        {
            return new VertexData {
                Normal = ReadVector3(reader),
                V1 = ReadVector3(reader),
                V2 = ReadVector3(reader),
                V3 = ReadVector3(reader),
                Color = ConvertColors(reader.ReadUInt16())
            };
        }

        private static Vector4 ConvertColors(UInt16 ucolor)
        {
            return new Vector4(
                (ucolor & 0x001F)/31f,
                ((ucolor & 0x03E0) >> 5)/31f,
                ((ucolor & 0x7C00) >> 10)/31f,
                1.0f);
        }

        public STL_Loader(string fileName)
        {
            if (File.Exists(fileName))
            {
                var fileStream = File.OpenRead(fileName);
                var binaryReader = new BinaryReader(fileStream);

                var header = new byte[80];
                binaryReader.Read(header, 0, 80);

                NumTriangle = binaryReader.ReadUInt32();

                Triangles = new VertexData[NumTriangle];

                for (int i = 0; i < NumTriangle; i++)
                {
                    Triangles[i] = ReadVertexData(binaryReader);
                }

                binaryReader.Close();
                fileStream.Close();
            }
        }
    }



    */