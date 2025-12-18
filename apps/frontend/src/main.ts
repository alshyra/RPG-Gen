import { createApp } from "vue";
import { createPinia } from "pinia";
import { VueQueryPlugin, QueryClient } from "@tanstack/vue-query";
import App from "./App.vue";
import router from "./router";
import "./styles.css";

const queryClient = new QueryClient();

const app = createApp(App);
app.use(createPinia());
app.use(VueQueryPlugin, { queryClient });
app.use(router);
app.mount("#app");

// Expose query client for E2E tests
if (import.meta.env.DEV || import.meta.env.MODE === "test") {
  (window as any).__vueQueryClient = queryClient;
}
