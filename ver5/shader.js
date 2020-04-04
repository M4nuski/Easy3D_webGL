// Easy3D_WebGL
// Container for GLSL shader program loading and compiling
// Base class for ambiant and 2 directional lights for current shader model
// Container file for various WebGL GLSL shaders and their attribute lists
// Emmanuel Charette 2017-2020

"use strict"

class E3D_program {
    constructor(id, programData = null)  {
        this.id = id;
        this.programData = programData;

        this.shaderProgram = null;
        this.shaderAttributes = {};
        this.shaderUniforms = {};

        if (programData != null) this.compile(programData);
    }

    compile(data) {
        // Compile
        const vs = this.loadShader(CONTEXT.VERTEX_SHADER, data.VertexShaderText);
        const fs = this.loadShader(CONTEXT.FRAGMENT_SHADER, data.FragmentShaderText);

        if ((vs != null) && (fs != null)) {
            // Link
            this.shaderProgram = CONTEXT.createProgram();
            CONTEXT.attachShader(this.shaderProgram, vs);
            CONTEXT.attachShader(this.shaderProgram, fs);
            CONTEXT.linkProgram(this.shaderProgram);

            if (!CONTEXT.getProgramParameter(this.shaderProgram, CONTEXT.LINK_STATUS)) {
                console.log('Unable to initialize the shader program ' + this.id + ": " + CONTEXT.getProgramInfoLog(this.shaderProgram));
                this.shaderProgram = null;
            } else {
                // Bind                
                for (let i = 0; i < data.AttributeList.length; ++i) 
                    this.shaderAttributes[data.AttributeList[i]] = CONTEXT.getAttribLocation(this.shaderProgram, data.AttributeList[i]); 
                for (let i = 0; i < data.UniformList.length; ++i)
                    this.shaderUniforms[data.UniformList[i]] = CONTEXT.getUniformLocation(this.shaderProgram, data.UniformList[i]);
            }
        } else {
            this.shaderProgram = null;
        }
    }

    loadShader(type, source) {
        const shader = CONTEXT.createShader(type);       
        CONTEXT.shaderSource(shader, source);
        CONTEXT.compileShader(shader);
        if (!CONTEXT.getShaderParameter(shader, CONTEXT.COMPILE_STATUS)) {
            console.log('An error occurred compiling the '+ type +' shaders in program ' + this.id + ": " + CONTEXT.getShaderInfoLog(shader));
            CONTEXT.deleteShader(shader);
            return null;
        }
        return shader;
    }


}

/* Structure of shader program data
var programData_name = {
    VertexShaderText: "",
    FragmentShaderText: "",
    AttributeList: [],
    UniformList: []
}
*/

var programData_passtrough = {
    VertexShaderText:  `

        //from model
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec3 aVertexColor;

        uniform mat4 uModelMatrix;
        uniform mat4 uNormalMatrix;

        //from scene
        uniform mat4 uProjectionMatrix;

        //output to fragment shader
        varying lowp vec4 vColor;            

        void main(void) {
            vColor = vec4(aVertexColor, 1.0);
            gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
        }

`, FragmentShaderText: `

        varying lowp vec4 vColor;

        void main(void) {
            gl_FragColor = vColor;
        }

`,  AttributeList: ["aVertexPosition", "aVertexColor", "aVertexNormal"],

    UniformList: ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", "uStrokePass"]    
}


var programData_passtrough_shownormals = {
    VertexShaderText:  `

        //from model
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexColor;
        attribute vec3 aVertexNormal;

        uniform int uStrokePass; // 0: triangle pass, 1: stroke pass

        uniform mat4 uModelMatrix;
        uniform mat4 uNormalMatrix;

        //from scene
        uniform mat4 uProjectionMatrix;

        //output to fragment shader
        varying lowp vec4 vColor;

        void main(void) {
            vColor = uNormalMatrix * vec4(aVertexNormal, 1.0);
            vColor = (vColor * 0.5) + 0.5; 
            gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
        }

`, FragmentShaderText: `

        varying lowp vec4 vColor;

        void main(void) {
            gl_FragColor = vColor;
        }

`,  AttributeList: ["aVertexPosition", "aVertexColor", "aVertexNormal"],

    UniformList: ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", "uStrokePass"]    
}

var programData_passtrough_showdepth = {
    VertexShaderText:  `

        //from model
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexColor;
        attribute vec3 aVertexNormal;

        uniform int uStrokePass; // 0: triangle pass, 1: stroke pass

        uniform mat4 uModelMatrix;
        uniform mat4 uNormalMatrix;

        //from scene
        uniform mat4 uProjectionMatrix;

        //output to fragment shader
        varying lowp vec4 vPosition;

        void main(void) {
            vPosition = uProjectionMatrix * uModelMatrix * aVertexPosition;
            gl_Position = vPosition;
        }

`, FragmentShaderText: `

        varying lowp vec4 vPosition;

        void main(void) {
            lowp float z = 1.0 - (vPosition.z / 600.0);
            z = pow(z, 2.5);
            gl_FragColor = vec4(z, z, z, 1.0);
        }

`,  AttributeList: ["aVertexPosition", "aVertexColor", "aVertexNormal"],

    UniformList: ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", "uStrokePass"]    
}

var programData_passtrough_shade = {
    VertexShaderText:  `

        //from model
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec3 aVertexColor;

        uniform mat4 uModelMatrix;
        uniform mat4 uNormalMatrix;

        //from scene
        uniform mat4 uProjectionMatrix;

        //output to fragment shader
        varying lowp vec4 vColor;            

        void main(void) {      
            lowp vec4 p = vec4(-1.0, -1.0, -1.0, 0.0);
            p = normalize(p);
            lowp float f = -dot(uNormalMatrix * vec4(aVertexNormal, 0.0), p);
            f = 0.5 * f + 0.5;            
            vColor = vec4(aVertexColor * f, 1.0);
            gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
        }

`, FragmentShaderText: `

        varying lowp vec4 vColor;

        void main(void) {
            gl_FragColor = vColor;
        }

`,  AttributeList: ["aVertexPosition", "aVertexColor", "aVertexNormal"],

    UniformList: ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", "uStrokePass"]    
}


var programData_passtrough_shadeAndDepth = {
    VertexShaderText:  `

        //from model
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec3 aVertexColor;

        uniform mat4 uModelMatrix;
        uniform mat4 uNormalMatrix;

        //from scene
        uniform mat4 uProjectionMatrix;

        //output to fragment shader
        varying lowp vec4 vColor;  
        varying lowp vec4 vPosition;          

        void main(void) {      
            lowp vec4 p = vec4(-1.0, -1.0, -1.0, 0.0);
            p = normalize(p);
            lowp float f = -dot(uNormalMatrix * vec4(aVertexNormal, 0.0), p);
            f = 0.5 * f + 0.5;            
            vColor = vec4(aVertexColor * f, 1.0);
            vPosition = uProjectionMatrix * uModelMatrix * aVertexPosition;
            gl_Position = vPosition;
        }

`, FragmentShaderText: `

        varying lowp vec4 vColor;
        varying lowp vec4 vPosition;
        void main(void) {
            lowp float z = 1.0 - (vPosition.z / 600.0);
            z = pow(z, 2.5);
            gl_FragColor = vec4(vColor.r * z, vColor.g * z, vColor.b * z, 1.0);
        }

`,  AttributeList: ["aVertexPosition", "aVertexColor", "aVertexNormal"],

    UniformList: ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", "uStrokePass"]    
}







// scene with 1 ambiant light and 2 directional lights, fog

var programData_default = {
    VertexShaderText:  `

        //from model
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexColor;
        attribute vec3 aVertexNormal;

        uniform mat4 uModelMatrix;
        uniform mat4 uNormalMatrix;

        uniform int uStrokePass; // 0: triangle pass, 1: stroke pass
        uniform vec3 uStrokeColor;

        //from scene
        uniform mat4 uProjectionMatrix;

        //Lights
        uniform vec3 uLightA_Color;
        uniform vec3 uLight0_Color;
        uniform vec3 uLight1_Color;
        uniform vec3 uLight0_Direction;
        uniform vec3 uLight1_Direction;

        //output to fragment shader
        varying lowp vec3 vColor;
    

        void main(void) {

            vec4 buf_normal;
            float fact_diffuse0;
            float fact_diffuse1;
            //vec3 ColorA;
            vec3 Color0;
            vec3 Color1;

            if (uStrokePass == 1) {

                vColor = uStrokeColor;
                buf_normal = uProjectionMatrix * uModelMatrix * aVertexPosition;
                buf_normal.w = buf_normal.w + 0.001;
                gl_Position = buf_normal;


            } else {

                if (aVertexNormal != vec3(0.0, 0.0, 0.0)) {

                    // Normals and diffuse computations
                    buf_normal = normalize(uNormalMatrix * vec4(aVertexNormal, 1.0));	
                    fact_diffuse0 = max(-dot(buf_normal.xyz, uLight0_Direction), 0.0);
                    fact_diffuse1 = max(-dot(buf_normal.xyz, uLight1_Direction), 0.0);

                    Color0 = fact_diffuse0 * uLight0_Color * aVertexColor;
                    Color1 = fact_diffuse1 * uLight1_Color * aVertexColor;

                    vColor = vec3(clamp(max(Color0, Color1), uLightA_Color * aVertexColor, aVertexColor));

                } else {
                    vColor = aVertexColor;
                };

                // Position (vertex trough modelMatrix trough projectionMatrix)
                gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
            }


        }

`, FragmentShaderText: `

        uniform lowp vec3 uFogColor;
        uniform lowp float uFogLimit;
        uniform lowp float uFogFactor;

        varying lowp vec3 vColor;

        void main(void) {

            lowp float z_dist = (gl_FragCoord.z / gl_FragCoord.w) - uFogLimit;

            if ((uFogLimit > 0.0) && ( z_dist > 0.0 )) {
                gl_FragColor = vec4(mix(vColor, uFogColor, z_dist * uFogFactor), 1.0);

            } else {
                gl_FragColor = vec4(vColor, 1.0);
            }
        }

`,  AttributeList: ["aVertexPosition", "aVertexColor", "aVertexNormal"],

    UniformList: ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", 
    "uLightA_Color", "uLight0_Color", "uLight1_Color", "uLight0_Direction", "uLight1_Direction",
    "uFogColor", "uFogLimit", "uFogFactor", "uStrokePass", "uStrokeColor"]    
}






// toon/cell shader 

// pass 1, stroke extent
var programData_toon1Pass1 = {
    VertexShaderText: `
        attribute vec3 aVertexPosition;
        attribute vec3 aVertexNormal;
        
        uniform mat4 uModelMatrix;
        uniform mat4 uProjectionMatrix;
        
        uniform float uFar;
        uniform float uStrokeDepth;
        
        varying highp float zFact;
        
        void main(void) {
            vec4 extent = uProjectionMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
            zFact = 0.5 * (uFar - extent.z) / (uFar/2.0) ;
            extent = vec4(aVertexPosition + (aVertexNormal * uStrokeDepth * -extent.z * zFact), 1.0);
            gl_Position = uProjectionMatrix * uModelMatrix * extent;
        }
    `,
    FragmentShaderText: `
        uniform lowp vec4 uStrokeColor;
        uniform lowp vec4 uFarColor;
        
        varying highp float zFact;
        
        void main(void) {
            gl_FragColor = mix(uFarColor, uStrokeColor, zFact);
        }
    `,
    AttributeList: ["aVertexPosition", "aVertexNormal"],
    UniformList: ["uModelMatrix", "uProjectionMatrix", "uStrokeColor", "uStrokeDepth", "uFar", "uFarColor"]
}

// pass 2, cell/step shading
var programData_toon1Pass2 = {
    VertexShaderText: `
        //from model
        attribute vec4 aVertexPosition;
        attribute vec4 aVertexColor;
        attribute vec4 aVertexNormal;
        
        uniform mat4 uModelMatrix;
        uniform mat4 uNormalMatrix;
        uniform lowp vec4 uStrokeColor;
        
        //from scene
        uniform mat4 uProjectionMatrix;
        uniform lowp vec3 uLight;
        uniform lowp int uStrokePass; // 0: triangle pass, 1: stroke pass
        
        //output to fragment shader
        varying lowp float vFactDiffuse;
        varying lowp vec4 vOrigColor;
    
        void main(void) {
            
            vec4 buf_normal;
        
            if (uStrokePass == 1) {
        
                vOrigColor = uStrokeColor;
                buf_normal = uProjectionMatrix * uModelMatrix * aVertexPosition;
                buf_normal.w = buf_normal.w + 0.001;
                gl_Position = buf_normal;
        
        
            } else {
        
                buf_normal = normalize(uNormalMatrix * aVertexNormal);	
                
                // outputs
                vFactDiffuse = max(-dot(buf_normal.xyz, uLight), 0.0);
                gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
                vOrigColor = aVertexColor;
            }
        }
    `,
    FragmentShaderText: `
        varying lowp float vFactDiffuse;
        varying lowp vec4 vOrigColor;
        uniform lowp int uStrokePass;
        
        void main(void) {
            lowp vec4 baseColor = vec4(0.0, 0.0, 0.0, 1.0); // todo replace/ mix with texture
        
            if (uStrokePass == 1) {
                gl_FragColor =  vec4(0.0, 0.0, 0.0, 1.0);// vOrigColor;
            } else {
                if (vFactDiffuse > 0.5) {
                    gl_FragColor =  vOrigColor;
                } else if (vFactDiffuse > 0.25) {
                    gl_FragColor = mix(baseColor, vOrigColor, 0.50);
                } else {
                    gl_FragColor = mix(baseColor, vOrigColor, 0.25);
                }
            }
        
        }
    `,
    AttributeList: ["aVertexPosition", "aVertexColor", "aVertexNormal" ],
    UniformList: ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", "uLight", "uStrokePass"]
}





// TODO shader with shadows

var programData_shadow1Pass1 = {
    VertexShaderText: "",
    FragmentShaderText: "",
    AttributeList: [],
    UniformList: []
}

var programData_shadow1Pass2 = {
    VertexShaderText: "",
    FragmentShaderText: "",
    AttributeList: [],
    UniformList: []
}
