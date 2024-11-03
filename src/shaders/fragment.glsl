#version 300 es

precision mediump float;

out vec4 outColor;

in vec2 v_uv;

void main() {
  outColor = vec4(v_uv, 1.0, 1.0);
}