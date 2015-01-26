animation.init();
// Align top-left
animation.addStatsToDOM({
  position: 'absolute',
  left: '0px',
  bottom: '0px',
  zIndex: '10',
  insertionPointId: 'model'
});
animation.addControls('speedSlider');


function extractNumber(formElementId, errorMsg) {
  var value = document.forms["form"][formElementId].value;
  if (!value) {
    alert("Insert a valid number for " + errorMsg);
  }
  return +value;
}

var planetId = 1;
document.getElementById('new-planet').onclick = function(e) {
  e.preventDefault();

  planetId += 1;

  var html = '<legend>Planet #' + planetId + '</legend>';
  html += '<label for="planet-radius-' + planetId + '">Radius: </label>';
  html += '<input type="text" id="planet-radius-' + planetId + '" name="planet-radius-' + planetId + '" placeholder="0.0063674447" /> Gm';
  html += '<br />';
  html += '<label for="planet-mass-' + planetId + '">Mass: </label>';
  html += '<input type="text" id="planet-mass-' + planetId + '" name="planet-mass-' + planetId + '" placeholder="5.9721986e24" /> kg';
  html += '<br />';
  html += '<label for="planet-distance-' + planetId + '">Distance: </label>';
  html += '<input type="text" id="planet-distance-' + planetId + '" name="planet-distance-' + planetId + '" placeholder="150" /> Gm';
  html += '<br />';
  html += '<label for="planet-speed-' + planetId + '">Speed: </label>';
  html += '<input type="text" id="planet-speed-' + planetId + '" name="planet-speed-' + planetId + '" placeholder="5.449e-6" /> Gm';
  html += '<br />';
  html += '<label for="planet-incl-' + planetId + '">Inclination: </label>';
  html += '<input type="text" id="planet-incl-' + planetId + '" name="planet-incl-' + planetId + '" placeholder="0" /> deg';
  html += '<br />';

  var node = document.createElement("fieldset");
  node.id = "planet-" + planetId;
  node.innerHTML = html;
  document.getElementById("planets").appendChild(node);
};


function addPlanetToFocusOptions(planetId) {
  var node = document.createElement("option");
  node.value = planetId;
  node.innerHTML = "Planet #" + (planetId + 1);
  document.getElementById("focus").appendChild(node);
}

document.getElementById('form').onsubmit = function(e) {
  e.preventDefault();

  var starMass = extractNumber("star-mass", "the mass of the star");
  if (!starMass) { return; }
  var starRadius = extractNumber("star-radius", "the radius of the star");
  if (!starRadius) { return; }

  for (var i = planetId; i > 0; i--) {
    var planetMass = extractNumber("planet-mass-" + i, "the mass of planet " + i);
    if (!planetMass) { return; }
    var planetRadius = extractNumber("planet-radius-" + i, "the radius of the planet " + i);
    if (!planetRadius) { return; }
    var planetDistance = extractNumber("planet-distance-" + i, "the distance from planet " + i + " to the star");
    if (!planetDistance) { return; }
    var planetSpeed = extractNumber("planet-speed-" + i, "the initial speed of planet" + i);
    if (!planetSpeed) { return; }
    var planetIncl = extractNumber("planet-incl-" + i, "the initial inclination of planet" + i);
    if (Number.isNaN(planetIncl)) { return; }

    animation.addPlanet(planetRadius,
                        Math.cos(planetIncl / 180 * Math.PI) * planetDistance,
                        Math.sin(planetIncl / 180 * Math.PI) * planetDistance,
                        0,
                        "planet.jpg",
                        { mass: planetMass, vel: new THREE.Vector3(0, 0, planetSpeed) });

    addPlanetToFocusOptions(i - 1);
  }

  animation.addSun(starRadius, 0, 0, 0, "bhushan.jpg", { mass: starMass });

  animation.run('input', 'model');
}

function simulateHome() {
  animation.addSun(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });

  animation.addPlanet(0.0024397, 50.32, 0, 0, "mercury.png", { mass: 3.30104e23, vel: new THREE.Vector3(0, 0, 4.74e-5) });
  animation.addPlanet(0.0060519, 108.8, 0, 0, "mercury.png", { mass: 4.86732e24, vel: new THREE.Vector3(0, 0, 3.5e-5) });
  animation.addPlanet(0.0063674447, 150, 0, 0, "planet.jpg", { mass: 5.9721986e24, vel: new THREE.Vector3(0, 0, 2.963e-5) });
  animation.addPlanet(0.003386, 227.94, 0, 0, "planet.jpg", { mass: 6.41693e23, vel: new THREE.Vector3(0, 0, 0.0000228175) });
  animation.addPlanet(0.069173, 778.33, 0, 0, "planet.jpg",  { mass: 1.89813e27, vel: new THREE.Vector3(0, 0, 0.0000129824) });
  animation.addPlanet(0.057316, 1429.4, 0, 0, "planet.jpg",  { mass: 5.68319e26, vel: new THREE.Vector3(0, 0, 9.280e-6) });
  animation.addPlanet(0.025266, 2870.99, 0, 0, "planet.jpg",  { mass: 8.68103e25, vel: new THREE.Vector3(0, 0, 6.509e-6) });
  animation.addPlanet(0.024553, 4504, 0, 0, "planet.jpg",  { mass: 1.0241e26, vel: new THREE.Vector3(0, 0, 5.449e-6) });

  for (var i = 0; i < 8; i++) {
    addPlanetToFocusOptions(i);
  }

  animation.run('input', 'model');
}

function simulateJupiter() {
  animation.addSun(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });
  // Jupiter at Mars' distance.
  animation.addPlanet(0.069173, 227.94, 0, 0, "planet.jpg",  { mass: 1.89813e27, vel: new THREE.Vector3(0, 0, 0.0000129824) });
  addPlanetToFocusOptions(0);

  animation.run('input', 'model');
}

function simulateMercury() {
  animation.addSun(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });
  // Mercury at Mars' distance.
  animation.addPlanet(0.0024397, 227.94, 0, 0, "mercury.png", { mass: 3.30104e23, vel: new THREE.Vector3(0, 0, 4.74e-5) });
  addPlanetToFocusOptions(0);

  animation.run('input', 'model');
}

function simulateSlowMercury() {
  animation.addSun(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });
  // Mercury at Mars' distance, 1/3 speed.
  animation.addPlanet(0.0024397, 227.94, 0, 0, "mercury.png", { mass: 3.30104e23, vel: new THREE.Vector3(0, 0, 4.74e-5 / 1.5) });
  addPlanetToFocusOptions(0);

  animation.run('input', 'model');
}

function simulateSlowestMercury() {
  animation.addSun(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });
  // Mercury at Mars' distance, 1/3 speed.
  animation.addPlanet(0.0024397, 227.94, 0, 0, "mercury.png", { mass: 3.30104e23, vel: new THREE.Vector3(0, 0, 4.74e-5 / 2) });
  addPlanetToFocusOptions(0);

  animation.run('input', 'model');
}

document.getElementById('preload').onchange = function(e) {
  if (this.value === 'home') {
    simulateHome();
  } else if (this.value === 'jupiter') {
    simulateJupiter();
  } else if (this.value === 'mercury') {
    simulateMercury();
  } else if (this.value === 'slow-mercury') {
    simulateSlowMercury();
  } else if (this.value === 'slowest-mercury') {
    simulateSlowestMercury();
  }
};

function togglePause() {
  animation.togglePause();
}

document.getElementById("resetButton").onclick = function() {
  animation.destroy();

  document.getElementById("input").style.display = "block";
  document.getElementById("model").style.display = "none";
  document.getElementById("focus").innerHTML = "<option selected value='-1'>Sun</option>";
};

document.getElementById("focus").onchange = function(e) {
  if (+this.value === -1) {
    animation.focusOnSun();
  } else {
    animation.focusOnPlanet(+this.value);
  }
}
