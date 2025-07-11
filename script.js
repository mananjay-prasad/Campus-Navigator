let map;
let markers = {};
const GEMINI_API_KEY = "AIzaSyBXM04H3_HflM2t1m6xY-GSBx4UBvTOcvQ";

const campusBounds = {
  north: 26.1455,   // slightly expanded
  south: 26.1365,
  west: 85.3605,
  east: 85.371
};

const locations = {
  "Main Building": { lat: 26.141494345201355, lng: 85.36727287007173, type: "academic" },
  "IT Building": { lat: 26.139227286839063, lng: 85.36580704695736, type: "academic" },
  "Workshop": { lat: 26.139907294015682, lng: 85.36684478338174, type: "academic" },
  "Guest House": { lat: 26.140967999013256, lng: 85.36409404221452, type: "admin" },
  "Cafeteria": { lat: 26.140347243717002, lng: 85.3660424345815, type: "admin" },
  "Cricket Ground": { lat: 26.141687852428735, lng: 85.36549368290333, type: "sports" },
  "Football Ground": { lat: 26.142957357588124, lng: 85.36532464117784, type: "sports" },
  "Badminton Court": { lat: 26.141002307848833, lng: 85.3668615835146, type: "sports" },
  "Open Gym": { lat: 26.139182513102014, lng: 85.36622156603052, type: "sports" },
  "Boys Hostel": { lat: 26.140457554788355, lng: 85.36514863259951, type: "hostel" },
  "Girls Hostel": { lat: 26.141940890761298, lng: 85.3634088014882, type: "hostel" },
  "Super Iway Lab": { lat: 26.14236022328417, lng: 85.3666401538971, type: "academic" },
  "ECE Building": { lat: 26.142539997871364, lng: 85.36715749483893, type: "academic" },
  "Pharmacy": { lat: 26.14263737565717, lng: 85.36779165470315, type: "academic" },
  "Lether Technology": { lat: 26.142939041732433, lng: 85.36719325043767, type: "academic" },
  "Volly ball court": { lat: 26.140107419723645, lng: 85.36645296081028, type: "sports" }
};

const typeColors = {
  academic: "blue",
  hostel: "red",
  admin: "green",
  sports: "orange"
};

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    restriction: {
      latLngBounds: campusBounds,
      strictBounds: true
    },
    mapTypeId: "satellite"
  });

  const bounds = new google.maps.LatLngBounds(
    { lat: campusBounds.south, lng: campusBounds.west },
    { lat: campusBounds.north, lng: campusBounds.east }
  );
  map.fitBounds(bounds, 15000);

  const campusPolygonCoords = [
    { lat: 26.138504669789565, lng: 85.36679145154886 },
    { lat: 26.14330615512552, lng: 85.3683935970946 },
    { lat: 26.144795654500246, lng: 85.36378066849637 },
    { lat: 26.144342905027138, lng: 85.36303646724727 },
    { lat: 26.142346048718405, lng: 85.36255771912015 },
    { lat: 26.14147645365367, lng: 85.36335713259467 },
    { lat: 26.13888368127783, lng: 85.36517989414924 },
    { lat: 26.138480355931318, lng: 85.36683578322857 }
  ];

  const campusBoundary = new google.maps.Polygon({
    paths: campusPolygonCoords,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.1
  });

  campusBoundary.setMap(map);

  const locationSelect = document.getElementById("locationSelect");

  for (let name in locations) {
    const loc = locations[name];
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    locationSelect.appendChild(option);

    const marker = new google.maps.Marker({
      position: loc,
      map,
      title: name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: typeColors[loc.type] || "gray",
        fillOpacity: 1,
        strokeWeight: 1
      },
      label: {
        text: name,
        color: "white",
        fontSize: "15px"
      }
    });

    marker.type = loc.type;
    markers[name] = marker;
  }

  locationSelect.addEventListener("change", () => {
    const selected = locationSelect.value;
    if (selected && locations[selected]) {
      map.panTo(locations[selected]);
      map.setZoom(20);
    }
  });

  document.querySelectorAll(".filter-checkbox").forEach(cb => {
    cb.addEventListener("change", () => {
      const visibleTypes = Array.from(document.querySelectorAll(".filter-checkbox:checked")).map(cb => cb.value);
      for (let name in markers) {
        const marker = markers[name];
        marker.setVisible(visibleTypes.includes(marker.type));
      }
    });
  });

  const overlay = document.getElementById("overlay");
  overlay.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  document.getElementById("qrBtn").addEventListener("click", () => {
    alert("QR scanner feature is not yet implemented. This is a UI placeholder.");
  });
}

window.onload = initMap;

async function askGemini() {
  const inputElem = document.getElementById("geminiInput");
  const responseDiv = document.getElementById("geminiResponse");
  const userMessage = inputElem.value.trim();

  if (!userMessage) {
    responseDiv.innerHTML += `<div style="color: red;">Please enter a question.</div>`;
    return;
  }

  inputElem.value = "";
  responseDiv.innerHTML += `<div style="margin-bottom: 10px;"><strong>You:</strong> ${userMessage}</div>`;
  responseDiv.innerHTML += `<div id="typing" style="color: gray; font-style: italic;">Thinking...</div>`;
  responseDiv.scrollTop = responseDiv.scrollHeight;

  try {
    const shortLocations = Object.keys(locations).map(name => `- ${name}`).join("\n");

    const prompt = `
You are a helpful campus assistant for students at MIT Muzaffarpur.
Campus is located in Bihar, India.

You're aware of key places like:
${shortLocations}

Be friendly, concise, and useful. Answer this:
"${userMessage}"
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await res.json();
    const geminiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't find an answer.";

    document.getElementById("typing").remove();
    responseDiv.innerHTML += `<div style="margin-bottom: 15px; color: #222;"><strong>Gemini:</strong> ${geminiReply}</div>`;
    responseDiv.scrollTop = responseDiv.scrollHeight;
  } catch (err) {
    document.getElementById("typing").remove();
    responseDiv.innerHTML += `<div style="color: red;">Error: ${err.message}</div>`;
  }
}
