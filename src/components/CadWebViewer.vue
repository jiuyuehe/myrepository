<template>
  <div class="cad-viewer-root" :class="{ 'cad-viewer-root--dual': compareMode === 'dual' }">
    <div ref="primaryEl" class="cad-viewer-stage" />
    <div v-if="compareMode === 'dual'" ref="secondaryEl" class="cad-viewer-stage cad-viewer-stage--secondary" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CadModelSource, CadViewerConfig, CompareConfig, CadViewerExpose, CadViewMode } from "../types";

const props = withDefaults(
  defineProps<{
    mode?: CadViewMode;
    model?: CadModelSource;
    config?: CadViewerConfig;
    fonts?: string[];
    compare?: CompareConfig;
  }>(),
  {
    mode: "2d",
    config: () => ({})
  }
);

const emit = defineEmits<{
  (event: "loaded", payload: CadModelSource): void;
  (event: "error", payload: unknown): void;
  (event: "progress", payload: { loaded: number; total: number; type: string }): void;
}>();

const primaryEl = ref<HTMLElement | null>(null);
const secondaryEl = ref<HTMLElement | null>(null);
const compareMode = computed(() => props.compare?.mode ?? "none");

let Viewer2dCtor: any;
let Viewer3dCtor: any;
let primaryViewer: any;
let secondaryViewer: any;

async function resolveSdk() {
  if (Viewer2dCtor || Viewer3dCtor) return;
  const sdk = await import("@x-viewer/core");
  Viewer2dCtor = sdk.Viewer2d;
  Viewer3dCtor = sdk.Viewer3d;
}

function buildConfig(containerId: string) {
  return {
    containerId,
    enableSpinner: props.config.enableSpinner ?? true,
    enableLayoutBar: props.config.enableLayoutBar ?? true,
    enableLayerBar: props.config.enableLayerBar ?? true,
    enableMarkup: props.config.enableMarkup ?? true,
    enableMeasurement: props.config.enableMeasurement ?? true,
    backgroundColor: props.config.backgroundColor
  };
}

async function initPrimary(mode: CadViewMode) {
  await resolveSdk();
  if (!primaryEl.value) return;
  if (primaryViewer?.destroy) primaryViewer.destroy();

  const containerId = `cad-viewer-primary-${Math.random().toString(36).slice(2)}`;
  primaryEl.value.id = containerId;
  primaryViewer = mode === "2d" ? new Viewer2dCtor(buildConfig(containerId)) : new Viewer3dCtor(buildConfig(containerId));

  if (props.fonts?.length && mode === "2d" && primaryViewer?.setFont) {
    await primaryViewer.setFont(props.fonts);
  }
}

async function initSecondary() {
  if (compareMode.value !== "dual") {
    if (secondaryViewer?.destroy) secondaryViewer.destroy();
    secondaryViewer = undefined;
    return;
  }

  await resolveSdk();
  if (!secondaryEl.value) return;
  if (secondaryViewer?.destroy) secondaryViewer.destroy();

  const containerId = `cad-viewer-secondary-${Math.random().toString(36).slice(2)}`;
  secondaryEl.value.id = containerId;
  secondaryViewer = new Viewer2dCtor(buildConfig(containerId));

  if (props.fonts?.length && secondaryViewer?.setFont) {
    await secondaryViewer.setFont(props.fonts);
  }
}

function progressHandler(event: { loaded: number; total: number; type: string }) {
  emit("progress", event);
}

async function loadInto(viewer: any, source: CadModelSource) {
  if (!viewer) return;
  await viewer.loadModel(source, progressHandler);
  viewer.goToHomeView?.();
  emit("loaded", source);
}

async function load2d(source: CadModelSource) {
  await initPrimary("2d");
  await loadInto(primaryViewer, source);
}

async function load3d(source: CadModelSource) {
  await initPrimary("3d");
  await loadInto(primaryViewer, source);
}

async function setFonts(fontFiles: string[]) {
  await primaryViewer?.setFont?.(fontFiles);
  await secondaryViewer?.setFont?.(fontFiles);
}

async function setCompare(config: CompareConfig) {
  if (!config.base || !config.target) return;

  if (config.mode === "overlay") {
    await initPrimary("2d");
    await loadInto(primaryViewer, config.base);
    await loadInto(primaryViewer, config.target);
    return;
  }

  if (config.mode === "dual") {
    await initPrimary("2d");
    await initSecondary();
    await loadInto(primaryViewer, config.base);
    await loadInto(secondaryViewer, config.target);
  }
}

async function clearCompare() {
  if (secondaryViewer?.destroy) secondaryViewer.destroy();
  secondaryViewer = undefined;
}

function goHome() {
  primaryViewer?.goToHomeView?.();
  secondaryViewer?.goToHomeView?.();
}

function destroy() {
  primaryViewer?.destroy?.();
  secondaryViewer?.destroy?.();
  primaryViewer = undefined;
  secondaryViewer = undefined;
}

defineExpose<CadViewerExpose>({
  load2d,
  load3d,
  setFonts,
  setCompare,
  clearCompare,
  goHome,
  destroy
});

onMounted(async () => {
  try {
    await initPrimary(props.mode);

    if (props.compare?.mode && props.compare.mode !== "none") {
      await initSecondary();
      await setCompare(props.compare);
      return;
    }

    if (props.model) {
      if (props.mode === "3d") {
        await load3d(props.model);
      } else {
        await load2d(props.model);
      }
    }
  } catch (error) {
    emit("error", error);
  }
});

watch(
  () => props.mode,
  async (mode) => {
    try {
      await initPrimary(mode);
      if (props.model) {
        await loadInto(primaryViewer, props.model);
      }
    } catch (error) {
      emit("error", error);
    }
  }
);

watch(
  () => props.compare,
  async (next) => {
    try {
      if (!next || next.mode === "none") {
        await clearCompare();
        return;
      }
      await initSecondary();
      await setCompare(next);
    } catch (error) {
      emit("error", error);
    }
  },
  { deep: true }
);

onBeforeUnmount(() => destroy());
</script>

<style scoped>
.cad-viewer-root {
  width: 100%;
  height: 100%;
  min-height: 480px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.cad-viewer-stage {
  width: 100%;
  min-height: 480px;
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  overflow: hidden;
}

.cad-viewer-stage--secondary {
  border-color: #9cb5ff;
}

.cad-viewer-root--dual {
  grid-template-columns: 1fr 1fr;
}
</style>
