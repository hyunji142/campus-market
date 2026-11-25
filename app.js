"use strict";

/* =========================================================================
 * 캠퍼스 마켓 · 프론트엔드 전용 (서버 미연결)
 *
 * [중요] 나중에 AWS API Gateway에 연결할 때는 아래 두 함수만 바꾸면 됩니다.
 *   - loadProducts()        : 상품 목록 가져오기  (→ fetch GET)
 *   - saveProduct(product)  : 상품 하나 저장하기  (→ fetch POST)
 * 나머지 렌더링/화면 전환 코드는 수정할 필요가 없습니다.
 *
 * Supabase 등 외부 라이브러리는 사용하지 않습니다.
 * ========================================================================= */

/* ===== 가짜 데이터 (서버 연결 전 임시) =====
 * image: images/ 폴더의 파일 경로. 파일이 없거나 로드 실패하면
 * 카테고리별 기본 박스(📚 / 🏠)가 자동으로 표시됩니다.
 */
let products = [
  {
    id: 1,
    title: "경제학원론 8판 (맨큐)",
    price: 15000,
    category: "교재",
    condition: "거의 새것",
    subject: "경제학원론",
    professor: "이정호",
    image: "images/book1.jpg",
    description: "전공 수업에서 한 학기 사용했습니다. 필기 거의 없고 깨끗합니다.",
  },
  {
    id: 2,
    title: "경제학원론 요점정리 노트",
    price: 6000,
    category: "교재",
    condition: "사용감 있음",
    subject: "경제학원론",
    professor: "이정호",
    image: "images/book2.jpg",
    description: "시험 대비용 요점 정리 노트입니다. 핵심만 깔끔하게 정리돼 있어요.",
  },
  {
    id: 3,
    title: "경영정보학원론 (6판)",
    price: 18000,
    category: "교재",
    condition: "새것",
    subject: "경영정보학원론",
    professor: "김민수",
    image: "images/book3.jpg",
    description: "구매 후 거의 보지 않았습니다. 새 책이라고 봐도 될 정도예요.",
  },
  {
    id: 4,
    title: "경영정보학원론 연습문제 해설집",
    price: 9000,
    category: "교재",
    condition: "거의 새것",
    subject: "경영정보학원론",
    professor: "김민수",
    image: "images/book4.jpg",
    description: "연습문제 풀이가 상세하게 담겨 있어 복습에 좋습니다.",
  },
  {
    id: 5,
    title: "1인용 미니 전기밥솥",
    price: 22000,
    category: "자취용품",
    condition: "사용감 있음",
    image: "images/living1.jpg",
    description: "자취하면서 1년 정도 썼어요. 작동 잘 되고 외관에 생활 기스 조금 있습니다.",
  },
  {
    id: 6,
    title: "접이식 빨래 건조대",
    price: 8000,
    category: "자취용품",
    condition: "거의 새것",
    image: "images/living2.jpg",
    description: "이사하면서 내놓습니다. 튼튼하고 접으면 공간 거의 안 차지해요.",
  },
  {
    id: 7,
    title: "LED 책상 스탠드",
    price: 13000,
    category: "자취용품",
    condition: "새것",
    image: "images/living3.jpg",
    description: "밝기 3단계 조절됩니다. 선물 받았는데 안 써서 판매해요.",
  },
];

/* 카테고리별 기본(폴백) 이미지 아이콘 */
const CATEGORY_ICON = {
  "교재": "📚",
  "자취용품": "🏠",
};

/** 사진 영역 HTML 생성. image가 있으면 <img>(실패 시 폴백), 없으면 폴백 박스 */
function buildImageHtml(product, extraClass) {
  const icon = CATEGORY_ICON[product.category] || "🛒";
  const fallback =
    `<div class="img-fallback ${extraClass}"><span>${icon}</span></div>`;

  if (!product.image) return fallback;

  // 로드 실패 시 onerror로 폴백 박스를 대신 그려 넣습니다.
  const fallbackJs = fallback.replace(/"/g, "&quot;");
  return (
    `<img class="${extraClass}" src="${escapeHtml(product.image)}" ` +
    `alt="${escapeHtml(product.title)}" ` +
    `onerror="this.outerHTML='${fallbackJs}'" />`
  );
}

/* ===========================================================
 * 데이터 계층 — 나중에 이 두 함수만 API 호출로 교체
 * =========================================================== */

// const API_BASE_URL = "https://xxxx.execute-api.ap-northeast-2.amazonaws.com";

/** 상품 목록을 가져옵니다. (나중에: fetch(`${API_BASE_URL}/products`)) */
async function loadProducts() {
  // TODO(AWS): 아래 줄을 API 호출로 교체
  // const res = await fetch(`${API_BASE_URL}/products`);
  // return await res.json();
  return products;
}

/** 상품 하나를 저장합니다. (나중에: fetch POST) 저장된 상품을 반환. */
async function saveProduct(product) {
  // TODO(AWS): 아래 블록을 API 호출로 교체
  // const res = await fetch(`${API_BASE_URL}/products`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(product),
  // });
  // return await res.json();

  const newId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const saved = { id: newId, ...product };
  products.push(saved);
  return saved;
}

/* ===========================================================
 * 찜하기 데이터 계층 — 지금은 localStorage, 나중에 DynamoDB로 교체
 *   - loadFavorites()      : 찜한 상품 id 배열 가져오기
 *   - toggleFavorite(id)   : 찜 추가/제거 후 저장
 * 이 두 함수만 API 호출로 바꾸면 됩니다.
 * =========================================================== */
const FAVORITES_KEY = "campus-market-favorites";

/** 찜한 상품 id 배열을 반환합니다. (나중에: fetch GET /favorites) */
function loadFavorites() {
  // TODO(AWS DynamoDB): 아래를 API 호출로 교체
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** 내부 저장 헬퍼 (나중에: DynamoDB 쓰기로 교체) */
function saveFavorites(ids) {
  // TODO(AWS DynamoDB): 아래를 API 호출로 교체
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

/** 찜 상태를 토글합니다. 토글 후 찜 여부(boolean) 반환. */
function toggleFavorite(id) {
  const ids = loadFavorites();
  const idx = ids.indexOf(id);
  let isFav;
  if (idx === -1) {
    ids.push(id);
    isFav = true;
  } else {
    ids.splice(idx, 1);
    isFav = false;
  }
  saveFavorites(ids);
  return isFav;
}

/** 특정 상품이 찜 상태인지 확인 */
function isFavorite(id) {
  return loadFavorites().includes(id);
}

/* ===========================================================
 * 화면 전환
 * =========================================================== */
const views = {
  list: document.getElementById("listView"),
  form: document.getElementById("formView"),
  detail: document.getElementById("detailView"),
};

function showView(name) {
  Object.keys(views).forEach((key) => {
    views[key].hidden = key !== name;
  });
  window.scrollTo(0, 0);
}

/* ===========================================================
 * 유틸
 * =========================================================== */
/** 15000 -> "15,000원" */
function formatPrice(value) {
  return Number(value).toLocaleString("ko-KR") + "원";
}

/** XSS 방지를 위한 간단한 HTML 이스케이프 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ===========================================================
 * 화면 1: 상품 목록 렌더링
 * =========================================================== */
const productGrid = document.getElementById("productGrid");
const emptyListMsg = document.getElementById("emptyListMsg");

const subjectGroups = document.getElementById("subjectGroups");
const searchInput = document.getElementById("searchInput");

/* 현재 선택된 탭 ("전체" | "교재" | "자취용품" | "찜목록" | "과목별") */
let currentTab = "전체";
/* 검색어 */
let searchKeyword = "";

/** 검색어로 상품을 거릅니다. 제목 + 과목명 + 교수명 부분 일치(대소문자 무시). */
function matchesSearch(product) {
  if (!searchKeyword) return true;
  const kw = searchKeyword.toLowerCase();
  const haystack = [product.title, product.subject, product.professor]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(kw);
}

/** 탭 + 검색어를 함께 적용한 상품 목록 반환 */
function filterProducts(all) {
  let list = all;

  if (currentTab === "교재" || currentTab === "자취용품") {
    list = list.filter((p) => p.category === currentTab);
  } else if (currentTab === "찜목록") {
    const favIds = loadFavorites();
    list = list.filter((p) => favIds.includes(p.id));
  } else if (currentTab === "과목별") {
    list = list.filter((p) => p.category === "교재");
  }

  return list.filter(matchesSearch);
}

/** 상품 카드 DOM 생성 (찜 버튼 + 교재 과목명 포함) */
function createCard(product) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.setAttribute("role", "button");
  card.tabIndex = 0;

  const fav = isFavorite(product.id);
  const subjectLine =
    product.category === "교재" && product.subject
      ? `<div class="card-subject">${escapeHtml(product.subject)}</div>`
      : "";

  card.innerHTML = `
    <div class="card-image">
      ${buildImageHtml(product, "card-img")}
      <button type="button" class="fav-btn ${fav ? "is-fav" : ""}"
              aria-label="찜하기" aria-pressed="${fav}">${fav ? "♥" : "♡"}</button>
    </div>
    <div class="card-body">
      <span class="card-category">${escapeHtml(product.category)}</span>
      <div class="card-title">${escapeHtml(product.title)}</div>
      ${subjectLine}
      <div class="card-price">${formatPrice(product.price)}</div>
    </div>
  `;

  // 하트 버튼: 상세로 넘어가지 않도록 전파 중단
  const favBtn = card.querySelector(".fav-btn");
  favBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    const nowFav = toggleFavorite(product.id);
    favBtn.classList.toggle("is-fav", nowFav);
    favBtn.textContent = nowFav ? "♥" : "♡";
    favBtn.setAttribute("aria-pressed", String(nowFav));
    // 찜 목록 탭에서 해제하면 즉시 목록에서 사라지도록 다시 그림
    if (currentTab === "찜목록" && !nowFav) renderList();
  });

  const open = () => showDetail(product.id);
  card.addEventListener("click", open);
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });

  return card;
}

async function renderList() {
  const all = await loadProducts();
  const list = filterProducts(all);

  productGrid.innerHTML = "";
  subjectGroups.innerHTML = "";

  // 과목별 교재 보기
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
    emptyListMsg.textContent = emptyMessage();
    return;
  }
  emptyListMsg.hidden = true;

  list.forEach((product) => productGrid.appendChild(createCard(product)));
}

/** 상황에 맞는 빈 목록 문구 */
function emptyMessage() {
  if (searchKeyword) return "검색 결과가 없어요";
  if (currentTab === "찜목록") return "찜한 상품이 없어요";
  return "등록된 상품이 없습니다.";
}

/** 과목명으로 묶어서 "과목명 (N권)" 헤더 + 교재 카드들 렌더링 */
function renderSubjectGroups(books) {
  if (!books.length) {
    emptyListMsg.hidden = false;
    emptyListMsg.textContent = searchKeyword ? "검색 결과가 없어요" : "등록된 교재가 없어요";
    return;
  }
  emptyListMsg.hidden = true;

  // 과목명별 그룹화 (과목명 없으면 "기타")
  const groups = new Map();
  books.forEach((book) => {
    const key = book.subject || "기타";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(book);
  });

  groups.forEach((items, subject) => {
    const section = document.createElement("div");
    section.className = "subject-group";

    const heading = document.createElement("h3");
    heading.className = "subject-heading";
    heading.textContent = `${subject} (${items.length}권)`;
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "product-grid";
    items.forEach((book) => grid.appendChild(createCard(book)));
    section.appendChild(grid);

    subjectGroups.appendChild(section);
  });
}

/* ===========================================================
 * 화면 3: 상품 상세
 * =========================================================== */
const detailContent = document.getElementById("detailContent");

async function showDetail(id) {
  const list = await loadProducts();
  const product = list.find((p) => p.id === id);
  if (!product) return;

  const description = product.description
    ? escapeHtml(product.description)
    : "<em style='color:var(--color-text-sub)'>설명이 없습니다.</em>";

  const fav = isFavorite(product.id);

  // 교재일 때만 과목명·교수명 행 추가
  const bookRows =
    product.category === "교재"
      ? `
      <div class="detail-row">
        <dt>과목명</dt>
        <dd>${product.subject ? escapeHtml(product.subject) : "-"}</dd>
      </div>
      <div class="detail-row">
        <dt>교수명</dt>
        <dd>${product.professor ? escapeHtml(product.professor) : "-"}</dd>
      </div>`
      : "";

  detailContent.innerHTML = `
    <div class="detail-image">
      ${buildImageHtml(product, "detail-img")}
      <button type="button" class="fav-btn fav-btn-lg ${fav ? "is-fav" : ""}"
              id="detailFavBtn" aria-label="찜하기" aria-pressed="${fav}">${fav ? "♥" : "♡"}</button>
    </div>
    <span class="detail-category">${escapeHtml(product.category)}</span>
    <h3 class="detail-title">${escapeHtml(product.title)}</h3>
    <div class="detail-price">${formatPrice(product.price)}</div>
    <dl class="detail-meta">
      <div class="detail-row">
        <dt>카테고리</dt>
        <dd>${escapeHtml(product.category)}</dd>
      </div>
      ${bookRows}
      <div class="detail-row">
        <dt>상품 상태</dt>
        <dd>${escapeHtml(product.condition)}</dd>
      </div>
      <div class="detail-row">
        <dt>설명</dt>
        <dd>${description}</dd>
      </div>
    </dl>
  `;

  const detailFavBtn = document.getElementById("detailFavBtn");
  detailFavBtn.addEventListener("click", () => {
    const nowFav = toggleFavorite(product.id);
    detailFavBtn.classList.toggle("is-fav", nowFav);
    detailFavBtn.textContent = nowFav ? "♥" : "♡";
    detailFavBtn.setAttribute("aria-pressed", String(nowFav));
  });

  showView("detail");
}

/* ===========================================================
 * 화면 2: 상품 등록 폼
 * =========================================================== */
const productForm = document.getElementById("productForm");
const formAlert = document.getElementById("formAlert");
const priceInput = document.getElementById("priceInput");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewImg = document.getElementById("imagePreviewImg");
const categoryInput = document.getElementById("categoryInput");
const bookFields = document.getElementById("bookFields");
const subjectInput = document.getElementById("subjectInput");
const professorInput = document.getElementById("professorInput");

// 선택한 사진의 미리보기용 dataURL (서버 없으므로 화면 표시용으로만 사용)
let selectedImageDataUrl = "";

// 가격: 숫자만 입력 허용
priceInput.addEventListener("input", () => {
  priceInput.value = priceInput.value.replace(/[^0-9]/g, "");
});

// 카테고리가 '교재'일 때만 과목명·교수명 칸 표시
function updateBookFields() {
  bookFields.hidden = categoryInput.value !== "교재";
}
categoryInput.addEventListener("change", updateBookFields);

// 사진 선택 시 미리보기 표시 (FileReader로 화면에서만 읽음, 서버 전송 없음)
// TODO(AWS S3): 나중에는 이 파일을 S3에 업로드하고, 업로드된 URL을 image에 저장
imageInput.addEventListener("change", () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) {
    selectedImageDataUrl = "";
    imagePreview.hidden = true;
    imagePreviewImg.removeAttribute("src");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    selectedImageDataUrl = String(reader.result);
    imagePreviewImg.src = selectedImageDataUrl;
    imagePreview.hidden = false;
  };
  reader.readAsDataURL(file);
});

function showFormAlert(message) {
  formAlert.textContent = message;
  formAlert.hidden = false;
}

function hideFormAlert() {
  formAlert.hidden = true;
  formAlert.textContent = "";
}

function openForm() {
  productForm.reset();
  hideFormAlert();
  selectedImageDataUrl = "";
  imagePreview.hidden = true;
  imagePreviewImg.removeAttribute("src");
  updateBookFields();
  showView("form");
}

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = document.getElementById("titleInput").value.trim();
  const price = priceInput.value.trim();

  // 유효성 검사: 제목·가격 비어 있으면 안내
  if (!title && !price) {
    showFormAlert("제목과 가격을 입력해 주세요.");
    return;
  }
  if (!title) {
    showFormAlert("제목을 입력해 주세요.");
    return;
  }
  if (!price) {
    showFormAlert("가격을 입력해 주세요.");
    return;
  }

  hideFormAlert();

  const category = categoryInput.value;

  const newProduct = {
    title,
    price: Number(price),
    category,
    condition: document.getElementById("conditionInput").value,
    // 지금은 미리보기 dataURL을 그대로 image로 사용 (화면 표시용).
    // TODO(AWS S3): S3 업로드 후 받은 URL로 교체
    image: selectedImageDataUrl,
    description: document.getElementById("descriptionInput").value.trim(),
  };

  // 교재일 때만 과목명·교수명 저장
  if (category === "교재") {
    newProduct.subject = subjectInput.value.trim();
    newProduct.professor = professorInput.value.trim();
  }

  await saveProduct(newProduct);
  await renderList();
  showView("list");
});

/* ===========================================================
 * 이벤트 바인딩 & 시작
 * =========================================================== */
document.getElementById("goToFormBtn").addEventListener("click", openForm);
document.getElementById("homeBtn").addEventListener("click", () => showView("list"));

// 탭: 클릭 시 필터링 + 선택 표시
const tabBar = document.getElementById("tabBar");
tabBar.addEventListener("click", (event) => {
  const tab = event.target.closest(".tab");
  if (!tab) return;
  currentTab = tab.dataset.tab;
  tabBar.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  renderList();
});

// 검색: 입력 즉시 필터링 (엔터 불필요)
searchInput.addEventListener("input", () => {
  searchKeyword = searchInput.value.trim();
  renderList();
});

// "목록으로" 버튼들 (폼/상세 공통)
document.querySelectorAll('[data-action="back-to-list"]').forEach((btn) => {
  btn.addEventListener("click", () => showView("list"));
});

// 초기 렌더링
renderList();
showView("list");
