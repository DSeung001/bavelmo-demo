// Provider boundary: app.js supplies store IDs, coordinates or public addresses, counts, course stops and Seoul rings.
const BabelmoMap = (() => {
  let sdkPromise;
  const SEOUL_CENTER = [37.5665, 126.9780], SEOUL_BOUNDS = [[37.43, 126.80], [37.70, 127.18]];
  const HONGDAE_CENTER = [37.5572, 126.9254], INITIAL_LEVEL = 5;
  const MIN_LEVEL = 2, MAX_LEVEL = 10, DEFAULT_PADDING = [64, 80, 64, 80];
  // Ordinary store names appear from NAME_LEVEL inwards; isolated selected/course stores also keep names further out.
  const CLUSTER_PX = 64, MARKER_GAP = 8, FOCUS_LEVEL = 5, NAME_LEVEL = 5;
  // Everything outside Seoul is dimmed by one large shape with Seoul cut out; the provider's own tiles stay as they are.
  const MASK_BOX = [[35.5, 124.5], [35.5, 129.5], [39.5, 129.5], [39.5, 124.5]];
  const MASK_OPACITY = 0.35, AREA_OPACITY = 0.5;
  // Every district gets its own tint, but all of them stay in one muted family around the brand purple (blue-violet
  // to pink). The tone number (0-3, never shared by neighbours) sets the lightness and a small hue turn, and each
  // district inside a tone shifts the hue a little further.
  const TINT_HUE = 228, TONE_TURN = 20, TINT_STEP = 2.5, TINT_SATURATION = 0.5, TINT_OPACITY = 0.25;
  const TINT_LIGHT = [0.52, 0.72, 0.6, 0.8];
  const tint = (hue, light) => '#' + [0, 8, 4].map(n => {
    const k = (n + hue / 30) % 12, spread = TINT_SATURATION * Math.min(light, 1 - light);
    return Math.round((light - spread * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, '0');
  }).join('');
  const motion = () => !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && { duration: 300 };

  function loadSdk(key) {
    if (window.kakao?.maps?.Map) return Promise.resolve(window.kakao.maps);
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      let finished = false;
      const finish = (error) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        script.onerror = script.onload = null;
        if (error) { script.remove(); reject(error); }
        else resolve(window.kakao.maps);
      };
      const timer = setTimeout(() => finish(new Error('sdk')), 12000);
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?autoload=false&libraries=services&appkey=${encodeURIComponent(key)}`;
      script.onerror = () => finish(new Error('sdk'));
      script.onload = () => {
        if (finished) return;
        try { window.kakao.maps.load(() => finish()); }
        catch { finish(new Error('sdk')); }
      };
      document.head.append(script);
    }).catch(error => { sdkPromise = null; throw error; });
    return sdkPromise;
  }

  // area is the app's district select; it lives outside the panel and outlives each mount, so dispose releases it.
  function mount(panel, { onSelect, shapes, countIcon, onCoordinates = () => {}, area = { addEventListener() {}, removeEventListener() {} } }) {
    const canvas = panel.querySelector('#map-canvas');
    const status = panel.querySelector('#map-status');
    const message = panel.querySelector('#map-message');
    const retry = panel.querySelector('[data-map-retry]');
    const controls = [...panel.querySelectorAll('[data-map-zoom], [data-map-home]'), area];
    let map, maps, observer, overlays = [], latest = { stores: [], selected: null, filter: '' };
    let disposed = false, attempt = 0, previousFilter = null, previousSelected = null, focusId = null, markerFocusId = null;
    let maxLevel = MAX_LEVEL, limitPadding = null, seoulShapes = [], highlight = null, areaBox = null, refocus = null;
    let courseLine = null, courseKey = '', courseWaiting = false;
    const resolving = new Set();
    const positioned = store => Number.isFinite(store.lat) && Number.isFinite(store.lng);
    function resolveAddresses() {
      if (!maps?.services?.Geocoder) return;
      const geocoder = new maps.services.Geocoder();
      [...latest.stores, ...(latest.course || [])].filter(store => !positioned(store) && store.searchAddress && !resolving.has(store.id)).forEach(store => {
        if (resolving.has(store.id)) return;
        resolving.add(store.id);
        geocoder.addressSearch(store.searchAddress, (results, status) => {
          if (disposed || status !== maps.services.Status.OK || !results?.length) return;
          const lat = Number(results[0].y), lng = Number(results[0].x);
          if (lat < 37.43 || lat > 37.70 || lng < 126.80 || lng > 127.18) return;
          if (Number.isFinite(lat) && Number.isFinite(lng)) onCoordinates(store.id, { lat, lng });
        }, { analyze_type: maps.services.AnalyzeType?.EXACT });
      });
    }
    let locating = false, adjustingLimits = false;
    const cancelLocation = () => { locating = false; };
    const onZoomChanged = () => { if (!adjustingLimits) cancelLocation(); draw(); };

    function locate() {
      if (!globalThis.navigator?.geolocation) return;
      locating = true;
      const finish = position => {
        if (!locating || disposed) return;
        locating = false;
        const lat = position?.coords.latitude, lng = position?.coords.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
        map.setLevel(INITIAL_LEVEL);
        map.setCenter(new maps.LatLng(lat, lng));
        draw();
      };
      try {
        navigator.geolocation.getCurrentPosition(finish, () => { locating = false; }, { timeout: 8000, maximumAge: 300000, enableHighAccuracy: false });
      } catch { locating = false; }
    }
    const token = name => getComputedStyle(canvas).getPropertyValue(name).trim();
    const toPath = ring => ring.map(point => new maps.LatLng(...point));

    function drawSeoul() {
      if (!shapes?.outline?.length) return;
      const ink = token('--ink'), rings = shapes.outline.map(toPath), seen = [0, 0, 0, 0];
      seoulShapes = [
        new maps.Polygon({ map, path: [toPath(MASK_BOX), ...rings], strokeWeight: 0, strokeOpacity: 0, fillColor: ink, fillOpacity: MASK_OPACITY }),
        ...Object.entries(shapes.districts || {}).map(([name, district], n) => {
          const tone = (shapes.tones?.[name] ?? n) % 4;
          const fillColor = tint(TINT_HUE + tone * TONE_TURN + seen[tone]++ * TINT_STEP, TINT_LIGHT[tone]);
          return new maps.Polygon({ map, path: district.map(toPath), strokeWeight: 1, strokeColor: ink, strokeOpacity: 0.5, fillColor, fillOpacity: TINT_OPACITY });
        }),
        ...rings.map(path => new maps.Polyline({ map, path, strokeWeight: 2, strokeColor: ink, strokeOpacity: 1 }))
      ];
    }

    function clearArea() {
      area.value = '';
      highlight?.setMap(null);
      highlight = areaBox = null;
    }

    // Highlights the chosen district and fits it between the app's panels. Moving the map never changes the search.
    function showArea(name) {
      const rings = shapes?.districts?.[name];
      if (!rings) { clearArea(); return; }
      highlight?.setMap(null);
      const purple = token('--purple'), points = rings.flat(), bounds = new maps.LatLngBounds();
      points.forEach(point => bounds.extend(new maps.LatLng(...point)));
      highlight = new maps.Polygon({ map, path: rings.map(toPath), strokeWeight: 4, strokeColor: purple, strokeOpacity: 1, fillColor: purple, fillOpacity: AREA_OPACITY, zIndex: 1 });
      areaBox = {
        south: Math.min(...points.map(point => point[0])), north: Math.max(...points.map(point => point[0])),
        west: Math.min(...points.map(point => point[1])), east: Math.max(...points.map(point => point[1]))
      };
      map.setBounds(bounds, ...(latest.padding || DEFAULT_PADDING));
    }

    // A resize in the middle of an animated move can leave the map short of the store it was heading for.
    function onIdle() {
      const moving = refocus, center = map.getCenter();
      refocus = null;
      if (moving && Math.hypot(center.getLat() - moving.point.getLat(), center.getLng() - moving.point.getLng()) > 1e-5) map.setCenter(moving.point);
      checkArea();
      draw();
    }

    // The district stays highlighted while any of it is on screen; once the view has left it, the choice is dropped.
    function checkArea() {
      if (!areaBox) return;
      const view = map.getBounds(), sw = view.getSouthWest(), ne = view.getNorthEast();
      const visible = sw.getLat() <= areaBox.north && ne.getLat() >= areaBox.south && sw.getLng() <= areaBox.east && ne.getLng() >= areaBox.west;
      if (!visible) clearArea();
    }

    function fit(items, includeSeoul = false) {
      if (!map) return;
      items = items.filter(positioned);
      if (!items.length) { map.setLevel(8); map.setCenter(new maps.LatLng(...SEOUL_CENTER)); return; }
      if (items.length === 1 && !includeSeoul) {
        map.setLevel(5); map.setCenter(new maps.LatLng(items[0].lat, items[0].lng)); return;
      }
      const bounds = new maps.LatLngBounds();
      items.forEach(store => bounds.extend(new maps.LatLng(store.lat, store.lng)));
      if (includeSeoul) SEOUL_BOUNDS.forEach(point => bounds.extend(new maps.LatLng(...point)));
      // The app supplies top/right/bottom/left padding so markers stay clear of its overlay panels.
      map.setBounds(bounds, ...(latest.padding || DEFAULT_PADDING));
    }

    // Seoul-only service: the widest view allowed is the one that fits Seoul in the current canvas and padding.
    function limitZoomOut() {
      adjustingLimits = true;
      const center = map.getCenter(), level = map.getLevel();
      const bounds = new maps.LatLngBounds();
      SEOUL_BOUNDS.forEach(point => bounds.extend(new maps.LatLng(...point)));
      map.setMaxLevel(MAX_LEVEL);
      map.setBounds(bounds, ...(latest.padding || DEFAULT_PADDING));
      maxLevel = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, map.getLevel()));
      map.setMaxLevel(maxLevel);
      map.setLevel(Math.min(level, maxLevel));
      map.setCenter(center);
      limitPadding = String(latest.padding);
      adjustingLimits = false;
    }

    function zoomTo(level, anchor) {
      const options = { animate: motion() };
      if (anchor) options.anchor = anchor;
      map.setLevel(Math.max(MIN_LEVEL, Math.min(maxLevel, level)), options);
    }

    // Selecting a store never zooms out: a closer level the user already chose is kept.
    function focusOn(store) {
      const point = new maps.LatLng(store.lat, store.lng);
      const level = Math.min(map.getLevel(), FOCUS_LEVEL);
      refocus = { point, level };
      if (level === map.getLevel()) map.panTo(point);
      else map.jump(point, level, { animate: motion() });
    }

    // stop is the store's place in the visit course (0 when it is not in it) and goes in front of the name.
    // A course stop the current search leaves out has no products to show, so it is a plain label, not a button.
    function storeButton(store, selected, stop) {
      const listed = store.count !== undefined;
      const button = document.createElement(listed ? 'button' : 'span');
      button.className = `map-marker${selected ? ' selected' : ''}${stop ? ' in-course' : ''}`;
      const name = document.createElement('span');
      if (stop) {
        const order = document.createElement('span'), text = document.createElement('span');
        order.className = 'course-order';
        order.textContent = stop;
        text.textContent = store.name;
        name.className = 'marker-name';
        name.append(order, text);
      } else name.textContent = store.name;
      button.append(name);
      if (!listed) { button.setAttribute('aria-label', `동선 ${stop}번째, ${store.name}, ${store.area}`); return button; }
      button.dataset.store = store.id;
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${stop ? `동선 ${stop}번째, ` : ''}${store.name}, ${store.area}, 검색 상품 ${store.count}개, 판매 가능 ${store.available}개`);
      const count = document.createElement('strong');
      count.textContent = `상품 ${store.count}`;
      button.append(count);
      button.addEventListener('click', event => { event.stopPropagation(); onSelect(store.id); });
      return button;
    }

    function clusterButton(stores, center) {
      const button = document.createElement('button');
      button.className = 'map-cluster';
      button.dataset.shape = stores.length > 1 ? 'group' : 'single';
      const size = 48 + Math.min(64, Math.ceil(Math.sqrt(stores.length) * 8));
      button.style.width = `${size}px`;
      button.style.height = `${size}px`;
      button.dataset.anchor = stores[0].id;
      const [only] = stores, single = stores.length === 1;
      button.setAttribute('aria-label', single
        ? `${only.name}, ${only.area}, 검색 상품 ${only.count}개, 판매 가능 ${only.available}개, 매장 선택`
        : `이 근처 매장 ${stores.length}곳, 확대해서 보기`);
      const count = document.createElement('strong');
      count.textContent = stores.length;
      // The app supplies its own shop icon markup; without one the count keeps its text unit.
      const unit = document.createElement('span');
      if (countIcon) { unit.innerHTML = countIcon; button.append(unit, count); }
      else { unit.textContent = '곳'; button.append(count, unit); }
      button.addEventListener('click', event => {
        event.stopPropagation();
        if (single) { onSelect(only.id); return; }
        if (map.getLevel() <= MIN_LEVEL) return;
        focusId = stores[0].id;
        zoomTo(map.getLevel() - 2, center);
      });
      return button;
    }

    // Keep the 64px proximity rule, then merge actual marker rectangles until every pair has room.
    // Every merge reduces the group count, so even co-located stores terminate in one count marker.
    function draw() {
      if (!map || disposed) return;
      const data = latest;
      const active = canvas.contains(document.activeElement) ? document.activeElement.dataset : {};
      const activeGroup = overlays.find(item => item.button === document.activeElement);
      const activeId = active.store || (activeGroup?.ids.includes(markerFocusId) ? markerFocusId : active.anchor) || null;
      overlays.forEach(({ overlay }) => overlay.setMap(null));
      const projection = map.getProjection(), named = map.getLevel() <= NAME_LEVEL;
      const groups = [], course = data.course || [];
      const stops = new Map(course.map((stop, n) => [stop.id, n + 1]));
      // Search records carry product counts and take precedence over the same store in the course.
      const unique = new Map();
      [...data.stores, ...course].forEach(store => { if (!unique.has(store.id)) unique.set(store.id, store); });
      const ordered = [...unique.values()].filter(positioned).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      ordered.forEach(store => {
        const point = projection.containerPointFromCoords(new maps.LatLng(store.lat, store.lng));
        const near = groups.find(group => Math.hypot(group.x - point.x, group.y - point.y) <= CLUSTER_PX);
        if (!near) { groups.push({ stores: [store], x: point.x, y: point.y }); return; }
        const size = near.stores.push(store);
        near.x += (point.x - near.x) / size;
        near.y += (point.y - near.y) / size;
      });
      // Kakao detaches off-screen overlays; measure in the canvas before giving content to the SDK.
      const measure = document.createElement('div');
      measure.style.cssText = 'position:absolute;left:0;top:0;width:max-content;visibility:hidden;pointer-events:none';
      measure.setAttribute('aria-hidden', 'true');
      canvas.append(measure);
      function render(stores) {
        const solo = stores.length === 1 && (stores[0].id === data.selected || stops.has(stores[0].id));
        const many = stores.length > 1 || (!solo && !named);
        const position = new maps.LatLng(
          stores.reduce((sum, store) => sum + store.lat, 0) / stores.length,
          stores.reduce((sum, store) => sum + store.lng, 0) / stores.length);
        const stop = many ? 0 : stops.get(stores[0].id) || 0;
        const button = many ? clusterButton(stores, position) : storeButton(stores[0], stores[0].id === data.selected, stop);
        const yAnchor = many || stop ? 0.5 : 1;
        measure.append(button);
        // Include a pixel on each side for CSS fractional sizes and SDK position rounding.
        const width = button.offsetWidth + 2, height = button.offsetHeight + 2;
        const overlay = new maps.CustomOverlay({ map, content: button, position, xAnchor: 0.5, yAnchor, clickable: true, zIndex: solo ? 3 : many ? 2 : 1 });
        const point = projection.containerPointFromCoords(position);
        const rect = { left: point.x - width / 2, right: point.x + width / 2,
          top: point.y - height * yAnchor, bottom: point.y + height * (1 - yAnchor) };
        return { overlay, button, stores, rect, ids: stores.map(store => store.id) };
      }
      overlays = groups.map(group => render(group.stores));
      let merged = true;
      while (merged) {
        merged = false;
        outer: for (let i = 0; i < overlays.length; i++) {
          for (let j = i + 1; j < overlays.length; j++) {
            const a = overlays[i], b = overlays[j], r = a.rect, s = b.rect;
            if (r.left >= s.right + MARKER_GAP || s.left >= r.right + MARKER_GAP ||
                r.top >= s.bottom + MARKER_GAP || s.top >= r.bottom + MARKER_GAP) continue;
            a.overlay.setMap(null); b.overlay.setMap(null);
            const stores = [...a.stores, ...b.stores].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
            overlays[i] = render(stores);
            overlays.splice(j, 1);
            merged = true;
            break outer;
          }
        }
      }
      measure.remove();
      const target = overlays.find(item => item.ids.includes(focusId || activeId));
      if (target) { markerFocusId = focusId || activeId; target.button.focus({ preventScroll: true }); focusId = null; }
    }

    // The visit course connects actual coordinates even while its numbered name markers are clustered.
    function drawCourse() {
      const stops = latest.course || [], key = stops.map(stop => `${stop.id}:${stop.lat}:${stop.lng}`).join();
      if (key === courseKey) return;
      courseKey = key;
      courseLine?.setMap(null);
      const points = stops.every(positioned) ? stops.map(stop => new maps.LatLng(stop.lat, stop.lng)) : [];
      courseLine = points.length > 1 ? new maps.Polyline({ map, path: points, strokeWeight: 4, strokeColor: token('--purple'), strokeOpacity: 1, zIndex: 2 }) : null;
    }

    // Fits the whole course between the app's panels; asked for before the map exists, it happens once it does.
    function showCourse() {
      if (!map) { courseWaiting = true; return; }
      courseWaiting = false;
      cancelLocation();
      if (!latest.course?.length) return;
      clearArea();
      fit(latest.course);
    }

    function update(data) {
      latest = data;
      if (!map || disposed) return;
      if (String(data.padding) !== limitPadding) limitZoomOut();
      resolveAddresses();
      const selected = data.stores.find(store => store.id === data.selected && positioned(store));
      const filterChanged = previousFilter !== data.filter;
      // Clearing a selection keeps the current view; only a new search refits the markers.
      const moves = selected ? previousSelected !== data.selected || filterChanged : filterChanged;
      // The map is about to move for a search or store change, so the chosen area no longer describes the view.
      if (moves) { cancelLocation(); clearArea(); }
      if (moves && selected) focusOn(selected);
      else if (moves && previousFilter !== null) fit(data.stores);
      previousFilter = data.filter;
      previousSelected = selected?.id || null;
      draw();
      drawCourse();
    }

    async function start() {
      const current = ++attempt;
      retry.disabled = true;
      controls.forEach(button => { button.disabled = true; });
      status.hidden = false;
      status.dataset.state = 'loading';
      message.textContent = '서울 지도를 불러오는 중이에요.';
      canvas.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch('config.json', { signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error('config');
        const config = await response.json();
        if (disposed || current !== attempt) return;
        if (!config.kakaoMapJsKey) throw new Error('missing-key');
        const sdk = await loadSdk(config.kakaoMapJsKey);
        if (disposed || current !== attempt) return;
        maps = sdk;
        map = new maps.Map(canvas, { center: new maps.LatLng(...HONGDAE_CENTER), level: INITIAL_LEVEL, scrollwheel: true, keyboardShortcuts: true });
        map.setMinLevel(MIN_LEVEL);
        limitZoomOut();
        drawSeoul();
        maps.event.addListener(map, 'idle', onIdle);
        maps.event.addListener(map, 'zoom_changed', onZoomChanged);
        maps.event.addListener(map, 'dragstart', cancelLocation);
        status.hidden = true;
        controls.forEach(button => { button.disabled = false; });
        update(latest);
        if (courseWaiting) showCourse();
        else if (!latest.selected) locate();
        // Selecting a store can resize the canvas in the same turn (the app opens its list sheet) while the map is
        // still moving there; that move is finished against the new size so the store ends up in the middle.
        observer = new ResizeObserver(() => {
          const moving = refocus, center = map.getCenter();
          map.relayout(); limitZoomOut();
          if (moving) map.setLevel(moving.level);
          map.setCenter(moving ? moving.point : center);
          draw();
        });
        observer.observe(canvas);
      } catch (error) {
        if (disposed || current !== attempt) return;
        status.dataset.state = 'error';
        message.textContent = error.message === 'missing-key'
          ? '지도 키가 아직 설정되지 않았어요. RUN.md의 안내에 따라 JavaScript 키를 설정해주세요. 매장·상품 목록은 계속 사용할 수 있어요.'
          : '지도를 불러오지 못했어요. 인터넷 연결·지도 키·등록 도메인을 확인하고 다시 시도해주세요. 매장·상품 목록은 계속 사용할 수 있어요.';
      } finally {
        if (!disposed && current === attempt) { retry.disabled = false; canvas.setAttribute('aria-busy', 'false'); }
      }
    }

    document.fonts?.addEventListener('loadingdone', draw);
    document.fonts?.ready.then(draw);
    retry.addEventListener('click', start);
    panel.querySelector('[data-map-home]').addEventListener('click', () => { cancelLocation(); clearArea(); fit(latest.stores, true); });
    const onArea = () => { if (map) { cancelLocation(); showArea(area.value); } };
    area.addEventListener('change', onArea);
    panel.querySelectorAll('[data-map-zoom]').forEach(button => button.addEventListener('click', () => {
      if (map) zoomTo(map.getLevel() + Number(button.dataset.mapZoom));
    }));
    start();
    return {
      update,
      showCourse,
      focusStore(id) {
        const target = overlays.find(item => item.ids.includes(id));
        if (target) { markerFocusId = id; target.button.focus({ preventScroll: true }); return true; }
        focusId = id; return false;
      },
      dispose() {
        disposed = true; cancelLocation(); attempt++; observer?.disconnect();
        document.fonts?.removeEventListener('loadingdone', draw);
        area.removeEventListener('change', onArea); clearArea(); area.disabled = true;
        if (map) { maps.event.removeListener(map, 'zoom_changed', onZoomChanged); maps.event.removeListener(map, 'dragstart', cancelLocation); maps.event.removeListener(map, 'idle', onIdle); }
        overlays.forEach(({ overlay }) => overlay.setMap(null)); overlays = [];
        courseLine?.setMap(null); courseLine = null;
        [...seoulShapes, highlight].forEach(shape => shape?.setMap(null)); seoulShapes = []; highlight = areaBox = null;
      }
    };
  }
  return { mount };
})();
