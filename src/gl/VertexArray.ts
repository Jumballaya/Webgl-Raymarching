import { VertexBuffer } from "./VertexBuffer";
import { GlNumber, VertexArrayConfig } from "./types/configs";

function sizeof(type: GlNumber): number {
  switch (type) {
    case WebGL2RenderingContext.FLOAT: {
      return 4;
    }
    default: {
      return 0;
    }
  }
}

export class VertexArray {
  private ctx: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private buffers: Record<string, VertexBuffer> = {};

  public vertexCount: number;

  constructor(ctx: WebGL2RenderingContext, config: VertexArrayConfig) {
    this.ctx = ctx;
    const vao = ctx.createVertexArray();
    if (!vao) throw new Error("could not create vertex array object");
    this.vao = vao;
    this.bind();

    this.vertexCount = 0;
    for (let i = 0; i < config.buffers.length; i++) {
      const buffer = config.buffers[i];
      const vertexBuffer = new VertexBuffer(ctx, {
        stride: buffer.stride,
        data: buffer.data,
        drawType: config.drawType,
        type: buffer.type,
        normalized: buffer.normalized,
      });
      vertexBuffer.bind();
      ctx.enableVertexAttribArray(i);
      ctx.vertexAttribPointer(
        i,
        buffer.stride,
        buffer.type,
        buffer.normalized,
        buffer.stride * sizeof(buffer.type),
        0
      );
      vertexBuffer.unbind();
      this.buffers[buffer.name] = vertexBuffer;
      this.vertexCount = vertexBuffer.count;
    }

    this.unbind();
  }

  public bind() {
    this.ctx.bindVertexArray(this.vao);
  }

  public unbind() {
    this.ctx.bindVertexArray(null);
  }
}
