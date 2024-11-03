export type GlNumber = typeof WebGL2RenderingContext.FLOAT;
export type GLDrawType =
  | typeof WebGL2RenderingContext.STATIC_DRAW
  | typeof WebGL2RenderingContext.DYNAMIC_DRAW;
export type DrawMode = "triangles" | "lines" | "points";

export type VertexBufferConfig = {
  stride: number;
  data: Float32Array;
  drawType: GLDrawType;
  type: GlNumber;
  normalized: boolean;
};

export type VertexArrayConfig = {
  drawType: GLDrawType;
  buffers: Array<{
    name: string;
    type: GlNumber;
    stride: number;
    normalized: boolean;
    data: Float32Array;
  }>;
};

export type IndexBufferConfig = {
  drawType: GLDrawType;
  data: Uint16Array;
};

export type TextureConfig = {
  flipY?: boolean;
  magFilter?: number;
  minFilter?: number;
  wrapS?: number;
  wrapT?: number;
  internalFormat?:
    | typeof WebGL2RenderingContext.RGBA
    | typeof WebGL2RenderingContext.RGBA16F
    | typeof WebGL2RenderingContext.RGBA8
    | typeof WebGL2RenderingContext.DEPTH_COMPONENT24
    | typeof WebGL2RenderingContext.DEPTH_STENCIL;
  format?:
    | typeof WebGL2RenderingContext.RGBA
    | typeof WebGL2RenderingContext.DEPTH_COMPONENT
    | typeof WebGL2RenderingContext.DEPTH_STENCIL;
  type?:
    | typeof WebGL2RenderingContext.UNSIGNED_BYTE
    | typeof WebGL2RenderingContext.UNSIGNED_INT;
};

export type UBOLayout = {
  type: "vec4" | "mat4" | "float";
  offset: number;
};

export type UBOConfig = Array<{ name: string; type: UBOLayout["type"] }>;
