"use strict";

(() => {
  const translations = {
    zh: {
      pageTitle: "RJ Offroad · 资料中心", skip: "跳至资料列表", eyebrow: "产品支持", heading: "资料中心",
      intro: "查找产品手册、技术资料与使用指南，在线预览或下载保存。", library: "产品资料",
      searchLabel: "搜索资料", searchPlaceholder: "搜索名称、产品或版本", all: "全部资料", categoryLabel: "资料分类",
      clearFilters: "清除筛选", loading: "正在加载资料…", files: n => `${n} 份文件`, links: n => `${n} 个在线指南`,
      results: n => `共 ${n} 项资料`, product: "适用产品", language: "原文语言", version: "版本", size: "文件大小",
      languageZh: "中文", languageEn: "英文", languageDe: "德文", unspecified: "未标注", fileType: "文件", linkType: "在线指南",
      download: "下载文件", preview: "预览", copyFile: "复制下载链接", copyLink: "复制链接", openGuide: "打开指南",
      copied: "链接已复制", manualCopy: "请复制下方链接", emptyTitle: "暂无可下载文件", emptyDescription: "此分类有新资料时会在这里显示。",
      noResults: "未找到匹配资料", noResultsDescription: "请尝试其他关键词，或清除筛选条件。",
      errorTitle: "暂时无法加载资料", errorDescription: "请检查网络连接，稍后重试。", retry: "重新加载",
      unavailable: "此资料暂不可用", updated: date => `资料更新于 ${date}`
    },
    en: {
      pageTitle: "RJ Offroad · Resource Library", skip: "Skip to documents", eyebrow: "PRODUCT SUPPORT", heading: "Resource Library",
      intro: "Find product manuals, technical documents and guides. Preview them online or download a copy.", library: "Product resources",
      searchLabel: "Search resources", searchPlaceholder: "Search by title, product or version", all: "All resources", categoryLabel: "Resource categories",
      clearFilters: "Clear filters", loading: "Loading resources…", files: n => `${n} ${n === 1 ? "file" : "files"}`, links: n => `${n} online ${n === 1 ? "guide" : "guides"}`,
      results: n => `${n} ${n === 1 ? "resource" : "resources"}`, product: "Product", language: "Document language", version: "Version", size: "File size",
      languageZh: "Chinese", languageEn: "English", languageDe: "German", unspecified: "Not specified", fileType: "File", linkType: "Online guide",
      download: "Download", preview: "Preview", copyFile: "Copy download link", copyLink: "Copy link", openGuide: "Open guide",
      copied: "Link copied", manualCopy: "Copy the link below", emptyTitle: "No files available yet", emptyDescription: "New resources for this category will appear here.",
      noResults: "No matching resources", noResultsDescription: "Try another keyword or clear the filters.",
      errorTitle: "Resources could not be loaded", errorDescription: "Check your connection and try again shortly.", retry: "Try again",
      unavailable: "This resource is currently unavailable", updated: date => `Updated ${date}`
    },
    de: {
      pageTitle: "RJ Offroad · Dokumentenbibliothek", skip: "Zu den Dokumenten", eyebrow: "PRODUKT-SUPPORT", heading: "Dokumentenbibliothek",
      intro: "Hier finden Sie Handbücher, technische Unterlagen und Anleitungen – zur Online-Vorschau oder zum Herunterladen.", library: "Produktunterlagen",
      searchLabel: "Unterlagen durchsuchen", searchPlaceholder: "Nach Titel, Produkt oder Version suchen", all: "Alle Unterlagen", categoryLabel: "Dokumentkategorien",
      clearFilters: "Filter zurücksetzen", loading: "Unterlagen werden geladen…", files: n => `${n} ${n === 1 ? "Datei" : "Dateien"}`, links: n => `${n} ${n === 1 ? "Online-Anleitung" : "Online-Anleitungen"}`,
      results: n => `${n} ${n === 1 ? "Dokument" : "Dokumente"}`, product: "Produkt", language: "Dokumentsprache", version: "Version", size: "Dateigröße",
      languageZh: "Chinesisch", languageEn: "Englisch", languageDe: "Deutsch", unspecified: "Nicht angegeben", fileType: "Datei", linkType: "Online-Anleitung",
      download: "Herunterladen", preview: "Vorschau", copyFile: "Download-Link kopieren", copyLink: "Link kopieren", openGuide: "Anleitung öffnen",
      copied: "Link kopiert", manualCopy: "Kopieren Sie den folgenden Link", emptyTitle: "Noch keine Dateien verfügbar", emptyDescription: "Neue Unterlagen dieser Kategorie werden hier angezeigt.",
      noResults: "Keine passenden Unterlagen", noResultsDescription: "Versuchen Sie einen anderen Suchbegriff oder setzen Sie die Filter zurück.",
      errorTitle: "Unterlagen konnten nicht geladen werden", errorDescription: "Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.", retry: "Erneut versuchen",
      unavailable: "Diese Unterlage ist derzeit nicht verfügbar", updated: date => `Stand: ${date}`
    }
  };

  const $ = id => document.getElementById(id);
  const siteRoot = new URL("./", document.baseURI);
  let language = "zh";
  try { const saved = localStorage.getItem("xwTechLang"); if (Object.hasOwn(translations, saved)) language = saved; } catch (_) {}
  const state = { category: "", query: "", loading: true, error: false, catalog: null };
  let toastTimer;
  let loadSequence = 0;
  const t = key => translations[language][key];
  const text = value => value == null ? "" : String(value);
  const translated = value => typeof value === "string" ? value : text(value?.[language] || value?.zh || value?.en || value?.de);
  const normalise = value => text(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const element = (tag, className, value) => { const node = document.createElement(tag); if (className) node.className = className; if (value !== undefined) node.textContent = text(value); return node; };

  function icon(kind) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const shapes = { download: "M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4", preview: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z", external: "M14 3h7v7m0-7L10 14M10 5H4v15h15v-6", copy: "M9 9h11v12H9V9ZM15 9V3H3v12h6" };
    path.setAttribute("d", shapes[kind] || shapes.external); svg.append(path); return svg;
  }

  function fileUrl(file) {
    const path = text(file);
    if (!path.startsWith("files/") || /[\\\u0000-\u001f]/.test(path) || path.split("/").some(part => part === ".." || part === "." || part === "")) return null;
    const encoded = path.split("/").map(encodeURIComponent).join("/");
    const url = new URL(encoded, siteRoot);
    return url.origin === siteRoot.origin && url.pathname.startsWith(siteRoot.pathname + "files/") ? url.href : null;
  }

  function externalUrl(value) {
    try { const url = new URL(text(value)); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch (_) { return null; }
  }

  function readableSize(bytes) {
    if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return t("unspecified");
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes, unit = 0;
    while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
    return new Intl.NumberFormat(language === "zh" ? "zh-CN" : language, { maximumFractionDigits: unit ? 1 : 0 }).format(size) + " " + units[unit];
  }

  function documentLanguage(value) {
    const languageName = text(value).trim();
    const map = { zh: "languageZh", "zh-cn": "languageZh", chinese: "languageZh", "中文": "languageZh", en: "languageEn", english: "languageEn", "英文": "languageEn", de: "languageDe", german: "languageDe", deutsch: "languageDe", "德文": "languageDe" };
    return languageName ? languageName.split(/\s*\/\s*/).map(part => map[part.toLowerCase()] ? t(map[part.toLowerCase()]) : part).join(" / ") : t("unspecified");
  }

  function formatDate(value) {
    const dateText = text(value);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
    if (!match) return dateText;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : language === "de" ? "de-DE" : "en-GB", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(date);
  }

  function notify(message, copyValue) {
    clearTimeout(toastTimer);
    const toast = $("toast"); toast.replaceChildren(element("span", "", message));
    if (copyValue) {
      const input = element("input", "copy-fallback"); input.type = "text"; input.readOnly = true; input.value = copyValue; input.setAttribute("aria-label", message); toast.append(input); toast.hidden = false; input.focus(); input.select();
    } else toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, copyValue ? 18000 : 2500);
  }

  async function copyLink(url) {
    let copied = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(url); copied = true; } } catch (_) {}
    if (!copied) {
      const area = element("textarea", "sr-only"); area.value = url; area.setAttribute("readonly", ""); document.body.append(area); area.select();
      try { copied = document.execCommand("copy"); } catch (_) {} area.remove();
    }
    notify(t(copied ? "copied" : "manualCopy"), copied ? null : url);
  }

  function actionLink(label, url, kind, primary) {
    const link = element("a", "action " + (primary ? "action-primary" : "action-secondary"));
    link.href = url; link.append(icon(kind), document.createTextNode(label));
    if (kind !== "download") { link.target = "_blank"; link.rel = "noopener noreferrer nofollow"; }
    return link;
  }

  function card(doc, categoryNames) {
    const article = element("article", "document-card");
    const isFile = doc.kind === "file";
    const localFile = isFile && doc.file ? fileUrl(doc.file) : null;
    const url = isFile ? (doc.file ? localFile : externalUrl(doc.url)) : externalUrl(doc.url);
    const fileName = text(doc.file) || (isFile && url ? new URL(url).pathname.split("/").pop() : "");
    const previewable = Boolean(localFile && /\.(pdf|txt|html?|png|jpe?g|gif|webp|svg|mp4|webm|vtt)$/i.test(text(doc.file)));
    const content = element("div", "card-content"), top = element("div", "card-top");
    const extension = isFile ? fileName.split(".").pop().slice(0, 7).toUpperCase() : "WEB";
    top.append(element("span", "file-badge" + (isFile ? "" : " web"), extension || "FILE"), element("span", "card-category", categoryNames.get(text(doc.category)) || ""), element("span", "source-kind", t(isFile ? "fileType" : "linkType")));
    content.append(top, element("h3", "document-title", translated(doc.title)));
    const description = translated(doc.description); if (description) content.append(element("p", "document-description", description));
    const metadata = element("dl", "document-meta");
    const fields = [["product", text(doc.product) || t("unspecified")], ["language", documentLanguage(doc.language)], ["version", text(doc.version) || t("unspecified")]];
    if (isFile) fields.push(["size", readableSize(doc.bytes)]);
    fields.forEach(([key, value]) => { const item = element("div", "meta-item"); item.append(element("dt", "", t(key)), element("dd", "", value)); metadata.append(item); });
    content.append(metadata); article.append(content);
    const actions = element("div", "card-actions");
    if (url) {
      if (isFile) {
        const download = actionLink(t("download"), url, "download", true);
        download.download = fileName.split("/").pop(); download.rel = "nofollow";
        if (!localFile) { download.target = "_blank"; download.rel = "noopener noreferrer nofollow"; }
        actions.append(download);
        if (previewable) actions.append(actionLink(t("preview"), url, "preview", false));
      } else actions.append(actionLink(t("openGuide"), url, "external", true));
      const copy = element("button", "action action-copy"); copy.type = "button"; copy.append(icon("copy"), document.createTextNode(t(isFile ? "copyFile" : "copyLink"))); copy.addEventListener("click", () => copyLink(url)); actions.append(copy);
    } else actions.append(element("p", "unavailable-note", t("unavailable")));
    article.append(actions); return article;
  }

  function matchesSearch(doc) {
    const terms = normalise(state.query).split(/\s+/).filter(Boolean);
    const searchText = normalise([typeof doc.title === "object" ? Object.values(doc.title || {}).join(" ") : doc.title, typeof doc.description === "object" ? Object.values(doc.description || {}).join(" ") : doc.description, doc.product, doc.language, documentLanguage(doc.language), doc.version].join(" "));
    return terms.every(term => searchText.includes(term));
  }

  function showState(title, description, loading = false, retry = false) {
    const panel = $("state-panel"); panel.replaceChildren(); panel.hidden = false;
    if (loading) panel.append(element("span", "loading-dot"));
    if (title) panel.append(element("h3", "", title));
    if (description) panel.append(element("p", "", description));
    if (retry) { const button = element("button", "action action-secondary", t("retry")); button.type = "button"; button.addEventListener("click", loadCatalog); panel.append(button); }
  }

  function render() {
    document.documentElement.lang = language === "zh" ? "zh-CN" : language;
    document.title = t("pageTitle");
    document.querySelectorAll("[data-i18n]").forEach(node => { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(node => { node.placeholder = t(node.dataset.i18nPlaceholder); });
    document.querySelectorAll("[data-language]").forEach(node => node.setAttribute("aria-pressed", String(node.dataset.language === language)));
    $("category-filter").setAttribute("aria-label", t("categoryLabel"));
    $("documents").setAttribute("aria-busy", String(state.loading));
    $("documents").replaceChildren(); $("category-filter").replaceChildren();
    $("clear-filters").hidden = !state.query && !state.category;
    $("collection-count").textContent = ""; $("result-count").textContent = ""; $("updated").textContent = "";
    if (state.loading) { showState("", t("loading"), true); return; }
    if (state.error || !state.catalog) { showState(t("errorTitle"), t("errorDescription"), false, true); return; }
    const { categories, documents } = state.catalog;
    const fileCount = documents.filter(doc => doc.kind === "file").length, linkCount = documents.filter(doc => doc.kind === "link").length;
    $("collection-count").textContent = [fileCount ? t("files")(fileCount) : "", linkCount ? t("links")(linkCount) : ""].filter(Boolean).join(" · ");
    if (state.catalog.updated) $("updated").textContent = t("updated")(formatDate(state.catalog.updated));
    const categoryNames = new Map(categories.map(category => [text(category.id), translated(category.title)]));
    const searched = documents.filter(matchesSearch);
    [{ id: "", title: t("all") }, ...categories].forEach(category => {
      const id = text(category.id), button = element("button", "category-button"); button.type = "button"; button.setAttribute("aria-pressed", String(state.category === id));
      button.append(document.createTextNode(translated(category.title)), element("span", "category-count", id ? searched.filter(doc => text(doc.category) === id).length : searched.length));
      button.addEventListener("click", () => { state.category = id; render(); }); $("category-filter").append(button);
    });
    const visible = searched.filter(doc => !state.category || text(doc.category) === state.category);
    $("result-count").textContent = t("results")(visible.length);
    if (!visible.length) { showState(t(state.query ? "noResults" : "emptyTitle"), t(state.query ? "noResultsDescription" : "emptyDescription")); return; }
    $("state-panel").hidden = true;
    const fragment = document.createDocumentFragment(); visible.forEach(doc => fragment.append(card(doc, categoryNames))); $("documents").append(fragment);
  }

  async function loadCatalog() {
    const sequence = ++loadSequence; state.loading = true; state.error = false; render();
    try {
      const response = await fetch(new URL("catalog.json", siteRoot), { cache: "no-cache", credentials: "same-origin" });
      if (!response.ok) throw new Error("Catalogue unavailable");
      const catalog = await response.json();
      if (!catalog || !Array.isArray(catalog.categories) || !Array.isArray(catalog.documents)) throw new Error("Invalid catalogue");
      const categories = catalog.categories.filter(category => category && typeof category === "object" && category.id != null);
      const documents = catalog.documents.filter(doc => doc && typeof doc === "object" && (doc.kind === "file" || doc.kind === "link"));
      if (sequence !== loadSequence) return;
      state.catalog = { ...catalog, categories, documents };
      if (state.category && !categories.some(category => text(category.id) === state.category)) state.category = "";
    } catch (_) { if (sequence !== loadSequence) return; state.error = true; state.catalog = null; }
    state.loading = false; render();
  }

  document.querySelectorAll("[data-language]").forEach(button => button.addEventListener("click", () => {
    const next = button.dataset.language; if (!Object.hasOwn(translations, next)) return; language = next;
    try { localStorage.setItem("xwTechLang", language); } catch (_) {}
    $("toast").hidden = true; render();
  }));
  $("search").addEventListener("input", event => { state.query = event.target.value.trim(); render(); });
  $("clear-filters").addEventListener("click", () => { state.query = ""; state.category = ""; $("search").value = ""; render(); });
  loadCatalog();
})();
