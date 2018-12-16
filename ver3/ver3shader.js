
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


const attribList01 = ["aVertexPosition", "aVertexColor", "aVertexNormal"];
const uniformList01 = ["uModelMatrix", "uNormalMatrix", "uProjectionMatrix", 
"uLightA_Color", "uLight0_Color", "uLight1_Color", "uLight0_Direction", "uLight1_Direction",
"uFogColor", "uFogLimit", "uFogFactor"];

const vertShader01 = `
//from model
attribute vec4 aVertexPosition;
attribute vec3 aVertexColor;
attribute vec3 aVertexNormal;

uniform mat4 uModelMatrix;
uniform mat4 uNormalMatrix;

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

    if (aVertexNormal != vec3(0.0, 0.0, 0.0)) {

        // Normals and diffuse computations
        buf_normal = normalize(uNormalMatrix * vec4(aVertexNormal, 1.0));	
        fact_diffuse0 = max(dot(buf_normal.xyz, uLight0_Direction), 0.0);
        fact_diffuse1 = max(dot(buf_normal.xyz, uLight1_Direction), 0.0);

        Color0 = fact_diffuse0 * uLight0_Color * aVertexColor;
        Color1 = fact_diffuse1 * uLight1_Color * aVertexColor;

        vColor = vec4(clamp(max(Color0, Color1), uLightA_Color * aVertexColor, aVertexColor) , 1.0);

    } else {
        vColor = vec4(aVertexColor, 1.0);
    };

    // Position (vertex trough modelMatrix trough projectionMatrix)
    gl_Position = uProjectionMatrix * uModelMatrix * aVertexPosition;
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
