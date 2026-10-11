(() => {
  // 只在 time.is/clock 或 time.is 页面运行
  const isClockPage = window.location.pathname.startsWith('/clock') || window.location.pathname === '/';
  if (!isClockPage) return;

  // 创建大屏 HUD 容器
  const container = document.createElement('div');
  container.id = 'schedule-is-hud';
  container.innerHTML = `
    <div class="sis-card">
      <div class="sis-main-row">
        <div class="sis-status-pill" id="sis-state-pill">连接中...</div>
        <div class="sis-info">
          <div class="sis-current-wrap" id="sis-current-wrap">
            <span class="sis-label">当前课程</span>
            <span class="sis-subject" id="sis-current-subject">--</span>
          </div>
          <div class="sis-timer-wrap">
            <span class="sis-timer-label" id="sis-timer-label">剩余时间</span>
            <span class="sis-timer" id="sis-timer">00:00</span>
          </div>
          <div class="sis-next-wrap" id="sis-next-wrap">
            <span class="sis-label">下一节</span>
            <span class="sis-next" id="sis-next-subject">--</span>
          </div>
        </div>
      </div>
      <div class="sis-progress-wrap" id="sis-progress-wrap">
        <div class="sis-progress-bar">
          <div class="sis-progress-fill" id="sis-progress-fill"></div>
        </div>
      </div>
      <div class="sis-schedule-list" id="sis-schedule-list"></div>
    </div>
  `;
  document.body.appendChild(container);

  const elPill = document.getElementById('sis-state-pill');
  const elCurrentWrap = document.getElementById('sis-current-wrap');
  const elCurrent = document.getElementById('sis-current-subject');
  const elTimerLabel = document.getElementById('sis-timer-label');
  const elTimer = document.getElementById('sis-timer');
  const elNextWrap = document.getElementById('sis-next-wrap');
  const elNext = document.getElementById('sis-next-subject');
  const elProgressWrap = document.getElementById('sis-progress-wrap');
  const elProgressFill = document.getElementById('sis-progress-fill');
  const elScheduleList = document.getElementById('sis-schedule-list');

  const defaultSettings = {
    position: 'pos-bottom-center',
    theme: 'dark',
    scale: 100,
    showCurrent: true,
    showNext: true,
    showProgress: true,
    showFullSchedule: false
  };
  let currentSettings = { ...defaultSettings };

  function applySettings(cfg) {
    currentSettings = { ...currentSettings, ...cfg };
    container.className = `${currentSettings.position} ${currentSettings.theme === 'light' ? 'sis-light' : ''}`;
    container.style.setProperty('--sis-scale', currentSettings.scale / 100);

    elCurrentWrap.style.display = currentSettings.showCurrent ? '' : 'none';
    elNextWrap.style.display = currentSettings.showNext ? '' : 'none';
    elProgressWrap.style.display = currentSettings.showProgress ? '' : 'none';
    elScheduleList.style.display = currentSettings.showFullSchedule ? '' : 'none';
  }

  chrome.storage.sync.get(defaultSettings, applySettings);
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      const updated = {};
      for (const [k, v] of Object.entries(changes)) {
        updated[k] = v.newValue;
      }
      applySettings(updated);
    }
  });

  let pollTimer = null;

  async function updateSchedule() {
    try {
      // 必须在 try 块内部检查，因为上下文失效时读取 chrome.runtime 会直接抛出错误
      if (!chrome.runtime?.id) {
        if (pollTimer) clearInterval(pollTimer);
        return;
      }

      const response = await chrome.runtime.sendMessage({ action: 'fetchSchedule' });
      if (!response || !response.success || !response.data) {
        elPill.className = 'sis-status-pill sis-offline';
        elPill.textContent = 'ClassIsland 未连接';
        elCurrent.textContent = '--';
        elTimer.textContent = '--:--';
        elNext.textContent = '--';
        if (elProgressFill) elProgressFill.style.width = '0%';
        if (elScheduleList) elScheduleList.innerHTML = '';
        return;
      }

      const d = response.data;
      elPill.textContent = d.stateText;

      // 仅在上课状态下显示当前课程组件，课间休息等非上课状态自动隐藏
      const isClassActive = d.state === 'InClass' || d.state === 'OnClass';
      elCurrentWrap.style.display = (currentSettings.showCurrent && isClassActive) ? '' : 'none';

      // 状态颜色切换
      elPill.className = 'sis-status-pill';
      if (d.state === 'InClass' || d.state === 'OnClass') {
        elPill.classList.add('sis-in-class');
        elTimerLabel.textContent = '距下课';
      } else if (d.state === 'Breaking') {
        elPill.classList.add('sis-breaking');
        elTimerLabel.textContent = '距上课';
      } else {
        elPill.classList.add('sis-idle');
        elTimerLabel.textContent = '倒计时';
      }

      elCurrent.textContent = d.currentSubject;
      elTimer.textContent = d.timeLeftFormatted;
      elNext.textContent = d.nextSubject;

      // 更新时间进度条
      if (elProgressFill) {
        elProgressFill.style.width = `${d.progressPercent || 0}%`;
      }

      // 更新完整课表列表
      if (currentSettings.showFullSchedule && Array.isArray(d.classes)) {
        elScheduleList.innerHTML = d.classes.map(c => `
          <div class="sis-schedule-item ${c.isCurrent ? 'active' : ''}">
            <span class="sis-schedule-index">${c.index}.</span>${c.name}
          </div>
        `).join('');
      } else {
        elScheduleList.innerHTML = '';
      }
    } catch {
      // 扩展热重载或更新时，捕获上下文失效异常并彻底注销定时器
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }
  }

  // 立即触发一次，并每秒轮询同步
  updateSchedule();
  pollTimer = setInterval(updateSchedule, 1000);
})();