(() => {
  "use strict";
  const D = window.__DATA__;
  const root = document.body;
  const $ = (s, el = document) => el.querySelector(s);
  const stage = $(".stage");
  const svg = $("svg", stage);
  const itemsG = $(".fig-items", svg);
  const readout = $("[data-readout]");
  const titleEl = $("[data-title]");
  const hintEl = $("[data-hint]");
  const live = $("[data-live]");
  const panel = $(".panel");
  const chips = $(".chips");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ORDER = D.systems.flatMap((s) => s.pieces);
  const nodes = [...itemsG.children].map((el, i) => ({ el, p: el.dataset.p, m: el.dataset.m || "", i, shown: "" }));
  const byPiece = {};
  for (const n of nodes) (byPiece[n.p] ??= []).push(n);

  // ---------- Theme ----------
  const sysDark = matchMedia("(prefers-color-scheme: dark)");
  let theme = store.get("theme", null) || "light";
  const applyTheme = () => { root.dataset.theme = theme; };
  applyTheme();
  $(".theme").addEventListener("click", () => { theme = theme === "dark" ? "light" : "dark"; store.set("theme", theme); applyTheme(); });

  // ---------- Selection ----------
  let selected = null;
  let lifted = null;
  const lift = { x: 0, v: 0, target: 0 };
  const LIFT = [D.ex[0] * 6 + D.ez[0] * 4, D.ex[1] * 6 + D.ez[1] * 4];
  let touring = !still.matches;
  let tourClock = 0;

  function restoreOrder() {
    const frag = document.createDocumentFragment();
    for (const n of nodes) frag.appendChild(n.el);
    itemsG.appendChild(frag);
  }
  function raise(id) {
    const frag = document.createDocumentFragment();
    for (const n of byPiece[id] || []) frag.appendChild(n.el);
    itemsG.appendChild(frag);
  }
  function select(id, { quiet = false } = {}) {
    if (id === "soporte" || (id && !D.pieces[id])) id = null;
    if (selected === id) return;
    if (selected) for (const n of byPiece[selected] || []) n.el.removeAttribute("data-on");
    for (const n of nodes) n.el.removeAttribute("data-ghost");
    selected = id;
    if (id) {
      for (const n of byPiece[id] || []) n.el.setAttribute("data-on", "");
      for (const other of D.occluders[id] || []) for (const n of byPiece[other] || []) n.el.setAttribute("data-ghost", "");
      stage.setAttribute("data-focus", "");
      if (lifted && lifted !== id) { lift.x = 0; lift.v = 0; clearLift(lifted); }
      restoreOrder();
      raise(id);
      lifted = id;
      lift.target = 1;
    } else {
      stage.removeAttribute("data-focus");
      lift.target = 0;
    }
    for (const c of chips.querySelectorAll(".chip")) c.toggleAttribute("data-on", c.dataset.p === id);
    const chip = id && chips.querySelector(`.chip[data-p="${id}"]`);
    if (chip && !quiet) chip.scrollIntoView({ behavior: still.matches ? "auto" : "smooth", inline: "center", block: "nearest" });
    titleEl.textContent = id ? D.pieces[id].name : "Torso · vista anterolateral";
    hintEl.textContent = id && !touring ? "Toca de nuevo para soltar" : "Toca un órgano";
    if (id) live.textContent = D.pieces[id].name;
    if (!quiet && tab === "atlas") renderPanel();
    kick();
  }
  function clearLift(id) {
    for (const n of byPiece[id] || []) if (!n.m) { n.el.removeAttribute("transform"); n.shown = ""; }
  }

  function pieceAt(x, y) {
    const hit = document.elementFromPoint(x, y);
    const item = hit && hit.closest ? hit.closest(".it") : null;
    return item ? item.dataset.p : null;
  }
  let down = null;
  stage.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  stage.addEventListener("pointerup", (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 10) return;
    stopTour();
    const id = pieceAt(e.clientX, e.clientY);
    if (!id || id === "soporte" || id === selected) select(null);
    else {
      if (tab !== "atlas" && tab !== "repaso") setTab("atlas");
      select(id);
    }
  });
  stage.addEventListener("keydown", (e) => {
    const i = selected ? ORDER.indexOf(selected) : -1;
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = ORDER[(i + 1) % ORDER.length];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = ORDER[(i - 1 + ORDER.length) % ORDER.length];
    else if (e.key === "Escape") next = "";
    if (next === null) return;
    e.preventDefault();
    stopTour();
    select(next || null);
  });

  // ---------- Chips ----------
  chips.innerHTML = D.systems.map((s) => `<span class="chip-sep">${esc(s.name)}</span>` + s.pieces.map((p) => `<button class="chip" type="button" data-p="${p}">${esc(D.pieces[p].short)}</button>`).join("")).join("");
  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    stopTour();
    if (tab === "ritmos") setTab("atlas");
    select(selected === b.dataset.p ? null : b.dataset.p);
    if (tab === "repaso") renderPanel();
  });

  // ---------- ECG model ----------
  const g = (x, mu, s) => Math.exp(-((x - mu) * (x - mu)) / (2 * s * s));
  const bump = (t, dur) => (t < 0 || t > dur ? 0 : Math.pow(Math.sin((Math.PI * t) / dur), 2));
  const TPL = {
    P: (t) => 0.13 * g(t, 0.05, 0.022),
    N: (t) => -0.1 * g(t, -0.02, 0.007) + 1.0 * g(t, 0, 0.01) - 0.24 * g(t, 0.022, 0.008),
    T: (t) => 0.3 * g(t, 0, 0.055),
    W: (t) => 0.95 * g(t, 0, 0.032) - 0.55 * g(t, 0.07, 0.03),
    U: (t) => -0.32 * g(t, 0, 0.07),
  };
  const ecg = { rhythm: store.get("rhythm", "sinusal"), events: [], next: 0, nextP: 0, nextV: 0, seed: 7, lastQ: [] };
  const rnd = () => ((ecg.seed = (ecg.seed * 16807) % 2147483647) / 2147483647);
  function sinus(t, hr) {
    const rr = 60 / hr;
    ecg.events.push({ t, k: "P" }, { t: t + 0.16, k: "N", q: 1 }, { t: t + 0.16 + 0.27 * Math.sqrt(rr), k: "T" });
    return rr;
  }
  function schedule(until) {
    const r = ecg.rhythm;
    if (r === "bav3") {
      while (ecg.nextP < until) { ecg.events.push({ t: ecg.nextP, k: "P" }); ecg.nextP += 0.75; }
      while (ecg.nextV < until) { ecg.events.push({ t: ecg.nextV, k: "W", q: 1 }, { t: ecg.nextV + 0.36, k: "U" }); ecg.nextV += 60 / 38; }
      return;
    }
    while (ecg.next < until) {
      const t = ecg.next;
      if (r === "sinusal") ecg.next += sinus(t, 72);
      else if (r === "taqui") ecg.next += sinus(t, 125);
      else if (r === "bradi") ecg.next += sinus(t, 45);
      else if (r === "fa") { ecg.events.push({ t, k: "N", q: 1 }, { t: t + 0.26, k: "T" }); ecg.next += 0.4 + rnd() * 0.5; }
      else if (r === "flutter") { ecg.events.push({ t, k: "N", q: 1 }, { t: t + 0.23, k: "T" }); ecg.next += 0.4; }
      else if (r === "tv") { ecg.events.push({ t, k: "W", q: 0.55 }, { t: t + 0.17, k: "U" }); ecg.next += 60 / 180; }
      else ecg.next += 0.5;
    }
  }
  function baseline(t) {
    const r = ecg.rhythm;
    if (r === "fa") return 0.035 * Math.sin(2 * Math.PI * 5.7 * t) + 0.025 * Math.sin(2 * Math.PI * 8.3 * t + 1.3) + 0.018 * Math.sin(2 * Math.PI * 11.1 * t + 0.4);
    if (r === "flutter") { const f = (t * 5) % 1; return -0.17 * (f < 0.78 ? f / 0.78 : 1 - (f - 0.78) / 0.22) + 0.085; }
    if (r === "fv") return (0.42 * Math.sin(2 * Math.PI * 5.1 * t + 0.9 * Math.sin(0.7 * t)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.43 * t)) + 0.2 * Math.sin(2 * Math.PI * 7.3 * t + 2 * Math.sin(1.1 * t)));
    return 0.006 * Math.sin(2 * Math.PI * 0.3 * t);
  }
  function ecgAt(t) {
    let v = baseline(t);
    for (const e of ecg.events) {
      const d = t - e.t;
      if (d > -0.15 && d < 0.4) v += TPL[e.k](d);
    }
    return v;
  }
  function mechanics(t) {
    let sys = 0, atr = 0, pleth = 0;
    for (const e of ecg.events) {
      const d = t - e.t;
      if (e.k === "P") atr += bump(d - 0.06, 0.12);
      else if (e.q) {
        sys = Math.max(sys, bump(d - 0.03, e.k === "W" && ecg.rhythm === "tv" ? 0.24 : 0.34) * e.q);
        const pd = d - 0.22;
        if (pd > 0) pleth += e.q * ((pd / 0.11) * Math.exp(1 - pd / 0.11) + 0.16 * g(pd, 0.36, 0.04));
      }
    }
    if (ecg.rhythm === "fv") sys = 0.18 + 0.18 * Math.sin(2 * Math.PI * 5.1 * t);
    return { sys, atr: Math.min(1, atr), pleth: Math.min(1.3, pleth) };
  }
  function resetRhythm(t) {
    ecg.events = ecg.events.filter((e) => e.t < t);
    const lastQ = ecg.events.filter((e) => e.q).reduce((m, e) => Math.max(m, e.t), -9);
    ecg.next = ecg.nextP = ecg.nextV = Math.max(t + 0.05, lastQ + 0.45);
  }

  // ---------- ECG strip (WebGL, Canvas 2D fallback) ----------
  const canvas = $(".ecg");
  const N = 512;
  const SWEEP = 4;
  const ecgBuf = new Float32Array(N).fill(0.316);
  const plBuf = new Float32Array(N).fill(0);
  const bytes = new Uint8Array(N * 4);
  let lastIdx = -1;
  let gl = null, prog = null, tex = null, uni = {};
  const FRAG = `precision highp float;
uniform sampler2D uTex;uniform vec2 uRes;uniform float uHead;uniform float uDpr;
const float N=${N}.0;
vec2 sampleAt(float i){vec4 c=texture2D(uTex,vec2((mod(i,N)+.5)/N,.5));return vec2((c.r*65280.+c.g*255.)/65535.,c.b);}
float seg(vec2 p,vec2 a,vec2 b){vec2 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/max(dot(ba,ba),1e-4),0.,1.);return length(pa-ba*h);}
void main(){
  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  float u=p.x/uRes.x;
  float fi=u*N;
  float y0=uRes.y*.30,y1=uRes.y*.74,q0=uRes.y*.78,q1=uRes.y*.96;
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
  vec3 bg=vec3(.031,.075,.051);
  float gx=abs(fract(u*20.)-.5)*uRes.x/20.;
  float gy=abs(fract(p.y/(uRes.y/6.))-.5)*uRes.y/6.;
  float grid=(1.-smoothstep(.0,.8*uDpr,uRes.x/40.-gx))*.0+(1.-smoothstep(0.,.7*uDpr,gx))*.05+(1.-smoothstep(0.,.7*uDpr,gy))*.035;
  vec3 col=bg+vec3(.06,.18,.11)*grid;
  col+=vec3(.36,1.,.6)*eC*persist*1.05;
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
    } catch { gl = null; }
    if (!gl) return false;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) { console.error(err); gl = null; return false; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, N, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    for (const name of ["uTex", "uRes", "uHead", "uDpr"]) uni[name] = gl.getUniformLocation(prog, name);
    gl.uniform1i(uni.uTex, 0);
    canvas.dataset.gl = "";
    return true;
  }
  const hasGL = initGL();
  const ctx2d = hasGL ? null : canvas.getContext("2d");
  const norm = (v) => Math.min(1, Math.max(0, (v + 0.6) / 1.9));
  function fitCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return dpr;
  }
  function writeSweep(now) {
    const head = Math.floor(((now / SWEEP) % 1) * N);
    if (lastIdx < 0) lastIdx = (head - 1 + N) % N;
    let i = lastIdx;
    let guard = 0;
    while (i !== head && guard++ < N) {
      i = (i + 1) % N;
      const back = ((head - i + N) % N) * (SWEEP / N);
      const t = now - back;
      const m = mechanics(t);
      ecgBuf[i] = norm(ecgAt(t));
      plBuf[i] = Math.min(1, m.pleth / 1.2);
    }
    lastIdx = head;
    return ((now / SWEEP) % 1);
  }
  function drawStrip(headU) {
    const dpr = fitCanvas();
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
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      return;
    }
    const c = ctx2d, W = canvas.width, H = canvas.height;
    c.fillStyle = "#08130d"; c.fillRect(0, 0, W, H);
    const line = (buf, y0, y1, color) => {
      c.strokeStyle = color; c.lineWidth = 1.4 * dpr; c.shadowColor = color; c.shadowBlur = 6 * dpr; c.beginPath();
      let started = false;
      for (let i = 0; i < N; i++) {
        const age = (headU - i / N + 1) % 1;
        if (age > 0.96) { started = false; continue; }
        const x = (i / N) * W, y = y1 + (y0 - y1) * buf[i];
        if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y);
      }
      c.stroke(); c.shadowBlur = 0;
    };
    line(ecgBuf, H * 0.3, H * 0.74, "#5cff9a");
    line(plBuf, H * 0.78, H * 0.96, "#5ad7ff");
  }
  $(".monitor").addEventListener("click", () => setTab("ritmos"));

  // ---------- Animation loop ----------
  const hrEl = $("[data-hr]"), spEl = $("[data-sp]"), rrEl = $("[data-rr]"), rhEl = $("[data-rhythm]");
  let frame = 0, last = 0, clock = 0, svgTick = 0, visible = true;
  const BREATH_T = 60 / 14;
  const breath = (t) => { const ph = (t % BREATH_T) / BREATH_T; const s = (x) => x * x * (3 - 2 * x); return ph < 0.4 ? s(ph / 0.4) : 1 - s((ph - 0.4) / 0.6); };
  const DOWN = [-D.ez[0], -D.ez[1]];
  function setT(n, text) { if (n.shown !== text) { n.shown = text; if (text) n.el.setAttribute("transform", text); else n.el.removeAttribute("transform"); } }
  function animateSvg(t, calm) {
    const m = mechanics(t);
    const arrest = ecg.rhythm === "fv";
    const b = calm || arrest ? 0 : breath(t);
    const s = calm ? 1 : 1 - 0.045 * m.sys + 0.012 * m.atr;
    const lx = LIFT[0] * lift.x, ly = LIFT[1] * lift.x;
    for (const n of nodes) {
      if (!n.m && n.p !== lifted) continue;
      const up = n.p === lifted ? [lx, ly] : [0, 0];
      let text = "";
      if (n.m === "beat") {
        const [cx, cy] = D.heart;
        text = `matrix(${s.toFixed(4)},0,0,${s.toFixed(4)},${((1 - s) * cx + up[0]).toFixed(2)},${((1 - s) * cy + up[1]).toFixed(2)})`;
      } else if (n.m === "lung") {
        const k = 1 + 0.022 * b;
        const [cx, cy] = D.lungs[n.p];
        text = `matrix(${k.toFixed(4)},0,0,${k.toFixed(4)},${((1 - k) * cx + up[0]).toFixed(2)},${((1 - k) * cy + up[1]).toFixed(2)})`;
      } else if (n.m === "down" || n.m === "down2") {
        const d = (n.m === "down" ? 2.2 : 1.5) * b;
        const x = DOWN[0] * d + up[0], y = DOWN[1] * d + up[1];
        text = Math.abs(x) + Math.abs(y) > 0.005 ? `translate(${x.toFixed(2)} ${y.toFixed(2)})` : "";
      } else {
        text = Math.abs(up[0]) + Math.abs(up[1]) > 0.005 ? `translate(${up[0].toFixed(2)} ${up[1].toFixed(2)})` : "";
      }
      setT(n, text);
    }
  }
  function vitals(t) {
    const r = ecg.rhythm;
    const qs = ecg.events.filter((e) => e.q && e.t <= t).slice(-2);
    let hr = r === "fv" ? "---" : qs.length === 2 ? String(Math.round(60 / (qs[1].t - qs[0].t))) : "--";
    hrEl.textContent = hr;
    spEl.textContent = r === "fv" ? "--" : r === "tv" ? "86" : "98";
    rrEl.textContent = r === "fv" ? "0" : "14";
    if (!selected) readout.textContent = r === "fv" ? "PARO · RCP" : `FC ${hr} · FR ${rrEl.textContent}`;
  }
  let vitalsAt = 0;
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
    last = now;
    const calm = still.matches;
    clock += dt;
    schedule(clock + 2);
    if (ecg.events.length > 400) ecg.events = ecg.events.filter((e) => e.t > clock - SWEEP - 1);
    // Lift spring.
    if (!calm) {
      for (let i = 0; i < 4; i++) { const h = dt / 4; lift.v += ((lift.target - lift.x) * 90 - lift.v * 17) * h; lift.x += lift.v * h; }
      if (Math.abs(lift.target - lift.x) < 1e-3 && Math.abs(lift.v) < 1e-3) { lift.x = lift.target; lift.v = 0; }
    } else { lift.x = lift.target; lift.v = 0; }
    if (lift.target === 0 && lift.x < 0.02 && lifted) { const was = lifted; lifted = null; lift.x = 0; clearLift(was); restoreOrder(); }
    if (touring) tour(dt);
    svgTick ^= 1;
    if (svgTick || calm) animateSvg(clock, calm);
    let headU;
    if (calm) {
      for (let i = 0; i < N; i++) { const t = clock - SWEEP + ((i + 1) * SWEEP) / N; ecgBuf[i] = norm(ecgAt(t)); plBuf[i] = Math.min(1, mechanics(t).pleth / 1.2); }
      headU = 0.999;
    } else headU = writeSweep(clock);
    drawStrip(headU);
    if (calm || clock - vitalsAt > 0.5) { vitalsAt = clock; vitals(clock); }
    frame = visible && !calm ? requestAnimationFrame(tick) : 0;
  }
  function kick() { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } }
  if (still.matches) clock = 6;
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; if (visible) kick(); });

  // Idle tour: only until the first touch.
  const TOUR = ["corazon", "pulmon-der", "higado", "estomago", "colon", "rinones", null];
  let tourStep = -1;
  function tour(dt) {
    tourClock += dt;
    const step = Math.floor((tourClock - 1.6) / 2.6);
    if (step >= 0 && step !== tourStep) { tourStep = step; select(TOUR[step % TOUR.length], { quiet: true }); }
  }
  function stopTour() { if (touring) { touring = false; select(null, { quiet: true }); } }
  for (const ev of ["pointerdown", "keydown", "wheel"]) window.addEventListener(ev, () => { if (touring && ev !== "pointerdown") stopTour(); }, { passive: true });

  // ---------- Panel: atlas, repaso, ritmos ----------
  let tab = "atlas";
  const tabs = [...document.querySelectorAll(".tabs button")];
  function setTab(next) {
    tab = next;
    for (const b of tabs) b.setAttribute("aria-selected", String(b.dataset.tab === next));
    if (next === "repaso") quiz.current = null;
    renderPanel();
    panel.scrollTop = 0;
  }
  tabs.forEach((b) => b.addEventListener("click", () => { stopTour(); setTab(b.dataset.tab); }));

  const LEVEL_ROWS = [
    ["C6", "Cricoides · inicio de tráquea y esófago"],
    ["T4–T5", "Ángulo de Louis · carina · cayado aórtico"],
    ["T8", "Hiato de la vena cava inferior"],
    ["T10", "Hiato esofágico (con los vagos)"],
    ["T12", "Hiato aórtico · tronco celiaco"],
    ["L1", "AMS · píloro · cono medular (L1–L2)"],
    ["L1–L2", "Arterias renales"],
    ["L3", "Mesentérica inferior"],
    ["L4", "Bifurcación aórtica · crestas ilíacas"],
    ["L5", "Formación de la vena cava inferior"],
  ];
  function atlasHtml() {
    if (!selected) {
      return `<div class="intro"><h2>Atlas del torso</h2><p>Toca un órgano en el modelo o en la lista. El órgano se ilumina y lo que lo tapa se vuelve transparente. Debajo aparece su ficha para el ENARM.</p><p>El corazón late y los pulmones respiran al ritmo del monitor. Tócalo para cambiar el ritmo.</p><h3>Niveles vertebrales clave</h3><table class="levels">${LEVEL_ROWS.map(([a, b]) => `<tr><td>${a}</td><td>${esc(b)}</td></tr>`).join("")}</table><p class="foot">Arterias en rojo y venas en azul (el tronco pulmonar es azul: lleva sangre desoxigenada). Se retiró el plastrón condroesternal. Material de estudio: verifica siempre con tu bibliografía y las guías vigentes.</p></div>`;
    }
    const P = D.pieces[selected];
    const i = ORDER.indexOf(selected);
    const next = ORDER[(i + 1) % ORDER.length];
    return `<h2>${esc(P.name)}</h2><div class="level">${esc(P.level)}</div>${P.sections.map(([h, items]) => `<h3>${esc(h)}</h3><ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`).join("")}<div class="pearl"><b>Perla</b>${esc(P.pearl)}</div><div class="actions"><button class="btn" data-act="quiz-piece">Preguntas (${P.quiz.length})</button><button class="btn ghost" data-act="next" data-p="${next}">${esc(D.pieces[next].short)} →</button></div>`;
  }

  // Quiz.
  const ALLQ = [];
  for (const id of ORDER) D.pieces[id].quiz.forEach((q, i) => ALLQ.push({ ...q, id: `${id}:${i}`, piece: id }));
  const stats = store.get("stats", {});
  const quiz = { filter: "todo", current: null, order: null, answered: null, session: { ok: 0, n: 0 } };
  const FILTERS = [["todo", "Todo"], ...D.systems.map((s) => [s.id, s.name.split(" ")[0]]), ["falladas", "Falladas"], ["organo", "Este órgano"]];
  function poolOf() {
    if (quiz.filter === "falladas") return ALLQ.filter((q) => stats[q.id] && stats[q.id].last === 0);
    if (quiz.filter === "organo") return ALLQ.filter((q) => q.piece === selected);
    const sys = D.systems.find((s) => s.id === quiz.filter);
    return sys ? ALLQ.filter((q) => sys.pieces.includes(q.piece)) : ALLQ;
  }
  function pickQuestion() {
    const pool = poolOf();
    if (!pool.length) return null;
    const weight = (q) => { const s = stats[q.id]; return !s ? 3 : s.last === 0 ? 4 : 1; };
    let total = pool.reduce((a, q) => a + weight(q), 0) * Math.random();
    let q = pool[0];
    for (const c of pool) { total -= weight(c); if (total <= 0) { q = c; break; } }
    if (quiz.current && pool.length > 1 && q.id === quiz.current.id) q = pool[(pool.indexOf(q) + 1) % pool.length];
    const order = q.a.map((_, i) => i).sort(() => Math.random() - 0.5);
    return { ...q, order };
  }
  function quizHtml() {
    const total = ALLQ.length;
    const seen = Object.keys(stats).length;
    const right = Object.values(stats).filter((s) => s.last === 1).length;
    const head = `<h2>Repaso tipo ENARM</h2><div class="score"><span>Sesión <b>${quiz.session.ok}/${quiz.session.n}</b></span><span>Dominadas <b>${right}/${total}</b></span><span>Vistas <b>${seen}</b></span></div><div class="seg" role="group" aria-label="Filtro">${FILTERS.filter(([id]) => id !== "organo" || selected).map(([id, name]) => `<button data-filter="${id}" aria-pressed="${quiz.filter === id}">${esc(id === "organo" && selected ? D.pieces[selected].short : name)}</button>`).join("")}</div>`;
    if (!quiz.current) quiz.current = pickQuestion();
    const q = quiz.current;
    if (!q) return head + `<p class="intro">${quiz.filter === "falladas" ? "No tienes preguntas falladas. ¡Bien!" : "No hay preguntas para este filtro."}</p>`;
    const done = quiz.answered !== null;
    const opts = q.order.map((i) => {
      let state = "";
      if (done) state = i === q.ok ? "ok" : i === quiz.answered ? "bad" : "";
      return `<button class="opt" data-opt="${i}" ${done ? "disabled" : ""} ${state ? `data-state="${state}"` : ""}>${esc(q.a[i])}</button>`;
    }).join("");
    const why = done ? `<div class="why" ${quiz.answered === q.ok ? "data-ok" : "data-bad"}><b>${quiz.answered === q.ok ? "Correcto" : "Incorrecto"} · ${esc(D.pieces[q.piece].short)}</b>${esc(q.why)}</div><div class="actions"><button class="btn" data-act="next-q">Siguiente pregunta</button><button class="btn ghost" data-act="ficha" data-p="${q.piece}">Ver ficha</button></div>` : "";
    return head + `<p class="q">${esc(q.q)}</p><div class="opts">${opts}</div>${why}`;
  }
  function ritmosHtml() {
    return `<h2>Ritmos del monitor</h2><p class="intro" style="color:var(--anatomy-text);margin:6px 0 0">Elige un ritmo: el trazo, la frecuencia y el movimiento del corazón cambian. La curva azul es la pletismografía: sin contracción eficaz no hay pulso.</p><div class="rh">${D.rhythms.map((r) => `<button data-rh="${r.id}" aria-pressed="${ecg.rhythm === r.id}"><b>${esc(r.name)}<span>${esc(r.rate)}</span></b><p>${esc(r.text)}</p></button>`).join("")}</div><p class="foot">Dosis y algoritmos según ACLS/AHA vigentes; confirma con tu guía de estudio.</p>`;
  }
  function renderPanel() {
    panel.innerHTML = tab === "atlas" ? atlasHtml() : tab === "repaso" ? quizHtml() : ritmosHtml();
  }
  panel.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    stopTour();
    if (t.dataset.act === "next") { select(t.dataset.p); panel.scrollTop = 0; }
    else if (t.dataset.act === "quiz-piece") { quiz.filter = "organo"; quiz.current = null; quiz.answered = null; setTab("repaso"); }
    else if (t.dataset.act === "next-q") { quiz.current = pickQuestion(); quiz.answered = null; renderPanel(); panel.scrollTop = 0; }
    else if (t.dataset.act === "ficha") { setTab("atlas"); select(t.dataset.p); renderPanel(); }
    else if (t.dataset.filter) { quiz.filter = t.dataset.filter; quiz.current = null; quiz.answered = null; renderPanel(); }
    else if (t.dataset.opt !== undefined && quiz.current && quiz.answered === null) {
      const q = quiz.current;
      quiz.answered = Number(t.dataset.opt);
      const ok = quiz.answered === q.ok ? 1 : 0;
      quiz.session.n++; quiz.session.ok += ok;
      const s = stats[q.id] || { n: 0, ok: 0 };
      s.n++; s.ok += ok; s.last = ok;
      stats[q.id] = s;
      store.set("stats", stats);
      select(q.piece, { quiet: true });
      renderPanel();
    } else if (t.dataset.rh) {
      ecg.rhythm = t.dataset.rh;
      store.set("rhythm", ecg.rhythm);
      resetRhythm(still.matches ? clock - SWEEP - 1 : clock);
      kick();
      rhEl.textContent = D.rhythms.find((r) => r.id === ecg.rhythm).name;
      live.textContent = rhEl.textContent;
      renderPanel();
    }
  });

  rhEl.textContent = (D.rhythms.find((r) => r.id === ecg.rhythm) || D.rhythms[0]).name;
  renderPanel();
  kick();
})();
