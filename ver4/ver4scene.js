// Easy3D_WebGL
// Scene class, gathering all state and entities, shaders, lights and camera
// Emmanuel Charette 2017-2019

"use strict"

class E3D_scene {
    constructor(id, context, width, height, vBackColor = [0.0, 0.0, 0.1, 1.0], fogLimit = -1) {
        this.id = id;
        this.context = context; // GL rendering context
        this.state = E3D_CREATED;

        this.camera = new E3D_camera(id+"defaultCtorCamera", width, height);

        this.entities = [];

        this.lights = new E3D_lighting();
        this.clearColor = vBackColor;
        this.fogLimit = fogLimit;
        this.fogFactor = 1.0;

        this.program = null; // shader program class

        this.preRenderFunction = null; 
        this.renderFunction = null; 
        this.postRenderFunction = null;

        this.drawnElemenets = 0; // some stats
    }

    initialize() {
        // config GL context        
        this.context.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
        this.context.clearDepth(1.0);
        this.context.enable(this.context.DEPTH_TEST);
        this.context.depthFunc(this.context.LEQUAL);
        this.context.cullFace(this.context.BACK);
        this.context.enable(this.context.CULL_FACE); 
        this.state = E3D_READY;
    }

    changeClearColor(color) {
        this.clearColor = color;
        this.context.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], this.clearColor[3]);
    }

    preRender() {
        // timing, events, controls, camera, animations

        if (this.lights.light0_lockToCamera) {
            this.lights.light0_adjusted = this.camera.adjustToCamera(this.lights.light0_direction);
        }
        if (this.lights.light1_lockToCamera) {
            this.lights.light1_adjusted = this.camera.adjustToCamera(this.lights.light1_direction);
        }


        if (this.fogLimit > 0.0) {
            this.fogFactor = 1.0 / ((this.camera.far - this.camera.near) - this.fogLimit);
        };

        if (this.preRenderFunction) {
            this.preRenderFunction(this);
        }
    }

    render() {
        // entities, sprites, hud

        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);

        this.context.useProgram(this.program.shaderProgram);

        this.context.uniformMatrix4fv(this.program.shaderUniforms["uProjectionMatrix"], false, this.camera.getProjectionViewMatrix());     

        this.context.uniform3fv(this.program.shaderUniforms["uLightA_Color"], this.lights.ambiant_color);

        this.context.uniform3fv(this.program.shaderUniforms["uLight0_Color"], this.lights.light0_color);
        this.context.uniform3fv(this.program.shaderUniforms["uLight0_Direction"], this.lights.light0_adjusted);

        this.context.uniform3fv(this.program.shaderUniforms["uLight1_Color"], this.lights.light1_color);
        this.context.uniform3fv(this.program.shaderUniforms["uLight1_Direction"], this.lights.light1_adjusted);

        this.context.uniform4fv(this.program.shaderUniforms["uFogColor"], this.clearColor);
        this.context.uniform1f(this.program.shaderUniforms["uFogLimit"], this.fogLimit);
        this.context.uniform1f(this.program.shaderUniforms["uFogFactor"], this.fogFactor);

        this.context.uniform1i(this.program.shaderUniforms["uStrokePass"], 0);

        this.drawnElemenets = 0;

        for (let i = 0; i < this.entities.length; ++i) {
            if ((this.entities[i].visible) && (this.entities[i].numElements > 0) && (this.cull_check_visible(i)) ) {

                // Entity Attributes
                if (this.entities[i].dynamic) {
                    if (this.entities[i].dataSizeChanged) { 
                        // reset buffer
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer, this.entities[i].vertexArray);
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer, this.entities[i].normalArray);    
                        this.bindAndReset3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer, this.entities[i].colorArray);  
                        this.bindAndResetShortIndexBuffer(this.entities[i].strokeIndexBuffer, this.entities[i].strokeIndexArray);
                        this.entities[i].dataSizeChanged = false;

                    } else if (this.entities[i].dataContentChanged) { 
                        // update buffer
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer, this.entities[i].vertexArray);
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer, this.entities[i].normalArray);    
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer, this.entities[i].colorArray);  
                        this.bindAndUpdateShortIndexBuffer(this.entities[i].strokeIndexBuffer, this.entities[i].strokeIndexArray);
                        this.entities[i].dataContentChanged = false;

                    } else {
                        // bind buffer
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer);  
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);    
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer);
                        this.bindShortIndexBuffer(this.entities[i].strokeIndexBuffer);
                    }
                                       

                 } else { // static, bind only
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer);  
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);    
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer);
                    this.bindShortIndexBuffer(this.entities[i].strokeIndexBuffer);
                }

                // Entity Uniforms
                this.context.uniformMatrix4fv(this.program.shaderUniforms["uModelMatrix"], false, this.entities[i].modelMatrix);
                this.context.uniformMatrix4fv(this.program.shaderUniforms["uNormalMatrix"], false, this.entities[i].normalMatrix);

                // Draw strokes
                if (this.entities[i].drawStrokes) {
                    this.context.uniform1i(this.program.shaderUniforms["uStrokePass"], 1);
                    
                //    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, this.entities[i].strokeIndexBuffer);
                    this.context.drawElements(this.context.LINES, this.entities[i].numStrokeElements, this.context.UNSIGNED_SHORT, 0);  
                    
                    this.context.uniform1i(this.program.shaderUniforms["uStrokePass"], 0);
                    this.drawnElemenets += this.entities[i].numStrokeElements;
                }
                
                // Draw triangles
                this.context.drawArrays(this.entities[i].drawMode, 0, this.entities[i].numElements);
                this.drawnElemenets += this.entities[i].numElements;
            }
        }

        if (this.renderFunction) {
            this.renderFunction(this);
        }
    }

    postRender() {
        // cleanup or other events
        if (this.postRenderFunction) {
            this.postRenderFunction(this);
        }
    }


    bind3FloatBuffer(location, buffer) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, buffer);
        this.context.vertexAttribPointer(location, 3, this.context.FLOAT, false, 0, 0);
        this.context.enableVertexAttribArray(location);
    }
    
    bindAndUpdate3FloatBuffer(location, buffer, data) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, buffer);
        this.context.bufferSubData(this.context.ARRAY_BUFFER, 0, data);
        this.context.vertexAttribPointer(location, 3, this.context.FLOAT, false, 0, 0);
        this.context.enableVertexAttribArray(location);
    }

    bindAndReset3FloatBuffer(location, buffer, data) {
        this.context.bindBuffer(this.context.ARRAY_BUFFER, buffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, data, this.context.DYNAMIC_DRAW); 
        this.context.vertexAttribPointer(location, 3, this.context.FLOAT, false, 0, 0);
        this.context.enableVertexAttribArray(location);
    }


    bindShortIndexBuffer(buffer) {
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, buffer);
    }
    
    bindAndUpdateShortIndexBuffer(buffer, data) {
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, buffer);
        this.context.bufferSubData(this.context.ELEMENT_ARRAY_BUFFER, 0, data);
    }

    bindAndResetShortIndexBuffer(buffer, data) {
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, buffer);
        this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, data, this.context.DYNAMIC_DRAW); 
    }


    addEntity(ent) {

        // Initialize context data buffers        
        ent.vertexBuffer = this.context.createBuffer();
        ent.colorBuffer = this.context.createBuffer();
        ent.normalBuffer = this.context.createBuffer();
        ent.strokeIndexBuffer = this.context.createBuffer();

        var usage = (ent.dynamic) ? this.context.DYNAMIC_DRAW : this.context.STATIC_DRAW;

        this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, usage);        
    
        this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, usage);            
    
        this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
        this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, usage);

        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, ent.strokeIndexBuffer);
        this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, ent.strokeIndexArray, usage);
       
        ent.cull_dist = v3_length(E3D_scene.cull_calculate_max_pos(ent.vertexArray));

        ent.resetMatrix();

        this.entities.push(ent);

        return this.entities.length - 1; // return new index
    }

    updateEntity(ent) {
        let idx = this.getEntityIndexFromId(ent.id);
        if (idx > -1) {
            ent.dataContentChanged = true;
            ent.dataSizeChanged = true;        
            ent.cull_dist = v3_length(E3D_scene.cull_calculate_max_pos(ent.vertexArray));
            ent.resetMatrix();
        }  else {
            return this.addEntity(ent);
        }
    }

    cloneEntity(id, newId) {
        let idx = this.getEntityIndexFromId(id);
        if (idx > -1) {

            var ent = new E3D_entity(newId, this.entities[idx].filename, this.entities[idx].dynamic);

            ent.cloneData(this.entities[idx]);   

            if (ent.dynamic) {
                ent.vertexBuffer = this.context.createBuffer();
                ent.colorBuffer = this.context.createBuffer();
                ent.normalBuffer = this.context.createBuffer();
                ent.strokeIndexBuffer = this.context.createBuffer();
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.DYNAMIC_DRAW);
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.DYNAMIC_DRAW);
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.DYNAMIC_DRAW);
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.strokeIndexBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.strokeIndexArray, this.context.DYNAMIC_DRAW);
                ent.dataSizeChanged = true;
            }

            this.entities.push(ent);   
            return ent; // return reference to new entity
        }        
    }

    getEntityIndexFromId(id) {
        for (let i = 0; i < this.entities.length; ++i) {
            if (this.entities[i].id == id) return i;
        }
        return -1;
    }

    removeEntity(id, deleteBuffers = true) {
        let idx = this.getEntityIndexFromId(id);
        if (idx > -1) {
            if (deleteBuffers) {
                this.context.deleteBuffer(this.entities[idx].vertexBuffer);
                this.context.deleteBuffer(this.entities[idx].colorBuffer);
                this.context.deleteBuffer(this.entities[idx].normalBuffer);
                this.context.deleteBuffer(this.entities[idx].strokeIndexBuffer);
            }
            this.entities.splice(idx, 1);
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
        if (this.entities[idx].vis_culling) {
            var pos = v3_sub_new(this.entities[idx].position, this.camera.position);
            pos = this.camera.negateCamera(pos);
            var dist = -pos[2]; // only check for Z
            return ( ((dist - this.entities[idx].cull_dist) < this.camera.far) && 
            ((dist + this.entities[idx].cull_dist) > this.camera.near) );
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

        this.context.clear(this.context.COLOR_BUFFER_BIT | this.context.DEPTH_BUFFER_BIT);
        this.drawnElemenets = 0;

        // Line strokes 
        this.context.useProgram(this.strokeProgram.shaderProgram);

        this.context.cullFace(this.context.FRONT);
        this.context.depthFunc(this.context.LEQUAL);

        this.context.uniformMatrix4fv(this.strokeProgram.shaderUniforms["uProjectionMatrix"], false, this.camera.getProjectionViewMatrix());     
        this.context.uniform4fv(this.strokeProgram.shaderUniforms["uFarColor"], this.farColor );  
        this.context.uniform4fv(this.strokeProgram.shaderUniforms["uStrokeColor"], this.strokeColor );  
        this.context.uniform1f(this.strokeProgram.shaderUniforms["uStrokeDepth"], this.strokeDepth );  
        this.context.uniform1f(this.strokeProgram.shaderUniforms["uFar"], this.camera.far);  
        
        for (let i = 0; i < this.entities.length; ++i)
            if ((this.entities[i].visible) && (this.entities[i].numElements > 0)  && (this.cull_check_visible(i) ) ) {

            // Entity Attributes
            if (this.entities[i].dynamic) {
                this.bindAndUpdate3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexPosition"], this.vertexBuffer, this.entities[i].vertexArray);
                this.bindAndUpdate3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexNormal"], this.normalBuffer, this.entities[i].normalArray);  

            } else {
                this.bind3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer); 
                this.bind3FloatBuffer(this.strokeProgram.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);   
                
            }
            // Entity Uniforms
            this.context.uniformMatrix4fv(this.strokeProgram.shaderUniforms["uModelMatrix"], false, this.entities[i].modelMatrix);
            
            // Draw Outline extensions
            this.context.drawArrays(this.entities[i].drawMode, 0, this.entities[i].numElements);
            this.drawnElemenets += this.entities[i].numElements;

        }

        this.context.cullFace(this.context.BACK);
        this.context.depthFunc(this.context.LESS);

        this.context.useProgram(this.program.shaderProgram);
        
        this.context.uniformMatrix4fv(this.program.shaderUniforms["uProjectionMatrix"], false, this.camera.getProjectionViewMatrix());     
        this.context.uniform3fv(this.program.shaderUniforms["uLight"], this.lights.light0_adjusted);
        this.context.uniform1i(this.program.shaderUniforms["strokePass"], 0);
        this.context.uniform4fv(this.program.shaderUniforms["uStrokeColor"], this.strokeColor);  
        
        for (let i = 0; i < this.entities.length; ++i)
            if ((this.entities[i].visible) && (this.entities[i].numElements > 0) && (this.cull_check_visible(i) ) ) {

                // Entity Attributes
                if (this.entities[i].dynamic) {
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.vertexBuffer, this.entities[i].vertexArray);
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.normalBuffer, this.entities[i].normalArray);    
                    this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.colorBuffer, this.entities[i].colorArray);  
                } else {
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer);  
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);    
                    this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer);
                }
                // Entity Uniforms
                this.context.uniformMatrix4fv(this.program.shaderUniforms["uModelMatrix"], false, this.entities[i].modelMatrix);
                this.context.uniformMatrix4fv(this.program.shaderUniforms["uNormalMatrix"], false, this.entities[i].normalMatrix);
                
                // Draw
                this.context.drawArrays(this.entities[i].drawMode, 0, this.entities[i].numElements);
                this.drawnElemenets += this.entities[i].numElements;
                            
                // Draw strokes
                if (this.entities[i].drawStrokes) {
                    this.context.uniform1i(this.program.shaderUniforms["uStrokePass"], 1);
                    
                    this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, this.entities[i].strokeIndexBuffer);
                    this.context.drawElements(this.context.LINES, this.entities[i].numStrokeElements, this.context.UNSIGNED_SHORT, 0);  
                    
                    this.context.uniform1i(this.program.shaderUniforms["uStrokePass"], 0);
                    this.drawnElemenets += this.entities[i].numStrokeElements;
                }
        }


        if (this.renderFunction) {
            this.renderFunction(this);
        }
    }
}
