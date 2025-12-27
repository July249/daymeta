# daymeta

> 한국 날짜 정보 엔진 - 음력 변환, 공휴일, 절기 정보 제공

## 소개

`daymeta`는 한국의 다양한 날짜 정보를 제공하는 TypeScript 라이브러리입니다. 이 라이브러리는 달력 애플리케이션 개발에 필요한 모든 한국 고유의 날짜 데이터를 하나의 통합된 인터페이스로 제공합니다.

### 제공 기능

이 라이브러리는 다음과 같은 한국 달력 정보를 제공합니다:

- **음력 변환**: 양력 날짜를 음력으로, 음력 날짜를 양력으로 정확하게 변환 (윤달 지원)
- **공휴일 정보**: 대한민국 법정 공휴일 및 대체공휴일 자동 계산
- **특별한 날**: 24절기, 잡절(한식, 삼복 등), 명절(설날, 추석 등)
- **달력 그리드**: UI 구성을 위한 월간 달력 그리드 생성 (42일 기준)

### 목표 및 특징

1. **정확성**: 한국천문연구원(KASI) API 데이터 기반으로 1900~2050년 범위의 정확한 음력 변환
2. **오프라인 지원**: 네트워크 없이도 작동하는 번들 데이터 제공
3. **타입 안정성**: TypeScript 기반으로 완전한 타입 정의 제공
4. **제로 런타임 의존성**: 프로덕션 환경에서 외부 API 호출 없이 동작
5. **유연한 구조**: Provider 패턴으로 확장 가능한 아키텍처

## 설치

```bash
npm install daymeta
```

## 빠른 시작

### 기본 사용법

특정 날짜의 모든 정보를 조회합니다:

```typescript
import { getDayInfo } from "daymeta";

const info = await getDayInfo("2024-01-01");

console.log(info);
// {
//   date: "2024-01-01",
//   weekday: 1,              // 월요일 (0=일요일, 6=토요일)
//   isWeekend: false,
//   lunar: {
//     year: 2023,
//     month: 11,
//     day: 20,
//     isLeapMonth: false    // 윤달 여부
//   },
//   holidays: [
//     {
//       date: "2024-01-01",
//       name: "신정",
//       kind: "STATUTORY"    // 법정 공휴일
//     }
//   ],
//   specials: []            // 절기, 명절 등
// }
```

### 연간 공휴일 조회

특정 연도의 모든 공휴일을 조회합니다:

```typescript
import { listHolidays } from "daymeta";

// 2024년 모든 공휴일 조회
const result = await listHolidays(2024);

console.log(result.items);
// [
//   { date: "2024-01-01", name: "신정", kind: "STATUTORY" },
//   { date: "2024-02-09", name: "설날 전날", kind: "STATUTORY", variant: "PRE" },
//   { date: "2024-02-10", name: "설날", kind: "STATUTORY", variant: "DAY" },
//   { date: "2024-02-11", name: "설날 다음날", kind: "STATUTORY", variant: "POST" },
//   { date: "2024-02-12", name: "대체공휴일", kind: "SUBSTITUTE", substituteFor: "2024-02-10" },
//   { date: "2024-03-01", name: "삼일절", kind: "STATUTORY" },
//   ...
// ]

// 일요일 제외한 공휴일 개수
console.log(result.countExcludingSundays);
```

### 옵션 사용

```typescript
// 대체공휴일 제외, 일요일 포함, 임시공휴일 추가
const result = await listHolidays(2024, {
  includeSubstitute: false,     // 대체공휴일 제외
  includeSundays: true,          // 일요일과 겹치는 공휴일도 포함
  extraHolidays: [               // 임시공휴일 추가
    {
      date: "2024-04-10",
      name: "제22대 국회의원 선거일",
      kind: "TEMPORARY"
    }
  ]
});
```

### 달력 그리드 생성

UI에서 사용할 수 있는 월간 달력 그리드를 생성합니다 (6주 × 7일 = 42일):

```typescript
import { buildMonthGrid } from "daymeta";

// 2024년 1월 달력 그리드 생성
const grid = await buildMonthGrid(2024, 1);

console.log(grid.length); // 42

// 달력 UI 렌더링 예시
grid.forEach((day, index) => {
  if (index % 7 === 0) console.log("\n"); // 새로운 주

  const isHoliday = day.holidays.length > 0;
  const marker = isHoliday ? "🎉" : "  ";
  console.log(`${day.date.split("-")[2]}${marker}`);
});
// 출력:
// 31   01   02   03   04   05   06
// 07   08   09   10   11   12   13
// 14   15   16   17   18   19   20
// 21   22   23   24   25   26   27
// 28   29   30   31   01🎉 02   03
// 04   05   06   07   08   09   10
```

### 오프라인 모드

네트워크 없이 번들 데이터를 사용합니다:

```typescript
import { getDayInfo } from "daymeta";

const info = await getDayInfo("2024-01-01", {
  useOfflineData: true  // 오프라인 데이터 사용
});
```

## 공개 API

### `getDayInfo(date, options?)`

특정 날짜의 모든 정보를 조회합니다.

**매개변수:**
- `date` (string): `YYYY-MM-DD` 형식의 날짜 문자열 (KST 기준)
- `options` (선택):
  - `serviceKey` (string): KASI API 서비스 키
  - `useOfflineData` (boolean): 오프라인 데이터 사용 여부

**반환값:**
```typescript
{
  date: string;                    // 입력 날짜
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;  // 요일 (0=일요일)
  isWeekend: boolean;              // 주말 여부
  lunar?: {                        // 음력 정보
    year: number;
    month: number;
    day: number;
    isLeapMonth: boolean;         // 윤달 여부
    ganji?: {                     // 간지 정보
      secha?: string;             // 세차 (연주)
      wolgeon?: string;           // 월건 (월주)
      iljin?: string;             // 일진 (일주)
    }
  };
  holidays: Array<{               // 공휴일 배열
    date: string;
    name: string;
    kind: "STATUTORY" | "SUBSTITUTE" | "TEMPORARY" | "LOCAL";
    variant?: "PRE" | "DAY" | "POST";  // 연휴 구분 (설날, 추석)
    substituteFor?: string;       // 대체공휴일인 경우 원래 날짜
  }>;
  specials: Array<{               // 특별한 날 배열
    date: string;
    name: string;
    kind: "SOLAR_TERM" | "SUNDRY" | "LUNAR_FESTIVAL";
  }>;
}
```

**사용 예시:**
```typescript
const info = await getDayInfo("2025-10-06");
// {
//   date: "2025-10-06",
//   weekday: 1,  // 월요일
//   isWeekend: false,
//   lunar: {
//     year: 2025,
//     month: 8,
//     day: 15,
//     isLeapMonth: false
//   },
//   holidays: [
//     { date: "2025-10-06", name: "추석", kind: "STATUTORY", variant: "DAY" }
//   ],
//   specials: [
//     { date: "2025-10-06", name: "한가위", kind: "LUNAR_FESTIVAL" }
//   ]
// }
```

### `listHolidays(year, options?)`

특정 연도의 모든 공휴일을 조회합니다.

**매개변수:**
- `year` (number): 조회할 연도
- `options` (선택):
  - `includeSubstitute` (boolean): 대체공휴일 포함 여부 (기본값: `true`)
  - `includeSundays` (boolean): 일요일과 겹치는 공휴일 포함 여부 (기본값: `false`)
  - `extraHolidays` (Array): 추가할 임시공휴일 목록
  - `serviceKey` (string): KASI API 서비스 키
  - `useOfflineData` (boolean): 오프라인 데이터 사용 여부

**반환값:**
```typescript
{
  items: Array<HolidayItem>;      // 공휴일 배열
  countExcludingSundays: number;  // 일요일 제외한 공휴일 개수
}
```

**사용 예시:**
```typescript
const result = await listHolidays(2025, {
  includeSubstitute: true,
  extraHolidays: [
    {
      date: "2025-01-27",
      name: "설 연휴 임시공휴일",
      kind: "TEMPORARY"
    }
  ]
});

// result.items:
// [
//   { date: "2025-01-01", name: "신정", kind: "STATUTORY" },
//   { date: "2025-01-28", name: "설날 전날", kind: "STATUTORY", variant: "PRE" },
//   { date: "2025-01-29", name: "설날", kind: "STATUTORY", variant: "DAY" },
//   { date: "2025-01-30", name: "설날 다음날", kind: "STATUTORY", variant: "POST" },
//   { date: "2025-03-01", name: "삼일절", kind: "STATUTORY" },
//   { date: "2025-03-03", name: "대체공휴일", kind: "SUBSTITUTE", substituteFor: "2025-03-01" },
//   ...
// ]

// result.countExcludingSundays: 18
```

### `buildMonthGrid(year, month, options?)`

UI용 월간 달력 그리드를 생성합니다 (6주 × 7일 = 42일).

**매개변수:**
- `year` (number): 연도
- `month` (number): 월 (1~12)
- `options` (선택):
  - `serviceKey` (string): KASI API 서비스 키
  - `useOfflineData` (boolean): 오프라인 데이터 사용 여부

**반환값:**
```typescript
Array<DayInfo>  // 42개의 DayInfo 객체 배열
```

**사용 예시:**
```typescript
const grid = await buildMonthGrid(2025, 1);  // 2025년 1월

// 첫 번째 날 (전달의 마지막 주 포함)
console.log(grid[0]);
// {
//   date: "2024-12-29",  // 이전 달의 날짜부터 시작
//   weekday: 0,
//   isWeekend: true,
//   ...
// }

// 실제 1월 1일의 인덱스 찾기
const jan1Index = grid.findIndex(d => d.date === "2025-01-01");
console.log(jan1Index);  // 3 (수요일)

// 달력 렌더링
grid.forEach((day, i) => {
  const isCurrentMonth = day.date.startsWith("2025-01");
  const className = isCurrentMonth ? "current" : "other-month";
  // ... 렌더링 로직
});
```

## 타입 정의

```typescript
// 날짜 문자열 형식
type YMD = `${number}-${string}-${string}`;  // "2024-01-01"

// 공휴일 종류
type HolidayKind =
  | "STATUTORY"    // 법정 공휴일
  | "SUBSTITUTE"   // 대체공휴일
  | "TEMPORARY"    // 임시공휴일
  | "LOCAL";       // 지역 공휴일

// 특별한 날 종류
type SpecialKind =
  | "SOLAR_TERM"      // 24절기
  | "SUNDRY"          // 잡절 (한식, 삼복 등)
  | "LUNAR_FESTIVAL"; // 명절 (설날, 추석 등)

// 음력 날짜 정보
interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;  // 윤달 여부
  ganji?: {
    secha?: string;      // 세차 (갑자, 을축 등)
    wolgeon?: string;    // 월건
    iljin?: string;      // 일진
  };
}

// 공휴일 항목
interface HolidayItem {
  date: YMD;
  name: string;
  nameEn?: string;
  kind: HolidayKind;
  variant?: "PRE" | "DAY" | "POST";  // 연휴 구분
  substituteFor?: YMD;               // 대체공휴일인 경우
}

// 특별한 날 항목
interface SpecialItem {
  date: YMD;
  name: string;
  nameEn?: string;
  kind: SpecialKind;
}

// 날짜 정보
interface DayInfo {
  date: YMD;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isWeekend: boolean;
  lunar?: LunarDate;
  holidays: HolidayItem[];
  specials: SpecialItem[];
}
```

## 프로젝트 구조

```
daymeta/
├── src/
│   ├── algorithms/        # 핵심 알고리즘
│   │   └── lunar/        # 음력 변환 알고리즘
│   │       └── table.ts  # 테이블 기반 음력 변환 (1900-2050)
│   │
│   ├── providers/        # 데이터 제공자
│   │   ├── lunar/       # 음력 데이터 제공자
│   │   │   ├── table.ts # 오프라인 테이블 기반 제공자
│   │   │   └── kasi.ts  # KASI API 기반 제공자
│   │   └── holiday/     # 공휴일 데이터 제공자
│   │       ├── json.ts  # JSON 규칙 기반 제공자
│   │       └── kasi.ts  # KASI API 기반 제공자
│   │
│   ├── policies/         # 정책 규칙
│   │   └── kr.ts        # 한국 대체공휴일 정책
│   │
│   ├── data/            # 번들 데이터
│   │   ├── lunar/       # 음력 변환 테이블 (1900-2050)
│   │   ├── holidays/    # 공휴일 규칙 정의
│   │   └── substitute/  # 대체공휴일 정책
│   │
│   ├── utils/           # 유틸리티
│   │   └── date/       # 날짜 계산 함수
│   │
│   └── index.ts         # 공개 API
│
├── tests/               # 테스트
│   ├── unit/           # 단위 테스트
│   ├── integration/    # 통합 테스트
│   └── manual/         # 수동 검증 테스트
│
└── scripts/            # 데이터 생성 스크립트
    └── gen-lunar-kr-kasi.ts  # KASI에서 음력 테이블 생성
```

### 주요 폴더 설명

- **`src/algorithms/`**: 음력 변환 등 핵심 계산 로직
  - 음력 변환 알고리즘 수정 시 `lunar/table.ts` 확인
  - 윤달, 월별 일수 계산 로직 포함

- **`src/providers/`**: 외부 데이터 소스 연동
  - KASI API 연동 문제 시 `*/kasi.ts` 확인
  - 오프라인 데이터 문제 시 `*/table.ts` 또는 `*/json.ts` 확인

- **`src/policies/`**: 대체공휴일 등 정책 규칙
  - 대체공휴일 계산 오류 시 `kr.ts` 확인
  - 토요일/일요일 겹침, 공휴일 중복, 연휴 일요일 포함 규칙

- **`src/data/`**: 번들 JSON 데이터
  - 음력 변환 오류 시 `lunar/kr.lunar.v1.json` 확인
  - 공휴일 누락 시 `holidays/kr.holidays.v1.json` 확인
  - 데이터 재생성은 `npm run gen:lunar:kr:kasi` 사용

- **`tests/`**: 테스트 코드
  - 버그 재현 시 `manual/` 폴더에 검증 테스트 추가
  - KASI API 검증은 `integration/lunar-kasi-compare.test.ts` 사용

## 개발 가이드

### 오프라인 데이터 생성

KASI API에서 음력 테이블을 다시 생성하려면:

```bash
KASI_SERVICE_KEY=your_key npm run gen:lunar:kr:kasi
```

이 스크립트는:
- 1900~2050년 범위의 음력 데이터를 KASI API에서 조회
- 최적화된 테이블 형식으로 `src/data/lunar/kr.lunar.v1.json`에 저장
- 연도당 약 13-15회 API 호출 (트래픽 최소화)
- 알려진 값으로 자동 검증 (2025-01-29, 2026-02-17 등)

### 테스트 실행

전체 테스트:
```bash
npm test
```

KASI API 검증 (API 키 필요):
```bash
KASI_SERVICE_KEY=your_key npm run test:kasi
```

300~1000개 랜덤 날짜로 오프라인 테이블과 KASI API 비교 검증합니다.

### KASI API 키 발급

온라인 모드 사용 시 필요합니다:

1. [공공데이터포털](https://www.data.go.kr/) 회원가입
2. 다음 API 신청:
   - **특일 정보 조회 서비스**
   - **음양력 변환 서비스**
3. 발급받은 서비스 키를 환경변수에 설정:

```bash
# .env 파일
KASI_SERVICE_KEY=your_api_key_here
```

또는 코드에서 직접 전달:
```typescript
const info = await getDayInfo("2024-01-01", {
  serviceKey: "your_api_key_here"
});
```

## 중요 사항

- **시간대**: 모든 날짜는 KST(한국 표준시) 기준으로 처리됩니다
- **지역**: 현재 버전(v0.1)은 대한민국만 지원합니다
- **날짜 범위**: 오프라인 음력 데이터는 1900~2050년을 커버합니다
- **API 제한**: KASI API는 사용량 제한이 있으므로 프로덕션에서는 오프라인 모드 권장
- **런타임 의존성**: 제로! KASI API는 개발/테스트 시에만 사용됩니다

## 알려진 이슈 및 해결

### 2023년 추석 날짜 수정 (v0.1.1)

2023년 음력 데이터의 mask 값 오류로 인해 추석 날짜가 하루 늦게 계산되는 문제가 있었습니다:
- **문제**: 음력 2023년 8월 15일이 양력 9월 30일로 계산됨 (정답: 9월 29일)
- **원인**: `kr.lunar.v1.json`의 2023년 mask 값이 `0xAD6`로 음력 6월을 30일로 계산 (정답: 29일)
- **수정**: mask 값을 `0xA96`으로 변경하여 음력 6월을 29일로 수정

음력 변환 오류 발견 시 해당 연도의 mask 값을 확인하세요.

## 향후 계획

- 글로벌 달력 지원 (Provider 아키텍처 활용)
- 더 풍부한 오프라인 데이터
- 커스터마이징 가능한 대체공휴일 정책
- 과거 공휴일 데이터 (예: 1990년대 이전)

## 라이선스

MIT

## 기여

기여를 환영합니다! Pull Request를 자유롭게 제출해 주세요.

---

**Made with ❤️ for Korean calendar applications**
