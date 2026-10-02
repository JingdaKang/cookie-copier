// Cookie Copier — popup entry point.
//
// Day 1: static shell only. Upcoming increments will, in order:
//   1. read the active tab's URL and show its domain
//   2. list that domain's cookies (chrome.cookies.getAll)
//   3. copy them as a "Cookie:" header string
//   4. add scope toggle, search, JSON export, and an options page.

document.addEventListener("DOMContentLoaded", () => {
  console.debug("Cookie Copier popup loaded");
});
