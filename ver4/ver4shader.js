// Easy3D_WebGL
// Base class container for GLSL shader program loading and compiling
// Container file for various WebGL GLSL shaders and their attribute lists
// Emmanuel Charette 2017-2019

"use strict"

class E3D_program {
    constructor(id, context) {
        this.id = id;
        this.context = context;

        this.shaderProgram = null;
        this.shaderAttributes = {};
        this.shaderUniforms = {};
    }

    compile(vertexSource, fragmentSource) {
        const vs = E3D_program.loadShader(this.context, this.context.VERTEX_SHADER, vertexSource);
        const fs = E3D_program.loadShader(this.context, this.context.FRAGMENT_SHADER, fragmentSource);

        if ((vs != null) && (fs != null)) {
            this.shaderProgram = this.context.createProgram();
            this.context.attachShader(this.shaderProgram, vs);
            this.context.attachShader(this.shaderProgram, fs);
            this.context.linkProgram(this.shaderProgram);

            if (!this.context.getProgramParameter(this.shaderProgram, this.context.LINK_STATUS)) {
                console.log('Unable to initialize the shader program: ' + this.context.getProgramInfoLog(this.shaderProgram));
                this.shaderProgram = null;
            }
        } else {
            this.shaderProgram = null;
        }
    }


    bindLocations(attribList, uniformList) {
        for (let i = 0; i < attribList.length; ++i) {
            this.shaderAttributes[attribList[i]] = this.context.getAttribLocation(this.shaderProgram, attribList[i]);
        }

        for (let i = 0; i < uniformList.length; ++i) {
            this.shaderUniforms[uniformList[i]] = this.context.getUniformLocation(this.shaderProgram, uniformList[i]);
        }
    }

    static loadShader(context, type, source) {
        const shader = context.createShader(type);       
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            console.log('An error occurred compiling the '+ type +' shaders: ' + context.getShaderInfoLog(shader));
            context.deleteShader(shader);
            return null;
        }
        return shader;
    }

}



const vertShader00 = `
//from model
attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelViewMatrix;
uniform mat4 uModelNormalMatrix;

//from scene
uniform mat4 uProjectionMatrix;
uniform vec3 uLight;

//output to fragment shader
varying lowp vec4 vColor;
  

void main(void) {
    vec4 buf_normal;
    float fact_diffuse;

    buf_normal = normalize(uModelNormalMatrix * vec4(aVertexNormal, 1.0));	
    fact_diffuse = max(dot(buf_normal.xyz, uLight), 0.0);

    // outputs
    vColor = vec4(0.1,0.1,0.1,1.0) + (aVertexColor * fact_diffuse * 0.8);
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

    //vNormal = aVertexNormal;
}
`;

const fragShader00 = `
varying lowp vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}
`;
const attribList00 = ["aVertexPosition", "aVertexColor", "aVertexNormal"];
const uniformList00 = ["uModelViewMatrix", "uModelNormalMatrix", "uProjectionMatrix", "uLight"];







const vertShader01 = `
//from model
attribute vec4 aVertexPosition;
attribute vec3 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;

uniform int uStrokePass; // 0: triangle pass, 1: stroke pass

//from scene
uniform mat4 uProjectionMatrix;

//Lights
uniform vec3 uLightA_Color;
uniform vec3 uLight0_Color;
uniform vec3 uLight1_Color;
uniform vec3 uLight0_Direction;
uniform vec3 uLight1_Direction;

//output to fragment shader
varying lowp vec4 vColor;
  

void main(void) {

    vec4 buf_normal;
    float fact_diffuse0;
    float fact_diffuse1;
    //vec3 ColorA;
    vec3 Color0;
    vec3 Color1;

    if (uStrokePass == 1) {

        vColor = vec4(1.0, 1.0, 1.0, 1.0);
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

            vColor = vec4(clamp(max(Color0, Color1), uLightA_Color * aVertexColor, aVertexColor) , 1.0);

        } else {
            vColor = vec4(aVertexColor, 1.0);
        };

        // Position (vertex trough modelMatrix trough projectionMatrix)
        gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
    }


}
`;

const fragShader01 = `
uniform lowp vec4 uFogColor;
uniform lowp float uFogLimit;
uniform lowp float uFogFactor;

varying lowp vec4 vColor;

void main(void) {

    lowp float z_dist = (gl_FragCoord.z / gl_FragCoord.w) - uFogLimit;

    if ((uFogLimit > 0.0) && ( z_dist > 0.0 )) {
        gl_FragColor = mix(vColor, uFogColor, z_dist * uFogFactor);

    } else {
        gl_FragColor = vColor;
    }
}`;
const attribList01 = ["aVertexPosition", "aVertexColor", "aVertexNormal"];
const uniformList01 = ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", 
"uLightA_Color", "uLight0_Color", "uLight1_Color", "uLight0_Direction", "uLight1_Direction",
"uFogColor", "uFogLimit", "uFogFactor", "uStrokePass"];








const vertShader01p = `
//from model
attribute vec4 aVertexPosition;
attribute vec3 aVertexColor;
attribute vec3 aVertexNormal;

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
`;

const fragShader01p = `
varying lowp vec4 vColor;

void main(void) {
    gl_FragColor = vColor;
}`;
const attribList01p = ["aVertexPosition", "aVertexColor", "aVertexNormal"];
const uniformList01p = ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix"];








// cell shading tests
// pass 1, stroke extent
const vertShader02_CS00 = `
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
`;

const fragShader02_CS00 = `
uniform lowp vec4 uStrokeColor;
uniform lowp vec4 uFarColor;

varying highp float zFact;

void main(void) {
    gl_FragColor = mix(uFarColor, uStrokeColor, zFact);
}
`;

const attribList02_CS00 = ["aVertexPosition", "aVertexNormal"];
const uniformList02_CS00 = ["uModelMatrix", "uProjectionMatrix", "uStrokeColor", "uStrokeDepth", "uFar", "uFarColor"];


// pass 2, cell/step shading
const vertShader02_CS01 = `
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
`;


const fragShader02_CS01 = `
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
`;
const attribList02_CS01 = ["aVertexPosition", "aVertexColor", "aVertexNormal" ];
const uniformList02_CS01 = ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", "uLight", "uStrokePass"];


// TODO shader with shadows
