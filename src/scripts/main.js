import Lenis from 'lenis';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ------------------------------------------------------------------ */
/* Smooth scroll (Lenis)                                              */
/* ------------------------------------------------------------------ */
let lenis = null;
if (!prefersReduced) {
  lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.6,
  });
  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

const HEADER_OFFSET = 84; // clear the fixed header so section tops aren't hidden
const scrollTo = (target) => {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;
  if (lenis) {
    lenis.scrollTo(el, { offset: -HEADER_OFFSET, duration: 1.3 });
  } else {
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
  }
};

/* Anchor links → smooth scroll + close mobile menu */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    scrollTo(el);
    history.replaceState(null, '', id);
  });
});

/* ------------------------------------------------------------------ */
/* Header state + scroll progress                                     */
/* ------------------------------------------------------------------ */
const header = document.getElementById('site-header');
const scrollBar = document.getElementById('scroll-bar');

const onScroll = (y) => {
  const scrollY = y ?? window.scrollY;
  if (header) header.dataset.state = scrollY > 24 ? 'scrolled' : 'top';
  if (scrollBar) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (scrollY / max) * 100 : 0;
    scrollBar.style.width = pct + '%';
  }
};
if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
else window.addEventListener('scroll', () => onScroll(), { passive: true });
onScroll(0);

/* ------------------------------------------------------------------ */
/* Mobile menu                                                        */
/* ------------------------------------------------------------------ */
const toggle = document.getElementById('nav-toggle');
const menu = document.getElementById('mobile-menu');
let menuOpen = false;

function openMenu() {
  if (!menu) return;
  menu.hidden = false;
  requestAnimationFrame(() => menu.classList.add('is-open'));
  header?.classList.add('menu-open');
  toggle?.setAttribute('aria-expanded', 'true');
  toggle?.setAttribute('aria-label', 'Fechar menu');
  lenis?.stop();
  document.body.style.overflow = 'hidden';
  menuOpen = true;
}
function closeMenu() {
  if (!menu || !menuOpen) return;
  menu.classList.remove('is-open');
  header?.classList.remove('menu-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Abrir menu');
  lenis?.start();
  document.body.style.overflow = '';
  menuOpen = false;
  setTimeout(() => { if (!menuOpen && menu) menu.hidden = true; }, 420);
}
toggle?.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

/* ------------------------------------------------------------------ */
/* Reveal on scroll                                                   */
/* ------------------------------------------------------------------ */
const revealEls = document.querySelectorAll('[data-reveal]');
if (prefersReduced || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );
  revealEls.forEach((el) => io.observe(el));
}

/* ------------------------------------------------------------------ */
/* Animated counters                                                  */
/* ------------------------------------------------------------------ */
const counters = document.querySelectorAll('[data-count]');
const formatNum = (n, decimals) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function animateCount(el) {
  const target = parseFloat(el.dataset.count || '0');
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  if (prefersReduced) { el.textContent = formatNum(target, decimals) + suffix; return; }
  const duration = 1600;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatNum(target * eased, decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = formatNum(target, decimals) + suffix;
  };
  requestAnimationFrame(tick);
}
if ('IntersectionObserver' in window) {
  const countIO = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); }
    }),
    { threshold: 0.6 }
  );
  counters.forEach((el) => countIO.observe(el));
} else {
  counters.forEach((el) => animateCount(el));
}

/* ------------------------------------------------------------------ */
/* Card spotlight (follow cursor)                                     */
/* ------------------------------------------------------------------ */
if (isFinePointer) {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

/* ------------------------------------------------------------------ */
/* Magnetic buttons                                                   */
/* ------------------------------------------------------------------ */
if (isFinePointer && !prefersReduced) {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    const strength = 0.28;
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ------------------------------------------------------------------ */
/* Console 3D tilt                                                    */
/* ------------------------------------------------------------------ */
if (isFinePointer && !prefersReduced) {
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    const parent = el.parentElement;
    parent?.addEventListener('pointermove', (e) => {
      const r = parent.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(1400px) rotateY(${-9 + px * 8}deg) rotateX(${4 - py * 8}deg)`;
    });
    parent?.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

/* ------------------------------------------------------------------ */
/* Custom cursor                                                      */
/* ------------------------------------------------------------------ */
if (isFinePointer && !prefersReduced) {
  const cursor = document.getElementById('cursor');
  if (cursor) {
    document.body.classList.add('has-cursor');
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy;
    const dot = cursor.querySelector('.cursor__dot');
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      cursor.style.opacity = '1';
      if (dot) dot.style.transform = `translate(${tx - cursor.offsetLeft}px, ${ty - cursor.offsetTop}px) translate(-50%, -50%)`;
    });
    const renderCursor = () => {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.left = cx + 'px';
      cursor.style.top = cy + 'px';
      if (dot) dot.style.transform = `translate(${tx - cx}px, ${ty - cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);
    document.querySelectorAll('a, button, [data-magnetic], input, textarea, select').forEach((el) => {
      el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });
    window.addEventListener('pointerleave', () => (cursor.style.opacity = '0'));
  }
}

/* ------------------------------------------------------------------ */
/* Back to top                                                        */
/* ------------------------------------------------------------------ */
document.getElementById('back-to-top')?.addEventListener('click', () => scrollTo('#topo'));

/* ------------------------------------------------------------------ */
/* Contact form (Formspree-ready, progressive enhancement)            */
/* ------------------------------------------------------------------ */
const form = document.getElementById('contact-form');
const status = document.getElementById('form-status');
form?.addEventListener('submit', async (e) => {
  const action = form.getAttribute('action') || '';
  // If endpoint not configured, let the browser handle it / show guidance.
  if (action.includes('SEU_ID_AQUI')) {
    e.preventDefault();
    if (status) {
      status.textContent = 'Formulário em modo demonstração — configure o endpoint (Formspree) para receber mensagens.';
      status.className = 'cta__form-note is-error';
    }
    return;
  }
  e.preventDefault();
  const btn = form.querySelector('button[type="submit"]');
  const label = form.querySelector('.cta__btn-label');
  const prevLabel = label?.textContent;
  if (label) label.textContent = 'Enviando…';
  btn?.setAttribute('disabled', 'true');
  try {
    const res = await fetch(action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      form.reset();
      if (status) { status.textContent = 'Mensagem enviada! Em breve um especialista entrará em contato.'; status.className = 'cta__form-note is-success'; }
      if (label) label.textContent = 'Enviado ✓';
    } else {
      throw new Error('Falha no envio');
    }
  } catch (err) {
    if (status) { status.textContent = 'Não foi possível enviar agora. Tente novamente ou escreva para contato@novratech.com.br.'; status.className = 'cta__form-note is-error'; }
    if (label) label.textContent = prevLabel || 'Enviar mensagem';
  } finally {
    btn?.removeAttribute('disabled');
    setTimeout(() => { if (label && label.textContent === 'Enviado ✓') label.textContent = prevLabel || 'Enviar mensagem'; }, 4000);
  }
});

/* ------------------------------------------------------------------ */
/* Hero mouse parallax                                                */
/* ------------------------------------------------------------------ */
if (isFinePointer && !prefersReduced) {
  const hero = document.getElementById('topo');
  const items = hero ? [...hero.querySelectorAll('[data-parallax]')] : [];
  if (items.length) {
    let px = 0, py = 0, cx = 0, cy = 0;
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width - 0.5;
      py = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener('pointerleave', () => { px = 0; py = 0; });
    const loop = () => {
      cx += (px - cx) * 0.06; cy += (py - cy) * 0.06;
      items.forEach((el) => {
        const d = parseFloat(el.dataset.parallax || '0.05');
        el.style.translate = `${cx * d * 100}px ${cy * d * 100}px`;
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

/* ------------------------------------------------------------------ */
/* Scroll-velocity skew (kinetic statement)                           */
/* ------------------------------------------------------------------ */
(() => {
  const els = document.querySelectorAll('[data-velocity]');
  if (!els.length || prefersReduced) return;
  let target = 0, current = 0;
  const apply = (v) => { target = Math.max(-7, Math.min(7, v * 0.5)); };
  if (lenis) {
    lenis.on('scroll', ({ velocity }) => apply(velocity || 0));
  } else {
    let last = window.scrollY, lt = performance.now();
    window.addEventListener('scroll', () => {
      const n = window.scrollY, t = performance.now();
      apply(((n - last) / Math.max(1, t - lt)) * 16);
      last = n; lt = t;
    }, { passive: true });
  }
  const loop = () => {
    current += (target - current) * 0.1;
    target *= 0.9;
    const v = current.toFixed(2) + 'deg';
    els.forEach((el) => el.style.setProperty('--skew', v));
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();

/* ------------------------------------------------------------------ */
/* Full-bleed band parallax                                           */
/* ------------------------------------------------------------------ */
if (!prefersReduced) {
  const bands = document.querySelectorAll('[data-band-parallax]');
  if (bands.length) {
    const update = () => {
      bands.forEach((img) => {
        const sec = img.closest('section');
        if (!sec) return;
        const r = sec.getBoundingClientRect();
        if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
        const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        img.style.transform = `translateY(${-12 + progress * -10}%)`;
      });
    };
    if (lenis) lenis.on('scroll', update);
    else window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
}

/* ------------------------------------------------------------------ */
/* Hero background — WebGL liquid aurora (brand plasma)               */
/* ------------------------------------------------------------------ */
(() => {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const reveal = () => requestAnimationFrame(() => canvas.classList.add('is-ready'));

  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false })
    || canvas.getContext('experimental-webgl');
  if (!gl) { fallback2D(canvas); reveal(); return; }

  const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;
  const FRAG = `
  precision highp float;
  uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse;
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
  float noise(vec2 p){
    vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y);
  }
  float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<6;i++){ v+=a*noise(p); p=p*2.0+vec2(3.1,1.7); a*=0.5; } return v; }
  void main(){
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    float asp = u_res.x / u_res.y;
    vec2 p = vec2(uv.x*asp, uv.y);
    float t = u_time * 0.045;
    vec2 q = vec2(fbm(p*1.6 + vec2(0.0,t)), fbm(p*1.6 + vec2(5.2,-t)));
    vec2 r = vec2(fbm(p*1.8 + 2.0*q + vec2(1.7,9.2) + t*0.6),
                  fbm(p*1.8 + 2.0*q + vec2(8.3,2.8) - t*0.4));
    float n = fbm(p*2.2 + 2.4*r);
    vec2 m = vec2(u_mouse.x*asp, u_mouse.y);
    float md = distance(p, m);
    float mglow = smoothstep(0.55, 0.0, md) * 0.35;
    n += mglow;
    vec3 navy = vec3(0.012,0.020,0.047);
    vec3 blue = vec3(0.045,0.21,0.86);
    vec3 cyan = vec3(0.0,0.78,1.0);
    vec3 col = mix(navy, blue, smoothstep(0.28,0.62,n));
    col = mix(col, cyan, smoothstep(0.60,0.96,n));
    col += cyan * mglow * 0.5;
    float vig = smoothstep(1.25, 0.25, length(uv-0.5));
    col *= 0.55 + 0.45*vig;
    col *= 0.92 + 0.08*sin(u_time*0.5);
    gl_FragColor = vec4(col, 1.0);
  }`;

  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { fallback2D(canvas); reveal(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { fallback2D(canvas); reveal(); return; }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  let mx = 0.5, my = 0.55, tmx = 0.5, tmy = 0.55;
  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  window.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    tmx = (e.clientX - rect.left) / rect.width;
    tmy = 1.0 - (e.clientY - rect.top) / rect.height;
  });
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(resize, 150); });
  resize();

  const t0 = performance.now ? performance.now() : 0;
  let running = false, rafId = null;
  function render(now) {
    if (!running) return;
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
    gl.uniform1f(uTime, ((now || 0) - t0) / 1000);
    gl.uniform2f(uMouse, mx, my);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    rafId = requestAnimationFrame(render);
  }
  function start() { if (!running) { running = true; rafId = requestAnimationFrame(render); } }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); }

  reveal();
  if (prefersReduced) {
    gl.uniform1f(uTime, 12.0); gl.uniform2f(uMouse, 0.5, 0.55);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  } else if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => entries.forEach((e) => (e.isIntersecting ? start() : stop())),
      { threshold: 0 }).observe(canvas);
  } else { start(); }

  function fallback2D(cv) {
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const draw = () => {
      const rect = cv.getBoundingClientRect();
      cv.width = rect.width; cv.height = rect.height;
      const g = ctx.createRadialGradient(rect.width*0.5, rect.height*0.4, 0, rect.width*0.5, rect.height*0.4, rect.width*0.7);
      g.addColorStop(0, 'rgba(46, 107, 255,0.35)'); g.addColorStop(0.5, 'rgba(0,120,220,0.12)'); g.addColorStop(1, 'rgba(5,7,14,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,rect.width,rect.height);
    };
    draw(); window.addEventListener('resize', draw);
  }
})();
