const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbzNRmToQks5uJrQeOmgYpf_roCeSr_X63QIbbcIKwdRZhwcDsREvo01VU1jbkCdcGMopg/exec";

// ---------- UI ----------
const btn = document.getElementById("btn");
const countEl = document.getElementById("count");
const gpsStatusEl = document.getElementById("gpsStatus");
const catEl = document.getElementById("category");
const intEl = document.getElementById("intensity");
const iValEl = document.getElementById("iVal");

let count = 0;
iValEl.textContent = intEl.value;
intEl.addEventListener("input", () => {
  iValEl.textContent = intEl.value;
});

// ---------- CATEGORY COLORS ----------
const COLORS = {
  angst: [160, 130, 255],
  kaeledyr: [0, 190, 255],
  sundhed: [255, 120, 120],
  hoerelse: [255, 200, 80],
  affald: [120, 255, 160],
};

function colorFor(cat, intensity) {
  const base = COLORS[cat] || COLORS.angst;
  const t = intensity / 5;
  const a = 0.3 + t * 0.6;
  return `rgba(${base[0]},${base[1]},${base[2]},${a})`;
}

// ---------- GPS ----------
let gps = { lat: null, lon: null };
gpsStatusEl.textContent = "GPS: requesting";

navigator.geolocation.watchPosition(
  (pos) => {
    gps.lat = pos.coords.latitude;
    gps.lon = pos.coords.longitude;
    gpsStatusEl.textContent = "GPS: ok";
  },
  () => {
    gpsStatusEl.textContent = "GPS: denied";
  },
  { enableHighAccuracy: true }
);

// ---------- MAP ----------
const map = L.map("map", {
  zoomControl: false,
  attributionControl: false,
}).setView([56.2, 10.1], 6);

// Load Denmark regions (LOCAL FILE)
fetch("/geo/dk-regions.geojson")
  .then((r) => r.json())
  .then((geo) => {
    const dkOnly = {
      ...geo,
      features: geo.features.filter((f) => {
        const n = JSON.stringify(f.properties).toLowerCase();
        return !n.includes("greenland") && !n.includes("faroe");
      }),
    };

    const layer = L.geoJSON(dkOnly, {
      style: {
        color: "rgba(255,255,255,0.6)",
        weight: 1.5,
        fillColor: "#888",
        fillOpacity: 1,
      },
    }).addTo(map);

    map.fitBounds(layer.getBounds(), { padding: [20, 20] });
  });

// ---------- SEND ----------
btn.addEventListener("click", () => {
  if (!gps.lat || !gps.lon) return;

  count++;
  countEl.textContent = `Svar: ${count}`;

  const cat = catEl.value;
  const inten = Number(intEl.value);
  const col = colorFor(cat, inten);

  // draw dot
  L.circleMarker([gps.lat, gps.lon], {
    radius: 6 + inten * 2,
    fillColor: col,
    color: col,
    weight: 0,
    fillOpacity: 1,
  }).addTo(map);

  // save
  fetch(ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: cat,
      intensity: inten,
      lat: gps.lat,
      lon: gps.lon,
    }),
  });
});
