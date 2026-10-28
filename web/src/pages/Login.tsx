import React, { useEffect, useState } from 'react';
import { LogIn, RefreshCw, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n/translations';
import { COMMON, Tri, useL } from '../i18n/tri';
import { Button, Field, Segmented } from '../components/ui';
import { API, apiFetch, setToken } from '../api';

const T = {
  subtitle: { uz: 'Savdo boshqaruvi', uz_cyrl: 'Савдо бошқаруви', ru: 'Управление продажами' },
  signInTitle: { uz: 'Tizimga kirish', uz_cyrl: 'Тизимга кириш', ru: 'Вход в систему' },
  signInHint: {
    uz: 'Administrator login va parolini kiriting',
    uz_cyrl: 'Администратор логин ва паролини киритинг',
    ru: 'Введите логин и пароль администратора',
  },
  setupTitle: { uz: 'Birinchi ishga tushirish', uz_cyrl: 'Биринчи ишга тушириш', ru: 'Первый запуск' },
  setupHint: {
    uz: 'Administrator uchun login va parol tanlang. Ularni eslab qoling — keyin shu bilan kirasiz.',
    uz_cyrl: 'Администратор учун логин ва парол танланг. Уларни эслаб қолинг — кейин шу билан кирасиз.',
    ru: 'Придумайте логин и пароль администратора. Запомните их — дальше вход только по ним.',
  },
  username: { uz: 'Login', uz_cyrl: 'Логин', ru: 'Логин' },
  password: { uz: 'Parol', uz_cyrl: 'Парол', ru: 'Пароль' },
  repeat: { uz: 'Parolni takrorlang', uz_cyrl: 'Паролни такрорланг', ru: 'Повторите пароль' },
  usernameHint: { uz: 'Kamida 3 ta belgi', uz_cyrl: 'Камида 3 та белги', ru: 'Не менее 3 символов' },
  passwordHint: { uz: 'Kamida 8 ta belgi', uz_cyrl: 'Камида 8 та белги', ru: 'Не менее 8 символов' },
  signIn: { uz: 'Kirish', uz_cyrl: 'Кириш', ru: 'Войти' },
  create: { uz: 'Yaratish va kirish', uz_cyrl: 'Яратиш ва кириш', ru: 'Создать и войти' },
  wait: { uz: 'Kuting…', uz_cyrl: 'Кутинг…', ru: 'Подождите…' },
  retry: { uz: 'Qayta urinish', uz_cyrl: 'Қайта уриниш', ru: 'Повторить' },
  wrong: { uz: 'Login yoki parol notoʻgʻri', uz_cyrl: 'Логин ёки парол нотўғри', ru: 'Неверный логин или пароль' },
  tooMany: {
    uz: 'Juda koʻp urinish. 10 daqiqadan soʻng qayta urinib koʻring.',
    uz_cyrl: 'Жуда кўп уриниш. 10 дақиқадан сўнг қайта уриниб кўринг.',
    ru: 'Слишком много попыток. Попробуйте снова через 10 минут.',
  },
  offline: {
    uz: 'Serverga ulanib boʻlmadi. Server ishlayotganini tekshiring.',
    uz_cyrl: 'Серверга уланиб бўлмади. Сервер ишлаётганини текширинг.',
    ru: 'Не удалось подключиться к серверу. Проверьте, что он запущен.',
  },
  tooShort: {
    uz: 'Login kamida 3, parol kamida 8 ta belgidan iborat boʻlsin',
    uz_cyrl: 'Логин камида 3, парол камида 8 та белгидан иборат бўлсин',
    ru: 'Логин — не менее 3 символов, пароль — не менее 8',
  },
  mismatch: { uz: 'Parollar mos kelmadi', uz_cyrl: 'Пароллар мос келмади', ru: 'Пароли не совпадают' },
  alreadySetUp: {
    uz: 'Administrator allaqachon yaratilgan. Login va parol bilan kiring.',
    uz_cyrl: 'Администратор аллақачон яратилган. Логин ва парол билан киринг.',
    ru: 'Администратор уже создан. Войдите по логину и паролю.',
  },
} satisfies Record<string, Tri>;

const LANGS: { key: Language; label: string }[] = [
  { key: 'uz', label: 'UZ' },
  { key: 'uz_cyrl', label: 'ЎЗ' },
  { key: 'ru', label: 'RU' },
];

type Mode = 'loading' | 'offline' | 'setup' | 'login';

export const Login: React.FC<{ onSignedIn: (token: string) => void }> = ({ onSignedIn }) => {
  const L = useL();
  const { lang, setLang } = useLanguage();
  const [mode, setMode] = useState<Mode>('loading');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<Tri | string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadStatus = () => {
    setMode('loading');
    setError(null);
    apiFetch(`${API}/auth/status`)
      .then((r) => r.json())
      .then((d) => setMode(d.needsSetup ? 'setup' : 'login'))
      .catch(() => setMode('offline'));
  };
  useEffect(loadStatus, []);

  const isSetup = mode === 'setup';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSetup) {
      if (username.trim().length < 3 || password.length < 8) return setError(T.tooShort);
      if (password !== repeat) return setError(T.mismatch);
    }
    setBusy(true);
    try {
      const res = await apiFetch(
        `${API}/auth/${isSetup ? 'setup' : 'login'}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) },
        { keepSessionOn401: true }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        setToken(data.token);
        onSignedIn(data.token);
        return;
      }
      if (res.status === 401) setError(T.wrong);
      else if (res.status === 429) setError(T.tooMany);
      else if (res.status === 400) setError(T.tooShort);
      else if (res.status === 403 && isSetup) {
        setError(T.alreadySetUp);
        setMode('login');
      } else setError(data.error || `${L(COMMON.error)}: HTTP ${res.status}`);
    } catch {
      setError(T.offline);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-900 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center justify-between gap-3 mb-6 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-brand-500 shrink-0">
              <img src="/logo.png" alt="RCandy" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="text-[20px] font-bold tracking-tight leading-tight">RCandy</div>
              <div className="text-xs text-ink-400 truncate">{L(T.subtitle)}</div>
            </div>
          </div>
          <Segmented value={lang} onChange={setLang} options={LANGS} />
        </div>

        <div className="bg-white rounded-card shadow-card p-6 md:p-7">
          {mode === 'loading' && <div className="py-10 text-center text-sm text-ink-400">{L(COMMON.loading)}</div>}

          {mode === 'offline' && (
            <div className="py-6 flex flex-col items-center text-center gap-4">
              <p className="text-sm text-rose-600">{L(T.offline)}</p>
              <Button variant="secondary" icon={RefreshCw} onClick={loadStatus}>
                {L(T.retry)}
              </Button>
            </div>
          )}

          {(mode === 'login' || mode === 'setup') && (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-11 h-11 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                  {isSetup ? <ShieldCheck className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h1 className="text-[19px] font-bold tracking-tight">{L(isSetup ? T.setupTitle : T.signInTitle)}</h1>
                  <p className="text-[13px] text-ink-400 mt-0.5">{L(isSetup ? T.setupHint : T.signInHint)}</p>
                </div>
              </div>

              <Field
                label={L(T.username)}
                value={username}
                autoComplete="username"
                autoFocus
                hint={isSetup ? L(T.usernameHint) : undefined}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Field
                label={L(T.password)}
                type="password"
                value={password}
                autoComplete={isSetup ? 'new-password' : 'current-password'}
                hint={isSetup ? L(T.passwordHint) : undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isSetup && (
                <Field
                  label={L(T.repeat)}
                  type="password"
                  value={repeat}
                  autoComplete="new-password"
                  onChange={(e) => setRepeat(e.target.value)}
                />
              )}

              {error && (
                <div className="rounded-xl2 bg-rose-50 text-rose-600 text-[13px] font-medium px-4 py-3">
                  {typeof error === 'string' ? error : L(error)}
                </div>
              )}

              <Button type="submit" disabled={busy || !username.trim() || !password} className="w-full">
                {busy ? L(T.wait) : L(isSetup ? T.create : T.signIn)}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
