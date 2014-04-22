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

var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
var VIEW_ANGLE = 45, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;

// Astronomy.
var G = 6.67384e-11; // m3 kg-1 s-2

function createCamera() {
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  camera.position.set(0, 20, 0);
  return camera;
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
  var container = document.getElementById("canvas");
  container.appendChild(renderer.domElement);
  return renderer;
}

function createSphere(r, x, y, z, textureUrl, astro) {
  if (astro === undefined) {
    astro = {};
  }

  var geometry = new THREE.SphereGeometry(r, 32, 16);
  var texture = THREE.ImageUtils.loadTexture(textureUrl);
  var material = new THREE.MeshBasicMaterial({ map: texture });
  var sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(x, y, z);
  sphere.astro = astro;

  var ghostGeometry = new THREE.SphereGeometry(1, 32, 16);
  var ghostTexture = THREE.ImageUtils.loadTexture(textureUrl);
  var ghostMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5});
  var ghostSphere = new THREE.Mesh(ghostGeometry, ghostMaterial);
  ghostSphere.position.set(x, y, z);
  sphere.astro.ghost = ghostSphere;
  return sphere;
}

function addSphere(r, x, y, z, textureUrl, astro) {
  var sphere = createSphere(r, x, y, z, textureUrl, astro);
  scene.add(sphere);
  scene.add(sphere.astro.ghost);
  return sphere;
}

function orbit(planet, star) {
  updateGhost(star);
  updateGhost(planet);
}

function updateGhost(planet) {
  var distance = new THREE.Vector3().copy(camera.position).sub(planet.position).length();
  if (distance < 100) {
    planet.astro.ghost.material.opacity = 0;
  } else {
    planet.astro.ghost.scale.x = planet.astro.ghost.scale.y = planet.astro.ghost.scale.z = distance/80;
    planet.astro.ghost.material.opacity = 0.5;
  }
}

var scene = new THREE.Scene();

var camera = createCamera();
scene.add(camera);
// Configure zoom of camera.
camera.lookAt(scene.position);

var controls = new THREE.OrbitControls(camera);

// Light.
var ambientLight = new THREE.AmbientLight(0xCCCCCC);
scene.add(ambientLight);

var renderer = createRenderer();

var star = addSphere(3, 0, 0, 0, "/fur-wallpaper-8.jpg", { mass: 1.988435e30 });
var planet = addSphere(3, 150, 0, 0, "/planet.jpg", { mass: 5.9721986e24 });
planet.angle = 0;

var stats = createStats();
document.body.appendChild( stats.domElement );

function animate() {
  stats.begin();
  // render texture
  renderer.render(scene, camera);

  // rotate star
  star.rotation.y += 0.05;

  // make the planet orbit the star
  orbit(planet, star);

  window.requestAnimationFrame(animate);
  stats.end();
}

window.requestAnimationFrame(animate);

