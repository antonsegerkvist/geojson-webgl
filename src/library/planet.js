import { mat4 } from 'gl-matrix';

import {
  GeoJSONBuffer,
  OmnidirectionalBuffer,
} from './buffer';
import { GeoJSONProgram } from './shader';

export default class Planet {

  /**
   * Constructor assigns all external parameters to their correct location.
   */
  constructor(props) {
    this.element = props.element;
    this.geojson = props.geojson;
    this.data = props.data;

    this.zoomExtent = props.zoomExtent || [1, 10];

    this.resize = this.resize.bind(this);
    this.scroll = this.scroll.bind(this);
    this.mousedown = this.mousedown.bind(this);
    this.mousemove = this.mousemove.bind(this);
    this.mouseup = this.mouseup.bind(this);
    this.mouseleave = this.mouseleave.bind(this);

    this.init = this.init.bind(this);
    this.draw = this.draw.bind(this);
    this.destroy = this.destroy.bind(this);
    this.addEventListeners = this.addEventListeners.bind(this);
    this.removeEventListeners = this.removeEventListeners.bind(this);
  }

  /**
   * Initialize the planet context.
   */
  init() {
    //
    // Initialize the dom.
    //
    this.height = this.element.clientHeight;
    this.width = this.element.clientWidth;

    this.canvas = document.createElement('canvas');
    this.canvas.style.height = '100%';
    this.canvas.style.width = '100%';
    this.canvas.setAttribute('height', this.height);
    this.canvas.setAttribute('width', this.width);

    this.element.appendChild(this.canvas);

    this.gl = this.canvas.getContext('webgl');

    this.addEventListeners();

    //
    // Initialize all control variables.
    //

    this.mousePosition = undefined;
    this.mouseActive = false;

    this.zoom = this.zoomExtent[0];
    this.translation = [0, 0];

    //
    // Initialize all webgl resources.
    //

    this.programs = {};

    this.programs.geojson = new GeoJSONProgram(this.gl);
    this.programs.geojson.init();

    this.buffers = {};
    this.buffers.geojson = new GeoJSONBuffer(this.gl);
    this.buffers.geojson.init(this.geojson);

    this.buffers.omnidirectional = new OmnidirectionalBuffer(this.gl);
    this.buffers.omnidirectional.init();

    //
    // Render the scene.
    //

    this.draw();
  }

  /**
   * Handle resizes of the window.
   */
  resize() {
    this.height = this.element.clientHeight;
    this.width = this.element.clientWidth;

    this.canvas.setAttribute('height', this.height);
    this.canvas.setAttribute('width', this.width);

    this.gl.viewport(0, 0, this.width, this.height);

    this.draw();
  }

  /**
   * Handle scroll events.
   */
  scroll(event) {
    event.preventDefault();

    this.zoom -= 0.01 * event.deltaY;
    if (this.zoom > this.zoomExtent[1]) this.zoom = this.zoomExtent[1];
    else if (this.zoom < this.zoomExtent[0]) this.zoom = this.zoomExtent[0];

    this.draw();
  }

  /**
   * Handle mosedown events.
   */
  mousedown(event) {
    this.mousePosition = [
      event.x,
      event.y
    ];
    this.mouseActive = true;

    this.draw();
  }

  /**
   * Handle mousemove events.
   */
  mousemove(event) {
    if (this.mouseActive) {
      const deltaX = event.x - this.mousePosition[0];
      const deltaY = event.y - this.mousePosition[1];

      this.mousePosition = [
        event.x,
        event.y
      ];

      this.translation[0] += deltaX / this.zoom;
      this.translation[1] -= deltaY / this.zoom;
    }

    this.draw();
  }

  /**
   * Handle mouseup events.
   */
  mouseup(event) {
    this.mouseActive = false;

    this.draw();
  }

  /**
   * Handle mouseleave events.
   */
  mouseleave() {
    this.mouseActive = false;

    this.draw(event);
  }

  /**
   * Draw the opengl context.
   */
  draw() {
    const gl = this.gl;

    // Reset.

    gl.clearColor(0.9215686275, 0.9568627451, 0.9607843137, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    //
    // Global transformations.
    //

    const projectionMatrix = mat4.create();
    mat4.ortho(projectionMatrix,
      -this.width / 2.0,
      +this.width / 2.0,
      -this.height / 2.0,
      +this.height / 2.0,
      1,
      1000);

    let modelViewMatrix = mat4.create();
    mat4.scale(
      modelViewMatrix,
      modelViewMatrix,
      [this.zoom, this.zoom, 1]);
    mat4.translate(
      modelViewMatrix,
      modelViewMatrix,
      [this.translation[0], this.translation[1], -10]);

    //
    // Render geojson.
    //

    this.programs.geojson.use();

    gl.uniformMatrix4fv(
      this.programs.geojson.getUniformLocations().projectionMatrix,
      false,
      projectionMatrix,
    );
    gl.uniformMatrix4fv(
      this.programs.geojson.getUniformLocations().modelViewMatrix,
      false,
      modelViewMatrix,
    );

    this.buffers.geojson.draw(
      'dark',
      this.programs.geojson.getAttribLocations().vertexPosition,
      this.programs.geojson.getAttribLocations().vertexColor,
    );

    //
    // Render omnidirectional nodes.
    //

    this.data.nodes.forEach(node => {
      modelViewMatrix = mat4.create();
      mat4.scale(
        modelViewMatrix,
        modelViewMatrix,
        [this.zoom, this.zoom, 1]);
      mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        [this.translation[0], this.translation[1], 0]);
      mat4.translate(
        modelViewMatrix,
        modelViewMatrix,
        [node.x, node.y, -5]);
      mat4.scale(
        modelViewMatrix,
        modelViewMatrix,
        [1 / this.zoom, 1 / this.zoom, 1]);
      mat4.scale(
        modelViewMatrix,
        modelViewMatrix,
        [8, 8, 1]);

      gl.uniformMatrix4fv(
        this.programs.geojson.getUniformLocations().modelViewMatrix,
        false,
        modelViewMatrix,
      );

      this.buffers.omnidirectional.draw(
        this.programs.geojson.getAttribLocations().vertexPosition,
        this.programs.geojson.getAttribLocations().vertexColor,
      );
    });
  }

  /**
   * Free all the resources.
   */
  destroy() {
    //
    // Remove event listeners.
    //

    this.removeEventListeners();

    //
    // Free webgl resources. 
    //

    this.programs.geojson.destroy();

    //
    // Free the dom.
    //
    this.element.innerHTML = '';
  }

  /**
   * Adds event listeners to the dom.
   */
  addEventListeners() {
    window.addEventListener('resize', this.resize);

    this.element.addEventListener('wheel', this.scroll);
    this.element.addEventListener('mousedown', this.mousedown);
    this.element.addEventListener('mousemove', this.mousemove);
    this.element.addEventListener('mouseup', this.mouseup);
    this.element.addEventListener('mouseleave', this.mouseleave);
  }

  /**
   * Remove event listenrs from the dom.
   */
  removeEventListeners() {
    window.removeEventListener('resize', this.resize);

    this.element.removeEventListener('wheel', this.scroll);
    this.element.removeEventListener('mousedown', this.mousedown);
    this.element.removeEventListener('mousemove', this.mousemove);
    this.element.removeEventListener('mouseup', this.mouseup);
    this.element.removeEventListener('mouseleave', this.mouseleave);
  }

}