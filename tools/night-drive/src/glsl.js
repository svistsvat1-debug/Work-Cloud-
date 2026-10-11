// Shared GLSL: noise, lights, shading. Units are arbitrary HDR radiance.
export const MAXL = 16;

export const NOISE = /* glsl */ `
float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
vec3 hash32(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yxz+33.33); return fract((p3.xxy+p3.yzz)*p3.zyx); }
vec3 hash33(vec3 p3){ p3 = fract(p3*vec3(.1031,.1030,.0973)); p3 += dot(p3, p3.yxz+33.33); return fract((p3.xxy+p3.yxx)*p3.zyx); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),u.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),u.x), u.y); }
float fbm2(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+17.1; a*=0.5; } return s; }
`;

export const LIGHTS = /* glsl */ `
#define MAXL ${MAXL}
uniform int uLCount;
uniform vec3 uLPos[MAXL];
uniform vec3 uLCol[MAXL];
uniform vec4 uLDir[MAXL];   // xyz = beam direction, w = type (0 omni/spot, 1 low beam)
uniform vec2 uLCone[MAXL];  // cos outer, cos inner (omni: -2,-1)
uniform vec3 uLRt[MAXL];    // beam right vector (low beams)
uniform vec3 uFogAmb;
uniform vec3 uCamPos;

// Beam shape. Returns relative intensity for a direction 'Ld' leaving the light.
float beam(int i, vec3 Ld){
  vec4 dd = uLDir[i];
  float c = dot(Ld, dd.xyz);
  if (dd.w < 0.5) {
    vec2 cn = uLCone[i];
    return cn.x < -1.0 ? 1.0 : smoothstep(cn.x, cn.y, c);
  }
  if (c < 0.2) return 0.0;
  vec3 rr = uLRt[i];
  vec3 uu = cross(rr, dd.xyz);
  float h = dot(Ld, rr)/c, v = dot(Ld, uu)/c;
  float cut = mix(-0.012, 0.012, smoothstep(0.0, 0.06, h));
  float hor = 0.55*exp(-pow((h-0.03)/0.42, 2.0)) + 0.9*exp(-pow((h-0.04)/0.11, 2.0));
  float ver = v > -0.03 ? 1.0 : exp(-pow((v+0.03)/0.055, 2.0));
  float below = smoothstep(cut+0.005, cut-0.005, v);
  return hor*ver*below + 0.05*hor*exp(-pow(v/0.3, 2.0));
}

float ggx(float NoH, float a){ float a2=a*a; float d=NoH*NoH*(a2-1.0)+1.0; return a2/(3.14159*d*d); }

// rough: perceptual roughness. spec: specular weight. retro: retroreflective gain.
vec3 shade(vec3 P, vec3 N, vec3 V, vec3 alb, float rough, float spec, float wrap, float retro){
  vec3 acc = alb * uFogAmb * (0.6 + 0.4*N.y);
  float a = max(rough*rough, 0.002);
  float NoV = max(dot(N,V), 0.04);
  for (int i=0;i<MAXL;i++){
    if (i >= uLCount) break;
    vec3 Lv = uLPos[i]-P;
    float d2 = dot(Lv,Lv);
    vec3 L = Lv*inversesqrt(d2);
    float b = beam(i, -L);
    if (b <= 0.0) continue;
    vec3 E = uLCol[i]*b/(d2+0.6);
    float NoL = dot(N,L);
    float dif = max((NoL+wrap)/(1.0+wrap), 0.0);
    acc += alb*dif*E;
    if (NoL > 0.0) {
      vec3 H = normalize(L+V);
      float VoH = max(dot(V,H),0.0);
      float F = 0.02 + 0.98*pow(1.0-VoH, 5.0);
      acc += E * spec * min(ggx(max(dot(N,H),0.0), a) * F / (4.0*NoV), 60.0);
    }
    if (retro > 0.0) acc += E * alb * retro * pow(max(dot(V,L),0.0), 120.0);
  }
  return acc;
}
`;
