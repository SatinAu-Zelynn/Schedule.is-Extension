const defaultSettings = {
  position: 'pos-bottom-center',
  theme: 'dark',
  scale: 100,
  showCurrent: true,
  showNext: true,
  showProgress: true,
  showFullSchedule: false
};

const elPos = document.getElementById('setting-position');
const elTheme = document.getElementById('setting-theme');
const elScale = document.getElementById('setting-scale');
const elScaleVal = document.getElementById('scale-val');
const elShowCurrent = document.getElementById('setting-show-current');
const elShowNext = document.getElementById('setting-show-next');
const elShowProgress = document.getElementById('setting-show-progress');
const elShowFullSchedule = document.getElementById('setting-show-full-schedule');

// 初始化读取
chrome.storage.sync.get(defaultSettings, settings => {
  elPos.value = settings.position;
  elTheme.value = settings.theme;
  elScale.value = settings.scale;
  elScaleVal.textContent = `${settings.scale}%`;
  elShowCurrent.checked = settings.showCurrent;
  elShowNext.checked = settings.showNext;
  elShowProgress.checked = settings.showProgress;
  elShowFullSchedule.checked = settings.showFullSchedule;
});

function saveSettings() {
  const settings = {
    position: elPos.value,
    theme: elTheme.value,
    scale: parseInt(elScale.value, 10),
    showCurrent: elShowCurrent.checked,
    showNext: elShowNext.checked,
    showProgress: elShowProgress.checked,
    showFullSchedule: elShowFullSchedule.checked
  };
  chrome.storage.sync.set(settings);
}

elPos.addEventListener('change', saveSettings);
elTheme.addEventListener('change', saveSettings);
elScale.addEventListener('input', () => {
  elScaleVal.textContent = `${elScale.value}%`;
  saveSettings();
});
elShowCurrent.addEventListener('change', saveSettings);
elShowNext.addEventListener('change', saveSettings);
elShowProgress.addEventListener('change', saveSettings);
elShowFullSchedule.addEventListener('change', saveSettings);