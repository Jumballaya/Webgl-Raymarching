import { loadImage } from "./WebGL";

async function load_cubemap_images(paths: string[]) {
  const out: HTMLImageElement[] = [];
  for (const path of paths) {
    const image = await loadImage(path);
    out.push(image);
  }
  return out;
}

export class TextureCubeMap {
  private ctx: WebGL2RenderingContext;
  private texture: WebGLTexture;

  public static async FromFiles(ctx: WebGL2RenderingContext, paths: string[]) {
    const images = await load_cubemap_images(paths);
    return new TextureCubeMap(ctx, images);
  }

  constructor(ctx: WebGL2RenderingContext, images: HTMLImageElement[]) {
    const texture = ctx.createTexture();
    if (!texture) throw new Error("could not create skybox texture");
    ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, texture);
    for (let i = 0; i < images.length; i++) {
      ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, true);
      const image = images[i];
      ctx.texImage2D(
        ctx.TEXTURE_CUBE_MAP_POSITIVE_X + i,
        0,
        ctx.RGB,
        image.width,
        image.height,
        0,
        ctx.RGB,
        ctx.UNSIGNED_BYTE,
        image
      );
    }
    ctx.texParameteri(ctx.TEXTURE_CUBE_MAP, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
    ctx.texParameteri(ctx.TEXTURE_CUBE_MAP, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);

    ctx.texParameteri(
      ctx.TEXTURE_CUBE_MAP,
      ctx.TEXTURE_WRAP_S,
      ctx.CLAMP_TO_EDGE
    );
    ctx.texParameteri(
      ctx.TEXTURE_CUBE_MAP,
      ctx.TEXTURE_WRAP_T,
      ctx.CLAMP_TO_EDGE
    );
    ctx.texParameteri(
      ctx.TEXTURE_CUBE_MAP,
      ctx.TEXTURE_WRAP_R,
      ctx.CLAMP_TO_EDGE
    );
    this.texture = texture;
    this.ctx = ctx;
  }

  public bind(unit: number) {
    this.ctx.activeTexture(this.ctx.TEXTURE0 + unit);
    this.ctx.bindTexture(this.ctx.TEXTURE_CUBE_MAP, this.texture);
  }

  public unbind() {
    this.ctx.bindTexture(this.ctx.TEXTURE_CUBE_MAP, null);
  }
}
