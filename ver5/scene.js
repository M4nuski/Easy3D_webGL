// Easy3D_WebGL
// Scene class, gathering all state and entities, shaders, lights and camera
// Emmanuel Charette 2017-2020

"use strict"


// Scene State (exclusives)
const E3D_CREATED = 0;
const E3D_READY = 1;
const E3D_ACTIVE = 2;


class E3D_scene {
    constructor(id, vBackColor = [0.0, 0.0, 0.1, 1.0], fogLimit = -1) {
        this.id = id;
        this.state = E3D_CREATED;

        this.program = null;    
        this.lights = new E3D_lighting();
        this.clearColor = vBackColor;
        this.fogLimit = fogLimit;
        this.fogFactor = 1.0;

        this.drawnElemenets = 0; // some stats
    }

    initialize() {
        // config GL context        
        CONTEXT.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        CONTEXT.clearDepth(1.0);
        CONTEXT.enable(CONTEXT.DEPTH_TEST);
        CONTEXT.depthFunc(CONTEXT.LEQUAL);
        CONTEXT.cullFace(CONTEXT.BACK);
        CONTEXT.enable(CONTEXT.CULL_FACE); 

        this.state = E3D_READY;
    }

    changeClearColor(color) {
        this.clearColor = color;
        CONTEXT.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
    }

    preRender() {
        // for this shader
        if (this.lights.light0_lockToCamera) {
            this.lights.light0_adjusted = CAMERA.adjustToCamera(this.lights.light0_direction);
        }
        if (this.lights.light1_lockToCamera) {
            this.lights.light1_adjusted = CAMERA.adjustToCamera(this.lights.light1_direction);
        }
        if (this.fogLimit > 0.0) {
            this.fogFactor = 1.0 / ((E3D_FAR - E3D_NEAR) - this.fogLimit);
        }        
    }

    render() {
        CONTEXT.clear(CONTEXT.COLOR_BUFFER_BIT | CONTEXT.DEPTH_BUFFER_BIT);

        CONTEXT.useProgram(this.program.shaderProgram);

        CONTEXT.uniformMatrix4fv(this.program.shaderUniforms["uProjectionMatrix"], false, CAMERA.getProjectionViewMatrix());     

        CONTEXT.uniform3fv(this.program.shaderUniforms["uLightA_Color"], this.lights.ambiant_color);

        CONTEXT.uniform3fv(this.program.shaderUniforms["uLight0_Color"], this.lights.light0_color);
        CONTEXT.uniform3fv(this.program.shaderUniforms["uLight0_Direction"], this.lights.light0_adjusted);

        CONTEXT.uniform3fv(this.program.shaderUniforms["uLight1_Color"], this.lights.light1_color);
        CONTEXT.uniform3fv(this.program.shaderUniforms["uLight1_Direction"], this.lights.light1_adjusted);

        CONTEXT.uniform4fv(this.program.shaderUniforms["uFogColor"], this.clearColor);
        CONTEXT.uniform1f(this.program.shaderUniforms["uFogLimit"], this.fogLimit);
        CONTEXT.uniform1f(this.program.shaderUniforms["uFogFactor"], this.fogFactor);

        CONTEXT.uniform1i(this.program.shaderUniforms["uStrokePass"], 0);

        this.drawnElemenets = 0;

        for (let i = 0; i < ENTITIES.length; ++i) {
            if ((ENTITIES[i].isVisible) && (ENTITIES[i].numElements > 0) && (this.cull_check_visible(i)) ) {

                // Entity Attributes
                if (ENTITIES[i].isDynamic) {
                    if (ENTITIES[i].dataSizeChanged) { 
                        // reset buffer
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], ENTITIES[i].vertexBuffer, ENTITIES[i].vertexArray);
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], ENTITIES[i].normalBuffer, ENTITIES[i].normalArray);    
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexColor"], ENTITIES[i].colorBuffer, ENTITIES[i].colorArray);  
                        if (ENTITIES[i].drawStrokes) this.bindAndResetShortIndexBuffer(ENTITIES[i].strokeIndexBuffer, ENTITIES[i].strokeIndexArray);
                        ENTITIES[i].dataSizeChanged = false;

                    } else if (ENTITIES[i].dataContentChanged) { 
                        // update buffer
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], ENTITIES[i].vertexBuffer, ENTITIES[i].vertexArray);
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], ENTITIES[i].normalBuffer, ENTITIES[i].normalArray);    
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexColor"], ENTITIES[i].colorBuffer, ENTITIES[i].colorArray);  
                        if (ENTITIES[i].drawStrokes) this.bindAndUpdateShortIndexBuffer(ENTITIES[i].strokeIndexBuffer, ENTITIES[i].strokeIndexArray);
                        ENTITIES[i].dataContentChanged = false;

                    } else {
                        // bind buffer
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], ENTITIES[i].vertexBuffer);  
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], ENTITIES[i].normalBuffer);    
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], ENTITIES[i].colorBuffer);
                        if (ENTITIES[i].drawStrokes) this.bindShortIndexBuffer(ENTITIES[i].strokeIndexBuffer);
                    }
                                       

                 } else { // static, bind only
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], ENTITIES[i].vertexBuffer);  
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], ENTITIES[i].normalBuffer);    
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], ENTITIES[i].colorBuffer);
                    if (ENTITIES[i].drawStrokes) this.bindShortIndexBuffer(ENTITIES[i].strokeIndexBuffer);
                }

                // Entity Uniforms
                CONTEXT.uniformMatrix4fv(this.program.shaderUniforms["uModelMatrix"], false, ENTITIES[i].modelMatrix);
                CONTEXT.uniformMatrix4fv(this.program.shaderUniforms["uNormalMatrix"], false, ENTITIES[i].normalMatrix);

                // Draw strokes
                if (ENTITIES[i].drawStrokes) {
                    CONTEXT.uniform1i(this.program.shaderUniforms["uStrokePass"], 1);
                    
                //    CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, ENTITIES[i].strokeIndexBuffer);
                    CONTEXT.drawElements(CONTEXT.LINES, ENTITIES[i].numStrokeElements, CONTEXT.UNSIGNED_SHORT, 0);  
                    
                    CONTEXT.uniform1i(this.program.shaderUniforms["uStrokePass"], 0);
                    this.drawnElemenets += ENTITIES[i].numStrokeElements;
                }
                
                // Draw triangles
                CONTEXT.drawArrays(ENTITIES[i].drawMode, 0, ENTITIES[i].numElements);
                this.drawnElemenets += ENTITIES[i].numElements;
            }
        }
    }

    postRender() {
        // cleanup or other events
    }


    bind3FloatBuffer(location, buffer) {
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, buffer);
        CONTEXT.vertexAttribPointer(location, 3, CONTEXT.FLOAT, false, 0, 0);
        CONTEXT.enableVertexAttribArray(location);
    }
    
    bindAndUpdate3FloatBuffer(location, buffer, data) {
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, buffer);
        CONTEXT.bufferSubData(CONTEXT.ARRAY_BUFFER, 0, data);
        CONTEXT.vertexAttribPointer(location, 3, CONTEXT.FLOAT, false, 0, 0);
        CONTEXT.enableVertexAttribArray(location);
    }

    bindAndReset3FloatBuffer(location, buffer, data) {
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, buffer);
        CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, data, CONTEXT.DYNAMIC_DRAW); 
        CONTEXT.vertexAttribPointer(location, 3, CONTEXT.FLOAT, false, 0, 0);
        CONTEXT.enableVertexAttribArray(location);
    }


    bindShortIndexBuffer(buffer) {
        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, buffer);
    }
    
    bindAndUpdateShortIndexBuffer(buffer, data) {
        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, buffer);
        CONTEXT.bufferSubData(CONTEXT.ELEMENT_ARRAY_BUFFER, 0, data);
    }

    bindAndResetShortIndexBuffer(buffer, data) {
        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, buffer);
        CONTEXT.bufferData(CONTEXT.ELEMENT_ARRAY_BUFFER, data, CONTEXT.DYNAMIC_DRAW); 
    }


    addEntity(ent) {

        // Initialize context data buffers        
        ent.vertexBuffer = CONTEXT.createBuffer();
        ent.colorBuffer = CONTEXT.createBuffer();
        ent.normalBuffer = CONTEXT.createBuffer();
        ent.strokeIndexBuffer = CONTEXT.createBuffer();

        var usage = (ent.isDynamic) ? CONTEXT.DYNAMIC_DRAW : CONTEXT.STATIC_DRAW;

        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.vertexBuffer);
        CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.vertexArray, usage);        
    
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.colorBuffer);
        CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.colorArray, usage);            
    
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.normalBuffer);
        CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.normalArray, usage);

        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, ent.strokeIndexBuffer);
        CONTEXT.bufferData(CONTEXT.ELEMENT_ARRAY_BUFFER, ent.strokeIndexArray, usage);
       
        ent.cull_dist = v3_length(E3D_scene.cull_calculate_max_pos(ent.vertexArray));

        ent.updateMatrix();

        ENTITIES.push(ent);

        return ENTITIES.length - 1; // return new index
    }

    updateEntity(ent) {
        let idx = this.getEntityIndexFromId(ent.id);
        if (idx > -1) {
            ent.dataContentChanged = true;
            ent.dataSizeChanged = true;        
            ent.cull_dist = v3_length(E3D_scene.cull_calculate_max_pos(ent.vertexArray));
            ent.updateMatrix();
        }  else {
            return this.addEntity(ent);
        }
    }

    cloneEntity(id, newId) {
        let idx = this.getEntityIndexFromId(id);
        if (idx > -1) {

            var ent = new E3D_entity(newId, ENTITIES[idx].filename, ENTITIES[idx].isDynamic);

            ent.cloneData(ENTITIES[idx]);   

            if (ent.isDynamic) {
                ent.vertexBuffer = CONTEXT.createBuffer();
                ent.colorBuffer = CONTEXT.createBuffer();
                ent.normalBuffer = CONTEXT.createBuffer();
                ent.strokeIndexBuffer = CONTEXT.createBuffer();
                CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.vertexBuffer);
                CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.vertexArray, CONTEXT.DYNAMIC_DRAW);
                CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.colorBuffer);
                CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.colorArray, CONTEXT.DYNAMIC_DRAW);
                CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.normalBuffer);
                CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.normalArray, CONTEXT.DYNAMIC_DRAW);
                CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, ent.strokeIndexBuffer);
                CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, ent.strokeIndexArray, CONTEXT.DYNAMIC_DRAW);
                ent.dataSizeChanged = true;
            }

            ENTITIES.push(ent);   
            return ent; // return reference to new entity
        }        
    }

    getEntityIndexFromId(id) {
        for (let i = 0; i < ENTITIES.length; ++i) {
            if (ENTITIES[i].id == id) return i;
        }
        return -1;
    }

    removeEntity(id, deleteBuffers = true) {
        let idx = this.getEntityIndexFromId(id);
        if (idx > -1) {
            if (deleteBuffers) {
                CONTEXT.deleteBuffer(ENTITIES[idx].vertexBuffer);
                CONTEXT.deleteBuffer(ENTITIES[idx].colorBuffer);
                CONTEXT.deleteBuffer(ENTITIES[idx].normalBuffer);
                CONTEXT.deleteBuffer(ENTITIES[idx].strokeIndexBuffer);
            }
            ENTITIES.splice(idx, 1);
        }    
    }

    static cull_calculate_max_pos(vertArray) {
        let result = [0, 0, 0];
        let r_dist2 = 0;
        for (let i = 0; i < vertArray.length; i += 3) {
            var currentDist = v3_lengthsquared([vertArray[i], vertArray[i+1], vertArray[i+2] ]);
            if (currentDist > r_dist2) {
                result = [vertArray[i], vertArray[i+1], vertArray[i+2] ];
                r_dist2 = currentDist;
            }
        }
        return result;
    }

    cull_check_visible(idx) {
        if (ENTITIES[idx].isVisibiltyCullable) {
            var pos = v3_sub_new(ENTITIES[idx].position, CAMERA.position);
            pos = CAMERA.negateCamera(pos);
            var dist = -pos[2]; // only check for Z
            return ( ((dist - ENTITIES[idx].cull_dist) < E3D_FAR) && 
            ((dist + ENTITIES[idx].cull_dist) > E3D_NEAR) );
        }
        return true;
    }

}

// Entension to allow dual shaders for toon/cell shading of mesh
class E3D_scene_cell_shader extends E3D_scene {
    constructor(id, context, width, height, vBackColor = vec4.fromValues(0.9, 0.9, 0.9, 1.0), fogLimit = -1) {
        super(id, context, width, height, vBackColor, fogLimit);

        this.strokeProgram = null ; // E3D_program for cell shading

        this.strokeColor = [0.0, 0.0, 0.0, 1.0];
        this.farColor = [0.75, 0.75, 0.75, 1.0]; // color of stroke line at zFar 
        this.strokeDepth = -0.01; // offset width for stroke generation
    }

    render() {

        CONTEXT.clear(CONTEXT.COLOR_BUFFER_BIT | CONTEXT.DEPTH_BUFFER_BIT);
        this.drawnElemenets = 0;

        // Line strokes 
        CONTEXT.useProgram(this.strokeProgram.shaderProgram);

        CONTEXT.cullFace(CONTEXT.FRONT);
        CONTEXT.depthFunc(CONTEXT.LEQUAL);

        CONTEXT.uniformMatrix4fv(this.strokeProgram.shaderUniforms["uProjectionMatrix"], false, CAMERA.getProjectionViewMatrix());     
        CONTEXT.uniform4fv(this.strokeProgram.shaderUniforms["uFarColor"], this.farColor );  
        CONTEXT.uniform4fv(this.strokeProgram.shaderUniforms["uStrokeColor"], this.strokeColor );  
        CONTEXT.uniform1f(this.strokeProgram.shaderUniforms["uStrokeDepth"], this.strokeDepth );  
        CONTEXT.uniform1f(this.strokeProgram.shaderUniforms["uFar"], CAMERA.far);  
        
        for (let i = 0; i < ENTITIES.length; ++i)
            if ((ENTITIES[i].isVisible) && (ENTITIES[i].numElements > 0)  && (this.cull_check_visible(i) ) ) {

            // Entity Attributes
            if (ENTITIES[i].isDynamic) {
                this.bindAndUpdate3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexPosition"], this.vertexBuffer, ENTITIES[i].vertexArray);
                this.bindAndUpdate3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexNormal"], this.normalBuffer, ENTITIES[i].normalArray);  

            } else {
                this.bind3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexPosition"], ENTITIES[i].vertexBuffer); 
                this.bind3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexNormal"], ENTITIES[i].normalBuffer);   
                
            }
            // Entity Uniforms
            CONTEXT.uniformMatrix4fv(this.strokeProgram.shaderUniforms["uModelMatrix"], false, ENTITIES[i].modelMatrix);
            
            // Draw Outline extensions
            CONTEXT.drawArrays(ENTITIES[i].drawMode, 0, ENTITIES[i].numElements);
            this.drawnElemenets += ENTITIES[i].numElements;

        }

        CONTEXT.cullFace(CONTEXT.BACK);
        CONTEXT.depthFunc(CONTEXT.LESS);

        CONTEXT.useProgram(this.program.shaderProgram);
        
        CONTEXT.uniformMatrix4fv(this.program.shaderUniforms["uProjectionMatrix"], false, CAMERA.getProjectionViewMatrix());     
        CONTEXT.uniform3fv(this.program.shaderUniforms["uLight"], this.lights.light0_adjusted);
        CONTEXT.uniform1i(this.program.shaderUniforms["strokePass"], 0);
        CONTEXT.uniform4fv(this.program.shaderUniforms["uStrokeColor"], this.strokeColor);  
        
        for (let i = 0; i < ENTITIES.length; ++i)
            if ((ENTITIES[i].isVisible) && (ENTITIES[i].numElements > 0) && (this.cull_check_visible(i) ) ) {

                // Entity Attributes
                if (ENTITIES[i].isDynamic) {
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.vertexBuffer, ENTITIES[i].vertexArray);
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.normalBuffer, ENTITIES[i].normalArray);    
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.colorBuffer, ENTITIES[i].colorArray);  
                } else {
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], ENTITIES[i].vertexBuffer);  
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], ENTITIES[i].normalBuffer);    
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], ENTITIES[i].colorBuffer);
                }
                // Entity Uniforms
                CONTEXT.uniformMatrix4fv(this.program.shaderUniforms["uModelMatrix"], false, ENTITIES[i].modelMatrix);
                CONTEXT.uniformMatrix4fv(this.program.shaderUniforms["uNormalMatrix"], false, ENTITIES[i].normalMatrix);
                
                // Draw
                CONTEXT.drawArrays(ENTITIES[i].drawMode, 0, ENTITIES[i].numElements);
                this.drawnElemenets += ENTITIES[i].numElements;
                            
                // Draw strokes
                if (ENTITIES[i].drawStrokes) {
                    CONTEXT.uniform1i(this.program.shaderUniforms["uStrokePass"], 1);
                    
                    CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, ENTITIES[i].strokeIndexBuffer);
                    CONTEXT.drawElements(CONTEXT.LINES, ENTITIES[i].numStrokeElements, CONTEXT.UNSIGNED_SHORT, 0);  
                    
                    CONTEXT.uniform1i(this.program.shaderUniforms["uStrokePass"], 0);
                    this.drawnElemenets += ENTITIES[i].numStrokeElements;
                }
        }


        if (this.renderFunction) {
            this.renderFunction(this);
        }
    }
}
