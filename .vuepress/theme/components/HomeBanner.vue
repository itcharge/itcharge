<script setup lang="ts">
import type { ThemeHero, ThemeHomeBanner } from "vuepress-theme-plume/client";
import HomeWaves from "./HomeWaves.vue";
import TypewriterText from "./TypewriterText.vue";
import { computed } from "vue";
import { withBase } from "vuepress/client";
import { isLinkHttp } from "vuepress/shared";

defineOptions({
  name: "HomeBanner",
});

const props = defineProps<ThemeHomeBanner>();

const bannerStyle = computed(() => {
  const banner = props.banner ?? "/home-bg.webp";
  const link = isLinkHttp(banner) ? banner : withBase(banner);
  return {
    backgroundImage: `url(${link})`,
  };
});

const hero = computed<ThemeHero | undefined>(() => props.hero);
const actions = computed(() => hero.value?.actions ?? []);

function onActionClick(event: MouseEvent, link: string) {
  if (!link.startsWith("#")) return;

  event.preventDefault();
  const target = document.querySelector(link);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}
</script>

<template>
  <section class="itcharge-home-banner" :style="bannerStyle">
    <div class="itcharge-home-banner__mask" aria-hidden="true" />

    <div class="itcharge-home-banner__content">
      <h1 v-if="hero?.name" class="itcharge-home-banner__name" v-html="hero.name" />
      <p v-if="hero?.tagline" class="itcharge-home-banner__tagline">
        <TypewriterText :text="hero.tagline" />
      </p>
      <p v-if="hero?.text" class="itcharge-home-banner__text" v-html="hero.text" />

      <div v-if="actions.length" class="itcharge-home-banner__actions">
        <a
          v-for="action in actions"
          :key="action.link"
          class="itcharge-home-banner__btn"
          :class="action.theme === 'brand' ? 'itcharge-home-banner__btn--primary' : 'itcharge-home-banner__btn--ghost'"
          :href="action.link"
          :target="action.target"
          :rel="action.rel"
          @click="onActionClick($event, action.link)"
        >
          {{ action.text }}
        </a>
      </div>
    </div>

    <HomeWaves />
  </section>
</template>

<style scoped>
.itcharge-home-banner {
  position: relative;
  width: 100%;
  height: 100vh;
  margin-top: calc(0px - var(--vp-nav-height));
  overflow: hidden;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
}

.itcharge-home-banner__mask {
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(180deg, rgb(210 170 110 / 22%) 0%, transparent 38%),
    linear-gradient(180deg, rgb(36 52 68 / 18%) 0%, rgb(18 28 38 / 72%) 100%);
}

.itcharge-home-banner__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 24px;
  text-align: center;
}

.itcharge-home-banner__name {
  margin: 0;
  font-size: clamp(2.25rem, 6vw, 4.5rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--itcharge-home-title, #fffdf8);
  text-shadow: 0 2px 18px rgb(24 36 48 / 45%);
}

.itcharge-home-banner__tagline {
  max-width: 720px;
  margin: 1.25rem 0 0;
  font-size: clamp(1.125rem, 2.5vw, 1.5rem);
  font-weight: 500;
  line-height: 1.5;
  color: var(--itcharge-home-subtitle, rgb(245 236 220 / 92%));
  text-shadow: 0 1px 10px rgb(24 36 48 / 35%);
}

.itcharge-home-banner__text {
  max-width: 640px;
  margin: 1rem 0 0;
  font-size: 1rem;
  line-height: 1.6;
  color: rgb(240 232 218 / 82%);
}

.itcharge-home-banner__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  margin-top: 2rem;
}

.itcharge-home-banner__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 128px;
  padding: 0 22px;
  font-size: 15px;
  font-weight: 600;
  line-height: 44px;
  text-decoration: none;
  border-radius: 999px;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.itcharge-home-banner__btn:hover {
  transform: translateY(-1px);
}

.itcharge-home-banner__btn--primary {
  color: #243240;
  background: linear-gradient(135deg, #e8d2ad 0%, #c9a978 100%);
  border: 1px solid rgb(255 245 228 / 55%);
  box-shadow: 0 10px 28px rgb(20 30 40 / 28%);
}

.itcharge-home-banner__btn--primary:hover {
  background: linear-gradient(135deg, #f0ddb8 0%, #d4b484 100%);
  box-shadow: 0 12px 32px rgb(20 30 40 / 34%);
}

.itcharge-home-banner__btn--ghost {
  color: #faf5eb;
  background: rgb(255 248 236 / 12%);
  border: 1px solid rgb(255 248 236 / 38%);
  backdrop-filter: blur(10px);
}

.itcharge-home-banner__btn--ghost:hover {
  color: #fffdf8;
  background: rgb(255 248 236 / 22%);
  border-color: rgb(255 248 236 / 55%);
}
</style>
