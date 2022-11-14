// Easy3D_WebGL
// Scene class, interface between entities data, context and shader programs
// Emmanuel Charette 2017-2020

"use strict"


// Scene State (exclusives)
const E3D_CREATED = 0;
const E3D_READY = 1;
const E3D_ACTIVE = 2;



class E3D_scene { // Basic, single pass 
    constructor(id, clearColor = [0.0, 0.0, 0.1]) {
        this.id = id;
        this.state = E3D_CREATED;
        this.clearColor = v3_clone(clearColor);
        this.strokeColor = v3_clone(_v3_white);
        this.drawnElements = 0;
        this.program = null;    
    }

    initialize() {
        // config GL context
        this.setClearColor(this.clearColor);
        CONTEXT.clearDepth(1.0);
        CONTEXT.enable(CONTEXT.DEPTH_TEST);
        CONTEXT.depthFunc(CONTEXT.LEQUAL);
        CONTEXT.cullFace(CONTEXT.BACK);
        CONTEXT.enable(CONTEXT.CULL_FACE); 

        if (this.program != null) this.state = E3D_READY;
    }

    setClearColor(color) {
        v3_copy(this.clearColor, color);
        CONTEXT.clearColor(color[0], color[1], color[2], 1.0);
    }

    preRender() {
        // Nothing to do for this shader
    }

    setSceneUniforms() {
        CONTEXT.uniformMatrix4fv(this.program.shaderUniforms.uProjectionMatrix, false, CAMERA.getProjectionViewMatrix());
        if (this.program.shaderUniforms.uStrokePass != -1) CONTEXT.uniform1i(this.program.shaderUniforms.uStrokePass, 0);
    }
    setEntityUniforms(i) {
        CONTEXT.uniformMatrix4fv(this.program.shaderUniforms.uModelMatrix, false, ENTITIES[i].modelMatrix);
        CONTEXT.uniformMatrix4fv(this.program.shaderUniforms.uNormalMatrix, false, ENTITIES[i].normalMatrix); 
    }

    setEntityBuffers(i) {
        if (ENTITIES[i].isDynamic) {
            if (ENTITIES[i].dataSizeChanged) { 
                // reset buffer
                this.bindAndReset3FloatBuffer(this.program.shaderAttributes.aVertexPosition, ENTITIES[i].vertexBuffer, ENTITIES[i].vertexArray);
                this.bindAndReset3FloatBuffer(this.program.shaderAttributes.aVertexNormal, ENTITIES[i].normalBuffer, ENTITIES[i].normalArray);    
                this.bindAndReset3FloatBuffer(this.program.shaderAttributes.aVertexColor, ENTITIES[i].colorBuffer, ENTITIES[i].colorArray);  
                if (ENTITIES[i].drawStrokes) this.bindAndResetUIntIndexBuffer(ENTITIES[i].strokeIndexBuffer, ENTITIES[i].strokeIndexArray);
                ENTITIES[i].dataSizeChanged = false;

            } else if (ENTITIES[i].dataContentChanged) { 
                // update buffer
                this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes.aVertexPosition, ENTITIES[i].vertexBuffer, ENTITIES[i].vertexArray);
                this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes.aVertexNormal, ENTITIES[i].normalBuffer, ENTITIES[i].normalArray);    
                this.bindAndUpdate3FloatBuffer(this.program.shaderAttributes.aVertexColor, ENTITIES[i].colorBuffer, ENTITIES[i].colorArray);  
                if (ENTITIES[i].drawStrokes) this.bindAndUpdateUIntIndexBuffer(ENTITIES[i].strokeIndexBuffer, ENTITIES[i].strokeIndexArray);
                ENTITIES[i].dataContentChanged = false;

            } else {
                // bind buffer
                this.bind3FloatBuffer(this.program.shaderAttributes.aVertexPosition, ENTITIES[i].vertexBuffer);  
                this.bind3FloatBuffer(this.program.shaderAttributes.aVertexNormal, ENTITIES[i].normalBuffer);    
                this.bind3FloatBuffer(this.program.shaderAttributes.aVertexColor, ENTITIES[i].colorBuffer);
                if (ENTITIES[i].drawStrokes) this.bindUIntIndexBuffer(ENTITIES[i].strokeIndexBuffer);
            }

        } else { // static, bind only
            this.bind3FloatBuffer(this.program.shaderAttributes.aVertexPosition, ENTITIES[i].vertexBuffer);  
            this.bind3FloatBuffer(this.program.shaderAttributes.aVertexNormal, ENTITIES[i].normalBuffer);    
            this.bind3FloatBuffer(this.program.shaderAttributes.aVertexColor, ENTITIES[i].colorBuffer);
            if (ENTITIES[i].drawStrokes) this.bindUIntIndexBuffer(ENTITIES[i].strokeIndexBuffer);
        }
    }

    render() {
        CONTEXT.clear(CONTEXT.COLOR_BUFFER_BIT | CONTEXT.DEPTH_BUFFER_BIT);
        CONTEXT.useProgram(this.program.shaderProgram);
  
        this.setSceneUniforms();

        this.drawnElements = 0;

        for (let i = 0; i < ENTITIES.length; ++i) {
            if ((ENTITIES[i].isVisible) && (ENTITIES[i].numElements > 0) && (E3D_checkEntityVisibleByIndex(i)) ) {

                this.setEntityBuffers(i);
                this.setEntityUniforms(i);

                // Draw line strokes
                if ((ENTITIES[i].drawStrokes) && (this.program.shaderUniforms.uStrokePass != -1)) {
                    CONTEXT.uniform1i(this.program.shaderUniforms.uStrokePass, 1);
                    CONTEXT.uniform3fv(this.program.shaderUniforms.uStrokeColor, this.strokeColor);
                    CONTEXT.drawElements(CONTEXT.LINES, ENTITIES[i].numStrokeElements, CONTEXT.UNSIGNED_INT, 0);  
                    CONTEXT.uniform1i(this.program.shaderUniforms.uStrokePass, 0);
                    this.drawnElements += ENTITIES[i].numStrokeElements;
                }
                
                // Draw triangles
                CONTEXT.drawArrays(ENTITIES[i].drawMode, 0, ENTITIES[i].numElements);
                this.drawnElements += ENTITIES[i].numElements;
            }
        }
    }

    postRender() {
        // cleanup or other events
    }


    bind3FloatBuffer(location, buffer) {
        if (location == -1) return;
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, buffer);
        CONTEXT.vertexAttribPointer(location, 3, CONTEXT.FLOAT, false, 0, 0);
        CONTEXT.enableVertexAttribArray(location);
    }
    
    bindAndUpdate3FloatBuffer(location, buffer, data) {
        if (location == -1) return;
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, buffer);
        CONTEXT.bufferSubData(CONTEXT.ARRAY_BUFFER, 0, data);
        CONTEXT.vertexAttribPointer(location, 3, CONTEXT.FLOAT, false, 0, 0);
        CONTEXT.enableVertexAttribArray(location);
    }

    bindAndReset3FloatBuffer(location, buffer, data) {
        if (location == -1) return;
        CONTEXT.bindBuffer(CONTEXT.ARRAY_BUFFER, buffer);
        CONTEXT.bufferData(CONTEXT.ARRAY_BUFFER, data, CONTEXT.DYNAMIC_DRAW); 
        CONTEXT.vertexAttribPointer(location, 3, CONTEXT.FLOAT, false, 0, 0);
        CONTEXT.enableVertexAttribArray(location);
    }


    bindUIntIndexBuffer(buffer) {
        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, buffer);
    }
    
    bindAndUpdateUIntIndexBuffer(buffer, data) {
        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, buffer);
        CONTEXT.bufferSubData(CONTEXT.ELEMENT_ARRAY_BUFFER, 0, data);
    }

    bindAndResetUIntIndexBuffer(buffer, data) {
        CONTEXT.bindBuffer(CONTEXT.ELEMENT_ARRAY_BUFFER, buffer);
        CONTEXT.bufferData(CONTEXT.ELEMENT_ARRAY_BUFFER, data, CONTEXT.DYNAMIC_DRAW); 
    }

}





class E3D_scene_default extends E3D_scene {
    constructor(id, v3BackColor = [0.0, 0.0, 0.1]) {
        super(id, v3BackColor);

        // Ambiant light
        this.lightA_color = v3_val_new(0.0, 0.0, 0.15);

        // Directional lights
        this.light0_color = v3_val_new(1.0, 1.0, 1.0);
        this.light0_direction = v3_normalize_new([-0.2, -0.2, -1.0]);
        this.light0_adjusted = v3_clone(this.light0_direction);
        this.light0_lockToCamera = true;

        this.light1_color = v3_val_new(1.0, 1.0, 0.85);
        this.light1_direction = v3_normalize_new([-1.0, -0.6, -0.6]);
        this.light1_adjusted = v3_clone(this.light1_direction);
        this.light1_lockToCamera = false;
      
        // Fog
        this.fogLimit = E3D_FAR / 2;
        this.fogFactor = 1.0;
    }

    setLight0Direction(d) {
        v3_normalize_res(this.light0_direction, d);
        v3_copy(this.light0_adjusted, this.light0_direction);
    }
    
    setLight1Direction(d) {
        v3_normalize_res(this.light1_direction, d);
        v3_copy(this.light1_adjusted, this.light1_direction);
    }

    preRender() {
        if (this.light0_lockToCamera) CAMERA.adjustToCamera_res(this.light0_adjusted, this.light0_direction);
        if (this.light1_lockToCamera) CAMERA.adjustToCamera_res(this.light1_adjusted, this.light1_direction);

        if (this.fogLimit > 0.0) this.fogFactor = 1.0 / ((E3D_FAR - E3D_NEAR) - this.fogLimit);    
    }

    setSceneUniforms() {
        CONTEXT.uniformMatrix4fv(this.program.shaderUniforms.uProjectionMatrix, false, CAMERA.getProjectionViewMatrix());
        if (this.program.shaderUniforms.uStrokePass != -1) CONTEXT.uniform1i(this.program.shaderUniforms.uStrokePass, 0);

        CONTEXT.uniform3fv(this.program.shaderUniforms.uLightA_Color, this.lightA_color);

        CONTEXT.uniform3fv(this.program.shaderUniforms.uLight0_Color, this.light0_color);
        CONTEXT.uniform3fv(this.program.shaderUniforms.uLight0_Direction, this.light0_adjusted);

        CONTEXT.uniform3fv(this.program.shaderUniforms.uLight1_Color, this.light1_color);
        CONTEXT.uniform3fv(this.program.shaderUniforms.uLight1_Direction, this.light1_adjusted);

        CONTEXT.uniform3fv(this.program.shaderUniforms.uFogColor, this.clearColor);
        CONTEXT.uniform1f(this.program.shaderUniforms.uFogLimit, this.fogLimit);
        CONTEXT.uniform1f(this.program.shaderUniforms.uFogFactor, this.fogFactor);
    }

}




// basic scene to support 2 pass rendering
class E3D_scene_2pass extends E3D_scene {
    constructor(id, v3BackColor = [0.9, 0.9, 0.9]) {
        super(id, v3BackColor);
        this.program2 = null;
        this.visibilityList = [];
    }

    initialize() {
        super.initialize();
        this.state = ( (this.program != null) && (this.program2 != null) ) ? E3D_READY : E3D_CREATED; 
    }

    setPass1SceneUniforms() {
        super.setSceneUniforms();
    }

    setPass2SceneUniforms() {
        super.setSceneUniforms(); 
    }

    setPass1EntityUniforms(i) {
        super.setEntityUniforms(i);
    }

    setPass2EntityUniforms(i) {
        super.setEntityUniforms(i);
    }

    render() {        
        this.drawnElements = 0;

        this.visibilityList = [];
        for (let i = 0; i < ENTITIES.length; ++i) this.visibilityList[i] = (ENTITIES[i].isVisible) && (ENTITIES[i].numElements > 0) && (E3D_checkEntityVisibleByIndex(i)) ;

        CONTEXT.clear(CONTEXT.COLOR_BUFFER_BIT | CONTEXT.DEPTH_BUFFER_BIT);

        // 1st pass
        CONTEXT.useProgram(this.program.shaderProgram);
  
        this.setPass1SceneUniforms();

        for (let i = 0; i < ENTITIES.length; ++i) if (this.visibilityList[i]) {

            this.setEntityBuffers(i);
            this.setPass1EntityUniforms(i);

            // Draw strokes
            if ((ENTITIES[i].drawStrokes) && (this.program.shaderUniforms.uStrokePass != -1)) {
                CONTEXT.uniform1i(this.program.shaderUniforms.uStrokePass, 1);
                CONTEXT.uniform3fv(this.program.shaderUniforms.uStrokeColor, this.strokeColor);
                CONTEXT.drawElements(CONTEXT.LINES, ENTITIES[i].numStrokeElements, CONTEXT.UNSIGNED_INT, 0);  
                CONTEXT.uniform1i(this.program.shaderUniforms.uStrokePass, 0);
                this.drawnElements += ENTITIES[i].numStrokeElements;
            }
            
            // Draw triangles
            CONTEXT.drawArrays(ENTITIES[i].drawMode, 0, ENTITIES[i].numElements);
            this.drawnElements += ENTITIES[i].numElements;
        }



        // 2nd pass
        CONTEXT.useProgram(this.program2.shaderProgram);
  
        this.setPass2SceneUniforms();

        for (let i = 0; i < ENTITIES.length; ++i) if (this.visibilityList[i]) {

            this.setEntityBuffers(i);
            this.setPass2EntityUniforms(i);

            // Draw strokes
            if ((ENTITIES[i].drawStrokes) && (this.program.shaderUniforms.uStrokePass != -1)) {
                CONTEXT.uniform1i(this.program.shaderUniforms.uStrokePass, 1);
                CONTEXT.uniform3fv(this.program.shaderUniforms.uStrokeColor, this.strokeColor);
                CONTEXT.drawElements(CONTEXT.LINES, ENTITIES[i].numStrokeElements, CONTEXT.UNSIGNED_INT, 0);  
                CONTEXT.uniform1i(this.program.shaderUniforms.uStrokePass, 0);
                this.drawnElements += ENTITIES[i].numStrokeElements;
            }
            
            // Draw triangles
            CONTEXT.drawArrays(ENTITIES[i].drawMode, 0, ENTITIES[i].numElements);
            this.drawnElements += ENTITIES[i].numElements;
        }
    }

}





// Entension to allow dual shaders for toon/cell shading of mesh
// program (1st pass) is offset/outline render
// program2 (2nd pass) is cell shader and stroke pass
class E3D_scene_cell_shader extends E3D_scene_2pass { 
    constructor(id, v3BackColor = [0.9, 0.9, 0.9]) {
        super(id, v3BackColor);
        this.farColor = [0.75, 0.75, 0.75, 1.0]; // color of stroke line at zFar 
        this.strokeDepth = -0.01; // offset width for stroke generation        
    }

    setPass1SceneUniforms() {
        CONTEXT.uniformMatrix4fv(this.program.shaderUniforms["uProjectionMatrix"], false, CAMERA.getProjectionViewMatrix());     
        CONTEXT.uniform4fv(this.program.shaderUniforms["uFarColor"], this.farColor );  
        CONTEXT.uniform4fv(this.program.shaderUniforms["uStrokeColor"], this.strokeColor );  
        CONTEXT.uniform1f(this.program.shaderUniforms["uStrokeDepth"], this.strokeDepth );  
        CONTEXT.uniform1f(this.program.shaderUniforms["uFar"], CAMERA.far);
    }

    setPass2SceneUniforms() {
        CONTEXT.uniformMatrix4fv(this.program2.shaderUniforms["uProjectionMatrix"], false, CAMERA.getProjectionViewMatrix());     
        CONTEXT.uniform3fv(this.program2.shaderUniforms["uLight"], this.light0_adjusted);
        CONTEXT.uniform1i(this.program2.shaderUniforms["strokePass"], 0);
        CONTEXT.uniform4fv(this.program2.shaderUniforms["uStrokeColor"], this.strokeColor);  
    }

    render() {
        this.drawnElements = 0;

        this.visibilityList = [];
        for (let i = 0; i < ENTITIES.length; ++i) this.visibilityList[i] = (ENTITIES[i].isVisible) && (ENTITIES[i].numElements > 0) && (E3D_checkEntityVisibleByIndex(i)) ;

        CONTEXT.clear(CONTEXT.COLOR_BUFFER_BIT | CONTEXT.DEPTH_BUFFER_BIT);

        // Line strokes 
        CONTEXT.useProgram(this.program.shaderProgram);

        CONTEXT.cullFace(CONTEXT.FRONT);
        CONTEXT.depthFunc(CONTEXT.LEQUAL);


        // setScene
        this.setPass1SceneUniforms();
        
        for (let i = 0; i < ENTITIES.length; ++i) if (this.visibilityList[i]) {

            this.setEntityBuffers(i);
            this.setPass1EntityUniforms(i);
            
            // Draw Outline extensions
            CONTEXT.drawArrays(ENTITIES[i].drawMode, 0, ENTITIES[i].numElements);
            this.drawnElements += ENTITIES[i].numElements;
        }

        CONTEXT.cullFace(CONTEXT.BACK);
        CONTEXT.depthFunc(CONTEXT.LESS);

        CONTEXT.useProgram(this.program2.shaderProgram);
        
        this.setPass2SceneUniforms();
        
        for (let i = 0; i < ENTITIES.length; ++i) if (this.visibilityList[i]) {

            this.setEntityBuffers(i);
            this.setPass2EntityUniforms(i);
                
            // Draw
            CONTEXT.drawArrays(ENTITIES[i].drawMode, 0, ENTITIES[i].numElements);
            this.drawnElements += ENTITIES[i].numElements;
                        
            // Draw line strokes
            if ((ENTITIES[i].drawStrokes) && (this.program2.shaderUniforms.uStrokePass != -1)) {
                CONTEXT.uniform1i(this.program2.shaderUniforms.uStrokePass, 1);
                CONTEXT.uniform3fv(this.program2.shaderUniforms.uStrokeColor, this.strokeColor);
                CONTEXT.drawElements(CONTEXT.LINES, ENTITIES[i].numStrokeElements, CONTEXT.UNSIGNED_INT, 0);  
                CONTEXT.uniform1i(this.program2.shaderUniforms.uStrokePass, 0);
                this.drawnElements += ENTITIES[i].numStrokeElements;
            }
        }
    } // render

} // scene 2 pass
