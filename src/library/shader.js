import vsGeoJSON from './shaders/vsgeojson';
import fsGeoJSON from './shaders/fsgeojson';

//
// Method for loading a shader program.
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.log('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// Method for loading a shader.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

//
// Class for loading the geojson shader program.
//
export class GeoJSONProgram {

  constructor(gl) {
    this.gl = gl;
  }

  init() {
    this.program = initShaderProgram(this.gl, vsGeoJSON, fsGeoJSON);

    this.attribLocations = {
      vertexPosition: this.gl.getAttribLocation(this.program, 'aVertexPosition'),
      vertexColor: this.gl.getAttribLocation(this.program, 'aVertexColor'),
    };
    this.uniformLocations = {
      projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
      modelViewMatrix: this.gl.getUniformLocation(this.program, 'uModelViewMatrix'),
    };
  }

  use() {
    this.gl.useProgram(this.program);
  }

  getAttribLocations() {
    return this.attribLocations;
  }

  getUniformLocations() {
    return this.uniformLocations;
  }

  destroy() {
    this.gl.deleteProgram(this.program);
  }

}