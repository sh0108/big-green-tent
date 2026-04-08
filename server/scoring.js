/**
 * Scoring engine for Big Green Tent nonprofits.
 * Computes a weighted average score based on user-defined weights.
 */

export function computeScore(weights, nonprofit) {
  const wEff = parseFloat(weights.efficiency);
  const wGro = parseFloat(weights.growth);
  const wSus = parseFloat(weights.sustainability);
  const wSca = parseFloat(weights.scale);

  // Default to 1 if not provided or invalid
  const finalEff = isNaN(wEff) ? 1 : wEff;
  const finalGro = isNaN(wGro) ? 1 : wGro;
  const finalSus = isNaN(wSus) ? 1 : wSus;
  const finalSca = isNaN(wSca) ? 1 : wSca;

  const totalWeight = finalEff + finalGro + finalSus + finalSca;
  
  if (totalWeight === 0) return 0;

  const score = (
    (nonprofit.program_efficiency || 0) * finalEff +
    (nonprofit.revenue_growth || 0) * finalGro +
    (nonprofit.sustainability || 0) * finalSus +
    (nonprofit.scale || 0) * finalSca
  ) / totalWeight;

  // Convert 0-1 metrics to a 0-100 score
  return Math.round(score * 100);
}
