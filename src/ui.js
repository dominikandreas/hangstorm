export function initDOM(callbacks) {
  const dom = {
    topPanel: document.getElementById('topPanel'),
    statusText: document.getElementById('statusText'),
    scoreValue: document.getElementById('scoreValue'),
    comboValue: document.getElementById('comboValue'),
    flowValue: document.getElementById('flowValue'),
    healthValue: document.getElementById('healthValue'),
    centerMessage: document.getElementById('centerMessage'),
    toast: document.getElementById('toast'),
    skyhookBtn: document.getElementById('skyhookBtn'),
    reactorBtn: document.getElementById('reactorBtn'),
    calibrateBtn: document.getElementById('calibrateBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    intensityRange: document.getElementById('intensityRange'),
    intensityValue: document.getElementById('intensityValue'),
    comfortSelect: document.getElementById('comfortSelect'),
    vrButtonWrap: document.getElementById('vrButtonWrap'),
  };

  dom.skyhookBtn.addEventListener('click', callbacks.onStartSkyhook);
  dom.reactorBtn.addEventListener('click', callbacks.onStartReactor);
  dom.calibrateBtn.addEventListener('click', callbacks.onCalibrate);
  dom.pauseBtn.addEventListener('click', callbacks.onPause);
  
  dom.intensityRange.addEventListener('input', (e) => {
    callbacks.onChangeIntensity(Number(e.target.value));
  });
  
  dom.comfortSelect.addEventListener('change', (e) => {
    callbacks.onChangeComfort(e.target.value);
  });
  
  return dom;
}

export function updateDOM(dom, state) {
  dom.scoreValue.textContent = Math.floor(state.score).toLocaleString();
  dom.comboValue.textContent = `${Math.max(0, state.combo)}x`;
  dom.flowValue.textContent = `${Math.round(Math.max(0, Math.min(1, state.flow)) * 100)}%`;
  dom.healthValue.textContent = `${Math.round(Math.max(0, Math.min(100, state.health)))}`;
  dom.intensityValue.textContent = `${state.intensity.toFixed(2)}x`;
  
  if (state.playing) {
    dom.centerMessage.style.display = 'none';
    dom.pauseBtn.style.display = 'block';
  } else {
    dom.centerMessage.style.display = 'block';
    dom.pauseBtn.style.display = 'none';
  }
}

let toastTimer = null;
export function showToast(dom, message, duration = 1800) {
  dom.toast.textContent = message;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), duration);
}

export function setStatus(dom, message) {
  dom.statusText.textContent = message;
}
