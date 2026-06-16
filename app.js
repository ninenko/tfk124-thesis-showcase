/* TFK-124 kiosk — vanilla JS, офлайн. Данные из window.THESIS_DATA (data/data.js). */
(function () {
  "use strict";
  var D = window.THESIS_DATA;
  if (!D) { document.body.innerHTML = "<p style='padding:40px'>Нет данных (data/data.js).</p>"; return; }

  var facetLabel = {};
  D.facets.forEach(function (f) { facetLabel[f.id] = f.label; });

  var bySlug = {};
  D.theses.forEach(function (t) { bySlug[t.slug] = t; });

  var state = { type: null, value: null };  // type: 'tag' | 'facet' | null

  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };

  /* ---------- hero ---------- */
  $("heroSub").innerHTML = "<b>TFK-124</b> · " + D.university +
    " · " + D.theses.length + " выпускных работ";

  /* ---------- tag cloud ---------- */
  function weightClass(w) { return w >= 3 ? "w3" : (w === 2 ? "w2" : "w1"); }
  (function renderCloud() {
    var box = $("cloud");
    var cloud = D.cloud.slice();
    // лёгкое перемешивание для «облачного» вида, но крупные — ближе к центру
    cloud.sort(function () { return Math.random() - 0.5; });
    cloud.sort(function (a, b) { return b.weight - a.weight; });
    var order = [];
    // чередуем: крупные в середину
    cloud.forEach(function (c, i) { (i % 2 ? order.push : order.unshift).call(order, c); });
    order.forEach(function (c) {
      var b = el("button", "cloud-tag " + weightClass(c.weight), c.tag);
      b.onclick = function () { setFilter("tag", c.tag); };
      box.appendChild(b);
    });
  })();

  /* ---------- facets ---------- */
  (function renderFacets() {
    var box = $("facets");
    D.facets.filter(function (f) { return f.count > 0; })
      .sort(function (a, b) { return b.count - a.count; })
      .forEach(function (f) {
        var b = el("button");
        b.appendChild(document.createTextNode(f.label));
        var c = el("span", "cnt", "" + f.count);
        b.appendChild(c);
        b.onclick = function () { setFilter("facet", f.id); };
        box.appendChild(b);
      });
  })();

  /* ---------- names ---------- */
  (function renderNames() {
    var box = $("names");
    D.theses.slice().sort(function (a, b) {
      return a.student.localeCompare(b.student, "ru");
    }).forEach(function (t) {
      var b = el("button", null, t.student);
      b.onclick = function () { openDetail(t.slug); };
      box.appendChild(b);
    });
  })();

  /* ---------- filtering + cards ---------- */
  function matches(t) {
    if (!state.type) return true;
    if (state.type === "tag") return t.tags.indexOf(state.value) !== -1;
    if (state.type === "facet") return t.facets.indexOf(state.value) !== -1;
    return true;
  }

  function renderCards() {
    var box = $("cards"); box.innerHTML = "";
    var list = D.theses.filter(matches).sort(function (a, b) {
      return a.student.localeCompare(b.student, "ru");
    });
    $("count").textContent = list.length === D.theses.length
      ? "Все работы: " + list.length
      : "Найдено работ: " + list.length;
    list.forEach(function (t) {
      var card = el("button", "card");
      card.appendChild(el("div", "card-name", t.student));
      card.appendChild(el("div", "card-title", t.title || ""));
      var chips = el("div", "card-chips");
      t.facets.forEach(function (fid) {
        chips.appendChild(el("span", "chip", facetLabel[fid] || fid));
      });
      card.appendChild(chips);
      card.onclick = function () { openDetail(t.slug); };
      box.appendChild(card);
    });
  }

  function setFilter(type, value) {
    state = { type: type, value: value };
    var bar = $("filterbar");
    bar.classList.add("active");
    $("filtertext").innerHTML = (type === "tag" ? "Тема: " : "Раздел: ") +
      "<b>" + (type === "facet" ? (facetLabel[value] || value) : value) + "</b>";
    renderCards();
    document.querySelector(".count").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearFilter() {
    state = { type: null, value: null };
    $("filterbar").classList.remove("active");
    renderCards();
  }
  $("clearFilter").onclick = clearFilter;

  /* ---------- view toggle ---------- */
  var tabs = document.querySelectorAll(".toggle button");
  tabs.forEach(function (btn) {
    btn.onclick = function () {
      tabs.forEach(function (b) { b.setAttribute("aria-selected", "false"); });
      btn.setAttribute("aria-selected", "true");
      ["cloud", "facets", "names"].forEach(function (v) {
        $("panel-" + v).classList.toggle("active", v === btn.dataset.view);
      });
    };
  });

  /* ---------- detail ---------- */
  function openDetail(slug) {
    var t = bySlug[slug]; if (!t) return;
    var d = $("detail"); d.innerHTML = "";
    d.appendChild(el("p", "d-kicker", "Выпускная квалификационная работа · TFK-124 · 2026"));
    d.appendChild(el("h2", "d-name", t.student));
    if (t.title) d.appendChild(el("p", "d-title", t.title));
    if (t.abstract) d.appendChild(el("p", "d-abstract", t.abstract));
    if (t.tags && t.tags.length) {
      var tags = el("div", "d-tags");
      t.tags.forEach(function (tg) {
        var c = el("span", "chip", tg);
        c.style.cursor = "pointer";
        c.onclick = function () { closeDetail(); setFilter("tag", tg); };
        tags.appendChild(c);
      });
      d.appendChild(tags);
    }
    var a = el("a", "d-pdf", "Открыть полный текст (PDF)");
    a.href = t.pdf; a.target = "_blank"; a.rel = "noopener";
    d.appendChild(a);
    $("overlay").classList.add("active");
    $("overlay").scrollTop = 0;
  }
  function closeDetail() { $("overlay").classList.remove("active"); }
  $("closeDetail").onclick = closeDetail;

  /* ---------- kiosk layer ---------- */
  function goHome() {
    closeDetail();
    clearFilter();
    tabs[0].click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  // idle-reset 60s
  var idleTimer = null;
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goHome, 60000);
  }
  ["click", "mousemove", "keydown", "wheel", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, resetIdle, { passive: true });
  });
  resetIdle();

  // Fullscreen + Wake Lock по первому клику (требуют жеста пользователя)
  var activated = false;
  document.addEventListener("click", function firstGesture() {
    if (activated) return; activated = true;
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
    if (navigator.wakeLock && navigator.wakeLock.request) {
      var relock = function () {
        navigator.wakeLock.request("screen").catch(function () {});
      };
      relock();
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") relock();
      });
    }
  });

  // Esc закрывает деталь
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDetail();
  });

  /* ---------- init ---------- */
  renderCards();
})();
