/* 饭店评分 - single file app logic */
(function () {
  const state = {
    rows: [],
    filtered: [],
    sort: { key: "score", dir: -1 },
    countryIndex: {}, // iso -> {name, restaurants, avg, count}
  };

  // ---------- utils ----------
  const $ = (id) => document.getElementById(id);
  const el = (tag, attrs = {}, children = []) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) =>
      c != null && n.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
    );
    return n;
  };

  // Fuzzy column matcher
  function pickCol(headers, patterns) {
    for (const p of patterns) {
      const idx = headers.findIndex((h) => h && String(h).toLowerCase().includes(p));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function parseNumber(v) {
    if (v == null || v === "") return null;
    const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
    return isFinite(n) ? n : null;
  }

  // Detect country from location text
  function detectCountry(loc) {
    if (!loc) return null;
    const s = String(loc).trim();
    if (!s) return null;
    // "全国" or Chinese city short-hand => China
    if (s === "全国") return "156";
    // Match longest country name prefix / contained
    let best = null;
    for (const name of Object.keys(window.COUNTRY_CN2ISO)) {
      if (s.includes(name)) {
        if (!best || name.length > best.length) best = name;
      }
    }
    if (best) return window.COUNTRY_CN2ISO[best];
    // First token check against city set
    const firstToken = s.split(/[\s·•・,，、\/\-]+/)[0];
    if (window.CN_CITIES.has(firstToken)) return "156";
    // Any Chinese city token
    for (const city of window.CN_CITIES) {
      if (s.includes(city)) return "156";
    }
    return null;
  }

  // ---------- load excel ----------
  async function loadExcel() {
    try {
      const res = await fetch("./饭店评分.xlsx", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const buf = await res.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!aoa.length) throw new Error("Excel 为空");
      const headers = aoa[0].map((h) => String(h || "").trim());
      const iName = pickCol(headers, ["饭店", "餐厅", "名称", "店名", "name"]);
      const iLoc = pickCol(headers, ["位置", "地址", "城市", "地点", "location", "city"]);
      const iCat = pickCol(headers, ["类别", "类型", "菜系", "分类", "category", "cuisine"]);
      // Prefer 总评 / 总分 / 总评分, then any 评分/评/score
      let iScore = pickCol(headers, ["总评分", "总评", "总分"]);
      if (iScore < 0) iScore = pickCol(headers, ["评分", "分数", "评价", "score", "rating"]);
      const iCountry = pickCol(headers, ["国家", "country"]);

      const rows = [];
      for (let r = 1; r < aoa.length; r++) {
        const row = aoa[r];
        if (!row || row.every((c) => c === "" || c == null)) continue;
        const name = iName >= 0 ? String(row[iName] || "").trim() : "";
        if (!name) continue;
        const loc = iLoc >= 0 ? String(row[iLoc] || "").trim() : "";
        const cat = iCat >= 0 ? String(row[iCat] || "").trim() : "";
        const score = iScore >= 0 ? parseNumber(row[iScore]) : null;
        let iso = null;
        if (iCountry >= 0) iso = detectCountry(row[iCountry]);
        if (!iso) iso = detectCountry(loc);
        if (!iso) iso = "156"; // default: China (per spec: Chinese cities without prefix)
        rows.push({ name, loc, cat, score, iso, raw: row, headers });
      }
      state.rows = rows;
      buildCountryIndex();
      buildFilters();
      applyFilters();
      renderMap();
    } catch (e) {
      $("listBody").innerHTML =
        '<div class="err">无法加载 <b>饭店评分.xlsx</b>：' +
        (e && e.message ? e.message : e) +
        "<br/><small>请把 Excel 放在 index.html 同目录下，通过 http(s) 打开（GitHub Pages 或本地静态服务器）。</small></div>";
      renderMap();
    }
  }

  function buildCountryIndex() {
    const idx = {};
    for (const r of state.rows) {
      if (!idx[r.iso]) idx[r.iso] = { iso: r.iso, name: window.ISO2CN[r.iso] || r.iso, restaurants: [], sum: 0, n: 0 };
      idx[r.iso].restaurants.push(r);
      if (r.score != null) { idx[r.iso].sum += r.score; idx[r.iso].n += 1; }
    }
    Object.values(idx).forEach((c) => { c.avg = c.n ? c.sum / c.n : null; c.count = c.restaurants.length; });
    state.countryIndex = idx;
  }

  // ---------- filters + list ----------
  function buildFilters() {
    const locs = [...new Set(state.rows.map((r) => r.loc).filter(Boolean))].sort();
    const cats = [...new Set(state.rows.map((r) => r.cat).filter(Boolean))].sort();
    const fl = $("f-loc"), fc = $("f-cat");
    for (const l of locs) fl.appendChild(el("option", { value: l }, l));
    for (const c of cats) fc.appendChild(el("option", { value: c }, c));
  }

  function applyFilters() {
    const q = $("f-name").value.trim().toLowerCase();
    const loc = $("f-loc").value;
    const cat = $("f-cat").value;
    state.filtered = state.rows.filter((r) =>
      (!q || r.name.toLowerCase().includes(q)) &&
      (!loc || r.loc === loc) &&
      (!cat || r.cat === cat)
    );
    renderList();
  }

  function renderList() {
    const rows = state.filtered.slice();
    const { key, dir } = state.sort;
    rows.sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv), "zh") * dir;
    });

    const body = $("listBody");
    body.innerHTML = "";
    if (!rows.length) { body.appendChild(el("div", { class: "empty" }, "无匹配结果")); return; }

    const table = el("table");
    const thead = el("thead");
    const trh = el("tr");
    const cols = [
      { key: "__rank", label: "#", sortable: false },
      { key: "name", label: "饭店" },
      { key: "loc", label: "位置" },
      { key: "cat", label: "类别" },
      { key: "score", label: "总评分" },
    ];
    cols.forEach((c) => {
      const th = el("th", {}, c.label);
      if (c.sortable !== false) {
        th.addEventListener("click", () => {
          if (state.sort.key === c.key) state.sort.dir *= -1;
          else { state.sort.key = c.key; state.sort.dir = c.key === "score" ? -1 : 1; }
          renderList();
        });
        if (state.sort.key === c.key) {
          th.classList.add("sorted");
          th.setAttribute("data-arrow", state.sort.dir > 0 ? "▲" : "▼");
        }
      }
      trh.appendChild(th);
    });
    thead.appendChild(trh); table.appendChild(thead);

    const tbody = el("tbody");
    rows.forEach((r, i) => {
      const tr = el("tr");
      tr.appendChild(el("td", { class: "rank" }, String(i + 1)));
      tr.appendChild(el("td", {}, r.name));
      tr.appendChild(el("td", {}, r.loc || "—"));
      tr.appendChild(el("td", {}, r.cat ? "" : "—"));
      if (r.cat) tr.lastChild.appendChild(el("span", { class: "tag" }, r.cat));
      tr.appendChild(el("td", { class: "score" }, r.score != null ? r.score.toFixed(1) : "—"));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.appendChild(table);
  }

  // ---------- map ----------
  const MAP_W = 1000, MAP_H = 500;
  // Equirectangular projection
  function project([lon, lat]) {
    return [(lon + 180) * (MAP_W / 360), (90 - lat) * (MAP_H / 180)];
  }
  function ringPath(ring) {
    let d = "";
    for (let i = 0; i < ring.length; i++) {
      const [x, y] = project(ring[i]);
      d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
    }
    return d + "Z";
  }
  function geomPath(geom) {
    if (!geom) return "";
    if (geom.type === "Polygon") return geom.coordinates.map(ringPath).join(" ");
    if (geom.type === "MultiPolygon")
      return geom.coordinates.map((poly) => poly.map(ringPath).join(" ")).join(" ");
    return "";
  }

  async function renderMap() {
    const topoRes = await fetch("./lib/countries-110m.json");
    const topo = await topoRes.json();
    const fc = topojson.feature(topo, topo.objects.countries);
    const svg = $("map");
    svg.innerHTML = "";
    const tip = $("tip");
    const wrap = $("mapWrap");
    let selectedISO = null;

    // Normalize ISO ids to 3-digit strings with leading zeros
    const norm = (id) => String(id).padStart(3, "0");

    fc.features.forEach((f) => {
      const iso = norm(f.id);
      const info = state.countryIndex[iso] || state.countryIndex[String(Number(iso))];
      const active = !!info;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", geomPath(f.geometry));
      path.setAttribute("class", "country" + (active ? " active" : ""));
      path.dataset.iso = iso;
      if (active) {
        path.addEventListener("mousemove", (e) => {
          const rect = wrap.getBoundingClientRect();
          tip.style.left = e.clientX - rect.left + "px";
          tip.style.top = e.clientY - rect.top + "px";
          tip.innerHTML =
            "<b>" + (window.ISO2CN[iso] || f.properties.name) + "</b><br/>" +
            "平均总评分：" + (info.avg != null ? info.avg.toFixed(2) : "—") + "<br/>" +
            "餐厅数量：" + info.count;
          tip.classList.add("show");
        });
        path.addEventListener("mouseleave", () => tip.classList.remove("show"));
        path.addEventListener("click", () => {
          selectedISO = iso;
          svg.querySelectorAll("path.selected").forEach((p) => p.classList.remove("selected"));
          path.classList.add("selected");
          renderCountryDetail(info, f.properties.name);
        });
      }
      svg.appendChild(path);
    });
  }

  function renderCountryDetail(info, engName) {
    const box = $("countryDetail");
    box.innerHTML = "";
    const title = (window.ISO2CN[info.iso] || engName || info.name);
    box.appendChild(el("h3", {}, title +
      " · 平均 " + (info.avg != null ? info.avg.toFixed(2) : "—") +
      " · 共 " + info.count + " 家"));
    const table = el("table");
    const thead = el("thead", {}, el("tr", {}, [
      el("th", {}, "#"), el("th", {}, "饭店"), el("th", {}, "位置"),
      el("th", {}, "类别"), el("th", {}, "总评分"),
    ]));
    table.appendChild(thead);
    const tbody = el("tbody");
    const rows = info.restaurants.slice().sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    rows.forEach((r, i) => {
      const tr = el("tr");
      tr.appendChild(el("td", { class: "rank" }, String(i + 1)));
      tr.appendChild(el("td", {}, r.name));
      tr.appendChild(el("td", {}, r.loc || "—"));
      const tdCat = el("td", {}, "");
      if (r.cat) tdCat.appendChild(el("span", { class: "tag" }, r.cat));
      else tdCat.textContent = "—";
      tr.appendChild(tdCat);
      tr.appendChild(el("td", { class: "score" }, r.score != null ? r.score.toFixed(1) : "—"));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    box.appendChild(table);
  }

  // ---------- tabs ----------
  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === t));
      const which = t.dataset.tab;
      $("tab-list").style.display = which === "list" ? "" : "none";
      $("tab-map").style.display = which === "map" ? "" : "none";
    });
  });

  // ---------- events ----------
  window.addEventListener("DOMContentLoaded", () => {
    $("f-name").addEventListener("input", applyFilters);
    $("f-loc").addEventListener("change", applyFilters);
    $("f-cat").addEventListener("change", applyFilters);
    $("f-reset").addEventListener("click", () => {
      $("f-name").value = ""; $("f-loc").value = ""; $("f-cat").value = "";
      applyFilters();
    });
    loadExcel();
  });
})();
