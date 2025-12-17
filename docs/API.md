# API 명세서

텍사스 홀덤 트래커 REST API 문서

Base URL: `http://localhost:5000/api`

---

## 📋 목차
1. [Players API](#players-api)
2. [Games API](#games-api)
3. [Stats API](#stats-api)
4. [Advanced Features](#advanced-features)

---

## 👥 Players API

### 1. 플레이어 목록 조회
```
GET /api/players
```

**응답 예시:**
```json
[
  {
    "id": 1,
    "name": "철수",
    "created_at": "2024-01-01 10:00:00"
  },
  {
    "id": 2,
    "name": "영희",
    "created_at": "2024-01-01 10:05:00"
  }
]
```

### 2. 플레이어 추가
```
POST /api/players
```

**요청 본문:**
```json
{
  "name": "민수"
}
```

**응답:**
```json
{
  "id": 3,
  "name": "민수"
}
```

**에러:**
- `400`: 이름 누락 또는 중복

### 3. 플레이어 통계 조회
```
GET /api/players/{player_id}/stats
```

**응답 예시:**
```json
{
  "player": {
    "id": 1,
    "name": "철수",
    "created_at": "2024-01-01 10:00:00"
  },
  "total_games": 10,
  "total_wins": 10,
  "total_won": 50000,
  "top_hand": "Full House",
  "top_hand_count": 3
}
```

### 4. 플레이어 AI 인사이트
```
GET /api/players/{player_id}/insight
```

**응답 예시:**
```json
{
  "player": { ... },
  "stats": { ... },
  "ai_insight": "철수님은 풀하우스에 특화된 안정적인 플레이어입니다."
}
```

---

## 🎮 Games API

### 1. 게임 기록
```
POST /api/games
```

**요청 본문:**
```json
{
  "winner_id": 1,
  "pot_amount": 5000,
  "winning_hand": "Full House",
  "notes": "리버에서 역전"
}
```

**응답:**
```json
{
  "id": 15,
  "message": "게임이 기록되었습니다",
  "ai_analysis": "철수님의 풀하우스는 완벽한 타이밍이었습니다! 리버 역전의 로망을 실현하셨네요."
}
```

### 2. 게임 목록 조회 (필터 지원)
```
GET /api/games?limit={limit}&scope={scope}&player_id={player_id}&hand={hand}&date_from={from}&date_to={to}
```

**쿼리 파라미터:**
- `limit` (optional, default=20): 조회 개수
- `scope` (optional, default=today): `today` | `all` | `custom`
- `player_id` (optional): 특정 플레이어 필터
- `hand` (optional): 특정 핸드 필터 (예: "Royal Flush")
- `date_from` (optional): 시작 날짜 (scope=custom 시)
- `date_to` (optional): 종료 날짜 (scope=custom 시)

**예시:**
```
GET /api/games?scope=today&player_id=1&hand=Royal%20Flush
```

**응답:**
```json
[
  {
    "id": 15,
    "winner_id": 1,
    "winner_name": "철수",
    "pot_amount": 5000,
    "winning_hand": "Royal Flush",
    "ai_analysis": "...",
    "played_at": "2024-01-01 14:30:00",
    "notes": "리버에서 역전"
  }
]
```

### 3. 게임 삭제
```
DELETE /api/games/{game_id}
```

**응답:**
```json
{
  "message": "게임이 삭제되었습니다"
}
```

**에러:**
- `404`: 게임을 찾을 수 없음

---

## 📊 Stats API

### 1. 오늘의 세션 통계
```
GET /api/stats/session
```

**응답 예시:**
```json
[
  {
    "name": "철수",
    "wins": 5,
    "total_won": 25000
  },
  {
    "name": "영희",
    "wins": 3,
    "total_won": 15000
  }
]
```

### 2. Pot 추이 (오늘)
```
GET /api/stats/trend
```

**응답 예시:**
```json
[
  {
    "id": 1,
    "winner_name": "철수",
    "pot_amount": 3000
  },
  {
    "id": 2,
    "winner_name": "영희",
    "pot_amount": 5000
  }
]
```

### 3. 핸드별 통계
```
GET /api/stats/hand?scope={scope}
```

**쿼리 파라미터:**
- `scope` (optional, default=today): `today` | `all`

**응답 예시:**
```json
[
  {
    "winning_hand": "Full House",
    "count": 5
  },
  {
    "winning_hand": "Flush",
    "count": 3
  }
]
```

---

## 🏆 Advanced Features

### 1. 업적 조회
```
GET /api/achievements/{player_id}
```

**응답 예시:**
```json
{
  "player": { ... },
  "total_wins": 15,
  "total_won": 75000,
  "achievements": [
    {
      "id": "first_win",
      "name": "🎉 첫 승리",
      "desc": "첫 승리를 거뒀습니다!"
    },
    {
      "id": "veteran",
      "name": "🎖️ 베테랑",
      "desc": "10회 이상 승리"
    },
    {
      "id": "royal",
      "name": "👑 로열 로더",
      "desc": "로열 플러시로 승리"
    }
  ]
}
```

### 2. 라이벌 비교
```
GET /api/rivalry?player1={id1}&player2={id2}
```

**응답 예시:**
```json
{
  "player1": {
    "name": "철수",
    "total_wins": 15,
    "total_won": 75000
  },
  "player2": {
    "name": "영희",
    "total_wins": 12,
    "total_won": 60000
  },
  "ai_analysis": "철수와 영희의 대결은 박빙! 철수가 근소하게 앞서지만 영희의 추격이 무섭네요."
}
```

---

## 📝 에러 코드

| 코드 | 설명 |
|------|------|
| 200 | 성공 |
| 201 | 생성 성공 |
| 400 | 잘못된 요청 (필수 필드 누락, 유효성 검증 실패) |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |

---

## 🔐 인증

현재 버전에서는 인증이 구현되어 있지 않습니다.
프로덕션 배포 시에는 적절한 인증 시스템을 추가해야 합니다.

---

## 📌 참고사항

- 모든 날짜/시간은 서버 로컬 타임존을 따릅니다.
- AI 분석은 OpenAI API 키가 설정된 경우에만 작동합니다.
- 데이터베이스는 SQLite를 사용하며, 동시 쓰기 성능에 제한이 있을 수 있습니다.
