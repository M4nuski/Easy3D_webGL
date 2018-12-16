// Helper class to load/parse data from ressource to classes/GL

class E3D_loader {

 /**
 * Load entity from raw ascii data
 *
 * @param {string} name / id of the new entity
 * @param {string} file / path of the new entity
 * @param {string} rawModelData the source data to parse
 * @param {float} smoothShading if > 0.0 limit angle to perform smooth shading, otherwise flat shaded
 * @param {vec3} color the entity color, if === "sweep" per vertex r/g/b sweep applied
 * @returns {E3D_entity} the resulting model and entity data
 */
    static loadModel_RAW(name, file, rawModelData, smoothShading, color) {
        
        let entity = new E3D_entity(name, file, false);

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

}