'use strict';

// ==================== グローバル ====================

let pomodoroTimer = null;
let pomodoroSeconds = 25 * 60; // 初期は25分
let pomodoroRunning = false;
let pomodoroCount = 0; // 完了した回数

// ==================== LocalStorage ====================

const storage = {
    get: (key) => {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch {
            // 何かあれば null
            return null;
        }
    },
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    }
};

// ==================== ダークモード ====================
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

// ページ読み込み時に保存された設定を反映
if (storage.get('darkMode')) {
    body.classList.add('dark-mode');
    darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

// トグルボタンのクリックでダークモード切り替え
darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    storage.set('darkMode', isDark);
    darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ==================== ハンバーガーメニュー ====================
const navSwitch = document.getElementById('nav_switch');
const sidemenu = document.getElementById('sidemenu');

// ハンバーガーアイコンをクリックでメニュー開閉
navSwitch.addEventListener('click', () => {
    navSwitch.classList.toggle('active');
    sidemenu.classList.toggle('active');
});

// サイドメニュー外クリックでメニューを閉じる
document.addEventListener('click', (e) => {
    if (sidemenu.classList.contains('active') && !sidemenu.contains(e.target) && !navSwitch.contains(e.target)) {
        navSwitch.classList.remove('active');
        sidemenu.classList.remove('active');
    }
});

// ==================== 日時表示 ====================
// ページ上の日時表示を1秒ごとに更新 表示形式: YYYY/M/D(曜) HH:MM:SS
function updateDateTime() {
    const now = new Date();
    const week_ja = ["日", "月", "火", "水", "木", "金", "土"];
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const week = week_ja[now.getDay()];
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    document.getElementById("datetime").textContent =
        `${year}/${month}/${day}(${week}) ${hour}:${minute}:${second}`;
}

setInterval(updateDateTime, 1000);
updateDateTime();

// ==================== 検索機能 ====================
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchEngine = document.getElementById('searchEngine');

// 選択された検索エンジンで新しいタブを開く 空は無視
function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // 検索エンジンの URL マップ
    const engines = {
        google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        yahoo: `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`
    };

    const selectedEngine = searchEngine.value;
    window.open(engines[selectedEngine], '_blank');
    searchInput.value = '';
}

// ボタンクリックと Enter キーで実行
searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

// ==================== 天気ウィジェット ====================
// 天気データを取得してウィジェットの表示を更新 API キーがなければデモデータを使う
async function fetchWeather() {
    const apiKey = storage.get('weatherApiKey');
    const city = storage.get('weatherCity') || 'Tokyo';
    const loading = document.getElementById('weatherLoading');
    const content = document.getElementById('weatherContent');
    
    try {
        let weatherData;
        
        // APIキーがある場合は実際のデータを取得
        if (apiKey && apiKey !== 'demo') {
            console.log('🌤️ 天気APIにリクエスト:', city);
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ja`
            );
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: 天気データの取得に失敗`);
            }
            
            weatherData = await response.json();
            console.log('✅ 天気データ取得成功:', weatherData);
        } else {
            // デモデータ（APIキー未設定時）
            console.log('ℹ️ デモモードで動作中');
            weatherData = {
                main: { temp: 15, humidity: 60 },
                weather: [{ description: '晴れ (デモ)', icon: '01d' }],
                wind: { speed: 3.5 },
                name: '東京 (デモ)'
            };
            
            // 設定方法のヒントを表示
            if (!document.getElementById('weatherHint')) {
                const hint = document.createElement('div');
                hint.id = 'weatherHint';
                hint.style.cssText = 'margin-top: 0.5rem; padding: 0.75rem; background: rgba(255,255,255,0.3); border-radius: 8px; font-size: 0.85rem;';
                hint.innerHTML = `
                    <div style="margin-bottom: 0.5rem;"><strong>💡 リアルタイム天気を表示する方法:</strong></div>
                    <ol style="margin: 0; padding-left: 1.5rem; line-height: 1.6;">
                        <li>F12キーを押す</li>
                        <li>「Console」タブを開く</li>
                        <li>以下をコピペして実行:</li>
                    </ol>
                    <code style="display: block; background: rgba(0,0,0,0.3); padding: 0.5rem; border-radius: 4px; margin-top: 0.5rem; font-size: 0.8rem;">localStorage.setItem('weatherApiKey', '"あなたのAPIキー"');</code>
                `;
                content.appendChild(hint);
            }
        }
        
        const iconMap = {
            '01': 'fa-sun', '02': 'fa-cloud-sun', '03': 'fa-cloud',
            '04': 'fa-cloud', '09': 'fa-cloud-rain', '10': 'fa-cloud-sun-rain',
            '11': 'fa-bolt', '13': 'fa-snowflake', '50': 'fa-smog'
        };
        
        const iconCode = weatherData.weather[0].icon.substring(0, 2);
        const iconClass = iconMap[iconCode] || 'fa-cloud';
        
        document.querySelector('.weather-icon i').className = `fas ${iconClass}`;
        document.getElementById('temperature').textContent = Math.round(weatherData.main.temp);
        document.getElementById('weatherDescription').textContent = weatherData.weather[0].description;
        document.getElementById('cityName').textContent = weatherData.name;
        document.getElementById('humidity').textContent = weatherData.main.humidity;
        document.getElementById('windSpeed').textContent = weatherData.wind.speed.toFixed(1);
        
        loading.classList.add('hidden');
        content.classList.remove('hidden');
        
    } catch (error) {
        console.error('❌ 天気取得エラー:', error);
        loading.textContent = `データ取得エラー: ${error.message}`;
        loading.style.color = '#ff6b6b';
    }
}

fetchWeather();
setInterval(fetchWeather, 30 * 60 * 1000); // 30分ごとに更新


// ==================== カウントダウンタイマー ====================
const countdownList = document.getElementById('countdownList');
const addCountdownBtn = document.getElementById('addCountdownBtn');
const countdownModal = document.getElementById('countdownModal');
const closeCountdownModal = document.getElementById('closeCountdownModal');
const saveCountdownBtn = document.getElementById('saveCountdownBtn');

// 保存されたカウントダウン配列を取得（なければ空配列）
let countdowns = storage.get('countdowns') || [];

function renderCountdowns() {
    countdownList.innerHTML = '';

    if (countdowns.length === 0) {
        countdownList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">カウントダウンを追加してください</p>';
        return;
    }

    // 各カウントダウンの残り時間を計算して表示
    countdowns.forEach((countdown, index) => {
        const now = new Date();
        const target = new Date(countdown.date);
        const diff = target - now;

        if (diff < 0) {
            // 期限切れは一覧から除外して保存を更新
            countdowns.splice(index, 1);
            storage.set('countdowns', countdowns);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        const div = document.createElement('div');
        div.className = 'countdown-item';
        div.innerHTML = `
            <div class="countdown-title">${countdown.title}</div>
            <div class="countdown-time">
                ${days}日 ${hours}時間 ${minutes}分
            </div>
            <button class="small-btn" onclick="deleteCountdown(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        countdownList.appendChild(div);
    });
}

function deleteCountdown(index) {
    countdowns.splice(index, 1);
    storage.set('countdowns', countdowns);
    renderCountdowns();
}

addCountdownBtn.addEventListener('click', () => countdownModal.classList.remove('hidden'));
closeCountdownModal.addEventListener('click', () => countdownModal.classList.add('hidden'));

saveCountdownBtn.addEventListener('click', () => {
    const title = document.getElementById('countdownTitle').value;
    const date = document.getElementById('countdownDate').value;

    if (!title || !date) {
        alert('タイトルと日時を入力してください');
        return;
    }

    countdowns.push({ title, date });
    storage.set('countdowns', countdowns);
    renderCountdowns();

    // フォームをクリアして閉じる
    document.getElementById('countdownTitle').value = '';
    document.getElementById('countdownDate').value = '';
    countdownModal.classList.add('hidden');
});

renderCountdowns();
setInterval(renderCountdowns, 60000); // 1分ごとに再

// ==================== カレンダー ====================
let currentDate = new Date();

// カレンダーを描画、前月・翌月のはみ出し日も表示して42セルに
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;
    calendar.innerHTML = '';

    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    weekDays.forEach(day => {
        const div = document.createElement('div');
        div.className = 'calendar-header';
        div.textContent = day;
        calendar.appendChild(div);
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    // 前月のはみ出し日
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const div = document.createElement('div');
        div.className = 'calendar-day other-month';
        div.textContent = prevLastDate - i;
        calendar.appendChild(div);
    }

    const today = new Date();
    for (let i = 1; i <= lastDate; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        div.textContent = i;

        if (year === today.getFullYear() && month === today.getMonth() && i === today.getDate()) {
            div.classList.add('today');
        }

        calendar.appendChild(div);
    }

    // 次月のはみ出し日を埋める
    const remainingDays = 42 - (firstDayOfWeek + lastDate);
    for (let i = 1; i <= remainingDays; i++) {
        const div = document.createElement('div');
        div.className = 'calendar-day other-month';
        div.textContent = i;
        calendar.appendChild(div);
    }
}

document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

renderCalendar();

// ==================== ポモドーロタイマー ====================
const pomodoroTimeDisplay = document.getElementById('pomodoroTime');
const pomodoroStatus = document.getElementById('pomodoroStatus');
const pomodoroStartBtn = document.getElementById('pomodoroStart');
const pomodoroResetBtn = document.getElementById('pomodoroReset');
const pomodoroCountDisplay = document.getElementById('pomodoroCount');
const timerProgress = document.getElementById('timerProgress');

// 保存されているカウントを反映
pomodoroCount = storage.get('pomodoroCount') || 0;
pomodoroCountDisplay.textContent = pomodoroCount;

function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroSeconds / 60);
    const seconds = pomodoroSeconds % 60;
    pomodoroTimeDisplay.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 現在のセッションの総秒数（作業時間 25 分 / 休憩 5 分）
    const totalSeconds = pomodoroStatus.textContent === '休憩時間' ? 5 * 60 : 25 * 60;
    const progress = (pomodoroSeconds / totalSeconds) * 565.48;
    timerProgress.style.strokeDashoffset = 565.48 - progress;
}

// スタート/ストップのトグル タイマーがゼロになったら通知を出す
function startPomodoro() {
    if (pomodoroRunning) {
        // 停止
        clearInterval(pomodoroTimer);
        pomodoroRunning = false;
        pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
    } else {
        // 開始
        pomodoroRunning = true;
        pomodoroStartBtn.innerHTML = '<i class="fas fa-pause"></i> 停止';

        pomodoroTimer = setInterval(() => {
            pomodoroSeconds--;
            updatePomodoroDisplay();

            if (pomodoroSeconds <= 0) {
                clearInterval(pomodoroTimer);
                pomodoroRunning = false;

                if (pomodoroStatus.textContent === '作業時間') {
                    // 作業完了 -> 休憩へ
                    pomodoroCount++;
                    storage.set('pomodoroCount', pomodoroCount);
                    pomodoroCountDisplay.textContent = pomodoroCount;

                    pomodoroSeconds = 5 * 60;
                    pomodoroStatus.textContent = '休憩時間';
                    showNotification('お疲れ様です！', '5分間休憩しましょう');
                } else {
                    // 休憩終了 -> 作業へ
                    pomodoroSeconds = 25 * 60;
                    pomodoroStatus.textContent = '作業時間';
                    showNotification('休憩終了！', 'また頑張りましょう');
                }

                pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
                updatePomodoroDisplay();
            }
        }, 1000);
    }
}

// リセット: タイマー停止・時間を25分に戻す
function resetPomodoro() {
    clearInterval(pomodoroTimer);
    pomodoroRunning = false;
    pomodoroSeconds = 25 * 60;
    pomodoroStatus.textContent = '作業時間';
    pomodoroStartBtn.innerHTML = '<i class="fas fa-play"></i> 開始';
    updatePomodoroDisplay();
}

pomodoroStartBtn.addEventListener('click', startPomodoro);
pomodoroResetBtn.addEventListener('click', resetPomodoro);

updatePomodoroDisplay();

// ブラウザの Notification API を使ってデスクトップ通知を出す（許可が必要）
function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') new Notification(title, { body });
        });
    }
}

// 初回アクセスで通知権限を要求
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// ==================== リンク管理（改善版） ====================
const linkEditButton = document.getElementById('linkeditbutton');
const linkEditForm = document.getElementById('linkEditForm');
const linkAddButton = document.getElementById('linkaddbutton');
const linkRemoveButton = document.getElementById('linkremovebutton');
const linkList = document.getElementById('linklist');

let links = storage.get('customLinks') || [];

// カスタムリンクをリストに追加、チェックボックスは編集モードのみ表示
function renderLinks() {
    // 最初にHTMLに書かれているリンクを保持
  const staticLinks = Array.from(linkList.querySelectorAll('li')).map(li => li.outerHTML);

  // 一旦消して、元の固定リンクを再描画
  linkList.innerHTML = staticLinks.join('');
    links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" class="link-checkbox">
            <a href="${link.url}" target="_blank" rel="noopener noreferrer">
                <i class="fas fa-link"></i> ${link.name}
            </a>
        `;
        linkList.appendChild(li);
    });
}

linkEditButton.addEventListener('click', () => {
    linkEditForm.classList.toggle('hidden');

    // 編集モード時はチェックボックスを表示、それ以外は非表示
    const checkboxes = document.querySelectorAll('.link-checkbox');
    checkboxes.forEach(cb => {
        cb.style.display = linkEditForm.classList.contains('hidden') ? 'none' : 'inline-block';
    });
});

// 初期状態ではチェックボックスを非表示
document.querySelectorAll('.link-checkbox').forEach(cb => cb.style.display = 'none');

linkAddButton.addEventListener('click', () => {
    const nameInput = document.getElementById('newlinknametext');
    const urlInput = document.getElementById('newlinkurltext');

    const name = nameInput.value.trim();
    const url = urlInput.value.trim();

    if (!name || !url) {
        alert('リンク名とURLを入力してください');
        return;
    }

    links.push({ name, url });
    storage.set('customLinks', links);

    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox" class="link-checkbox" style="display: inline-block;">
        <a href="${url}" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-link"></i> ${name}
        </a>
    `;
    linkList.appendChild(li);

    nameInput.value = '';
    urlInput.value = '';
});

linkRemoveButton.addEventListener('click', () => {
    const checkedLinks = linkList.querySelectorAll('.link-checkbox:checked');

    if (checkedLinks.length === 0) {
        alert('削除するリンクを選択してください');
        return;
    }

    if (!confirm(`${checkedLinks.length}個のリンクを削除しますか？`)) return;

    // 選択されたリンクを customLinks から削除
    checkedLinks.forEach(checkbox => {
        const li = checkbox.parentElement;
        const linkText = li.querySelector('a').textContent.trim();
        links = links.filter(link => link.name !== linkText);
        li.remove();
    });

    storage.set('customLinks', links);
});

renderLinks();

// ==================== TODOリスト ====================
const taskList = document.getElementById('tasklist');
const newTaskInput = document.getElementById('newtasktext');
const taskAddButton = document.getElementById('newtaskaddbutton');
const taskRemoveButton = document.getElementById('taskremovebutton');

let tasks = storage.get('tasks') || [];

// 保存されたタスクを表示、チェックで完了状態を保存する
function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" ${task.completed ? 'checked' : ''}>
            <span>${task.text}</span>
        `;

        li.querySelector('input').addEventListener('change', (e) => {
            task.completed = e.target.checked;
            storage.set('tasks', tasks);
        });

        taskList.appendChild(li);
    });
}

taskAddButton.addEventListener('click', () => {
    const text = newTaskInput.value.trim();
    if (!text) {
        alert('タスク内容を入力してください');
        return;
    }

    const task = { text, completed: false };
    tasks.push(task);
    storage.set('tasks', tasks);

    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox">
        <span>${text}</span>
    `;

    li.querySelector('input').addEventListener('change', (e) => {
        task.completed = e.target.checked;
        storage.set('tasks', tasks);
    });

    taskList.appendChild(li);
    newTaskInput.value = '';
});

taskRemoveButton.addEventListener('click', () => {
    const checkedTasks = taskList.querySelectorAll('input[type="checkbox"]:checked');
    checkedTasks.forEach(checkbox => {
        const li = checkbox.parentElement;
        const text = li.querySelector('span').textContent;
        tasks = tasks.filter(task => task.text !== text);
        li.remove();
    });

    storage.set('tasks', tasks);
});

newTaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') taskAddButton.click();
});

renderTasks();

// ==================== メモ帳 ====================
const memoArea = document.getElementById('memoArea');
const saveMemoBtn = document.getElementById('saveMemoBtn');

memoArea.value = storage.get('memo') || '';

let memoTimeout;
memoArea.addEventListener('input', () => {
    // 入力のデバウンス（1秒）で保存
    clearTimeout(memoTimeout);
    memoTimeout = setTimeout(() => storage.set('memo', memoArea.value), 1000);
});

saveMemoBtn.addEventListener('click', () => {
    storage.set('memo', memoArea.value);
    saveMemoBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => saveMemoBtn.innerHTML = '<i class="fas fa-save"></i>', 1000);
});