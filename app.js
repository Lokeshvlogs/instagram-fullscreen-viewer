// Instagram Fullscreen Viewer — features & plans site.
// Animations and the filter demo are plain JS; sign-in and checkout use Supabase (the same account
// as the extension) and the extension's Supabase functions.
import {
  ADDON_URL,
  DISCLAIMER,
  MAX_DEVICES,
  PLANS,
  SITE_URL,
  SUPABASE_KEY,
  SUPABASE_URL,
} from "./config.js";

const $ = (id) => document.getElementById(id);
// ?static shows the page without motion (like the reduced-motion setting), e.g. for screenshots.
const reducedMotion =
  window.matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("static");
if (reducedMotion) document.documentElement.classList.add("no-motion");
const euro = (n) => `€${Number.isInteger(n) ? n : n.toFixed(2)}`;

$("disclaimer").textContent = DISCLAIMER;
$("year").textContent = String(new Date().getFullYear());
$("addToFirefox").href = ADDON_URL;

// ---- Animated gradient mesh behind the hero ----------------------------------

function startMesh() {
  const canvas = $("mesh");
  const ctx = canvas.getContext("2d");
  const blobs = [
    { hue: "214, 41, 118", x: 0.2, y: 0.3, r: 0.45, dx: 0.00011, dy: 0.00007 },
    { hue: "131, 58, 180", x: 0.75, y: 0.25, r: 0.5, dx: -0.00008, dy: 0.0001 },
    { hue: "250, 126, 30", x: 0.6, y: 0.8, r: 0.4, dx: 0.00009, dy: -0.00009 },
    { hue: "79, 91, 213", x: 0.15, y: 0.85, r: 0.45, dx: 0.00007, dy: -0.00006 },
  ];
  const resize = () => {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.clientWidth * ratio * 0.5; // soft anyway; half resolution is plenty
    canvas.height = canvas.clientHeight * ratio * 0.5;
  };
  resize();
  window.addEventListener("resize", resize);
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(64, now - last);
    last = now;
    const { width: w, height: h } = canvas;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const b of blobs) {
      b.x += b.dx * dt;
      b.y += b.dy * dt;
      if (b.x < 0 || b.x > 1) b.dx *= -1;
      if (b.y < 0 || b.y > 1) b.dy *= -1;
      const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * Math.max(w, h));
      g.addColorStop(0, `rgba(${b.hue}, 0.35)`);
      g.addColorStop(1, `rgba(${b.hue}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";
    if (!document.hidden) requestAnimationFrame(frame);
    else document.addEventListener("visibilitychange", () => requestAnimationFrame(frame), { once: true });
  };
  if (reducedMotion) frame(performance.now());
  else requestAnimationFrame(frame);
}

// ---- Hero: a grid tile opens full screen, the strip slides in, filters sweep --------

const TILE_TINTS = ["none", "hue-rotate(50deg)", "hue-rotate(-60deg) saturate(1.3)", "grayscale(1)", "hue-rotate(120deg)",
  "sepia(0.6)", "hue-rotate(200deg)", "contrast(1.3)", "hue-rotate(-120deg)"];

function buildHero() {
  const grid = $("heroGrid");
  const strip = $("heroStrip");
  TILE_TINTS.forEach((tint, i) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.filter = tint;
    grid.appendChild(tile);
    const small = document.createElement("div");
    small.className = i === 4 ? "tile on" : "tile";
    small.style.filter = tint;
    strip.appendChild(small);
  });
}

async function heroLoop() {
  const screen = $("heroScreen");
  const viewer = $("heroViewer");
  const strip = $("heroStrip");
  const cursor = $("heroCursor");
  const img = viewer.querySelector("img");
  const target = $("heroGrid").children[4];
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const anim = (el, frames, options) => el.animate(frames, { fill: "forwards", easing: "cubic-bezier(.2,.8,.2,1)", ...options }).finished;

  for (;;) {
    // 1. The cursor moves to a tile and Ctrl+clicks it.
    const s = screen.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const tx = ((t.left + t.width / 2 - s.left) / s.width) * 100;
    const ty = ((t.top + t.height / 2 - s.top) / s.height) * 100;
    await anim(cursor, [{ left: "85%", top: "90%", opacity: 0 }, { left: `${tx}%`, top: `${ty}%`, opacity: 1 }], { duration: 1100 });
    await anim(cursor, [{ transform: "scale(1)" }, { transform: "scale(0.7)" }, { transform: "scale(1)" }], { duration: 300 });
    // 2. The tile grows into the full-screen viewer.
    const clip = `inset(${(t.top - s.top) / s.height * 100}% ${(s.right - t.right) / s.width * 100}% ${(s.bottom - t.bottom) / s.height * 100}% ${(t.left - s.left) / s.width * 100}%)`;
    anim(cursor, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    await anim(viewer, [{ opacity: 1, clipPath: clip }, { opacity: 1, clipPath: "inset(0 0 0 0)" }], { duration: 700 });
    // 3. The tile strip slides in; then a filter sweep.
    await anim(strip, [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }], { duration: 600 });
    await wait(500);
    img.style.filter = "saturate(1.6) contrast(1.15)";
    await wait(1400);
    img.style.filter = "grayscale(1) contrast(1.3)";
    await wait(1400);
    img.style.filter = "sepia(0.5) hue-rotate(-15deg) saturate(1.3)";
    await wait(1400);
    img.style.filter = "none";
    await wait(900);
    // 4. Close, and start again.
    await anim(strip, [{ transform: "translateY(0)" }, { transform: "translateY(100%)" }], { duration: 400 });
    await anim(viewer, [{ opacity: 1 }, { opacity: 0 }], { duration: 500 });
    await wait(800);
  }
}

// ---- Scroll reveal ---------------------------------------------------------------

function startReveal() {
  const items = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.18 }
  );
  items.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 3) * 80}ms`;
    io.observe(el);
  });
}

// ---- Filter lab --------------------------------------------------------------------

const LAB_PRESETS = {
  Original: { b: 100, c: 100, s: 100, w: 0, v: 0, curve: [50, 50] },
  Vivid: { b: 104, c: 118, s: 150, w: 5, v: 10, curve: [50, 44] },
  Warm: { b: 106, c: 104, s: 115, w: 60, v: 15, curve: [50, 46] },
  Mono: { b: 100, c: 128, s: 0, w: 0, v: 25, curve: [50, 52] },
  Fade: { b: 110, c: 82, s: 80, w: 15, v: 0, curve: [40, 32] },
  Dramatic: { b: 96, c: 145, s: 120, w: -10, v: 45, curve: [55, 62] },
};

function startLab() {
  const img = $("labImg");
  const vignette = $("labVignette");
  const inputs = { b: $("labBright"), c: $("labContrast"), s: $("labSat"), w: $("labWarm"), v: $("labVig") };
  const handle = $("labCurveHandle");
  const path = $("labCurvePath");
  const svg = $("labCurveEditor");
  let point = [50, 50]; // the curve's middle point, in 0–100 (x right, y up)
  let comparing = false;

  // A smooth curve through (0,0), the point and (1,1), sampled into the SVG table filter.
  const curveAt = (x) => {
    const [px, py] = [point[0] / 100, point[1] / 100];
    const seg = x <= px ? [0, 0, px, py] : [px, py, 1, 1];
    const t = (x - seg[0]) / Math.max(1e-6, seg[2] - seg[0]);
    const smooth = t * t * (3 - 2 * t); // ease between the two ends
    const linear = seg[1] + (seg[3] - seg[1]) * t;
    const eased = seg[1] + (seg[3] - seg[1]) * smooth;
    return Math.min(1, Math.max(0, linear * 0.6 + eased * 0.4));
  };

  const render = () => {
    const v = Object.fromEntries(Object.entries(inputs).map(([k, el]) => [k, Number(el.value)]));
    const table = Array.from({ length: 17 }, (_, i) => curveAt(i / 16).toFixed(3)).join(" ");
    for (const ch of ["curveR", "curveG", "curveB"]) $(ch).setAttribute("tableValues", table);
    const warm = v.w / 100;
    img.style.filter = comparing
      ? "none"
      : `url(#labCurve) brightness(${v.b / 100}) contrast(${v.c / 100}) saturate(${v.s / 100}) ` +
        `sepia(${Math.max(0, warm) * 0.35}) hue-rotate(${warm < 0 ? warm * 25 : warm * -8}deg)`;
    vignette.style.background = comparing
      ? "none"
      : `radial-gradient(ellipse at center, transparent ${70 - v.v * 0.3}%, rgba(0,0,0,${(v.v / 100) * 0.85}) 100%)`;
    let d = "";
    for (let i = 0; i <= 40; i++) d += `${i ? "L" : "M"}${i * 2.5} ${100 - curveAt(i / 40) * 100}`;
    path.setAttribute("d", d);
    handle.setAttribute("cx", point[0]);
    handle.setAttribute("cy", 100 - point[1]);
  };

  const presetBox = $("labPresets");
  const setPreset = (name) => {
    const p = LAB_PRESETS[name];
    inputs.b.value = p.b;
    inputs.c.value = p.c;
    inputs.s.value = p.s;
    inputs.w.value = p.w;
    inputs.v.value = p.v;
    point = [...p.curve];
    for (const btn of presetBox.children) btn.classList.toggle("on", btn.textContent === name);
    render();
  };
  for (const name of Object.keys(LAB_PRESETS)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = name;
    btn.addEventListener("click", () => setPreset(name));
    presetBox.appendChild(btn);
  }
  for (const el of Object.values(inputs)) {
    el.addEventListener("input", () => {
      for (const btn of presetBox.children) btn.classList.remove("on");
      render();
    });
  }
  $("labReset").addEventListener("click", () => setPreset("Original"));

  // Drag the curve point.
  let dragging = false;
  const move = (e) => {
    const r = svg.getBoundingClientRect();
    const x = Math.min(85, Math.max(15, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(95, Math.max(5, 100 - ((e.clientY - r.top) / r.height) * 100));
    point = [x, y];
    for (const btn of presetBox.children) btn.classList.remove("on");
    render();
  };
  svg.addEventListener("pointerdown", (e) => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    move(e);
  });
  svg.addEventListener("pointermove", (e) => dragging && move(e));
  svg.addEventListener("pointerup", () => (dragging = false));

  // Hold the image to compare with the original.
  const lab = img.parentElement;
  const hold = (on) => () => {
    comparing = on;
    render();
  };
  lab.addEventListener("pointerdown", hold(true));
  for (const type of ["pointerup", "pointerleave", "pointercancel"]) lab.addEventListener(type, hold(false));

  setPreset("Vivid");
}

// ---- Account, pricing and checkout ----------------------------------------------------

let supabase = null;
let session = null;
let status = null; // the entitlement (peek) for the signed-in user
let showMonthly = false;

function notice(text, warn = false) {
  const el = $("notice");
  el.hidden = !text;
  el.textContent = text || "";
  el.classList.toggle("warn", warn);
}

const ERRORS = {
  already_active: "You already have an active plan.",
  not_configured: "Payments aren't set up yet. Please try again later.",
  stripe_error: "The payment service didn't respond. Please try again.",
  no_billing: "There's no subscription to manage yet.",
  unauthorized: "Please sign in again.",
};

async function callFunction(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    let code = "unknown";
    try {
      code = (await error.context.json()).error || code;
    } catch {
      // not JSON
    }
    throw new Error(code);
  }
  return data;
}

function statusText(s) {
  if (!s) return "";
  if (s.superuser) return "Owner · full access";
  const date = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  if (s.state === "active") {
    const plan = PLANS.find((p) => p.id === s.plan);
    return `Premium${plan ? ` · ${plan.name}` : ""} · ${s.cancelAtPeriodEnd ? "ends" : "renews"} ${date(s.periodEnd)}`;
  }
  if (s.state === "trial") {
    const days = Math.max(0, Math.ceil((Date.parse(s.trialEndsAt) - Date.now()) / 86_400_000));
    return `Free trial · ${days} day${days === 1 ? "" : "s"} left`;
  }
  return s.plan ? "Your Premium plan has ended" : "Your free trial has ended";
}

function renderPlans() {
  const box = $("plans");
  box.textContent = "";
  const active = status && (status.superuser || status.state === "active");
  for (const plan of PLANS) {
    const card = document.createElement("article");
    card.className = `plan reveal in${plan.best ? " best" : ""}${status && status.plan === plan.id && status.state === "active" ? " current" : ""}`;
    if (plan.best) {
      const ribbon = document.createElement("span");
      ribbon.className = "ribbon";
      ribbon.textContent = "Best value";
      card.appendChild(ribbon);
    }
    const h = document.createElement("h3");
    h.textContent = plan.name;
    const price = document.createElement("div");
    price.className = "price";
    const perMonth = plan.price / plan.months;
    price.append(showMonthly ? euro(Math.round(perMonth * 100) / 100) : euro(plan.price));
    const small = document.createElement("small");
    small.textContent = showMonthly ? " / month" : ` / ${plan.per}`;
    price.appendChild(small);
    const save = document.createElement("div");
    save.className = "save";
    save.textContent = plan.note || (showMonthly ? "" : "Billed monthly");
    const list = document.createElement("ul");
    for (const line of ["Slideshow", "Filters, curves & presets", "Filtered downloads", `Up to ${MAX_DEVICES} devices`]) {
      const li = document.createElement("li");
      li.textContent = line;
      list.appendChild(li);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = plan.best ? "btn btn-primary" : "btn btn-ghost";
    if (status && status.superuser) {
      btn.textContent = "Included (owner)";
      btn.disabled = true;
    } else if (active) {
      btn.textContent = status.plan === plan.id ? "Your plan" : "Change in Manage subscription";
      btn.disabled = true;
    } else {
      btn.textContent = session ? `Subscribe · ${euro(plan.price)}` : "Sign in to subscribe";
      btn.addEventListener("click", () => subscribe(plan.id, btn));
    }
    card.append(h, price, save, list, btn);
    box.appendChild(card);
  }
}

function renderAccount() {
  const nav = $("navAccount");
  nav.textContent = "";
  if (session) {
    const chip = document.createElement("span");
    chip.className = "avatar-chip";
    const b = document.createElement("b");
    b.textContent = session.user.email || "Signed in";
    chip.appendChild(b);
    nav.appendChild(chip);
  } else {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn-ghost";
    btn.textContent = "Sign in";
    btn.addEventListener("click", () => signIn());
    nav.appendChild(btn);
  }
  $("account").hidden = !session;
  if (session) {
    $("accountEmail").textContent = session.user.email || "";
    $("accountStatus").textContent = status ? statusText(status) : "Checking your plan…";
    $("manage").hidden = !(status && status.hasBilling && status.plan && !status.superuser);
  }
  renderPlans();
}

async function refreshStatus() {
  status = null;
  if (session) {
    try {
      status = await callFunction("entitlement", { peek: true });
    } catch (err) {
      console.debug("status check failed", err);
    }
  }
  renderAccount();
  return status;
}

async function signIn(plan) {
  if (!supabase) return notice("Sign-in is unavailable right now. Please try again later.", true);
  if (plan) sessionStorage.setItem("pendingPlan", plan);
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: SITE_URL } });
  if (error) notice(`Couldn't start sign-in: ${error.message}`, true);
}

async function subscribe(planId, btn) {
  if (!session) return signIn(planId);
  btn.disabled = true;
  const label = btn.textContent;
  btn.textContent = "Opening secure checkout…";
  try {
    const { url } = await callFunction("create-checkout", { plan: planId, returnUrl: SITE_URL });
    location.assign(url);
  } catch (err) {
    notice(ERRORS[err.message] || "Something went wrong. Please try again.", true);
    btn.disabled = false;
    btn.textContent = label;
  }
}

// Back from Stripe: wait for the webhook to record the plan.
async function handleReturn() {
  const params = new URLSearchParams(location.search);
  const checkout = params.get("checkout");
  const billing = params.get("billing");
  if (!checkout && !billing) return;
  history.replaceState(null, "", location.pathname + location.hash);
  if (checkout === "cancel") return notice("Checkout cancelled — no payment was made.", true);
  if (billing) {
    notice("Subscription updated.");
    return refreshStatus();
  }
  notice("Payment received — activating Premium…");
  document.getElementById("pricing").scrollIntoView();
  for (let i = 0; i < 20; i++) {
    const s = await refreshStatus();
    if (s && s.state === "active") {
      return notice(`Premium is active until ${new Date(s.periodEnd).toLocaleDateString()}. Enjoy! Premium turns on in the extension the next time you use Slideshow or Filters.`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  notice("Your payment is being processed. Premium will switch on within a few minutes.");
}

async function startAccount() {
  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { detectSessionInUrl: true, persistSession: true } });
  } catch (err) {
    console.debug("Supabase unavailable", err);
    renderAccount();
    return;
  }
  const { data } = await supabase.auth.getSession();
  session = data.session;
  supabase.auth.onAuthStateChange((_event, next) => {
    const changed = (next && next.access_token) !== (session && session.access_token);
    session = next;
    if (changed) refreshStatus();
  });
  await refreshStatus();
  await handleReturn();

  // Signed in on the way to a plan: offer to continue.
  const pending = sessionStorage.getItem("pendingPlan");
  if (pending && session) {
    sessionStorage.removeItem("pendingPlan");
    const plan = PLANS.find((p) => p.id === pending);
    if (plan && !(status && (status.state === "active" || status.superuser))) {
      $("pricing").scrollIntoView();
      notice(`Signed in. Choose "Subscribe" on ${plan.name} to continue to checkout.`);
    }
  }

  $("signOut").addEventListener("click", async () => {
    await supabase.auth.signOut();
    session = null;
    status = null;
    renderAccount();
  });
  $("manage").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    btn.disabled = true;
    try {
      const { url } = await callFunction("billing-portal", { returnUrl: SITE_URL });
      location.assign(url);
    } catch (err) {
      notice(ERRORS[err.message] || "Couldn't open the subscription page.", true);
      btn.disabled = false;
    }
  });
}

// Price display toggle.
for (const btn of document.querySelectorAll(".toggle button")) {
  btn.addEventListener("click", () => {
    showMonthly = btn.dataset.show === "monthly";
    for (const b of document.querySelectorAll(".toggle button")) b.classList.toggle("on", b === btn);
    renderPlans();
  });
}
$("navSignIn").addEventListener("click", () => signIn());

buildHero();
startMesh();
startReveal();
startLab();
renderPlans();
if (!reducedMotion) heroLoop();
startAccount();
