
(function () {
    "use strict";

    const mapElement = document.getElementById("nearbyHealthcareMap");

    if (!mapElement || typeof L === "undefined") {
        console.error("Healthcare map container or Leaflet is missing.");
        return;
    }

    const status = document.getElementById("healthcareStatus");
    const searchInput = document.getElementById("healthcareSearch");
    const categorySelect = document.getElementById("healthcareCategory");
    const resultsElement = document.getElementById("healthcareResults");

    const map = L.map(mapElement).setView([30.3753, 69.3451], 5);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const markers = L.layerGroup().addTo(map);
    let facilities = [];

    function categoryOf(tags) {
        if (tags.amenity === "hospital") return "hospital";
        if (tags.amenity === "clinic") return "clinic";
        if (tags.amenity === "pharmacy") return "pharmacy";
        if (
            tags.amenity === "doctors" ||
            tags.amenity === "dentist"
        ) return "doctor";

        return "other";
    }

    function facilityName(item) {
        return item.tags.name || "Unnamed healthcare facility";
    }

    function renderResults() {
        const term = searchInput.value.trim().toLowerCase();
        const category = categorySelect.value;

        const filtered = facilities.filter(function (item) {
            const matchesName = facilityName(item)
                .toLowerCase()
                .includes(term);

            const matchesCategory =
                category === "all" || categoryOf(item.tags) === category;

            return matchesName && matchesCategory;
        });

        markers.clearLayers();
        resultsElement.replaceChildren();

        filtered.forEach(function (item) {
            const lat = item.lat ?? item.center?.lat;
            const lon = item.lon ?? item.center?.lon;

            if (typeof lat !== "number" || typeof lon !== "number") {
                return;
            }

            const name = facilityName(item);
            const categoryName = categoryOf(item.tags);

            const marker = L.marker([lat, lon]).addTo(markers);
            marker.bindPopup(
                document.createTextNode(name)
            );

            const card = document.createElement("article");
            card.className = "healthcare-result";

            const heading = document.createElement("h3");
            heading.textContent = name;

            const type = document.createElement("p");
            type.textContent = "Category: " + categoryName;

            const directions = document.createElement("a");
            directions.textContent = "Get directions";
            directions.href =
                "https://www.google.com/maps/dir/?api=1&destination=" +
                encodeURIComponent(lat + "," + lon);
            directions.target = "_blank";
            directions.rel = "noopener noreferrer";

            card.append(heading, type, directions);
            resultsElement.appendChild(card);

            card.addEventListener("click", function (event) {
                if (event.target.closest("a")) return;
                map.setView([lat, lon], 16);
                marker.openPopup();
            });
        });

        if (filtered.length === 0) {
            const message = document.createElement("p");
            message.textContent =
                "No matching facilities found in the loaded results.";
            resultsElement.appendChild(message);
        }
    }

    async function searchArea() {
        const center = map.getCenter();

        // Search within 5 km of the current map center.
        const query = `
[out:json][timeout:25];
(
  node["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist)$"]
    (around:5000,${center.lat},${center.lng});
  way["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist)$"]
    (around:5000,${center.lat},${center.lng});
  relation["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist)$"]
    (around:5000,${center.lat},${center.lng});
);
out center tags;
`;

        status.textContent = "Searching nearby facilities...";
        resultsElement.replaceChildren();

        try {
            const response = await fetch(
                "https://overpass-api.de/api/interpreter",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                    },
                    body: new URLSearchParams({ data: query })
                }
            );

            if (!response.ok) {
                throw new Error("Healthcare search service unavailable.");
            }

            const data = await response.json();
            facilities = data.elements || [];

            renderResults();

            status.textContent =
                "Loaded " + facilities.length +
                " mapped facilities. Data may be incomplete.";
        } catch (error) {
            status.textContent =
                "Could not load facilities. Please try again later.";
            console.error("Healthcare search error:", error);
        }
    }

    document.getElementById("searchHealthcareArea")
        .addEventListener("click", searchArea);

    searchInput.addEventListener("input", renderResults);
    categorySelect.addEventListener("change", renderResults);

    document.getElementById("useHealthcareLocation")
        .addEventListener("click", function () {
            if (!navigator.geolocation) {
                status.textContent =
                    "Location is not supported by this browser.";
                return;
            }

            status.textContent = "Waiting for location permission...";

            navigator.geolocation.getCurrentPosition(
                function (position) {
                    map.setView(
                        [position.coords.latitude, position.coords.longitude],
                        14
                    );

                    status.textContent =
                        "Location selected. Choose Search This Map Area to find facilities.";
                },
                function () {
                    status.textContent =
                        "Location permission was denied or unavailable.";
                }
            );
        });
})();
