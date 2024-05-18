<script setup lang="ts">
import HelloWorld from "./components/HelloWorld.vue";
</script>

<template>
  <!-- <n-config-provider :theme="darkTheme" :locale="zhCN" :date-locale="dateZhCN"> -->
  <div>
    <HelloWorld />
  </div>
  <!-- </n-config-provider> -->
</template>

<style scoped>
#container {
  width: 60vw;
  height: 60vh;
}
</style>
