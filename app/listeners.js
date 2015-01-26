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

function togglePause() {
  PAUSED = !PAUSED;
}
