# 텍사스 홀덤 게임 트래커 - 프로젝트 계획서

## 1. 프로젝트 정보

### 1.1 기본 정보
- **프로젝트명**: Texas Hold'em Game Tracker
- **프로젝트 코드명**: texas-holdem-tracker
- **버전**: v2.0.0
- **시작일**: 2025-12-17
- **완료일**: 2025-12-17
- **현재 상태**: ✅ 개발 완료

### 1.2 프로젝트 목표
친구들과 텍사스 홀덤 게임 시 사용할 수 있는 AI 기반 게임 기록 및 통계 웹 애플리케이션을 개발하여 홈서버에 배포한다.

---

## 2. 구현 완료된 기능

### ✅ Phase 1: 기본 기능 (100%)
- [x] Flask 백엔드 API
- [x] SQLite 데이터베이스
- [x] 플레이어 관리 (추가/조회)
- [x] 게임 기록 (POST /api/games)
- [x] 통계 조회 (리더보드, 플레이어 통계)

### ✅ Phase 2: AI 통합 (100%)
- [x] OpenAI API 연동 (GPT-4o-mini)
- [x] 게임별 AI 코멘터리 생성
- [x] 승리 핸드(족보) 기록

### ✅ Phase 3: 시각화 & UX (100%)
- [x] Chart.js 통합 (Pot 추이, 핸드 분포)
- [x] 오늘의 세션 (자정 기준 초기화)
- [x] 간소화된 게임 입력 (승자, 핸드, 팟만)
- [x] 다크/라이트 모드
- [x] 완전 반응형 디자인

### ✅ Phase 4: 고급 기능 (100%)
- [x] **게임 히스토리 필터**
  - 날짜 필터 (오늘/전체/기간 선택)
  - 플레이어 필터
  - 핸드 필터
- [x] **업적 시스템**
  - 14종의 업적 (첫 승리, 베테랑, 마스터, 로열 로더 등)
  - 뱃지 UI
- [x] **라이벌 비교**
  - 두 플레이어 통계 비교
  - AI 대결 구도 분석
- [x] **AI 인사이트 강화**
  - 플레이어별 스타일 분석
  - 주력 핸드 분석

### ✅ Phase 5: UI 리팩토링 (100%)
- [x] 5탭 구조 (기록/통계/분석/라이벌/족보)
- [x] 필터 UI 구현
- [x] 업적 뱃지 디자인
- [x] 라이벌 비교 UI
- [x] 전체 스타일 통일

### ✅ Phase 6: Docker & 배포 (100%)
- [x] Dockerfile 작성
- [x] docker-compose.yml 작성
- [x] 배포 가이드 문서화

---

## 3. API 엔드포인트

### Players
- `GET /api/players` - 플레이어 목록
- `POST /api/players` - 플레이어 추가
- `GET /api/players/{id}/stats` - 플레이어 통계
- `GET /api/players/{id}/insight` - AI 인사이트
- `GET /api/achievements/{id}` - 플레이어 업적

### Games
- `POST /api/games` - 게임 기록 (AI 분석 포함)
- `GET /api/games` - 게임 목록 (필터 지원)
- `DELETE /api/games/{id}` - 게임 삭제

### Stats
- `GET /api/stats/session` - 오늘의 세션 통계
- `GET /api/stats/trend` - Pot 추이
- `GET /api/stats/hand` - 핸드별 통계

### Advanced
- `GET /api/rivalry?player1={id1}&player2={id2}` - 라이벌 비교

---

## 4. 기술 스택

### Backend
- **Flask** 3.1.0
- **SQLite** (파일 기반 DB)
- **OpenAI API** (GPT-4o-mini)
- **python-dotenv** (환경변수 관리)
- **Flask-CORS** (CORS 처리)

### Frontend
- **Vanilla JavaScript** (프레임워크 없음)
- **Chart.js** 4.4.1 (시각화)
- **CSS Variables** (테마 시스템)
- **Google Fonts** (Outfit)

---

## 5. 디렉토리 구조

```
Texas_holdem/
├── app.py                    # Flask 백엔드 (550+ lines)
├── data/                     # SQLite DB 디렉토리
│   └── poker.db              # SQLite DB (자동 생성)
├── requirements.txt          # Python 패키지
├── .env                      # 환경 변수 (gitignore)
├── .env.example              # 환경 변수 템플릿
├── .gitignore                # Git 제외 파일
├── README.md                 # 프로젝트 소개
├── static/                   # 프론트엔드
│   ├── index.html            # 메인 페이지 (280+ lines)
│   ├── app.js                # JavaScript (470+ lines)
│   ├── styles.css            # CSS (580+ lines)
│   ├── rankings.html         # 족보 팝업 (deprecated)
│   └── images/
│       └── ranking.png       # 족보 이미지
└── docs/                     # 문서
    ├── PRD.md                # 제품 요구사항 명세
    ├── PROJECT_PLAN.md       # 프로젝트 계획서 (이 문서)
    ├── API.md                # API 명세서
    └── DEVELOPMENT.md        # 개발 가이드
```

---

## 6. Git 브랜치 전략

### 브랜치 구조
```
main (배포)
└── develop (통합)
    ├── feature/setup-project ✅
    ├── feature/backend-api ✅
    ├── feature/frontend-ui ✅
    ├── feature/advanced-stats-ai ✅
    ├── feature/stats-visualization ✅
    ├── feature/delete-game ✅
    ├── feature/stats-tabs ✅
    ├── feature/ui-refactor ✅
    ├── feature/responsive-theme ✅
    ├── feature/rankings-tab ✅
    ├── feature/advanced-features ✅
    ├── feature/documentation-update (진행 중)
    └── feature/docker-config (대기 중)
```

### 커밋 히스토리 요약
- **총 커밋 수**: 20+
- **주요 마일스톤**:
  - M1: 프로젝트 설정 ✅
  - M2: 기본 CRUD API ✅
  - M3: 프론트엔드 UI ✅
  - M4: AI 통합 ✅
  - M5: 고급 기능 ✅
  - M6: 문서화 ✅ (진행 중)
  - M7: Docker 배포 ✅

---

## 7. 데이터베이스 스키마

### players
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 플레이어 ID |
| name | TEXT UNIQUE | 플레이어 이름 |
| created_at | TIMESTAMP | 생성 시각 |

### games
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 게임 ID |
| winner_id | INTEGER FK | 승자 플레이어 ID |
| pot_amount | INTEGER | 팟 금액 |
| winning_hand | TEXT | 승리 핸드 (족보) |
| ai_analysis | TEXT | AI 코멘트 |
| played_at | TIMESTAMP | 게임 시각 |
| notes | TEXT | 메모 |

### game_participants (현재 미사용)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK | 참가 ID |
| game_id | INTEGER FK | 게임 ID |
| player_id | INTEGER FK | 플레이어 ID |
| bet_amount | INTEGER | 베팅 금액 |

---

## 8. 주요 개선 사항

### v1.0 → v2.0 주요 변경점
1. **AI 통합**: GPT-4o-mini로 게임별 코멘터리 생성
2. **고급 필터링**: 날짜/플레이어/핸드 기준으로 게임 조회
3. **업적 시스템**: 14종의 뱃지로 게이미피케이션
4. **라이벌 비교**: 두 플레이어 전적 대결 구도 분석
5. **테마 시스템**: 다크/라이트 모드 전환
6. **완전 반응형**: 모바일/태블릿/데스크톱 최적화

---

## 9. 다음 단계

### Phase 6 (완료)
- [x] Dockerfile & docker-compose.yml 작성
- [x] 배포 가이드 문서화
- [x] 프로덕션 환경 테스트

### 향후 개선 사항 (v2.1)
- [ ] 세션 정산 기능 (누가 누구에게 얼마 보낼지 자동 계산)
- [ ] 데이터 백업/복원 (JSON/CSV 내보내기)
- [ ] 멀티 세션 지원 (하루에 여러 세션 기록)
- [ ] 토너먼트 모드
- [ ] 푸시 알림 시스템

---

## 10. 참고 자료

- [Flask 공식 문서](https://flask.palletsprojects.com/)
- [OpenAI API](https://platform.openai.com/docs)
- [Chart.js](https://www.chartjs.org/)
- [SQLite](https://www.sqlite.org/docs.html)
- [텍사스 홀덤 규칙](https://www.pokernews.com/poker-rules/texas-holdem.htm)

---

**마지막 업데이트**: 2025-12-17  
**상태**: 개발 완료, Docker 배포 대기 중
