const API_URL = '/api';
let trendChart = null;
let handChart = null;

// ==================== Theme ====================
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
}

function updateThemeIcon(theme) {
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// ==================== Init ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    const lastTab = localStorage.getItem('lastTab') || 'records';
    switchTab(lastTab);
});

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`);
    if (activeBtn) activeBtn.classList.add('active');

    document.getElementById(`tab-${tabId}`).classList.add('active');
    localStorage.setItem('lastTab', tabId);

    loadPlayers();

    if (tabId === 'records') {
        initFilters();
        applyFilters();
    } else if (tabId === 'stats') {
        loadStatsTab();
    } else if (tabId === 'players') {
        loadPlayerSelectOptions();
    } else if (tabId === 'rivalry') {
        loadRivalrySelects();
    }
}

// ==================== Players ====================
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
        select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
}

// ==================== Filters ====================
function initFilters() {
    const filterPlayer = document.getElementById('filterPlayer');
    if (filterPlayer) {
        filterPlayer.innerHTML = '<option value="">모든 플레이어</option>';
        players.forEach(p => {
            filterPlayer.innerHTML += `<option value="${p.id}">${p.name}</option>`;
        });
    }

    document.getElementById('filterScope').addEventListener('change', function () {
        document.getElementById('customDateRange').style.display =
            this.value === 'custom' ? 'flex' : 'none';
    });
}

async function applyFilters() {
    const scope = document.getElementById('filterScope').value;
    const playerId = document.getElementById('filterPlayer').value;
    const hand = document.getElementById('filterHand').value;

    let url = `${API_URL}/games?limit=50&scope=${scope}`;

    if (scope === 'custom') {
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        if (dateFrom && dateTo) {
            url = `${API_URL}/games?limit=50&scope=custom&date_from=${dateFrom}&date_to=${dateTo}`;
        }
    }

    if (playerId) url += `&player_id=${playerId}`;
    if (hand) url += `&hand=${encodeURIComponent(hand)}`;

    try {
        const res = await fetch(url);
        const games = await res.json();
        renderGames(games);
    } catch (e) {
        console.error(e);
    }
}

function renderGames(games) {
    const container = document.getElementById('recentGamesList');

    if (games.length === 0) {
        container.innerHTML = '<div class="empty-state">No games match your filter criteria.</div>';
        return;
    }

    container.innerHTML = games.map(g => {
        const date = new Date(g.played_at);
        const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

        return `
        <div class="game-history-item">
            <div class="game-header">
                <span class="text-sec">${dateStr} ${timeStr}</span>
                <div>
                    <span class="game-pot">${g.pot_amount.toLocaleString()}</span>
                    <button class="btn-icon small" onclick="deleteGame(${g.id})" title="Delete">×</button>
                </div>
            </div>
            <div class="game-main">
                <span class="game-winner">${g.winner_name}</span>
                ${g.winning_hand ? `<span class="game-hand">${g.winning_hand}</span>` : ''}
            </div>
            ${g.ai_analysis ? `<div class="ai-comment">${g.ai_analysis}</div>` : ''}
        </div>`;
    }).join('');
}

async function deleteGame(gameId) {
    if (!confirm('이 기록을 삭제할까요?')) return;

    try {
        await fetch(`${API_URL}/games/${gameId}`, { method: 'DELETE' });
        applyFilters();
    } catch (e) {
        alert('삭제 실패');
    }
}

// ==================== Stats Tab ====================
async function loadStatsTab() {
    await loadSessionStats();
    await loadCharts();
}

async function loadSessionStats() {
    try {
        const res = await fetch(`${API_URL}/stats/session`);
        const data = await res.json();

        const tbody = document.getElementById('sessionStatsBody');
        const topWinner = document.getElementById('topWinnerDiff');

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-cell">오늘 기록 없음</td></tr>';
            topWinner.textContent = '-';
            return;
        }

        topWinner.textContent = `${data[0].name} (₩${data[0].total_won.toLocaleString()})`;

        tbody.innerHTML = data.map((p, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.wins}승</td>
                <td class="profit-positive">₩${p.total_won.toLocaleString()}</td>
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

        const ctx = document.getElementById('trendChart')?.getContext('2d');
        if (!ctx) return;

        if (trendChart) trendChart.destroy();

        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: games.map((g, i) => `#${i + 1}`),
                datasets: [{
                    label: 'Pot',
                    data: games.map(g => g.pot_amount),
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
                    x: { display: false }
                },
                plugins: { legend: { display: false } }
            }
        });
    } catch (e) { console.error(e); }

    // Hand Chart
    try {
        const res = await fetch(`${API_URL}/stats/hand?scope=today`);
        const stats = await res.json();

        if (stats.length === 0) return;

        const ctx = document.getElementById('handChart')?.getContext('2d');
        if (!ctx) return;

        if (handChart) handChart.destroy();

        handChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: stats.map(s => s.winning_hand),
                datasets: [{
                    data: stats.map(s => s.count),
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

// ==================== Player Analysis Tab ====================
function loadPlayerSelectOptions() {
    const select = document.getElementById('analysisPlayerSelect');
    if (!select) return;
    select.innerHTML = '<option value="">플레이어 선택</option>';
    players.forEach(p => {
        select.innerHTML += `<option value="${p.id}">${p.name}</option>`;
    });
}

async function loadPlayerAnalysis(playerId) {
    if (!playerId) {
        document.getElementById('playerAnalysisResult').style.display = 'none';
        return;
    }

    document.getElementById('playerAnalysisResult').style.display = 'block';
    document.getElementById('pa-insight').textContent = '분석 중...';

    try {
        // Stats
        const statsRes = await fetch(`${API_URL}/players/${playerId}/stats`);
        const stats = await statsRes.json();

        document.getElementById('pa-wins').textContent = `${stats.total_wins}회`;
        document.getElementById('pa-won').textContent = `₩${stats.total_won.toLocaleString()}`;
        document.getElementById('pa-tophand').textContent = stats.top_hand || '-';

        // AI Insight
        const insightRes = await fetch(`${API_URL}/players/${playerId}/insight`);
        const insight = await insightRes.json();
        document.getElementById('pa-insight').textContent = insight.ai_insight || '분석 불가';

        // Achievements
        const achieveRes = await fetch(`${API_URL}/achievements/${playerId}`);
        const achieve = await achieveRes.json();

        const achieveContainer = document.getElementById('achievementsList');
        if (achieve.achievements.length === 0) {
            achieveContainer.innerHTML = '<div class="empty-state small">아직 업적이 없습니다</div>';
        } else {
            achieveContainer.innerHTML = achieve.achievements.map(a => `
                <div class="achievement-badge">
                    <span class="achievement-icon">${a.name.split(' ')[0]}</span>
                    <span class="achievement-name">${a.name.split(' ').slice(1).join(' ')}</span>
                </div>
            `).join('');
        }

    } catch (e) {
        console.error(e);
        document.getElementById('pa-insight').textContent = '데이터 로드 실패';
    }
}

// ==================== Rivalry Tab ====================
function loadRivalrySelects() {
    const s1 = document.getElementById('rival1Select');
    const s2 = document.getElementById('rival2Select');

    if (!s1 || !s2) return;

    const options = '<option value="">플레이어 선택</option>' +
        players.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    s1.innerHTML = options;
    s2.innerHTML = options;
}

async function compareRivals() {
    const p1 = document.getElementById('rival1Select').value;
    const p2 = document.getElementById('rival2Select').value;

    if (!p1 || !p2) {
        alert('두 플레이어를 선택해주세요');
        return;
    }

    if (p1 === p2) {
        alert('다른 플레이어를 선택해주세요');
        return;
    }

    document.getElementById('rivalryResult').style.display = 'block';
    document.getElementById('rivalry-insight').textContent = '분석 중...';

    try {
        const res = await fetch(`${API_URL}/rivalry?player1=${p1}&player2=${p2}`);
        const data = await res.json();

        document.getElementById('r1-name').textContent = data.player1.name;
        document.getElementById('r1-wins').textContent = data.player1.total_wins;
        document.getElementById('r1-won').textContent = data.player1.total_won.toLocaleString();

        document.getElementById('r2-name').textContent = data.player2.name;
        document.getElementById('r2-wins').textContent = data.player2.total_wins;
        document.getElementById('r2-won').textContent = data.player2.total_won.toLocaleString();

        document.getElementById('rivalry-insight').textContent = data.ai_analysis || '-';

    } catch (e) {
        console.error(e);
        document.getElementById('rivalry-insight').textContent = '비교 실패';
    }
}

// ==================== Modals ====================
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

async function submitNewPlayer() {
    const name = document.getElementById('newPlayerName').value.trim();
    if (!name) return alert("이름을 입력해주세요.");

    try {
        const res = await fetch(`${API_URL}/players`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        if (!res.ok) throw new Error('추가 실패');

        closeAddPlayerModal();
        await loadPlayers();
        alert(`${name}님이 추가되었습니다!`);
    } catch (e) {
        alert(e.message);
    }
}

async function handleGameSubmit(e) {
    e.preventDefault();

    const winnerId = document.getElementById('winnerSelect').value;
    const potAmount = document.getElementById('potAmount').value;
    const winningHand = document.getElementById('winningHand').value;
    const notes = document.getElementById('gameNotes').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = 'AI 분석 중...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                winner_id: parseInt(winnerId),
                pot_amount: parseInt(potAmount),
                winning_hand: winningHand,
                notes
            })
        });

        if (!res.ok) throw new Error("기록 실패");

        const data = await res.json();

        closeGameModal();

        if (data.ai_analysis) {
            alert(`🤖 AI 분석\n${data.ai_analysis}`);
        }

        // Refresh current tab
        const currentTab = localStorage.getItem('lastTab') || 'records';
        switchTab(currentTab);

    } catch (err) {
        alert(err.message);
    } finally {
        submitBtn.textContent = '기록 저장';
        submitBtn.disabled = false;
    }
}
