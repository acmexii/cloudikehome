---
name: feature-to-sales-kit
description: 공개 GitHub 저장소(기본 acmexii/cloudikehome)에 개발팀이 커밋한 새 기능을 읽어, 소비자 언어로 바꾸고 실제 화면을 캡처해 기존 제품 소개서(PPTX)를 리뉴얼하고 음성·자막이 입혀진 30초 소개 영상을 만든다. 개발 변경을 마케팅 자료로 바꿀 때 사용. 내부 리팩터링만 있는 커밋에는 "마케팅 영향 없음"만 보고한다.
---
# 기능 → 영업 키트 (커밋 → 소개서 리뉴얼 + 소개 영상)

GitHub 계정 없이 동작한다. 저장소는 공개이므로 웹 주소로 읽기만 한다. 저장소에 쓰지 않는다.

## 기본값
- 저장소: https://github.com/acmexii/cloudikehome
- 커밋 목록: https://github.com/acmexii/cloudikehome/commits/main
- 커밋 Diff: https://github.com/acmexii/cloudikehome/commit/<커밋ID>.diff
- 화면: https://acmexii.github.io/cloudikehome/ (안 열리면 https://htmlpreview.github.io/?https://github.com/acmexii/cloudikehome/blob/main/docs/index.html)
- 기존 소개서: marketing/ 폴더의 가장 높은 버전 cloudike-lite-intro-v*.pptx (raw: https://github.com/acmexii/cloudikehome/raw/main/marketing/<파일명>)
- 기존 영상 대본: marketing/video/script-v*.md

## 1. 무엇이 바뀌었나 (코드 → 소비자 언어)
- 사용자가 커밋을 지정하지 않으면 main의 최신 커밋(머지 커밋이면 그 PR의 변경 전체)을 쓴다.
- .diff, 커밋 메시지, CHANGELOG 추가분을 읽는다.
- 고객이 체감하는 변경만 고른다. refactor·test·내부 함수명은 뺀다.
- 변경마다 표: | 기능명 | 소비자용 한 줄("이제 ~할 수 있어요") | 고객 이점 | 이전 → 이후 | 근거(파일·줄) |
- 숫자는 Diff에 있는 값만. 없으면 '확인 필요'. 기술 용어(API, 파라미터, 청크) 금지.
- 바뀐 화면 요소 id(예: #feature-expire)를 Diff에서 찾아 둔다.

## 2. 화면 캡처
- 화면 주소를 1280x720으로 연다. 반영이 늦으면 1~2분 뒤 새로고침.
- ① 첫 화면 ② 새 기능 영역(1단계 id) ③ 바뀐 숫자가 보이는 영역. 3장.
- 열 수 없으면 Diff의 HTML을 그대로 렌더링해 캡처. 실제 화면에 없는 것은 그리지 않는다.

## 3. 소개서 리뉴얼 (기존 PPTX → 새 버전)
- 기존 소개서를 python-pptx로 열어 서식(글꼴·색·크기)을 유지한 채:
  - 바뀐 숫자 교체(예: 2GB → 5GB)
  - '주요 기능' 슬라이드에 새 기능 한 줄 추가(같은 서식)
  - 새 기능 슬라이드 1장 추가: 제목(소비자용 한 줄) + 캡처 + 이점 2줄 + "NEW" 표시
  - 마지막 슬라이드 버전·날짜 갱신
- 파일명 cloudike-lite-intro-v<새버전>.pptx, 가능하면 PDF도. 원본은 바꾸지 않는다.
- '이전 → 이후' 변경 내역 표를 함께 보고.

## 4. 30초 소개 영상
- 장면 3~4개(장면당 6~10초): 고객 고민 → 새 기능 화면 → 바뀐 점 → 엔드카드(제품명).
- 장면표: | 장면 | 캡처 | 내레이션 | 자막 |
- 기존 대본이 있으면 같은 말투로 새 대본(script-v<새버전>.md)도 만든다.
- 음성: 내레이션을 한국어 TTS로 만든다(사용 가능한 TTS). 안 되면 자막만 넣고 '음성 추가 필요'로 보고.
- scripts/make_video.py 로 MP4(1280x720):
  `FONT=<한글 폰트 경로> python scripts/make_video.py scenes.json demo.mp4` (먼저 fc-list :lang=ko 로 한글 폰트 확인)

## 5. 결과 전달
- 채팅에 파일로 제공: 리뉴얼 소개서 PPTX(+PDF), demo.mp4, 캡처 3장, 소비자용 기능 소개(릴리즈 노트 3~5줄).
- 마지막 보고 5줄 이내: 기능 한 줄 / 만든 파일 / 확인 필요 항목.
