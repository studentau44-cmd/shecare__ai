SHECARE AI — FREE NEARBY HELP FINDER

No Google Maps API key or payment card is needed.

FILES
- safe_places_section.html: paste the section into index.html where you want the finder.
- safe_places.css: copy into your css/ folder.
- safe_places.js: copy into your js/ folder.

SETUP
1. Copy safe_places.css to css/safe_places.css and safe_places.js to js/safe_places.js.
2. In index.html <head>, add:
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="">
   <link rel="stylesheet" href="css/safe_places.css">
3. Paste safe_places_section.html where the finder should appear.
4. Before </body>, add these in this order:
   <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
   <script src="js/safe_places.js" defer></script>
5. Commit/push to GitHub. Test by entering a city first. Ensure these paths match your existing project structure.

HOW IT WORKS
- Leaflet + OpenStreetMap provides the interactive map.
- Nominatim geocodes a place only after the visitor submits a manual search.
- Overpass searches nearby OpenStreetMap tags after a visitor chooses an area.
- Google Maps links open separately and do not require an API key.
- The page does not request location until the user presses the location button.

SAFETY / LIMITATIONS
- Public OSM tile, Nominatim and Overpass services have usage limits and best-effort availability; do not treat this as unlimited production infrastructure.
- Map data can be incomplete or outdated. Shelter listings are NOT verified safe services; the shelter query can miss confidential services.
- Do not enter private addresses or identifying information into searches.
- This is not emergency dispatch and cannot guarantee rescue or service availability.
- Review service policies:
  https://operations.osmfoundation.org/policies/tiles/
  https://operations.osmfoundation.org/policies/nominatim/
