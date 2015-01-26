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
  var graphics = exports.graphics = {
    view_angle: 45,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 200000,

    _createCamera: function() {
      var camera = new THREE.PerspectiveCamera(this.view_angle,
                                               this.aspect,
                                               this.near,
                                               this.far);
      camera.position.set(0, 500, 0);
      return camera;
    },

    _createRenderer: function() {
      var renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);

      var container = document.getElementById("canvas");
      container.appendChild(renderer.domElement);

      return renderer;
    },

    init: function() {
      this.focus = new THREE.Vector3();
      this.scene = new THREE.Scene();
      this.camera = this._createCamera();
      this.renderer = this._createRenderer();
      this.ambientLight = new THREE.AmbientLight(0xCCCCCC);

      this.camera.lookAt(this.scene.position);
      this.scene.add(this.camera);
      this.scene.add(this.ambientLight);
    },

    focusCameraOn: function(newFocus) {
      // subtraction vector of the new focus minus the current one
      var focusVector = new THREE.Vector3();

      focusVector.subVectors(newFocus.position,
                             this.focus.position);

      this.camera.position.add(focusVector);
      this.camera.lookAt(newFocus.position);

      this.focus = newFocus;
    },

    render: function() {
      this.renderer.render(this.scene, this.camera);
    }
  };


  function createStats() {
    var stats = (new Stats());
    // 0: fps, 1: ms
    stats.setMode(1);
    return stats;
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

    var distance = getDistance(graphics.camera.position, planet.position);
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

      graphics.init();

      this.stats = createStats();

      this.sun = null;
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
      this.controls = new THREE.OrbitControls(graphics.camera,
                                              graphics.renderer.domElement);

      var slider = document.getElementById(sliderElementId);
      slider.onchange = function(e) {
        STEPS_PER_FRAME = +this.value;
      };
    },

    focusCameraOnSun: function() {
      graphics.focusCameraOn(this.sun);
    },
    focusCameraOnPlanet: function(planetId) {
      graphics.focusCameraOn(this.planets[planetId]);
    },

    togglePause: function() {
      this.paused = !this.paused;
    },

    animate: function () {
      animation.stats.begin();

      graphics.render();

      if (animation.sun && animation.paused === false) {
        animation.sun.rotation.y += 0.05;
        animation.animationFocusVector.copy(graphics.focus.position);

        for (var i = 0; i < animation.planets.length; i++) {
          orbit(animation.planets[i], animation.sun);
        }

        animation.animationFocusVector.subVectors(graphics.focus.position,
                                                  animation.animationFocusVector);
        graphics.camera.position.add(animation.animationFocusVector);
        animation.controls.target.copy(graphics.focus.position);
      }

      window.requestAnimationFrame(animation.animate);

      animation.stats.end();
    },

    run: function(hideId, showId) {
      document.getElementById(hideId).style.display = "none";
      document.getElementById(showId).style.display = "block";

      this.paused = false;
      graphics.focus = this.sun;

      // Helper vector that animate requires. Create it only once here and
      // change it from animate as needed.
      this.animationFocusVector = new THREE.Vector3();
      window.requestAnimationFrame(this.animate);
    }
  };
})(this);
