import type { SubstituteHolidayPolicy } from "./types.js";

/**
 * Global registry for substitute holiday policies
 */
const policyRegistry = new Map<string, SubstituteHolidayPolicy>();

/**
 * Register a substitute holiday policy for a country
 */
export function registerPolicy(
  country: string,
  policy: SubstituteHolidayPolicy
): void {
  policyRegistry.set(country, policy);
}

/**
 * Get substitute holiday policy for a country
 */
export function getPolicy(country: string): SubstituteHolidayPolicy | undefined {
  return policyRegistry.get(country);
}

/**
 * Check if a policy is registered for a country
 */
export function hasPolicy(country: string): boolean {
  return policyRegistry.has(country);
}
