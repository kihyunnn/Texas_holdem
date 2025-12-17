# 텍사스 홀덤 게임 트래커 - API 명세서

## 개요

- **Base URL**: `http://localhost:5000/api`
- **응답 형식**: JSON
- **인코딩**: UTF-8

---

## 플레이어 API

### 플레이어 목록 조회

```
GET /api/players
```

**응답 예시:**
```json
[
  {"id": 1, "name": "홍길동", "created_at": "2025-12-17 10:00:00"},
  {"id": 2, "name": "김철수", "created_at": "2025-12-17 10:05:00"}
]
```

---

### 플레이어 추가

```
POST /api/players
Content-Type: application/json
```

**요청:**
```json
{"name": "이영희"}
```

**성공 응답 (201):**
```json
{"id": 3, "name": "이영희"}
```

**에러 응답 (400):**
```json
{"error": "이미 존재하는 플레이어입니다"}
```

---

### 플레이어 통계 조회

```
GET /api/players/{player_id}/stats
```

**응답:**
```json
{
  "player": {"id": 1, "name": "홍길동", "created_at": "..."},
  "total_games": 15,
  "total_wins": 5,
  "total_bet": 150000,
  "total_won": 200000,
  "profit": 50000,
  "win_rate": 33.33
}
```

---

## 게임 API

### 게임 기록

```
POST /api/games
Content-Type: application/json
```

**요청:**
```json
{
  "winner_id": 1,
  "pot_amount": 30000,
  "participants": [
    {"player_id": 1, "bet_amount": 10000},
    {"player_id": 2, "bet_amount": 10000},
    {"player_id": 3, "bet_amount": 10000}
  ],
  "notes": "좋은 게임"
}
```

**응답 (201):**
```json
{"id": 42, "message": "게임이 기록되었습니다"}
```

---

### 게임 기록 조회

```
GET /api/games?limit=20
```

**응답:**
```json
[
  {
    "id": 42,
    "winner_id": 1,
    "winner_name": "홍길동",
    "pot_amount": 30000,
    "played_at": "2025-12-17 15:30:00",
    "notes": "좋은 게임",
    "participants": [
      {"player_id": 1, "player_name": "홍길동", "bet_amount": 10000}
    ]
  }
]
```

---

## 통계 API

### 리더보드 조회

```
GET /api/leaderboard
```

**응답:**
```json
[
  {
    "id": 1,
    "name": "홍길동",
    "total_games": 15,
    "total_wins": 8,
    "profit": 120000,
    "win_rate": 53.33
  }
]
```

---

## 에러 코드

| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 (필수 필드 누락, 중복 등) |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |
