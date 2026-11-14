/* ==========================================================
   Kelsy & Novin — site behaviour
   ========================================================== */

/* ---- Settings: edit these ---- */
const CONFIG = {
  // Ceremony start, Sydney time (AEDT, UTC+11)
  weddingStart: "2027-11-01T15:00:00+11:00",

  // Calendar event: guests arrive 2:30 pm, carriages 11:00 pm (AEDT)
  calendar: {
    title: "Kelsy & Novin's Wedding",
    startUTC: "20271101T033000Z",
    endUTC: "20271101T120000Z",
    location: "Ardour Milton Park, 200 Horderns Road, Bowral NSW 2576",
    details: "Guests arrive 2:30 pm, ceremony 3:00 pm on the Tulip Lawn. Dress code: formal. Details and RSVP: see our wedding website.",
  },

  // RSVP form endpoint. Create a free form at https://formspree.io and paste
  // its URL here, e.g. "https://formspree.io/f/abcdwxyz". Leave empty until
  // RSVPs open; guests will see a friendly "not open yet" message.
  rsvpEndpoint: "",
};

/* ---- Mobile nav ---- */
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  links.classList.toggle("open", !open);
});
links.addEventListener("click", (e) => {
  if (e.target.closest("a")) {
    toggle.setAttribute("aria-expanded", "false");
    links.classList.remove("open");
  }
});

/* ---- Countdown ---- */
const target = new Date(CONFIG.weddingStart).getTime();
const units = {
  days: document.querySelector('[data-unit="days"]'),
  hours: document.querySelector('[data-unit="hours"]'),
  minutes: document.querySelector('[data-unit="minutes"]'),
  seconds: document.querySelector('[data-unit="seconds"]'),
};
function setUnit(el, value) {
  if (el.textContent === value) return;
  el.textContent = value;
  el.classList.remove("tick");
  void el.offsetWidth; // restart the pop animation
  el.classList.add("tick");
}
function tick() {
  const diff = Math.max(0, target - Date.now());
  const secs = Math.floor(diff / 1000);
  setUnit(units.days, String(Math.floor(secs / 86400)));
  setUnit(units.hours, String(Math.floor((secs % 86400) / 3600)).padStart(2, "0"));
  setUnit(units.minutes, String(Math.floor((secs % 3600) / 60)).padStart(2, "0"));
  setUnit(units.seconds, String(secs % 60).padStart(2, "0"));
  if (diff === 0) {
    document.getElementById("countdown").outerHTML =
      '<p class="lede">Today\'s the day!</p>';
    return;
  }
  setTimeout(tick, 1000 - (Date.now() % 1000));
}
tick();

/* ---- Add to calendar ---- */
(function setupCalendar() {
  const c = CONFIG.calendar;
  const g = new URL("https://calendar.google.com/calendar/render");
  g.searchParams.set("action", "TEMPLATE");
  g.searchParams.set("text", c.title);
  g.searchParams.set("dates", `${c.startUTC}/${c.endUTC}`);
  g.searchParams.set("location", c.location);
  g.searchParams.set("details", c.details);
  document.getElementById("cal-google").href = g.toString();

  const esc = (s) => s.replace(/[\\,;]/g, (m) => "\\" + m);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kelsy and Novin//Wedding//EN",
    "BEGIN:VEVENT",
    "UID:kelsy-novin-wedding-20271101@wedding",
    "DTSTAMP:20261109T000000Z",
    `DTSTART:${c.startUTC}`,
    `DTEND:${c.endUTC}`,
    `SUMMARY:${esc(c.title)}`,
    `LOCATION:${esc(c.location)}`,
    `DESCRIPTION:${esc(c.details)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  document.getElementById("cal-ics").href = url;
  document.getElementById("cal-outlook").href = url;

  const btn = document.getElementById("cal-btn");
  const menu = document.getElementById("cal-menu");
  const setOpen = (open) => {
    menu.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  };
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !e.target.closest(".cal-wrap")) setOpen(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
})();

/* ---- Copy promo code ---- */
document.querySelectorAll("[data-copy]").forEach((el) => {
  el.addEventListener("click", async () => {
    const hint = el.parentElement.querySelector(".promo-hint");
    try {
      await navigator.clipboard.writeText(el.dataset.copy);
      if (hint) hint.textContent = "Copied!";
    } catch {
      if (hint) hint.textContent = "Code: " + el.dataset.copy;
    }
    setTimeout(() => hint && (hint.textContent = "Tap to copy"), 2200);
  });
});

/* ---- Scroll reveal for the timeline ---- */
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${i * 90}ms`;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

/* ---- Gallery lightbox ---- */
(function setupLightbox() {
  const box = document.getElementById("lightbox");
  const img = box.querySelector("img");
  const items = [...document.querySelectorAll(".g-item img")];
  let idx = 0;
  const show = (i) => {
    idx = (i + items.length) % items.length;
    img.src = items[idx].src;
    img.alt = items[idx].alt;
  };
  items.forEach((el, i) =>
    el.parentElement.addEventListener("click", () => { show(i); box.showModal(); })
  );
  box.querySelector(".lb-close").addEventListener("click", () => box.close());
  box.querySelector(".lb-prev").addEventListener("click", () => show(idx - 1));
  box.querySelector(".lb-next").addEventListener("click", () => show(idx + 1));
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
})();

/* ---- RSVP ---- */
const form = document.getElementById("rsvp-form");
const status = document.getElementById("form-status");

function validate() {
  let ok = true;
  form.querySelectorAll(".field").forEach((f) => f.classList.remove("invalid"));
  const mark = (el) => { el.closest(".field").classList.add("invalid"); ok = false; };
  if (!form.names.value.trim()) mark(form.names);
  if (!form.email.value.trim() || !form.email.checkValidity()) mark(form.email);
  if (!form.querySelector('input[name="attending"]:checked')) mark(form.querySelector('input[name="attending"]'));
  return ok;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  status.className = "form-status";

  if (!validate()) {
    status.textContent = "Please fill in your name, email and whether you can make it.";
    status.classList.add("err");
    return;
  }

  if (!CONFIG.rsvpEndpoint) {
    status.textContent = "RSVPs aren't open just yet. Keep an eye out for your formal invitation!";
    status.classList.add("err");
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Sending…";
  try {
    const res = await fetch(CONFIG.rsvpEndpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });
    if (!res.ok) throw new Error(res.status);
    const attending = form.attending.value === "Yes";
    form.reset();
    status.textContent = attending
      ? "Thank you! We can't wait to celebrate with you."
      : "Thank you for letting us know. You'll be missed!";
    status.classList.add("ok");
  } catch {
    status.textContent = "Something went wrong sending your RSVP. Please try again in a moment.";
    status.classList.add("err");
  } finally {
    btn.disabled = false;
    btn.textContent = "Send RSVP";
  }
});

/* ==========================================================
   Motion & delight
   ========================================================== */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---- Opening reveal ---- */
(function intro() {
  const el = document.getElementById("intro");
  if (!el) return;
  const finish = () => {
    document.documentElement.classList.remove("intro-playing");
    el.classList.add("intro--done");
    setTimeout(() => el.remove(), 1100);
  };
  const start = () => {
    el.addEventListener("click", finish, { once: true });
    setTimeout(finish, 2100);
  };
  // Wait for the welcome questionnaire if it's showing.
  if (document.documentElement.classList.contains("gate-open")) {
    document.addEventListener("gate:done", start, { once: true });
  } else {
    start();
  }
})();

/* ---- Welcome questionnaire: "Want to come to our wedding?" ---- */
(function gate() {
  const el = document.getElementById("gate");
  if (!el || el.hidden) return;
  const html = document.documentElement;
  const card = document.getElementById("gate-card");
  const yes = document.getElementById("gate-yes");
  const no = document.getElementById("gate-no");
  const hint = document.getElementById("gate-hint");
  const labels = ["No", "Are you sure?", "Really sure?", "Think again!", "Nope 🙈", "Can't catch me!", "Just press Yes 💜"];
  let dodges = 0;
  let last = 0;
  let pointer = { x: -999, y: -999 };

  function dodge() {
    const now = Date.now();
    if (now - last < 220) return;
    last = now;
    dodges++;

    const c = card.getBoundingClientRect();
    const b = no.getBoundingClientRect();
    if (!no.classList.contains("is-loose")) {
      // Pin it where it is, then let it run.
      no.style.left = `${b.left - c.left}px`;
      no.style.top = `${b.top - c.top}px`;
      no.classList.add("is-loose");
      void no.offsetWidth;
    }

    no.textContent = labels[Math.min(dodges, labels.length - 1)];
    const bw = no.offsetWidth, bh = no.offsetHeight, pad = 14;
    const y0 = c.top + pad, y1 = c.top + c.height - bh - pad;
    const x0 = c.left + pad, x1 = c.left + c.width - bw - pad;
    const yb = yes.getBoundingClientRect();
    let best = null, bestScore = -1;
    for (let i = 0; i < 24; i++) {
      const x = x0 + Math.random() * Math.max(0, x1 - x0);
      const y = y0 + Math.random() * Math.max(0, y1 - y0);
      const cx = x + bw / 2, cy = y + bh / 2;
      const fromPointer = Math.hypot(cx - pointer.x, cy - pointer.y);
      const overYes = !(x + bw < yb.left - 8 || x > yb.right + 8 || y + bh < yb.top - 8 || y > yb.bottom + 8);
      const score = overYes ? -1 : fromPointer;
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
    if (best) {
      no.style.left = `${best.x - c.left}px`;
      no.style.top = `${best.y - c.top}px`;
    }
    yes.style.setProperty("--grow", Math.min(1 + dodges * 0.07, 1.5));
    if (dodges === 3) hint.textContent = "Hint: the other button works 😉";
  }

  // Mouse: run away as the cursor gets close.
  el.addEventListener("pointermove", (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    if (e.pointerType !== "mouse") return;
    const b = no.getBoundingClientRect();
    const near = 36;
    if (e.clientX > b.left - near && e.clientX < b.right + near &&
        e.clientY > b.top - near && e.clientY < b.bottom + near) dodge();
  });
  // Touch / pen: move the moment it's touched.
  no.addEventListener("pointerdown", (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    dodge();
  });
  // Keyboard (or a lucky click): still not allowed.
  no.addEventListener("click", (e) => {
    e.preventDefault();
    hint.textContent = "Nice try 😄";
    last = 0;
    dodge();
    yes.focus({ preventScroll: true });
  });

  /* --- Moving between steps --- */
  const steps = [...el.querySelectorAll(".gate-step")];
  let current = 0;
  function goTo(n) {
    const prev = steps[current];
    prev.classList.remove("is-active");
    prev.classList.add("is-leaving");
    setTimeout(() => prev.classList.remove("is-leaving"), 700);
    current = n;
    const next = steps[n];
    next.classList.add("is-active");
    card.classList.toggle("is-pass", next.classList.contains("gate-step--pass"));
    const heading = next.querySelector("h2");
    if (heading) setTimeout(() => heading.focus({ preventScroll: true }), 50);
  }

  // "Yes" → first quiz question
  yes.addEventListener("click", () => {
    const b = yes.getBoundingClientRect();
    confetti(70, b.left + b.width / 2, b.top + b.height / 2);
    setTimeout(() => goTo(1), 350);
  }, { once: true });

  // Any answer moves to the next question
  el.querySelectorAll(".gate-options").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || group.classList.contains("is-answered")) return;
      group.classList.add("is-answered");
      btn.classList.add("is-picked");
      const i = steps.indexOf(group.closest(".gate-step"));
      setTimeout(() => {
        goTo(i + 1);
        if (steps[i + 1].classList.contains("gate-step--pass")) passed();
      }, 520);
    });
  });

  // "You passed!" → password → K&N reveal → website
  let leaving = false;
  let askedPassword = false;
  const pwStep = el.querySelector(".gate-step--password");
  const pwForm = document.getElementById("gate-pw");
  const pwInput = document.getElementById("gate-pw-input");
  const pwMsg = document.getElementById("gate-pw-msg");
  // SHA-256 of the guest password (lower-case). To change the password, run:
  //   printf 'newpassword' | shasum -a 256   and paste the result here.
  const PASSWORD_HASH = "2451d109c44b310c9aa851c7ed03d2d0a41a070f18da7059d5be5d21303fcd23";
  // Focusing or selecting text can nudge the overlay; keep it pinned in place.
  el.addEventListener("scroll", () => { el.scrollTop = 0; el.scrollLeft = 0; });

  function passed() {
    confetti(200, innerWidth / 2, innerHeight * 0.4);
    setTimeout(() => confetti(120, innerWidth * 0.2, innerHeight * 0.3), 450);
    setTimeout(() => confetti(120, innerWidth * 0.8, innerHeight * 0.3), 750);
    setTimeout(askPassword, 4200);
  }
  function askPassword() {
    if (askedPassword) return;
    askedPassword = true;
    goTo(steps.indexOf(pwStep));
    setTimeout(() => pwInput.focus({ preventScroll: true }), 700);
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    // crypto.subtle only exists on https pages; fall back to plain JS otherwise.
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      const buf = await crypto.subtle.digest("SHA-256", data);
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return sha256Fallback(data);
  }
  function sha256Fallback(bytes) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const len = bytes.length;
    const total = Math.ceil((len + 9) / 64) * 64;
    const msg = new Uint8Array(total);
    msg.set(bytes);
    msg[len] = 0x80;
    const view = new DataView(msg.buffer);
    view.setUint32(total - 8, Math.floor((len * 8) / 0x100000000));
    view.setUint32(total - 4, (len * 8) >>> 0);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    const W = new Uint32Array(64);
    for (let off = 0; off < total; off += 64) {
      for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
        const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => { H[i] = (H[i] + v) >>> 0; });
    }
    return H.map((v) => v.toString(16).padStart(8, "0")).join("");
  }
  pwForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const guess = pwInput.value.trim().toLowerCase();
    if (!guess) { pwMsg.textContent = "Pop the password in first 🙂"; return; }
    let ok = false;
    try { ok = (await sha256(guess)) === PASSWORD_HASH; } catch (err) { ok = false; }
    if (ok) {
      try { localStorage.setItem("kn-unlocked", "1"); } catch (err) {}
      pwMsg.textContent = "Welcome in! 💜";
      pwForm.classList.add("is-correct");
      const r = pwForm.getBoundingClientRect();
      confetti(90, r.left + r.width / 2, r.top);
      setTimeout(leave, 900);
    } else {
      pwMsg.textContent = "Hmm, that's not it. Try again!";
      pwForm.classList.remove("is-wrong");
      void pwForm.offsetWidth;
      pwForm.classList.add("is-wrong");
      pwInput.focus({ preventScroll: true });
      pwInput.setSelectionRange(0, pwInput.value.length);
    }
  });
  function leave() {
    if (leaving) return;
    leaving = true;
    el.classList.add("gate--leaving");
    html.classList.remove("gate-open");
    document.dispatchEvent(new Event("gate:done"));
    setTimeout(() => el.remove(), 800);
  }
  document.getElementById("gate-enter").addEventListener("click", askPassword);

  /* --- Confetti (one shared canvas and animation loop) --- */
  const canvas = document.getElementById("confetti");
  const ctx = canvas.getContext("2d");
  const colours = ["#D6C6E8", "#F3E08D", "#8DBB7E", "#7A639D", "#FFF4D6", "#E9E1F5", "#C7A73B"];
  let bits = [];
  let running = false;
  function confetti(count, ox, oy) {
    if (reduceMotion) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== innerWidth * dpr) {
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
      bits.push({
        x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, life: 1,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 8,
        r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        c: colours[(Math.random() * colours.length) | 0], round: Math.random() < 0.35,
      });
    }
    if (!running) { running = true; requestAnimationFrame(frame); }
  }
  function frame() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    bits.forEach((p) => {
      p.vy += 0.28; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.007;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * 0.6);
      ctx.restore();
    });
    bits = bits.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    if (bits.length) requestAnimationFrame(frame);
    else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
})();

/* ---- Drifting petals in the hero ---- */
(function petals() {
  const box = document.querySelector(".petals");
  if (!box || reduceMotion) return;
  const colours = ["#D6C6E8", "#F3E08D", "#E9E1F5", "#8DBB7E", "#C8B4E0", "#FFF4D6"];
  const count = window.innerWidth < 640 ? 10 : 18;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    const size = 8 + Math.random() * 10;
    p.style.cssText = [
      `left:${Math.random() * 100}%`,
      `width:${size}px`,
      `height:${size * 0.7}px`,
      `background:${colours[i % colours.length]}`,
      `animation-duration:${9 + Math.random() * 9}s, ${3 + Math.random() * 3}s`,
      `animation-delay:${-Math.random() * 18}s, ${-Math.random() * 3}s`,
      `--drift:${(Math.random() * 120 - 60).toFixed(0)}px`,
    ].join(";");
    box.appendChild(p);
  }
})();

/* ---- Reveal-on-scroll for sections, cards and photos ---- */
(function revealAll() {
  const selector = [
    ".section-head", ".lede", ".story-photo", ".story-card", ".info-card", ".spot",
    ".venue-banner", ".venue-copy", ".map-frame", ".stay-feature", ".moodboard figure",
    ".g-item", ".menu-list li", ".rsvp-form", ".faq details", ".sub-head", ".tip",
  ].join(",");
  const els = [...document.querySelectorAll(selector)].filter(
    (el) => !el.closest(".hero") && !el.classList.contains("reveal")
  );
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  els.forEach((el) => {
    el.classList.add("reveal");
    if (el.matches("figure, .g-item, .venue-banner, .story-photo, .spot")) el.classList.add("reveal--photo");
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries
        .filter((e) => e.isIntersecting)
        .forEach((entry) => {
          const el = entry.target;
          const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
          const delay = Math.min(siblings.indexOf(el), 5) * 90;
          el.style.transitionDelay = `${delay}ms`;
          el.classList.add("in");
          io.unobserve(el);
          // Hand control back to normal hover styles once the entrance is done.
          setTimeout(() => {
            el.classList.remove("reveal", "reveal--photo", "in");
            el.style.transitionDelay = "";
          }, 1300 + delay);
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  els.forEach((el) => io.observe(el));
})();

/* ---- Scroll progress, header state & timeline line ---- */
(function onScroll() {
  const bar = document.getElementById("scroll-progress");
  const header = document.querySelector(".site-header");
  const timeline = document.querySelector(".timeline");
  let ticking = false;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    header.classList.toggle("scrolled", window.scrollY > 10);
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = (window.innerHeight * 0.7 - r.top) / r.height;
      timeline.style.setProperty("--fill", Math.max(0, Math.min(1, p)).toFixed(3));
    }
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
