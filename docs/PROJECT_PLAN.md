# 텍사스 홀덤 게임 트래커 - 프로젝트 계획서

## 1. 프로젝트 정보

### 1.1 기본 정보
- **프로젝트명**: Texas Hold'em Game Tracker
- **프로젝트 코드명**: texas-holdem-tracker
- **버전**: v1.0.0
- **시작일**: 2025-12-17
- **목표 완료일**: 2025-12-19
- **프로젝트 관리자**: [귀하의 이름]

### 1.2 프로젝트 목표
친구들과 텍사스 홀덤 게임을 할 때 사용할 수 있는 가볍고 사용하기 쉬운 게임 기록 및 통계 웹 애플리케이션을 2일 내에 개발하여 홈서버에 배포한다.

## 2. Git 전략 및 계획

### 2.1 Git 브랜치 전략

#### 브랜치 구조
```
main (배포 브랜치)
├── develop (개발 브랜치)
│   ├── feature/setup-project (프로젝트 초기 설정)
│   ├── feature/backend-api (백엔드 API 개발)
│   ├── feature/frontend-ui (프론트엔드 UI 개발)
│   ├── feature/docker-config (Docker 설정)
│   └── feature/documentation (문서화)
```

#### 브랜치 설명
- **main**: 프로덕션 배포 브랜치 (안정 버전만)
- **develop**: 개발 통합 브랜치
- **feature/**: 각 기능별 개발 브랜치

### 2.2 Git 커밋 컨벤션

#### 커밋 메시지 형식
```
<타입>: <제목>

<본문> (선택사항)

<푸터> (선택사항)
```

#### 커밋 타입
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `chore`: 빌드 업무 수정, 패키지 매니저 수정 등

#### 커밋 메시지 예시
```
feat: 플레이어 추가 API 엔드포인트 구현

- POST /api/players 엔드포인트 추가
- SQLite 테이블에 플레이어 정보 저장
- 중복 이름 검증 로직 추가

Closes #1
```

### 2.3 Git 작업 흐름 (Workflow)

#### 초기 설정
```bash
# 1. 저장소 초기화
git init
git add .
git commit -m "chore: 프로젝트 초기 설정"

# 2. 원격 저장소 연결 (필요시)
git remote add origin <저장소_URL>
git push -u origin main

# 3. develop 브랜치 생성
git checkout -b develop
git push -u origin develop
```

#### 기능 개발 흐름
```bash
# 1. develop에서 feature 브랜치 생성
git checkout develop
git pull origin develop
git checkout -b feature/backend-api

# 2. 작업 및 커밋
git add .
git commit -m "feat: 플레이어 CRUD API 구현"

# 3. 원격 저장소에 푸시
git push origin feature/backend-api

# 4. develop으로 머지
git checkout develop
git merge feature/backend-api
git push origin develop

# 5. 브랜치 삭제 (선택)
git branch -d feature/backend-api
```

#### 릴리즈 흐름
```bash
# develop -> main 머지
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin main --tags
```

### 2.4 커밋 계획

#### Phase 1: 프로젝트 설정 (Day 1 - 1시간)
```
[feature/setup-project]
1. chore: 프로젝트 디렉토리 구조 생성
2. docs: PRD 문서 작성
3. docs: 프로젝트 계획서 작성
4. docs: 개발 문서 작성
5. chore: requirements.txt 추가
6. chore: .gitignore 추가
7. docs: README.md 작성
```

#### Phase 2: 백엔드 개발 (Day 1 - 3시간)
```
[feature/backend-api]
1. feat: Flask 앱 초기 설정
2. feat: SQLite 데이터베이스 스키마 정의
3. feat: 플레이어 CRUD API 구현
   - GET /api/players
   - POST /api/players
   - GET /api/players/<id>/stats
4. feat: 게임 기록 API 구현
   - POST /api/games
   - GET /api/games
5. feat: 통계 API 구현
   - GET /api/leaderboard
6. test: API 엔드포인트 테스트
7. fix: 버그 수정 (발견 시)
```

#### Phase 3: 프론트엔드 개발 (Day 1-2 - 4시간)
```
[feature/frontend-ui]
1. feat: HTML 기본 구조 생성
2. style: CSS 스타일 시스템 구축
3. feat: 플레이어 관리 UI 구현
4. feat: 게임 기록 폼 UI 구현
5. feat: 통계/리더보드 UI 구현
6. feat: 족보 테이블 UI 구현
7. feat: JavaScript API 연동
8. style: 반응형 디자인 적용
9. fix: UI 버그 수정
```

#### Phase 4: Docker 설정 (Day 2 - 1시간)
```
[feature/docker-config]
1. chore: Dockerfile 작성
2. chore: docker-compose.yml 작성
3. chore: .dockerignore 추가
4. test: Docker 빌드 테스트
5. docs: Docker 배포 가이드 추가
```

#### Phase 5: 문서화 및 마무리 (Day 2 - 1시간)
```
[feature/documentation]
1. docs: API 문서 작성
2. docs: 사용자 가이드 작성
3. docs: 배포 가이드 보완
4. chore: 코드 정리 및 주석 추가
```

### 2.5 .gitignore 설정
```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
.venv

# SQLite
*.db
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Docker
.dockerignore

# Logs
*.log
logs/

# Environment
.env
.env.local
```

## 3. 개발 일정

### 3.1 타임라인

#### Day 1 (2025-12-17)
| 시간 | 작업 | 담당 브랜치 | 예상 소요 |
|------|------|-------------|-----------|
| 09:00-10:00 | 프로젝트 설정 및 문서 작성 | feature/setup-project | 1시간 |
| 10:00-13:00 | 백엔드 API 개발 | feature/backend-api | 3시간 |
| 14:00-16:00 | 프론트엔드 UI 개발 (1부) | feature/frontend-ui | 2시간 |
| 16:00-18:00 | 프론트엔드 UI 개발 (2부) | feature/frontend-ui | 2시간 |

#### Day 2 (2025-12-18)
| 시간 | 작업 | 담당 브랜치 | 예상 소요 |
|------|------|-------------|-----------|
| 09:00-10:00 | Docker 설정 | feature/docker-config | 1시간 |
| 10:00-11:00 | 통합 테스트 | develop | 1시간 |
| 11:00-12:00 | 문서화 및 코드 정리 | feature/documentation | 1시간 |
| 14:00-15:00 | 홈서버 배포 및 테스트 | main | 1시간 |

### 3.2 마일스톤

| # | 마일스톤 | 완료 기준 | 목표일 |
|---|----------|-----------|--------|
| M1 | 프로젝트 설정 완료 | 모든 문서 작성, Git 저장소 설정 | 2025-12-17 10:00 |
| M2 | 백엔드 개발 완료 | 모든 API 엔드포인트 동작 확인 | 2025-12-17 13:00 |
| M3 | 프론트엔드 개발 완료 | UI 모든 기능 동작, API 연동 완료 | 2025-12-17 18:00 |
| M4 | Docker 설정 완료 | Docker로 빌드 및 실행 성공 | 2025-12-18 10:00 |
| M5 | 프로젝트 완료 | 홈서버 배포 및 실사용 가능 | 2025-12-18 15:00 |

## 4. 디렉토리 구조

```
texas-holdem-tracker/
├── .git/                      # Git 저장소
├── .gitignore                 # Git 제외 파일
├── README.md                  # 프로젝트 소개
├── requirements.txt           # Python 의존성
├── app.py                     # Flask 애플리케이션
├── Dockerfile                 # Docker 이미지 설정
├── docker-compose.yml         # Docker Compose 설정
├── .dockerignore              # Docker 제외 파일
├── poker.db                   # SQLite 데이터베이스 (실행 시 생성)
├── docs/                      # 문서
│   ├── PRD.md                 # 제품 요구사항 명세서
│   ├── PROJECT_PLAN.md        # 프로젝트 계획서
│   ├── DEVELOPMENT.md         # 개발 문서
│   └── API.md                 # API 명세서
└── static/                    # 프론트엔드 파일
    ├── index.html             # 메인 페이지
    ├── styles.css             # 스타일시트
    └── app.js                 # JavaScript
```

## 5. 리스크 관리

### 5.1 기술적 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|-----------|
| SQLite 성능 이슈 | 낮음 | 중간 | 인덱스 추가, 쿼리 최적화 |
| Docker 배포 실패 | 낮음 | 높음 | 로컬 테스트 철저히, 문서화 명확히 |
| CORS 이슈 | 중간 | 낮음 | Flask-CORS 사용 |
| 모바일 UI 깨짐 | 중간 | 중간 | 반응형 CSS 테스트 강화 |

### 5.2 일정 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|-----------|
| 개발 지연 | 중간 | 중간 | MVP 기능만 우선 구현 |
| 버그 수정 시간 초과 | 중간 | 낮음 | 단위 테스트로 사전 방지 |

## 6. 품질 관리

### 6.1 코드 품질
- PEP 8 스타일 가이드 준수 (Python)
- 명확한 변수명 사용
- 함수/클래스 Docstring 작성
- 코드 리뷰 (가능 시)

### 6.2 테스트 계획
- **단위 테스트**: API 엔드포인트별 테스트
- **통합 테스트**: 프론트엔드-백엔드 연동 테스트
- **배포 테스트**: Docker 환경에서 전체 기능 테스트
- **사용자 테스트**: 실제 게임 상황 시뮬레이션

### 6.3 테스트 체크리스트
- [ ] 플레이어 추가/조회 정상 동작
- [ ] 게임 기록 저장 정상 동작
- [ ] 통계 계산 정확성 검증
- [ ] 중복 플레이어 방지 동작
- [ ] 모바일 화면에서 UI 정상 표시
- [ ] Docker로 빌드 및 실행 성공
- [ ] 데이터베이스 파일 영속성 확인

## 7. 배포 계획

### 7.1 배포 환경
- **서버**: 홈서버 (Linux)
- **컨테이너**: Docker + Docker Compose
- **포트**: 5000 (외부 접근 가능하도록 설정)
- **데이터베이스**: SQLite (볼륨 마운트로 영속성 보장)

### 7.2 배포 절차
```bash
# 1. 코드 클론
git clone <저장소_URL>
cd texas-holdem-tracker

# 2. Docker Compose 실행
docker-compose up -d

# 3. 접속 확인
# 브라우저에서 http://<서버IP>:5000 접속

# 4. 로그 확인
docker-compose logs -f
```

### 7.3 백업 계획
- 데이터베이스 파일(`poker.db`) 정기 백업
- Git 저장소에 코드 백업
- Docker 이미지 버전 태깅

## 8. 성공 기준

### 8.1 기능적 성공 기준
- [x] 모든 필수 기능 구현
- [ ] 버그 없이 안정적 동작
- [ ] 10개 이상의 게임 기록 테스트 성공

### 8.2 비기능적 성공 기준
- [ ] 페이지 로딩 2초 이내
- [ ] API 응답 500ms 이내
- [ ] 모바일/데스크톱 모두 정상 표시

### 8.3 배포 성공 기준
- [ ] Docker로 빌드 성공
- [ ] 홈서버에 배포 성공
- [ ] 외부에서 접속 가능
- [ ] 컨테이너 재시작 후 데이터 유지

## 9. 향후 계획 (Post-Launch)

### v1.1.0 (선택적 개선)
- [ ] 게임 기록 수정/삭제 기능
- [ ] 데이터 내보내기/가져오기
- [ ] 플레이어 프로필 이미지

### v2.0.0 (주요 업데이트)
- [ ] 게임 히스토리 그래프
- [ ] 토너먼트 모드
- [ ] 고급 통계 (평균 베팅, 최대 승리 등)

## 10. 연락처 및 리소스

### 10.1 프로젝트 리소스
- **Git 저장소**: [저장소 URL]
- **문서**: `docs/` 디렉토리
- **이슈 트래킹**: GitHub Issues

### 10.2 참고 자료
- Flask 문서: https://flask.palletsprojects.com/
- SQLite 문서: https://www.sqlite.org/docs.html
- Docker 문서: https://docs.docker.com/
- 텍사스 홀덤 규칙: https://www.pokernews.com/poker-rules/texas-holdem.htm
