# 텍사스 홀덤 게임 트래커 - 개발 문서

## 1. 시스템 아키텍처

```
┌─────────────────────────────────┐
│      클라이언트 (브라우저)        │
│  index.html + styles.css + app.js │
└───────────────┬─────────────────┘
                │ HTTP/REST API
                ▼
┌─────────────────────────────────┐
│       Flask 애플리케이션         │
│           (app.py)              │
└───────────────┬─────────────────┘
                │ SQL
                ▼
┌─────────────────────────────────┐
│     SQLite (data/poker.db)      │
└─────────────────────────────────┘
```

## 2. 데이터베이스 스키마

### Players 테이블
```sql
CREATE TABLE players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Games 테이블
```sql
CREATE TABLE games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_id INTEGER NOT NULL,
    pot_amount INTEGER NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (winner_id) REFERENCES players (id)
);
```

### Game_Participants 테이블
```sql
CREATE TABLE game_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    bet_amount INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games (id),
    FOREIGN KEY (player_id) REFERENCES players (id)
);
```

## 3. 프론트엔드 구조

### 탭 구성
1. **게임 기록**: 게임 결과 입력 폼
2. **통계**: 리더보드 및 최근 게임 기록
3. **족보**: 텍사스 홀덤 핸드 랭킹

### 주요 JavaScript 함수
```javascript
fetchPlayers()      // 플레이어 목록 조회
addPlayer(name)     // 플레이어 추가
recordGame(data)    // 게임 기록
fetchLeaderboard()  // 리더보드 조회
fetchGames()        // 게임 기록 조회
```

## 4. 개발 환경 설정

### 로컬 개발
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Docker 개발
```bash
docker-compose up --build
```

## 5. 코딩 컨벤션

### Python (PEP 8)
- 함수/변수: `snake_case`
- 상수: `UPPER_CASE`

### JavaScript
- 함수/변수: `camelCase`
- 상수: `UPPER_CASE`

### CSS (BEM)
- Block: `.leaderboard`
- Element: `.leaderboard__row`
- Modifier: `.leaderboard__row--winner`

## 6. 테스트

### API 테스트 (curl)
```bash
# 플레이어 추가
curl -X POST http://localhost:5000/api/players \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트"}'

# 게임 기록
curl -X POST http://localhost:5000/api/games \
  -H "Content-Type: application/json" \
  -d '{"winner_id":1,"pot_amount":10000,"participants":[{"player_id":1,"bet_amount":5000}]}'
```

## 7. 트러블슈팅

| 문제 | 해결 |
|------|------|
| Flask 시작 안됨 | `pip install -r requirements.txt` 재실행 |
| CORS 에러 | Flask-CORS 설치 확인 |
| DB 초기화 실패 | `data/poker.db` 삭제 후 재시작 |
