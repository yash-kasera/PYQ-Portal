/* =========================================================
   Sem 3 PYQ Portal — application
   ========================================================= */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var state = {
    roll: null,
    mode: "pyq",
    subject: "math",
    paper: "all",
    module: "all",
    topic: "all",
    status: "all",
    search: "",
    view: "all",
    index: 0,
    studyModule: null,
    progress: { solved: {}, remarks: {} }
  };

  /* =======================================================
     Markdown + LaTeX rendering
     Math is lifted out before Markdown runs so that markup
     like _ or * inside formulas is never mangled.
     ======================================================= */

  function renderRich(src) {
    if (!src) return "";
    var slots = [];

    // 1. protect fenced code
    var text = String(src).replace(/```[\s\S]*?```/g, function (m) {
      slots.push({ raw: m }); return "@@SLOT" + (slots.length - 1) + "@@";
    });

    // 2. protect display math, then inline math.
    // A display block may span lines but never a blank line — without that
    // guard, a stray "$$" in prose opens a match that runs away to the next
    // display block and swallows everything between.
    text = text.replace(/\$\$((?:(?!\n[ \t]*\n)[\s\S])+?)\$\$/g, function (m, inner) {
      slots.push({ math: inner, display: true }); return "@@SLOT" + (slots.length - 1) + "@@";
    });
    // The inner pattern allows a backslash-escaped character (notably \$, the
    // literal dollar used as an exponentiation operator in some DSA papers) so
    // that it does not prematurely close the span.
    text = text.replace(/\$((?:[^$\n\\]|\\.)+?)\$/g, function (m, inner) {
      slots.push({ math: inner, display: false }); return "@@SLOT" + (slots.length - 1) + "@@";
    });

    var html;
    try {
      html = window.marked.parse(text, { breaks: true, gfm: true });
    } catch (e) {
      html = "<p>" + text + "</p>";
    }

    // 3. put everything back
    html = html.replace(/@@SLOT(\d+)@@/g, function (m, i) {
      var slot = slots[+i];
      if (!slot) return "";
      if (slot.raw !== undefined) {
        try { return window.marked.parse(slot.raw); } catch (e) { return slot.raw; }
      }
      try {
        return window.katex.renderToString(slot.math, {
          displayMode: slot.display,
          throwOnError: false,
          strict: false,
          trust: true
        });
      } catch (e) {
        return '<code>' + slot.math.replace(/</g, "&lt;") + "</code>";
      }
    });

    return html;
  }

  /* =======================================================
     Progress storage
     ======================================================= */

  function progressKey() { return "pyq.progress." + state.roll; }

  function loadProgress() {
    try {
      var raw = JSON.parse(localStorage.getItem(progressKey()) || "{}");
      state.progress = { solved: raw.solved || {}, remarks: raw.remarks || {} };
    } catch (e) {
      state.progress = { solved: {}, remarks: {} };
    }
    syncDown();
  }

  var saveTimer = null;
  function saveProgress() {
    localStorage.setItem(progressKey(), JSON.stringify(state.progress));
    if (window.Auth.backend !== "supabase") return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      window.Auth.client
        .from("progress")
        .upsert({ roll: state.roll, data: state.progress, updated_at: new Date().toISOString() })
        .then(function () {}, function () {});
    }, 900);
  }

  function syncDown() {
    if (window.Auth.backend !== "supabase") return;
    window.Auth.client
      .from("progress").select("data").eq("roll", state.roll).maybeSingle()
      .then(function (res) {
        if (!res || !res.data || !res.data.data) return;
        var remote = res.data.data;
        // Union: nothing a student has marked is ever silently dropped.
        Object.keys(remote.solved || {}).forEach(function (k) { state.progress.solved[k] = true; });
        Object.keys(remote.remarks || {}).forEach(function (k) {
          if (!state.progress.remarks[k]) state.progress.remarks[k] = remote.remarks[k];
        });
        localStorage.setItem(progressKey(), JSON.stringify(state.progress));
        if (state.mode === "pyq") renderPyq();
        updateProgressBar();
      }, function () {});
  }

  /* =======================================================
     Data access
     ======================================================= */

  function subjectData(key) { return window.PYQ_DATA[key] || { papers: [], questions: [] }; }
  function syllabus(key) { return window.SYLLABUS[key]; }

  function topicName(subjectKey, topicId) {
    var s = syllabus(subjectKey);
    for (var i = 0; i < s.modules.length; i++) {
      var t = s.modules[i].topics.filter(function (x) { return x.id === topicId; })[0];
      if (t) return t.name;
    }
    return topicId;
  }

  function moduleName(subjectKey, n) {
    var m = syllabus(subjectKey).modules.filter(function (x) { return x.n === n; })[0];
    return m ? m.name : "Module " + n;
  }

  function paperLabel(subjectKey, paperId) {
    var p = subjectData(subjectKey).papers.filter(function (x) { return x.id === paperId; })[0];
    return p ? p.label : paperId;
  }

  function filtered() {
    var qs = subjectData(state.subject).questions.slice();
    if (state.paper !== "all") qs = qs.filter(function (q) { return q.paper === state.paper; });
    if (state.module !== "all") qs = qs.filter(function (q) { return String(q.module) === state.module; });
    if (state.topic !== "all") qs = qs.filter(function (q) { return (q.topics || []).indexOf(state.topic) !== -1; });
    if (state.status === "solved") qs = qs.filter(function (q) { return state.progress.solved[q.id]; });
    if (state.status === "unsolved") qs = qs.filter(function (q) { return !state.progress.solved[q.id]; });
    if (state.status === "remarked") qs = qs.filter(function (q) { return !!state.progress.remarks[q.id]; });
    if (state.search) {
      var needle = state.search.toLowerCase();
      qs = qs.filter(function (q) {
        return q.text.toLowerCase().indexOf(needle) !== -1 ||
               q.qno.toLowerCase().indexOf(needle) !== -1;
      });
    }
    return qs;
  }

  function solutionFor(id) {
    return (window.SOLUTIONS && window.SOLUTIONS[id]) || null;
  }

  /* =======================================================
     Login screen
     ======================================================= */

  function initAuthUI() {
    var formRoll = $("#form-roll"), formPass = $("#form-pass");
    var inRoll = $("#in-roll"), inPass = $("#in-pass"), inPass2 = $("#in-pass2");
    var errRoll = $("#err-roll"), errPass = $("#err-pass");
    var pendingRoll = null, registering = false;

    $("#auth-foot").textContent = window.Auth.backend === "supabase"
      ? "Accounts sync across your devices."
      : "Accounts are stored privately in this browser.";

    inRoll.addEventListener("input", function () {
      inRoll.value = inRoll.value.replace(/\D/g, "").slice(0, 2);
      errRoll.textContent = "";
    });

    formRoll.addEventListener("submit", function (e) {
      e.preventDefault();
      var roll = window.Auth.normalizeRoll(inRoll.value);
      if (!roll) {
        errRoll.textContent = "Enter a number between 01 and 78.";
        return;
      }
      pendingRoll = roll;
      errRoll.textContent = "";
      window.Auth.isRegistered(roll).then(function (exists) {
        registering = !exists;
        $("#who-roll").textContent = roll;
        $("#pass-note").textContent = exists
          ? "Welcome back. Enter your password to continue."
          : "This is your first visit. Create a password to set up your account.";
        $("#lbl-pass").textContent = exists ? "Password" : "Create a password";
        $("#confirm-block").hidden = exists;
        inPass.setAttribute("autocomplete", exists ? "current-password" : "new-password");
        $("#btn-pass-submit").textContent = exists ? "Sign in" : "Create account";
        formRoll.hidden = true;
        formPass.hidden = false;
        inPass.value = ""; inPass2.value = ""; errPass.textContent = "";
        inPass.focus();
      });
    });

    $("#btn-change-roll").addEventListener("click", function () {
      formPass.hidden = true;
      formRoll.hidden = false;
      inRoll.focus();
    });

    formPass.addEventListener("submit", function (e) {
      e.preventDefault();
      errPass.textContent = "";
      var pw = inPass.value;
      if (pw.length < 6) { errPass.textContent = "Password must be at least 6 characters."; return; }
      if (registering && pw !== inPass2.value) { errPass.textContent = "The two passwords do not match."; return; }

      var btn = $("#btn-pass-submit");
      btn.disabled = true;
      var work = registering
        ? window.Auth.signUp(pendingRoll, pw)
        : window.Auth.signIn(pendingRoll, pw);

      work.then(function (roll) {
        btn.disabled = false;
        startApp(roll);
      }, function (err) {
        btn.disabled = false;
        errPass.textContent = err.message || "Something went wrong. Please try again.";
      });
    });
  }

  /* =======================================================
     App shell
     ======================================================= */

  function startApp(roll) {
    state.roll = roll;
    $("#auth-screen").hidden = true;
    $("#app").hidden = false;
    $("#roll-chip").textContent = roll;
    loadProgress();
    buildSubjectList();
    buildFilters();
    render();
  }

  function buildSubjectList() {
    var holder = $("#subject-list");
    holder.innerHTML = "";
    window.SUBJECT_ORDER.forEach(function (key) {
      var s = syllabus(key);
      var count = subjectData(key).questions.length;
      var btn = document.createElement("button");
      btn.className = "subject-btn" + (key === state.subject ? " is-active" : "");
      btn.innerHTML = "<strong></strong><span></span>";
      $("strong", btn).textContent = s.short;
      $("span", btn).textContent = s.code + " · " + count + " questions";
      btn.addEventListener("click", function () {
        if (state.subject === key) return;
        state.subject = key;
        state.paper = "all"; state.module = "all"; state.topic = "all";
        state.index = 0; state.studyModule = null;
        buildSubjectList();
        buildFilters();
        render();
        closeSidebar();
        scrollToTop(); // a new subject always starts from the top
      });
      holder.appendChild(btn);
    });
  }

  function buildFilters() {
    var data = subjectData(state.subject);
    var syl = syllabus(state.subject);

    var selPaper = $("#sel-paper");
    selPaper.innerHTML = '<option value="all">All papers</option>';
    data.papers.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.id; o.textContent = p.label;
      selPaper.appendChild(o);
    });
    selPaper.value = state.paper;

    var selModule = $("#sel-module");
    selModule.innerHTML = '<option value="all">All modules</option>';
    syl.modules.forEach(function (m) {
      var o = document.createElement("option");
      o.value = String(m.n); o.textContent = "Module " + m.n + " — " + m.name;
      selModule.appendChild(o);
    });
    selModule.value = state.module;

    buildTopicSelect();
  }

  function buildTopicSelect() {
    var syl = syllabus(state.subject);
    var sel = $("#sel-topic");
    sel.innerHTML = '<option value="all">All topics</option>';
    var mods = state.module === "all"
      ? syl.modules
      : syl.modules.filter(function (m) { return String(m.n) === state.module; });
    mods.forEach(function (m) {
      var grp = document.createElement("optgroup");
      grp.label = "Module " + m.n;
      m.topics.forEach(function (t) {
        var o = document.createElement("option");
        o.value = t.id; o.textContent = t.name;
        grp.appendChild(o);
      });
      sel.appendChild(grp);
    });
    sel.value = state.topic;
    if (sel.value !== state.topic) { state.topic = "all"; sel.value = "all"; }
  }

  /* =======================================================
     Scrolling helpers
     ======================================================= */

  function scrollToTop(smooth) {
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  }

  function initScrollUI() {
    var btn = $("#btn-top");
    var ticking = false;

    function update() {
      var show = window.scrollY > 420;
      btn.hidden = false;
      btn.classList.toggle("show", show);
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    btn.addEventListener("click", function () { scrollToTop(true); });
    update();
  }

  /* =======================================================
     Source documents (the original scanned PDFs)
     ======================================================= */

  function resourceCard(res) {
    var a = document.createElement("a");
    a.className = "res-card";
    a.href = res.file;
    a.target = "_blank";
    a.rel = "noopener";
    a.innerHTML =
      '<span class="res-icon">PDF</span>' +
      '<span class="res-body"><span class="res-label"></span><span class="res-note"></span></span>' +
      '<span class="res-open">Open ↗</span>';
    $(".res-label", a).textContent = res.label;
    $(".res-note", a).textContent = res.note;
    return a;
  }

  function renderResources() {
    var R = window.RESOURCES || {};

    var pyqHolder = $("#pyq-resources");
    pyqHolder.innerHTML = "";
    var paper = (R.papers || {})[state.subject];
    if (paper) pyqHolder.appendChild(resourceCard(paper));

    var studyHolder = $("#study-resources");
    studyHolder.innerHTML = "";
    if (R.syllabus) studyHolder.appendChild(resourceCard(R.syllabus));
  }

  /* =======================================================
     Jump from a note's past-question link to the question bank
     ======================================================= */

  function jumpToQuestion(qid) {
    var q = subjectData(state.subject).questions.filter(function (x) { return x.id === qid; })[0];
    if (!q) return;

    // Clear any filter that would hide the target, and leave one-by-one view.
    state.mode = "pyq";
    state.view = "all";
    state.paper = "all";
    state.module = "all";
    state.topic = "all";
    state.status = "all";
    state.search = "";
    $("#in-search").value = "";
    $("#sel-status").value = "all";

    $$(".mode-btn").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-mode") === "pyq");
    });
    $$(".seg").forEach(function (b) {
      b.classList.toggle("is-active", b.getAttribute("data-view") === "all");
    });

    buildFilters();
    render();

    // The card exists only after render(), so locate it now.
    var card = document.getElementById("card-" + qid);
    if (!card) return;
    var sol = card.querySelector(".act-solution");
    if (sol && card.querySelector(".solution").hidden) sol.click();

    card.scrollIntoView({ behavior: "smooth", block: "center" });
    $$(".qcard.is-target").forEach(function (c) { c.classList.remove("is-target"); });
    // restart the animation reliably
    void card.offsetWidth;
    card.classList.add("is-target");
    setTimeout(function () { card.classList.remove("is-target"); }, 2200);
  }

  function updateProgressBar() {
    var all = subjectData(state.subject).questions;
    var done = all.filter(function (q) { return state.progress.solved[q.id]; }).length;
    var pct = all.length ? Math.round((done / all.length) * 100) : 0;
    $("#progress-fill").style.width = pct + "%";
    $("#progress-text").textContent = done + " of " + all.length + " marked solved (" + pct + "%)";
  }

  /* =======================================================
     Rendering — question bank
     ======================================================= */

  function questionCard(q, opts) {
    opts = opts || {};
    var card = document.createElement("article");
    card.className = "qcard" + (state.progress.solved[q.id] ? " is-solved" : "");
    card.id = "card-" + q.id;

    /* meta */
    var meta = document.createElement("div");
    meta.className = "qmeta";
    var bits = [
      { cls: "tag tag-q", text: q.qno },
      { cls: "tag", text: paperLabel(state.subject, q.paper) },
      { cls: "tag tag-mod", text: "Module " + q.module },
      { cls: "tag", text: q.marks + " marks" }
    ];
    if (q.co) bits.push({ cls: "tag", text: q.co });
    bits.forEach(function (b) {
      var el = document.createElement("span");
      el.className = b.cls; el.textContent = b.text;
      meta.appendChild(el);
    });
    (q.topics || []).forEach(function (t) {
      var el = document.createElement("span");
      el.className = "tag tag-topic";
      el.textContent = topicName(state.subject, t);
      meta.appendChild(el);
    });
    card.appendChild(meta);

    /* question text */
    var body = document.createElement("div");
    body.className = "qtext";
    body.innerHTML = renderRich(q.text);
    card.appendChild(body);

    if (q.unclear) {
      var flag = document.createElement("p");
      flag.className = "qflag";
      flag.textContent = "Scan note: " + q.unclear;
      card.appendChild(flag);
    }

    /* actions */
    var actions = document.createElement("div");
    actions.className = "qactions";

    var btnSol = document.createElement("button");
    btnSol.className = "act act-solution";
    btnSol.textContent = "See solution";
    actions.appendChild(btnSol);

    var btnSolved = document.createElement("button");
    btnSolved.className = "act" + (state.progress.solved[q.id] ? " is-on" : "");
    btnSolved.textContent = state.progress.solved[q.id] ? "✓ Solved" : "Mark as solved";
    actions.appendChild(btnSolved);

    var btnRemark = document.createElement("button");
    btnRemark.className = "act";
    btnRemark.textContent = state.progress.remarks[q.id] ? "Edit remark" : "Add remark";
    actions.appendChild(btnRemark);

    card.appendChild(actions);

    /* existing remark preview */
    var preview = document.createElement("div");
    preview.className = "remark-preview";
    preview.hidden = !state.progress.remarks[q.id];
    preview.textContent = state.progress.remarks[q.id] || "";
    card.appendChild(preview);

    /* solution panel */
    var solPanel = document.createElement("div");
    solPanel.className = "solution";
    solPanel.hidden = true;
    card.appendChild(solPanel);

    var solLoaded = false;
    btnSol.addEventListener("click", function () {
      if (!solLoaded) {
        var sol = solutionFor(q.id);
        solPanel.innerHTML = sol
          ? renderRich(sol)
          : '<p class="sol-missing">A written solution for this question has not been added yet. ' +
            'The Short Notes for Module ' + q.module + ' cover the material it asks for.</p>';
        solLoaded = true;
      }
      solPanel.hidden = !solPanel.hidden;
      btnSol.textContent = solPanel.hidden ? "See solution" : "Hide solution";
    });

    btnSolved.addEventListener("click", function () {
      if (state.progress.solved[q.id]) delete state.progress.solved[q.id];
      else state.progress.solved[q.id] = true;
      saveProgress();
      var on = !!state.progress.solved[q.id];
      btnSolved.classList.toggle("is-on", on);
      btnSolved.textContent = on ? "✓ Solved" : "Mark as solved";
      card.classList.toggle("is-solved", on);
      updateProgressBar();
    });

    /* remark editor */
    var remarkBox = document.createElement("div");
    remarkBox.className = "remark-box";
    remarkBox.hidden = true;
    var ta = document.createElement("textarea");
    ta.placeholder = "Your note about this question — approach, formula to revise, mistakes to avoid…";
    ta.value = state.progress.remarks[q.id] || "";
    var row = document.createElement("div");
    row.className = "remark-row";
    var btnSave = document.createElement("button");
    btnSave.className = "act"; btnSave.textContent = "Save remark";
    var btnClear = document.createElement("button");
    btnClear.className = "act"; btnClear.textContent = "Delete";
    var saved = document.createElement("span");
    saved.className = "saved-note"; saved.textContent = "Saved";
    row.appendChild(btnSave); row.appendChild(btnClear); row.appendChild(saved);
    remarkBox.appendChild(ta); remarkBox.appendChild(row);
    card.appendChild(remarkBox);

    btnRemark.addEventListener("click", function () {
      remarkBox.hidden = !remarkBox.hidden;
      if (!remarkBox.hidden) ta.focus();
    });
    btnSave.addEventListener("click", function () {
      var v = ta.value.trim();
      if (v) state.progress.remarks[q.id] = v;
      else delete state.progress.remarks[q.id];
      saveProgress();
      preview.textContent = v; preview.hidden = !v;
      btnRemark.textContent = v ? "Edit remark" : "Add remark";
      saved.classList.add("show");
      setTimeout(function () { saved.classList.remove("show"); }, 1400);
    });
    btnClear.addEventListener("click", function () {
      ta.value = "";
      delete state.progress.remarks[q.id];
      saveProgress();
      preview.hidden = true; preview.textContent = "";
      btnRemark.textContent = "Add remark";
      remarkBox.hidden = true;
    });

    if (opts.openSolution) btnSol.click();
    return card;
  }

  function renderPyq() {
    var syl = syllabus(state.subject);
    var qs = filtered();

    $("#pyq-title").textContent = syl.name;
    var parts = [qs.length + (qs.length === 1 ? " question" : " questions")];
    if (state.paper !== "all") parts.push(paperLabel(state.subject, state.paper));
    if (state.module !== "all") parts.push("Module " + state.module + " — " + moduleName(state.subject, +state.module));
    if (state.topic !== "all") parts.push(topicName(state.subject, state.topic));
    $("#pyq-sub").textContent = parts.join(" · ");

    var listEl = $("#pyq-list"), singleEl = $("#pyq-single");
    listEl.innerHTML = "";
    $("#single-holder").innerHTML = "";

    if (!qs.length) {
      listEl.hidden = false; singleEl.hidden = true;
      listEl.innerHTML = '<div class="empty"><strong>Nothing matches these filters</strong>' +
        "Try widening the module, topic, or status filter.</div>";
      updateProgressBar();
      return;
    }

    if (state.view === "all") {
      listEl.hidden = false; singleEl.hidden = true;

      // Group by paper when browsing across papers; otherwise by module.
      var groupBy = state.paper === "all" ? "paper" : "module";
      var order = [], buckets = {};
      qs.forEach(function (q) {
        var key = groupBy === "paper" ? q.paper : String(q.module);
        if (!buckets[key]) { buckets[key] = []; order.push(key); }
        buckets[key].push(q);
      });
      if (groupBy === "module") order.sort(function (a, b) { return +a - +b; });

      order.forEach(function (key) {
        var head = document.createElement("div");
        head.className = "group-head";
        var h = document.createElement("h2");
        h.textContent = groupBy === "paper"
          ? paperLabel(state.subject, key)
          : "Module " + key + " — " + moduleName(state.subject, +key);
        var c = document.createElement("span");
        c.textContent = buckets[key].length + " Q";
        head.appendChild(h); head.appendChild(c);
        listEl.appendChild(head);
        buckets[key].forEach(function (q) { listEl.appendChild(questionCard(q)); });
      });
    } else {
      listEl.hidden = true; singleEl.hidden = false;
      if (state.index >= qs.length) state.index = 0;
      if (state.index < 0) state.index = qs.length - 1;
      $("#single-count").textContent = "Question " + (state.index + 1) + " of " + qs.length;
      $("#single-holder").appendChild(questionCard(qs[state.index]));
      var atStart = state.index === 0, atEnd = state.index === qs.length - 1;
      ["#btn-prev", "#btn-prev2"].forEach(function (s) { $(s).disabled = atStart; });
      ["#btn-next", "#btn-next2"].forEach(function (s) { $(s).disabled = atEnd; });
    }

    updateProgressBar();
  }

  /* =======================================================
     Rendering — study mode
     ======================================================= */

  function renderStudy() {
    var syl = syllabus(state.subject);
    $("#study-title").textContent = syl.name;

    var grid = $("#module-grid");
    grid.innerHTML = "";
    syl.modules.forEach(function (m) {
      var qCount = subjectData(state.subject).questions.filter(function (q) { return q.module === m.n; }).length;
      var card = document.createElement("button");
      card.className = "module-card" + (state.studyModule === m.n ? " is-active" : "");
      card.innerHTML = '<span class="mnum"></span><span class="mname"></span><span class="mmeta"></span>';
      $(".mnum", card).textContent = "Module " + m.n;
      $(".mname", card).textContent = m.name;
      $(".mmeta", card).textContent = m.topics.length + " topics · " + qCount + " past questions";
      card.addEventListener("click", function () {
        state.studyModule = (state.studyModule === m.n) ? null : m.n;
        renderStudy();
        if (state.studyModule) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
      grid.appendChild(card);
    });

    var body = $("#notes-body");
    if (state.studyModule == null) {
      body.hidden = true;
      $("#study-sub").textContent = "Concise revision notes — every syllabus topic, with the past questions that came from it. For a full worked answer, open the question and press See solution.";
      return;
    }

    var mod = syl.modules.filter(function (m) { return m.n === state.studyModule; })[0];
    $("#study-sub").textContent = "Module " + mod.n + " — " + mod.name;

    var md = window.NOTES && window.NOTES[state.subject] && window.NOTES[state.subject][state.studyModule];
    body.hidden = false;
    if (md) {
      body.innerHTML = renderRich(expandPyqMarkers(md, mod));
      decorateNotes(body);
    } else {
      body.innerHTML = renderRich(
        "# Module " + mod.n + " — " + mod.name + "\n\n" +
        "Notes for this module are still being written.\n\n" +
        "### Syllabus topics in this module\n\n" +
        mod.topics.map(function (t) { return "- " + t.name; }).join("\n")
      );
    }
    body.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* Replace {{PYQ:topic-id}} markers in the notes with the real past
     questions for that topic, pulled live from the question bank. This
     guarantees the notes can never drift out of step with the papers.
     {{PYQ:*}} lists every question of the module not already shown. */
  function expandPyqMarkers(md, mod) {
    var all = subjectData(state.subject).questions.filter(function (q) {
      return q.module === mod.n;
    });
    var shown = {};

    var out = md.replace(/\{\{PYQ:([a-z0-9-]+)\}\}/g, function (m, topicId) {
      var list = all.filter(function (q) { return (q.topics || []).indexOf(topicId) !== -1; });
      list.forEach(function (q) { shown[q.id] = true; });
      return formatPyqBlock(list);
    });

    out = out.replace(/\{\{PYQ:\*\}\}/g, function () {
      return formatPyqBlock(all.filter(function (q) { return !shown[q.id]; }));
    });

    return out;
  }

  function formatPyqBlock(list) {
    if (!list.length) return "";
    // Group identical/near-identical questions so repeats are obvious.
    var groups = [], byText = {};
    list.forEach(function (q) {
      var key = q.text.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 70);
      if (!byText[key]) { byText[key] = { text: q.text, papers: [], ids: [] }; groups.push(byText[key]); }
      byText[key].papers.push(paperLabel(state.subject, q.paper).replace("November ", "Nov ").replace("April ", "Apr "));
      byText[key].ids.push(q.id);
    });
    groups.sort(function (a, b) { return b.papers.length - a.papers.length; });

    var lines = ["> **Past questions from this topic**", ">"];
    groups.forEach(function (g) {
      var tag = g.papers.length > 1
        ? "**Repeated " + g.papers.length + "×** — " + g.papers.join(", ")
        : g.papers[0];
      var text = g.text.replace(/\n\n/g, " ").replace(/\n/g, " ").trim();
      // The marker is picked up by decorateNotes() and turned into a button.
      lines.push("> - " + text + "  *(" + tag + ")* @@JUMP:" + g.ids[0] + "@@");
    });
    return lines.join("\n") + "\n";
  }

  // Turn "> **Past questions**" blockquotes into styled callouts, and make each
  // listed question a button that jumps to it in the question bank.
  function decorateNotes(root) {
    $$("blockquote", root).forEach(function (bq) {
      var first = bq.querySelector("strong");
      if (first && /past question|pyq|asked in/i.test(first.textContent)) {
        bq.className = "pyq-callout";
      }
    });

    $$(".pyq-callout li", root).forEach(function (li) {
      var m = li.innerHTML.match(/@@JUMP:([a-z0-9-]+)@@/);
      if (!m) return;
      var qid = m[1];
      li.innerHTML = li.innerHTML.replace(/\s*@@JUMP:[a-z0-9-]+@@/, "");

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pyq-jump";
      btn.title = "Open this question in the Question Bank";
      while (li.firstChild) btn.appendChild(li.firstChild);

      var hint = document.createElement("span");
      hint.className = "jump-hint";
      hint.textContent = "open ↗";
      btn.appendChild(hint);

      btn.addEventListener("click", function () { jumpToQuestion(qid); });
      li.appendChild(btn);
    });
  }

  /* =======================================================
     Render switch + events
     ======================================================= */

  function render() {
    var pyq = state.mode === "pyq";
    $("#view-pyq").hidden = !pyq;
    $("#view-study").hidden = pyq;
    $("#filter-block").hidden = !pyq;
    $("#progress-block").hidden = !pyq;
    renderResources();
    if (pyq) renderPyq(); else renderStudy();
  }

  function openSidebar() { $("#sidebar").classList.add("open"); $("#scrim").classList.add("show"); }
  function closeSidebar() { $("#sidebar").classList.remove("open"); $("#scrim").classList.remove("show"); }

  function initAppEvents() {
    $$(".mode-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (state.mode === btn.dataset.mode) return;
        $$(".mode-btn").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        state.mode = btn.dataset.mode;
        render();
        scrollToTop();
      });
    });

    $$(".seg").forEach(function (btn) {
      btn.addEventListener("click", function () {
        $$(".seg").forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        state.view = btn.dataset.view;
        state.index = 0;
        renderPyq();
      });
    });

    $("#sel-paper").addEventListener("change", function () { state.paper = this.value; state.index = 0; renderPyq(); });
    $("#sel-module").addEventListener("change", function () {
      state.module = this.value; state.topic = "all"; state.index = 0;
      buildTopicSelect(); renderPyq();
    });
    $("#sel-topic").addEventListener("change", function () { state.topic = this.value; state.index = 0; renderPyq(); });
    $("#sel-status").addEventListener("change", function () { state.status = this.value; state.index = 0; renderPyq(); });

    $("#btn-reset").addEventListener("click", function () {
      state.paper = "all"; state.module = "all"; state.topic = "all";
      state.status = "all"; state.search = ""; state.index = 0;
      $("#in-search").value = "";
      $("#sel-status").value = "all";
      buildFilters(); renderPyq();
    });

    var searchTimer = null;
    $("#in-search").addEventListener("input", function () {
      var v = this.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        state.search = v.trim(); state.index = 0; renderPyq();
      }, 180);
    });

    ["#btn-prev", "#btn-prev2"].forEach(function (s) {
      $(s).addEventListener("click", function () { state.index--; renderPyq(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    });
    ["#btn-next", "#btn-next2"].forEach(function (s) {
      $(s).addEventListener("click", function () { state.index++; renderPyq(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    });

    document.addEventListener("keydown", function (e) {
      if (state.mode !== "pyq" || state.view !== "one") return;
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === "ArrowLeft") { state.index--; renderPyq(); }
      if (e.key === "ArrowRight") { state.index++; renderPyq(); }
    });

    $("#btn-menu").addEventListener("click", openSidebar);
    $("#scrim").addEventListener("click", closeSidebar);

    $("#btn-theme").addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("pyq.theme", next);
    });

    $("#btn-logout").addEventListener("click", function () {
      window.Auth.signOut().then(function () { location.reload(); });
    });

    $("#brand-home").addEventListener("click", function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* =======================================================
     Boot
     ======================================================= */

  function boot() {
    var savedTheme = localStorage.getItem("pyq.theme");
    if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
    else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    initAuthUI();
    initAppEvents();
    initScrollUI();

    window.Auth.restore().then(function (roll) {
      if (roll) startApp(roll);
      else $("#in-roll").focus();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
