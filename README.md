# Vue3 CAD Web Viewer 组件封装

这是基于 `thingraph/dwg-viewer-example` 思路封装的 Vue3 独立组件，目标是直接在你的项目里复用 2D / 3D / 图纸对比能力。

## 已覆盖能力

- 2D 图纸查看（DWG / DXF / PDF）
- 3D 模型查看（GLB / glTF / OBJ / FBX / STL）
- 图纸对比：
  - overlay（同视口叠加）
  - dual（双视口并排）
- 字体文件加载（SHX）
- 事件回调：加载进度、加载完成、错误
- 对外方法：切换 2D/3D、设置对比、重置视图、销毁实例

> 说明：底层能力由 `@x-viewer/core` 提供，本组件负责 Vue3 生命周期、Props/Events/Expose 封装。

## 安装

```bash
npm i @x-viewer/core vue
```

把本仓库 `src` 拷贝到你的 Vue3 项目，或作为本地包引入。

## 组件 API

### Props

- `mode?: "2d" | "3d"` 默认 `"2d"`
- `model?: CadModelSource`
- `fonts?: string[]`
- `config?: CadViewerConfig`
- `compare?: CompareConfig`

### Events

- `loaded(source)`
- `progress({ loaded, total, type })`
- `error(error)`

### Expose 方法

- `load2d(source)`
- `load3d(source)`
- `setFonts(fonts)`
- `setCompare(compareConfig)`
- `clearCompare()`
- `goHome()`
- `destroy()`

## 用法示例

```vue
<script setup lang="ts">
import { ref } from "vue";
import { CadWebViewer } from "./src";
import type { CadViewerExpose } from "./src";

const viewerRef = ref<CadViewerExpose>();

const singleModel = {
  modelId: "dwg-001",
  name: "site-plan",
  src: "/models/site-plan.dwg",
  type: "dwg"
} as const;

const compareConfig = {
  mode: "dual",
  base: {
    modelId: "rev-a",
    name: "revision-a",
    src: "/models/rev-a.dxf",
    type: "dxf"
  },
  target: {
    modelId: "rev-b",
    name: "revision-b",
    src: "/models/rev-b.dxf",
    type: "dxf"
  }
} as const;
</script>

<template>
  <CadWebViewer
    ref="viewerRef"
    mode="2d"
    :model="singleModel"
    :fonts="['/fonts/hztxt.shx', '/fonts/simplex.shx']"
    :compare="compareConfig"
    @progress="(e) => console.log(e)"
    @loaded="(m) => console.log('loaded', m)"
    @error="(err) => console.error(err)"
  />
</template>
```

## 注意事项

1. `@x-viewer/core` 属于商业 SDK，需确保你当前环境可访问其依赖与授权。
2. 对比功能建议用于 2D 文件（DWG/DXF/PDF）。
3. 若使用 dual 对比，容器建议至少宽度 1200px，以保证双视口交互体验。
