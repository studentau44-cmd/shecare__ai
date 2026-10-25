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

    const searchButton = document.getElementById("searchHealthcareArea");
    const locationButton = document.getElementById("useHealthcareLocation");

    const map = L.map(mapElement, {
        zoomControl: true
    }).setView([30.3753, 69.3451], 5);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        tileSize: 256,
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    /*
     * Fix Leaflet rendering when the map is inside
     * a hidden/tabbed section.
     */
    setTimeout(function () {
        map.invalidateSize();
    }, 300);

    window.addEventListener("resize", function () {
        map.invalidateSize();
    });

    const markers = L.layerGroup().addTo(map);

    let facilities = [];

    function categoryOf(tags) {
        tags = tags || {};

        if (tags.amenity === "hospital") return "hospital";
        if (tags.amenity === "clinic") return "clinic";
        if (tags.amenity === "pharmacy") return "pharmacy";

        if (
            tags.amenity === "doctors" ||
            tags.amenity === "dentist"
        ) {
            return "doctor";
        }

        if (
            tags.amenity === "social_facility" ||
            tags.social_facility === "shelter" ||
            tags.amenity === "shelter"
        ) {
            return "shelter";
        }

        return "other";
    }

    function facilityName(item) {
        const tags = item.tags || {};

        return (
            tags.name ||
            tags["name:en"] ||
            tags["name:ur"] ||
            tags["name:hi"] ||
            "Unnamed healthcare facility"
        );
    }

    function getCoordinates(item) {
        if (
            typeof item.lat === "number" &&
            typeof item.lon === "number"
        ) {
            return {
                lat: item.lat,
                lon: item.lon
            };
        }

        if (
            item.center &&
            typeof item.center.lat === "number" &&
            typeof item.center.lon === "number"
        ) {
            return {
                lat: item.center.lat,
                lon: item.center.lon
            };
        }

        return null;
    }

    function renderResults() {
        const term = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const category = categorySelect
            ? categorySelect.value
            : "all";

        const filtered = facilities.filter(function (item) {
            const name = facilityName(item).toLowerCase();

            const matchesName =
                !term || name.includes(term);

            const itemCategory = categoryOf(item.tags);

            const matchesCategory =
                category === "all" ||
                itemCategory === category;

            return matchesName && matchesCategory;
        });

        markers.clearLayers();

        if (resultsElement) {
            resultsElement.replaceChildren();
        }

        filtered.forEach(function (item) {
            const coordinates = getCoordinates(item);

            if (!coordinates) {
                return;
            }

            const name = facilityName(item);
            const categoryName = categoryOf(item.tags);

            const marker = L.marker([
                coordinates.lat,
                coordinates.lon
            ]).addTo(markers);

            const popup = document.createElement("div");

            const popupTitle = document.createElement("strong");
            popupTitle.textContent = name;

            const popupType = document.createElement("div");
            popupType.textContent =
                "Category: " + categoryName;

            popup.append(
                popupTitle,
                popupType
            );

            marker.bindPopup(popup);

            if (resultsElement) {
                const card = document.createElement("article");
                card.className = "healthcare-result";

                const heading = document.createElement("h3");
                heading.textContent = name;

                const type = document.createElement("p");
                type.textContent =
                    "Category: " + categoryName;

                const directions = document.createElement("a");

                directions.textContent = "Get directions";

                directions.href =
                    "https://www.google.com/maps/dir/?api=1&destination=" +
                    encodeURIComponent(
                        coordinates.lat +
                        "," +
                        coordinates.lon
                    );

                directions.target = "_blank";
                directions.rel = "noopener noreferrer";

                card.append(
                    heading,
                    type,
                    directions
                );

                resultsElement.appendChild(card);

                card.addEventListener(
                    "click",
                    function (event) {
                        if (event.target.closest("a")) {
                            return;
                        }

                        map.setView(
                            [
                                coordinates.lat,
                                coordinates.lon
                            ],
                            16
                        );

                        marker.openPopup();
                    }
                );
            }
        });

        if (
            filtered.length === 0 &&
            resultsElement
        ) {
            const message =
                document.createElement("p");

            message.textContent =
                facilities.length === 0
                    ? "No facilities were returned for this map area. Move the map to your city and search again."
                    : "No matching facilities found.";

            resultsElement.appendChild(message);
        }
    }

    /*
     * Multiple public Overpass servers.
     * If one is unavailable, another can be tried.
     */
    const OVERPASS_SERVERS = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];

    async function queryOverpass(server, query) {
        const response = await fetch(server, {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded;charset=UTF-8"
            },
            body: new URLSearchParams({
                data: query
            })
        });

        if (!response.ok) {
            throw new Error(
                "Overpass server returned " +
                response.status
            );
        }

        return await response.json();
    }

    async function searchArea() {
        const center = map.getCenter();

        /*
         * Search within 20 km instead of only 5 km.
         * This gives much better results for cities.
         */
        const radius = 20000;

        const query = `
[out:json][timeout:60];
(
  node["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist)$"]
    (around:${radius},${center.lat},${center.lng});

  way["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist)$"]
    (around:${radius},${center.lat},${center.lng});

  relation["amenity"~"^(hospital|clinic|pharmacy|doctors|dentist)$"]
    (around:${radius},${center.lat},${center.lng});

  node["amenity"="shelter"]
    (around:${radius},${center.lat},${center.lng});

  way["amenity"="shelter"]
    (around:${radius},${center.lat},${center.lng});

  relation["amenity"="shelter"]
    (around:${radius},${center.lat},${center.lng});

  node["social_facility"="shelter"]
    (around:${radius},${center.lat},${center.lng});

  way["social_facility"="shelter"]
    (around:${radius},${center.lat},${center.lng});

  relation["social_facility"="shelter"]
    (around:${radius},${center.lat},${center.lng});
);
out center tags;
`;

        if (status) {
            status.textContent =
                "Searching nearby healthcare facilities and shelters...";
        }

        if (resultsElement) {
            resultsElement.replaceChildren();
        }

        let lastError = null;

        for (const server of OVERPASS_SERVERS) {
            try {
                const data =
                    await queryOverpass(
                        server,
                        query
                    );

                facilities =
                    Array.isArray(data.elements)
                        ? data.elements
                        : [];

                renderResults();

                if (status) {
                    status.textContent =
                        "Found " +
                        facilities.length +
                        " nearby facilities. OpenStreetMap data may be incomplete.";
                }

                return;

            } catch (error) {
                console.warn(
                    "Overpass server failed:",
                    server,
                    error
                );

                lastError = error;
            }
        }

        facilities = [];

        if (status) {
            status.textContent =
                "Could not load nearby facilities. Please try again.";
        }

        if (resultsElement) {
            const message =
                document.createElement("p");

            message.textContent =
                "The public map data service is temporarily unavailable. Please try again.";

            resultsElement.appendChild(message);
        }

        console.error(
            "Healthcare search failed:",
            lastError
        );
    }

    if (searchButton) {
        searchButton.addEventListener(
            "click",
            searchArea
        );
    }

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderResults
        );
    }

    if (categorySelect) {
        categorySelect.addEventListener(
            "change",
            renderResults
        );
    }

    if (locationButton) {
        locationButton.addEventListener(
            "click",
            function () {
                if (!navigator.geolocation) {
                    if (status) {
                        status.textContent =
                            "Location is not supported by this browser.";
                    }

                    return;
                }

                if (status) {
                    status.textContent =
                        "Waiting for location permission...";
                }

                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        map.setView(
                            [
                                position.coords.latitude,
                                position.coords.longitude
                            ],
                            13
                        );

                        setTimeout(function () {
                            map.invalidateSize();
                        }, 200);

                        if (status) {
                            status.textContent =
                                "Location selected. Now press Search This Map Area.";
                        }
                    },

                    function () {
                        if (status) {
                            status.textContent =
                                "Location permission was denied or unavailable. Move the map manually and search the area.";
                        }
                    },

                    {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            }
        );
    }

    /*
     * Initial render.
     */
    renderResults();

})();
