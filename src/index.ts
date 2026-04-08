import type { App } from "vue";
import CadWebViewer from "./components/CadWebViewer.vue";

export * from "./types";
export { CadWebViewer };

export default {
  install(app: App) {
    app.component("CadWebViewer", CadWebViewer);
  }
};
