// Small first-party UI icons; decorative SVGs keep button labels accessible.
function uiIcon(name) {
  const paths = {
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    heart:'<path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    refresh:'<path d="M20 7v5h-5M4 17v-5h5M5.5 8a7 7 0 0 1 12-3L20 8M4 16l2.5 3a7 7 0 0 0 12-3"/>',
    chat:'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3v-7a8 8 0 0 1 8-12h2a8 8 0 0 1 8 8Z"/><path d="M8 10h8M8 14h5"/>',
    shop:'<path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10h18M9 21v-7h6v7"/>',
    figure:'<circle cx="12" cy="7" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
    up:'<path d="m6 15 6-6 6 6"/>',
    down:'<path d="m6 9 6 6 6-6"/>',
    route:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9"/>'
  };
  return '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+paths[name]+'</svg>';
}
// Fandom discovery board composition. Data and interaction live in app.js.
function discoveryTemplate(state) {
  // Everything except #map-canvas is a sibling overlay so the provider map never owns app UI.
  const controls = `<div class="map-controls" role="group" aria-label="지도 조작"><button class="secondary" data-map-home aria-label="서울 전체 보기" disabled>${uiIcon("pin")}<span>서울 전체</span></button><button class="secondary" data-map-zoom="-1" aria-label="지도 확대" disabled>${uiIcon("plus")}</button><button class="secondary" data-map-zoom="1" aria-label="지도 축소" disabled>${uiIcon("minus")}</button></div>`;
  const storePanel = `<aside class="side side-stores" aria-label="매장"><div class="side-head"><h2>매장</h2><span id="result-count" role="status"></span></div><label class="store-tag-filter" for="store-tag">주력 상품 태그<select id="store-tag" class="header-select" aria-describedby="store-tag-note"></select></label><p id="store-tag-note" class="store-tag-note">등록된 주력 상품 기준이에요. 현재 재고와는 달라요.</p><div id="store-list" class="side-list" role="group" aria-label="매장 선택"></div><p id="map-empty" class="map-empty" role="status" hidden>조건에 맞는 매장이 없어요.</p></aside>`;
  const productPanel = `<aside class="side side-products" aria-label="상품"><div class="side-head"><h2 id="selected-title"></h2><div class="side-actions"><button class="text-button" data-course-toggle hidden></button><button class="text-button" data-all-stores hidden>전체 매장 보기</button></div></div><div id="product-grid" class="side-list"></div></aside>`;
  // In the sheet layout the two buttons stay at the bottom edge and the lists only open when one is pressed.
  const sheet = `<div class="map-sheet" data-tab="${state.tab}"><div class="sheet-tabs" role="group" aria-label="목록 열기"><button data-tab="products"></button><button data-tab="stores"></button></div>${storePanel}${productPanel}</div>`;
  return `<section class="map-panel" aria-label="서울 매장 지도"><div id="map-canvas" tabindex="0" aria-label="서울 지도, 방향키로 이동할 수 있습니다"></div><div id="map-status" class="map-status"><p id="map-message" role="status">서울 지도를 불러오는 중이에요.</p><button class="secondary" data-map-retry disabled>${uiIcon("refresh")}지도 다시 시도</button></div>${controls}<a class="owner-fab" href="owner.html">${uiIcon("shop")}사장님 전용</a>${sheet}</section>`;
}
