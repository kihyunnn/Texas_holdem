from flask import Flask, g, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
from contextlib import contextmanager

app = Flask(__name__, static_folder='static')
CORS(app)

DATABASE = 'poker.db'

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
    """데이터베이스 초기화 및 테이블 생성"""
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
        
        # Games table
        db.execute('''
            CREATE TABLE IF NOT EXISTS games (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                winner_id INTEGER NOT NULL,
                pot_amount INTEGER NOT NULL,
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
        db.commit()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

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
    # Player info
    player = db.execute('SELECT * FROM players WHERE id = ?', (player_id,)).fetchone()
    if not player:
        return jsonify({'error': '플레이어를 찾을 수 없습니다'}), 404
    
    # Total games
    total_games = db.execute('''
        SELECT COUNT(DISTINCT game_id) 
        FROM game_participants 
        WHERE player_id = ?
    ''', (player_id,)).fetchone()[0]
    
    # Total wins
    total_wins = db.execute('''
        SELECT COUNT(*) 
        FROM games 
        WHERE winner_id = ?
    ''', (player_id,)).fetchone()[0]
    
    # Total bet
    total_bet = db.execute('''
        SELECT COALESCE(SUM(bet_amount), 0) 
        FROM game_participants 
        WHERE player_id = ?
    ''', (player_id,)).fetchone()[0]
    
    # Total won
    total_won = db.execute('''
        SELECT COALESCE(SUM(pot_amount), 0) 
        FROM games 
        WHERE winner_id = ?
    ''', (player_id,)).fetchone()[0]
    
    # Calculate stats
    profit = total_won - total_bet
    win_rate = (total_wins / total_games * 100) if total_games > 0 else 0
    
    return jsonify({
        'player': dict(player),
        'total_games': total_games,
        'total_wins': total_wins,
        'total_bet': total_bet,
        'total_won': total_won,
        'profit': profit,
        'win_rate': round(win_rate, 2)
    })

@app.route('/api/games', methods=['POST'])
def record_game():
    data = request.json
    winner_id = data.get('winner_id')
    pot_amount = data.get('pot_amount')
    participants = data.get('participants', [])  # [{player_id, bet_amount}, ...]
    notes = data.get('notes', '')
    
    if not winner_id or pot_amount is None or not participants:
        return jsonify({'error': '필수 정보가 누락되었습니다'}), 400
    
    try:
        db = get_db()
        # Game record
        cursor = db.execute('''
            INSERT INTO games (winner_id, pot_amount, notes) 
            VALUES (?, ?, ?)
        ''', (winner_id, pot_amount, notes))
        game_id = cursor.lastrowid
        
        # Participants record
        for participant in participants:
            db.execute('''
                INSERT INTO game_participants (game_id, player_id, bet_amount) 
                VALUES (?, ?, ?)
            ''', (game_id, participant['player_id'], participant['bet_amount']))
        
        db.commit()
        return jsonify({'id': game_id, 'message': '게임이 기록되었습니다'}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/games', methods=['GET'])
def get_games():
    limit = request.args.get('limit', 20, type=int)
    
    db = get_db()
    games = db.execute('''
        SELECT g.*, p.name as winner_name
        FROM games g
        JOIN players p ON g.winner_id = p.id
        ORDER BY g.played_at DESC
        LIMIT ?
    ''', (limit,)).fetchall()
    
    result = []
    for game in games:
        game_dict = dict(game)
        # Participants
        participants = db.execute('''
            SELECT gp.*, p.name as player_name
            FROM game_participants gp
            JOIN players p ON gp.player_id = p.id
            WHERE gp.game_id = ?
        ''', (game['id'],)).fetchall()
        game_dict['participants'] = [dict(p) for p in participants]
        result.append(game_dict)
    
    return jsonify(result)

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    db = get_db()
    players = db.execute('SELECT * FROM players').fetchall()
    
    leaderboard = []
    for player in players:
        player_id = player['id']
        
        # Stats query (optimized via aggregation could be better but keeping simple for now)
        total_games = db.execute('SELECT COUNT(DISTINCT game_id) FROM game_participants WHERE player_id = ?', (player_id,)).fetchone()[0]
        
        if total_games == 0:
            continue
        
        total_wins = db.execute('SELECT COUNT(*) FROM games WHERE winner_id = ?', (player_id,)).fetchone()[0]
        total_bet = db.execute('SELECT COALESCE(SUM(bet_amount), 0) FROM game_participants WHERE player_id = ?', (player_id,)).fetchone()[0]
        total_won = db.execute('SELECT COALESCE(SUM(pot_amount), 0) FROM games WHERE winner_id = ?', (player_id,)).fetchone()[0]
        
        profit = total_won - total_bet
        win_rate = (total_wins / total_games * 100) if total_games > 0 else 0
        
        leaderboard.append({
            'id': player_id,
            'name': player['name'],
            'total_games': total_games,
            'total_wins': total_wins,
            'profit': profit,
            'win_rate': round(win_rate, 2)
        })
    
    # Sort by profit descending
    leaderboard.sort(key=lambda x: x['profit'], reverse=True)
    
    return jsonify(leaderboard)

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
