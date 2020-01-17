// Easy3D_WebGL
// Scene class, gathering all state and entities, shaders, lights and camera
// Emmanuel Charette 2017-2019

"use strict"

class E3D_scene {
    constructor(id, context, width, height, vBackColor = vec4.fromValues(0.0, 0.0, 0.1, 1.0), fogLimit = -1) {
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
                        this.entities[i].dataSizeChanged = false;

                    } else if (this.entities[i].dataContentChanged) { 
                        // update buffer
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer, this.entities[i].vertexArray);
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer, this.entities[i].normalArray);    
                        this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer, this.entities[i].colorArray);  
                        this.entities[i].dataContentChanged = false;

                    } else {
                        // bind buffer
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexPosition"], this.entities[i].vertexBuffer);  
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexNormal"], this.entities[i].normalBuffer);    
                        this.bind3FloatBuffer(this.program.shaderAttributes["aVertexColor"], this.entities[i].colorBuffer);
                    }
                                       

                 } else { // static, bind only
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


    addEntity(ent) {

        // Initialize context data buffers        
        ent.vertexBuffer = this.context.createBuffer();
        ent.colorBuffer = this.context.createBuffer();
        ent.normalBuffer = this.context.createBuffer();

        if (!ent.dynamic) { // if static initialize context data buffers and assign data right away

            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.STATIC_DRAW);        
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.STATIC_DRAW);            
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.STATIC_DRAW);

        } else  { // if dynamic prepare buffers
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.DYNAMIC_DRAW);                
        
            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.DYNAMIC_DRAW);            

            this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
            this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.DYNAMIC_DRAW);

        }
        
        ent.cull_dist = vec3.length(E3D_scene.cull_calculate_max_pos(ent.vertexArray));

        ent.resetMatrix();

        this.entities.push(ent);

        return this.entities.length - 1; // return new index
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
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.vertexBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.vertexArray, this.context.DYNAMIC_DRAW);
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.colorBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.colorArray, this.context.DYNAMIC_DRAW);
                this.context.bindBuffer(this.context.ARRAY_BUFFER, ent.normalBuffer);
                this.context.bufferData(this.context.ARRAY_BUFFER, ent.normalArray, this.context.DYNAMIC_DRAW);
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
            }
            this.entities.splice(idx, 1);
        }    
    }

    static cull_calculate_max_pos(vertArray) {
        let result = [0, 0, 0];
        let r_dist2 = 0;
        for (let i = 0; i < vertArray.length; i += 3) {
            var currentDist = vec3.squaredLength([vertArray[i], vertArray[i+1], vertArray[i+2] ]);
            if (currentDist > r_dist2) {
                result = [vertArray[i], vertArray[i+1], vertArray[i+2] ];
                r_dist2 = currentDist;
            }
        }
        return result;
    }

    cull_check_visible(idx) {
        if (this.entities[idx].vis_culling) {
            var pos = [0, 0, 0];
            vec3.subtract(pos, this.entities[idx].position, this.camera.position);
            this.camera.negateCamera(pos);
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
        this.strokeProgram = null ; // E3D_program for line strokes
    //    this.entitiesStrokeIndices = [];

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
            
            // Draw
           // this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER,this.entitiesStrokeIndices[i]);
           // this.context.drawElements(this.context.LINES, this.entities[i].numElements * 2, this.context.UNSIGNED_SHORT, 0);
           this.context.drawArrays(this.entities[i].drawMode, 0, this.entities[i].numElements);
           this.drawnElemenets += this.entities[i].numElements;
        }

        this.context.cullFace(this.context.BACK);
        this.context.depthFunc(this.context.LESS);

        this.context.useProgram(this.program.shaderProgram);
        
        this.context.uniformMatrix4fv(this.program.shaderUniforms["uProjectionMatrix"], false, this.camera.getProjectionViewMatrix());     
        this.context.uniform3fv(this.program.shaderUniforms["uLight"], this.lights.light0_adjusted);
        
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
        }


        if (this.renderFunction) {
            this.renderFunction(this);
        }
    }
/*
    addStrokeData(entity)  { // TODO add stroke data to entity
        // static only for now
        let indices = new Uint16Array(entity.numElements * 2);
        for (var i = 0; i < entity.numElements / 3; ++i) {
            indices[(6*i) + 0] = (0 + (i*3));
            indices[(6*i) + 1] = (1 + (i*3));

            indices[(6*i) + 2] = (1 + (i*3));
            indices[(6*i) + 3] = (2 + (i*3));

            indices[(6*i) + 4] = (2 + (i*3));
            indices[(6*i) + 5] = (0 + (i*3));
        }
               
        let bfr = this.context.createBuffer();
        this.context.bindBuffer(this.context.ELEMENT_ARRAY_BUFFER, bfr);
        this.context.bufferData(this.context.ELEMENT_ARRAY_BUFFER, indices, this.context.STATIC_DRAW); 
        
        this.entitiesStrokeIndices.push(bfr);
    }*/

}