# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed critical bug in `TableLunarAlgorithm.lunarToSolar` where invalid lunar dates were not validated
- Fixed fundamental mask generation bug in `scripts/gen-kr-lunar-v1.kasi.ts` affecting all leap years (56 years from 1900-2050)
- Regenerated complete lunar data (1900-2050) using KASI API with corrected script

### Changed
- Updated lunar data for all 56 leap years with accurate month lengths from KASI API
- All 556 tests now passing with verified data

## [1.0.2] - Previous Release

### Fixed - 2023 Lunar December Correction

**Root Cause Discovery**: The fundamental issue affecting 2023 (and occurring twice) was due to a bug in the `scripts/gen-kr-lunar-v1.kasi.ts` mask generation logic.

**Script Bug Details**:
- **Problem**: For years with leap months, all months after the leap month were recorded in incorrect bit positions in the mask
- **Cause**: The script used `m-1` for bit positions without accounting for leap month offset
- **Impact**: Data for all years with leap months (56 years total in 1900-2050 range) was potentially incorrect
- **Fix**: Modified [scripts/gen-kr-lunar-v1.kasi.ts:200-219](scripts/gen-kr-lunar-v1.kasi.ts#L200-L219) to accurately track bitIndex

**2023 Data Correction**:
- **Issue**: Lunar conversion failed for 2024-02-09 (Lunar New Year's Eve) with error `Failed to find lunar month/day for year 2023, days 383`
- **Root Cause**: Buggy script generated mask `0xA96` which calculated lunar December as 29 days (correct: 30 days)
- **Fix**: Changed mask to `0x1A96` to set lunar December as 30 days
- **Verification**: Confirmed exactly 384 days from 2023 Lunar New Year (2023-01-22) to 2024 Lunar New Year (2024-02-10)

## [0.1.1] - Previous Release

### Fixed - 2023 Chuseok Date Correction

2023 lunar June date error caused Chuseok to be calculated one day late:
- **Issue**: Lunar 2023-08-15 was calculated as 2023-09-30 (correct: 2023-09-29)
- **Root Cause**: Original mask value `0xAD6` from KASI API calculated lunar June as 30 days (correct: 29 days)
- **Fix**: Changed mask value to `0xA96` to set lunar June as 29 days

### Known Issues

**⚠️ CRITICAL**: Testing revealed that **almost all years with leap months (55 out of 56 years)** were affected by the script bug. Specifically, lunar December day counts were mostly incorrect.

**Current Status**:
- ✅ Year 2023: Manually corrected and accurate
- ❌ Other leap month years (55 out of 151 years in 1900-2050): Data regeneration required
- ✅ Regular years (non-leap month years): Not affected

**Recommended Action**:
- If you have a KASI API key, **MUST** regenerate all data with `npm run gen:lunar:kr:kasi`
- See [LEAP_YEAR_DATA_ISSUES.md](LEAP_YEAR_DATA_ISSUES.md) for detailed analysis

## Implementation Details

### Mask Bit Index Fix

**Before (Buggy)**:
```typescript
let mask = 0;
for (let m = 1; m <= 12; m++) {
  if (monthLens[m] === 30) {
    mask |= 1 << (m - 1);  // ❌ Always uses m-1, ignoring leap month offset
  }
}
if (leap > 0 && leapLen === 30) {
  mask |= 1 << 12;
}
```

**After (Fixed)**:
```typescript
let mask = 0;
let bitIndex = 0;

for (let m = 1; m <= 12; m++) {
  // Set bit for regular month m
  if (monthLens[m] === 30) {
    mask |= 1 << bitIndex;
  }
  bitIndex++;

  // If this is the leap month position, add leap month bit
  if (m === leap && leap > 0) {
    if (leapLen === 30) {
      mask |= 1 << bitIndex;
    }
    bitIndex++;
  }
}
```

### Validation Logic Addition

Added date validation in `TableLunarAlgorithm.lunarToSolar`:

```typescript
// Calculate current month's length from mask
const currentMonthLen = 29 + ((maskNum >> (currentMonthIdx - 1)) & 1);

// Validate day is within month's actual length
if (day < 1 || day > currentMonthLen) {
  throw new Error(
    `Invalid lunar day: ${day}. Month ${month}${isLeapMonth ? " (leap)" : ""} in year ${lunarYear} has ${currentMonthLen} days`
  );
}
```

This prevents silent failures when converting dates with invalid day values (e.g., day 30 in a 29-day month).
