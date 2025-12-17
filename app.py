from flask import Flask, g, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

DATABASE = 'poker.db'

def get_openai_client():
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return None
    return OpenAI(api_key=api_key)

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def init_db():
    """데이터베이스 초기화"""
    with app.app_context():
        db = get_db()
        
        # Players table
        db.execute('''
            CREATE TABLE IF NOT EXISTS players (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Games table with winning_hand and ai_analysis
        db.execute('''
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                winner_id INTEGER NOT NULL,
                pot_amount INTEGER NOT NULL,
                winning_hand TEXT,
                ai_analysis TEXT,
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                FOREIGN KEY (winner_id) REFERENCES players (id)
            )
        ''')
        
        # Game Participants table
        db.execute('''
            CREATE TABLE IF NOT EXISTS game_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                game_id INTEGER NOT NULL,
                player_id INTEGER NOT NULL,
                bet_amount INTEGER NOT NULL,
                FOREIGN KEY (game_id) REFERENCES games (id),
                FOREIGN KEY (player_id) REFERENCES players (id)
            )
        ''')
        
        # ALTER TABLE for existing DB (add columns if missing)
        try:
            db.execute('ALTER TABLE games ADD COLUMN winning_hand TEXT')
        except: pass
        try:
            db.execute('ALTER TABLE games ADD COLUMN ai_analysis TEXT')
        except: pass
        
        db.commit()

# ==================== Static Files ====================
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# ==================== Players API ====================
@app.route('/api/players', methods=['GET'])
def get_players():
    db = get_db()
    players = db.execute('SELECT * FROM players ORDER BY name').fetchall()
    return jsonify([dict(row) for row in players])

@app.route('/api/players', methods=['POST'])
def add_player():
    data = request.json
    name = data.get('name', '').strip()
    
    if not name:
        return jsonify({'error': '이름을 입력해주세요'}), 400
    
    try:
        db = get_db()
        cursor = db.execute('INSERT INTO players (name) VALUES (?)', (name,))
        db.commit()
        return jsonify({'id': cursor.lastrowid, 'name': name}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': '이미 존재하는 플레이어입니다'}), 400

@app.route('/api/players/<int:player_id>/stats', methods=['GET'])
def get_player_stats(player_id):
    db = get_db()
    player = db.execute('SELECT * FROM players WHERE id = ?', (player_id,)).fetchone()
    if not player:
        return jsonify({'error': '플레이어를 찾을 수 없습니다'}), 404
    
    total_wins = db.execute('SELECT COUNT(*) FROM games WHERE winner_id = ?', (player_id,)).fetchone()[0]
    total_won = db.execute('SELECT COALESCE(SUM(pot_amount), 0) FROM games WHERE winner_id = ?', (player_id,)).fetchone()[0]
    
    # 가장 많이 이긴 핸드
    top_hand = db.execute('''
        SELECT winning_hand, COUNT(*) as cnt 
        FROM games 
        WHERE winner_id = ? AND winning_hand IS NOT NULL AND winning_hand != ''
        GROUP BY winning_hand 
        ORDER BY cnt DESC 
        LIMIT 1
    ''', (player_id,)).fetchone()
    
    return jsonify({
        'player': dict(player),
        'total_games': total_wins,  # 간소화 모드에서는 승리 수 = 참여 수
        'total_wins': total_wins,
        'total_won': total_won,
        'top_hand': top_hand['winning_hand'] if top_hand else None,
        'top_hand_count': top_hand['cnt'] if top_hand else 0
    })

# ==================== AI Analysis ====================
def analyze_game(game_data, winner_name):
    client = get_openai_client()
    if not client:
        return None

    try:
        prompt = f"""텍사스 홀덤 게임 분석:
승자: {winner_name}
핸드: {game_data.get('winning_hand', '알 수 없음')}
팟: {game_data.get('pot_amount')}
상황: {game_data.get('notes', '없음')}

3줄 이내로 재치있게 코멘트해줘. (한국어)"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "너는 재치있는 포커 해설가야."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"분석 오류: {str(e)}"

def generate_player_insight(player_name, stats):
    """플레이어 스타일 AI 분석"""
    client = get_openai_client()
    if not client:
        return "AI 분석을 위해 API 키가 필요합니다."

    try:
        prompt = f"""포커 플레이어 분석:
이름: {player_name}
총 승리: {stats['total_wins']}회
총 획득: {stats['total_won']}원
주력 핸드: {stats.get('top_hand', '데이터 없음')} ({stats.get('top_hand_count', 0)}회)

이 플레이어의 스타일을 2-3줄로 분석해줘. (한국어)"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "너는 포커 전문 분석가야."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=150
        )
        return response.choices[0].message.content
    except:
        return "분석을 생성할 수 없습니다."

def generate_rivalry_analysis(player1, player2, stats1, stats2):
    """라이벌 비교 AI 분석"""
    client = get_openai_client()
    if not client:
        return "AI 분석을 위해 API 키가 필요합니다."

    try:
        prompt = f"""포커 라이벌 비교:
{player1}: {stats1['total_wins']}승, {stats1['total_won']}원 획득
{player2}: {stats2['total_wins']}승, {stats2['total_won']}원 획득

두 플레이어의 대결 구도를 재미있게 2줄로 분석해줘. (한국어)"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "너는 스포츠 해설가처럼 흥미진진하게 분석하는 전문가야."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100
        )
        return response.choices[0].message.content
    except:
        return "분석을 생성할 수 없습니다."

# ==================== Games API ====================
@app.route('/api/games', methods=['POST'])
def record_game():
    data = request.json
    winner_id = data.get('winner_id')
    pot_amount = data.get('pot_amount')
    winning_hand = data.get('winning_hand', '')
    notes = data.get('notes', '')
    
    if not winner_id or pot_amount is None:
        return jsonify({'error': '승자와 팟 금액은 필수입니다'}), 400
    
    try:
        db = get_db()
        winner_name = db.execute('SELECT name FROM players WHERE id=?', (winner_id,)).fetchone()[0]
        ai_analysis = analyze_game(data, winner_name)

        cursor = db.execute('''
            INSERT INTO games (winner_id, pot_amount, winning_hand, ai_analysis, notes) 
            VALUES (?, ?, ?, ?, ?)
        ''', (winner_id, pot_amount, winning_hand, ai_analysis, notes))
        game_id = cursor.lastrowid
        db.commit()
        
        return jsonify({
            'id': game_id, 
            'message': '게임이 기록되었습니다',
            'ai_analysis': ai_analysis
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games/<int:game_id>', methods=['DELETE'])
def delete_game(game_id):
    try:
        db = get_db()
        db.execute('DELETE FROM game_participants WHERE game_id = ?', (game_id,))
        result = db.execute('DELETE FROM games WHERE id = ?', (game_id,))
        db.commit()
        
        if result.rowcount == 0:
            return jsonify({'error': '게임을 찾을 수 없습니다'}), 404
            
        return jsonify({'message': '게임이 삭제되었습니다'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games', methods=['GET'])
def get_games():
    limit = request.args.get('limit', 20, type=int)
    scope = request.args.get('scope', 'today')
    player_id = request.args.get('player_id', type=int)
    hand = request.args.get('hand', '')
    date_from = request.args.get('date_from', '')
    date_to = request.args.get('date_to', '')
    
    query = '''
        SELECT g.*, p.name as winner_name
        FROM games g
        JOIN players p ON g.winner_id = p.id
        WHERE 1=1
    '''
    params = []
    
    # 날짜 필터
    if scope == 'today':
        query += " AND date(g.played_at, 'localtime') = date('now', 'localtime')"
    elif date_from and date_to:
        query += " AND date(g.played_at, 'localtime') BETWEEN ? AND ?"
        params.extend([date_from, date_to])
    
    # 플레이어 필터
    if player_id:
        query += " AND g.winner_id = ?"
        params.append(player_id)
    
    # 핸드 필터
    if hand:
        query += " AND g.winning_hand = ?"
        params.append(hand)
    
    query += " ORDER BY g.played_at DESC LIMIT ?"
    params.append(limit)
    
    db = get_db()
    games = db.execute(query, tuple(params)).fetchall()
    
    return jsonify([dict(g) for g in games])

# ==================== Stats API ====================
@app.route('/api/stats/session', methods=['GET'])
def get_session_stats():
    """오늘의 세션 통계"""
    db = get_db()
    stats = db.execute('''
        SELECT 
            p.id, p.name,
            COUNT(g.id) as wins,
            SUM(g.pot_amount) as total_pot_won
        FROM players p
        JOIN games g ON p.id = g.winner_id
        WHERE date(g.played_at, 'localtime') = date('now', 'localtime')
        GROUP BY p.id
        ORDER BY total_pot_won DESC
    ''').fetchall()
    
    return jsonify([{
        'name': row['name'],
        'wins': row['wins'],
        'total_won': row['total_pot_won']
    } for row in stats])

@app.route('/api/stats/trend', methods=['GET'])
def get_stats_trend():
    """오늘의 게임 추이"""
    db = get_db()
    games = db.execute('''
        SELECT g.id, p.name as winner_name, g.pot_amount
        FROM games g
        JOIN players p ON g.winner_id = p.id
        WHERE date(g.played_at, 'localtime') = date('now', 'localtime')
        ORDER BY g.id ASC
    ''').fetchall()
    
    return jsonify([dict(row) for row in games])

@app.route('/api/stats/hand', methods=['GET'])
def get_hand_stats():
    """핸드별 승리 통계"""
    scope = request.args.get('scope', 'today')
    
    query = '''
        SELECT winning_hand, COUNT(*) as count
        FROM games 
        WHERE winning_hand IS NOT NULL AND winning_hand != ''
    '''
    
    if scope == 'today':
        query += " AND date(played_at, 'localtime') = date('now', 'localtime')"
        
    query += " GROUP BY winning_hand ORDER BY count DESC"
    
    db = get_db()
    rows = db.execute(query).fetchall()
    return jsonify([dict(r) for r in rows])

# ==================== Advanced Features ====================
@app.route('/api/players/<int:player_id>/insight', methods=['GET'])
def get_player_insight(player_id):
    """플레이어 AI 인사이트"""
    db = get_db()
    player = db.execute('SELECT * FROM players WHERE id = ?', (player_id,)).fetchone()
    if not player:
        return jsonify({'error': '플레이어를 찾을 수 없습니다'}), 404
    
    total_wins = db.execute('SELECT COUNT(*) FROM games WHERE winner_id = ?', (player_id,)).fetchone()[0]
    total_won = db.execute('SELECT COALESCE(SUM(pot_amount), 0) FROM games WHERE winner_id = ?', (player_id,)).fetchone()[0]
    
    top_hand = db.execute('''
        SELECT winning_hand, COUNT(*) as cnt 
        FROM games 
        WHERE winner_id = ? AND winning_hand IS NOT NULL AND winning_hand != ''
        GROUP BY winning_hand 
        ORDER BY cnt DESC 
        LIMIT 1
    ''', (player_id,)).fetchone()
    
    stats = {
        'total_wins': total_wins,
        'total_won': total_won,
        'top_hand': top_hand['winning_hand'] if top_hand else None,
        'top_hand_count': top_hand['cnt'] if top_hand else 0
    }
    
    insight = generate_player_insight(player['name'], stats)
    
    return jsonify({
        'player': dict(player),
        'stats': stats,
        'ai_insight': insight
    })

@app.route('/api/rivalry', methods=['GET'])
def get_rivalry():
    """라이벌 비교"""
    player1_id = request.args.get('player1', type=int)
    player2_id = request.args.get('player2', type=int)
    
    if not player1_id or not player2_id:
        return jsonify({'error': '두 플레이어 ID가 필요합니다'}), 400
    
    db = get_db()
    
    def get_player_stats(pid):
        player = db.execute('SELECT * FROM players WHERE id = ?', (pid,)).fetchone()
        if not player:
            return None, None
        wins = db.execute('SELECT COUNT(*) FROM games WHERE winner_id = ?', (pid,)).fetchone()[0]
        won = db.execute('SELECT COALESCE(SUM(pot_amount), 0) FROM games WHERE winner_id = ?', (pid,)).fetchone()[0]
        return player, {'total_wins': wins, 'total_won': won}
    
    p1, s1 = get_player_stats(player1_id)
    p2, s2 = get_player_stats(player2_id)
    
    if not p1 or not p2:
        return jsonify({'error': '플레이어를 찾을 수 없습니다'}), 404
    
    analysis = generate_rivalry_analysis(p1['name'], p2['name'], s1, s2)
    
    return jsonify({
        'player1': {'name': p1['name'], **s1},
        'player2': {'name': p2['name'], **s2},
        'ai_analysis': analysis
    })

@app.route('/api/achievements/<int:player_id>', methods=['GET'])
def get_achievements(player_id):
    """플레이어 업적"""
    db = get_db()
    player = db.execute('SELECT * FROM players WHERE id = ?', (player_id,)).fetchone()
    if not player:
        return jsonify({'error': '플레이어를 찾을 수 없습니다'}), 404
    
    achievements = []
    
    # 총 승리 횟수
    total_wins = db.execute('SELECT COUNT(*) FROM games WHERE winner_id = ?', (player_id,)).fetchone()[0]
    total_won = db.execute('SELECT COALESCE(SUM(pot_amount), 0) FROM games WHERE winner_id = ?', (player_id,)).fetchone()[0]
    
    # 업적 체크
    if total_wins >= 1:
        achievements.append({'id': 'first_win', 'name': '🎉 첫 승리', 'desc': '첫 승리를 거뒀습니다!'})
    if total_wins >= 10:
        achievements.append({'id': 'veteran', 'name': '🎖️ 베테랑', 'desc': '10회 이상 승리'})
    if total_wins >= 50:
        achievements.append({'id': 'master', 'name': '👑 마스터', 'desc': '50회 이상 승리'})
    if total_won >= 100000:
        achievements.append({'id': 'rich', 'name': '💰 부자', 'desc': '총 10만원 이상 획득'})
    if total_won >= 1000000:
        achievements.append({'id': 'millionaire', 'name': '🤑 백만장자', 'desc': '총 100만원 이상 획득'})
    
    # 특정 핸드 업적
    royal = db.execute("SELECT COUNT(*) FROM games WHERE winner_id = ? AND winning_hand = 'Royal Flush'", (player_id,)).fetchone()[0]
    if royal > 0:
        achievements.append({'id': 'royal', 'name': '👑 로열 로더', 'desc': '로열 플러시로 승리'})
    
    straight_flush = db.execute("SELECT COUNT(*) FROM games WHERE winner_id = ? AND winning_hand = 'Straight Flush'", (player_id,)).fetchone()[0]
    if straight_flush > 0:
        achievements.append({'id': 'straight_flush', 'name': '🌈 스트레이트 플러시', 'desc': '스트레이트 플러시로 승리'})
    
    four_kind = db.execute("SELECT COUNT(*) FROM games WHERE winner_id = ? AND winning_hand = 'Four of a Kind'", (player_id,)).fetchone()[0]
    if four_kind >= 3:
        achievements.append({'id': 'four_master', 'name': '4️⃣ 포카드 마스터', 'desc': '포카드로 3회 이상 승리'})
    
    # 폴드 승 업적
    fold_wins = db.execute("SELECT COUNT(*) FROM games WHERE winner_id = ? AND winning_hand = 'Fold Win'", (player_id,)).fetchone()[0]
    if fold_wins >= 5:
        achievements.append({'id': 'bluffer', 'name': '🎭 블러퍼', 'desc': '폴드 승 5회 이상'})
    
    return jsonify({
        'player': dict(player),
        'total_wins': total_wins,
        'total_won': total_won,
        'achievements': achievements
    })

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
