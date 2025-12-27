import { createCalendar } from "@/core/factory";

import type { CalendarContext, CalendarContextConfig } from "@/core/context";

/**
 * Global calendar context instance
 */
let globalContext: CalendarContext | null = null;

/**
 * Configure global calendar settings
 *
 * This is optional. You can use createCalendar() directly if you don't need global configuration.
 *
 * @example
 * ```typescript
 * import { configure, getDayInfo } from 'daymeta';
 *
 * // Configure once
 * configure({ country: 'KR' });
 *
 * // Use functions directly
 * const info = await getDayInfo('2024-01-01');
 * ```
 *
 * @param config - Calendar configuration
 */
export function configure(config: CalendarContextConfig): void {
  globalContext = createCalendar(config);
}

/**
 * Get the global calendar context
 * Throws an error if configure() hasn't been called
 *
 * @internal
 */
export function getGlobalContext(): CalendarContext {
  if (!globalContext) {
    throw new Error(
      "Calendar not configured. Call configure() first or use createCalendar() instead.",
    );
  }
  return globalContext;
}

/**
 * Reset global configuration (mainly for testing)
 *
 * @internal
 */
export function resetGlobalContext(): void {
  globalContext = null;
}
