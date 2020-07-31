<template>
  <div id="app">
    <div ref="planet" class="planet">
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import Planet from './library';

import Nodes from './data/nodes.json';
import World from './data/world.json';

export default Vue.extend({
  name: 'App',

  data() {
    return {
      planet: undefined,
    };
  },

  mounted() {
    this.planet = new Planet({
      element: this.$refs.planet,
      geojson: World,
      data: Nodes,
      zoomExtent: [2, 100],
    });
    this.planet.init();
  },

  beforeDestroy() {
    this.planet.destroy();
  },
});
</script>

<style lang="less">
@import "./library/style.less";
</style>
