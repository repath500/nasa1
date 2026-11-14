/**
 * GLSL ES 3.00 for the landing dither engine. One fragment per dither cell.
 * The threshold matrix is indexed by the cell coordinate inside its own plate, so the pattern never moves
 * relative to the picture (no shimmer). Scenes are mirrored in scenes.ts for the Canvas 2D fallback.
 */
export const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

export const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uCells;
uniform float uT;
uniform int uScene;      // 0 flame, 1 orbit
uniform int uMatrix;     // 0 bayer 4x4, 1 bayer 8x8, 2 blue noise
uniform sampler2D uBlue;
uniform vec3 uBg;
uniform vec3 uC1;        // primary tone (droplet blue)
uniform vec3 uC2;        // warm tone (solid fuel orange)
uniform vec3 uC3;        // gas teal
uniform vec3 uInk;       // neutral ink
uniform float uMorph;    // flame: 0 = 1 g teardrop, 1 = microgravity sphere
uniform float uFade;     // 0..1 overall luminance
uniform vec2 uCenter;    // flame centre in 0..1 plate coordinates, y up
uniform float uScale;
uniform vec4 uBody0;     // orbit bodies: x, y, radius in cells (y up)
uniform vec4 uBody1;
uniform vec4 uBody2;
uniform vec3 uOrbit;     // orbit ring centre x, y (cells) and radius (cells)

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float bayer(ivec2 p, int n) {
  int v = 0;
  for (int k = 0; k < 3; k++) {
    if (k >= n) break;
    int bx = (p.x >> k) & 1;
    int by = (p.y >> k) & 1;
    v = v * 4 + 2 * (bx ^ by) + by;
  }
  float d = n == 2 ? 16.0 : 64.0;
  return (float(v) + 0.5) / d;
}

float threshold(ivec2 p) {
  if (uMatrix == 0) return bayer(p, 2);
  if (uMatrix == 1) return bayer(p, 3);
  return texelFetch(uBlue, p & 31, 0).r;
}

float sphere(vec2 p, float t) {
  float r = length(p);
  float a = atan(p.y, p.x);
  float R = 0.62 * (1.0 + 0.02 * sin(t * 1.3 + a * 3.0) + 0.012 * sin(t * 2.7 - a * 5.0));
  float shell = exp(-pow((r - R) / 0.075, 2.0));
  float halo = r > R ? exp(-(r - R) * 5.0) * 0.38 : 0.0;
  float inner = (1.0 - smoothstep(0.0, R, r)) * 0.10;
  float drop = 1.0 - smoothstep(0.035, 0.06, r);
  return clamp(shell * 1.1 + halo + inner + drop, 0.0, 1.0);
}

float teardrop(vec2 p, float t) {
  vec2 q = p + vec2(0.0, 0.66);
  float s = q.y / (1.5 * (1.0 + 0.04 * sin(t * 7.3)));
  if (s < -0.04 || s > 1.0) return 0.0;
  float sc = clamp(s, 0.0, 1.0);
  float w = 0.40 * sqrt(clamp(sc / 0.22, 0.0, 1.0)) * pow(max(1.0 - sc, 0.0), 1.1);
  float off = 0.05 * sin(q.y * 5.0 - t * 6.0) * sc * sc + 0.03 * sin(q.y * 11.0 - t * 9.5) * sc;
  float dx = abs(q.x - off);
  float body = (1.0 - smoothstep(w * 0.55, w, dx)) * (1.0 - 0.5 * sc);
  float core = (1.0 - smoothstep(0.0, w * 0.5, dx)) * (1.0 - smoothstep(0.1, 0.38, sc)) * step(0.06, sc) * 0.4;
  float glow = 0.26 * exp(-max(dx - w, 0.0) * 4.0) * (1.0 - sc * 0.5);
  return clamp(body - core + glow, 0.0, 1.0);
}

vec4 flameScene(vec2 frag, float t) {
  float u = min(uCells.x, uCells.y) * 0.5 * uScale;
  vec2 p = (frag - uCenter * uCells) / u;
  float m = smoothstep(0.0, 1.0, uMorph);
  float lt = teardrop(p, t);
  float ls = sphere(p, t);
  float l = mix(lt, ls, m);
  vec3 c = mix(uC2, uC1, m);
  float star = h21(floor(frag)) > 0.9962 ? 0.9 * step(0.35, fract(h21(floor(frag) + 3.1) * 7.0 + t * 0.12)) : 0.0;
  if (star > 0.0 && l < 0.2) return vec4(uInk, 1.0);
  return vec4(c, l);
}

vec4 body(vec4 b, vec2 frag, float t, int id, vec3 col) {
  vec2 d = (frag - b.xy) / b.z;
  float d2 = dot(d, d);
  if (d2 < 1.0) {
    float z = sqrt(1.0 - d2);
    vec3 n = vec3(d, z);
    float lamb = max(dot(n, normalize(vec3(-0.55, 0.6, 0.55))), 0.0);
    float fid = float(id);
    float tex = 0.8 + 0.2 * sin(d.x * 9.0 + sin(d.y * 6.0 + fid * 2.0) * 2.0 + (id == 0 ? t * 0.12 : 0.0));
    if (id == 1) tex -= 0.28 * smoothstep(0.78, 1.0, sin(d.x * 17.0 + 1.0) * sin(d.y * 15.0 + 2.0));
    float rim = pow(1.0 - z, 3.0) * 0.12;
    return vec4(col, clamp(lamb * tex + rim + 0.03, 0.0, 1.0));
  }
  if (id == 0) {
    float g = exp(-(sqrt(d2) - 1.0) * 16.0) * 0.4;
    if (g > 0.02) return vec4(col, g);
  }
  return vec4(0.0);
}

vec4 orbitScene(vec2 frag, float t) {
  vec4 r = vec4(0.0);
  vec4 e = body(uBody0, frag, t, 0, uC1);
  vec4 mo = body(uBody1, frag, t, 1, uInk);
  vec4 x = body(uBody2, frag, t, 2, uC2);
  if (e.a > 0.0) r = e;
  if (mo.a > 0.0) r = mo;
  if (x.a > 0.0) r = x;
  // dashed orbit ring around the current target
  vec2 o = (frag - uOrbit.xy) / vec2(uOrbit.z, uOrbit.z * 0.3);
  float ring = abs(length(o) - 1.0) * uOrbit.z;
  if (ring < 0.7 && r.a < 0.05) {
    float dash = step(0.5, fract(atan(o.y, o.x) * 7.0 / 6.2832 * 3.0));
    r = vec4(uInk, 0.55 * dash);
  }
  // test flames: plus-shaped pixels orbiting the target
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    float ang = fi * 2.399 + t * (0.24 + 0.05 * mod(fi, 4.0));
    float rr = uOrbit.z * (1.0 + 0.07 * mod(fi, 4.0));
    vec2 pos = uOrbit.xy + vec2(cos(ang) * rr, sin(ang) * rr * 0.3);
    vec2 dd = abs(floor(frag) - floor(pos));
    if (dd.x + dd.y < 1.5) r = vec4(mod(fi, 3.0) < 2.0 ? uC2 : uC3, 1.0);
  }
  float star = h21(floor(frag)) > 0.9965 ? 0.9 * step(0.35, fract(h21(floor(frag) + 3.1) * 7.0 + t * 0.1)) : 0.0;
  if (star > 0.0 && r.a < 0.2) return vec4(uInk, 1.0);
  return r;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float t = uT;
  vec4 s = uScene == 0 ? flameScene(frag, t) : orbitScene(frag, t);
  float th = threshold(ivec2(frag));
  bool on = s.a * uFade > th;
  outColor = vec4(on ? s.rgb : uBg, 1.0);
}`;
