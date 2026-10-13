// Visit course: an ordered list of store IDs. Pure helpers only; app.js owns the state and map.js draws it.
// The course lives in the page address (?course=id,id) so a copied link reopens it; nothing is stored anywhere.
const BabelmoCourse = (() => {
  const MAX = 10, PARAM = 'course';

  // Unknown IDs, repeats and anything past MAX are left out; dropped counts them so the app can say so.
  function parse(search, knownIds) {
    const raw = (new URLSearchParams(search).get(PARAM) || '').split(',').map(id => id.trim()).filter(Boolean);
    const ids = [];
    for (const id of raw) if (knownIds.includes(id) && !ids.includes(id) && ids.length < MAX) ids.push(id);
    return { ids, dropped: raw.length - ids.length };
  }

  // Returns the search string with the course written in (or taken out when empty); other parameters are kept.
  function toSearch(ids, search = '') {
    const params = new URLSearchParams(search);
    params.delete(PARAM);
    const rest = params.toString(), course = ids.length ? `${PARAM}=${ids.map(encodeURIComponent).join(',')}` : '';
    const query = [rest, course].filter(Boolean).join('&');
    return query ? `?${query}` : '';
  }

  // Adds the store at the end or takes it out. A full course is returned unchanged.
  function toggle(ids, id) {
    if (ids.includes(id)) return ids.filter(item => item !== id);
    return ids.length < MAX ? [...ids, id] : ids;
  }

  function move(ids, index, delta) {
    const target = index + delta;
    if (index < 0 || index >= ids.length || target < 0 || target >= ids.length) return ids;
    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }

  // Straight-line metres along the stops in order (haversine). Not a walking distance.
  function distance(points) {
    const rad = degrees => degrees * Math.PI / 180;
    let total = 0;
    for (let n = 1; n < points.length; n++) {
      const a = points[n - 1], b = points[n];
      const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
      total += 2 * 6371000 * Math.asin(Math.sqrt(h));
    }
    return total;
  }

  return { MAX, parse, toSearch, toggle, move, distance };
})();
