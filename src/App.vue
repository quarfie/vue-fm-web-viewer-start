<script setup>
import { model } from '@/model'
</script>

<template>
  <div class="p-4 font-sans">
    <h1 class="text-xl font-semibold">FileMaker Web Viewer Starter</h1>

    <div class="mt-4">
      <div class="text-sm text-gray-600">model:</div>
      <pre class="mt-2 rounded bg-gray-100 p-3 text-xs overflow-auto">{{ model }}</pre>
    </div>
  </div>
</template>
