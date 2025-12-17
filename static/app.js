const API_URL = '/api';

// --- 초기화 및 탭 관리 ---
document.addEventListener('DOMContentLoaded', () => {
    init();
});

async function init() {
    await loadPlayers();
    await loadStats();

    // 탭 상태 복원 (선택사항)
    const savedTab = localStorage.getItem('lastTab') || 'record';
    switchTab(savedTab);
}

function switchTab(tabId) {
    // UI 업데이트
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // 데이터 새로고침
    if (tabId === 'stats') {
        loadStats();
    } else if (tabId === 'record') {
        loadPlayers(); // 최신 플레이어 목록 갱신
    }

    localStorage.setItem('lastTab', tabId);
}

// --- Player Management ---
let players = [];

async function loadPlayers() {
    try {
        const res = await fetch(`${API_URL}/players`);
        players = await res.json();

        renderPlayerSelectionList();
        renderWinnerOptions();
    } catch (e) {
        console.error("Failed to load players", e);
    }
}

function renderPlayerSelectionList() {
    const container = document.getElementById('playerSelectionList');

    if (players.length === 0) {
        container.innerHTML = '<div class="text-sec">등록된 플레이어가 없습니다.</div>';
        return;
    }

    container.innerHTML = players.map(p => `
        <div class="player-select-item" id="player-item-${p.id}">
            <input type="checkbox" class="player-checkbox" id="p-check-${p.id}" value="${p.id}" onchange="togglePlayerBetInput(${p.id})">
            <span class="player-name">${p.name}</span>
            <input type="number" class="player-bet-input" id="p-bet-${p.id}" placeholder="베팅액" min="0" disabled>
        </div>
    `).join('');
}

function renderWinnerOptions() {
    const select = document.getElementById('winnerSelect');
    // 첫 옵션 유지
    select.innerHTML = '<option value="">승자를 선택하세요</option>';
    players.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name;
        select.appendChild(option);
    });
}

function togglePlayerBetInput(id) {
    const checkbox = document.getElementById(`p-check-${id}`);
    const input = document.getElementById(`p-bet-${id}`);
    const item = document.getElementById(`player-item-${id}`);

    input.disabled = !checkbox.checked;

    if (checkbox.checked) {
        item.classList.add('checked');
        input.focus();
    } else {
        item.classList.remove('checked');
        input.value = '';
    }

    calculateTotalPot();
}

// 자동 팟 계산 (선택사항, 사용자가 직접 입력도 가능)
function calculateTotalPot() {
    // const inputs = document.querySelectorAll('.player-bet-input:not(:disabled)');
    // let total = 0;
    // inputs.forEach(input => {
    //     total += Number(input.value || 0);
    // });
    // document.getElementById('potAmount').value = total;
}

// --- Add Player Modal ---
function openAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'flex';
    document.getElementById('newPlayerName').focus();
}

function closeAddPlayerModal() {
    document.getElementById('addPlayerModal').style.display = 'none';
    document.getElementById('newPlayerName').value = '';
}

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

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '오류가 발생했습니다');
        }

        // 성공
        closeAddPlayerModal();
        await loadPlayers();
        // 방금 추가한 플레이어 자동 선택? (Optional)
    } catch (e) {
        alert(e.message);
    }
}

// --- Game Logic ---
async function handleGameSubmit(e) {
    e.preventDefault();

    // 데이터 수집
    const winnerId = document.getElementById('winnerSelect').value;
    const potAmount = document.getElementById('potAmount').value;
    const notes = document.getElementById('gameNotes').value;

    // 참가자 수집
    const participants = [];
    const checkboxes = document.querySelectorAll('.player-checkbox:checked');

    checkboxes.forEach(cb => {
        const playerId = cb.value;
        const betAmount = document.getElementById(`p-bet-${playerId}`).value;
        participants.push({
            player_id: parseInt(playerId),
            bet_amount: parseInt(betAmount || 0)
        });
    });

    // 검증
    if (participants.length < 2) {
        return alert("최소 2명 이상의 플레이어가 필요합니다.");
    }

    if (!participants.find(p => p.player_id == winnerId)) {
        return alert("승자는 반드시 참가자 중에 있어야 합니다.");
    }

    const payload = {
        winner_id: parseInt(winnerId),
        pot_amount: parseInt(potAmount),
        participants,
        notes
    };

    try {
        const res = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("게임 기록 실패");

        alert("게임이 기록되었습니다! 💸");

        // 폼 초기화
        e.target.reset();
        document.querySelectorAll('.player-select-item').forEach(el => el.classList.remove('checked'));
        document.querySelectorAll('.player-bet-input').forEach(el => el.disabled = true);

        // 통계 탭으로 이동 or 머무르기
        loadStats(); // 배경 데이터 갱신
    } catch (err) {
        alert(err.message);
    }
}

// --- Stats Logic ---
async function loadStats() {
    await Promise.all([loadLeaderboard(), loadRecentGames()]);
}

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const data = await res.json();

        const tbody = document.getElementById('leaderboardBody');

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">아직 게임 기록이 없습니다.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((p, idx) => `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.total_games}</td>
                <td>${p.total_wins}</td>
                <td class="${p.profit >= 0 ? 'profit-positive' : 'profit-negative'}">
                    ${p.profit.toLocaleString()}
                </td>
                <td>${p.win_rate}%</td>
            </tr>
        `).join('');
    } catch (e) {
        console.error(e);
    }
}

async function loadRecentGames() {
    try {
        const res = await fetch(`${API_URL}/games?limit=10`);
        const games = await res.json();

        const container = document.getElementById('recentGamesList');

        if (games.length === 0) {
            container.innerHTML = '<div class="text-sec" style="text-align:center;">기록이 없습니다.</div>';
            return;
        }

        container.innerHTML = games.map(g => {
            const date = new Date(g.played_at).toLocaleString('ko-KR', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `
            <div class="game-history-item">
                <div class="d-flex justify-between game-header">
                    <span class="text-sec">${date}</span>
                    <span class="game-pot">Pot: ${g.pot_amount.toLocaleString()}</span>
                </div>
                <div class="d-flex justify-between">
                    <span>Winner: <span class="game-winner text-gold">${g.winner_name}</span></span>
                    <span class="text-sec">${g.participants.length}명 참여</span>
                </div>
                ${g.notes ? `<div class="text-sec" style="margin-top: 4px; font-size: 0.8rem;">📝 ${g.notes}</div>` : ''}
            </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
    }
}
