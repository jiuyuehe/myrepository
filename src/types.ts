export type CadViewMode = "2d" | "3d";
export type CadCompareMode = "none" | "overlay" | "dual";

export interface CadModelSource {
  modelId: string;
  name: string;
  src: string;
  type?: "dwg" | "dxf" | "pdf" | "glb" | "gltf" | "obj" | "fbx" | "stl";
}

export interface CadViewerConfig {
  enableSpinner?: boolean;
  enableLayoutBar?: boolean;
  enableLayerBar?: boolean;
  enableMarkup?: boolean;
  enableMeasurement?: boolean;
  backgroundColor?: string;
}

export interface CompareConfig {
  mode: CadCompareMode;
  base?: CadModelSource;
  target?: CadModelSource;
}

export interface CadViewerExpose {
  load2d: (source: CadModelSource) => Promise<void>;
  load3d: (source: CadModelSource) => Promise<void>;
  setFonts: (fontFiles: string[]) => Promise<void>;
  setCompare: (config: CompareConfig) => Promise<void>;
  clearCompare: () => Promise<void>;
  goHome: () => void;
  destroy: () => void;
}
