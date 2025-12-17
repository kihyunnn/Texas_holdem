# 🎲 텍사스 홀덤 트래커 (Texas Hold'em Tracker)

**AI 기반 포커 게임 기록 및 분석 시스템**

실시간 게임 기록, AI 코멘터리, 통계 분석, 플레이어 비교, 업적 시스템을 갖춘 종합 홀덤 추적 앱입니다.

---

## ✨ 주요 기능

### 1. 게임 기록 & AI 분석
- ✅ 간편한 게임 결과 입력 (승자, 핸드, 팟)
- ✅ OpenAI GPT-4o-mini 기반 **실시간 AI 코멘터리**
- ✅ 게임 기록 삭제 기능

### 2. 스마트 필터링
- ✅ **날짜 필터**: 오늘 / 전체 / 기간 지정
- ✅ **플레이어 필터**: 특정 플레이어 기록만 조회
- ✅ **핸드 필터**: 특정 족보 기록만 조회

### 3. 다양한 통계 & 시각화
- ✅ **오늘의 세션**: 자정 기준 자동 초기화
- ✅ **실시간 리더보드**: 획득 금액 순위
- ✅ **Pot 추이 그래프** (Chart.js)
- ✅ **승리 핸드 분포 차트**

### 4. 플레이어 분석
- ✅ **개별 통계**: 승률, 총 획득액, 주력 핸드
- ✅ **AI 인사이트**: 플레이 스타일 분석
- ✅ **업적 시스템**: 14종의 뱃지 (첫 승리, 베테랑, 마스터, 로열 로더 등)

### 5. 라이벌 비교
- ✅ 두 플레이어 간 전적 비교
- ✅ AI 기반 대결 구도 해설

### 6. UI/UX
- ✅ **5탭 구조**: 기록 / 통계 / 분석 / 라이벌 / 족보
- ✅ **다크/라이트 모드**
- ✅ **완전 반응형**: PC / 태블릿 / 모바일 최적화

---

## 🛠️ 기술 스택

### Backend
- **Flask** (Python Web Framework)
- **SQLite** (경량 데이터베이스)
- **OpenAI API** (GPT-4o-mini for AI commentary)

### Frontend
- **Vanilla JavaScript** (프레임워크 없음)
- **Chart.js** (데이터 시각화)
- **CSS Variables** (테마 시스템)

---

## 📦 설치 및 실행

### 1. 사전 요구사항
- Python 3.8 이상
- OpenAI API Key ([발급받기](https://platform.openai.com/api-keys))

### 2. 설치
```bash
# 프로젝트 클론
git clone <repository-url>
cd Texas_holdem

# 가상환경 생성 (권장)
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

### 3. 환경 변수 설정
`.env.example`을 복사하여 `.env` 파일 생성:
```bash
cp .env.example .env
```

`.env` 파일에 OpenAI API 키 입력:
```
OPENAI_API_KEY=sk-your-api-key-here
```

### 4. 실행
```bash
python app.py
```

서버가 `http://localhost:5000`에서 실행됩니다.

---

## 📚 사용 방법

### 첫 사용 시
1. **플레이어 추가**: 우측 상단 `+ 플레이어` 버튼으로 참여자 등록
2. **게임 기록**: 하단 FAB 버튼 (`RECORD`)으로 게임 결과 입력
3. **통계 확인**: 각 탭을 통해 다양한 분석 확인

### 탭 가이드
- **📝 기록**: 전체 게임 히스토리 (필터 사용 가능)
- **📊 통계**: 오늘의 현황 및 차트
- **👤 분석**: 플레이어별 상세 통계 및 업적
- **⚔️ 라이벌**: 두 플레이어 비교
- **📜 족보**: 포커 핸드 랭킹 이미지

---

## 🏆 업적 시스템

플레이어는 다음과 같은 업적을 달성할 수 있습니다:

| 업적 | 조건 | 뱃지 |
|------|------|------|
| 첫 승리 | 첫 승리 기록 | 🎉 |
| 베테랑 | 10회 이상 승리 | 🎖️ |
| 마스터 | 50회 이상 승리 | 👑 |
| 부자 | 총 10만원 이상 획득 | 💰 |
| 백만장자 | 총 100만원 이상 획득 | 🤑 |
| 로열 로더 | 로열 플러시 승리 | 👑 |
| 스트레이트 플러시 | 스트레이트 플러시 승리 | 🌈 |
| 포카드 마스터 | 포카드로 3회 이상 승리 | 4️⃣ |
| 블러퍼 | 폴드 승 5회 이상 | 🎭 |

---

## 📖 API 문서

자세한 API 명세는 `docs/API.md`를 참고하세요.

주요 엔드포인트:
- `GET /api/players` - 플레이어 목록
- `POST /api/games` - 게임 기록
- `GET /api/games?scope=today&player_id=1&hand=Royal Flush` - 필터링된 게임 조회
- `GET /api/achievements/{player_id}` - 플레이어 업적
- `GET /api/rivalry?player1=1&player2=2` - 라이벌 비교

---

## 📂 프로젝트 구조

```
Texas_holdem/
├── app.py                    # Flask 백엔드 메인
├── poker.db                  # SQLite 데이터베이스
├── requirements.txt          # Python 패키지
├── .env                      # 환경 변수 (gitignore)
├── .env.example              # 환경 변수 예시
├── static/                   # 프론트엔드 정적 파일
│   ├── index.html            # 메인 페이지
│   ├── app.js                # JavaScript 로직
│   ├── styles.css            # 스타일시트
│   ├── rankings.html         # 족보 팝업 (deprecated)
│   └── images/
│       └── ranking.png       # 족보 이미지
└── docs/                     # 문서
    ├── PROJECT_PLAN.md       # 개발 계획
    ├── API.md                # API 명세
    └── PRD.md                # 제품 요구사항
```

---

## 🔧 개발 가이드

### Git 브랜치 전략
- `main`: 프로덕션 배포용 (안정 버전)
- `develop`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치

### 새 기능 추가 프로세스
```bash
git checkout develop
git checkout -b feature/new-feature
# ... 개발 ...
git add .
git commit -m "feat: Add new feature"
git checkout develop
git merge feature/new-feature
```

---

## 🐛 문제 해결

### 1. AI 분석이 작동하지 않음
- `.env` 파일에 `OPENAI_API_KEY`가 올바르게 설정되었는지 확인
- API 키 잔액 확인

### 2. 데이터베이스 초기화
```bash
# poker.db 삭제 후 재실행
rm poker.db
python app.py
```

### 3. 족보 이미지가 안 보임
- `static/images/ranking.png` 파일이 존재하는지 확인

---

## 📝 라이선스

MIT License

---

## 👥 기여

이슈 제보 및 Pull Request 환영합니다!

---

## 📧 문의

프로젝트 관련 문의사항은 이슈로 남겨주세요.
