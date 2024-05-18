<template>
    <div>
        <h1 v-if="val">haha</h1>
        <p class="h1">heihei</p>
        <button type="button" class="btn btn-primary" @click="val = !val">Primary</button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const val = ref(true)
</script>

<style scoped>

</style>