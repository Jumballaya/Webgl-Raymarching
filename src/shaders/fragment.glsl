#version 300 es

precision mediump float;

out vec4 outColor;

in vec2 v_uv;

uniform float u_time;
uniform vec2 u_resolution;


float inverseLerp(float v, float minValue, float maxValue) {
  return (v - minValue) / (maxValue - minValue);
}

float remap(float v, float inMin, float inMax, float outMin, float outMax) {
  float t = inverseLerp(v, inMin, inMax);
  return mix(outMin, outMax, t);
}

float saturate(float x) {
  return clamp(x, 0.0, 1.0);
}

float sdfPlane(vec3 p) {
  return p.y;
}

float sdfSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdfBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdfTorus(vec3 p, vec2 t) {
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}

struct MaterialData {
  vec3 color;
  float dist;
};

const vec3 RED = vec3(1.0, 0.0, 0.0);
const vec3 GREEN = vec3(0.0, 1.0, 0.0);
const vec3 BLUE = vec3(0.0, 0.0, 1.0);
const vec3 GREY = vec3(0.5);
const vec3 WHITE = vec3(1.0);

// Calculates the overal SDF
MaterialData map(vec3 pos) {
  MaterialData result = MaterialData(GREY, sdfPlane(pos - vec3(0.0, -2.0, 0.0)));

  float dist = sdfBox(pos - vec3(-2.0, -0.85, 5.0), vec3(1.0));
  result.color = dist < result.dist ? RED : result.color;
  result.dist = min(result.dist, dist);

  dist = sdfBox(pos - vec3(2.0, -0.99, 5.0), vec3(1.0));
  result.color = dist < result.dist ? BLUE : result.color;
  result.dist = min(result.dist, dist);

  dist = sdfTorus(pos - vec3(2.0, 1.0, 50.0 + sin(u_time) * 25.0), vec2(1.0, 0.4));
  result.color = dist < result.dist ? BLUE : result.color;
  result.dist = min(result.dist, dist);

  return result;
}

const float EPS = 0.0001;
vec3 calculateNormal(vec3 pos) {
  vec3 n = vec3(
    map(pos + vec3(EPS, 0.0, 0.0)).dist - map(pos - vec3(EPS, 0.0, 0.0)).dist,
    map(pos + vec3(0.0, EPS, 0.0)).dist - map(pos - vec3(0.0, EPS, 0.0)).dist,
    map(pos + vec3(0.0, 0.0, EPS)).dist - map(pos - vec3(0.0, 0.0, EPS)).dist
  );
  return normalize(n);
}

vec3 calculateLighting(vec3 pos, vec3 normal, vec3 lightColor, vec3 lightDir) {
  float dp = saturate(dot(normal, lightDir));
  return lightColor * dp;
}

float calculateShadow(vec3 pos, vec3 lightDir) {
  float d = 0.01;
  for (int i = 0; i < 64; ++i) {
    float distToScene = map(pos + lightDir * d).dist;
    if (distToScene < 0.001) {
      return 0.0;
    }

    d += distToScene;
  }
  return 1.0;
}

float calculateAO(vec3 pos, vec3 normal) {
  float ao = 0.0;
  float stepSize = 0.1;

  for (float i = 0.0; i < 5.0; ++i) {
    float distFactor = 1.0 / pow(2.0, i);
    ao += distFactor * (i * stepSize - map(pos + normal * i * stepSize).dist);
  }

  return 1.0 - ao;
}

const int NUM_STEPS = 256;
const float MAX_DIST = 1000.0;

// Performs the sphere tracing for the scene
vec3 raymarch(vec3 cameraOrigin, vec3 cameraDir) {

  vec3 pos;
  MaterialData material = MaterialData(vec3(0.0), 0.0);
  vec3 skyColor = vec3(0.55, 0.6, 1.0);

  for (int i = 0; i < NUM_STEPS; ++i) {
    pos = cameraOrigin + material.dist * cameraDir;
    MaterialData result = map(pos);


    // Case 1: result.dist < 0, intersected scene
    if (result.dist < 0.001) {
      break;
    }

    material.dist += result.dist;
    material.color = result.color;

    // Case 2: result.dist > MAX_DIST, out of the scene
    if (material.dist > MAX_DIST) {
      return skyColor;
    }

    // Case 3: loop around, do nothing
  }

  vec3 lightDir = normalize(vec3(1.0, 2.0, -1.0));
  vec3 lightColor = WHITE;
  vec3 normal = calculateNormal(pos);
  vec3 lighting = calculateLighting(pos, normal, lightColor, lightDir);
  float shadow = calculateShadow(pos, lightDir);
  float fogFactor = 1.0 - exp(-pos.z * 0.01);
  float ao = calculateAO(pos, normal);

  vec3 color = material.color * lighting * shadow * ao;
  color = mix(color, skyColor, fogFactor);

  return color;
}


void main() {
  vec2 pixelCoords = (v_uv - 0.5) * u_resolution;
  vec3 rayDir = normalize(vec3(pixelCoords * 2.0 / u_resolution.y, 1.0));
  vec3 rayOrigin = vec3(0.0);

  vec3 color = raymarch(rayOrigin, rayDir);


  outColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}