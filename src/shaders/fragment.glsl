#version 300 es

precision mediump float;

out vec4 outColor;

in vec2 v_uv;

uniform float u_time;
uniform vec2 u_resolution;

const int NUM_STEPS = 256;
const float MIN_DIST = 0.00001;
const float MAX_DIST = 1000.0;
const float WATER_LEVEL = 0.45;

float random(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return -1.0 + 2.0 * fract(p.x * p.y * (p.x + p.y));
}

float noise(vec2 coords) {
  vec2 texSize = vec2(1.0);
  vec2 pc = coords * texSize;
  vec2 base = floor(pc);

  float s1 = random((base + vec2(0.0, 0.0)) / texSize);
  float s2 = random((base + vec2(1.0, 0.0)) / texSize);
  float s3 = random((base + vec2(0.0, 1.0)) / texSize);
  float s4 = random((base + vec2(1.0, 1.0)) / texSize);

  vec2 f = smoothstep(0.0, 1.0, fract(pc));

  float px1 = mix(s1, s2, f.x);
  float px2 = mix(s3, s4, f.x);
  float result = mix(px1, px2, f.y);
  return result;
}

float noiseFBM(vec2 p, int octaves, float persistance, float lacunarity) {
  float amp = 0.5;
  float ttl = 0.0;
  for (int i = 0; i < octaves; ++i) {
    float noiseValue = noise(p);
    ttl += noiseValue * amp;
    amp *= persistance;
    p = p * lacunarity;
  }
  return ttl;
}

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

float sdfRoundCone(vec3 p, float r1, float r2, float h) {
  // sampling independent computations (only depend on shape)
  float b = (r1-r2)/h;
  float a = sqrt(1.0-b*b);

  // sampling dependant computations
  vec2 q = vec2( length(p.xz), p.y );
  float k = dot(q,vec2(-b,a));
  if( k<0.0 ) return length(q) - r1;
  if( k>a*h ) return length(q-vec2(0.0,h)) - r2;
  return dot(q, vec2(a,b) ) - r1;
}

float sdfEllipse(vec3 p, vec3 r) {
  float k0 = length(p/r);
  float k1 = length(p/(r*r));
  return k0*(k0-1.0)/k1;
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

MaterialData min_material(MaterialData a, MaterialData b) {
  if (a.dist < b.dist) return a;
  return b;
}

// Calculates the overal SDF
MaterialData map(vec3 pos) {
  float curNoiseSample = noiseFBM(pos.xz * 0.5, 1, 0.5, 2.0);
  curNoiseSample = abs(curNoiseSample);
  curNoiseSample *= 1.5;
  curNoiseSample += 0.1 * noiseFBM(pos.xz * 4.0, 6, 0.5, 2.0);

  vec3 landColor = vec3(0.298, 0.435, 0.1960);
  landColor = mix(landColor, landColor * 0.25, smoothstep(WATER_LEVEL - 0.1, WATER_LEVEL, curNoiseSample));
  
  landColor = mix(landColor, WHITE, smoothstep(WATER_LEVEL, pos.y, curNoiseSample));
  
  vec3 shallowWaterColor = vec3(0.25, 0.25, 0.75);
  vec3 deepWaterColor = vec3(0.025, 0.025, 0.15);
  vec3 waterColor = mix(shallowWaterColor, deepWaterColor, smoothstep(WATER_LEVEL, WATER_LEVEL + 0.1, curNoiseSample));
  waterColor = mix(waterColor, WHITE, smoothstep(WATER_LEVEL + 0.00925, WATER_LEVEL, curNoiseSample));

  MaterialData result = MaterialData(landColor, pos.y + curNoiseSample);
  MaterialData waterMaterial = MaterialData(waterColor, pos.y + WATER_LEVEL);

  return min_material(result, waterMaterial);
}

MaterialData raycast(vec3 cameraOrigin, vec3 cameraDir, int numSteps, float startDist, float maxDist) {
  MaterialData material = MaterialData(vec3(0.0), startDist);
  MaterialData defaultMaterial = MaterialData(vec3(0.0), -1.0);
  for (int i = 0; i < numSteps; ++i) {
    vec3 pos = cameraOrigin + material.dist * cameraDir;
    MaterialData result = map(pos);


    // Case 1: result.dist < 0, intersected scene
    if (abs(result.dist) < MIN_DIST * material.dist) {
      break;
    }

    material.dist += result.dist;
    material.color = result.color;

    // Case 2: result.dist > MAX_DIST, out of the scene
    if (material.dist > maxDist) {
      return defaultMaterial;
    }

    // Case 3: loop around, do nothing
  }

  return material;
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
  MaterialData result = raycast(pos, lightDir, 64, 0.01, 10.0);
  if (result.dist >= 0.0) {
    return 0.0;
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

// Performs the sphere tracing for the scene
vec3 raymarch(vec3 cameraOrigin, vec3 cameraDir) {
  MaterialData material = raycast(cameraOrigin, cameraDir, NUM_STEPS, 1.0, MAX_DIST);

  vec3 lightDir = normalize(vec3(-0.5, 0.2, -0.6));

  float skyT = exp(saturate(cameraDir.y) * -40.0);
  float sunFactor = pow(saturate(dot(lightDir, cameraDir)), 8.0);
  vec3 skyColor = mix(vec3(0.025, 0.065, 0.5), vec3(0.4, 0.5, 1.0), skyT);
  vec3 sunColor = vec3(1.0, 0.9, 0.65);
  vec3 fogColor = mix(skyColor, sunColor, sunFactor);

  if (material.dist < 0.0) {
    return fogColor;
  }

  vec3 pos = cameraOrigin + material.dist * cameraDir;

  vec3 lightColor = WHITE;
  vec3 normal = calculateNormal(pos);
  vec3 lighting = calculateLighting(pos, normal, lightColor, lightDir);
  float shadow = calculateShadow(pos, lightDir);

  float fogDist = distance(cameraOrigin, pos);
  float inscatter = 1.0 - exp(-fogDist * fogDist * mix(0.0005, 0.001, sunFactor));
  float extinction = exp(-fogDist * fogDist * 0.01);

  vec3 color = material.color * lighting * shadow;
  color = color * extinction + fogColor * inscatter;

  return color;
}

mat3 makeCameraMatrix(vec3 cameraOrigin, vec3 cameraLookAt, vec3 cameraUp) {
  vec3 z = normalize(cameraLookAt - cameraOrigin);
  vec3 x = normalize(cross(z, cameraUp));
  vec3 y = cross(x, z);
  return mat3(x, y, z);
}

void main() {
  vec2 pixelCoords = (v_uv - 0.5) * u_resolution;
  vec3 rayDir = normalize(vec3(pixelCoords * 2.0 / u_resolution.y, 1.0));
  vec3 rayOrigin = vec3(-u_time, 2.5, u_time);
  vec3 rayLookAt = rayOrigin + vec3(-0.08, 0.0, 0.05);
  mat3 camera = makeCameraMatrix(rayOrigin, rayLookAt, vec3(0.0, 1.0, 0.0));

  vec3 color = raymarch(rayOrigin, camera * rayDir);

  outColor = vec4(pow(color, vec3(1.0 / 2.2)), 1.0);
}