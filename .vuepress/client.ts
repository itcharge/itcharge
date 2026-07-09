import { defineClientConfig } from "vuepress/client";
import { watch } from "vue";
import { useRoute } from "vue-router";
import Layout from "./layouts/Layout.vue";
import HomeBanner from "./theme/components/HomeBanner.vue";
import HomeWaves from "./theme/components/HomeWaves.vue";
import "./theme/styles/index.css";

function markHomeFeaturesAnchor() {
  requestAnimationFrame(() => {
    const el = document.querySelector(".itcharge-home .vp-home-features");
    if (el) el.id = "home-features";
  });
}

export default defineClientConfig({
  enhance({ app }) {
    app.component("home-banner", HomeBanner);
    app.component("HomeBanner", HomeBanner);
    app.component("home-waves", HomeWaves);
    app.component("HomeWaves", HomeWaves);
  },
  setup() {
    if (typeof window === "undefined") return;

    const route = useRoute();
    watch(() => route.path, markHomeFeaturesAnchor, { immediate: true });
  },
  layouts: {
    Layout,
  },
});
