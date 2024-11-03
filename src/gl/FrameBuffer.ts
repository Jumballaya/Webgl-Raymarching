import { vec2 } from "gl-matrix";
import { Texture } from "./Texture";

type AttachmentType = "color" | "depth" | "stencil";
type Attachment = {
  type: AttachmentType;
  size: vec2;
};

interface FrameBufferTextures {
  color: Array<Texture>;
  depth: Texture | undefined;
  stencil: Texture | undefined;
}

export class FrameBuffer {
  private buffer: WebGLFramebuffer;
  private ctx: WebGL2RenderingContext;
  private texOffset: number;

  private textures: FrameBufferTextures = {
    color: [],
    depth: undefined,
    stencil: undefined,
  };

  constructor(ctx: WebGL2RenderingContext, texOffset: number) {
    const buffer = ctx.createFramebuffer();
    if (!buffer) throw new Error("could not create frame buffer");
    this.buffer = buffer;
    this.texOffset = texOffset;

    if (
      ctx.checkFramebufferStatus(ctx.FRAMEBUFFER) !== ctx.FRAMEBUFFER_COMPLETE
    ) {
      throw new Error("frame buffer attachments error");
    }

    ctx.bindFramebuffer(ctx.FRAMEBUFFER, buffer);

    ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);

    this.ctx = ctx;
  }

  public getOffset(): number {
    let offset = this.texOffset;
    offset += this.textures.color.length;
    if (this.textures.depth) {
      offset += 1;
    }
    return offset;
  }

  public attachment(attachment: Attachment) {
    if (attachment.type === "color") {
      this.createColorAttachment(attachment.size);
      return;
    }
    if (attachment.type === "depth" && this.textures.depth === undefined) {
      this.createDepthAttachment(attachment.size);
      return;
    }
    if (attachment.type === "stencil" && this.textures.stencil === undefined) {
      return;
    }
  }

  public unbindTextures() {
    for (let i = 0; i < this.textures.color.length; i++) {
      const tex = this.textures.color[i];
      tex.unbind();
    }
  }

  public bind() {
    this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, this.buffer);
    let colorCount = 0;
    for (let i = 0; i < this.textures.color.length; i++) {
      const tex = this.textures.color[i];
      tex.bind(this.texOffset + i);
      colorCount = i;
    }
    this.textures.depth?.bind(this.texOffset + colorCount + 1);
  }

  public unbind() {
    this.ctx.bindFramebuffer(this.ctx.FRAMEBUFFER, null);
  }

  public getDrawBuffers() {
    const len = this.textures.color.length;
    const out: number[] = [];
    for (let i = 0; i < this.texOffset; i++) {
      out.push(this.ctx.NONE);
    }
    for (let i = 0; i < len; i++) {
      out.push(this.ctx.COLOR_ATTACHMENT0 + i + this.texOffset);
    }
    if (out.length === 0) {
      out.push(this.ctx.NONE);
    }
    return out;
  }

  public getColorTexture() {
    return this.textures.color;
  }

  public getDepthTexture() {
    return this.textures.depth;
  }

  public getStencilTexture() {
    return this.textures.stencil;
  }

  private createColorAttachment(size: vec2) {
    const ctx = this.ctx;
    const texture = new Texture(ctx, size, {
      internalFormat: ctx.RGBA16F,
    });
    const textureUnit = 1 + this.textures.color.length + this.texOffset;
    texture.bind(this.textures.color.length + this.texOffset);
    ctx.framebufferTexture2D(
      ctx.FRAMEBUFFER,
      ctx.COLOR_ATTACHMENT0 + textureUnit,
      ctx.TEXTURE_2D,
      texture.getTexture(),
      0
    );
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_COMPARE_FUNC, ctx.LEQUAL);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_COMPARE_MODE, ctx.NONE);

    texture.unbind();

    this.textures.color.push(texture);
  }

  private createDepthAttachment(size: vec2) {
    const ctx = this.ctx;
    const texture = new Texture(ctx, size, {
      internalFormat: ctx.DEPTH_COMPONENT24,
      format: ctx.DEPTH_COMPONENT,
      type: ctx.UNSIGNED_INT,
    });
    texture.bind(this.texOffset);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
    ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
    ctx.framebufferTexture2D(
      ctx.FRAMEBUFFER,
      ctx.DEPTH_ATTACHMENT,
      ctx.TEXTURE_2D,
      texture.getTexture(),
      0
    );
    texture.unbind();

    this.textures.depth = texture;
  }
}
