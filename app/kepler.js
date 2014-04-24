// 1 unit here is 1 billion meters in Real Life.

function createStats() {
  var stats = new Stats();
  stats.setMode(1); // 0: fps, 1: ms

  // Align top-left
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = '10';
  return stats;
}

function getDistance(v1, v2) {
  var x = v1.x - v2.x;
  var y = v1.y - v2.y;
  var z = v1.z - v2.z;
  return Math.sqrt(x * x + y * y + z * z);
}

var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 200000;

// Astronomy.
var G = 6.67384e-11; // m3 kg-1 s-2
var SEC_PER_STEP = 8;
var STEPS_PER_FRAME = 10000;
var METERS_PER_UNIT = 1000000000;
var MAX_TRAIL_VERTICES = 400;
var MIN_GHOST_DISTANCE = 100;
var GHOST_DISTANCE_SCALE = 80;
var MAX_GHOST_OPACITY = 0.15;
var PAUSED = false;

function createCamera() {
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera.position.set(0, 500, 0);
  return camera;
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  var container = document.getElementById("canvas");
  container.appendChild(renderer.domElement);
  return renderer;
}

function createTrail(x, y, z) {
  var trailGeometry = new THREE.Geometry();
  for (i = 0; i < MAX_TRAIL_VERTICES; i++) {
    trailGeometry.vertices.push(new THREE.Vector3(x, y, z));
  }
  var trailMaterial = new THREE.LineBasicMaterial();
  return new THREE.Line(trailGeometry, trailMaterial);
}

function createSphere(r, x, y, z, textureUrl, astro) {
  if (astro === undefined) {
    astro = {};
  }
  if (astro.vel === undefined) {
    astro.vel = new THREE.Vector3();
  }
  if (astro.trail === undefined) {
    astro.trail = createTrail(x, y, z);
  }

  var geometry = new THREE.SphereGeometry(r, 32, 16);
  var texture = THREE.ImageUtils.loadTexture(textureUrl);
  var material = new THREE.MeshBasicMaterial({ map: texture });
  var sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(x, y, z);
  sphere.astro = astro;

  var ghostGeometry = new THREE.SphereGeometry(1, 32, 16);
  var ghostTexture = THREE.ImageUtils.loadTexture(textureUrl);
  var ghostMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0});
  var ghostSphere = new THREE.Mesh(ghostGeometry, ghostMaterial);
  ghostSphere.position.set(x, y, z);
  sphere.astro.ghost = ghostSphere;
  return sphere;
}

function addSphere(r, x, y, z, textureUrl, astro) {
  var sphere = createSphere(r, x, y, z, textureUrl, astro);
  scene.add(sphere);
  scene.add(sphere.astro.ghost);
  scene.add(sphere.astro.trail);
  return sphere;
}

function getAcceleration(distance, starMass) {
  return G * starMass / (Math.pow(distance, 2));
}

function updateVelocity(planet, star) {
  var vel = new THREE.Vector3();
  var speed;
  for(var i=0; i < STEPS_PER_FRAME; i++) {
    speed = getAcceleration(getDistance(star.position, planet.position) * METERS_PER_UNIT, star.astro.mass) * SEC_PER_STEP;
    vel.subVectors(star.position, planet.position).setLength(speed / METERS_PER_UNIT);
    planet.astro.vel.add(vel);

    planet.position.x += planet.astro.vel.x * SEC_PER_STEP;
    planet.position.y += planet.astro.vel.y * SEC_PER_STEP;
    planet.position.z += planet.astro.vel.z * SEC_PER_STEP;

    if (i % 10000 === 0) {
      leaveTrail(planet);
    }
  }
}

function leaveTrail(sphere) {
  sphere.astro.trail.geometry.vertices.unshift(new THREE.Vector3().copy(sphere.position));
  sphere.astro.trail.geometry.vertices.length = MAX_TRAIL_VERTICES;
  sphere.astro.trail.geometry.verticesNeedUpdate = true;
}

function orbit(planet, star) {
  updateVelocity(planet, star);
  updateGhost(star);
  updateGhost(planet);
}

function updateGhost(planet) {
  planet.astro.ghost.position.copy(planet.position);

  var distance = getDistance(camera.position, planet.position);
  if (distance < MIN_GHOST_DISTANCE) {
    planet.astro.ghost.material.opacity = 0;
  } else {
    planet.astro.ghost.scale.x = planet.astro.ghost.scale.y = planet.astro.ghost.scale.z = distance/GHOST_DISTANCE_SCALE;
    planet.astro.ghost.material.opacity = MAX_GHOST_OPACITY;
  }
}

function createControls(renderer) {
  var controls = new THREE.OrbitControls(camera, renderer.domElement);

  var slider = document.getElementById("speedSlider");
  slider.onchange = function(e) {
    STEPS_PER_FRAME = +this.value;
  };

  return controls;
}

var scene = new THREE.Scene();

var camera = createCamera();
scene.add(camera);
camera.lookAt(scene.position);

// Light.
var ambientLight = new THREE.AmbientLight(0xCCCCCC);
scene.add(ambientLight);

var renderer = createRenderer();
var controls = createControls(renderer);

var sun;
var planets = [];

var stats = createStats();
document.getElementById("model").appendChild( stats.domElement );

var FOCUS, focusVec = new THREE.Vector3();

function animate() {
  stats.begin();

  // render texture
  renderer.render(scene, camera);

  if (sun && PAUSED === false) {
    sun.rotation.y += 0.05;
    focusVec.copy(FOCUS.position);

    for (var i = 0; i < planets.length; i++) {
      orbit(planets[i], sun);
    }

    focusVec.subVectors(FOCUS.position, focusVec);
    camera.position.add(focusVec);
    controls.target.copy(FOCUS.position);
  }

  window.requestAnimationFrame(animate);
  stats.end();
}

function extractNumber(formElementId, errorMsg) {
  var value = +document.forms["form"][formElementId].value;
  if (!value) {
    alert("Insert a valid number for " + errorMsg);
  }
  return value;
}

var planetId = 1;
document.getElementById('new-planet').onclick = function(e) {
  e.preventDefault();

  planetId += 1;

  var html = '<legend>Planet #' + planetId + '</legend>';
  html += '<label for="planet-mass-' + planetId + '">Mass: </label>';
  html += '<input type="text" id="planet-mass-' + planetId + '" name="planet-mass-' + planetId + '" placeholder="5.9721986e24" /> kg';
  html += '<br />';
  html += '<label for="planet-distance-' + planetId + '">Distance: </label>';
  html += '<input type="text" id="planet-distance-' + planetId + '" name="planet-distance-' + planetId + '" placeholder="150" /> Gm';
  html += '<br />';
  html += '<label for="planet-radius-' + planetId + '">Radius: </label>';
  html += '<input type="text" id="planet-radius-' + planetId + '" name="planet-radius-' + planetId + '" placeholder="0.0063674447" /> Gm';
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

function runSimulation() {
  document.getElementById("input").style.display = "none";
  document.getElementById("model").style.display = "block";
  PAUSED = false;
  FOCUS = sun;
  window.requestAnimationFrame(animate);
}

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

    planets.push(addSphere(planetRadius,
                           Math.cos(planetIncl / 180 * Math.PI) * planetDistance,
                           Math.sin(planetIncl / 180 * Math.PI) * planetDistance,
                           0,
                           "planet.jpg",
                           { mass: planetMass, vel: new THREE.Vector3(0, 0, planetSpeed) }));

    addPlanetToFocusOptions(i - 1);
  }

  sun = addSphere(starRadius, 0, 0, 0, "bhushan.jpg", { mass: starMass })

  runSimulation();
}

function simulateHome() {
  sun = addSphere(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });

  planets.push(addSphere(0.0024397, 50.32, 0, 0, "mercury.png", { mass: 3.30104e23, vel: new THREE.Vector3(0, 0, 4.74e-5) }));
  planets.push(addSphere(0.0060519, 108.8, 0, 0, "mercury.png", { mass: 4.86732e24, vel: new THREE.Vector3(0, 0, 3.5e-5) }));
  planets.push(addSphere(0.0063674447, 150, 0, 0, "planet.jpg", { mass: 5.9721986e24, vel: new THREE.Vector3(0, 0, 2.963e-5) }));
  planets.push(addSphere(0.003386, 227.94, 0, 0, "planet.jpg", { mass: 6.41693e23, vel: new THREE.Vector3(0, 0, 0.0000228175) }));
  planets.push(addSphere(0.069173, 778.33, 0, 0, "planet.jpg",  { mass: 1.89813e27, vel: new THREE.Vector3(0, 0, 0.0000129824) }));
  planets.push(addSphere(0.057316, 1429.4, 0, 0, "planet.jpg",  { mass: 5.68319e26, vel: new THREE.Vector3(0, 0, 9.280e-6) }));
  planets.push(addSphere(0.025266, 2870.99, 0, 0, "planet.jpg",  { mass: 8.68103e25, vel: new THREE.Vector3(0, 0, 6.509e-6) }));
  planets.push(addSphere(0.024553, 4504, 0, 0, "planet.jpg",  { mass: 1.0241e26, vel: new THREE.Vector3(0, 0, 5.449e-6) }));

  for (var i = 0; i < 8; i++) {
    addPlanetToFocusOptions(i);
  }

  runSimulation();
}

function simulateJupiter() {
  sun = addSphere(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });
  // Jupiter at Mars' distance.
  planets.push(addSphere(0.069173, 227.94, 0, 0, "planet.jpg",  { mass: 1.89813e27, vel: new THREE.Vector3(0, 0, 0.0000129824) }));
  addPlanetToFocusOptions(0);
  camera.position.set(0, 700, 0);
  runSimulation();
}

function simulateMercury() {
  sun = addSphere(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });
  // Mercury at Mars' distance.
  planets.push(addSphere(0.0024397, 227.94, 0, 0, "mercury.png", { mass: 3.30104e23, vel: new THREE.Vector3(0, 0, 4.74e-5) }));
  addPlanetToFocusOptions(0);
  camera.position.set(0, 800, 0);
  STEPS_PER_FRAME = 5000;
  runSimulation();
}

function simulateSlowMercury() {
  sun = addSphere(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });
  // Mercury at Mars' distance, 1/3 speed.
  planets.push(addSphere(0.0024397, 227.94, 0, 0, "mercury.png", { mass: 3.30104e23, vel: new THREE.Vector3(0, 0, 4.74e-5 / 1.5) }));
  addPlanetToFocusOptions(0);
  camera.position.set(0, 800, 0);
  STEPS_PER_FRAME = 5000;
  runSimulation();
}

function simulateSlowestMercury() {
  sun = addSphere(0.6955, 0, 0, 0, "bhushan.jpg", { mass: 1.988435e30 });
  // Mercury at Mars' distance, 1/3 speed.
  planets.push(addSphere(0.0024397, 227.94, 0, 0, "mercury.png", { mass: 3.30104e23, vel: new THREE.Vector3(0, 0, 4.74e-5 / 2) }));
  addPlanetToFocusOptions(0);
  camera.position.set(0, 800, 0);
  STEPS_PER_FRAME = 5000;
  runSimulation();
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
  PAUSED = !PAUSED;
}

document.getElementById("resetButton").onclick = function() {
  PAUSED = true;
  document.getElementById("input").style.display = "block";
  document.getElementById("model").style.display = "none";

  for (var p in planets) {
    scene.remove(planets[p].astro.ghost);
    scene.remove(planets[p].astro.trail);
    scene.remove(planets[p]);
  }
  scene.remove(sun.astro.ghost);
  scene.remove(sun);
  planets = [];
  sun = null;

  document.getElementById("focus").innerHTML = "<option selected value='-1'>Sun</option>";
};

function focusCameraOn(focus) {
  var focusVec = new THREE.Vector3();
  focusVec.subVectors(focus.position, FOCUS.position);
  camera.position.add(focusVec);
  FOCUS = focus;
  camera.lookAt(FOCUS.position);
}

document.getElementById("focus").onchange = function(e) {
  if (+this.value === -1) {
    focusCameraOn(sun);
  } else {
    focusCameraOn(planets[+this.value]);
  }
}
