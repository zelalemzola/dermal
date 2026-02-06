/**
 * Converts a dollar amount to Stripe subcurrency (cents).
 * Stripe expects amounts in the smallest currency unit (e.g. cents for USD).
 */
export default function convertToSubcurrency(amountDollars: number): number {
  return Math.round(amountDollars * 100);
}
