import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/**
 * QR code as crisp SVG, drawn from module data (library: qrcode-generator 1.4.4, MIT, added to apps/web by W5).
 * Error correction M, byte mode, automatic version. Never dithered.
 */
export default function QrSvg({ text, label }: { text: string; label: string }) {
  const { n, d } = useMemo(() => {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text, 'Byte');
      qr.make();
      const size = qr.getModuleCount();
      let path = '';
      for (let r = 0; r < size; r++) {
        let run = -1;
        for (let c = 0; c <= size; c++) {
          const dark = c < size && qr.isDark(r, c);
          if (dark && run < 0) run = c;
          if (!dark && run >= 0) { path += `M${run} ${r}h${c - run}v1h-${c - run}z`; run = -1; }
        }
      }
      return { n: size, d: path };
    } catch {
      return { n: 0, d: '' };
    }
  }, [text]);
  if (n === 0) return <span className="fa-muted" style={{ fontSize: 10 }}>QR code unavailable for this link length</span>;
  return (
    <svg viewBox={`-2 -2 ${n + 4} ${n + 4}`} role="img" aria-label={label} shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
      <path d={d} fill="#111418" />
    </svg>
  );
}
