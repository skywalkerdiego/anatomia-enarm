// ── Body: the Blender-built model in a physically based studio ──
// Perspective camera on a turntable; a shadow pass from the key light; an opaque pass that writes
// HDR colour plus normals, ids and depth; screen-space ambient occlusion; translucent structures
// and the glass skin blended over it; bloom; filmic tone mapping, grading and FXAA to the canvas.
const Body = (() => {
  const M = D.body;
  const S = {};
  const LIST = [];
  const FOV = (30 * Math.PI) / 180;
  let gl = null, canvas = null, ready = false, failed = "", cpu = null, hdrOK = false;
  const P = {}; // programs
  const T = {}; // targets
  let vertexBuffer = null, indexBuffer = null, quad = null, stand = [];
  const quality = { scale: 1, ssao: true, shadows: true, bloom: true, frameMs: 16 };
  const THIN = /^(art|ven)-(cerebrales|cabeza|brazo|pierna|tronco|visceral|gonadales)$|^vasos-gonadales$|^ganglios$/;

  // ── shaders ──────────────────────────────────────────────────────────────
  const COMMON = `
uniform mat4 uViewProj;
uniform mat4 uView;
uniform vec3 uEye;
uniform vec2 uTurn;
uniform vec2 uNearFar;
float hash13(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float vnoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x),mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x),mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x),f.y),f.z);}
vec3 octDecode(vec2 e){vec3 n=vec3(e,1.-abs(e.x)-abs(e.y));float t=max(-n.z,0.);n.xy+=mix(vec2(t),vec2(-t),step(0.,n.xy));return normalize(n);}
`;

  const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in float aFlow;
layout(location=2) in vec2 aOct;
layout(location=3) in float aAO;
layout(location=4) in float aPart;
layout(location=5) in vec2 aFib;
layout(location=6) in float aThick;
layout(location=7) in float aAxial;
${COMMON}
uniform mat4 uShadowMat;
uniform vec3 uLo,uSize;
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
uniform float uSpin;
out vec3 vW;out vec3 vN;out vec3 vM;out vec4 vA;out vec3 vF;out vec2 vT;out vec4 vS;out float vZ;
float pulseAt(float age){float a=max(age,0.)/.085;return a*exp(1.-a);}
float band(float x,float a,float b,float soft){return smoothstep(a-soft,a+soft,x)*(1.-smoothstep(b-soft,b+soft,x));}
void main(){
  vec3 p=uLo+aPos*uSize;
  vec3 n=octDecode(aOct);
  vec3 fib=length(aFib)>.01?octDecode(aFib):vec3(0.,0.,1.);
  float flow=aFlow/8.;
  float wave=0.;
  if(uHC.w>.5){
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
    vec3 q=p-uPivot.xyz;
    float low=1.-smoothstep(uLB.x,uLB.y,p.z);
    float k=1.+.055*uLA.x*(1.-uLA.y)-.5*uLA.y;
    p=uPivot.xyz+q*vec3(k,k,1.+(k-1.)*.6);
    p.z-=uLA.z*uLA.x*low*(1.-uLA.y);
  }else if(uMode==4){
    p.z-=uLA.x*smoothstep(uLB.x,uLB.y,p.z);
  }else if(uMode==3){
    float open=1.-uCut.y*smoothstep(uCut.x-2.,uCut.x+2.,flow)*((uCut.z<0.||abs(aPart-uCut.z)<.5)?1.:0.);
    if(uWave.w<.5){
      vec4 age=uBeats-flow/max(uWave.x,1.);
      wave=dot(uBeatQ,vec4(pulseAt(age.x),pulseAt(age.y),pulseAt(age.z),pulseAt(age.w)))*open;
    }else if(uWave.w<1.5){
      float ph=fract((flow-uWave.x*uTime)/uWave.y);
      wave=band(ph,.06,.22,.06)-.9*band(ph,.3,.44,.06);
    }else{
      // Nerve impulses: short bright packets running outwards.
      float ph=fract((flow-uWave.x*uTime)/uWave.y);
      wave=exp(-pow((ph-.5)*9.,2.));
    }
    p+=n*uWave.z*wave;
  }else if(uMode==6){
    // The skin follows the breath over the chest and the belly.
    float chest=smoothstep(960.,1080.,p.z)*(1.-smoothstep(1330.,1420.,p.z));
    float front=smoothstep(40.,-80.,p.y);
    p+=n*uLA.x*7.*chest*(.35+.65*front);
  }
  p+=n*(uSwell.x+uSwell.w*band(flow,uSwell.y,uSwell.z,6.));
  p=uPivot.xyz+(p-uPivot.xyz)*(uMode==2?1.:uPivot.w)+uShift;
  vM=p;
  vec3 w=vec3(p.x*uTurn.x-p.y*uTurn.y,p.x*uTurn.y+p.y*uTurn.x,p.z);
  vN=vec3(n.x*uTurn.x-n.y*uTurn.y,n.x*uTurn.y+n.y*uTurn.x,n.z);
  vF=vec3(fib.x*uTurn.x-fib.y*uTurn.y,fib.x*uTurn.y+fib.y*uTurn.x,fib.z);
  vW=w;
  vA=vec4(aAO,flow,aPart,wave);
  vT=vec2(aThick,aAxial);
  vS=uShadowMat*vec4(w,1.);
  vec4 view=uView*vec4(w,1.);
  vZ=-view.z;
  gl_Position=uViewProj*vec4(w,1.);
}`;

  const FS = `#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vW;in vec3 vN;in vec3 vM;in vec4 vA;in vec3 vF;in vec2 vT;in vec4 vS;in float vZ;
${COMMON}
uniform float uTime;
uniform vec3 uAlbedo;
uniform vec4 uMat;      // roughness, metallic, clearcoat, subsurface
uniform vec4 uMat2;     // micro detail kind, micro strength, emissive, translucency
uniform vec3 uSSS;
uniform vec4 uState;    // alpha, selected, dim, id
uniform vec4 uLens;     // cut strength, margin px
uniform vec4 uTint;
uniform vec4 uSpotA,uSpotColA,uSpotB,uSpotColB;
uniform vec4 uLevel,uLevelCol;
uniform vec4 uCut;
uniform vec4 uFlow;
uniform vec3 uAccent;
uniform vec4 uGlass;
uniform vec4 uTheme;    // dark, exposure-ish, floor radius, fade
uniform sampler2D uSelTex;
uniform sampler2DShadow uShadow;
uniform vec2 uPx;
uniform float uPre,uKeep,uBlend,uShadowOn;
uniform vec3 uSH[9];
uniform vec3 uKeyDir,uKeyCol,uFillDir,uFillCol,uRimDir,uRimCol;
uniform vec3 uBox0,uBox1,uBox2;
uniform vec3 uBoxC0,uBoxC1,uBoxC2;
uniform vec3 uEnvLo,uEnvHi;
uniform vec3 uBgA,uBgB;
layout(location=0) out vec4 oColor;
layout(location=1) out vec4 oInfo;
const float PI=3.14159265;
vec3 irradiance(vec3 n){
  return uSH[0]*.886227+uSH[1]*1.023328*n.y+uSH[2]*1.023328*n.z+uSH[3]*1.023328*n.x
   +uSH[4]*.858086*n.x*n.y+uSH[5]*.858086*n.y*n.z+uSH[6]*.247708*(3.*n.z*n.z-1.)
   +uSH[7]*.858086*n.x*n.z+uSH[8]*.429043*(n.x*n.x-n.y*n.y);
}
vec3 env(vec3 d,float r){
  float k=mix(1.,.06,r);
  vec3 c=mix(uEnvLo,uEnvHi,smoothstep(-.35,.85,d.z));
  c+=uBoxC0*exp((dot(d,uBox0)-1.)*90.*k)*mix(1.,.25,r);
  c+=uBoxC1*exp((dot(d,uBox1)-1.)*70.*k)*mix(1.,.25,r);
  c+=uBoxC2*exp((dot(d,uBox2)-1.)*40.*k)*mix(1.,.3,r);
  return c;
}
float D_GGX(float nh,float a){float a2=a*a;float d=nh*nh*(a2-1.)+1.;return a2/(PI*d*d);}
float V_SmithGGX(float nv,float nl,float a){float k=a*.5;return .25/((nv*(1.-k)+k)*(nl*(1.-k)+k));}
vec3 F_Schlick(vec3 f0,float vh){return f0+(1.-f0)*pow(1.-vh,5.);}
float ign(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float spot(vec4 s,float grain){return s.w<=0.?0.:1.-smoothstep(s.w*.5,s.w,length(vM-s.xyz)+grain*s.w*.42);}
vec3 backdrop(vec3 d){
  float up=d.z;
  vec3 c=mix(uBgB,uBgA,smoothstep(-.3,.6,up));
  return c;
}
float shadowAt(vec3 n,vec3 l){
  if(uShadowOn<.5)return 1.;
  vec3 s=vS.xyz/vS.w*.5+.5;
  if(s.x<0.||s.x>1.||s.y<0.||s.y>1.||s.z>1.)return 1.;
  float bias=.0006+.0018*(1.-max(dot(n,l),0.));
  vec2 t=vec2(1./2048.);
  float sum=0.;
  for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)sum+=texture(uShadow,vec3(s.xy+vec2(float(i),float(j))*t*1.5,s.z-bias));
  return sum/9.;
}
vec3 micro(vec3 N,vec3 F,float kind,float amp){
  if(kind<.5||amp<=0.)return N;
  vec3 p=vM;
  float f;vec3 q;
  if(kind<1.5){q=p*.55;f=1.;}               // bone: pores
  else if(kind<2.5){q=p*.32;f=1.;}          // wet tissue
  else if(kind<3.5){                        // muscle: fibres along F
    vec3 fm=normalize(vec3(F.x*uTurn.x+F.y*uTurn.y,-F.x*uTurn.y+F.y*uTurn.x,F.z));
    q=(p-fm*dot(p,fm)*.92)*1.1;f=1.;
  }else if(kind<4.5){q=p*.22;f=1.;}         // vessel
  else if(kind<5.5){q=p*.18;f=1.;}          // brain
  else{q=p*.9;f=1.;}                        // skin
  float e=.35;
  float n0=vnoise(q);
  vec3 g=vec3(vnoise(q+vec3(e,0,0))-n0,vnoise(q+vec3(0,e,0))-n0,vnoise(q+vec3(0,0,e))-n0)/e;
  g=vec3(g.x*uTurn.x-g.y*uTurn.y,g.x*uTurn.y+g.y*uTurn.x,g.z);
  return normalize(N-amp*f*(g-N*dot(g,N)));
}
void main(){
  vec3 V=normalize(uEye-vW);
  vec3 N=normalize(vN);
  bool inside=!gl_FrontFacing;
  if(inside)N=-N;
  float nv=max(dot(N,V),1e-4);
  float t=clamp((vZ-uNearFar.x)/(uNearFar.y-uNearFar.x),0.,1.)*255.;
  if(uGlass.w>.5){
    // The glass skin: a thin clear shell that reflects the studio.
    float fr=pow(1.-nv,uGlass.z);
    float a=clamp(uGlass.x+uGlass.y*fr,0.,1.)*uState.x;
    vec3 R=reflect(-V,N);
    vec3 c=uAlbedo*irradiance(N)*.55+env(R,.12)*(.04+.96*fr)*.9;
    oColor=vec4(c*a,a);
    oInfo=vec4(0.);
    return;
  }
  float alpha=uState.x;
  if(uLens.x>0.&&uState.y<.5&&uKeep<.5){
    vec2 uv=gl_FragCoord.xy*uPx;
    float mine=t/255.;
    float open=0.;
    vec4 c=texture(uSelTex,uv);
    open=max(open,c.b*step(c.r+c.g/255.,mine-.0015));
    for(int k=0;k<8;k++){
      float a=float(k)*.7853982;
      vec2 d=vec2(cos(a),sin(a))*uPx*uLens.y;
      c=texture(uSelTex,uv+d);
      open=max(open,c.b*step(c.r+c.g/255.,mine-.0015));
      c=texture(uSelTex,uv+d*.5);
      open=max(open,c.b*step(c.r+c.g/255.,mine-.0015));
    }
    alpha*=1.-open*uLens.x;
  }
  if(uBlend>.5){if(alpha<.004)discard;}
  else if(alpha<=ign(gl_FragCoord.xy)*.999+.0005)discard;
  if(uPre>.5){oColor=vec4(floor(t)/255.,fract(t),1.,1.);oInfo=vec4(0.);return;}

  // ── surface ──
  float grain=vnoise(vM*.09+vec3(0.,0.,uTime*.12))-.5;
  vec3 base=uAlbedo;
  float rough=uMat.x,metal=uMat.y,coat=uMat.z,sss=uMat.w;
  float kind=uMat2.x;
  if(kind>2.5&&kind<3.5){
    // Tendons at both ends of a muscle: white, smoother, finer fibres.
    float ten=smoothstep(.80,.95,abs(vT.y*2.-1.));
    base=mix(base,vec3(.80,.74,.62),ten);
    rough=mix(rough,.32,ten);
    sss=mix(sss,.15,ten);
  }
  if(uTheme.z>0.){
    // Floor: fades into the backdrop at its edge.
    float r=length(vW.xy);
    base*=1.-.25*smoothstep(0.,1.,r/uTheme.z);
  }
  base=mix(base,uTint.rgb,uTint.a);
  base=mix(base,uSpotColA.rgb,spot(uSpotA,grain)*uSpotColA.a);
  base=mix(base,uSpotColB.rgb,spot(uSpotB,grain)*uSpotColB.a);
  float under=(1.-smoothstep(uLevel.x-3.,uLevel.x+3.,vM.z+grain*3.))*uLevel.y;
  base=mix(base,uLevelCol.rgb,under*uLevelCol.a);
  float cut=uCut.y*smoothstep(uCut.x-2.,uCut.x+2.,vA.y)*((uCut.z<0.||abs(vA.z-uCut.z)<.5)?1.:0.);
  base=mix(base,base*vec3(.3,.26,.4)+vec3(.02,.01,.04),cut*.85);
  if(inside)base*=vec3(.55,.36,.36);
  N=micro(N,vF,kind,uMat2.y);
  nv=max(dot(N,V),1e-4);

  float ao=mix(1.,vA.x,.85);
  float a=max(rough*rough,.002);
  vec3 f0=mix(vec3(.035),base,metal);
  vec3 diffuseCol=base*(1.-metal);
  vec3 col=vec3(0.);
  vec3 Ls[3];vec3 Cs[3];
  Ls[0]=uKeyDir;Cs[0]=uKeyCol*shadowAt(N,uKeyDir);
  Ls[1]=uFillDir;Cs[1]=uFillCol;
  Ls[2]=uRimDir;Cs[2]=uRimCol;
  for(int i=0;i<3;i++){
    vec3 L=Ls[i];
    float nl=dot(N,L);
    float w=sss*.55;
    float wrap=max((nl+w)/(1.+w),0.);
    float lam=max(nl,0.);
    // Light bleeding through the terminator, tinted by the tissue.
    vec3 diff=diffuseCol*(lam+uSSS*(wrap-lam)*1.2)/PI*PI;
    vec3 H=normalize(L+V);
    float nh=max(dot(N,H),0.),vh=max(dot(V,H),0.);
    vec3 F=F_Schlick(f0,vh);
    vec3 spec=D_GGX(nh,a)*V_SmithGGX(nv,max(lam,1e-4),a)*F*lam;
    vec3 c=(diff*(1.-F)+spec);
    if(coat>0.){
      float ac=.09*.09;
      float Fc=.04+.96*pow(1.-vh,5.);
      c=c*(1.-Fc*coat)+vec3(D_GGX(nh,ac)*V_SmithGGX(nv,max(lam,1e-4),ac)*Fc*lam*coat);
    }
    // Thin parts glow when the light is behind them.
    float thin=exp(-vT.x*255./(6.+40.*uMat2.w));
    c+=uSSS*diffuseCol*thin*uMat2.w*pow(max(dot(V,-L),0.),3.)*1.6;
    col+=c*Cs[i];
  }
  vec3 R=reflect(-V,N);
  vec3 Fa=f0+(max(vec3(1.-rough),f0)-f0)*pow(1.-nv,5.);
  col+=diffuseCol*irradiance(N)*ao*(1.-Fa*.5);
  col+=env(R,rough)*Fa*ao*mix(.5,1.,ao);
  if(coat>0.)col+=env(R,.08)*(.04+.96*pow(1.-nv,5.))*coat*ao*.6;
  col*=mix(.55,1.,ao);

  if(uFlow.z>0.){
    float ph=fract((vA.y-uFlow.x*uTime)/uFlow.y);
    float streak=smoothstep(0.,.3,ph)*(1.-smoothstep(.3,.62,ph));
    col+=mix(base,vec3(1.),.4)*streak*uFlow.z*(1.-cut)*.9;
  }
  col+=mix(base,vec3(1.),.35)*vA.w*uFlow.w*(1.-cut)*1.3;
  col+=under*uLevelCol.a*.1*(.5+.5*sin(vM.x*.2+uTime*2.))*uLevelCol.rgb;
  col+=base*uMat2.z;
  if(uState.y>.5){
    float fr=pow(1.-nv,2.5);
    col+=uAccent*(.05+.04*sin(uTime*3.2))+fr*uAccent*1.1;
  }
  float luma=dot(col,vec3(.2126,.7152,.0722));
  col=mix(col,vec3(luma)*mix(1.,.6,uTheme.x),uState.z*.75);
  if(uTheme.z>0.){
    float r=length(vW.xy);
    col=mix(col,backdrop(-V),smoothstep(uTheme.z*.35,uTheme.z,r));
  }
  if(uBlend>.5){oColor=vec4(col*alpha,alpha);oInfo=vec4(0.);return;}
  oColor=vec4(col,1.);
  // Normal (octahedral), id and part, for occlusion and picking.
  vec3 n=N/(abs(N.x)+abs(N.y)+abs(N.z));
  vec2 o=n.z>=0.?n.xy:(1.-abs(n.yx))*vec2(n.x>=0.?1.:-1.,n.y>=0.?1.:-1.);
  oInfo=vec4(o*.5+.5,(uState.w+.5)/255.,(vA.z+.5)/255.);
}`;

  const SHADOW_FS = `#version 300 es
precision mediump float;
out vec4 o;void main(){o=vec4(1.);}`;

  const QUAD_VS = `#version 300 es
layout(location=0) in vec2 p;out vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

  const BG_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform mat4 uInvViewProj;
uniform vec3 uEye;
uniform vec3 uBgA,uBgB;
uniform vec4 uTheme;
out vec4 o;
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec4 far=uInvViewProj*vec4(vUv*2.-1.,1.,1.);
  vec3 d=normalize(far.xyz/far.w-uEye);
  vec3 c=mix(uBgB,uBgA,smoothstep(-.3,.6,d.z));
  // A soft pool of light behind the stand.
  c+=uBgA*.35*exp(-pow(length((vUv-vec2(.5,.62))*vec2(1.,1.4)),2.)*4.);
  o=vec4(c+(h(gl_FragCoord.xy)-.5)/255.,1.);
}`;

  const SSAO_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uDepth;
uniform sampler2D uInfo;
uniform mat4 uProj;
uniform mat4 uInvProj;
uniform mat4 uView;
uniform vec2 uRes;
uniform float uRadius;
out vec4 o;
vec3 viewPos(vec2 uv){
  float z=texture(uDepth,uv).r*2.-1.;
  vec4 p=uInvProj*vec4(uv*2.-1.,z,1.);
  return p.xyz/p.w;
}
vec3 octDecode(vec2 e){vec3 n=vec3(e,1.-abs(e.x)-abs(e.y));float t=max(-n.z,0.);n.xy+=mix(vec2(t),vec2(-t),step(0.,n.xy));return normalize(n);}
float ign(vec2 p){return fract(52.9829189*fract(dot(p,vec2(.06711056,.00583715))));}
void main(){
  vec4 info=texture(uInfo,vUv);
  float d=texture(uDepth,vUv).r;
  if(d>=1.||info.b<.5/255.){o=vec4(1.);return;}
  vec3 P=viewPos(vUv);
  vec3 N=normalize((uView*vec4(octDecode(info.xy*2.-1.),0.)).xyz);
  float ang=ign(gl_FragCoord.xy)*6.2831;
  float occ=0.;
  const int K=12;
  for(int i=0;i<K;i++){
    float f=(float(i)+.5)/float(K);
    float a=ang+float(i)*2.39996;
    vec3 off=vec3(cos(a),sin(a),0.)*uRadius*sqrt(f);
    vec4 q=uProj*vec4(P+off,1.);
    vec2 uv=q.xy/q.w*.5+.5;
    vec3 S=viewPos(uv);
    vec3 v=S-P;
    float vv=dot(v,v);
    float nd=dot(N,v);
    occ+=max(nd-.02*abs(P.z),0.)/(vv+uRadius*uRadius*.08)*smoothstep(uRadius*2.6,uRadius*.8,sqrt(vv));
  }
  float ao=clamp(1.-occ*uRadius*1.9/float(K),0.,1.);
  o=vec4(ao,P.z,0.,1.);
}`;

  const BLUR_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uDir;
out vec4 o;
void main(){
  vec4 c=texture(uTex,vUv);
  float sum=c.r,w=1.;
  for(int i=1;i<=4;i++){
    for(int s=-1;s<=1;s+=2){
      vec4 t=texture(uTex,vUv+uDir*float(i*s));
      float k=exp(-abs(t.g-c.g)*.04)*(1.-float(i)/5.);
      sum+=t.r*k;w+=k;
    }
  }
  o=vec4(sum/w,c.g,0.,1.);
}`;

  const DOWN_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uPx;
uniform float uFirst;
out vec4 o;
void main(){
  vec3 c=texture(uTex,vUv).rgb*4.;
  c+=texture(uTex,vUv+uPx*vec2(-1,-1)).rgb+texture(uTex,vUv+uPx*vec2(1,-1)).rgb+texture(uTex,vUv+uPx*vec2(-1,1)).rgb+texture(uTex,vUv+uPx*vec2(1,1)).rgb;
  c/=8.;
  if(uFirst>.5){float l=max(c.r,max(c.g,c.b));c*=smoothstep(1.3,3.2,l);}
  o=vec4(c,1.);
}`;

  const UP_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uPx;
out vec4 o;
void main(){
  vec3 c=texture(uTex,vUv+uPx*vec2(-2,0)).rgb+texture(uTex,vUv+uPx*vec2(2,0)).rgb+texture(uTex,vUv+uPx*vec2(0,-2)).rgb+texture(uTex,vUv+uPx*vec2(0,2)).rgb;
  c+=(texture(uTex,vUv+uPx*vec2(-1,-1)).rgb+texture(uTex,vUv+uPx*vec2(1,-1)).rgb+texture(uTex,vUv+uPx*vec2(-1,1)).rgb+texture(uTex,vUv+uPx*vec2(1,1)).rgb)*2.;
  o=vec4(c/12.,1.);
}`;

  const COMPOSE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uHdr;
uniform sampler2D uAO;
uniform sampler2D uBloom;
uniform float uAOOn,uBloomOn,uExposure,uDark;
uniform vec2 uRes;
out vec4 o;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){
  vec3 c=texture(uHdr,vUv).rgb;
  if(uAOOn>.5)c*=mix(1.,texture(uAO,vUv).r,.85);
  if(uBloomOn>.5)c+=texture(uBloom,vUv).rgb*.16;
  c*=uExposure;
  c=aces(c);
  c=pow(c,vec3(1./2.2));
  // Gentle grade: lifted blacks in the light theme, a cool shadow tint in the dark one.
  c=mix(c,c*vec3(.96,.99,1.04),uDark*.6);
  vec2 q=vUv-.5;
  c*=1.-dot(q,q)*mix(.22,.5,uDark);
  c+=(h(gl_FragCoord.xy)-.5)*(1.5/255.);
  o=vec4(c,dot(c,vec3(.299,.587,.114)));
}`;

  const FXAA_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uPx;
out vec4 o;
void main(){
  vec4 m=texture(uTex,vUv);
  float lM=m.a;
  float lNW=texture(uTex,vUv+uPx*vec2(-1,-1)).a,lNE=texture(uTex,vUv+uPx*vec2(1,-1)).a;
  float lSW=texture(uTex,vUv+uPx*vec2(-1,1)).a,lSE=texture(uTex,vUv+uPx*vec2(1,1)).a;
  float lo=min(lM,min(min(lNW,lNE),min(lSW,lSE))),hi=max(lM,max(max(lNW,lNE),max(lSW,lSE)));
  if(hi-lo<max(.04,hi*.12)){o=vec4(m.rgb,1.);return;}
  vec2 dir=vec2(-((lNW+lNE)-(lSW+lSE)),((lNW+lSW)-(lNE+lSE)));
  float red=max((lNW+lNE+lSW+lSE)*.03,1./128.);
  dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+red),-8.,8.)*uPx;
  vec3 a=.5*(texture(uTex,vUv+dir*(1./3.-.5)).rgb+texture(uTex,vUv+dir*(2./3.-.5)).rgb);
  vec3 b=a*.5+.25*(texture(uTex,vUv-dir*.5).rgb+texture(uTex,vUv+dir*.5).rgb);
  float lb=dot(b,vec3(.299,.587,.114));
  o=vec4((lb<lo||lb>hi)?a:b,1.);
}`;

  // ── structure state ──────────────────────────────────────────────────────
  const FX = { tint: 3, spotA: 3, spotColA: 3, spotB: 3, spotColB: 3, level: 1, levelCol: 3, cut: 1, swell: -1, flow: -1, wave: -1 };
  const ZERO = () => new Float32Array(4);
  const lin = (c) => c.map((v) => Math.pow(v, 2.2));
  function makeState(meta, index) {
    const info = D.structs[meta.id];
    const m = D.mats[info.mat];
    const s = {
      id: meta.id, index, meta, layer: meta.layer, kind: meta.kind, info,
      color: new Float32Array(lin(info.color)), mat: new Float32Array(m.slice(0, 4)), mat2: new Float32Array(m.slice(4, 8)), sss: new Float32Array(lin(m[8] || [0.9, 0.3, 0.25])),
      alpha: 0, show: 0, hiddenBy: 0, dim: 0, dimTo: 0,
      mode: 0, ride: false, shift: new Float32Array(3), explode: new Float32Array(3), pivot: new Float32Array([0, 0, 0, 1]),
      la: ZERO(), lb: ZERO(), fx: {}, to: {}, vao: null, count: meta.i[1], offset: 0, index32: false,
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

  // ── GL helpers ───────────────────────────────────────────────────────────
  function compile(vs, fs) {
    const make = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error((gl.getShaderInfoLog(shader) || "shader") + "\n" + source.split("\n").slice(0, 3).join(" "));
      return shader;
    };
    const program = gl.createProgram();
    gl.attachShader(program, make(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, make(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "link");
    const u = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(program, i).name.replace(/\[0\]$/, "");
      u[name] = gl.getUniformLocation(program, name);
    }
    return { program, u };
  }
  function texture(w, h, internal, format, type, filter = gl.LINEAR) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function framebuffer(colors, depth) {
    const f = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    colors.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    if (depth) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (!ok) throw new Error("framebuffer incompleto");
    return f;
  }
  const hdrFormat = () => (hdrOK ? [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT] : [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE]);

  function init(el) {
    canvas = el;
    try {
      gl = canvas.getContext("webgl2", { alpha: false, premultipliedAlpha: false, antialias: false, depth: false, stencil: false, powerPreference: "high-performance" });
      if (!gl) throw new Error("WebGL2 no disponible");
      hdrOK = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
      P.main = compile(VS, FS);
      P.shadow = compile(VS, SHADOW_FS);
      P.bg = compile(QUAD_VS, BG_FS);
      P.ssao = compile(QUAD_VS, SSAO_FS);
      P.blur = compile(QUAD_VS, BLUR_FS);
      P.down = compile(QUAD_VS, DOWN_FS);
      P.up = compile(QUAD_VS, UP_FS);
      P.compose = compile(QUAD_VS, COMPOSE_FS);
      P.fxaa = compile(QUAD_VS, FXAA_FS);
      quad = gl.createVertexArray();
      gl.bindVertexArray(quad);
      const qb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, qb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindVertexArray(null);
      // Shadow map from the key light.
      T.shadowTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, T.shadowTex);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, 2048, 2048);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
      T.shadowColor = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, T.shadowColor);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, 2048, 2048);
      T.shadowFbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.shadowFbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, T.shadowColor);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, T.shadowTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      buildStand();
      computeSH();
      canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); ready = false; });
      canvas.addEventListener("webglcontextrestored", () => location.reload());
    } catch (error) {
      console.error(error);
      failed = String(error.message || error).split("\n")[0];
      gl = null;
    }
    return !!gl;
  }

  // ── the stand: a turned plinth, a turntable with a light ring, the height rod ──
  function lathe(profile, segments = 96) {
    const pos = [], nor = [], idx = [];
    const rings = profile.length;
    for (let i = 0; i < rings; i++) {
      const [r, z] = profile[i];
      const prev = profile[Math.max(0, i - 1)], next = profile[Math.min(rings - 1, i + 1)];
      let dr = next[0] - prev[0], dz = next[1] - prev[1];
      let nr = dz, nz = -dr;
      const l = Math.hypot(nr, nz) || 1;
      nr /= l; nz /= l;
      for (let j = 0; j <= segments; j++) {
        const a = (j / segments) * Math.PI * 2;
        const c = Math.cos(a), s = Math.sin(a);
        pos.push(r * c, r * s, z);
        nor.push(nr * c, nr * s, nz);
      }
    }
    for (let i = 0; i < rings - 1; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j, b = a + segments + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    return { pos, nor, idx };
  }
  function cylinderAt(x, y, r, z0, z1, segments = 32) {
    const m = lathe([[0.01, z0], [r, z0], [r, z0 + 0.5], [r, z1 - 0.5], [r, z1], [0.01, z1]], segments);
    for (let i = 0; i < m.pos.length; i += 3) { m.pos[i] += x; m.pos[i + 1] += y; }
    return m;
  }
  const STAND_MATS = {
    floor: { color: [0.5, 0.5, 0.5], mat: [0.85, 0, 0, 0], mat2: [0, 0, 0, 0] },
    plinth: { color: [0.2, 0.2, 0.21], mat: [0.42, 0.0, 0.3, 0], mat2: [0, 0, 0, 0] },
    table: { color: [0.62, 0.63, 0.66], mat: [0.32, 1, 0, 0], mat2: [0, 0, 0, 0] },
    top: { color: [0.08, 0.085, 0.09], mat: [0.2, 0, 0.7, 0], mat2: [0, 0, 0, 0] },
    ring: { color: [1, 0.7, 0.25], mat: [0.3, 0, 0, 0], mat2: [0, 0, 2.6, 0] },
    rod: { color: [0.7, 0.71, 0.74], mat: [0.25, 1, 0, 0], mat2: [0, 0, 0, 0] },
    cursor: { color: [1, 0.7, 0.25], mat: [0.3, 0, 0, 0], mat2: [0, 0, 1.6, 0] },
  };
  function buildStand() {
    const parts = [
      { name: "floor", mesh: lathe([[0.01, -90], [6000, -90]], 128), turn: false },
      { name: "plinth", mesh: lathe([[0.01, -90], [440, -90], [446, -86], [448, -78], [448, -68], [444, -62], [438, -60], [0.01, -60]], 128), turn: false },
      { name: "table", mesh: lathe([[0.01, -60], [350, -60], [356, -56], [358, -48], [358, -20], [354, -14], [348, -12], [0.01, -12]], 160), turn: true },
      { name: "ring", mesh: lathe([[359, -40], [361, -38], [361, -32], [359, -30]], 160), turn: true },
      { name: "top", mesh: lathe([[0.01, -12], [342, -12], [346, -9], [346, -3], [342, 0], [0.01, 0]], 160), turn: true },
      { name: "rod", mesh: cylinderAt(-420, 320, 9, -60, 1790, 24), turn: false },
      { name: "rod", mesh: cylinderAt(-420, 320, 30, -60, -48, 40), turn: false },
      { name: "rod", mesh: cylinderAt(-420, 320, 15, 1790, 1806, 24), turn: false },
      { name: "cursor", mesh: cylinderAt(-420, 320, 18, -18, 18, 32), turn: false, cursor: true },
    ];
    for (const p of parts) {
      const n = p.mesh.pos.length / 3;
      const data = new ArrayBuffer(n * 16);
      const f = new Float32Array(data), b = new Int8Array(data);
      for (let i = 0; i < n; i++) {
        f[i * 4] = p.mesh.pos[i * 3]; f[i * 4 + 1] = p.mesh.pos[i * 3 + 1]; f[i * 4 + 2] = p.mesh.pos[i * 3 + 2];
        let x = p.mesh.nor[i * 3], y = p.mesh.nor[i * 3 + 1], z = p.mesh.nor[i * 3 + 2];
        const l1 = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
        x /= l1; y /= l1;
        if (z / l1 < 0) { const ox = x, oy = y; x = (1 - Math.abs(oy)) * (ox >= 0 ? 1 : -1); y = (1 - Math.abs(ox)) * (oy >= 0 ? 1 : -1); }
        b[i * 16 + 12] = Math.round(x * 127); b[i * 16 + 13] = Math.round(y * 127);
      }
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const vb = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 2, gl.BYTE, true, 16, 12);
      for (const k of [1, 3, 4, 5, 6, 7]) gl.disableVertexAttribArray(k);
      const ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(p.mesh.idx), gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      const m = STAND_MATS[p.name];
      stand.push({ ...p, vao, count: p.mesh.idx.length, color: new Float32Array(lin(m.color)), mat: new Float32Array(m.mat), mat2: new Float32Array(m.mat2) });
    }
  }

  // ── the studio: three lights, two softboxes, a backdrop ─────────────────
  const studio = {};
  const norm3 = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
  function setStudio(dark) {
    Object.assign(studio, dark
      ? {
        key: norm3([-0.55, -0.75, 0.65]), keyCol: [1.75, 1.62, 1.45],
        fill: norm3([0.85, -0.45, 0.15]), fillCol: [0.2, 0.25, 0.34],
        rim: norm3([0.35, 0.95, 0.45]), rimCol: [1.15, 1.2, 1.4],
        box: [norm3([-0.5, -0.7, 0.55]), norm3([0.4, 0.9, 0.35]), norm3([0, 0, 1])], boxCol: [[1.6, 1.5, 1.4], [1.0, 1.06, 1.25], [0.35, 0.36, 0.4]],
        envLo: [0.01, 0.01, 0.012], envHi: [0.07, 0.074, 0.085], bgA: [0.055, 0.057, 0.065], bgB: [0.008, 0.008, 0.01], exposure: 1.0,
      }
      : {
        key: norm3([-0.55, -0.75, 0.65]), keyCol: [1.7, 1.62, 1.5],
        fill: norm3([0.85, -0.45, 0.2]), fillCol: [0.3, 0.32, 0.38],
        rim: norm3([0.35, 0.95, 0.45]), rimCol: [0.8, 0.82, 0.9],
        box: [norm3([-0.5, -0.7, 0.55]), norm3([0.4, 0.9, 0.35]), norm3([0, 0, 1])], boxCol: [[1.3, 1.25, 1.2], [0.75, 0.77, 0.85], [0.4, 0.4, 0.42]],
        envLo: [0.07, 0.07, 0.075], envHi: [0.24, 0.245, 0.26], bgA: [0.84, 0.845, 0.86], bgB: [0.6, 0.6, 0.62], exposure: 0.92,
      });
    if (gl) computeSH();
  }
  function envJS(d, r) {
    const k = 1 + (0.06 - 1) * r;
    const t = Math.min(1, Math.max(0, (d[2] + 0.35) / 1.2));
    const s = t * t * (3 - 2 * t);
    const c = studio.envLo.map((v, i) => v + (studio.envHi[i] - v) * s);
    const sharp = [90, 70, 40], fall = [0.25, 0.25, 0.3];
    for (let b = 0; b < 3; b++) {
      const dot = d[0] * studio.box[b][0] + d[1] * studio.box[b][1] + d[2] * studio.box[b][2];
      const e = Math.exp((dot - 1) * sharp[b] * k) * (1 + (fall[b] - 1) * r);
      for (let i = 0; i < 3; i++) c[i] += studio.boxCol[b][i] * e;
    }
    return c;
  }
  const SH = new Float32Array(27);
  function computeSH() {
    SH.fill(0);
    const n = 24;
    let wsum = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n * 2; j++) {
        const th = ((i + 0.5) / n) * Math.PI, ph = ((j + 0.5) / (n * 2)) * Math.PI * 2;
        const d = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
        const w = Math.sin(th);
        const c = envJS(d, 1);
        const [x, y, z] = d;
        const basis = [0.282095, 0.488603 * y, 0.488603 * z, 0.488603 * x, 1.092548 * x * y, 1.092548 * y * z, 0.315392 * (3 * z * z - 1), 1.092548 * x * z, 0.546274 * (x * x - y * y)];
        for (let k = 0; k < 9; k++) for (let ch = 0; ch < 3; ch++) SH[k * 3 + ch] += c[ch] * basis[k] * w;
        wsum += w;
      }
    }
    for (let k = 0; k < 27; k++) SH[k] *= (4 * Math.PI) / wsum;
  }
  setStudio(true);

  // ── mesh ─────────────────────────────────────────────────────────────────
  async function load(onProgress = () => {}) {
    if (!gl) throw new Error(failed || "WebGL2 no disponible");
    const response = await fetch(D.bodyUrl);
    if (!response.ok) throw new Error(`No se pudo descargar el modelo (${response.status})`);
    const total = Number(response.headers.get("content-length")) || D.bodyGz;
    const reader = response.body.getReader();
    const chunks = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      got += value.length;
      onProgress(Math.min(0.9, (got / total) * 0.9));
    }
    const packed = new Blob(chunks);
    const head = new Uint8Array(await packed.slice(0, 2).arrayBuffer());
    const gz = head[0] === 0x1f && head[1] === 0x8b;
    const raw = new Uint8Array(gz ? await new Response(packed.stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer() : await packed.arrayBuffer());
    if (raw.byteLength !== M.bytes) throw new Error("El modelo llegó incompleto");
    await MeshoptDecoder.ready;
    const vertexBytes = new Uint8Array(M.vertices * 16);
    const index32 = new Uint32Array(M.indices);
    let vBase = 0, iBase = 0;
    for (const s of LIST) {
      const m = s.meta;
      const nv = m.v[2], ni = m.i[2];
      const vt = new Uint8Array(nv * 16);
      MeshoptDecoder.decodeVertexBuffer(vt, nv, 16, raw.subarray(m.v[0], m.v[0] + m.v[1]));
      vertexBytes.set(vt, vBase * 16);
      const it = new Uint8Array(ni * 4);
      MeshoptDecoder.decodeIndexBuffer(it, ni, 4, raw.subarray(m.i[0], m.i[0] + m.i[1]));
      index32.set(new Uint32Array(it.buffer), iBase);
      s.vBase = vBase;
      s.offset = iBase * 4;
      s.count = ni;
      vBase += nv;
      iBase += ni;
    }
    onProgress(0.95);
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
      const base = s.vBase * 16;
      for (let i = 0; i < 8; i++) gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(0, 3, gl.UNSIGNED_SHORT, true, 16, base);
      gl.vertexAttribPointer(1, 1, gl.UNSIGNED_SHORT, false, 16, base + 6);
      gl.vertexAttribPointer(2, 2, gl.BYTE, true, 16, base + 8);
      gl.vertexAttribPointer(3, 1, gl.UNSIGNED_BYTE, true, 16, base + 10);
      gl.vertexAttribPointer(4, 1, gl.UNSIGNED_BYTE, false, 16, base + 11);
      gl.vertexAttribPointer(5, 2, gl.BYTE, true, 16, base + 12);
      gl.vertexAttribPointer(6, 1, gl.UNSIGNED_BYTE, true, 16, base + 14);
      gl.vertexAttribPointer(7, 1, gl.UNSIGNED_BYTE, true, 16, base + 15);
    }
    gl.bindVertexArray(LIST[0].vao);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index32, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    ready = true;
    onProgress(1);
  }

  // ── camera ───────────────────────────────────────────────────────────────
  const view = {
    turn: -0.35, turnTo: -0.35, spin: 0,
    pitch: 0.16, pitchTo: 0.16,
    zoom: 1, zoomTo: 1,
    focus: D.cam.home.slice(), focusTo: D.cam.home.slice(),
    pan: [0, 0], panTo: [0, 0],
    inset: { top: 0, right: 0, bottom: 0, left: 0 }, insetNow: { top: 0, right: 0, bottom: 0, left: 0 },
    width: 1, height: 1, ratio: 1,
  };
  const cam = { eye: [0, -3000, 1000], view: new Float32Array(16), proj: new Float32Array(16), vp: new Float32Array(16), inv: new Float32Array(16), invProj: new Float32Array(16), near: 100, far: 9000, target: [0, 0, 900], dist: 3000 };
  const rot = (p, t = view.turn) => { const c = Math.cos(-t), s = Math.sin(-t); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]]; };
  function mul(a, b, out) {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      let v = 0;
      for (let k = 0; k < 4; k++) v += a[k * 4 + j] * b[i * 4 + k];
      out[i * 4 + j] = v;
    }
    return out;
  }
  function invert(m, out) {
    const a = m, b = new Float64Array(16);
    b[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
    b[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
    b[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
    b[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
    b[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10];
    b[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10];
    b[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9];
    b[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
    b[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6];
    b[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6];
    b[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5];
    b[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
    b[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6];
    b[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6];
    b[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5];
    b[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5];
    let det = a[0] * b[0] + a[1] * b[4] + a[2] * b[8] + a[3] * b[12];
    det = det ? 1 / det : 0;
    for (let i = 0; i < 16; i++) out[i] = b[i] * det;
    return out;
  }
  const FIT = D.cam.fitH; // millimetres of the figure that fill the free height at zoom 1
  function place(dt) {
    const k = 1 - Math.exp(-dt / 0.2);
    const kSlow = 1 - Math.exp(-dt / 0.3);
    view.zoom += (view.zoomTo - view.zoom) * kSlow;
    view.pitch += (view.pitchTo - view.pitch) * k;
    for (let i = 0; i < 3; i++) view.focus[i] += (view.focusTo[i] - view.focus[i]) * kSlow;
    for (let i = 0; i < 2; i++) view.pan[i] += (view.panTo[i] - view.pan[i]) * k;
    for (const side of ["top", "right", "bottom", "left"]) view.insetNow[side] += (view.inset[side] - view.insetNow[side]) * kSlow;
    const freeW = Math.max(80, view.width - view.insetNow.left - view.insetNow.right);
    const freeH = Math.max(80, view.height - view.insetNow.top - view.insetNow.bottom);
    const aspect = view.width / view.height;
    const tanH = Math.tan(FOV / 2);
    // Distance at which FIT mm span the free height (or the free width for D.cam.fitW).
    const fill = Math.min(freeH / view.height, (freeW / view.width) * aspect * (FIT / D.cam.fitW));
    const dist = FIT / 2 / tanH / Math.max(0.1, fill) / view.zoom;
    const target = rot(view.focus);
    const cp = Math.cos(view.pitch), sp = Math.sin(view.pitch);
    // Pan moves the target in the view plane, in pixels of the free area.
    const pxToMm = (2 * dist * tanH) / view.height;
    const right = [1, 0, 0], up = [0, -sp, cp];
    for (let i = 0; i < 3; i++) target[i] += (-view.pan[0] * right[i] + view.pan[1] * up[i]) * pxToMm;
    const eye = [target[0], target[1] - dist * cp, target[2] + dist * sp];
    cam.eye = eye;
    cam.target = target;
    cam.dist = dist;
    cam.near = Math.max(30, dist - 2600);
    cam.far = dist + 3200;
    // view matrix (look at)
    const f = norm3([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]);
    const s = norm3([f[1] * 1 - f[2] * 0, f[2] * 0 - f[0] * 1, 0]);
    const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];
    const v = cam.view;
    v.set([s[0], u[0], -f[0], 0, s[1], u[1], -f[1], 0, s[2], u[2], -f[2], 0, -(s[0] * eye[0] + s[1] * eye[1] + s[2] * eye[2]), -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]), f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2], 1]);
    // projection with the target moved to the centre of the free area
    const fy = 1 / tanH, fx = fy / aspect;
    const cx = (view.insetNow.left + freeW / 2) / view.width * 2 - 1;
    const cy = 1 - (view.insetNow.top + freeH / 2) / view.height * 2;
    const n = cam.near, fa = cam.far;
    cam.proj.set([fx, 0, 0, 0, 0, fy, 0, 0, -cx, -cy, -(fa + n) / (fa - n), -1, 0, 0, (-2 * fa * n) / (fa - n), 0]);
    mul(cam.proj, cam.view, cam.vp);
    invert(cam.vp, cam.inv);
    invert(cam.proj, cam.invProj);
  }
  /** Model point → CSS pixels on the canvas. */
  function toScreen(point) {
    const w = rot(point);
    const m = cam.vp;
    const x = m[0] * w[0] + m[4] * w[1] + m[8] * w[2] + m[12];
    const y = m[1] * w[0] + m[5] * w[1] + m[9] * w[2] + m[13];
    const ww = m[3] * w[0] + m[7] * w[1] + m[11] * w[2] + m[15];
    return [((x / ww) * 0.5 + 0.5) * view.width, (1 - ((y / ww) * 0.5 + 0.5)) * view.height, ww];
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    let ratio = Math.min(3, Math.max(dpr, 1.25)) * quality.scale;
    const budget = 2.6e6;
    if (box.width * box.height * ratio * ratio > budget) ratio = Math.sqrt(budget / (box.width * box.height));
    const w = Math.max(2, Math.round(box.width * ratio)), h = Math.max(2, Math.round(box.height * ratio));
    view.width = box.width;
    view.height = box.height;
    view.ratio = w / Math.max(1, box.width);
    if (canvas.width === w && canvas.height === h && T.w === w) return;
    canvas.width = w;
    canvas.height = h;
    if (!gl) return;
    for (const key of ["hdr", "info", "depth", "sel", "ldr", "ao0", "ao1", ...Array.from({ length: 6 }, (_, i) => "bloom" + i)]) if (T[key]) gl.deleteTexture(T[key]);
    for (const key of ["fbo", "selFbo", "ldrFbo", "aoFbo0", "aoFbo1", ...Array.from({ length: 6 }, (_, i) => "bloomFbo" + i)]) if (T[key]) gl.deleteFramebuffer(T[key]);
    const [hi, hf, ht] = hdrFormat();
    T.w = w; T.h = h;
    T.hdr = texture(w, h, hi, hf, ht);
    T.info = texture(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    T.depth = texture(w, h, gl.DEPTH_COMPONENT24, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, gl.NEAREST);
    T.sel = texture(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    T.ldr = texture(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
    T.fbo = framebuffer([T.hdr, T.info], T.depth);
    T.selFbo = framebuffer([T.sel], T.depth);
    T.ldrFbo = framebuffer([T.ldr]);
    const aw = Math.max(1, w >> 1), ah = Math.max(1, h >> 1);
    T.aw = aw; T.ah = ah;
    T.ao0 = texture(aw, ah, hi, hf, ht);
    T.ao1 = texture(aw, ah, hi, hf, ht);
    T.aoFbo0 = framebuffer([T.ao0]);
    T.aoFbo1 = framebuffer([T.ao1]);
    T.bloom = [];
    let bw = w, bh = h;
    for (let i = 0; i < 6; i++) {
      bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1);
      T["bloom" + i] = texture(bw, bh, hi, hf, ht);
      T["bloomFbo" + i] = framebuffer([T["bloom" + i]]);
      T.bloom.push({ tex: T["bloom" + i], fbo: T["bloomFbo" + i], w: bw, h: bh });
    }
  }

  // ── frame ────────────────────────────────────────────────────────────────
  const look = { selected: null, lens: 0, lensTo: 0, glass: 1, glassTo: 1, explode: 0, explodeTo: 0, dark: true, accent: [1, 0.62, 0.15], cursor: 900, skinMode: "glass" };
  const heart = { base: [0, 0, 0], axis: [0, 0, -1], length: 100, sys: 0, atr: 0, twist: 0.22, quiver: 0 };
  const beats = { age: new Float32Array([99, 99, 99, 99]), q: new Float32Array(4) };

  function ease(dt) {
    const k = 1 - Math.exp(-dt / 0.22);
    const slow = 1 - Math.exp(-dt / 0.5);
    look.lens += (look.lensTo - look.lens) * k;
    look.glass += (look.glassTo - look.glass) * k;
    look.explode += (look.explodeTo - look.explode) * (1 - Math.exp(-dt / 0.45));
    for (const s of LIST) {
      s.alpha += ((s.hiddenBy ? 0 : s.show) - s.alpha) * k;
      if (Math.abs(s.alpha - (s.hiddenBy ? 0 : s.show)) < 0.002) s.alpha = s.hiddenBy ? 0 : s.show;
      s.dim += (s.dimTo - s.dim) * k;
      for (const key in FX) {
        const now = s.fx[key], to = s.to[key], gate = FX[key];
        if (gate >= 0 && now[gate] < 0.01) { for (let i = 0; i < 4; i++) if (i !== gate) now[i] = to[i]; }
        for (let i = 0; i < 4; i++) now[i] += (to[i] - now[i]) * (gate === i ? slow : k);
      }
      if (s.fx.cut[1] < 0.01) s.fx.cut[2] = s.to.cut[2];
    }
  }

  const shadowMat = new Float32Array(16);
  function lightMatrix() {
    // Orthographic view from the key light over the stand and the body.
    const L = studio.key;
    const c = [0, 0, 820], r = 1150;
    const f = [-L[0], -L[1], -L[2]];
    const s = norm3([f[1], -f[0], 0]);
    const u = [s[1] * f[2] - s[2] * f[1], s[2] * f[0] - s[0] * f[2], s[0] * f[1] - s[1] * f[0]];
    const eye = [c[0] + L[0] * 3000, c[1] + L[1] * 3000, c[2] + L[2] * 3000];
    const v = new Float32Array([s[0], u[0], -f[0], 0, s[1], u[1], -f[1], 0, s[2], u[2], -f[2], 0, -(s[0] * eye[0] + s[1] * eye[1] + s[2] * eye[2]), -(u[0] * eye[0] + u[1] * eye[1] + u[2] * eye[2]), f[0] * eye[0] + f[1] * eye[1] + f[2] * eye[2], 1]);
    const n = 1000, fa = 5200;
    const p = new Float32Array([1 / r, 0, 0, 0, 0, 1 / r, 0, 0, 0, 0, -2 / (fa - n), 0, 0, 0, -(fa + n) / (fa - n), 1]);
    return mul(p, v, shadowMat);
  }

  function setCommon(u, time) {
    gl.uniformMatrix4fv(u.uViewProj, false, cam.vp);
    gl.uniformMatrix4fv(u.uView, false, cam.view);
    gl.uniform3fv(u.uEye, cam.eye);
    gl.uniform2f(u.uNearFar, cam.near, cam.far);
    gl.uniform1f(u.uTime, time);
    if (u.uShadowMat) gl.uniformMatrix4fv(u.uShadowMat, false, shadowMat);
    gl.uniform4f(u.uHA, heart.base[0], heart.base[1], heart.base[2], heart.length);
    gl.uniform4fv(u.uBeats, beats.age);
    gl.uniform4fv(u.uBeatQ, beats.q);
  }
  function setLights(u) {
    gl.uniform3fv(u.uKeyDir, studio.key);
    gl.uniform3fv(u.uKeyCol, studio.keyCol);
    gl.uniform3fv(u.uFillDir, studio.fill);
    gl.uniform3fv(u.uFillCol, studio.fillCol);
    gl.uniform3fv(u.uRimDir, studio.rim);
    gl.uniform3fv(u.uRimCol, studio.rimCol);
    gl.uniform3fv(u.uBox0, studio.box[0]); gl.uniform3fv(u.uBox1, studio.box[1]); gl.uniform3fv(u.uBox2, studio.box[2]);
    gl.uniform3fv(u.uBoxC0, studio.boxCol[0]); gl.uniform3fv(u.uBoxC1, studio.boxCol[1]); gl.uniform3fv(u.uBoxC2, studio.boxCol[2]);
    gl.uniform3fv(u.uEnvLo, studio.envLo);
    gl.uniform3fv(u.uEnvHi, studio.envHi);
    gl.uniform3fv(u.uBgA, studio.bgA);
    gl.uniform3fv(u.uBgB, studio.bgB);
    gl.uniform3fv(u.uSH, SH);
    gl.uniform3fv(u.uAccent, look.accent);
  }

  const IDENT = new Float32Array([0, 0, 0, 1]);
  function drawStructure(u, s, shadowPass) {
    const e = look.explode;
    gl.uniform3fv(u.uLo, M.lo);
    gl.uniform3fv(u.uSize, M.size);
    gl.uniform2f(u.uTurn, Math.cos(-view.turn), Math.sin(-view.turn));
    gl.uniform1i(u.uMode, s.mode);
    gl.uniform3f(u.uShift, s.shift[0] + s.explode[0] * e, s.shift[1] + s.explode[1] * e, s.shift[2] + s.explode[2] * e);
    gl.uniform4fv(u.uPivot, s.pivot);
    gl.uniform4f(u.uHB, heart.axis[0], heart.axis[1], heart.axis[2], heart.sys);
    gl.uniform4f(u.uHC, heart.atr, heart.twist, heart.quiver, s.ride ? 1 : 0);
    gl.uniform4fv(u.uLA, s.la);
    gl.uniform4fv(u.uLB, s.lb);
    gl.uniform4fv(u.uWave, s.fx.wave);
    gl.uniform4fv(u.uCut, s.fx.cut);
    gl.uniform4fv(u.uSwell, s.fx.swell);
    if (!shadowPass) {
      gl.uniform3fv(u.uAlbedo, s.color);
      gl.uniform4fv(u.uMat, s.mat);
      gl.uniform4fv(u.uMat2, s.mat2);
      gl.uniform3fv(u.uSSS, s.sss);
      gl.uniform4f(u.uState, s.alpha, look.selected === s.id ? 1 : 0, s.dim, s.index);
      gl.uniform1f(u.uKeep, look.selected && s.ride && S[look.selected]?.ride ? 1 : 0);
      gl.uniform4fv(u.uFlow, s.fx.flow);
      gl.uniform4fv(u.uTint, s.fx.tint);
      gl.uniform4fv(u.uSpotA, s.fx.spotA);
      gl.uniform4fv(u.uSpotColA, s.fx.spotColA);
      gl.uniform4fv(u.uSpotB, s.fx.spotB);
      gl.uniform4fv(u.uSpotColB, s.fx.spotColB);
      gl.uniform4fv(u.uLevel, s.fx.level);
      gl.uniform4fv(u.uLevelCol, s.fx.levelCol);
    }
    gl.bindVertexArray(s.vao);
    gl.drawElements(gl.TRIANGLES, s.count, gl.UNSIGNED_INT, s.offset);
  }
  const NONE4 = new Float32Array(4);
  function drawStand(u, part, shadowPass, time) {
    gl.uniform3f(u.uLo, 0, 0, 0);
    gl.uniform3f(u.uSize, 1, 1, 1);
    gl.uniform2f(u.uTurn, part.turn ? Math.cos(-view.turn) : 1, part.turn ? Math.sin(-view.turn) : 0);
    gl.uniform1i(u.uMode, 0);
    gl.uniform3f(u.uShift, 0, 0, part.cursor ? look.cursor : 0);
    gl.uniform4fv(u.uPivot, IDENT);
    gl.uniform4f(u.uHC, 0, 0, 0, 0);
    for (const name of ["uWave", "uCut", "uSwell"]) gl.uniform4fv(u[name], NONE4);
    gl.vertexAttrib4f(1, 0, 0, 0, 1);
    gl.vertexAttrib4f(3, 1, 0, 0, 1);
    gl.vertexAttrib4f(4, 0, 0, 0, 1);
    gl.vertexAttrib4f(5, 0, 0, 0, 1);
    gl.vertexAttrib4f(6, 0.4, 0, 0, 1);
    gl.vertexAttrib4f(7, 0.5, 0, 0, 1);
    if (!shadowPass) {
      const beat = part.name === "ring" || part.name === "cursor" ? 1 + 0.6 * Math.max(0, beats.q[0]) * Math.exp(-Math.max(0, beats.age[0]) / 0.25) : 1;
      const col = part.name === "ring" || part.name === "cursor" ? lin(look.accent) : look.dark ? part.color : part.name === "plinth" ? lin([0.86, 0.86, 0.85]) : part.name === "top" ? lin([0.95, 0.95, 0.94]) : part.name === "floor" ? lin([0.8, 0.8, 0.81]) : part.color;
      gl.uniform3fv(u.uAlbedo, col);
      gl.uniform4fv(u.uMat, part.mat);
      gl.uniform4f(u.uMat2, part.mat2[0], part.mat2[1], part.mat2[2] * beat, part.mat2[3]);
      gl.uniform3f(u.uSSS, 0, 0, 0);
      gl.uniform4f(u.uState, 1, 0, 0, 254); // id 254: the stand takes occlusion but is never picked
      gl.uniform1f(u.uKeep, 1);
      for (const name of ["uFlow", "uTint", "uSpotA", "uSpotColA", "uSpotB", "uSpotColB", "uLevel", "uLevelCol"]) gl.uniform4fv(u[name], NONE4);
      gl.uniform4f(u.uTheme, look.dark ? 1 : 0, 1, part.name === "floor" ? 2600 : 0, 0);
    }
    gl.bindVertexArray(part.vao);
    gl.drawElements(gl.TRIANGLES, part.count, gl.UNSIGNED_INT, 0);
  }

  function fullscreen() {
    gl.bindVertexArray(quad);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let drawn = 0;
  function render(time, dt) {
    if (!gl) return;
    resize();
    place(dt);
    ease(dt);
    if (!T.fbo) return;
    const t0 = performance.now();
    const skin = S.piel;
    const glass = look.skinMode === "glass";
    const visible = LIST.filter((s) => ready && s.alpha > 0.004 && !(s === skin && glass));
    const solid = visible.filter((s) => s.alpha >= 0.985);
    const soft = visible.filter((s) => s.alpha < 0.985);

    // 1. Shadow map.
    lightMatrix();
    if (quality.shadows) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.shadowFbo);
      gl.viewport(0, 0, 2048, 2048);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.colorMask(false, false, false, false);
      gl.clearDepth(1);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.5, 3);
      gl.useProgram(P.shadow.program);
      const u = P.shadow.u;
      gl.uniformMatrix4fv(u.uViewProj, false, shadowMat);
      gl.uniformMatrix4fv(u.uView, false, cam.view);
      gl.uniform1f(u.uTime, time);
      gl.uniform4f(u.uHA, heart.base[0], heart.base[1], heart.base[2], heart.length);
      gl.uniform4fv(u.uBeats, beats.age);
      gl.uniform4fv(u.uBeatQ, beats.q);
      // Nerves and the fine vessel networks cast hairline shadows that cost a full draw each: skip them.
      for (const s of solid) if (!THIN.test(s.id) && s.kind !== "nerve") drawStructure(u, s, true);
      for (const part of stand) if (part.name !== "floor") drawStand(u, part, true, time);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.colorMask(true, true, true, true);
    }

    gl.viewport(0, 0, T.w, T.h);
    // 2. Depth of the selected structure, for the cutaway.
    const sel = look.selected && S[look.selected];
    const cutting = ready && sel && look.lens > 0.01 && sel.alpha > 0.5 && sel.id !== "piel";
    const u = P.main.u;
    gl.useProgram(P.main.program);
    setCommon(u, time);
    setLights(u);
    gl.uniform2f(u.uPx, 1 / T.w, 1 / T.h);
    gl.uniform1i(u.uSelTex, 2);
    gl.uniform1i(u.uShadow, 3);
    gl.uniform1f(u.uShadowOn, quality.shadows ? 1 : 0);
    gl.uniform1f(u.uPre, 0);
    gl.uniform1f(u.uBlend, 0);
    gl.uniform4f(u.uLens, 0, 0, 0, 0);
    gl.uniform4f(u.uGlass, 0, 0, 1, 0);
    gl.uniform4f(u.uTheme, look.dark ? 1 : 0, 1, 0, 0);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, T.shadowTex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    if (cutting) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.selFbo);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(u.uPre, 1);
      drawStructure(u, sel, false);
      gl.uniform1f(u.uPre, 0);
    }

    // 3. Backdrop, then the opaque world into HDR colour + info.
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.fbo);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(P.bg.program);
    gl.uniformMatrix4fv(P.bg.u.uInvViewProj, false, cam.inv);
    gl.uniform3fv(P.bg.u.uEye, cam.eye);
    gl.uniform3fv(P.bg.u.uBgA, studio.bgA);
    gl.uniform3fv(P.bg.u.uBgB, studio.bgB);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
    fullscreen();
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.enable(gl.DEPTH_TEST);
    gl.useProgram(P.main.program);
    for (const part of stand) drawStand(u, part, false, time);
    gl.uniform4f(u.uTheme, look.dark ? 1 : 0, 1, 0, 0);
    if (cutting) {
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, T.sel);
      gl.uniform4f(u.uLens, look.lens, 14 * view.ratio, 0, 0);
    }
    drawn = 0;
    for (const s of solid) { drawStructure(u, s, false); drawn++; }

    // 4. Ambient occlusion from the opaque depth.
    if (quality.ssao) {
      gl.disable(gl.DEPTH_TEST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.aoFbo0);
      gl.viewport(0, 0, T.aw, T.ah);
      gl.useProgram(P.ssao.program);
      const a = P.ssao.u;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.depth);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, T.info);
      gl.uniform1i(a.uDepth, 0); gl.uniform1i(a.uInfo, 1);
      gl.uniformMatrix4fv(a.uProj, false, cam.proj);
      gl.uniformMatrix4fv(a.uInvProj, false, cam.invProj);
      gl.uniformMatrix4fv(a.uView, false, cam.view);
      gl.uniform1f(a.uRadius, 26 + cam.dist * 0.012);
      fullscreen();
      gl.useProgram(P.blur.program);
      gl.uniform1i(P.blur.u.uTex, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.aoFbo1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.ao0);
      gl.uniform2f(P.blur.u.uDir, 1 / T.aw, 0);
      fullscreen();
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.aoFbo0);
      gl.bindTexture(gl.TEXTURE_2D, T.ao1);
      gl.uniform2f(P.blur.u.uDir, 0, 1 / T.ah);
      fullscreen();
      gl.viewport(0, 0, T.w, T.h);
      gl.enable(gl.DEPTH_TEST);
    }

    // 5. Translucent structures and the glass skin, nearest surface only.
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.fbo);
    gl.useProgram(P.main.program);
    const blendPass = (list, glassOn) => {
      if (!list.length) return;
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
      gl.uniform1f(u.uBlend, 1);
      gl.uniform4f(u.uGlass, look.dark ? 0.03 : 0.02, look.dark ? 0.55 : 0.38, 2.4, glassOn ? 1 : 0);
      if (glassOn) { gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); }
      gl.colorMask(false, false, false, false);
      for (const s of list) drawStructure(u, s, false);
      gl.colorMask(true, true, true, true);
      gl.depthMask(false);
      gl.depthFunc(gl.EQUAL);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      for (const s of list) drawStructure(u, s, false);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.uniform1f(u.uBlend, 0);
      gl.uniform4f(u.uGlass, 0, 0, 1, 0);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    };
    blendPass(soft, false);
    drawn += soft.length;
    if (ready && skin && skin.alpha > 0.004 && glass) {
      gl.uniform4f(u.uLens, 0, 0, 0, 0);
      blendPass([skin], true);
    }
    gl.disable(gl.DEPTH_TEST);

    // 6. Bloom.
    if (quality.bloom) {
      gl.useProgram(P.down.program);
      gl.uniform1i(P.down.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      let src = T.hdr, sw = T.w, sh = T.h;
      T.bloom.forEach((b, i) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, b.fbo);
        gl.viewport(0, 0, b.w, b.h);
        gl.bindTexture(gl.TEXTURE_2D, src);
        gl.uniform2f(P.down.u.uPx, 1 / sw, 1 / sh);
        gl.uniform1f(P.down.u.uFirst, i === 0 ? 1 : 0);
        fullscreen();
        src = b.tex; sw = b.w; sh = b.h;
      });
      gl.useProgram(P.up.program);
      gl.uniform1i(P.up.u.uTex, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      for (let i = T.bloom.length - 1; i > 0; i--) {
        const from = T.bloom[i], to = T.bloom[i - 1];
        gl.bindFramebuffer(gl.FRAMEBUFFER, to.fbo);
        gl.viewport(0, 0, to.w, to.h);
        gl.bindTexture(gl.TEXTURE_2D, from.tex);
        gl.uniform2f(P.up.u.uPx, 1 / from.w, 1 / from.h);
        fullscreen();
      }
      gl.disable(gl.BLEND);
    }

    // 7. Tone map and grade into LDR, then FXAA to the canvas.
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.ldrFbo);
    gl.viewport(0, 0, T.w, T.h);
    gl.useProgram(P.compose.program);
    const c = P.compose.u;
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.hdr);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, T.ao0);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, T.bloom[0].tex);
    gl.uniform1i(c.uHdr, 0); gl.uniform1i(c.uAO, 1); gl.uniform1i(c.uBloom, 2);
    gl.uniform1f(c.uAOOn, quality.ssao ? 1 : 0);
    gl.uniform1f(c.uBloomOn, quality.bloom ? 1 : 0);
    gl.uniform1f(c.uExposure, studio.exposure);
    gl.uniform1f(c.uDark, look.dark ? 1 : 0);
    fullscreen();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(P.fxaa.program);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.ldr);
    gl.uniform1i(P.fxaa.u.uTex, 0);
    gl.uniform2f(P.fxaa.u.uPx, 1 / T.w, 1 / T.h);
    fullscreen();
    gl.bindVertexArray(null);
    adapt(performance.now() - t0, dt);
  }

  // Resolution follows the frame time, so a busy phone stays smooth.
  let slowFrames = 0, fastFrames = 0;
  function adapt(cpuMs, dt) {
    quality.frameMs += (dt * 1000 - quality.frameMs) * 0.05;
    if (quality.frameMs > 26) { slowFrames++; fastFrames = 0; } else if (quality.frameMs < 15) { fastFrames++; slowFrames = 0; } else { slowFrames = fastFrames = 0; }
    // Too slow: fewer pixels first, then the occlusion pass, then the shadow pass (a whole extra
    // draw of the body), then fewer pixels again. Fast again: undo in the opposite order.
    if (slowFrames > 90) {
      slowFrames = 0;
      if (quality.scale > 0.75) quality.scale = Math.max(0.75, quality.scale - 0.1);
      else if (quality.ssao) quality.ssao = false;
      else if (quality.shadows) quality.shadows = false;
      else if (quality.scale > 0.6) quality.scale = Math.max(0.6, quality.scale - 0.05);
    }
    if (fastFrames > 240) {
      fastFrames = 0;
      if (quality.scale < 0.75) quality.scale = 0.75;
      else if (!quality.shadows) quality.shadows = true;
      else if (!quality.ssao) quality.ssao = true;
      else if (quality.scale < 1) quality.scale = Math.min(1, quality.scale + 0.1);
    }
  }

  /** The structure under a point in CSS pixels: the commonest id in a small disc around it. */
  function pick(x, y, reach = 7) {
    if (!ready || !T.fbo) return null;
    const r = Math.max(1, Math.round(reach * view.ratio));
    const cx = Math.round(x * view.ratio), cy = Math.round((view.height - y) * view.ratio);
    const x0 = Math.max(0, cx - r), y0 = Math.max(0, cy - r);
    const w = Math.min(T.w - x0, 2 * r + 1), h = Math.min(T.h - y0, 2 * r + 1);
    if (w <= 0 || h <= 0) return null;
    const px = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, T.fbo);
    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(x0, y0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const votes = new Map();
    let best = null;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const id = px[(j * w + i) * 4 + 2];
        if (!id || id >= 254) continue;
        const d2 = (i + x0 - cx) ** 2 + (j + y0 - cy) ** 2;
        if (d2 > r * r) continue;
        const key = id * 256 + px[(j * w + i) * 4 + 3];
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
    const [lo, hi] = part >= 0 ? s.meta.parts[part].flow : s.meta.flow;
    const want = (lo + (hi - lo) * fraction) * 8;
    let reach = Math.max(24, (hi - lo) * 8 * 0.02);
    for (let attempt = 0; attempt < 6; attempt++, reach *= 2.2) {
      let n = 0, x = 0, y = 0, z = 0;
      for (let i = 0; i < s.meta.v[2]; i++) {
        const at = (s.vBase + i) * 16;
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
    S, LIST, view, look, heart, beats, quality, init, load, render, pick, toScreen, along, settle, setStudio, rot,
    get ready() { return ready; }, get failed() { return failed; }, get drawn() { return drawn; }, get gl() { return gl; }, get cam() { return cam; },
  };
})();
