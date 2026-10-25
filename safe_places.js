"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const statusEl = $("sc-status"), hospitalCards = $("sc-hospital-cards"), shelterCards = $("sc-shelter-cards");
  if (!statusEl || !hospitalCards || !shelterCards || !$("sc-map") || !window.L) {
    if (statusEl) statusEl.textContent = "Map library did not load. Use the Google Maps links below.";
    return;
  }
  let map = L.map("sc-map").setView([33.6007,73.0679],11), resultLayer = L.layerGroup().addTo(map), searchMarker;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map);
  const status = message => statusEl.textContent = message;
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function setGoogleLinks(q) {
    const e=encodeURIComponent(q);
    $("sc-google-hospitals").href=`https://www.google.com/maps/search/hospitals+near+${e}/`;
    $("sc-google-shelters").href=`https://www.google.com/maps/search/women+shelter+support+near+${e}/`;
  }
  function render(container, places, empty, type) {
    container.replaceChildren();
    if (!places.length) { const p=document.createElement("p"); p.textContent=empty; container.appendChild(p); return; }
    places.forEach(p=>{
      const t=p.tags||{}, lat=Number(p.lat ?? p.center?.lat), lon=Number(p.lon ?? p.center?.lon);
      const name=t.name || (type==="shelter"?"Support listing (name not listed)":"Medical facility (name not listed)");
      const addr=[t["addr:housenumber"],t["addr:street"],t["addr:suburb"],t["addr:city"]||t["addr:town"]||t["addr:village"]].filter(Boolean).join(", ")||"Address not listed in map data";
      const phone=t.phone||t["contact:phone"], website=t.website||t["contact:website"];
      const card=document.createElement("article"); card.className="sc-place-card";
      let links=`<a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name+" "+addr)}">Search on Google Maps</a>
      <a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lat+","+lon)}">Directions</a>`;
      if(website && /^https?:\/\//i.test(website)) links+=` <a target="_blank" rel="noopener noreferrer" href="${esc(website)}">Website</a>`;
      card.innerHTML=`<h4>${esc(name)}</h4><p>${esc(addr)}</p>${t.amenity?`<p>Category: ${esc(t.amenity)}</p>`:""}${phone?`<p>Phone listed: ${esc(phone)}</p>`:""}${links}`;
      container.appendChild(card);
      if(Number.isFinite(lat)&&Number.isFinite(lon)) L.marker([lat,lon]).bindPopup(`<strong>${esc(name)}</strong><br>${esc(addr)}`).addTo(resultLayer);
    });
  }
  async function geocode(q) {
    // Deliberate user-triggered lookup only; no autocomplete/background queries.
    const r=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q="+encodeURIComponent(q),{headers:{Accept:"application/json"}});
    if(!r.ok) throw Error("Area search is temporarily unavailable.");
    const d=await r.json(); if(!d.length) throw Error("Area not found. Try a nearby city or a more specific area.");
    return {lat:+d[0].lat,lon:+d[0].lon};
  }
  async function nearby(lat,lon,label) {
    resultLayer.clearLayers(); if(searchMarker) map.removeLayer(searchMarker);
    searchMarker=L.marker([lat,lon]).addTo(map).bindPopup("Selected search area");
    map.setView([lat,lon],13); setGoogleLinks(label||`${lat},${lon}`);
    hospitalCards.replaceChildren(); shelterCards.replaceChildren(); status("Searching nearby map listings…");
    const query=`[out:json][timeout:20];(
      node(around:10000,${lat},${lon})["amenity"~"^(hospital|clinic|doctors)$"];
      way(around:10000,${lat},${lon})["amenity"~"^(hospital|clinic|doctors)$"];
      relation(around:10000,${lat},${lon})["amenity"~"^(hospital|clinic|doctors)$"];
      node(around:15000,${lat},${lon})["social_facility"~"^(shelter|women_shelter|homeless_shelter|outreach)$"];
      way(around:15000,${lat},${lon})["social_facility"~"^(shelter|women_shelter|homeless_shelter|outreach)$"];
      relation(around:15000,${lat},${lon})["social_facility"~"^(shelter|women_shelter|homeless_shelter|outreach)$"];
    );out center tags;`;
    try {
      const r=await fetch("https://overpass-api.de/api/interpreter",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},body:"data="+encodeURIComponent(query)});
      if(!r.ok) throw Error("Free map search is busy. Try later or use Google Maps.");
      const d=await r.json(), els=d.elements||[];
      const hospitals=els.filter(e=>/^(hospital|clinic|doctors)$/.test((e.tags||{}).amenity||"")).slice(0,30);
      const shelters=els.filter(e=>/^(shelter|women_shelter|homeless_shelter|outreach)$/.test((e.tags||{}).social_facility||"")).slice(0,20);
      render(hospitalCards,hospitals,"No medical listings found in returned map data. This does not mean none exist. Try Google Maps.","hospital");
      render(shelterCards,shelters,"No tagged support listings found. This does not mean no services exist. Try Google Maps or a trusted local directory.","shelter");
      status(`Search finished: ${hospitals.length} medical listing(s), ${shelters.length} support listing(s). Listings may be incomplete or outdated.`);
    } catch(e) {
      console.error("SheCare nearby search:",e); status(e.message||"Search failed. Try again later.");
      hospitalCards.innerHTML='<p>Search unavailable. <a href="https://www.google.com/maps/search/hospitals/" target="_blank" rel="noopener noreferrer">Search hospitals on Google Maps</a>.</p>';
      shelterCards.innerHTML='<p>Search unavailable. <a href="https://www.google.com/maps/search/women+shelter+support/" target="_blank" rel="noopener noreferrer">Search support services on Google Maps</a>.</p>';
    }
  }
  async function searchArea() {
    const q=$("sc-area").value.trim(); if(!q){status("Enter a city or area first.");return;}
    status("Finding the area…");
    try { const p=await geocode(q); await nearby(p.lat,p.lon,q); } catch(e) { status(e.message||"Could not find that area."); }
  }
  $("sc-search-area").addEventListener("click",searchArea);
  $("sc-area").addEventListener("keydown",e=>{if(e.key==="Enter")searchArea();});
  $("sc-use-location").addEventListener("click",()=>{
    if(!navigator.geolocation){status("Location is not supported. Enter an area instead.");return;}
    status("Waiting for your location permission…");
    navigator.geolocation.getCurrentPosition(p=>nearby(p.coords.latitude,p.coords.longitude,`${p.coords.latitude},${p.coords.longitude}`),
      ()=>status("Location was not shared. Enter a city or area instead."),
      {enableHighAccuracy:false,timeout:10000,maximumAge:60000});
  });
})();
