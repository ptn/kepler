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

var sun = addSphere(0.6955, 0, 0, 0, "/fur-wallpaper-8.jpg", { mass: 1.988435e30 });

var planets = [];

var stats = createStats();
document.getElementById("model").appendChild( stats.domElement );

function animate() {
  stats.begin();

  // render texture
  renderer.render(scene, camera);

  sun.rotation.y += 0.05;

  for (var i = 0; i < planets.length; i++) {
    orbit(planets[i], sun);
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

document.getElementById('form').onsubmit = function(e) {
  e.preventDefault();

  var starMass = extractNumber("star-mass", "the mass of the star");
  if (!starMass) { return; }

  var planetMass = extractNumber("planet-mass-1", "the mass of the planet");
  if (!planetMass) { return; }

  var planetDistance = extractNumber("planet-distance-1", "the distance from the planet to the star");
  if (!planetDistance) { return; }

  // window.requestAnimationFrame(animate);
}
