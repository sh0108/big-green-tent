export function computeScore(weights, nonprofit) {
  const wEff = parseFloat(weights.efficiency);
  const wGro = parseFloat(weights.growth);
  const wSus = parseFloat(weights.sustainability);
  const wSca = parseFloat(weights.scale);
  const wGra = parseFloat(weights.grant_distribution);
  const wGeo = parseFloat(weights.geographic_reach);
  const wInn = parseFloat(weights.innovation_output);

  // Default to 1 if not provided or invalid
  const finalEff = isNaN(wEff) ? 1 : wEff;
  const finalGro = isNaN(wGro) ? 1 : wGro;
  const finalSus = isNaN(wSus) ? 1 : wSus;
  const finalSca = isNaN(wSca) ? 1 : wSca;
  const finalGra = isNaN(wGra) ? 1 : wGra;
  const finalGeo = isNaN(wGeo) ? 1 : wGeo;
  const finalInn = isNaN(wInn) ? 1 : wInn;

  const totalWeight = finalEff + finalGro + finalSus + finalSca + finalGra + finalGeo + finalInn;
  
  if (totalWeight === 0) return 0;

  const score = (
    (nonprofit.program_efficiency || 0) * finalEff +
    (nonprofit.revenue_growth || 0) * finalGro +
    (nonprofit.sustainability || 0) * finalSus +
    (nonprofit.scale || 0) * finalSca +
    (nonprofit.grant_distribution || 0) * finalGra +
    (nonprofit.geographic_reach || 0) * finalGeo +
    (nonprofit.innovation_output || 0) * finalInn
  ) / totalWeight;

  // Convert 0-2 metrics to a 0-100 score
  const calculatedScore = Math.round(score * 50);
  return Math.min(100, Math.max(0, calculatedScore));
}
