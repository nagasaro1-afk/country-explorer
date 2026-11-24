// REST countries endpoint. The "fields" parameter limits the response to only
// the data we display (v3.1 requires it, and eit keeps the download small).
const API = "https://restcountries.com/v3.1/all?fields=name,capital,region,population,flags,languages,currencies";

// Shortcut for document.getElementById, used throughout the file.
const $ = (id) => document.getElementById(id);

// Escapes special characters (& <> " ') in API data before it goes into the
// page. Ths stops XSS: text from the API can never run as thr HTML or script.
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => "&#" + ch.charCodeAt(0) + ";");

// Languages and currencies come as objects , so this turns them into a
// readable string like"English, French" . Shows N/A if the data is missing.
const names = (o) => (o ? Object.values(o).map((x) => x.name || x).join(", ") : "N/A");
 
// Holds every country by the API. Search/filter/sort work on this
// list in meemory, so they are instant and need no extra API calls.
let countries = [];

// Loads the data (from cache or the API) and shows it. If anything fails,
// the user sees a clear message and a Retry button instead of a blank page.
async function load() {
  $("status").textContent = "Loading countries...";
  $("retry").hidden = true;
  try {
  countries = await cachedFetch(API);
    render();
  } catch (e) {
    $("status").textContent = `Could not load data (${e.message}). Check your connection and retry.`;
    $("retry").hidden = false;
  }
}

// Reuilds the results grid from the current search, region and sort choices.
function render() {
  const term = $("search").value.trim().toLowerCase();
  const region = $("region").value;
  const [key, dir] = $("sort").value.split("-"); // e.g. "pop-desc" -> "pop", "desc"
  const list = countries
  // Keep countries whose name contains the search text and match the region
    .filter((c) => c.name.common.toLowerCase().includes(term) && (!region || c.region === region))
   //  Sort by name or population; multiplying by 1 or -1 flips the direction
    .sort((a, b) => (key === "name" ? a.name.common.localeCompare(b.name.common) : a.population - b.population) * (dir === "asc" ? 1 : -1));
  $("count").textContent = list.length + " countries found";
  $("status").textContent = list.length ? "" : "No countries match your search.";
  $("results").innerHTML = list.map(card).join("");
}

// Builds the HTML for one country card. "?." avoids errors when a field is
// misssing, and "|| 'N/A'" supplies a fallback value.
const card = (c) => `<div class="card">
  <img src="${esc(c.flags?.png || "")}" alt="Flag of ${esc(c.name.common)}">
  <h3>${esc(c.name.common)}</h3>
  <p><b>Capital:</b> ${esc(c.capital?.join(", ") || "N/A")}</p>
  <p><b>Region:</b> ${esc(c.region || "N/A")}</p>
  <p><b>Population:</b> ${c.population.toLocaleString()}</p>
  <p><b>Languages:</b> ${esc(names(c.languages))}</p>
  <p><b>Currency:</b> ${esc(names(c.currencies))}</p></div>`;

  // Re-render whenever the user types in the search box or changes a dropdown.
["search", "region", "sort"].forEach((id) => $(id).addEventListener("input", render));

// The retry button runs the loading step again.
$("retry").onclick = load;

// Starts the app.
load();
