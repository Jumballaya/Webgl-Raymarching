import type { Uniform } from "./types/uniforms";

type TaggedUniform = Uniform & {
  location: WebGLUniformLocation;
};

type ShaderType =
  | typeof WebGL2RenderingContext.VERTEX_SHADER
  | typeof WebGL2RenderingContext.FRAGMENT_SHADER;

export class Shader {
  public name: string;
  public program: WebGLProgram;
  private ctx: WebGL2RenderingContext;
  private uniforms: Map<string, TaggedUniform> = new Map();

  constructor(
    ctx: WebGL2RenderingContext,
    name: string,
    vertex: string,
    fragment: string
  ) {
    this.name = name;
    this.ctx = ctx;

    const program = ctx.createProgram();
    if (!program) throw new Error("could not create webgl2 program");
    const vert = this.compileShader(ctx.VERTEX_SHADER, vertex);
    const frag = this.compileShader(ctx.FRAGMENT_SHADER, fragment);
    ctx.attachShader(program, vert);
    ctx.attachShader(program, frag);
    ctx.linkProgram(program);
    if (!this.ctx.getProgramParameter(program, this.ctx.LINK_STATUS)) {
      throw new Error(`Program: ${this.ctx.getProgramInfoLog(program)}`);
    }
    ctx.deleteShader(vert);
    ctx.deleteShader(frag);
    this.program = program;
  }

  public bind() {
    this.ctx.useProgram(this.program);
  }

  public unbind() {
    this.ctx.useProgram(null);
  }

  public uniform(name: string, value: Uniform) {
    const found = this.uniforms.get(name);
    if (found) {
      if (found.type !== value.type) {
        throw new Error(
          `uniform type mismatch: 'received: ${value.type} and have: ${found.type}'`
        );
      }
      return this.updateUniform(name, found, value);
    }
    this.createUniform(name, value);
  }

  public addUBO(name: string, bindingPoint: number) {
    const index = this.ctx.getUniformBlockIndex(this.program, name);
    this.ctx.uniformBlockBinding(this.program, index, bindingPoint);
  }

  private compileShader(type: ShaderType, code: string): WebGLShader {
    const shader = this.ctx.createShader(type);
    if (!shader) throw new Error(`could not create shader:\n${code}`);
    this.ctx.shaderSource(shader, code);
    this.ctx.compileShader(shader);
    if (!this.ctx.getShaderParameter(shader, this.ctx.COMPILE_STATUS)) {
      throw new Error(
        `Shader [${
          type === this.ctx.VERTEX_SHADER ? "Vertex" : "Fragment"
        }]: ${this.ctx.getShaderInfoLog(shader)}`
      );
    }
    return shader;
  }

  private createUniform(name: string, uniform: Uniform) {
    const location = this.ctx.getUniformLocation(this.program, name);
    if (!location)
      throw new Error(`could not find uniform location for '${name}'`);
    this.updateUniform(name, { ...uniform, location }, uniform);
  }

  private updateUniform(name: string, uniform: TaggedUniform, update: Uniform) {
    this.bind();
    uniform.value = update.value;
    this.uniforms.set(name, uniform);
    switch (uniform.type) {
      case "float": {
        this.ctx.uniform1f(uniform.location, uniform.value);
        break;
      }
      case "vec2": {
        this.ctx.uniform2f(
          uniform.location,
          uniform.value[0],
          uniform.value[1]
        );
        break;
      }
      case "vec3": {
        this.ctx.uniform3f(
          uniform.location,
          uniform.value[0],
          uniform.value[1],
          uniform.value[2]
        );
        break;
      }
      case "vec4": {
        this.ctx.uniform4f(
          uniform.location,
          uniform.value[0],
          uniform.value[1],
          uniform.value[2],
          uniform.value[3]
        );
        break;
      }
      case "mat2": {
        this.ctx.uniformMatrix2fv(uniform.location, false, uniform.value);
        break;
      }
      case "mat3": {
        this.ctx.uniformMatrix3fv(uniform.location, false, uniform.value);
        break;
      }
      case "mat4": {
        this.ctx.uniformMatrix4fv(uniform.location, false, uniform.value);
        break;
      }
      case "texture": {
        this.ctx.uniform1i(uniform.location, uniform.value);
        break;
      }
      case "boolean": {
        this.ctx.uniform1i(uniform.location, uniform.value ? 1 : 0);
        break;
      }
    }
  }
}
