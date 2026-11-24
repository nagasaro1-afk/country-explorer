// How long cached data stays valid: 1 hour , in millliseconds.
const CACHE_MS = 3600000; // 1 hour

// works like fetch(),butchecks localStorage first. the URL is the cache key.
// fresh cached data is returned immediately with no network request.
// Otherwise the data is fetched from the API, validated, saved a returned.
async function cachedFetch(url) {
  
 // Works like fetch(), but checks localStorage first. The url is
 // Fresh cached data is returned immediately with no network requests.
 // Otherwise the data is fetched from the API, validated, saved and returned.



 // Try the cache .the  try/catch means broken or blocked storage is ignored
 // and we simply fall through to the network.
  try {
    const c = JSON.parse(localStorage.getItem(url) || "null");
    if (c && Date.now() - c.time < CACHE_MS) return c.data;
  } catch (e) {}
  // Cache missing or expired: call the API and check the responseis valid.
  const res = await fetch(url);
  if (!res.ok) throw new Error("API status " + res.status);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Bad response");
  
  // Save with a timestamp so we know it expires. Saving can fail (for
  // example when storage is full) , which must not break the app.
  try { localStorage.setItem(url, JSON.stringify({ time: Date.now(), data })); } catch (e) {}
  return data;
}
