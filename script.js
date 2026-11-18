/* GCNN 2027 — interactions */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Sticky header shadow */
  var hdr = $('#hdr');
  var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Mobile menu */
  var burger = $('#burger');
  var setMenu = function (open) {
    if (open) document.documentElement.style.setProperty('--navtop', hdr.getBoundingClientRect().bottom + 'px');
    document.body.classList.toggle('nav-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', function () { setMenu(!document.body.classList.contains('nav-open')); });
  $$('#menu a, #menu [data-brochure]').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* Nav dropdowns */
  var items = $$('.nav__item');
  var closeAll = function (except) {
    items.forEach(function (it) {
      if (it === except) return;
      it.classList.remove('is-open');
      var b = $('.nav__btn', it); if (b) b.setAttribute('aria-expanded', 'false');
    });
  };
  items.forEach(function (it) {
    var b = $('.nav__btn', it); if (!b || !$('.nav__menu', it)) return;
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !it.classList.contains('is-open');
      closeAll(it); it.classList.toggle('is-open', open); b.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav__item')) closeAll(); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var o = $('.nav__item.is-open'); if (o) { closeAll(); $('.nav__btn', o).focus(); }
  });

  /* Header search: jump to a page by name, otherwise search the topic index */
  var pages = $$('#pagelist option').map(function (o) { return { t: o.value.toLowerCase(), u: o.getAttribute('data-url') }; });
  $$('[data-hsearch]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      var q = $('input', f).value.trim().toLowerCase();
      if (!q) { e.preventDefault(); $('input', f).focus(); return; }
      var hit = pages.filter(function (p) { return p.t === q; })[0] || pages.filter(function (p) { return p.t.indexOf(q) > -1; })[0];
      if (hit) { e.preventDefault(); location.href = hit.u; }
    });
  });

  /* Deadline tickers in the top strip (abstracts + early bird) */
  $$('[data-eb]').forEach(function (eb) {
    var end = Date.parse(eb.getAttribute('data-eb'));
    var p2 = function (n) { return (n < 10 ? '0' : '') + n; };
    var cells = {};
    $$('[data-u]', eb).forEach(function (b) { cells[b.getAttribute('data-u')] = b; });
    var put = function (k, v) {
      var c = cells[k];
      if (c.textContent === v) return;
      c.textContent = v;
      c.classList.toggle('tick', false); void c.offsetWidth; c.classList.toggle('tick', true);
    };
    var start = Date.parse('2026-09-01T00:00:00+02:00');
    var bar = document.createElement('span'); bar.className = 'dl2__bar'; bar.setAttribute('aria-hidden', 'true');
    var fill = document.createElement('i'); bar.appendChild(fill); eb.appendChild(bar);
    var run = function () {
      var r = Math.max(0, end - Date.now());
      fill.style.setProperty('--p', Math.min(100, Math.max(0, (Date.now() - start) / (end - start) * 100)).toFixed(2) + '%');
      put('d', p2(Math.floor(r / 864e5))); put('h', p2(Math.floor(r / 36e5) % 24));
      put('m', p2(Math.floor(r / 6e4) % 60)); put('s', p2(Math.floor(r / 1e3) % 60));
      if (!r) eb.classList.add('is-over');
    };
    run(); setInterval(run, 1000);
  });

  /* dl2-marquee: deadline pills travel one behind the other */
  $$('.dl2-wrap').forEach(function (w) {
    var pills = $$('.dl2', w);
    if (!pills.length) return;
    var track = document.createElement('div'); track.className = 'dl2-track';
    var half = document.createElement('div'); half.className = 'dl2-half';
    pills.forEach(function (p) { half.appendChild(p); });
    var sep = w.querySelector('.dl2__sep'); if (sep) sep.hidden = true;
    var copy = half.cloneNode(true); copy.setAttribute('aria-hidden', 'true');
    $$('a', copy).forEach(function (x) { x.tabIndex = -1; });
    track.appendChild(half); track.appendChild(copy); w.appendChild(track);
    var src = $$('[data-u]', half), dst = $$('[data-u]', copy);
    var srcBars = $$('.dl2__bar i', half), dstBars = $$('.dl2__bar i', copy);
    setInterval(function () {
      src.forEach(function (s, k) { if (dst[k].textContent !== s.textContent) dst[k].textContent = s.textContent; });
      srcBars.forEach(function (s, k) { if (dstBars[k]) dstBars[k].style.cssText = s.style.cssText; });
    }, 500);
  });

  /* Hero: rotating particle "brain" sphere on canvas */
  var hpc = $('.hp__canvas');
  if (hpc && hpc.getContext) {
    var ctx = hpc.getContext('2d'), DPR = Math.min(2, window.devicePixelRatio || 1);
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var N = window.innerWidth < 700 ? 340 : 620, pts = [], links = [], pulses = [];
    var golden = Math.PI * (3 - Math.sqrt(5));
    for (var k = 0; k < N; k++) {
      var y = 1 - (k / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * k;
      // squash into two "hemispheres" with a soft central fissure for a brain-like silhouette
      var x = Math.cos(th) * r, z = Math.sin(th) * r;
      x *= 1.18; y *= 0.86; x += x > 0 ? 0.06 : -0.06;
      var bump = 1 + 0.06 * Math.sin(th * 7) * Math.cos(y * 9);
      pts.push([x * bump, y * bump, z * bump]);
    }
    for (var i = 0; i < N; i++) {
      var best = [];
      for (var j = 0; j < N; j++) {
        if (i === j) continue;
        var dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], dz = pts[i][2] - pts[j][2], d = dx * dx + dy * dy + dz * dz;
        if (best.length < 3) { best.push([d, j]); best.sort(function (m, n) { return m[0] - n[0]; }); }
        else if (d < best[2][0]) { best[2] = [d, j]; best.sort(function (m, n) { return m[0] - n[0]; }); }
      }
      best.forEach(function (b) { if (i < b[1]) links.push([i, b[1]]); });
    }
    var W = 0, H = 0, rotY = 0, tiltX = -0.25, mx = 0, my = 0, tx = 0, ty = 0, vis = true, last = 0;
    var size = function () {
      var b = hpc.getBoundingClientRect(); W = b.width; H = b.height;
      hpc.width = Math.round(W * DPR); hpc.height = Math.round(H * DPR); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    size(); window.addEventListener('resize', size);
    var stage = hpc.parentNode;
    stage.addEventListener('pointermove', function (e) {
      var b = stage.getBoundingClientRect();
      mx = ((e.clientX - b.left) / b.width - 0.5); my = ((e.clientY - b.top) / b.height - 0.5);
    });
    stage.addEventListener('pointerleave', function () { mx = my = 0; });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(hpc);
    var proj = new Array(N);
    var frame = function (now) {
      if (!still) requestAnimationFrame(frame);
      if (!vis && !still) return;
      var dt = Math.min(50, now - (last || now)); last = now;
      rotY += dt * 0.00018; tx += (mx * 0.6 - tx) * 0.05; ty += (my * 0.4 - ty) * 0.05;
      var R = Math.min(W, H) * 0.36, cx = W / 2, cy = H / 2;
      var cyA = Math.cos(rotY + tx), syA = Math.sin(rotY + tx), cxA = Math.cos(tiltX + ty), sxA = Math.sin(tiltX + ty);
      for (var i = 0; i < N; i++) {
        var p = pts[i], x1 = p[0] * cyA - p[2] * syA, z1 = p[0] * syA + p[2] * cyA;
        var y1 = p[1] * cxA - z1 * sxA, z2 = p[1] * sxA + z1 * cxA;
        var s = 1 / (1.9 - z2 * 0.55);
        proj[i] = [cx + x1 * R * s * 1.4, cy + y1 * R * s * 1.4, z2, s];
      }
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 0.7;
      for (var l = 0; l < links.length; l++) {
        var A = proj[links[l][0]], B = proj[links[l][1]], depth = (A[2] + B[2]) / 2;
        var al = 0.05 + (depth + 1) * 0.12;
        ctx.strokeStyle = 'rgba(28,36,48,' + (al * 0.9).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      }
      for (var q = 0; q < N; q++) {
        var P = proj[q], z = (P[2] + 1) / 2, rad = 0.6 + z * 1.9;
        ctx.fillStyle = z > 0.62 ? 'rgba(138,106,59,' + (0.4 + z * 0.55).toFixed(2) + ')' : 'rgba(28,36,48,' + (0.15 + z * 0.55).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(P[0], P[1], rad, 0, 6.283); ctx.fill();
      }
      if (!still && Math.random() < 0.22 && pulses.length < 26) pulses.push({ l: links[(Math.random() * links.length) | 0], t: 0, hop: 0 });
      for (var u = pulses.length - 1; u >= 0; u--) {
        var pu = pulses[u]; pu.t += dt * 0.0028;
        if (pu.t >= 1) {
          if (pu.hop < 4) {
            var end = pu.l[1], nxt = links.filter(function (L) { return L[0] === end || L[1] === end; });
            var n = nxt[(Math.random() * nxt.length) | 0];
            pu.l = n[0] === end ? n : [n[1], n[0]]; pu.t = 0; pu.hop++;
          } else { pulses.splice(u, 1); continue; }
        }
        var S = proj[pu.l[0]], E = proj[pu.l[1]], px = S[0] + (E[0] - S[0]) * pu.t, py = S[1] + (E[1] - S[1]) * pu.t;
        var g = ctx.createRadialGradient(px, py, 0, px, py, 7);
        g.addColorStop(0, 'rgba(138,106,59,1)'); g.addColorStop(1, 'rgba(200,173,132,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 7, 0, 6.283); ctx.fill();
      }
    };
    requestAnimationFrame(frame);
    if (still) {
      setTimeout(function () { size(); requestAnimationFrame(frame); }, 400);
      window.addEventListener('resize', function () { requestAnimationFrame(frame); });
    }
  }

  /* Countdown to 22 June 2027, 09:00 Prague time */
  var target = Date.parse('2027-06-22T09:00:00+02:00');
  var cd = $('#cd-d');
  if (cd) {
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var tick = function () {
      var t = Math.max(0, target - Date.now());
      cd.textContent = Math.floor(t / 864e5);
      $('#cd-h').textContent = pad(Math.floor(t / 36e5) % 24);
      $('#cd-m').textContent = pad(Math.floor(t / 6e4) % 60);
    };
    tick(); setInterval(tick, 30000);
  }
  $$('[data-due]').forEach(function (el) {
    var n = Math.ceil((Date.parse(el.getAttribute('data-due') + 'T23:59:59+01:00') - Date.now()) / 864e5);
    var tag = $('[data-left]', el);
    tag.textContent = n < 0 ? 'Closed' : n === 0 ? 'Today' : n + (n === 1 ? ' day left' : ' days left');
  });

  /* Tracks explorer (WAI-ARIA tabs) */
  $$('.tx__tabs').forEach(function (list) {
    var tabs = $$('[role=tab]', list);
    var sel = function (t, focus) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) t.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === 'Home') n = tabs[0];
        if (e.key === 'End') n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); sel(n, true); }
      });
    });
  });

  /* Featured speakers spotlight: tabs + auto-advance every 6 s */
  $$('[data-sv]').forEach(function (sv) {
    var tabs = $$('[role=tab]', sv), cur = 0, timer = null;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var sel = function (i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (x, k) {
        var on = k === cur;
        x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tabs[cur].focus();
    };
    var go = function () { if (still) return; clearInterval(timer); timer = setInterval(function () { if (!sv.hasAttribute('data-paused') && !document.hidden) sel(cur + 1); }, 6000); };
    tabs.forEach(function (x, k) {
      x.addEventListener('click', function () { sel(k); go(); });
      x.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = k + 1;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = k - 1;
        if (n !== null) { e.preventDefault(); sel(n, true); go(); }
      });
    });
    sv.addEventListener('mouseenter', function () { sv.setAttribute('data-paused', ''); });
    sv.addEventListener('mouseleave', function () { sv.removeAttribute('data-paused'); });
    go();
  });

  /* Speakers accordion: hover/focus/click expands a portrait; auto-advances */
  $$('[data-ac8]').forEach(function (box) {
    var items = $$('.ac8__item', box), cur = 0, hold = false;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var open = function (i) {
      cur = (i + items.length) % items.length;
      items.forEach(function (it, k) { it.classList.toggle('is-on', k === cur); it.setAttribute('aria-expanded', String(k === cur)); });
    };
    items.forEach(function (it, k) {
      it.addEventListener('mouseenter', function () { if (window.innerWidth > 1080) open(k); });
      it.addEventListener('focus', function () { open(k); });
      it.addEventListener('click', function () { open(k); });
      it.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); items[(k + 1) % items.length].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); items[(k - 1 + items.length) % items.length].focus(); }
      });
    });
    box.addEventListener('mouseenter', function () { hold = true; });
    box.addEventListener('mouseleave', function () { hold = false; });
    if (!still) setInterval(function () { if (!hold && !document.hidden) open(cur + 1); }, 4500);
  });

  /* Tracks: vertical scroll drives a pinned horizontal gallery (desktop) */
  $$('[data-hs]').forEach(function (hs) {
    var pin = $('.hs__pin', hs), track = $('.hs__track', hs);
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var dist = 0, ticking = false;
    var layout = function () {
      var desktop = window.innerWidth > 1080 && !still;
      hs.classList.toggle('is-static', !desktop);
      if (!desktop) { hs.style.removeProperty('--hs-h'); track.style.transform = ''; return; }
      var top = (document.getElementById('hdr') || {}).offsetHeight || 90;
      top = Math.min(top, 120);
      hs.style.setProperty('--hs-top', top + 'px');
      dist = Math.max(0, track.scrollWidth - pin.clientWidth);
      hs.style.setProperty('--hs-h', (pin.clientHeight + dist) + 'px');
      update();
    };
    var update = function () {
      ticking = false;
      if (hs.classList.contains('is-static')) return;
      var r = hs.getBoundingClientRect(), top = parseFloat(getComputedStyle(hs).getPropertyValue('--hs-top')) || 90;
      var prog = Math.min(1, Math.max(0, (top - r.top) / Math.max(1, dist)));
      track.style.transform = 'translate3d(' + (-prog * dist).toFixed(1) + 'px,0,0)';
      hs.style.setProperty('--hs-p', (prog * 100).toFixed(1) + '%');
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', layout);
    window.addEventListener('load', layout);
    layout();
  });

  /* Speakers index: floating portrait follows the cursor over each row */
  $$('[data-sx]').forEach(function (sx) {
    var fl = $('.sx__float', sx), im = $('img', fl), x = 0, y = 0, cx = 0, cy = 0, raf = null;
    var loop = function () { cx += (x - cx) * 0.18; cy += (y - cy) * 0.18; fl.style.left = cx + 'px'; fl.style.top = cy + 'px'; raf = requestAnimationFrame(loop); };
    $$('.sx__row', sx).forEach(function (r) {
      r.addEventListener('mouseenter', function (e) {
        var src = r.getAttribute('data-img');
        if (!src) { fl.classList.remove('is-on'); return; }
        im.src = src; fl.classList.add('is-on');
        if (!raf) { cx = x = e.clientX + 170; cy = y = e.clientY; loop(); }
      });
      r.addEventListener('mousemove', function (e) { x = e.clientX + 170; y = e.clientY; });
    });
    sx.addEventListener('mouseleave', function () { fl.classList.remove('is-on'); cancelAnimationFrame(raf); raf = null; });
  });

  /* Prefetch internal pages on hover so clicks open instantly */
  var seen = {};
  document.addEventListener('pointerover', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="/"]');
    if (!a || a.target || seen[a.pathname]) return;
    seen[a.pathname] = 1;
    var l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.pathname; document.head.appendChild(l);
  }, { passive: true });

  /* Local-preview forms */
  $$('form[data-local]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = $('.fok', f); if (ok) { ok.hidden = false; ok.scrollIntoView({ block: 'nearest' }); }
    });
  });

  /* Chip filters + search */
  $$('[data-filterable]').forEach(function (root) {
    var chips = $$('[data-filter]', root), input = $('[data-search]', root), empty = $('[data-empty]', root);
    var groups = $$('[data-group]', root), cur = '';
    var norm = function (t) { return t.toLowerCase().replace(/[‘’']/g, '').replace(/[^a-z0-9]+/g, ' '); };
    var apply = function () {
      var words = input ? norm(input.value).split(' ').filter(Boolean) : [], any = false;
      var test = function (el) {
        var t = ' ' + norm(el.textContent) + ' ';
        return words.every(function (w) { return t.indexOf(w) > -1 || (w.length > 4 && t.indexOf(w.replace(/(ies|es|s|ing|ed)$/, '')) > -1); });
      };
      if (groups.length) {
        groups.forEach(function (g) {
          var inCat = !cur || g.getAttribute('data-group') === cur, its = $$('[data-item]', g), shown = 0;
          its.forEach(function (it) { var hit = inCat && test(it); it.hidden = !hit; if (hit) shown++; });
          var has = its.length ? shown > 0 : inCat;
          g.hidden = !has; if (has) any = true;
        });
      } else {
        $$('[data-item]', root).forEach(function (it) { var hit = test(it); it.hidden = !hit; if (hit) any = true; });
      }
      if (empty) empty.hidden = any;
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        cur = c.getAttribute('data-filter');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        apply();
      });
    });
    if (input) {
      input.addEventListener('input', apply);
      var q0 = new URLSearchParams(location.search).get('q');
      if (q0) { input.value = q0; apply(); }
    }
  });

  /* Gallery */
  $$('[data-more]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.ph-i[hidden]', b.closest('.ged')).forEach(function (p) { p.hidden = false; });
      b.parentNode.hidden = true;
    });
  });
  var lb = $('#lb');
  if (lb) {
    var img = $('img', lb), cap = $('p', lb), list = [], at = 0;
    var show = function (i) {
      at = (i + list.length) % list.length;
      var p = list[at]; img.src = p.getAttribute('data-full'); img.alt = $('img', p).alt;
      cap.textContent = (at + 1) + ' / ' + list.length + '  ·  ' + p.getAttribute('data-cap');
    };
    $$('.ph-i').forEach(function (p) {
      p.addEventListener('click', function () { list = $$('.ph-i', p.closest('.ged')); show(list.indexOf(p)); if (lb.showModal) lb.showModal(); });
    });
    $('[data-prev]', lb).addEventListener('click', function () { show(at - 1); });
    $('[data-next]', lb).addEventListener('click', function () { show(at + 1); });
    $('[data-close]', lb).addEventListener('click', function () { lb.close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(at - 1); if (e.key === 'ArrowRight') show(at + 1); });
  }

  /* Registration total */
  var reg = $('[data-reg]');
  if (reg) {
    var q = new URLSearchParams(location.search).get('category');
    if (q) { var pre = $('[name=cat][value="' + q + '"]', reg); if (pre) pre.checked = true; }
    var money = function (n) { return '$' + n.toLocaleString('en-US'); };
    var calc = function () {
      var mode = $('[name=mode]:checked', reg).value;
      $$('.opt[data-mode]', reg).forEach(function (o) { o.hidden = o.getAttribute('data-mode') !== mode; });
      var cat = $('[name=cat]:checked', reg);
      if (cat.closest('.opt').hidden) { cat = $('.opt[data-mode="' + mode + '"] input', reg); cat.checked = true; }
      var inP = mode === 'in';
      $$('[data-inperson]', reg).forEach(function (x) { x.hidden = !inP; });
      var room = $('[name=room]:checked', reg), ppl = +reg.people.value, gst = inP ? +reg.guests.value : 0;
      var nights = Math.max(0, reg.checkout.value - reg.checkin.value), hasRoom = inP && room.value !== 'none';
      $('[data-dates]', reg).hidden = !hasRoom;
      var price = +cat.getAttribute('data-price');
      var total = price * ppl + (hasRoom ? room.getAttribute('data-price') * nights : 0) + gst * 150;
      $('[data-o=mode]', reg).textContent = inP ? 'In-Person' : 'Virtual';
      $('[data-o=type]', reg).textContent = cat.getAttribute('data-label');
      $('[data-o=reg]', reg).textContent = money(price) + ' × ' + ppl;
      $('[data-o=room]', reg).textContent = hasRoom ? room.getAttribute('data-label') + ', ' + nights + ' night' + (nights === 1 ? '' : 's') : 'None';
      $('[data-o=guests]', reg).textContent = gst ? gst + ' × $150' : '0';
      $('[data-o=total]', reg).textContent = money(total);
      $('[data-paybtn]', reg).textContent = 'Proceed to pay ' + money(total);
    };
    reg.addEventListener('change', calc); calc();
  }

  /* Reveal on scroll */
  var rv = $$('.rv');
  if (!('IntersectionObserver' in window) || location.search.indexOf('noreveal') > -1) {
    rv.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { io.observe(el); });
  }

  /* Brochure dialog */
  var dlg = $('#brochure');
  $$('[data-brochure]').forEach(function (b) { b.addEventListener('click', function () { if (dlg.showModal) dlg.showModal(); }); });
  $('[data-close]', dlg).addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
})();
