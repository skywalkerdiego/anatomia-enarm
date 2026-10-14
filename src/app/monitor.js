// ── Monitor: the bedside strip (ECG and pleth drawn by a shader) and its numbers ──
const Monitor = (() => {
  const N = 512;
  const SWEEP = 4;
  const ecgBuf = new Float32Array(N).fill(0.316);
  const plBuf = new Float32Array(N).fill(0);
  const bytes = new Uint8Array(N * 4);
  let root, canvas, gl = null, prog = null, tex = null, ctx2d = null;
  const uni = {};
  let lastIdx = -1, shown = false, vitalsAt = 0, soundOn = false, audio = null, lastBeat = -1;
  const el = {};

  const FRAG = `precision highp float;
uniform sampler2D uTex;uniform vec2 uRes;uniform float uHead;uniform float uDpr;uniform vec3 uTrace;
const float N=${N}.0;
vec2 sampleAt(float i){vec4 c=texture2D(uTex,vec2((mod(i,N)+.5)/N,.5));return vec2((c.r*65280.+c.g*255.)/65535.,c.b);}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-4),0.,1.);return length(pa-ba*h);}
void main(){
  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  float u=p.x/uRes.x;
  float fi=u*N;
  float y0=uRes.y*.20,y1=uRes.y*.70,q0=uRes.y*.76,q1=uRes.y*.95;
  float dE=1e4,dP=1e4;
  for(int k=-3;k<=3;k++){
    float i=floor(fi)+float(k);
    vec2 s0=sampleAt(i),s1=sampleAt(i+1.);
    vec2 a=vec2(i/N*uRes.x,mix(y1,y0,s0.x)),b=vec2((i+1.)/N*uRes.x,mix(y1,y0,s1.x));
    dE=min(dE,seg(p,a,b));
    vec2 c=vec2(i/N*uRes.x,mix(q1,q0,s0.y)),d=vec2((i+1.)/N*uRes.x,mix(q1,q0,s1.y));
    dP=min(dP,seg(p,c,d));
  }
  float age=fract(uHead-u);
  float alive=1.-smoothstep(.955,.985,age);
  float persist=mix(1.,.42,smoothstep(0.,.9,age))*alive;
  float w=.85*uDpr;
  float eC=exp(-(dE*dE)/(w*w))+.42*exp(-dE/(3.2*uDpr));
  float pC=exp(-(dP*dP)/(w*w*.8))+.3*exp(-dP/(3.*uDpr));
  vec3 bg=vec3(.027,.066,.047);
  float gx=abs(fract(u*20.)-.5)*uRes.x/20.;
  float gy=abs(fract(p.y/(uRes.y/5.))-.5)*uRes.y/5.;
  float grid=(1.-smoothstep(0.,.7*uDpr,gx))*.05+(1.-smoothstep(0.,.7*uDpr,gy))*.035;
  vec3 col=bg+vec3(.06,.18,.11)*grid;
  col+=uTrace*eC*persist*1.05;
  col+=vec3(.35,.84,1.)*pC*persist*.8;
  float head=exp(-pow(length(p-vec2(uHead*uRes.x,mix(y1,y0,sampleAt(floor(uHead*N)-1.).x)))/(2.2*uDpr),2.));
  col+=vec3(.75,1.,.85)*head*.9;
  col=1.-exp(-col*1.25);
  float n=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5)/255.;
  gl_FragColor=vec4(col+n,1.);
}`;

  function initGL() {
    try {
      gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false, alpha: false });
    } catch {
      gl = null;
    }
    if (!gl) return false;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (error) {
      console.error(error);
      gl = null;
      return false;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    for (const [key, value] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, key, value);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    for (const name of ["uTex", "uRes", "uHead", "uDpr", "uTrace"]) uni[name] = gl.getUniformLocation(prog, name);
    gl.uniform1i(uni.uTex, 0);
    return true;
  }

  const norm01 = (v) => clamp((v + 0.6) / 1.9);
  function fit() {
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }
    return dpr;
  }
  function sweep(t) {
    const head = Math.floor(((t / SWEEP) % 1) * N);
    if (lastIdx < 0) lastIdx = (head - 1 + N) % N;
    let i = lastIdx, guard = 0;
    while (i !== head && guard++ < N) {
      i = (i + 1) % N;
      const back = ((head - i + N) % N) * (SWEEP / N);
      ecgBuf[i] = norm01(Physio.ecgAt(t - back));
      plBuf[i] = Math.min(1, Physio.mechanics(t - back).pleth / 1.2);
    }
    lastIdx = head;
    return (t / SWEEP) % 1;
  }
  function draw(headU) {
    const dpr = fit();
    const danger = Physio.pulseless() || Physio.now.rhythm === "tv";
    if (gl) {
      for (let i = 0; i < N; i++) {
        const q = Math.round(ecgBuf[i] * 65535);
        bytes[i * 4] = q >> 8; bytes[i * 4 + 1] = q & 255; bytes[i * 4 + 2] = Math.round(plBuf[i] * 255); bytes[i * 4 + 3] = 255;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      gl.uniform2f(uni.uRes, canvas.width, canvas.height);
      gl.uniform1f(uni.uHead, headU);
      gl.uniform1f(uni.uDpr, dpr);
      gl.uniform3f(uni.uTrace, danger ? 1 : 0.36, danger ? 0.45 : 1, danger ? 0.4 : 0.6);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return;
    }
    const c = ctx2d, W = canvas.width, H = canvas.height;
    c.fillStyle = "#07110c"; c.fillRect(0, 0, W, H);
    const line = (buf, y0, y1, color) => {
      c.strokeStyle = color; c.lineWidth = 1.4 * dpr; c.beginPath();
      let started = false;
      for (let i = 0; i < N; i++) {
        if ((headU - i / N + 1) % 1 > 0.96) { started = false; continue; }
        const x = (i / N) * W, y = y1 + (y0 - y1) * buf[i];
        if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y);
      }
      c.stroke();
    };
    line(ecgBuf, H * 0.2, H * 0.7, danger ? "#ff7a66" : "#5cff9a");
    line(plBuf, H * 0.76, H * 0.95, "#5ad7ff");
  }

  // Heart sounds: two short low thumps per beat, S1 at the QRS and S2 as systole ends.
  function thump(when, freq, gain, length) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * 1.5, when);
    o.frequency.exponentialRampToValueAtTime(freq, when + length);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + length);
    o.connect(g).connect(audio.destination);
    o.start(when);
    o.stop(when + length + 0.02);
  }
  function sounds() {
    if (!soundOn || !audio) return;
    const age = Body.beats.age[0];
    const stamp = Math.round((Physio.clock - age) * 20);
    if (age < 0.2 && stamp !== lastBeat && Body.beats.q[0] > 0.1) {
      lastBeat = stamp;
      const t = audio.currentTime + 0.01;
      thump(t, 58, 0.5 * Body.beats.q[0], 0.11);
      thump(t + clamp(0.3 * Math.sqrt(60 / Math.max(40, Physio.now.hr)), 0.16, 0.36), 82, 0.34 * Body.beats.q[0], 0.07);
    }
  }
  function setSound(on) {
    soundOn = on;
    if (on && !audio) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audio = new Ctx();
    }
    if (on && audio && audio.state === "suspended") audio.resume();
    el.sound.innerHTML = icon(on ? "sound" : "mute");
    el.sound.setAttribute("aria-pressed", String(on));
  }

  const RHYTHM_NAME = { sinusal: "Ritmo sinusal", tsv: "Taquicardia supraventricular", fa: "Fibrilación auricular", flutter: "Flutter auricular 2:1", bav3: "BAV de tercer grado", tv: "Taquicardia ventricular", fv: "Fibrilación ventricular", asistolia: "Asistolia" };
  function label() {
    const p = Physio.now;
    if (p.rhythm !== "sinusal") return RHYTHM_NAME[p.rhythm];
    if (p.st > 0.12) return "Sinusal · elevación del ST";
    return p.hr > 100 ? "Taquicardia sinusal" : p.hr < 60 ? "Bradicardia sinusal" : "Ritmo sinusal";
  }
  function numbers(t) {
    const p = Physio.now;
    const arrest = Physio.pulseless();
    const rate = Physio.measuredRate(t);
    el.hr.textContent = arrest ? "---" : rate ?? "--";
    el.sp.textContent = arrest ? "--" : Math.round(p.spo2);
    el.rr.textContent = arrest ? "0" : Math.round(p.rr);
    el.bp.textContent = arrest ? "--/--" : `${Math.round(p.sys)}/${Math.round(p.dia)}`;
    el.rhythm.textContent = label();
    root.toggleAttribute("data-alarm", arrest || p.spo2 < 90 || p.sys < 90 || (rate ?? 80) > 150 || (rate ?? 80) < 40);
    el.sp.parentElement.toggleAttribute("data-low", !arrest && p.spo2 < 92);
    el.bp.parentElement.toggleAttribute("data-low", !arrest && p.sys < 90);
  }

  function init() {
    root = $(".monitor");
    canvas = $(".ecg", root);
    for (const key of ["hr", "sp", "rr", "bp", "rhythm"]) el[key] = $(`[data-${key}]`, root);
    el.sound = $(".mon-sound", root);
    if (!initGL()) ctx2d = canvas.getContext("2d");
    el.sound.addEventListener("click", (e) => { e.stopPropagation(); setSound(!soundOn); });
    root.addEventListener("click", () => bus.emit("monitor-tap"));
    setSound(false);
  }
  function show(on) {
    shown = on;
    root.toggleAttribute("data-on", on);
    bus.emit("layout");
  }
  function frame(t) {
    sounds();
    if (!shown) return;
    if (still.matches) {
      for (let i = 0; i < N; i++) { const at = t - SWEEP + ((i + 1) * SWEEP) / N; ecgBuf[i] = norm01(Physio.ecgAt(at)); plBuf[i] = Math.min(1, Physio.mechanics(at).pleth / 1.2); }
      draw(0.999);
    } else draw(sweep(t));
    if (t - vitalsAt > 0.4 || t < vitalsAt) { vitalsAt = t; numbers(t); }
  }
  return { init, show, frame, setSound, label, get shown() { return shown; }, get sound() { return soundOn; } };
})();
