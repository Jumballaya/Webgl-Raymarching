import { mat4, vec4 } from "gl-matrix";
import { Shader } from "./Shader";
import { UBOConfig, UBOLayout } from "./types/configs";

let bindingPoint = 0;
export class UBO {
  private ctx: WebGL2RenderingContext;
  private buffer: WebGLBuffer;
  private layout: Record<string, UBOLayout> = {};
  private bindingPoint = bindingPoint++;

  private data: Float32Array;

  public name: string;

  constructor(
    ctx: WebGL2RenderingContext,
    name: string,
    config: UBOConfig | Float32Array
  ) {
    this.ctx = ctx;
    this.name = name;
    const buffer = ctx.createBuffer();
    if (!buffer) throw new Error("could not create uniform buffer object");
    this.buffer = buffer;
    this.ctx.bindBufferBase(
      this.ctx.UNIFORM_BUFFER,
      this.bindingPoint,
      this.buffer
    );

    if (config instanceof Float32Array) {
      this.ctx.bufferData(ctx.UNIFORM_BUFFER, config, ctx.DYNAMIC_DRAW);
      this.unbind();
      this.data = config;
      return;
    }

    let size = 0;
    for (const entry of config) {
      this.layout[entry.name] = { type: entry.type, offset: size };
      size += entry.type === "mat4" ? 16 : 4;
    }
    this.data = new Float32Array(size);
    this.ctx.bufferData(ctx.UNIFORM_BUFFER, this.data, ctx.DYNAMIC_DRAW);

    this.unbind();
  }

  public setupShader(shader: Shader) {
    shader.addUBO(this.name, this.bindingPoint);
  }

  public set(name: string, value: mat4 | vec4) {
    const info = this.layout[name];
    if (!info) return;

    const offset = info.offset;
    this.data.set(value, offset);
    this.ctx.bufferSubData(this.ctx.UNIFORM_BUFFER, 0, this.data);
  }

  public update(data: Float32Array, offset = 0) {
    this.data.set(data, offset / 4);
    this.ctx.bufferSubData(this.ctx.UNIFORM_BUFFER, offset, this.data);
  }

  public bind() {
    this.ctx.bindBuffer(this.ctx.UNIFORM_BUFFER, this.buffer);
  }

  public unbind() {
    this.ctx.bindBuffer(this.ctx.UNIFORM_BUFFER, null);
  }
}
