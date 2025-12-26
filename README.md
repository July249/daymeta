# nostos-calendar

> Korean date intelligence engine with lunar calendar, holidays, and special days support

`@nostos/calendar` is a TypeScript library that provides comprehensive Korean calendar information including:

- Lunar calendar conversion (음력 변환)
- Public holidays and substitute holidays (공휴일 및 대체공휴일)
- Special days: 24 solar terms (24절기), sundry days (잡절), lunar festivals (명절)
- Calendar grid generation for UI

## Features

- **Lunar Calendar**: Convert solar dates to lunar dates with leap month support
- **Holiday Detection**: Identify Korean public holidays with automatic substitute holiday calculation
- **Special Days**: Get information about solar terms, traditional festivals, and other special days
- **Calendar Grid**: Generate monthly calendar grids (42 days) for UI components
- **Online & Offline**: Supports both KASI API (online) and bundled JSON data (offline)
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **ESM & CJS**: Dual module format support

## Installation

```bash
npm install @nostos/calendar
```

## Prerequisites

### KASI API Key (for online mode)

To use the online mode, you need a service key from the [Korean Astronomy and Space Science Institute (KASI)](https://www.data.go.kr/).

1. Register at [공공데이터포털](https://www.data.go.kr/)
2. Request API keys for:
   - 특일 정보 조회 서비스
   - 음양력 변환 서비스

Set the API key as an environment variable:

```bash
export KASI_SERVICE_KEY=your_api_key_here
```

Or pass it as an option:

```typescript
const info = await getDayInfo("2024-01-01", {
  serviceKey: "your_api_key_here"
});
```

### Offline Mode

To use offline mode, you need to generate the offline data first:

```bash
npm run generate-data
```

This will fetch data from KASI API and create a bundled JSON file.

## Usage

### Get Day Information

```typescript
import { getDayInfo } from "@nostos/calendar";

// Get comprehensive information for a date
const info = await getDayInfo("2024-01-01");

console.log(info);
// {
//   date: "2024-01-01",
//   weekday: 1, // Monday
//   isWeekend: false,
//   lunar: {
//     year: 2023,
//     month: 11,
//     day: 20,
//     isLeapMonth: false,
//     ganji: { ... }
//   },
//   holidays: [
//     {
//       date: "2024-01-01",
//       name: "신정",
//       kind: "STATUTORY"
//     }
//   ],
//   specials: [...]
// }
```

### List Holidays

```typescript
import { listHolidays } from "@nostos/calendar";

// Get all holidays for a year
const result = await listHolidays(2024);

console.log(result.items);
// [
//   { date: "2024-01-01", name: "신정", kind: "STATUTORY" },
//   { date: "2024-03-01", name: "삼일절", kind: "STATUTORY" },
//   ...
// ]

console.log(result.countExcludingSundays); // Number of holidays excluding Sundays

// With options
const result2 = await listHolidays(2024, {
  includeSubstitute: true,    // Include substitute holidays (default: true)
  includeSundays: false,       // Include holidays that fall on Sunday (default: false)
  extraHolidays: [             // Add temporary holidays
    {
      date: "2024-04-10",
      name: "임시공휴일",
      kind: "TEMPORARY"
    }
  ]
});
```

### Build Month Grid

```typescript
import { buildMonthGrid } from "@nostos/calendar";

// Generate calendar grid for January 2024 (42 days)
const grid = await buildMonthGrid(2024, 1);

console.log(grid.length); // 42 (6 weeks × 7 days)

// Use for calendar UI
grid.forEach((day, index) => {
  if (index % 7 === 0) console.log("\n"); // New week

  const marker = day.holidays.length > 0 ? "🎉" : " ";
  console.log(`${day.date.split("-")[2]}${marker}`);
});
```

### Offline Mode

```typescript
import { getDayInfo } from "@nostos/calendar";

// Use offline data (requires pre-generated data)
const info = await getDayInfo("2024-01-01", {
  useOfflineData: true
});
```

## API Reference

### `getDayInfo(date: YMD, opts?: GetDayInfoOptions): Promise<DayInfo>`

Get comprehensive information for a specific date.

**Parameters:**
- `date`: Date string in `YYYY-MM-DD` format (KST timezone)
- `opts`: Optional configuration
  - `serviceKey`: KASI API service key
  - `useOfflineData`: Use bundled offline data instead of API

**Returns:** `DayInfo` object containing:
- `date`: The input date
- `weekday`: Day of week (0=Sunday, 6=Saturday)
- `isWeekend`: Whether the date is a weekend
- `lunar`: Lunar calendar information
- `holidays`: Array of holidays on this date
- `specials`: Array of special days (solar terms, festivals, etc.)

### `listHolidays(year: number, opts?: ListHolidaysOptions): Promise<ListHolidaysResult>`

List all holidays for a given year.

**Parameters:**
- `year`: Year to fetch holidays for
- `opts`: Optional configuration
  - `includeSubstitute`: Include substitute holidays (default: `true`)
  - `includeSundays`: Include holidays that fall on Sunday (default: `false`)
  - `extraHolidays`: Array of additional temporary holidays
  - `serviceKey`: KASI API service key
  - `useOfflineData`: Use bundled offline data

**Returns:** Object containing:
- `items`: Array of `HolidayItem` objects
- `countExcludingSundays`: Number of holidays excluding Sundays

### `buildMonthGrid(year: number, month: number, opts?: BuildMonthGridOptions): Promise<DayInfo[]>`

Generate a calendar grid for a month (6 weeks × 7 days = 42 days).

**Parameters:**
- `year`: Year
- `month`: Month (1-12)
- `opts`: Optional configuration
  - `serviceKey`: KASI API service key
  - `useOfflineData`: Use bundled offline data

**Returns:** Array of 42 `DayInfo` objects representing the calendar grid

## Types

```typescript
type YMD = `${number}-${string}-${string}`;

type HolidayKind = "STATUTORY" | "SUBSTITUTE" | "TEMPORARY" | "LOCAL";
type SpecialKind = "SOLAR_TERM" | "SUNDRY" | "LUNAR_FESTIVAL";

interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  ganji?: {
    secha?: string;
    wolgeon?: string;
    iljin?: string;
  };
}

interface HolidayItem {
  date: YMD;
  name: string;
  kind: HolidayKind;
  substituteFor?: YMD;
}

interface SpecialItem {
  date: YMD;
  name: string;
  kind: SpecialKind;
}

interface DayInfo {
  date: YMD;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isWeekend: boolean;
  lunar?: LunarDate;
  holidays: HolidayItem[];
  specials: SpecialItem[];
}
```

## Important Notes

- **KST Timezone**: All dates are interpreted as KST (Korea Standard Time)
- **Korea Only**: v0.1 supports South Korea only
- **Date Range**: Offline data covers 2020-2030 by default
- **API Limits**: KASI API has rate limits; use offline mode for production

## Future Plans

- Global calendar support with provider architecture
- More comprehensive offline data
- Customizable substitute holiday policies
- Historical holiday data

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
