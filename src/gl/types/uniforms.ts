import { mat2, mat3, mat4, vec2, vec3, vec4 } from "gl-matrix";

export type Uniform =
  | FloatUniform
  | Vec2Uniform
  | Vec3Uniform
  | Vec4Uniform
  | Mat2Uniform
  | Mat3Uniform
  | Mat4Uniform
  | TextureUniform
  | BooleanUniform;

export type TextureUniform = {
  type: "texture";
  value: number;
};

export type Mat4Uniform = {
  type: "mat4";
  value: mat4;
};

export type Mat3Uniform = {
  type: "mat3";
  value: mat3;
};

export type Mat2Uniform = {
  type: "mat2";
  value: mat2;
};

export type Vec4Uniform = {
  type: "vec4";
  value: vec4;
};

export type Vec3Uniform = {
  type: "vec3";
  value: vec3;
};

export type Vec2Uniform = {
  type: "vec2";
  value: vec2;
};

export type FloatUniform = {
  type: "float";
  value: number;
};

export type BooleanUniform = {
  type: "boolean";
  value: boolean;
};
