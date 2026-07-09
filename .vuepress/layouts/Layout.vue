<script setup lang="ts">
import { Layout as PlumeLayout } from "vuepress-theme-plume/client";
</script>

<template>
  <PlumeLayout>
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </PlumeLayout>
</template>
