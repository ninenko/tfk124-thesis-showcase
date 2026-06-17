/* TFK-124 kiosk — vanilla JS, офлайн. Данные из window.THESIS_DATA (data/data.js). */
(function () {
  "use strict";
  var D = window.THESIS_DATA;
  if (!D) { document.body.innerHTML = "<p style='padding:40px'>Нет данных (data/data.js).</p>"; return; }

  var LANG = { ru: "русский", ky: "кыргызский", en: "английский" };
  var LANG_PREP = { ru: "русском", ky: "кыргызском", en: "английском" };

  var facetLabel = {};
  D.facets.forEach(function (f) { facetLabel[f.id] = f.label; });

  var bySlug = {};
  D.theses.forEach(function (t) { bySlug[t.slug] = t; });

  var state = { type: null, value: null };

  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };

  /* hero */
  $("heroSub").innerHTML = "<b>TFK-124</b> · " + D.university;

  /* облако тем */
  function weightClass(w) { return w >= 3 ? "w3" : (w === 2 ? "w2" : "w1"); }
  (function renderCloud() {
    var box = $("cloud");
    var cloud = D.cloud.slice();
    cloud.sort(function () { return Math.random() - 0.5; });
    cloud.sort(function (a, b) { return b.weight - a.weight; });
    var order = [];
    cloud.forEach(function (c, i) { (i % 2 ? order.push : order.unshift).call(order, c); });
    order.forEach(function (c) {
      var b = el("button", "cloud-tag " + weightClass(c.weight), c.tag);
      b.onclick = function () { setFilter("tag", c.tag); };
      box.appendChild(b);
    });
  })();

  /* фильтр + карточки */
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
      var top = el("div", "card-top");
      top.appendChild(el("span", "lang-tag lang-" + t.lang, LANG[t.lang] || t.lang));
      card.appendChild(top);
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
    $("filterbar").classList.add("active");
    $("filtertext").innerHTML = (type === "tag" ? "Тема: " : "Раздел: ") +
      "<b>" + (type === "facet" ? (facetLabel[value] || value) : value) + "</b>";
    renderCards();
    $("screen3").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearFilter() {
    state = { type: null, value: null };
    $("filterbar").classList.remove("active");
    renderCards();
  }
  $("clearFilter").onclick = clearFilter;

  /* деталь: введение с переводом */
  function buildIntro(t) {
    var wrap = el("div", "d-intro");
    var hasRu = t.intro_ru && t.intro_ru.length > 0;
    var nonRu = t.lang !== "ru" && hasRu;

    var head = el("div", "d-intro-head");
    head.appendChild(el("h3", "d-intro-title", "Введение"));
    head.appendChild(el("span", "lang-tag lang-" + t.lang, LANG[t.lang] || t.lang));
    wrap.appendChild(head);

    var note = el("p", "d-trnote");
    var body = el("p", "d-intro-body");
    var toggle = el("button", "d-trbtn");
    var showing = nonRu ? "ru" : "orig";

    function render() {
      if (!nonRu) {
        note.style.display = "none";
        toggle.style.display = "none";
        body.textContent = t.intro || "";
        return;
      }
      if (showing === "ru") {
        note.style.display = "";
        note.innerHTML = "⚙ Автоматический перевод на русский · оригинал на " +
          (LANG_PREP[t.lang] || t.lang) + " языке";
        body.textContent = t.intro_ru;
        toggle.textContent = "Показать оригинал введения (" + (LANG[t.lang] || t.lang) + ")";
      } else {
        note.style.display = "";
        note.innerHTML = "Оригинал введения на " + (LANG_PREP[t.lang] || t.lang) + " языке";
        body.textContent = t.intro;
        toggle.textContent = "← Показать перевод на русский";
      }
    }
    toggle.onclick = function () { showing = (showing === "ru" ? "orig" : "ru"); render(); };
    render();

    wrap.appendChild(note);
    if (nonRu) wrap.appendChild(toggle);
    wrap.appendChild(body);
    return wrap;
  }

  function openDetail(slug) {
    var t = bySlug[slug]; if (!t) return;
    var d = $("detail"); d.innerHTML = "";
    d.appendChild(el("p", "d-kicker", "Выпускная квалификационная работа · TFK-124 · 2026"));
    d.appendChild(el("h2", "d-name", t.student));
    if (t.title) d.appendChild(el("p", "d-title", t.title));

    if ((t.intro && t.intro.length) || (t.intro_ru && t.intro_ru.length)) {
      d.appendChild(buildIntro(t));
    } else if (t.abstract) {
      d.appendChild(el("p", "d-intro-body", t.abstract));
    }

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

  var hint = $("scrollHint");
  if (hint) hint.onclick = function () {
    $("screen2").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* киоск-слой */
  function goHome() {
    closeDetail();
    clearFilter();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  var idleTimer = null;
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goHome, 90000);
  }
  ["click", "mousemove", "keydown", "wheel", "touchstart"].forEach(function (ev) {
    document.addEventListener(ev, resetIdle, { passive: true });
  });
  resetIdle();

  var activated = false;
  document.addEventListener("click", function firstGesture() {
    if (activated) return; activated = true;
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(function () {});
    }
    if (navigator.wakeLock && navigator.wakeLock.request) {
      var relock = function () { navigator.wakeLock.request("screen").catch(function () {}); };
      relock();
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") relock();
      });
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDetail();
  });

  renderCards();
})();
