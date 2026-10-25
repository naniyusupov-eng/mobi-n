/**
 * Asks for the admin password before a protected action (product add / edit / stock / delete).
 * The password only lives in this modal's input while it is open and is handed straight to the
 * action; it is never stored (no localStorage, and the modal unmounts when the request finishes).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button, Field, Modal } from './ui';
import { COMMON, Tri, useL } from '../i18n/tri';

const T = {
  title: { uz: 'Admin paroli', uz_cyrl: 'Админ пароли', ru: 'Пароль администратора' },
  text: {
    uz: 'Bu amalni bajarish uchun admin parolini qayta kiriting.',
    uz_cyrl: 'Бу амални бажариш учун админ паролини қайта киритинг.',
    ru: 'Чтобы выполнить это действие, ещё раз введите пароль администратора.',
  },
  password: { uz: 'Parol', uz_cyrl: 'Парол', ru: 'Пароль' },
  confirm: { uz: 'Tasdiqlash', uz_cyrl: 'Тасдиқлаш', ru: 'Подтвердить' },
  checking: { uz: 'Tekshirilmoqda…', uz_cyrl: 'Текширилмоқда…', ru: 'Проверка…' },
  wrong: { uz: 'Parol notoʻgʻri', uz_cyrl: 'Парол нотўғри', ru: 'Неверный пароль' },
  required: { uz: 'Parolni kiriting', uz_cyrl: 'Паролни киритинг', ru: 'Введите пароль' },
  locked: {
    uz: 'Juda koʻp notoʻgʻri urinish. Birozdan soʻng qayta urinib koʻring.',
    uz_cyrl: 'Жуда кўп нотўғри уриниш. Бироздан сўнг қайта уриниб кўринг.',
    ru: 'Слишком много неверных попыток. Попробуйте позже.',
  },
} satisfies Record<string, Tri>;

/** Thrown by a request when the server refused the admin password (403 / 429) */
export class AdminPasswordError extends Error {
  constructor(
    public kind: 'required' | 'wrong' | 'locked',
    message: string
  ) {
    super(message);
    this.name = 'AdminPasswordError';
  }
}

/** Header for a protected request */
// Encoded so any password (Cyrillic too) fits in an HTTP header; the server decodes it
export const adminPasswordHeader = (password: string) => ({ 'X-Admin-Password': encodeURIComponent(password) });

/** Turns a 403 ADMIN_PASSWORD* / 429 reply into an AdminPasswordError (call before the generic error) */
export const throwIfAdminPasswordError = (res: Response, data: { code?: string; error?: string }) => {
  if (res.status === 429) throw new AdminPasswordError('locked', data.error || '');
  if (res.status === 403 && data.code === 'ADMIN_PASSWORD_WRONG') throw new AdminPasswordError('wrong', data.error || '');
  if (res.status === 403 && data.code === 'ADMIN_PASSWORD') throw new AdminPasswordError('required', data.error || '');
};

interface PendingRequest {
  id: number;
  message?: string;
  action: (password: string) => Promise<void>;
  resolve: (ran: boolean) => void;
  reject: (err: unknown) => void;
}

const AdminPasswordModal: React.FC<{ request: PendingRequest; onDone: () => void }> = ({ request, onDone }) => {
  const L = useL();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const focusInput = () => boxRef.current?.querySelector('input')?.focus();
  const busyRef = useRef(false);

  const cancel = useCallback(() => {
    if (busyRef.current) return;
    setPassword('');
    request.resolve(false);
    onDone();
  }, [request, onDone]);

  // Escape closes only this modal, not the product modal underneath (both listen on window)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      cancel();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [cancel]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busyRef.current) return;
    if (!password) {
      setError(L(T.required));
      focusInput();
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError('');
    const given = password;
    try {
      await request.action(given);
      busyRef.current = false;
      setPassword('');
      request.resolve(true);
      onDone();
    } catch (err) {
      busyRef.current = false;
      setBusy(false);
      setPassword('');
      if (err instanceof AdminPasswordError) {
        // Wrong password or lockout: stay open so the user can try again
        setError(err.kind === 'locked' ? err.message || L(T.locked) : err.kind === 'wrong' ? L(T.wrong) : L(T.required));
        window.setTimeout(focusInput, 0);
        return;
      }
      // Any other failure belongs to the calling form (it shows its own error)
      request.reject(err);
      onDone();
    }
  };

  return (
    <Modal
      open
      onClose={cancel}
      width="sm"
      title={L(T.title)}
      footer={
        <>
          <Button variant="ghost" onClick={cancel} disabled={busy}>
            {L(COMMON.cancel)}
          </Button>
          <Button icon={Lock} onClick={() => submit()} disabled={busy}>
            {busy ? L(T.checking) : L(T.confirm)}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-ink-500">{request.message || L(T.text)}</p>
        <div ref={boxRef}>
          <Field
            label={L(T.password)}
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            disabled={busy}
            onChange={(e) => {
              setError('');
              setPassword(e.target.value);
            }}
          />
        </div>
        {error ? (
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl2 bg-rose-50 text-rose-600 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        ) : null}
        {/* lets Enter submit the form */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
};

/**
 * `const { withPassword, passwordModal } = useAdminPassword();`
 * `const ran = await withPassword((pw) => save(pw));` asks for the password, runs the action with it
 * and keeps the modal open on a wrong password. Resolves true when the action succeeded, false when
 * the user cancelled; other errors from the action are rethrown. Render `passwordModal` last so it
 * sits above other modals.
 */
export function useAdminPassword() {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const nextId = useRef(1);

  const withPassword = useCallback(
    (action: (password: string) => Promise<void>, message?: string) =>
      new Promise<boolean>((resolve, reject) => {
        setRequest({ id: nextId.current++, message, action, resolve, reject });
      }),
    []
  );

  const done = useCallback(() => setRequest(null), []);
  const passwordModal = request ? <AdminPasswordModal key={request.id} request={request} onDone={done} /> : null;

  return { withPassword, passwordModal };
}
