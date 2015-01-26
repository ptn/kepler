// console.log(this.stats);
  // animation.togglePause();
// use preloadedAnimations.home()/jupiter()/etc.

  // Use animation.destroy
  // extract a removeBody function
//
// addStart
// addPlanet

var STEPS_PER_FRAME = 10000;
var METERS_PER_UNIT = 1000000000;
var SEC_PER_STEP = 8;
var MIN_GHOST_DISTANCE = 100;

;(function(exports) {
  function createCamera() {
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.set(0, 500, 0);
    return camera;
  };

  function createStats() {
    var stats = (new Stats());
    // 0: fps, 1: ms
    stats.setMode(1);
    return stats;
  };

  function createRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    var container = document.getElementById("canvas");
    container.appendChild(renderer.domElement);
    return renderer;
  };

  function focusCameraOn(newFocus) {
    // subtraction vector of the new focus minus the current one
    var focusVector = new THREE.Vector3();
    focusVector.subVectors(newFocus.position,
                           animation.focus.position);

    animation.camera.position.add(focusVector);
    animation.camera.lookAt(newFocus.position);

    animation.focus = newFocus;
  };

  function leaveTrail(sphere) {
    sphere.astro.trail.geometry.vertices.unshift(new THREE.Vector3().copy(sphere.position));
    sphere.astro.trail.geometry.vertices.length = MAX_TRAIL_VERTICES;
    sphere.astro.trail.geometry.verticesNeedUpdate = true;
  };

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
  };

  function updateGhost(planet) {
    planet.astro.ghost.position.copy(planet.position);

    var distance = getDistance(animation.camera.position, planet.position);
    if (distance < MIN_GHOST_DISTANCE) {
      planet.astro.ghost.material.opacity = 0;
    } else {
      planet.astro.ghost.scale.x = planet.astro.ghost.scale.y = planet.astro.ghost.scale.z = distance/GHOST_DISTANCE_SCALE;
      planet.astro.ghost.material.opacity = MAX_GHOST_OPACITY;
    }
  };

  function orbit(planet, star) {
    updateVelocity(planet, star);
    updateGhost(star);
    updateGhost(planet);
  };

  var animation = exports.animation = {
    init: function() {
      this.paused = false;
      this.focus = new THREE.Vector3();
      this.scene = new THREE.Scene();
      this.ambientLight = new THREE.AmbientLight(0xCCCCCC);
      this.camera = createCamera();
      this.renderer = createRenderer();

      this.camera.lookAt(this.scene.position);
      this.scene.add(this.camera);
      this.scene.add(this.ambientLight);

      this.stats = createStats();

      this.sun;
      this.planets = [];
    },

    addStatsToDOM: function(opts) {
      this.stats.domElement.style.position = opts.position;
      this.stats.domElement.style.left = opts.left;
      this.stats.domElement.style.bottom = opts.bottom;
      this.stats.domElement.style.zIndex = opts.zIndex;

      var place = document.getElementById(opts.insertionPointId);
      place.appendChild(animation.stats.domElement);
    },

    addControls: function(sliderElementId) {
      this.controls = new THREE.OrbitControls(this.camera,
                                              this.renderer.domElement);

      var slider = document.getElementById(sliderElementId);
      slider.onchange = function(e) {
        STEPS_PER_FRAME = +this.value;
      };
    },

    focusCameraOnSun: function() {
      focusCameraOn(this.sun);
    },
    focusCameraOnPlanet: function(planetId) {
      focusCameraOn(this.planets[planetId]);
    },

    togglePause: function() {
      this.paused = !this.paused;
    },

    animate: function () {
      animation.stats.begin();

      animation.renderer.render(animation.scene, animation.camera);

      if (animation.sun && animation.paused === false) {
        animation.sun.rotation.y += 0.05;
        animation.animationFocusVector.copy(animation.focus.position);

        for (var i = 0; i < animation.planets.length; i++) {
          orbit(animation.planets[i], animation.sun);
        }

        animation.animationFocusVector.subVectors(animation.focus.position,
                                                  animation.animationFocusVector);
        animation.camera.position.add(animation.animationFocusVector);
        animation.controls.target.copy(animation.focus.position);
      }

      window.requestAnimationFrame(animation.animate);

      animation.stats.end();
    },

    run: function(hideId, showId) {
      document.getElementById(hideId).style.display = "none";
      document.getElementById(showId).style.display = "block";

      this.paused = false;
      this.focus = this.sun;

      // Helper vector that animate requires. Create it only once here and
      // change it from animate as needed.
      this.animationFocusVector = new THREE.Vector3();
      window.requestAnimationFrame(this.animate);
    }
  };
})(this);
