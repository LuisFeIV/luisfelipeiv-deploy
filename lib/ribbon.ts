// The original ribbon (8 labels, 20s per loop) is the reference: keep its speed and never leave gaps.
const referenceDurationSeconds = 20;
const itemPaddingWeight = 5;
const referenceWeight = 144;

function weightOf(labels: string[]) {
  return labels.reduce((total, label) => total + label.length + itemPaddingWeight, 0);
}

export function buildRibbonTrack(labels: string[]) {
  const cleanLabels = labels.map((label) => label.trim()).filter(Boolean);
  if (cleanLabels.length === 0) return null;

  const loop = [...cleanLabels];
  while (weightOf(loop) < referenceWeight) loop.push(...cleanLabels);

  const durationSeconds = Math.round((referenceDurationSeconds * weightOf(loop) / referenceWeight) * 100) / 100;
  return { durationSeconds, items: [...loop, ...loop] };
}
