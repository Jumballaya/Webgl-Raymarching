import "./style.css";
import vertexShader from "./shaders/vertex.glsl?raw";
import fragmentShader from "./shaders/fragment.glsl?raw";

import { WebGL } from "./gl/WebGL";
import { vec2 } from "gl-matrix";

const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]);

const uvs = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);

const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

async function main() {
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const ctx = canvas.getContext("webgl2");
  if (!ctx) throw new Error("could not create webgl2 rendering context");

  document.body.appendChild(canvas);

  const webgl = new WebGL(ctx);

  const vertexArray = webgl.createVertexArray({
    drawType: ctx.STATIC_DRAW,
    buffers: [
      {
        name: "a_positions",
        stride: 3,
        data: positions,
        type: ctx.FLOAT,
        normalized: false,
      },
      {
        name: "a_uvs",
        stride: 2,
        data: uvs,
        type: ctx.FLOAT,
        normalized: false,
      },
    ],
  });
  const indexBuffer = webgl.createIndexBuffer({
    drawType: ctx.STATIC_DRAW,
    data: indices,
  });

  const resolution: vec2 = [window.innerWidth, window.innerHeight];
  const shader = webgl.createShader(vertexShader, fragmentShader);
  shader.bind();
  shader.uniform("u_time", { type: "float", value: 0 });
  shader.uniform("u_resolution", { type: "vec2", value: resolution });
  shader.unbind();

  window.addEventListener("resize", () => {
    resolution[0] = window.innerWidth;
    resolution[1] = window.innerHeight;
    ctx.canvas.width = resolution[0];
    ctx.canvas.height = resolution[1];
    shader.bind();
    shader.uniform("u_resolution", { type: "vec2", value: resolution });
    shader.unbind();
  });

  webgl.clearColor([0, 0, 0]);
  let time = Date.now();
  let t = 0;
  const loop = () => {
    const curTime = Date.now();
    const deltaTime = curTime - time;
    time = curTime;
    t += deltaTime / 1000;

    webgl.clear("color");
    webgl.viewport(0, 0, resolution);
    vertexArray.bind();
    indexBuffer.bind();
    shader.bind();
    shader.uniform("u_time", { type: "float", value: t });
    webgl.drawElements(indexBuffer.count, "triangles");
    shader.unbind();
    indexBuffer.unbind();
    vertexArray.unbind();

    requestAnimationFrame(loop);
  };
  loop();
}
main();
