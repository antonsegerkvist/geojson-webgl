import earcut from 'earcut';

//
// Class for loading a omnidirectional access point.
//
export class OmnidirectionalBuffer {

  constructor(gl) {
    this.gl = gl;
  }

  init() {
    const gl = this.gl;

    const precission = 100;
    const components = 4;

    const outerRadius = 1;
    const innerRadius = 0.4;
    const dotRadius = 0.25;

    const coordinates = [];
    const indecies = [];

    const partyColor = [];

    for (let i = 0; i < precission; i += 1) {
      const angle = Math.PI * 2 / precission * i;

      coordinates.push(Math.cos(angle) * outerRadius);
      coordinates.push(Math.sin(angle) * outerRadius);
      coordinates.push(Math.cos(angle) * innerRadius);
      coordinates.push(Math.sin(angle) * innerRadius);
      coordinates.push(0);
      coordinates.push(0);
      coordinates.push(Math.cos(angle) * dotRadius);
      coordinates.push(Math.sin(angle) * dotRadius);

      indecies.push(((i + 0) * components + 0) % (precission * components));
      indecies.push(((i + 1) * components + 0) % (precission * components));
      indecies.push(((i + 0) * components + 1) % (precission * components));
      indecies.push(((i + 1) * components + 0) % (precission * components));
      indecies.push(((i + 1) * components + 1) % (precission * components));
      indecies.push(((i + 0) * components + 1) % (precission * components));
      
      indecies.push(((i + 0) * components + 2) % (precission * components));
      indecies.push(((i + 0) * components + 3) % (precission * components));
      indecies.push(((i + 1) * components + 3) % (precission * components));

      for (let j = 0; j < components; j += 1) {
        partyColor.push(1.0);
        partyColor.push(0.0);
        partyColor.push(0.0);
        partyColor.push(1.0);
      }
    }

    this.buffer = {};

    this.buffer.count = indecies.length;

    this.buffer.position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordinates), gl.STATIC_DRAW);

    this.buffer.party = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.party);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(partyColor), gl.STATIC_DRAW);

    this.buffer.index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indecies), gl.STATIC_DRAW);
  }

  draw(position, color) {
    const gl = this.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(position);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer.party);
    gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(color);
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer.index);

    gl.drawElements(gl.TRIANGLES, this.buffer.count, gl.UNSIGNED_SHORT, 0);
  }

  destroy() {
  }

}

//
// Class for loading a buffer from geojson format.
//
export class GeoJSONBuffer {

  constructor(gl) {
    this.gl = gl;
  }

  init(geojson) {
    const gl = this.gl;

    if (geojson.type !== 'FeatureCollection') {
      this.buffers = {
        polygons: [],
        multiPolygons: []
      };
    }

    const polygons = [];
    const multiPolygons = [];

    geojson.features.forEach(feature => {
      if (feature.type !== 'Feature') {
        return;
      }

      let data;
      let triangles;
      let context;
      let tmp;

      let dark;
      let light;

      switch (feature.geometry.type) {
        case 'Polygon':
          data = earcut.flatten(feature.geometry.coordinates);
          triangles = earcut(data.vertices, data.holes, data.dimensions);

          dark = [];
          light = [];
          feature.geometry.coordinates.forEach(coordinates => {
            coordinates.forEach(() => {
              dark.push(0.1);
              dark.push(0.1);
              dark.push(0.1);
              dark.push(1.0);

              light.push(0.8);
              light.push(0.8);
              light.push(0.8);
              light.push(1.0);
            });
          });

          context = {};

          context.count = triangles.length;

          context.position = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, context.position);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);

          context.dark = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, context.dark);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dark), gl.STATIC_DRAW);

          context.light = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, context.light);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(light), gl.STATIC_DRAW);

          context.index = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.index);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW);

          polygons.push(context);
          break;

        case 'MultiPolygon':
          tmp = { polygons: [] };
          feature.geometry.coordinates.forEach(coordinates => {
            data = earcut.flatten(coordinates);
            triangles = earcut(data.vertices, data.holes, data.dimensions);

            dark = [];
            light = [];
            coordinates.forEach(coordinate => {
              coordinate.forEach(() => {
                dark.push(0.1);
                dark.push(0.1);
                dark.push(0.1);
                dark.push(1.0);

                light.push(0.8);
                light.push(0.8);
                light.push(0.8);
                light.push(1.0);
              });
            });

            context = {};

            context.count = triangles.length;

            context.position = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, context.position);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW);
  
            context.dark = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, context.dark);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dark), gl.STATIC_DRAW);

            context.light = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, context.light);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(light), gl.STATIC_DRAW);

            context.index = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.index);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles), gl.STATIC_DRAW);

            tmp.polygons.push(context);
          });
          multiPolygons.push(tmp);
          break;
      }
    });

    this.buffers = {
      polygons,
      multiPolygons,
    };
  }

  draw(theme, position, color) {
    const gl = this.gl;

    //
    // Render polygons.
    //

    this.buffers.polygons.forEach(buffer => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(position);

      if (theme === 'dark') {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.dark);
        gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(color);
      } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.light);
        gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(color);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.index);

      gl.drawElements(gl.TRIANGLES, buffer.count, gl.UNSIGNED_SHORT, 0);
    });

    //
    // Render multi polygons.
    //
    this.buffers.multiPolygons.forEach(multiPolygon => {
      multiPolygon.polygons.forEach(buffer => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(position);

        if (theme === 'dark') {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer.dark);
          gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(color);
        } else {
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer.light);
          gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(color);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.index);

        gl.drawElements(gl.TRIANGLES, buffer.count, gl.UNSIGNED_SHORT, 0);
      });
    });
  }

  destroy() {
  }

}