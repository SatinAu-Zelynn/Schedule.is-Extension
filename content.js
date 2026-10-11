(() => {
  // 只在 time.is/clock 或 time.is 页面运行
  const isClockPage = window.location.pathname.startsWith('/clock') || window.location.pathname === '/';
  if (!isClockPage) return;

  // 创建大屏 HUD 容器
  const container = document.createElement('div');
  container.id = 'schedule-is-hud';
  container.innerHTML = `
    <div class="sis-card">
      <div class="sis-status-pill" id="sis-state-pill">连接中...</div>
      <div class="sis-info">
        <div class="sis-current-wrap">
          <span class="sis-label">当前课程</span>
          <span class="sis-subject" id="sis-current-subject">--</span>
        </div>
        <div class="sis-timer-wrap">
          <span class="sis-timer-label" id="sis-timer-label">剩余时间</span>
          <span class="sis-timer" id="sis-timer">00:00</span>
        </div>
        <div class="sis-next-wrap">
          <span class="sis-label">下一节</span>
          <span class="sis-next" id="sis-next-subject">--</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  const elPill = document.getElementById('sis-state-pill');
  const elCurrent = document.getElementById('sis-current-subject');
  const elTimerLabel = document.getElementById('sis-timer-label');
  const elTimer = document.getElementById('sis-timer');
  const elNext = document.getElementById('sis-next-subject');

  function updateSchedule() {
    chrome.runtime.sendMessage({ action: 'fetchSchedule' }, response => {
      if (!response || !response.success || !response.data) {
        elPill.className = 'sis-status-pill sis-offline';
        elPill.textContent = 'ClassIsland 未连接';
        elCurrent.textContent = '--';
        elTimer.textContent = '--:--';
        elNext.textContent = '--';
        return;
      }

      const d = response.data;
      elPill.textContent = d.stateText;

      // 状态颜色切换
      elPill.className = 'sis-status-pill';
      if (d.state === 'InClass') {
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
    });
  }

  // 立即触发一次，并每秒轮询同步
  updateSchedule();
  setInterval(updateSchedule, 1000);
})();