const API_URL = '/api';

// --- 초기화 ---
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

async function loadDashboard() {
    await loadPlayers(); // 승자 선택 옵션 및 모달 내 목록 준비
    await loadStats();   // 통계 및 기록 로드
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
        container.innerHTML = '<div class="text-sec" style="padding:10px; text-align:center;">플레이어가 없습니다. 추가해주세요.</div>';
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
    select.innerHTML = '<option value="">선택하세요</option>';
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
}

// --- Modals ---
function openRankings() {
    // 족보는 새 창 팝업으로
    window.open('rankings.html', 'PokerRankings', 'width=600,height=800,scrollbars=yes');
}

function openGameModal() {
    document.getElementById('gameModal').style.display = 'flex';
}

function closeGameModal() {
    document.getElementById('gameModal').style.display = 'none';
    document.getElementById('gameForm').reset();
    document.querySelectorAll('.player-select-item').forEach(el => el.classList.remove('checked'));
    document.querySelectorAll('.player-bet-input').forEach(el => el.disabled = true);
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

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || '오류가 발생했습니다');
        }

        closeAddPlayerModal();
        await loadPlayers();
        // 리더보드도 갱신하여 새 플레이어가 보이게 함
        await loadStats();
    } catch (e) {
        alert(e.message);
    }
}

async function handleGameSubmit(e) {
    e.preventDefault();

    const winnerId = document.getElementById('winnerSelect').value;
    const potAmount = document.getElementById('potAmount').value;
    const notes = document.getElementById('gameNotes').value;

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

    if (participants.length < 2) return alert("최소 2명 이상 참여해야 합니다.");
    if (!participants.find(p => p.player_id == winnerId)) return alert("승자는 참여자 목록에 있어야 합니다.");

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

        // 성공 처리
        closeGameModal();
        await loadStats(); // 대시보드 갱신

    } catch (err) {
        alert(err.message);
    }
}

// --- Stats & Dashboard ---
async function loadStats() {
    await Promise.all([loadLeaderboard(), loadRecentGames()]);
}

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const data = await res.json();

        const tbody = document.getElementById('leaderboardBody');

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;" class="text-sec">플레이어가 없습니다.</td></tr>';
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
            container.innerHTML = '<div class="text-sec" style="text-align:center; padding: 20px;">아직 게임 기록이 없습니다.</div>';
            return;
        }

        container.innerHTML = games.map(g => {
            const date = new Date(g.played_at).toLocaleString('ko-KR', {
                month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return `
            <div class="game-history-item">
                <div class="game-header">
                    <span class="text-sec small-date">${date}</span>
                    <span class="game-pot">Pot: ${g.pot_amount.toLocaleString()}</span>
                </div>
                <div class="d-flex justify-between">
                    <span>Winner: <span class="game-winner">${g.winner_name}</span></span>
                    <span class="text-sec">${g.participants.length}명</span>
                </div>
                ${g.notes ? `<div class="text-sec" style="margin-top:4px; font-size:0.85rem;">📝 ${g.notes}</div>` : ''}
            </div>
            `;
        }).join('');
    } catch (e) {
        console.error(e);
    }
}
