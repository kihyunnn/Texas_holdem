const API_URL = '/api';
let trendChart = null;
let handChart = null;

// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

async function loadDashboard() {
    await loadPlayers();
    await loadSessionStats(); // 오늘 세션 통계 (리더보드)
    await loadRecentGames();  // 오늘 게임 기록
    await loadCharts();       // 차트 렌더링
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
    select.innerHTML = '<option value="">누가 이겼나요?</option>';
    players.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

// --- Modals ---
function openRankings() {
    window.open('rankings.html', 'PokerRankings', 'width=600,height=800,scrollbars=yes');
}

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

    // 간소화됨: 참가자 목록 없이, 승자와 팟만 전송
    const payload = {
        winner_id: parseInt(winnerId),
        pot_amount: parseInt(potAmount),
        winning_hand: winningHand,
        notes
    };

    // 로딩 표시
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
        await loadDashboard(); // 전체 갱신

    } catch (err) {
        alert(err.message);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// --- Stats & Charts ---
async function loadSessionStats() {
    try {
        // 오늘자 세션 통계 가져오기
        const res = await fetch(`${API_URL}/stats/session`);
        const data = await res.json();

        const tbody = document.getElementById('sessionStatsBody');

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">오늘 기록된 게임이 없습니다.</td></tr>';
            document.getElementById('topWinnerDiff').textContent = '-';
            return;
        }

        // Top Winner 표시
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
    // 1. Trend Chart (오늘의 Pot 획득 추이 - 예시로 누적은 아니지만 게임별 pot 보여주기)
    try {
        const res = await fetch(`${API_URL}/stats/trend`);
        const games = await res.json();

        const ctxTrend = document.getElementById('trendChart').getContext('2d');

        const labels = games.map((g, i) => `#${i + 1} (${g.winner_name})`);
        const dataPoints = games.map(g => g.pot_amount);

        if (trendChart) trendChart.destroy();

        trendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Game Pot Size',
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
                    x: { display: false } // 너무 많으면 라벨 숨김
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

    } catch (e) { console.error(e); }

    // 2. Hand Chart
    try {
        const res = await fetch(`${API_URL}/stats/hand?scope=today`);
        const stats = await res.json();

        const ctxHand = document.getElementById('handChart').getContext('2d');

        // 데이터가 없으면 차트 숨기기
        if (stats.length === 0) return;

        const labels = stats.map(s => s.winning_hand);
        const data = stats.map(s => s.count);

        if (handChart) handChart.destroy();

        handChart = new Chart(ctxHand, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                    ],
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


async function loadRecentGames() {
    try {
        const res = await fetch(`${API_URL}/games?limit=10&scope=today`);
        const games = await res.json();

        const container = document.getElementById('recentGamesList');

        if (games.length === 0) {
            container.innerHTML = '<div class="text-sec" style="text-align:center; padding: 20px;">오늘 게임 기록이 없습니다.</div>';
            return;
        }

        container.innerHTML = games.map(g => {
            const time = new Date(g.played_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

            return `
            <div class="game-history-item">
                <div class="game-header">
                    <span class="text-sec small-date">${time}</span>
                    <span class="game-pot">₩ ${g.pot_amount.toLocaleString()}</span>
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
