
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
