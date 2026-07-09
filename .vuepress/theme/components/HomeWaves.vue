<template>
  <svg
    class="home-waves"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 24 150 28"
    preserveAspectRatio="none"
    shape-rendering="auto"
    aria-hidden="true"
  >
    <defs>
      <path
        id="itcharge-gentle-wave"
        d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
      />
    </defs>
    <g class="parallax">
      <use href="#itcharge-gentle-wave" x="48" y="0" />
      <use href="#itcharge-gentle-wave" x="48" y="3" />
      <use href="#itcharge-gentle-wave" x="48" y="5" />
      <use href="#itcharge-gentle-wave" x="48" y="7" />
    </g>
  </svg>
</template>

<style scoped>
.home-waves {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  height: 12vh;
  min-height: 3.125rem;
  max-height: 9.375rem;
  margin-top: -11vh;
}

.parallax use {
  animation: home-waves-move 25s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
}

.parallax use:nth-child(1) {
  animation-delay: -2s;
  animation-duration: 7s;
  fill: var(--itcharge-wave-1, color-mix(in srgb, var(--vp-c-bg) 70%, transparent));
}

.parallax use:nth-child(2) {
  animation-delay: -3s;
  animation-duration: 10s;
  fill: var(--itcharge-wave-2, color-mix(in srgb, var(--vp-c-bg) 50%, transparent));
}

.parallax use:nth-child(3) {
  animation-delay: -4s;
  animation-duration: 13s;
  fill: var(--itcharge-wave-3, color-mix(in srgb, var(--vp-c-bg) 30%, transparent));
}

.parallax use:nth-child(4) {
  animation-delay: -5s;
  animation-duration: 20s;
  fill: var(--itcharge-wave-4, var(--vp-c-bg));
}

@keyframes home-waves-move {
  0% {
    transform: translate3d(-90px, 0, 0);
  }

  100% {
    transform: translate3d(85px, 0, 0);
  }
}

@media (max-width: 768px) {
  .home-waves {
    height: 10vh;
    min-height: 10vh;
  }
}
</style>
