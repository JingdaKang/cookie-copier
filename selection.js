// Tracks which cookies the user has checked for partial export. Cookies are
// uniquely identified by the (name, domain, path) triple, so selection is keyed
// on that and survives re-sorting and re-filtering of the same fetch.

export function cookieKey(cookie) {
  return `${cookie.name}\t${cookie.domain}\t${cookie.path}`;
}

export class Selection {
  constructor() {
    this.keys = new Set();
  }

  has(cookie) {
    return this.keys.has(cookieKey(cookie));
  }

  // Flip one cookie's membership; returns its new selected state.
  toggle(cookie) {
    const key = cookieKey(cookie);
    if (this.keys.has(key)) {
      this.keys.delete(key);
    } else {
      this.keys.add(key);
    }
    return this.keys.has(key);
  }

  // Select or deselect every cookie in the list (used by "select all").
  setAll(cookies, on) {
    for (const cookie of cookies) {
      const key = cookieKey(cookie);
      if (on) {
        this.keys.add(key);
      } else {
        this.keys.delete(key);
      }
    }
  }

  clear() {
    this.keys.clear();
  }

  get size() {
    return this.keys.size;
  }

  // Are all of these cookies currently selected? Empty input is not "all".
  allSelected(cookies) {
    return cookies.length > 0 && cookies.every((cookie) => this.has(cookie));
  }

  // Drop keys no longer present in `cookies`, e.g. after a refresh.
  retain(cookies) {
    const live = new Set(cookies.map(cookieKey));
    for (const key of this.keys) {
      if (!live.has(key)) this.keys.delete(key);
    }
  }

  // The subset of `cookies` that is selected, preserving their order.
  pick(cookies) {
    return cookies.filter((cookie) => this.keys.has(cookieKey(cookie)));
  }
}
