# 🃏 텍사스 홀덤 게임 트래커

친구들과 텍사스 홀덤 게임을 할 때 사용하는 간단한 게임 기록 및 통계 웹 애플리케이션입니다.

## ✨ 주요 기능

- **게임 기록**: 매 판마다 참여자, 베팅 금액, 승자, 팟 금액 기록
- **통계 확인**: 플레이어별 승률, 수익/손실, 리더보드 조회
- **족보 참고**: 텍사스 홀덤 핸드 랭킹 테이블 제공

## 🛠 기술 스택

- **Backend**: Flask (Python)
- **Database**: SQLite
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Deploy**: Docker, Docker Compose

## 🚀 빠른 시작

### Docker로 실행 (권장)

```bash
docker-compose up -d
```

브라우저에서 `http://localhost:5000` 접속

### 로컬 개발

```bash
# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# 의존성 설치
pip install -r requirements.txt

# 실행
python app.py
```

## 📁 프로젝트 구조

```
texas-holdem-tracker/
├── app.py              # Flask 메인 애플리케이션
├── requirements.txt    # Python 의존성
├── Dockerfile          # Docker 이미지 설정
├── docker-compose.yml  # Docker Compose 설정
├── static/             # 프론트엔드 파일
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── docs/               # 문서
    ├── PRD.md
    ├── PROJECT_PLAN.md
    ├── DEVELOPMENT.md
    └── API.md
```

## 📖 문서

- [제품 요구사항 (PRD)](docs/PRD.md)
- [프로젝트 계획서](docs/PROJECT_PLAN.md)
- [개발 문서](docs/DEVELOPMENT.md)
- [API 명세서](docs/API.md)

## 📝 라이선스

MIT License
