// ── Physio: one model drives the trace, the numbers and the motion of the body ──
// The ECG is a train of events (P, QRS, T…) scheduled by the rhythm; the heart's mechanics,
// the pulse wave and the pleth follow each QRS; breathing has its own rate, depth and pattern.
const Physio = (() => {
  const g = (x, mu, s) => Math.exp(-((x - mu) * (x - mu)) / (2 * s * s));
  const bump = (t, dur) => (t < 0 || t > dur ? 0 : Math.pow(Math.sin((Math.PI * t) / dur), 2));
  const TPL = {
    P: (t) => 0.13 * g(t, 0.05, 0.022),
    N: (t) => -0.1 * g(t, -0.02, 0.007) + 1.0 * g(t, 0, 0.01) - 0.24 * g(t, 0.022, 0.008),
    T: (t) => 0.3 * g(t, 0, 0.055),
    W: (t) => 0.95 * g(t, 0, 0.032) - 0.55 * g(t, 0.07, 0.03),
    U: (t) => -0.32 * g(t, 0, 0.07),
    // ST segment lifted off the baseline, merging into the T wave.
    S: (t) => smooth(0.025, 0.07, t) * (1 - smooth(0.2, 0.34, t)),
  };

  const NORMAL = { rhythm: "sinusal", hr: 72, rr: 14, spo2: 98, sys: 118, dia: 76, temp: 36.6, st: 0, depth: 1, pattern: "normal", perf: 1 };
  const now = { ...NORMAL };
  const to = { ...NORMAL };
  const ecg = { events: [], next: 0, nextP: 0, nextV: 0, seed: 7 };
  let clock = 0;
  let breathPhase = 0;
  let breath = 0;
  const rnd = () => ((ecg.seed = (ecg.seed * 16807) % 2147483647) / 2147483647);

  function sinus(t, hr, p = true) {
    const rr = 60 / hr;
    if (p) ecg.events.push({ t, k: "P" });
    ecg.events.push({ t: t + 0.16, k: "N", q: 1 });
    if (now.st > 0.01) ecg.events.push({ t: t + 0.16, k: "S", amp: now.st });
    ecg.events.push({ t: t + 0.16 + 0.27 * Math.sqrt(Math.min(rr, 1.2)), k: "T", amp: 1 + now.st * 1.4 });
    return rr;
  }
  function schedule(until) {
    const r = now.rhythm;
    if (r === "bav3") {
      while (ecg.nextP < until) { ecg.events.push({ t: ecg.nextP, k: "P" }); ecg.nextP += 0.75; }
      while (ecg.nextV < until) { ecg.events.push({ t: ecg.nextV, k: "W", q: 1 }, { t: ecg.nextV + 0.36, k: "U" }); ecg.nextV += 60 / clamp(now.hr, 25, 50); }
      return;
    }
    while (ecg.next < until) {
      const t = ecg.next;
      const hr = clamp(now.hr, 20, 240);
      if (r === "sinusal") ecg.next += sinus(t, hr);
      else if (r === "tsv") ecg.next += sinus(t, clamp(hr, 150, 240), false);
      else if (r === "fa") {
        const rr = (60 / hr) * (0.62 + rnd() * 0.76);
        ecg.events.push({ t, k: "N", q: clamp(0.45 + rr * 0.9, 0.4, 1) }, { t: t + 0.26, k: "T" });
        ecg.next += rr;
      } else if (r === "flutter") { ecg.events.push({ t, k: "N", q: 1 }, { t: t + 0.23, k: "T" }); ecg.next += 0.4; }
      else if (r === "tv") { ecg.events.push({ t, k: "W", q: 0.5 }, { t: t + 0.17, k: "U" }); ecg.next += 60 / clamp(hr, 140, 240); }
      else ecg.next += 0.5;
    }
  }
  function baseline(t) {
    const r = now.rhythm;
    if (r === "fa") return 0.035 * Math.sin(2 * Math.PI * 5.7 * t) + 0.025 * Math.sin(2 * Math.PI * 8.3 * t + 1.3) + 0.018 * Math.sin(2 * Math.PI * 11.1 * t + 0.4);
    if (r === "flutter") { const f = (t * 5) % 1; return -0.17 * (f < 0.78 ? f / 0.78 : 1 - (f - 0.78) / 0.22) + 0.085; }
    if (r === "fv") return 0.42 * Math.sin(2 * Math.PI * 5.1 * t + 0.9 * Math.sin(0.7 * t)) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.43 * t)) + 0.2 * Math.sin(2 * Math.PI * 7.3 * t + 2 * Math.sin(1.1 * t));
    if (r === "asistolia") return 0.01 * Math.sin(2 * Math.PI * 0.4 * t);
    return 0.006 * Math.sin(2 * Math.PI * 0.3 * t);
  }
  function ecgAt(t) {
    let v = baseline(t);
    for (const e of ecg.events) {
      const d = t - e.t;
      if (d > -0.15 && d < 0.4) v += TPL[e.k](d) * (e.amp ?? 1);
    }
    return v;
  }
  function mechanics(t) {
    let sys = 0, atr = 0, pleth = 0;
    for (const e of ecg.events) {
      const d = t - e.t;
      if (d < -0.1 || d > 1.6) continue;
      if (e.k === "P") atr += bump(d - 0.06, 0.12);
      else if (e.q) {
        sys = Math.max(sys, bump(d - 0.03, now.rhythm === "tv" ? 0.24 : 0.34) * e.q);
        const pd = d - 0.22;
        if (pd > 0) pleth += e.q * ((pd / 0.11) * Math.exp(1 - pd / 0.11) + 0.16 * g(pd, 0.36, 0.04));
      }
    }
    if (now.rhythm === "fv") sys = 0;
    return { sys, atr: Math.min(1, atr), pleth: Math.min(1.3, pleth) * now.perf };
  }
  const pulseless = () => now.rhythm === "fv" || now.rhythm === "asistolia";

  /** Seconds since each of the last four beats reached the aortic root, and their strength. */
  function beats(t, age, q) {
    let n = 0;
    for (let i = ecg.events.length - 1; i >= 0 && n < 4; i--) {
      const e = ecg.events[i];
      if (!e.q || e.t + 0.06 > t) continue;
      age[n] = t - e.t - 0.06;
      q[n] = e.q * now.perf;
      n++;
    }
    for (; n < 4; n++) { age[n] = 99; q[n] = 0; }
  }
  function measuredRate(t) {
    const qs = ecg.events.filter((e) => e.q && e.t <= t).slice(-4);
    if (pulseless() || qs.length < 2) return null;
    return Math.round((60 * (qs.length - 1)) / (qs[qs.length - 1].t - qs[0].t));
  }

  /** Where the current beat is: seconds since its P wave began, the beat's start time and length. */
  function cycle(t) {
    let start = null, next = null;
    for (let i = ecg.events.length - 1; i >= 0; i--) {
      const e = ecg.events[i];
      if (!e.q) continue;
      if (e.t - 0.16 <= t) { start = e.t - 0.16; break; }
      next = e.t - 0.16;
    }
    if (start === null) return { pos: 0, start: t, rr: 60 / Math.max(30, now.hr) };
    return { pos: t - start, start, rr: next !== null ? next - start : 60 / Math.max(30, now.hr) };
  }

  const BREATH = {
    normal: (ph) => (ph < 0.4 ? smooth(0, 0.4, ph) : 1 - smooth(0.4, 1, ph)),
    // Obstructed airway: a quick breath in and a long way out.
    obstructivo: (ph) => (ph < 0.26 ? smooth(0, 0.26, ph) : 1 - smooth(0.26, 1, ph) ** 0.8),
    kussmaul: (ph) => (ph < 0.46 ? smooth(0, 0.46, ph) : 1 - smooth(0.46, 0.96, ph)),
  };

  function set(values, { instant = false } = {}) {
    const changed = values.rhythm && values.rhythm !== now.rhythm;
    Object.assign(to, values);
    if (values.rhythm) now.rhythm = values.rhythm;
    if (values.pattern) now.pattern = values.pattern;
    if (instant) for (const key of Object.keys(to)) now[key] = to[key];
    if (changed) {
      ecg.events = ecg.events.filter((e) => e.t < clock);
      const lastQ = ecg.events.filter((e) => e.q).reduce((m, e) => Math.max(m, e.t), -9);
      ecg.next = ecg.nextP = ecg.nextV = Math.max(clock + 0.05, lastQ + 0.4);
    }
    bus.emit("vitals");
  }
  const reset = (options) => set({ ...NORMAL }, options);

  function tick(dt) {
    clock += dt;
    const k = 1 - Math.exp(-dt / 1.1);
    for (const key of ["hr", "rr", "spo2", "sys", "dia", "temp", "st", "depth", "perf"]) now[key] += (to[key] - now[key]) * k;
    schedule(clock + 2);
    if (ecg.events.length > 500) ecg.events = ecg.events.filter((e) => e.t > clock - 6);
    const arrest = pulseless();
    const rate = arrest ? 0 : now.rr;
    breathPhase = (breathPhase + (dt * rate) / 60) % 1;
    const shape = (BREATH[now.pattern] || BREATH.normal)(breathPhase);
    const target = arrest ? 0 : shape * now.depth;
    breath += (target - breath) * (1 - Math.exp(-dt / 0.08));
    return clock;
  }

  return {
    now, to, NORMAL, set, reset, tick, ecgAt, mechanics, beats, measuredRate, pulseless, cycle, speed: 1,
    get clock() { return clock; },
    get breath() { return breath; },
  };
})();
