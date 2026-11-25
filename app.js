"use strict";

/* =========================================================================
 * 캠퍼스 마켓
 *
 * API
 *   GET  /books  → 상품 목록 (배열, 필드: id · title · course · price · createdAt)
 *   POST /books  → { title, course, price } 등록 → 등록된 상품 반환
 * ========================================================================= */

const API_URL = "https://ha0k5cgo81.execute-api.ap-southeast-2.amazonaws.com/books";

/* ===========================================================
 * 데이터 계층
 * =========================================================== */

/** GET /books → 상품 배열 반환 */
async function loadProducts() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`목록 로딩 실패 (${res.status})`);
  const data = await res.json();
  // 서버가 { items: [...] } 형태로 감싸서 줄 경우를 대비
  return Array.isArray(data) ? data : (data.items ?? data.books ?? []);
}

/** POST /books → { title, course, price } 전송 */
async function saveProduct({ title, course, price }) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, course, price }),
  });
  if (!res.ok) {
    let msg = `등록 실패 (${res.status})`;
    try { const j = await res.json(); msg = j.message ?? j.error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return await res.json();
}

/* ===========================================================
 * 찜하기 — localStorage
 * =========================================================== */
const FAVORITES_KEY = "campus-market-favorites";

function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]"); }
  catch { return []; }
}
function saveFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}
function toggleFavorite(id) {
  const ids = loadFavorites();
  const idx = ids.indexOf(id);
  if (idx === -1) { ids.push(id); saveFavorites(ids); return true; }
  ids.splice(idx, 1); saveFavorites(ids); return false;
}
function isFavorite(id) { return loadFavorites().includes(id); }

/* ===========================================================
 * 화면 전환
 * =========================================================== */
const views = {
  list:   document.getElementById("listView"),
  form:   document.getElementById("formView"),
  detail: document.getElementById("detailView"),
};

function showView(name) {
  Object.keys(views).forEach((k) => { views[k].hidden = k !== name; });
  window.scrollTo(0, 0);
}

/* ===========================================================
 * 유틸
 * =========================================================== */
function formatPrice(v) { return Number(v).toLocaleString("ko-KR") + "원"; }

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** 사진 없으면 폴백 박스 */
function buildImageHtml(product, cls) {
  const fallback = `<div class="img-fallback ${cls}"><span>📦</span></div>`;
  if (!product.image) return fallback;
  const fb = fallback.replace(/"/g, "&quot;");
  return `<img class="${cls}" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" onerror="this.outerHTML='${fb}'" />`;
}

/* ===========================================================
 * 화면 1 — 목록
 * =========================================================== */
const productGrid  = document.getElementById("productGrid");
const emptyListMsg = document.getElementById("emptyListMsg");
const subjectGroups = document.getElementById("subjectGroups");
const searchInput  = document.getElementById("searchInput");

let currentTab    = "전체";
let searchKeyword = "";
/** 마지막으로 불러온 목록 캐시 (상세 화면 재사용) */
let cachedProducts = [];

function matchesSearch(p) {
  if (!searchKeyword) return true;
  const kw = searchKeyword.toLowerCase();
  return [p.title, p.course].filter(Boolean).join(" ").toLowerCase().includes(kw);
}

function filterProducts(all) {
  let list = all;
  if (currentTab === "교재")      list = list.filter((p) => p.course);
  else if (currentTab === "자취용품") list = list.filter((p) => !p.course);
  else if (currentTab === "찜목록")  list = list.filter((p) => isFavorite(p.id));
  else if (currentTab === "과목별") list = list.filter((p) => p.course);
  return list.filter(matchesSearch);
}

function createCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.setAttribute("role", "button");
  card.tabIndex = 0;

  const fav = isFavorite(product.id);
  const courseLine = product.course
    ? `<div class="card-subject">${escapeHtml(product.course)}</div>` : "";

  card.innerHTML = `
    <div class="card-image">
      ${buildImageHtml(product, "card-img")}
      <button type="button" class="fav-btn ${fav ? "is-fav" : ""}"
              aria-label="찜하기" aria-pressed="${fav}">${fav ? "♥" : "♡"}</button>
    </div>
    <div class="card-body">
      <div class="card-title">${escapeHtml(product.title)}</div>
      ${courseLine}
      <div class="card-price">${formatPrice(product.price)}</div>
    </div>`;

  card.querySelector(".fav-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const now = toggleFavorite(product.id);
    const btn = e.currentTarget;
    btn.classList.toggle("is-fav", now);
    btn.textContent = now ? "♥" : "♡";
    btn.setAttribute("aria-pressed", String(now));
    if (currentTab === "찜목록" && !now) renderList();
  });

  const open = () => showDetail(product.id);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });

  return card;
}

async function renderList() {
  productGrid.innerHTML = "";
  subjectGroups.innerHTML = "";
  emptyListMsg.hidden = true;

  let all;
  try {
    all = await loadProducts();
    cachedProducts = all;
  } catch (err) {
    productGrid.hidden = false;
    subjectGroups.hidden = true;
    productGrid.innerHTML =
      `<p class="empty-msg" style="color:var(--color-danger,#c0392b)">목록을 불러오지 못했습니다.<br>${escapeHtml(err.message)}</p>`;
    return;
  }

  const list = filterProducts(all);

  if (currentTab === "과목별") {
    productGrid.hidden = true;
    subjectGroups.hidden = false;
    renderSubjectGroups(list);
    return;
  }

  productGrid.hidden = false;
  subjectGroups.hidden = true;

  if (!list.length) {
    emptyListMsg.hidden = false;
    emptyListMsg.textContent =
      searchKeyword ? "검색 결과가 없어요" :
      currentTab === "찜목록" ? "찜한 상품이 없어요" : "등록된 상품이 없습니다.";
    return;
  }

  list.forEach((p) => productGrid.appendChild(createCard(p)));
}

function renderSubjectGroups(books) {
  if (!books.length) {
    emptyListMsg.hidden = false;
    emptyListMsg.textContent = searchKeyword ? "검색 결과가 없어요" : "등록된 교재가 없어요";
    return;
  }
  const groups = new Map();
  books.forEach((b) => {
    const key = b.course || "기타";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  });
  groups.forEach((items, label) => {
    const sec = document.createElement("div");
    sec.className = "subject-group";
    const h = document.createElement("h3");
    h.className = "subject-heading";
    h.textContent = `${label} (${items.length}권)`;
    const grid = document.createElement("div");
    grid.className = "product-grid";
    items.forEach((b) => grid.appendChild(createCard(b)));
    sec.appendChild(h);
    sec.appendChild(grid);
    subjectGroups.appendChild(sec);
  });
}

/* ===========================================================
 * 화면 3 — 상품 상세
 * =========================================================== */
const detailContent = document.getElementById("detailContent");

async function showDetail(id) {
  let product = cachedProducts.find((p) => p.id === id);
  if (!product) {
    try { cachedProducts = await loadProducts(); } catch { return; }
    product = cachedProducts.find((p) => p.id === id);
  }
  if (!product) return;

  const fav = isFavorite(product.id);
  const courseRow = product.course
    ? `<div class="detail-row"><dt>과목명</dt><dd>${escapeHtml(product.course)}</dd></div>` : "";
  const descHtml = product.description
    ? escapeHtml(product.description)
    : "<em style='color:var(--color-text-sub)'>설명이 없습니다.</em>";

  detailContent.innerHTML = `
    <div class="detail-image">
      ${buildImageHtml(product, "detail-img")}
      <button type="button" class="fav-btn fav-btn-lg ${fav ? "is-fav" : ""}"
              id="detailFavBtn" aria-label="찜하기" aria-pressed="${fav}">${fav ? "♥" : "♡"}</button>
    </div>
    <h3 class="detail-title">${escapeHtml(product.title)}</h3>
    <div class="detail-price">${formatPrice(product.price)}</div>
    <dl class="detail-meta">
      ${courseRow}
      <div class="detail-row"><dt>설명</dt><dd>${descHtml}</dd></div>
    </dl>`;

  document.getElementById("detailFavBtn").addEventListener("click", () => {
    const now = toggleFavorite(product.id);
    const btn = document.getElementById("detailFavBtn");
    btn.classList.toggle("is-fav", now);
    btn.textContent = now ? "♥" : "♡";
    btn.setAttribute("aria-pressed", String(now));
  });

  showView("detail");
}

/* ===========================================================
 * 화면 2 — 상품 등록
 * =========================================================== */
const productForm    = document.getElementById("productForm");
const formAlert      = document.getElementById("formAlert");
const priceInput     = document.getElementById("priceInput");
const imageInput     = document.getElementById("imageInput");
const imagePreview   = document.getElementById("imagePreview");
const imagePreviewImg = document.getElementById("imagePreviewImg");
const subjectInput   = document.getElementById("subjectInput");

priceInput.addEventListener("input", () => {
  priceInput.value = priceInput.value.replace(/[^0-9]/g, "");
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (!file) { imagePreview.hidden = true; imagePreviewImg.removeAttribute("src"); return; }
  const reader = new FileReader();
  reader.onload = () => { imagePreviewImg.src = String(reader.result); imagePreview.hidden = false; };
  reader.readAsDataURL(file);
});

function showFormAlert(msg) { formAlert.textContent = msg; formAlert.hidden = false; }
function hideFormAlert()     { formAlert.hidden = true; formAlert.textContent = ""; }

function openForm() {
  productForm.reset();
  hideFormAlert();
  imagePreview.hidden = true;
  imagePreviewImg.removeAttribute("src");
  showView("form");
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title  = document.getElementById("titleInput").value.trim();
  const price  = priceInput.value.trim();
  const course = subjectInput.value.trim();

  if (!title && !price) { showFormAlert("제목과 가격을 입력해 주세요."); return; }
  if (!title)            { showFormAlert("제목을 입력해 주세요."); return; }
  if (!price)            { showFormAlert("가격을 입력해 주세요."); return; }

  hideFormAlert();

  // 등록 버튼 중복 클릭 방지
  const submitBtn = productForm.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "등록 중…";

  try {
    await saveProduct({ title, course, price: Number(price) });
  } catch (err) {
    showFormAlert(`등록에 실패했습니다: ${escapeHtml(err.message)}`);
    submitBtn.disabled = false;
    submitBtn.textContent = "등록하기";
    return;
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "등록하기";

  await renderList();
  showView("list");
});

/* ===========================================================
 * 이벤트 바인딩
 * =========================================================== */
document.getElementById("goToFormBtn").addEventListener("click", openForm);
document.getElementById("homeBtn").addEventListener("click", () => {
  showView("list");
  renderList();
});

document.getElementById("tabBar").addEventListener("click", (e) => {
  const tab = e.target.closest(".tab");
  if (!tab) return;
  currentTab = tab.dataset.tab;
  document.querySelectorAll("#tabBar .tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  renderList();
});

searchInput.addEventListener("input", () => {
  searchKeyword = searchInput.value.trim();
  renderList();
});

document.querySelectorAll('[data-action="back-to-list"]').forEach((btn) => {
  btn.addEventListener("click", () => showView("list"));
});

/* ===========================================================
 * 초기 실행
 * =========================================================== */
renderList();
showView("list");
