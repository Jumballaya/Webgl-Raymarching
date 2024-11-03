import type { GLDrawType, GlNumber, VertexBufferConfig } from "./types/configs";

export class VertexBuffer {
  private ctx: WebGL2RenderingContext;
  private buffer: WebGLBuffer;
  private vertexCount = 0;
  public drawType: GLDrawType;
  public numType: GlNumber;
  public normalized: boolean;
  public stride: number;

  constructor(ctx: WebGL2RenderingContext, config: VertexBufferConfig) {
    const buffer = ctx.createBuffer();
    if (!buffer) throw new Error("could not create vertex buffer");
    ctx.bindBuffer(ctx.ARRAY_BUFFER, buffer);
    ctx.bufferData(ctx.ARRAY_BUFFER, config.data, config.drawType);
    this.vertexCount = config.data.length / config.stride;

    this.ctx = ctx;
    this.buffer = buffer;
    this.drawType = config.drawType;
    this.numType = config.type;
    this.normalized = config.normalized;
    this.stride = config.stride;
  }

  public get count(): number {
    return this.vertexCount;
  }

  public bind() {
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, this.buffer);
  }

  public unbind() {
    this.ctx.bindBuffer(this.ctx.ARRAY_BUFFER, null);
  }

  public set(data: ArrayBufferView, offset = 0) {
    this.ctx.bufferSubData(this.ctx.ARRAY_BUFFER, offset, data);
  }
}
