import type { GLDrawType, IndexBufferConfig } from "./types/configs";

export class IndexBuffer {
  private ctx: WebGL2RenderingContext;
  private buffer: WebGLBuffer;
  private _count = 0;
  public drawType: GLDrawType;

  constructor(ctx: WebGL2RenderingContext, config: IndexBufferConfig) {
    const buffer = ctx.createBuffer();
    if (!buffer) throw new Error("could not create vertex buffer");

    ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, buffer);
    ctx.bufferData(ctx.ELEMENT_ARRAY_BUFFER, config.data, config.drawType);

    this.ctx = ctx;
    this.buffer = buffer;
    this.drawType = config.drawType;
    this._count = config.data.length;
  }

  public get count(): number {
    return this._count;
  }

  public bind() {
    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, this.buffer);
  }

  public unbind() {
    this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, null);
  }

  public set(data: ArrayBufferView, offset = 0) {
    this.ctx.bufferSubData(this.ctx.ELEMENT_ARRAY_BUFFER, offset, data);
  }
}
