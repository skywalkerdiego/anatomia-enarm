// ── Body: the Blender-built model, drawn with WebGL2 in the figure's own isometric camera ──
// One opaque pass writes colour plus an id/depth target; the skin is a glass shell blended
// on top; a last pass inks every outline from the id target, like the kit's line work.
const Body = (() => {
  const M = D.body;
  const CAM = D.cam; // { cam:[sinA,cosA,sinE,cosE], k, origin:[x,y], W, H }: the pedestal's projection
  const S = {};
  const LIST = [];
  const DEPTH = [-1500, 2400];
  let gl = null, canvas = null, main = null, post = null, target = null;
  let vertexBuffer = null, indexBuffer = null, quad = null;
  let ready = false, failed = "";
  let cpu = null;
  const U = {}, UP = {};

  const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in float aFlow;
layout(location=2) in vec2 aOct;
layout(location=3) in float aAO;
layout(location=4) in float aPart;
uniform vec3 uLo,uSize;
uniform vec2 uTurn;
uniform vec4 uCam;
uniform vec3 uOK;
uniform vec4 uView;
uniform vec2 uDepth;
uniform float uTime;
uniform int uMode;
uniform vec3 uShift;
uniform vec4 uPivot;
uniform vec4 uHA,uHB,uHC;
uniform vec4 uLA,uLB;
uniform vec4 uWave;
uniform vec4 uBeats,uBeatQ;
uniform vec4 uCut;
uniform vec4 uSwell;
out vec3 vN;out vec3 vM;out vec4 vA;out float vDepth;
vec3 octDecode(vec2 e){vec3 n=vec3(e,1.-abs(e.x)-abs(e.y));float t=max(-n.z,0.);n.xy+=mix(vec2(t),vec2(-t),step(0.,n.xy));return normalize(n);}
float pulseAt(float age){float a=max(age,0.)/.085;return a*exp(1.-a);}
float band(float x,float a,float b,float soft){return smoothstep(a-soft,a+soft,x)*(1.-smoothstep(b-soft,b+soft,x));}
void main(){
  vec3 p=uLo+aPos*uSize;
  vec3 n=octDecode(aOct);
  float flow=aFlow/8.;
  float wave=0.;
  if(uHC.w>.5){
    // The heart: the AV plane slides towards a fixed apex, the ventricles squeeze and twist,
    // the atria squeeze a beat earlier and then stretch as the plane pulls away.
    vec3 q=p-uHA.xyz;
    float s=clamp(dot(q,uHB.xyz)/uHA.w,0.,1.);
    vec3 axial=dot(q,uHB.xyz)*uHB.xyz;
    vec3 radial=q-axial;
    float vent=smoothstep(.30,.46,s);
    float slide=uHA.w*.085*uHB.w*(s>.38?(1.-s)/.62:s/.38);
    float squeeze=1.-.13*uHB.w*vent-.09*uHC.x*(1.-vent);
    float a=uHC.y*uHB.w*vent*s;
    vec3 u=normalize(cross(uHB.xyz,vec3(0.,0.,1.)));
    vec3 v=cross(uHB.xyz,u);
    vec2 rr=mat2(cos(a),sin(a),-sin(a),cos(a))*vec2(dot(radial,u),dot(radial,v))*squeeze;
    p=uHA.xyz+axial+uHB.xyz*slide+u*rr.x+v*rr.y;
    p+=n*uHC.z*sin(uTime*41.+p.x*.37+p.z*.29+p.y*.33);
  }
  if(uMode==2){
    // A lung: it swells about its hilum and its base follows the diaphragm; collapse pulls it in.
    vec3 q=p-uPivot.xyz;
    float low=1.-smoothstep(uLB.x,uLB.y,p.z);
    float k=1.+.055*uLA.x*(1.-uLA.y)-.5*uLA.y;
    p=uPivot.xyz+q*vec3(k,k,1.+(k-1.)*.6);
    p.z-=uLA.z*uLA.x*low*(1.-uLA.y);
  }else if(uMode==4){
    // The diaphragm: the domes descend, the rim stays on the ribs.
    p.z-=uLA.x*smoothstep(uLB.x,uLB.y,p.z);
  }else if(uMode==3){
    float open=1.-uCut.y*smoothstep(uCut.x-2.,uCut.x+2.,flow)*((uCut.z<0.||abs(aPart-uCut.z)<.5)?1.:0.);
    if(uWave.w<.5){
      vec4 age=uBeats-flow/max(uWave.x,1.);
      wave=dot(uBeatQ,vec4(pulseAt(age.x),pulseAt(age.y),pulseAt(age.z),pulseAt(age.w)))*open;
    }else if(uWave.w<1.5){
      float ph=fract((flow-uWave.x*uTime)/uWave.y);
      wave=band(ph,.06,.22,.06)-.9*band(ph,.3,.44,.06);
    }
    p+=n*uWave.z*wave;
  }
  p+=n*(uSwell.x+uSwell.w*band(flow,uSwell.y,uSwell.z,6.));
  p=uPivot.xyz+(p-uPivot.xyz)*(uMode==2?1.:uPivot.w)+uShift;
  vM=p;
  // The kit's screen is a mirror of a right-handed world (its +x runs to the right), so the model's
  // x is flipped on the way in: the patient's left then lands on the viewer's right, as it should.
  vec3 w=vec3(-p.x*uTurn.x-p.y*uTurn.y,-p.x*uTurn.y+p.y*uTurn.x,p.z);
  vN=vec3(-n.x*uTurn.x-n.y*uTurn.y,-n.x*uTurn.y+n.y*uTurn.x,n.z);
  vec2 vb=uOK.xy+uOK.z*vec2(w.x*uCam.x-w.y*uCam.y,(w.x*uCam.y+w.y*uCam.x)*uCam.z-w.z*uCam.w);
  float d=(w.x*uCam.y+w.y*uCam.x)*uCam.w+w.z*uCam.z;
  vDepth=d;
  vA=vec4(aAO,flow,aPart,wave);
  gl_Position=vec4(vb*uView.xy+uView.zw,1.-2.*clamp((d-uDepth.x)*uDepth.y,0.,1.),1.);
}`;

  const FS = `#version 300 es
precision highp float;
in vec3 vN;in vec3 vM;in vec4 vA;in float vDepth;
uniform vec4 uCam;
uniform float uTime;
uniform vec2 uDepth;
uniform vec3 uColor;
uniform vec4 uMat;
uniform vec4 uState;
uniform vec4 uLens;
uniform vec4 uTint;
uniform vec4 uSpotA,uSpotColA,uSpotB,uSpotColB;
uniform vec4 uLevel,uLevelCol;
uniform vec4 uCut;
uniform vec4 uFlow;
uniform vec4 uTheme;
uniform vec3 uAccent;
uniform vec4 uGlass;
uniform sampler2D uSelTex;
uniform vec2 uPx;
uniform float uPre;
uniform float uKeep;
uniform float uBlend;
layout(location=0) out vec4 oColor;
layout(location=1) out vec4 oId;
float ign(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float h3(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float spot(vec4 s,float grain){return s.w<=0.?0.:1.-smoothstep(s.w*.5,s.w,length(vM-s.xyz)+grain*s.w*.42);}
void main(){
  vec3 V=vec3(uCam.y*uCam.w,uCam.x*uCam.w,uCam.z);
  vec3 N=normalize(vN);
  bool inside=!gl_FrontFacing;
  if(inside)N=-N;
  float ndv=max(dot(N,V),0.);
  if(uGlass.w>.5){
    float fr=pow(1.-ndv,uGlass.z);
    float a=clamp(uGlass.x+uGlass.y*fr,0.,1.)*uState.x;
    vec3 c=uColor*(.82+.18*N.z)+fr*.18;
    oColor=vec4(c*a,a);
    oId=vec4(0.);
    return;
  }
  float alpha=uState.x;
  float t=clamp((vDepth-uDepth.x)*uDepth.y,0.,1.)*255.;
  if(uLens.x>0.&&uState.y<.5&&uKeep<.5){
    // Cutaway: whatever lies in front of the selected structure, or of a margin around its
    // outline, is removed. Its depth was drawn first into uSelTex.
    vec2 uv=gl_FragCoord.xy*uPx;
    float mine=t/255.-.0005;
    float open=0.;
    vec4 c=texture(uSelTex,uv);
    open=max(open,c.b*step(c.r+c.g/255.,mine));
    for(int k=0;k<8;k++){
      float a=float(k)*.7853982;
      vec2 d=vec2(cos(a),sin(a))*uPx*uLens.y;
      c=texture(uSelTex,uv+d);
      open=max(open,c.b*step(c.r+c.g/255.,mine));
      c=texture(uSelTex,uv+d*.5);
      open=max(open,c.b*step(c.r+c.g/255.,mine));
    }
    alpha*=1.-open*uLens.x;
  }
  // Half-shown structures are blended in their own pass; the solid pass only ever cuts whole pixels.
  if(uBlend>.5){if(alpha<.004)discard;}
  else if(alpha<=ign(gl_FragCoord.xy)*.999+.0005)discard;
  if(uPre>.5){oColor=vec4(floor(t)/255.,fract(t),1.,1.);oId=vec4(0.);return;}

  float grain=n3(vM*.09+vec3(0.,0.,uTime*.12))-.5;
  vec3 base=uColor;
  base=mix(base,uTint.rgb,uTint.a);
  base=mix(base,uSpotColA.rgb,spot(uSpotA,grain)*uSpotColA.a);
  base=mix(base,uSpotColB.rgb,spot(uSpotB,grain)*uSpotColB.a);
  float under=(1.-smoothstep(uLevel.x-3.,uLevel.x+3.,vM.z+grain*3.))*uLevel.y;
  base=mix(base,uLevelCol.rgb,under*uLevelCol.a);
  float cut=uCut.y*smoothstep(uCut.x-2.,uCut.x+2.,vA.y)*((uCut.z<0.||abs(vA.z-uCut.z)<.5)?1.:0.);
  base=mix(base,base*vec3(.34,.30,.44)+vec3(.03,.02,.06),cut*.85);

  vec3 side=vec3(-uCam.x,uCam.y,0.);
  vec3 L=normalize(side*.55+vec3(0.,0.,.75)+V*.45);
  float ao=mix(1.,vA.x,.92);
  float wrap=clamp((dot(N,L)+uMat.x)/(1.+uMat.x),0.,1.);
  float hemi=.5+.5*N.z;
  vec3 col=base*(uTheme.x*mix(.7,1.,hemi)+uTheme.y*wrap);
  col+=base*vec3(.9,.3,.24)*uMat.x*.1*(1.-wrap);
  col*=mix(.5,1.,ao);
  vec3 H=normalize(L+V);
  float fr=pow(1.-ndv,3.);
  col+=pow(max(dot(N,H),0.),uMat.z)*uMat.y*ao;
  col+=fr*uMat.w*uTheme.z*mix(base,vec3(1.),.5)*ao;
  if(inside)col*=vec3(.56,.42,.44);

  if(uFlow.z>0.){
    float ph=fract((vA.y-uFlow.x*uTime)/uFlow.y);
    float streak=smoothstep(0.,.3,ph)*(1.-smoothstep(.3,.62,ph));
    col+=mix(base,vec3(1.),.35)*streak*uFlow.z*(1.-cut);
  }
  col+=mix(base,vec3(1.),.3)*vA.w*uFlow.w*(1.-cut);
  col+=under*uLevelCol.a*.12*(.5+.5*sin(vM.x*.2+uTime*2.));

  if(uState.y>.5){
    col+=uAccent*(.02+.025*sin(uTime*3.2))+fr*uAccent*.3;
  }
  float luma=dot(col,vec3(.3,.59,.11));
  col=mix(col,mix(vec3(luma),vec3(uTheme.w>.5?.2:.84),.45),uState.z);

  if(uBlend>.5){oColor=vec4(col*alpha,alpha);oId=vec4(0.);return;}
  oColor=vec4(col,1.);
  oId=vec4((uState.w+.5)/255.,(vA.z+.5)/255.,floor(t)/255.,fract(t));
}`;

  const PVS = `#version 300 es
layout(location=0) in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const PFS = `#version 300 es
precision highp float;
uniform sampler2D uColorTex,uIdTex;
uniform vec2 uPx;
uniform vec4 uInk;
uniform vec3 uAccent;
uniform vec2 uSel;
uniform float uLine;
out vec4 o;
void main(){
  vec2 uv=gl_FragCoord.xy*uPx;
  vec4 c=texture(uColorTex,uv);
  vec4 i0=texture(uIdTex,uv);
  float z0=i0.b+i0.a/255.;
  float s0=step(abs(i0.r-uSel.x),.4/255.)*uSel.y;
  float eId=0.,eZ=0.,eP=0.,eS=0.;
  for(int k=0;k<8;k++){
    float a=float(k)*.7853982;
    vec2 d=vec2(cos(a),sin(a))*uPx;
    vec4 i=texture(uIdTex,uv+d*uLine);
    float dId=step(.4/255.,abs(i.r-i0.r));
    eId=max(eId,dId);
    eP=max(eP,step(.4/255.,abs(i.g-i0.g))*(1.-dId));
    eZ=max(eZ,smoothstep(.006,.013,abs(i.b+i.a/255.-z0))*(1.-dId)*step(.5/255.,i0.r));
    vec4 j=texture(uIdTex,uv+d*uLine*2.2);
    eS=max(eS,abs(step(abs(j.r-uSel.x),.4/255.)*uSel.y-s0));
  }
  float ink=max(eId,max(eZ*.8,eP*.38))*uInk.a;
  vec3 rgb=c.rgb*(1.-ink)+uInk.rgb*ink;
  float al=c.a*(1.-ink)+ink;
  rgb=rgb*(1.-eS)+uAccent*eS;
  al=al*(1.-eS)+eS;
  o=vec4(rgb,al);
}`;

  // ── structure state ──────────────────────────────────────────────────────
  const FX = { tint: 3, spotA: 3, spotColA: 3, spotB: 3, spotColB: 3, level: 1, levelCol: 3, cut: 1, swell: -1, flow: -1, wave: -1 };
  const ZERO = () => new Float32Array(4);
  function makeState(meta, index) {
    const info = D.structs[meta.id];
    const s = {
      id: meta.id, index, meta, layer: meta.layer, kind: meta.kind, info,
      color: new Float32Array(info.color), mat: new Float32Array(D.mats[info.mat]),
      alpha: 0, show: 0, hiddenBy: 0, dim: 0, dimTo: 0,
      mode: 0, ride: false, shift: new Float32Array(3), explode: new Float32Array(3), pivot: new Float32Array([0, 0, 0, 1]),
      la: ZERO(), lb: ZERO(),
      fx: {}, to: {}, vao: null, count: meta.i[1], offset: 0,
    };
    for (const key of Object.keys(FX)) { s.fx[key] = ZERO(); s.to[key] = ZERO(); }
    s.fx.cut[2] = s.to.cut[2] = -1;
    return s;
  }

  M.structs.forEach((meta, index) => {
    const s = makeState(meta, index + 1);
    S[meta.id] = s;
    LIST.push(s);
  });

  // ── mesh ─────────────────────────────────────────────────────────────────
  // Each structure is stored as byte planes of zigzag deltas (see tools/build_model.py).
  function decode(bytes) {
    const zig = (v) => (v >>> 1) ^ -(v & 1);
    const vertexBytes = new Uint8Array(M.vertices * 12);
    const indexData = new Uint16Array(M.triangles * 3);
    const view = new DataView(vertexBytes.buffer);
    let at = 0, vBase = 0, iBase = 0;
    for (const s of LIST) {
      const nv = s.meta.v[1], ni = s.meta.i[1];
      for (let f = 0; f < 4; f++) {
        let prev = 0;
        const lo = at + f * 2 * nv, hi = lo + nv;
        for (let i = 0; i < nv; i++) {
          prev = (prev + zig(bytes[lo + i] | (bytes[hi + i] << 8))) & 65535;
          view.setUint16((vBase + i) * 12 + f * 2, prev, true);
        }
      }
      for (let f = 0; f < 3; f++) {
        let prev = 0;
        const from = at + 8 * nv + f * nv;
        for (let i = 0; i < nv; i++) {
          prev = (prev + zig(bytes[from + i])) & 255;
          vertexBytes[(vBase + i) * 12 + 8 + f] = prev;
        }
      }
      for (let i = 0; i < nv; i++) vertexBytes[(vBase + i) * 12 + 11] = bytes[at + 11 * nv + i];
      at += 12 * nv;
      let next = 0;
      for (let i = 0; i < ni; i++) {
        const code = bytes[at + i] | (bytes[at + ni + i] << 8);
        indexData[iBase + i] = code === 0 ? next++ : next - code;
      }
      at += 2 * ni;
      s.vBase = vBase;
      s.offset = iBase * 2;
      vBase += nv;
      iBase += ni;
    }
    return { vertexBytes, indexData };
  }

  function compile(vs, fs) {
    const make = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "shader");
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, make(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, make(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "link");
    const where = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(program, i).name.replace(/\[0\]$/, "");
      where[name] = gl.getUniformLocation(program, name);
    }
    return { program, where };
  }

  function init(el) {
    canvas = el;
    try {
      gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
      if (!gl) throw new Error("WebGL2 no disponible");
      main = compile(VS, FS);
      post = compile(PVS, PFS);
      Object.assign(U, main.where);
      Object.assign(UP, post.where);
      quad = gl.createVertexArray();
      gl.bindVertexArray(quad);
      const qb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, qb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); ready = false; });
      canvas.addEventListener("webglcontextrestored", () => location.reload());
    } catch (error) {
      failed = String(error.message || error);
      gl = null;
    }
    return !!gl;
  }

  async function load(onProgress = () => {}) {
    if (!gl) throw new Error(failed || "WebGL2 no disponible");
    const response = await fetch(D.bodyUrl);
    if (!response.ok) throw new Error(`No se pudo descargar el modelo (${response.status})`);
    const total = Number(response.headers.get("content-length")) || D.bodyGz;
    const reader = response.body.getReader();
    const parts = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      got += value.length;
      onProgress(Math.min(0.96, got / total));
    }
    const packed = new Blob(parts);
    // A server may already have unpacked it (Content-Encoding); the first two bytes tell.
    const head = new Uint8Array(await packed.slice(0, 2).arrayBuffer());
    const gz = head[0] === 0x1f && head[1] === 0x8b;
    const raw = gz ? await new Response(packed.stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer() : await packed.arrayBuffer();
    if (raw.byteLength !== M.bytes) throw new Error("El modelo llegó incompleto");
    const { vertexBytes, indexData } = decode(new Uint8Array(raw));
    cpu = new DataView(vertexBytes.buffer);
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertexBytes, gl.STATIC_DRAW);
    indexBuffer = gl.createBuffer();
    for (const s of LIST) {
      s.vao = gl.createVertexArray();
      gl.bindVertexArray(s.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      const base = s.vBase * 12;
      for (let i = 0; i < 5; i++) gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(0, 3, gl.UNSIGNED_SHORT, true, 12, base);
      gl.vertexAttribPointer(1, 1, gl.UNSIGNED_SHORT, false, 12, base + 6);
      gl.vertexAttribPointer(2, 2, gl.BYTE, true, 12, base + 8);
      gl.vertexAttribPointer(3, 1, gl.UNSIGNED_BYTE, true, 12, base + 10);
      gl.vertexAttribPointer(4, 1, gl.UNSIGNED_BYTE, false, 12, base + 11);
    }
    gl.bindVertexArray(LIST[0].vao);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    ready = true;
    onProgress(1);
  }

  // ── view ─────────────────────────────────────────────────────────────────
  const view = {
    turn: -0.42, turnTo: -0.42, spin: 0,
    zoom: 1, zoomTo: 1,
    focus: CAM.home.slice(), focusTo: CAM.home.slice(),
    pan: [0, 0], panTo: [0, 0],
    inset: { top: 0, right: 0, bottom: 0, left: 0 }, insetNow: { top: 0, right: 0, bottom: 0, left: 0 },
    width: 1, height: 1, ratio: 1, scale: 1, tx: 0, ty: 0,
  };
  const TURN0 = Math.PI / 2 + Math.atan2(CAM.cam[0], CAM.cam[1]);
  const turned = ([x, y, z], angle = view.turn) => {
    const c = Math.cos(TURN0 + angle), s = Math.sin(TURN0 + angle);
    return [-x * c - y * s, -x * s + y * c, z];
  };
  const toBox = ([x, y, z]) => {
    const [sa, ca, se, ce] = CAM.cam;
    return [CAM.origin[0] + CAM.k * (x * sa - y * ca), CAM.origin[1] + CAM.k * ((x * ca + y * sa) * se - z * ce)];
  };
  const depthOf = ([x, y, z]) => (x * CAM.cam[1] + y * CAM.cam[0]) * CAM.cam[3] + z * CAM.cam[2];
  /** Model point → CSS pixels inside the canvas. */
  const toScreen = (point) => {
    const b = toBox(turned(point));
    return [b[0] * view.scale + view.tx, b[1] * view.scale + view.ty];
  };
  function place(dt) {
    const k = 1 - Math.exp(-dt / 0.16);
    view.zoom += (view.zoomTo - view.zoom) * k;
    for (let i = 0; i < 3; i++) view.focus[i] += (view.focusTo[i] - view.focus[i]) * k;
    for (let i = 0; i < 2; i++) view.pan[i] += (view.panTo[i] - view.pan[i]) * k;
    for (const side of ["top", "right", "bottom", "left"]) view.insetNow[side] += (view.inset[side] - view.insetNow[side]) * k;
    const free = { w: Math.max(80, view.width - view.insetNow.left - view.insetNow.right), h: Math.max(80, view.height - view.insetNow.top - view.insetNow.bottom) };
    const fit = Math.min(free.h / CAM.fitH, free.w / CAM.fitW);
    view.scale = fit * view.zoom;
    const f = toBox(turned(view.focus));
    view.tx = view.insetNow.left + free.w / 2 - f[0] * view.scale + view.pan[0];
    view.ty = view.insetNow.top + free.h / 2 - f[1] * view.scale + view.pan[1];
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    let ratio = Math.min(3, Math.max(dpr, 1.5));
    const budget = 2.3e6;
    if (box.width * box.height * ratio * ratio > budget) ratio = Math.sqrt(budget / (box.width * box.height));
    const w = Math.max(2, Math.round(box.width * ratio)), h = Math.max(2, Math.round(box.height * ratio));
    view.width = box.width;
    view.height = box.height;
    view.ratio = w / Math.max(1, box.width);
    if (canvas.width === w && canvas.height === h && target) return;
    canvas.width = w;
    canvas.height = h;
    if (!gl) return;
    if (target) {
      gl.deleteFramebuffer(target.fbo);
      gl.deleteTexture(target.color);
      gl.deleteTexture(target.id);
      gl.deleteTexture(target.sel);
      gl.deleteFramebuffer(target.selFbo);
      gl.deleteRenderbuffer(target.depth);
    }
    const tex = () => {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    target = { fbo: gl.createFramebuffer(), color: tex(), id: tex(), depth: gl.createRenderbuffer(), sel: tex(), selFbo: gl.createFramebuffer(), w, h };
    gl.bindRenderbuffer(gl.RENDERBUFFER, target.depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.color, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, target.id, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.depth);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.selFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.sel, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.depth);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // ── frame ────────────────────────────────────────────────────────────────
  const look = { selected: null, lens: 0, lensTo: 0, lensAt: [0, 0, 0], lensR: 60, glass: 1, glassTo: 1, explode: 0, explodeTo: 0, dark: false, accent: [1, 0.72, 0.2], ink: [0.1, 0.1, 0.11, 0.62] };
  const heart = { base: [0, 0, 0], axis: [0, 0, -1], length: 100, sys: 0, atr: 0, twist: 0.22, quiver: 0 };
  const beats = { age: new Float32Array([99, 99, 99, 99]), q: new Float32Array(4) };

  function ease(dt) {
    const k = 1 - Math.exp(-dt / 0.22);
    const slow = 1 - Math.exp(-dt / 0.5);
    look.lens += (look.lensTo - look.lens) * k;
    look.glass += (look.glassTo - look.glass) * k;
    look.explode += (look.explodeTo - look.explode) * k;
    for (const s of LIST) {
      s.alpha += ((s.hiddenBy ? 0 : s.show) - s.alpha) * k;
      s.dim += (s.dimTo - s.dim) * k;
      for (const key in FX) {
        const now = s.fx[key], to = s.to[key], gate = FX[key];
        if (gate >= 0 && now[gate] < 0.01) { for (let i = 0; i < 4; i++) if (i !== gate) now[i] = to[i]; }
        for (let i = 0; i < 4; i++) now[i] += (to[i] - now[i]) * (gate === i ? slow : k);
      }
      if (s.fx.cut[1] < 0.01) s.fx.cut[2] = s.to.cut[2];
    }
  }

  function setCommon(time) {
    gl.uniform3fv(U.uLo, M.lo);
    gl.uniform3fv(U.uSize, M.size);
    gl.uniform2f(U.uTurn, Math.cos(TURN0 + view.turn), Math.sin(TURN0 + view.turn));
    gl.uniform4fv(U.uCam, CAM.cam);
    gl.uniform3f(U.uOK, CAM.origin[0], CAM.origin[1], CAM.k);
    const sx = (2 * view.scale) / view.width, sy = (-2 * view.scale) / view.height;
    gl.uniform4f(U.uView, sx, sy, (2 * view.tx) / view.width - 1, 1 - (2 * view.ty) / view.height);
    gl.uniform2f(U.uDepth, DEPTH[0], 1 / (DEPTH[1] - DEPTH[0]));
    gl.uniform1f(U.uTime, time);
    gl.uniform4f(U.uTheme, look.dark ? 0.6 : 0.64, look.dark ? 0.62 : 0.54, look.dark ? 0.5 : 0.3, look.dark ? 1 : 0);
    gl.uniform3fv(U.uAccent, look.accent);
    gl.uniform4f(U.uHA, heart.base[0], heart.base[1], heart.base[2], heart.length);
    gl.uniform4fv(U.uBeats, beats.age);
    gl.uniform4fv(U.uBeatQ, beats.q);
    gl.uniform2f(U.uPx, 1 / target.w, 1 / target.h);
    gl.uniform1i(U.uSelTex, 2);
    gl.uniform1f(U.uPre, 0);
    gl.uniform4f(U.uLens, 0, 0, 0, 0);
  }

  function drawOne(s) {
    const e = look.explode;
    gl.uniform3fv(U.uColor, s.color);
    gl.uniform4fv(U.uMat, s.mat);
    gl.uniform4f(U.uState, s.alpha, look.selected === s.id ? 1 : 0, s.dim, s.index);
    // What rides on the selected structure (the coronaries on the heart) is never cut away from it.
    gl.uniform1f(U.uKeep, look.selected && s.ride && S[look.selected].ride ? 1 : 0);
    gl.uniform1i(U.uMode, s.mode);
    gl.uniform3f(U.uShift, s.shift[0] + s.explode[0] * e, s.shift[1] + s.explode[1] * e, s.shift[2] + s.explode[2] * e);
    gl.uniform4fv(U.uPivot, s.pivot);
    const on = s.ride ? 1 : 0;
    gl.uniform4f(U.uHB, heart.axis[0], heart.axis[1], heart.axis[2], heart.sys);
    gl.uniform4f(U.uHC, heart.atr, heart.twist, heart.quiver, on);
    gl.uniform4fv(U.uLA, s.la);
    gl.uniform4fv(U.uLB, s.lb);
    gl.uniform4fv(U.uWave, s.fx.wave);
    gl.uniform4fv(U.uFlow, s.fx.flow);
    gl.uniform4fv(U.uCut, s.fx.cut);
    gl.uniform4fv(U.uSwell, s.fx.swell);
    gl.uniform4fv(U.uTint, s.fx.tint);
    gl.uniform4fv(U.uSpotA, s.fx.spotA);
    gl.uniform4fv(U.uSpotColA, s.fx.spotColA);
    gl.uniform4fv(U.uSpotB, s.fx.spotB);
    gl.uniform4fv(U.uSpotColB, s.fx.spotColB);
    gl.uniform4fv(U.uLevel, s.fx.level);
    gl.uniform4fv(U.uLevelCol, s.fx.levelCol);
    gl.bindVertexArray(s.vao);
    gl.drawElements(gl.TRIANGLES, s.count, gl.UNSIGNED_SHORT, s.offset);
  }

  let drawn = 0;
  function render(time, dt) {
    if (!gl) return;
    resize();
    place(dt);
    ease(dt);
    if (!ready || !target) return;
    gl.viewport(0, 0, target.w, target.h);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.colorMask(true, true, true, true);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(main.program);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    setCommon(time);
    gl.uniform4f(U.uGlass, 0, 0, 1, 0);
    // The selected structure's depth first: the cutaway is cut against it.
    const cut = look.selected && S[look.selected];
    const cutting = cut && look.lens > 0.01 && cut.alpha > 0.5 && cut.id !== "piel";
    if (cutting) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.selFbo);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(U.uPre, 1);
      drawOne(cut);
      gl.uniform1f(U.uPre, 0);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (cutting) {
      gl.bindTexture(gl.TEXTURE_2D, target.sel);
      gl.uniform4f(U.uLens, look.lens, 13 * view.ratio, 0, 0);
    }
    drawn = 0;
    const skin = S.piel;
    const glass = look.glass > 0.02;
    const soft = [];
    gl.uniform1f(U.uBlend, 0);
    for (const s of LIST) {
      if (s.alpha < 0.004 || (s === skin && glass)) continue;
      if (s.alpha < 0.985) { soft.push(s); continue; }
      drawOne(s);
      drawn++;
    }
    if (soft.length) {
      // Translucent structures: depth first, so only their nearest surface blends over what is solid.
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
      gl.uniform1f(U.uBlend, 1);
      gl.colorMask(false, false, false, false);
      for (const s of soft) drawOne(s);
      gl.colorMask(true, true, true, true);
      gl.depthMask(false);
      gl.depthFunc(gl.EQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      for (const s of soft) drawOne(s);
      gl.disable(gl.BLEND);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.uniform1f(U.uBlend, 0);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      drawn += soft.length;
    }
    if (skin.alpha > 0.004 && glass) {
      // Glass shell: depth first so only its nearest surface blends over the body.
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
      gl.uniform4f(U.uLens, 0, 0, 0, 0);
      gl.uniform4f(U.uGlass, look.dark ? 0.035 : 0.05, look.dark ? 0.5 : 0.42, 2.2, 1);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      gl.colorMask(false, false, false, false);
      drawOne(skin);
      gl.colorMask(true, true, true, true);
      gl.depthMask(false);
      gl.depthFunc(gl.EQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      drawOne(skin);
      gl.disable(gl.BLEND);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.CULL_FACE);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(post.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.color);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, target.id);
    gl.uniform1i(UP.uColorTex, 0);
    gl.uniform1i(UP.uIdTex, 1);
    gl.uniform2f(UP.uPx, 1 / target.w, 1 / target.h);
    gl.uniform4fv(UP.uInk, look.ink);
    gl.uniform3fv(UP.uAccent, look.accent);
    const sel = look.selected && S[look.selected];
    gl.uniform2f(UP.uSel, sel ? (sel.index + 0.5) / 255 : 0, sel ? 1 : 0);
    gl.uniform1f(UP.uLine, Math.max(1, view.ratio * 0.55));
    gl.bindVertexArray(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  /** The structure under a point in CSS pixels: the commonest id in a small disc around it. */
  function pick(x, y, reach = 7) {
    if (!ready || !target) return null;
    const r = Math.max(1, Math.round(reach * view.ratio));
    const cx = Math.round(x * view.ratio), cy = Math.round((view.height - y) * view.ratio);
    const x0 = Math.max(0, cx - r), y0 = Math.max(0, cy - r);
    const w = Math.min(target.w - x0, 2 * r + 1), h = Math.min(target.h - y0, 2 * r + 1);
    if (w <= 0 || h <= 0) return null;
    const px = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const votes = new Map();
    let best = null;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const id = px[(j * w + i) * 4];
        if (!id) continue;
        const d2 = (i + x0 - cx) ** 2 + (j + y0 - cy) ** 2;
        if (d2 > r * r) continue;
        const key = id * 256 + px[(j * w + i) * 4 + 1];
        const score = (votes.get(key) || 0) + 1 / (1 + d2 / (r * r * 0.25));
        votes.set(key, score);
        if (!best || score > best.score) best = { key, score };
      }
    }
    if (!best) return null;
    const s = LIST[(best.key >> 8) - 1];
    return s ? { id: s.id, part: best.key & 255 } : null;
  }

  /** The middle of a structure's cross-section at a fraction of its flow range (0 = where flow enters). */
  function along(id, fraction, part = -1) {
    const s = S[id];
    if (!cpu || !s) return s ? s.meta.c : [0, 0, 1000];
    // With a part, the fraction runs along that part alone.
    const [lo, hi] = part >= 0 ? s.meta.parts[part].flow : s.meta.flow;
    const want = (lo + (hi - lo) * fraction) * 8;
    let reach = Math.max(24, (hi - lo) * 8 * 0.02);
    for (let attempt = 0; attempt < 6; attempt++, reach *= 2.2) {
      let n = 0, x = 0, y = 0, z = 0;
      for (let i = 0; i < s.meta.v[1]; i++) {
        const at = (s.vBase + i) * 12;
        if (Math.abs(cpu.getUint16(at + 6, true) - want) > reach || (part >= 0 && cpu.getUint8(at + 11) !== part)) continue;
        x += cpu.getUint16(at, true); y += cpu.getUint16(at + 2, true); z += cpu.getUint16(at + 4, true);
        n++;
      }
      if (n > 2) return [M.lo[0] + (x / n / 65535) * M.size[0], M.lo[1] + (y / n / 65535) * M.size[1], M.lo[2] + (z / n / 65535) * M.size[2]];
    }
    return s.meta.c;
  }

  /** Run the easing to rest at once (tests and reduced motion). */
  function settle() { for (let i = 0; i < 80; i++) { place(0.05); ease(0.05); } }

  return {
    S, LIST, view, look, heart, beats, settle, init, load, render, pick, toScreen, turned, depthOf, toBox, along,
    get ready() { return ready; }, get failed() { return failed; }, get drawn() { return drawn; }, get gl() { return gl; },
  };
})();
