from flask import Flask, g
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

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
