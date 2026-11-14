import { Toaster, toast } from 'sonner';
import { useAtlas } from '../state/store';

/** Toasts are for transient confirmations only (copied, saved). Errors are inline. */
export function ToastHost() {
  const theme = useAtlas((s) => s.theme);
  return (
    <Toaster position="bottom-center" theme={theme === 'paper' ? 'light' : 'dark'} offset={72}
      toastOptions={{ style: { borderRadius: 0, background: 'var(--color-raised)', color: 'var(--color-ink)', border: '1px solid var(--color-border-strong)', fontFamily: 'var(--font-sans)', fontSize: 14 } }} />
  );
}
export { toast };
