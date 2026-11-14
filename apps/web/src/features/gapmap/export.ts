export function exportFooter(citation: { corpusHash: string; sourcesLine: string; dateIso: string } | undefined, hashes: string[]): string[] {
  return [citation?.sourcesLine || 'Sources: plotted CSV rows', `Corpus: ${citation?.corpusHash || [...new Set(hashes.filter(Boolean))].sort().join(', ') || 'not reported'}`, `Date: ${citation?.dateIso || new Date().toISOString().slice(0, 10)}`];
}

export async function saveChart(canvas: HTMLCanvasElement, svg: SVGSVGElement, footer: string[]): Promise<void> {
  const output = document.createElement('canvas');
  output.width = 1800;
  output.height = 1180;
  const context = output.getContext('2d');
  if (!context) return;
  const styles = getComputedStyle(svg);
  context.fillStyle = styles.getPropertyValue('--color-surface').trim() || '#12161b';
  context.fillRect(0, 0, output.width, output.height);
  context.drawImage(canvas, 0, 0, 1800, 1000);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const originalNodes = [svg, ...svg.querySelectorAll('*')];
  const clonedNodes = [clone, ...clone.querySelectorAll('*')];
  originalNodes.forEach((node, index) => {
    const target = clonedNodes[index] as SVGElement | undefined;
    if (!target) return;
    const computed = getComputedStyle(node);
    for (const property of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font', 'font-size', 'font-family']) target.style.setProperty(property, computed.getPropertyValue(property));
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = url; });
    context.drawImage(image, 0, 0, 1800, 1000);
    context.fillStyle = styles.getPropertyValue('--color-ink').trim() || '#e8eaed';
    context.font = '22px sans-serif';
    context.fillText('Circle: droplet   Square: solid   Triangle: gas   Diamond: aerosol   Hollow: burner O2 (excluded from counts)', 30, 1035, 1740);
    footer.forEach((line, index) => context.fillText(line, 30, 1065 + index * 28, 1740));
    const link = document.createElement('a');
    link.download = 'fire-atlas-map.png';
    link.href = output.toDataURL('image/png');
    link.click();
  } finally { URL.revokeObjectURL(url); }
}
