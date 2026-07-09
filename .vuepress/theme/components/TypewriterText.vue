<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    speed?: number;
    delay?: number;
  }>(),
  {
    speed: 100,
    delay: 400,
  },
);

const displayText = ref("");
const isTyping = ref(true);

let timer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  let index = 0;

  const type = () => {
    if (index < props.text.length) {
      displayText.value += props.text[index];
      index += 1;
      timer = setTimeout(type, props.speed);
      return;
    }

    isTyping.value = false;
  };

  timer = setTimeout(type, props.delay);
});

onUnmounted(() => {
  if (timer)
    clearTimeout(timer);
});
</script>

<template>
  <span class="typewriter" :aria-label="text">
    {{ displayText }}<span
      class="typewriter__cursor"
      :class="{ 'typewriter__cursor--typing': isTyping }"
      aria-hidden="true"
    />
  </span>
</template>

<style scoped>
.typewriter {
  display: inline-block;
}

.typewriter__cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  margin-left: 3px;
  vertical-align: -0.12em;
  background: currentcolor;
  animation: typewriter-blink 0.9s step-end infinite;
}

.typewriter__cursor--typing {
  animation: none;
  opacity: 1;
}

@keyframes typewriter-blink {
  50% {
    opacity: 0;
  }
}
</style>
