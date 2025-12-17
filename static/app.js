const API_URL = '/api';
let trendChart = null;
let handChart = null;

// --- 테마 관리 ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);

    // 차트가 떠있으면 다시 그리기 (색상 업데이트)
    if (trendChart || handChart) {
        const currentTab = localStorage.getItem('lastTab') || 'records';
        if (currentTab === 'stats') {
            loadCharts();
        }
    }
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
}

// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme(); // 테마 먼저 로드
    const lastTab = localStorage.getItem('lastTab') || 'records';
    switchTab(lastTab);
});

function switchTab(tabId) {
    // UI 전환
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    document.getElementById(`tab-${tabId}`).classList.add('active');
    localStorage.setItem('lastTab', tabId);

    // 데이터 로드
    loadPlayers(); // 플레이어 목록은 모달용으로 항상 필요

    if (tabId === 'records') {
        loadRecentGames();
    } else if (tabId === 'stats') {
        loadStatsTab();
    } else if (tabId === 'players') {
        loadPlayerAnalysisTab();
    }
}

async function loadStatsTab() {
    await loadSessionStats();
    await loadCharts();
}

// --- Player Management ---
let players = [];

async function loadPlayers() {
    try {
        const res = await fetch(`${API_URL}/players`);
        players = await res.json();
        renderWinnerOptions();
    } catch (e) {
        console.error("Failed to load players", e);
    }
}

function renderWinnerOptions() {
    const select = document.getElementById('winnerSelect');
    if (!select) return;
    select.innerHTML = '<option value="">플레이어 선택</option>';
    players.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

// --- Modals ---
function openGameModal() {
    document.getElementById('gameModal').style.display = 'flex';
}

function closeGameModal() {
    document.getElementById('gameModal').style.display = 'none';
    document.getElementById('gameForm').reset();
}

function openAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'flex';
    setTimeout(() => document.getElementById('newPlayerName').focus(), 100);
}

function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
    document.getElementById('newPlayerName').value = '';
}

// --- Actions ---
async function submitNewPlayer() {
    const nameInput = document.getElementById('newPlayerName');
    const name = nameInput.value.trim();

    if (!name) return alert("이름을 입력해주세요.");

    try {
        const res = await fetch(`${API_URL}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (!res.ok) throw new Error('오류 발생');

        closeAddPlayerModal();
        await loadPlayers();
    } catch (e) {
        alert(e.message);
    }
}

async function handleGameSubmit(e) {
    e.preventDefault();

    const winnerId = document.getElementById('winnerSelect').value;
    const potAmount = document.getElementById('potAmount').value;
    const notes = document.getElementById('gameNotes').value;
    const winningHand = document.getElementById('winningHand').value;

    const payload = {
        winner_id: parseInt(winnerId),
        pot_amount: parseInt(potAmount),
        winning_hand: winningHand,
        notes
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'AI 분석 중...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("게임 기록 실패");

        const data = await res.json();

        if (data.ai_analysis) {
            alert(`[AI 분석 결과]\n${data.ai_analysis}`);
        } else {
            alert("게임이 기록되었습니다!");
        }

        closeGameModal();

        // 현재 탭 새로고침
        const currentTab = localStorage.getItem('lastTab') || 'records';
        switchTab(currentTab);

    } catch (err) {
        alert(err.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// --- 기록 탭 ---
async function loadRecentGames() {
    try {
        const res = await fetch(`${API_URL}/games?limit=20&scope=today`);
        const games = await res.json();

        const container = document.getElementById('recentGamesList');

        if (games.length === 0) {
            container.innerHTML = '<div class="empty-state">📭 오늘 게임 기록이 없습니다.<br><span style="font-size:0.9rem; color:#888;">하단의 RECORD 버튼을 눌러 게임을 기록해보세요!</span></div>';
            return;
        }

        container.innerHTML = games.map(g => {
            const time = new Date(g.played_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

            return `
            <div class="game-history-item">
                <div class="game-header">
                    <span class="text-sec small-date">${time}</span>
                    <div>
                        <span class="game-pot">₩ ${g.pot_amount.toLocaleString()}</span>
                        <button class="btn-text small" style="color:#FF5252; padding:2px 6px; margin-left:8px;" onclick="deleteGame(${g.id})">🗑️</button>
                    </div>
                </div>
                <div class="d-flex justify-between">
                    <span>
                        🏆 <span class="game-winner" style="font-size:1.1rem;">${g.winner_name}</span>
                        ${g.winning_hand ? `<span class="text-sec" style="font-size:0.9rem;"> - ${g.winning_hand}</span>` : ''}
                    </span>
                </div>
                ${g.ai_analysis ? `<div style="background:#2a2a2a; padding:10px; border-radius:8px; margin-top:8px; font-size:0.9rem; color:#e0e0e0; line-height:1.4;">🤖 ${g.ai_analysis}</div>` : ''}
            </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
    }
}

async function deleteGame(gameId) {
    if (!confirm('정말 이 게임 기록을 삭제하시겠습니까?')) return;

    try {
        const res = await fetch(`${API_URL}/games/${gameId}`, {
            method: 'DELETE'
        });

        if (!res.ok) throw new Error('삭제 실패');

        // 현재 탭 새로고침
        const currentTab = localStorage.getItem('lastTab') || 'records';
        switchTab(currentTab);

    } catch (e) {
        alert(e.message);
    }
}

// --- 통계 탭 ---
async function loadSessionStats() {
    try {
        const res = await fetch(`${API_URL}/stats/session`);
        const data = await res.json();

        const tbody = document.getElementById('sessionStatsBody');

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">오늘 기록된 게임이 없습니다.</td></tr>';
            document.getElementById('topWinnerDiff').textContent = '-';
            return;
        }

        document.getElementById('topWinnerDiff').textContent = `${data[0].name} (₩${data[0].total_won.toLocaleString()})`;

        tbody.innerHTML = data.map((p, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.wins}승</td>
                <td class="profit-positive">+ ₩${p.total_won.toLocaleString()}</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function loadCharts() {
    // Trend Chart
    try {
        const res = await fetch(`${API_URL}/stats/trend`);
        const games = await res.json();

        const ctxTrend = document.getElementById('trendChart').getContext('2d');

        const labels = games.map((g, i) => `#${i + 1}`);
        const dataPoints = games.map(g => g.pot_amount);

        if (trendChart) trendChart.destroy();

        trendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pot Size',
                    data: dataPoints,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#333' } },
                    x: { display: games.length > 10 ? false : true }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (e) { console.error(e); }

    // Hand Chart
    try {
        const res = await fetch(`${API_URL}/stats/hand?scope=today`);
        const stats = await res.json();

        if (stats.length === 0) return;

        const ctxHand = document.getElementById('handChart').getContext('2d');
        const labels = stats.map(s => s.winning_hand);
        const data = stats.map(s => s.count);

        if (handChart) handChart.destroy();

        handChart = new Chart(ctxHand, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#aaa', boxWidth: 10 } }
                }
            }
        });
    } catch (e) { console.error(e); }
}

// --- 플레이어 분석 탭 ---
async function loadPlayerAnalysisTab() {
    const select = document.getElementById('analysisPlayerSelect');
    if (select.children.length <= 1) {
        players.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name;
            select.appendChild(option);
        });
    }
}

async function loadPlayerAnalysis(playerId) {
    if (!playerId) {
        document.getElementById('playerAnalysisResult').style.display = 'none';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/players/${playerId}/stats`);
        const stats = await res.json();

        document.getElementById('playerAnalysisResult').style.display = 'block';

        const totalWon = stats.total_won || 0;
        document.getElementById('pa-wins').textContent = `${stats.total_wins}회`;
        document.getElementById('pa-won').textContent = `₩${totalWon.toLocaleString()}`;
        document.getElementById('pa-games').textContent = `${stats.total_games}회`;

        const winRate = stats.total_games > 0
            ? Math.round((stats.total_wins / stats.total_games) * 100)
            : 0;

        if (stats.total_games === stats.total_wins) {
            document.getElementById('pa-winrate-label').textContent = "승률 (참가 기록 부족)";
            document.getElementById('pa-winrate').textContent = "-";
            document.getElementById('pa-games').textContent = "-";
        } else {
            document.getElementById('pa-winrate-label').textContent = "승률";
            document.getElementById('pa-winrate').textContent = `${winRate}%`;
        }

        document.getElementById('pa-style').textContent =
            `총 ${stats.total_wins}번 승리하며 ${totalWon.toLocaleString()}원을 획득했습니다.`;

    } catch (e) {
        console.error(e);
        alert("데이터를 불러오는데 실패했습니다.");
    }
}
