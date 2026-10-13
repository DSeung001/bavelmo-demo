const works = ['보컬로이드', '은혼', '먼작귀', '명조', '블루 아카이브', '젠레스 존 제로'];
// Store data lives in stores.js. Only the original demo stores receive fictional inventory.
const stores = [...demoStores, ...additionalStores];
stores.forEach(store => {
  store.handledWorks = handledWorksByStore[store.id] || [];
  store.tags = [...new Set(focusTagsByStore[store.id] || [])];
});
// District names for the header's area select; the boundaries themselves come from areas.js and are drawn by map.js.
const areas = Object.keys(seoulAreas.districts);
// Extra search words per IP, so the names fans actually type still match.
const aliases = { '보컬로이드': '하츠네 미쿠 카사네 테토', '먼작귀': '치이카와', '명조': '워더링 웨이브', '블루 아카이브': '블아 블루아카 몰루', '젠레스 존 제로': '젠존제 젠레스 ZZZ' };
// Listings come from products.js (real online mall names, prices and photos). They are dealt round the stores,
// so which store holds what is made up; each IP's listings land in different stores.
const perWork = importedProducts.reduce((count, product) => ({ ...count, [product.work]: (count[product.work] || 0) + 1 }), {});
// An IP with few listings is repeated in other stores until it has about SHELF of them, so every IP fills the map.
const SHELF = 60;
const products = [0, 1, 2, 3].flatMap(round => importedProducts
  .map((product, n) => ({ ...product, store: demoStores[(n * 7 + round * 31) % demoStores.length] }))
  .filter(product => round < Math.ceil(SHELF / perWork[product.work])))
  .map((product, n) => ({ ...product, id: `p${n + 1}` }));
const state = { search: '', tag: '', work: '전체', store: null, tab: 'products', sheet: false, interests: new Set(), consent: false, detail: null, notification: false, course: [] };
const main = document.querySelector('#main');
const searchInput = document.querySelector('#search');
// The header selects are static markup; only their options come from the data above.
const workSelect = document.querySelector('#work-select');
const areaSelect = document.querySelector('[data-map-area]');
workSelect.innerHTML = ['전체', ...works].map(work => `<option>${work}</option>`).join('');
areaSelect.insertAdjacentHTML('beforeend', areas.map(area => `<option>${area}</option>`).join(''));
// Narrow screens hide the header's search field behind a button; the popup field edits the same search.
const searchButton = document.querySelector('#open-search');
const searchDialog = document.querySelector('#search-dialog');
searchDialog.innerHTML = `<button class="close" data-close aria-label="검색 닫기">${uiIcon("close")}</button><form class="modal-body" method="dialog"><span class="eyebrow">SEARCH</span><h2 id="search-title">검색</h2><label class="search search-field"><span aria-hidden="true">${uiIcon("search")}</span><input type="search" id="search-modal" placeholder="작품, 캐릭터, 상품 검색" aria-label="작품, 캐릭터, 상품 검색"></label><button class="primary full">결과 보기</button><button class="text-button" type="button" id="clear-search">검색어 지우기</button></form>`;
const searchModal = searchDialog.querySelector('#search-modal');
function setSearch(value) {
  state.search = value;
  state.store = null;
  // Leave the field being typed in alone so its caret does not jump.
  for (const input of [searchInput, searchModal]) if (input.value !== value) input.value = value;
  const query = value.trim();
  document.querySelector('#search-label').textContent = query || '검색';
  searchButton.setAttribute('aria-label', query ? `상품 검색, 현재 검색어 ${query}` : '상품 검색');
  document.querySelector('#clear-search').hidden = !value;
}
setSearch('');
const sheetLayout = matchMedia('(max-width:900px)');
const detailDialog = document.querySelector('#detail-dialog');
const interestDialog = document.querySelector('#interest-dialog');
const actionDialog = document.querySelector('#action-dialog');
const courseDialog = document.querySelector('#course-dialog');
const money = value => `${value.toLocaleString('ko-KR')}원`;
const statusText = { available: '판매 가능', preorder: '예약중', arrived: '입고', restock: '재입고', sold: '품절', unknown: '확인 필요' };
// Every listing carries its sale status as a text label; the class picks the fill (design-rules: colour plus words).
const stockLabel = p => `<span class="stock-label ${p.status}">${statusText[p.status]}</span>`;
const escapeHtml = text => String(text).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// Mall photos are hotlinked, not stored. A photo that fails to load is hidden and leaves its empty frame.
function art(product, decorative = false) {
  return `<img src="${escapeHtml(product.image)}" alt="${decorative ? '' : escapeHtml(product.name)}" loading="lazy" referrerpolicy="no-referrer">`;
}
document.addEventListener('error', event => { if (event.target.matches?.('.product-art img, .detail-art img, .notification-product img')) event.target.hidden = true; }, true);

function syncInterestCount() {
  document.querySelector('#interest-count').textContent = state.interests.size;
}
function syncCourseCount() {
  document.querySelector('#course-count').textContent = state.course.length;
  document.querySelector('#open-course').setAttribute('aria-label', `방문 동선, 담은 매장 ${state.course.length}곳`);
}
const courseStops = () => state.course.map(id => stores.find(store => store.id === id));
let mapView;
function render() {
  mapView?.dispose();
  workSelect.value = state.work;
  main.innerHTML = discoveryTemplate(state);
  const tagSelect = document.querySelector('#store-tag');
  const tags = [...new Set([...storeTagOptions, ...stores.flatMap(store => store.tags)])];
  tagSelect.innerHTML = '<option value="">주력 상품 전체</option>' + tags.map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join('');
  tagSelect.value = state.tag;
  mapView = BabelmoMap.mount(document.querySelector('.map-panel'), { onSelect: selectStore, shapes: seoulAreas, countIcon: uiIcon('shop'), onCoordinates(id, point) { Object.assign(stores.find(store => store.id === id), point); renderProducts(); }, area: areaSelect });
  renderProducts();
}
function renderProducts() {
  const query = state.search.trim().toLocaleLowerCase();
  const matched = products.filter(p => (!state.tag || p.store.tags.includes(state.tag)) && (state.work === '전체' || state.work === p.work) && `${p.name} ${p.work} ${p.category} ${aliases[p.work] || ''}`.toLocaleLowerCase().includes(query));
  const matchedStores = stores.filter(store => (!state.tag || store.tags.includes(state.tag)) && (matched.some(p => p.store.id === store.id) ||
    (state.work === '전체' && (!query || `${store.name} ${store.area} ${store.location}`.toLocaleLowerCase().includes(query))) || (store.handledWorks || []).some(work =>
      (state.work === '전체' || state.work === work) &&
      `${work} ${aliases[work] || ''}`.toLocaleLowerCase().includes(query))));
  if (state.store && !matchedStores.some(store => store.id === state.store)) state.store = null;
  const filtered = matched.filter(p => !state.store || p.store.id === state.store);
  const sheet = document.querySelector('.map-sheet');
  sheet.dataset.tab = state.tab;
  // Only the sheet layout reads this: closed, the map fills the stage above the two list buttons.
  sheet.parentElement.dataset.open = state.sheet;
  sheet.querySelectorAll('[data-tab]').forEach(button => {
    button.textContent = button.dataset.tab === 'products' ? `상품 ${filtered.length}` : `매장 ${matchedStores.length}`;
    button.setAttribute('aria-expanded', state.sheet && button.dataset.tab === state.tab);
  });
  document.querySelector('#result-count').textContent = `${matchedStores.length}곳`;
  document.querySelector('#map-empty').hidden = matchedStores.length > 0;
  document.querySelector('#selected-title').textContent = `${state.store ? stores.find(store => store.id === state.store).name : state.work} · 상품 ${filtered.length}개`;
  document.querySelector('[data-all-stores]').hidden = !state.store;
  // The sheet layout hides the store list once a store is chosen, so the product panel's head can add it too.
  const courseToggle = document.querySelector('.side-head [data-course-toggle]');
  courseToggle.hidden = !state.store;
  courseToggle.disabled = !!state.store && !Number.isFinite(stores.find(store => store.id === state.store).lat);
  courseToggle.dataset.courseToggle = state.store || '';
  courseToggle.innerHTML = state.course.includes(state.store) ? '동선에서 빼기' : `${uiIcon('route')}동선에 담기`;
  // Desktop panels overlay both map edges; the sheet layout shrinks the canvas instead.
  const side = document.querySelector('.side-stores').offsetWidth + 48;
  mapView.update({
    stores: matchedStores.map(store => ({ ...store, count: matched.filter(p => p.store.id === store.id).length, available: matched.filter(p => p.store.id === store.id && p.status === 'available').length })),
    selected: state.store,
    filter: JSON.stringify([query, state.work, state.tag]),
    course: courseStops().map(({ id, name, area, lat, lng, searchAddress }) => ({ id, name, area, lat, lng, searchAddress })),
    padding: sheetLayout.matches ? [96, 48, 80, 48] : [96, side, 80, side]
  });
  document.querySelector('#store-list').innerHTML = matchedStores.map(store => {
    const listings = matched.filter(p => p.store.id === store.id);
    const available = listings.filter(p => p.status === 'available').length;
    const order = state.course.indexOf(store.id) + 1;
    // The card is a button already, so the course toggle sits next to it instead of inside it.
    return `<div class="store-row"><button class="store-result ${state.store === store.id ? 'selected' : ''}" data-store="${store.id}" aria-pressed="${state.store === store.id}" aria-label="${store.name}, ${store.area}, 상품 ${listings.length}개, 판매 가능 ${available}개"><strong>${store.name}</strong><small>${store.area}${!Number.isFinite(store.lat) ? ' · 지도 위치 확인 전' : ''}${store.tags.length ? ` · 주력: ${escapeHtml(store.tags.join(', '))}` : ''}${store.handledWorks?.length ? ` · 취급 IP: ${escapeHtml(store.handledWorks.join(', '))}` : ''}</small><span class="store-result-count">${uiIcon('figure')}${listings.length}</span></button><button class="course-toggle" ${!Number.isFinite(store.lat) ? 'disabled' : ''} data-course-toggle="${store.id}" aria-pressed="${order > 0}" aria-label="${store.name}, ${order ? `동선 ${order}번째, 동선에서 빼기` : '동선에 담기'}">${order || uiIcon('plus')}</button></div>`;
  }).join('');
  document.querySelector('#product-grid').innerHTML = filtered.length ? filtered.map(p => `<button class="product-card" data-product="${p.id}" aria-label="${escapeHtml(p.name)}, ${statusText[p.status]}, ${p.work}, ${p.store.name}, ${p.checked} 확인${p.status === 'unknown' ? ' · 오래된 정보' : ''}, 상세 보기"><span class="product-art">${art(p, true)}</span><strong>${escapeHtml(p.name)}</strong>${stockLabel(p)}</button>`).join('') : `<div class="empty"><span>${uiIcon('search')}</span><h3>${state.store ? '등록된 상품이 없어요' : '아직 일치하는 상품이 없어요'}</h3><p>${state.store ? `${escapeHtml(stores.find(store => store.id === state.store).location)}<br>취급 IP: ${stores.find(store => store.id === state.store).handledWorks.length ? escapeHtml(stores.find(store => store.id === state.store).handledWorks.join(', ')) : '미확인'}<br>취급 IP는 현재 재고를 의미하지 않아요. 방문 전 매장에 확인해주세요.` : '다른 작품이나 캐릭터를 검색해보세요.'}</p><button class="primary" data-reset>${uiIcon("refresh")}검색·필터 초기화</button></div>`;
}
function openDetail(id) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  state.detail = p.id;
  detailDialog.innerHTML = `<button class="close" data-close aria-label="상품 상세 닫기">${uiIcon("close")}</button><div class="detail-layout"><div class="detail-art">${art(p)}</div><div class="detail-copy"><span class="eyebrow">${p.work} / ${p.category}</span><div class="detail-head"><h2 id="detail-title">${escapeHtml(p.name)}</h2>${stockLabel(p)}<p class="detail-price">${money(p.price)}</p></div><p>온라인몰에서 수집한 상품명·가격·사진입니다.<br>이 매장의 보유 여부는 가상 예시입니다.</p><dl><div><dt>판매 매장</dt><dd>${p.store.name}</dd></div><div><dt>위치</dt><dd>${p.store.location}</dd></div><div><dt>마지막 확인</dt><dd>${p.checked}</dd></div></dl><p class="stock-notice">${p.status === 'unknown' ? '오래된 재고 정보입니다. 판매 가능 여부를 먼저 확인해주세요.' : p.status === 'sold' ? '품절 예시 상품입니다. 현재 구매 가능한 상품으로 안내하지 않습니다.' : p.status === 'preorder' ? '예약 판매 상품입니다. 입고 일정과 예약 가능 여부를 매장에 확인해주세요.' : p.status === 'arrived' || p.status === 'restock' ? '최근 입고된 상품입니다. 실시간 재고가 아니니 방문 전 매장에 확인해주세요.' : '실시간 재고가 아닙니다. 방문이나 구매 전 매장에 확인해주세요.'}</p><div class="detail-actions"><button class="primary" data-action="inquiry">${uiIcon("chat")}재고 문의</button><button class="secondary" data-action="purchase" ${p.status === 'sold' || p.status === 'unknown' ? 'disabled' : ''}>${uiIcon("shop")}구매처 보기</button><button class="secondary" data-action="directions">${uiIcon("route")}길찾기</button></div><button class="text-button" data-interest>${uiIcon("heart")}이 작품 관심 알림 신청</button></div></div>`;
  detailDialog.querySelector('.detail-copy').insertAdjacentHTML('beforeend', `<button class="text-button" data-locate="${p.id}">${uiIcon("pin")}지도에서 이 상품의 매장 보기</button>`);
  detailDialog.showModal();
}
function renderInterest() {
  interestDialog.innerHTML = `<button class="close" data-close aria-label="관심 알림 닫기">${uiIcon("close")}</button><div class="modal-body"><span class="eyebrow">관심 알림 · 이렇게 사용자에게 노출됩니다</span><h2 id="interest-title">관심 작품 알림</h2><p class="interest-intro">입고 소식을 받을 작품을 골라 주세요.</p><p class="interest-note">개인정보 수집·실제 알림 발송은 없습니다.</p><form id="interest-form"><fieldset><legend>관심 작품 선택</legend><div class="interest-options">${works.map(work => `<label class="interest-choice"><input type="checkbox" name="work" value="${work}" ${state.interests.has(work) ? 'checked' : ''}><span>${work}</span></label>`).join('')}</div></fieldset><label class="consent"><input type="checkbox" id="consent" ${state.consent ? 'checked' : ''} required><span>선택한 작품의 입고 알림 수신에 동의합니다.</span></label><p class="form-error" id="form-error" role="alert"></p><button class="primary full" type="submit">${state.interests.size ? '관심 알림 변경' : '관심 알림 신청'}</button></form>${state.interests.size ? `<div class="subscription-state"><strong>✓ 신청 완료 · ${state.interests.size}개 작품</strong><button class="secondary" id="sample-notification">예시 알림 보기</button><button class="text-button" id="unsubscribe">관심 알림 모두 해제</button></div>` : ''}</div>`;
  document.querySelector('#interest-form').addEventListener('submit', event => {
    event.preventDefault();
    const selected = [...new FormData(event.target).getAll('work')];
    if (!selected.length) { document.querySelector('#form-error').textContent = '관심 작품을 하나 이상 선택해주세요.'; return; }
    state.interests = new Set(selected); state.consent = true; state.notification = false;
    syncInterestCount(); renderInterest(); toast('관심 알림 신청을 완료했어요.');
  });
}
function openInterest() { renderInterest(); if (!interestDialog.open) interestDialog.showModal(); }
function showAction(type) {
  const p = products.find(p => p.id === state.detail);
  if (!p) return;
  const copy = { inquiry: ['재고 문의', `${p.store.name}에 ‘${escapeHtml(p.name)}’의 판매 가능 여부를 문의하는 단계입니다.`], purchase: ['구매처 보기', `${p.store.name}의 기존 판매 페이지에서 ‘${escapeHtml(p.name)}’을 확인하는 단계입니다.`], directions: ['길찾기', `${p.store.name}(${p.store.location})까지의 이동 경로를 확인하는 단계입니다.`] }[type];
  if (!copy) return;
  actionDialog.innerHTML = `<button class="close" data-close aria-label="안내 닫기">${uiIcon("close")}</button><div class="modal-body"><span class="eyebrow">DEMO PREVIEW</span><h2 id="action-title">${copy[0]}</h2><p>${copy[1]}</p><div class="action-note">상품명·가격·사진은 온라인몰 수집 정보이고 매장별 보유·재고는 가상 예시입니다.<br>실제 문의·구매·지도 이동은 발생하지 않습니다.</div><button class="primary full" data-close>확인했어요</button></div>`;
  actionDialog.showModal();
}
// The visit course is an ordered list of store IDs. It is kept in the page address so the link itself is the share.
function setCourse(ids) {
  state.course = ids;
  history.replaceState({}, '', location.pathname + BabelmoCourse.toSearch(ids, location.search) + location.hash);
  syncCourseCount();
  renderProducts();
  if (courseDialog.open) renderCourse();
}
function toggleCourse(id) {
  const next = BabelmoCourse.toggle(state.course, id);
  if (next === state.course) { toast(`동선에는 매장을 ${BabelmoCourse.MAX}곳까지 담을 수 있어요.`); return; }
  setCourse(next);
  toast(next.includes(id) ? `동선 ${next.length}번째로 담았어요.` : '동선에서 뺐어요.');
}
function renderCourse() {
  const stops = courseStops();
  const km = stops.every(store => Number.isFinite(store.lat) && Number.isFinite(store.lng)) ? (BabelmoCourse.distance(stops) / 1000).toFixed(1) : null;
  const row = (store, n) => `<li><span class="course-order">${n + 1}</span><div><strong>${store.name}</strong><small>${store.area} · ${store.location}</small></div><button data-course-move="-1" data-index="${n}" aria-label="${store.name}, 순서 앞으로" ${n ? '' : 'disabled'}>${uiIcon('up')}</button><button data-course-move="1" data-index="${n}" aria-label="${store.name}, 순서 뒤로" ${n < stops.length - 1 ? '' : 'disabled'}>${uiIcon('down')}</button><button data-course-remove="${store.id}" aria-label="${store.name}, 동선에서 빼기">${uiIcon('close')}</button></li>`;
  const body = stops.length
    ? `<ol class="course-list">${stops.map(row).join('')}</ol><div class="action-note">매장 ${stops.length}곳${stops.length > 1 ? (km === null ? ' · 지도 위치 확인 중' : ` · 직선거리 약 ${km}km`) : ''}<br>지도의 선은 매장을 순서대로 이은 직선입니다. 실제 이동 경로·거리·시간이 아닙니다.</div><button class="primary full" id="share-course">${uiIcon('arrow')}링크 공유</button><p class="course-status" id="course-status" role="status"></p><input id="course-link" aria-label="동선 링크" readonly hidden><div class="course-actions"><button class="secondary" id="show-course">${uiIcon('pin')}지도에서 보기</button><button class="text-button" id="clear-course">모두 비우기</button></div>`
    : `<p>아직 담은 매장이 없어요.<br>매장 목록의 + 버튼이나, 매장을 고른 뒤 ‘동선에 담기’로 담아보세요.</p><button class="primary full" data-close>확인했어요</button>`;
  courseDialog.innerHTML = `<button class="close" data-close aria-label="동선 닫기">${uiIcon('close')}</button><div class="modal-body"><span class="eyebrow">MY COURSE</span><h2 id="course-title">방문 동선</h2>${body}</div>`;
}
function openCourse() { renderCourse(); if (!courseDialog.open) courseDialog.showModal(); }
// The link is the page address. Where neither the share sheet nor the clipboard works, it is shown for copying by hand.
async function shareCourse() {
  const url = location.href, status = document.querySelector('#course-status');
  if (navigator.share) {
    try { await navigator.share({ title: '바벨모 방문 동선', url }); return; }
    catch (error) { if (error.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(url);
    status.textContent = '링크를 복사했어요. 붙여넣어 공유하세요.';
  } catch {
    const field = document.querySelector('#course-link');
    field.hidden = false; field.value = url; field.select();
    status.textContent = '링크를 복사하지 못했어요. 아래 주소를 직접 복사해주세요.';
  }
}
let toastTimer;
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 3000); }
function selectStore(id) {
  const fromMap = document.activeElement?.matches('.map-marker, .map-cluster');
  state.store = id;
  state.tab = 'products';
  state.sheet = true;
  renderProducts();
  if (!fromMap || !mapView.focusStore(id)) focusStoreResult(id);
}
// In the sheet layout the store list is hidden once its products show; keep focus on a visible control.
function focusStoreResult(id) {
  const target = document.querySelector('#store-list [data-store="'+id+'"]');
  (target?.offsetParent ? target : document.querySelector('.sheet-tabs [data-tab="products"]')).focus({ preventScroll: true });
}
document.addEventListener('click', event => {
  const el = event.target.closest('button, a'); if (!el) return;
  if (el.hasAttribute('data-close')) el.closest('dialog').close();
  if (el.dataset.product) openDetail(el.dataset.product);
  if (el.dataset.locate) {
    const p = products.find(p => p.id === el.dataset.locate);
    detailDialog.close(); setSearch(p.name); state.work = p.work;
    state.store = p.store.id; state.tab = 'products'; state.sheet = true;
    render();
    if (!mapView.focusStore(p.store.id)) focusStoreResult(p.store.id);
  }
  // Pressing the open list's button again closes it.
  if (el.dataset.tab) { state.sheet = !(state.sheet && state.tab === el.dataset.tab); state.tab = el.dataset.tab; renderProducts(); }
  if (el.dataset.store) selectStore(el.dataset.store);
  if (el.dataset.courseToggle) {
    const id = el.dataset.courseToggle, inList = el.closest('#store-list');
    toggleCourse(id);
    // The store list was drawn again; the product panel's own button was not.
    if (inList) document.querySelector(`#store-list [data-course-toggle="${id}"]`)?.focus({ preventScroll: true });
  }
  if (el.id === 'open-course') openCourse();
  // Redrawing the popup drops focus, so it goes back to the same row's button (or the nearest one still usable).
  if (el.dataset.courseMove) {
    const delta = Number(el.dataset.courseMove), index = Number(el.dataset.index);
    setCourse(BabelmoCourse.move(state.course, index, delta));
    const moved = courseDialog.querySelectorAll('.course-list li')[index + delta];
    (moved.querySelector(`[data-course-move="${delta}"]:enabled`) || moved.querySelector('[data-course-move]:enabled') || moved.querySelector('[data-course-remove]')).focus();
  }
  if (el.dataset.courseRemove) {
    const index = state.course.indexOf(el.dataset.courseRemove);
    setCourse(state.course.filter(id => id !== el.dataset.courseRemove));
    const rows = courseDialog.querySelectorAll('[data-course-remove]');
    (rows[Math.min(index, rows.length - 1)] || courseDialog.querySelector('.primary')).focus();
  }
  if (el.id === 'clear-course') { setCourse([]); courseDialog.querySelector('.primary').focus(); toast('동선을 모두 비웠어요.'); }
  if (el.id === 'share-course') shareCourse();
  if (el.id === 'show-course') { courseDialog.close(); mapView.showCourse(); }
  if (el.hasAttribute('data-all-stores')) { state.store = null; renderProducts(); }
  if (el.hasAttribute('data-reset')) { setSearch(''); state.work = '전체'; state.tag = ''; render(); (searchInput.offsetParent ? searchInput : searchButton).focus(); }
  if (el.id === 'open-search') { searchDialog.showModal(); searchModal.select(); }
  if (el.id === 'clear-search') { setSearch(''); renderProducts(); searchModal.focus(); }
  if (el.hasAttribute('data-interest') || el.id === 'open-interest') openInterest();
  if (el.dataset.action) showAction(el.dataset.action);
  if (el.id === 'unsubscribe') { state.interests.clear(); state.consent = false; state.notification = false; syncInterestCount(); renderInterest(); toast('관심 알림을 모두 해제했어요.'); }
  if (el.id === 'sample-notification') {
    state.notification = true;
    const p = products.find(p => state.interests.has(p.work) && p.status === 'available');
    actionDialog.innerHTML = `<button class="close" data-close aria-label="예시 알림 닫기">${uiIcon("close")}</button><div class="modal-body"><span class="eyebrow">예시 알림 · 이렇게 사용자에게 노출됩니다</span><h2 id="action-title">관심 작품에서 찾은 작은 발견.</h2><div class="notification-product">${art(p)}<div><span>${p.work}</span><h3>${escapeHtml(p.name)}</h3><p>${money(p.price)} · ${p.store.name}</p></div></div><p>알림은 재고나 구매를 보장하지 않습니다.<br>판매 상태를 상품 상세에서 확인해주세요.</p><button class="primary full" id="notification-product" data-id="${p.id}">상품 확인하기 ${uiIcon("arrow")}</button></div>`;
    actionDialog.showModal();
  }
  if (el.id === 'notification-product') { actionDialog.close(); interestDialog.close(); if (detailDialog.open) detailDialog.close(); openDetail(el.dataset.id); }
});
detailDialog.addEventListener('close', () => { if (!detailDialog.open) state.detail = null; });
for (const input of [searchInput, searchModal]) input.addEventListener('input', () => { setSearch(input.value); renderProducts(); });
document.addEventListener('change', event => {
  if (event.target.id !== 'store-tag') return;
  state.tag = event.target.value; state.store = null; renderProducts();
});
workSelect.addEventListener('change', () => { state.work = workSelect.value; state.store = null; renderProducts(); });
// Old design links resolve to the single board; design selection is no longer state.
const entryUrl = new URL(location.href);
if (entryUrl.searchParams.has('design')) {
  entryUrl.searchParams.delete('design');
  history.replaceState({}, '', entryUrl);
}
// The demo notice shows once per browser session; when sessionStorage is blocked it shows on every load.
function showDemoNotice() {
  try { if (sessionStorage.getItem('demo-notice')) return; sessionStorage.setItem('demo-notice', '1'); } catch {}
  actionDialog.innerHTML = `<button class="close" data-close aria-label="데모 안내 닫기">${uiIcon("close")}</button><div class="modal-body"><span class="eyebrow">DEMO</span><h2 id="action-title">데모 화면입니다</h2><p>바벨모가 어떻게 동작하는지 보여주는 체험용 화면입니다.</p><div class="action-note">매장별 보유·재고는 가상 예시입니다.<br>방문 통계를 수집합니다.</div><button class="primary full" data-close>확인했어요</button><a class="text-button full" href="privacy.html">개인정보 처리 안내</a></div>`;
  actionDialog.showModal();
  // Opened without a click, so the close button would show a focus ring; start on the dialog itself instead.
  actionDialog.focus();
}
// A shared link opens with its course. Every work is shown so the course's stores are in the store list too.
const entryCourse = BabelmoCourse.parse(location.search, stores.map(store => store.id));
if (entryCourse.ids.length) { state.course = entryCourse.ids; state.work = '전체'; }
if (entryCourse.dropped) history.replaceState({}, '', location.pathname + BabelmoCourse.toSearch(entryCourse.ids, location.search) + location.hash);
const entryMessage = [entryCourse.ids.length ? `공유된 동선의 매장 ${entryCourse.ids.length}곳을 불러왔어요.` : '', entryCourse.dropped ? `링크에서 불러올 수 없는 매장 ${entryCourse.dropped}곳은 뺐어요.` : ''].filter(Boolean).join(' ');
syncInterestCount();
syncCourseCount();
render();
if (state.course.length) mapView.showCourse();
showDemoNotice();
// The toast would sit behind the demo notice, so it waits for the notice to close.
if (entryMessage) { if (actionDialog.open) actionDialog.addEventListener('close', () => toast(entryMessage), { once: true }); else toast(entryMessage); }
