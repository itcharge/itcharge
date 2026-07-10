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

function applyNoReferrerPolicy(root: ParentNode = document) {
  root.querySelectorAll("img:not([referrerpolicy])").forEach((node) => {
    (node as HTMLImageElement).referrerPolicy = "no-referrer";
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

    applyNoReferrerPolicy();

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            if (!node.referrerPolicy)
              node.referrerPolicy = "no-referrer";
            return;
          }

          if (node instanceof HTMLElement)
            applyNoReferrerPolicy(node);
        });
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    const route = useRoute();
    watch(() => route.path, () => {
      markHomeFeaturesAnchor();
      applyNoReferrerPolicy();
    }, { immediate: true });
  },
  layouts: {
    Layout,
  },
});
