import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CalendarCheck, Clock, Play, RotateCcw, Square } from 'lucide-react-native';
import { colors, space } from '../theme/colors';
import { AppText, Button, Card, IconCircle, Row } from './ui';
import { COMMON, Tri, useL } from '../i18n/tri';
import { formatTime } from '../utils/format';
import { Workday, isNetworkError, workdayService } from '../services/workdayService';

const T = {
  title: { uz: 'Ish kuni', uz_cyrl: 'Иш куни', ru: 'Рабочий день' },
  notStarted: { uz: 'Ish kuni hali boshlanmagan', uz_cyrl: 'Иш куни ҳали бошланмаган', ru: 'Рабочий день ещё не начат' },
  start: { uz: 'Ish kunini boshlash', uz_cyrl: 'Иш кунини бошлаш', ru: 'Начать рабочий день' },
  started: { uz: 'Ish boshlandi', uz_cyrl: 'Иш бошланди', ru: 'Работа начата' },
  end: { uz: 'Ish kunini tugatish', uz_cyrl: 'Иш кунини тугатиш', ru: 'Завершить рабочий день' },
  ended: { uz: 'Ish kuni tugadi', uz_cyrl: 'Иш куни тугади', ru: 'Рабочий день завершён' },
  reopen: { uz: 'Qayta ochish', uz_cyrl: 'Қайта очиш', ru: 'Открыть снова' },
  confirmEnd: {
    uz: 'Ish kunini tugatasizmi?',
    uz_cyrl: 'Иш кунини тугатасизми?',
    ru: 'Завершить рабочий день?',
  },
  offline: {
    uz: 'Internet yoʻq — keyinroq urinib koʻring',
    uz_cyrl: 'Интернет йўқ — кейинроқ уриниб кўринг',
    ru: 'Нет интернета — попробуйте позже',
  },
  loadError: { uz: 'Maʼlumot yuklanmadi', uz_cyrl: 'Маълумот юкланмади', ru: 'Не удалось загрузить' },
  retry: { uz: 'Qayta urinish', uz_cyrl: 'Қайта уриниш', ru: 'Повторить' },
} satisfies Record<string, Tri>;

/** Start / end of the working day for agents and drivers; refreshes when the screen gains focus */
export const WorkdayCard: React.FC = () => {
  const L = useL();
  const [workday, setWorkday] = useState<Workday | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const loaded = useRef(false);

  const load = useCallback(async () => {
    if (!loaded.current) setLoading(true);
    try {
      setWorkday(await workdayService.getToday());
      setLoadFailed(false);
      loaded.current = true;
    } catch {
      // keep the last known state; only show the error when nothing was loaded yet
      if (!loaded.current) setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const run = async (action: 'start' | 'end') => {
    setBusy(true);
    try {
      setWorkday(await (action === 'start' ? workdayService.start() : workdayService.end()));
      setLoadFailed(false);
      loaded.current = true;
    } catch (e: any) {
      const msg = isNetworkError(e) ? L(T.offline) : e?.response?.data?.error || L(COMMON.error);
      Alert.alert(L(COMMON.error), msg);
    } finally {
      setBusy(false);
    }
  };

  const askEnd = () =>
    Alert.alert(L(T.end), L(T.confirmEnd), [
      { text: L(COMMON.cancel), style: 'cancel' },
      { text: L(T.end), style: 'destructive', onPress: () => run('end') },
    ]);

  if (loading) {
    return (
      <Card>
        <Row gap={space.md}>
          <IconCircle icon={Clock} tone="neutral" />
          <AppText variant="strong" lines={1} style={styles.flex}>
            {L(T.title)}
          </AppText>
          <ActivityIndicator size="small" color={colors.primary} />
        </Row>
      </Card>
    );
  }

  if (loadFailed) {
    return (
      <Card>
        <Row gap={space.md}>
          <IconCircle icon={Clock} tone="warning" />
          <View style={styles.flex}>
            <AppText variant="strong" lines={1}>
              {L(T.title)}
            </AppText>
            <AppText variant="small" lines={2}>
              {L(T.loadError)}
            </AppText>
          </View>
          <Button title={L(T.retry)} variant="secondary" size="sm" icon={RotateCcw} onPress={load} />
        </Row>
      </Card>
    );
  }

  const ended = !!workday?.endAt;
  const started = !!workday && !ended;

  const status = ended
    ? `${L(T.ended)} ${formatTime(workday!.startAt)} – ${formatTime(workday!.endAt!)}`
    : started
      ? `${L(T.started)} ${formatTime(workday!.startAt)}`
      : L(T.notStarted);

  return (
    <Card>
      <Row gap={space.md}>
        <IconCircle icon={ended ? CalendarCheck : Clock} tone={ended ? 'neutral' : started ? 'success' : 'primary'} />
        <View style={styles.flex}>
          <AppText variant="strong" lines={1}>
            {L(T.title)}
          </AppText>
          <AppText variant="small" lines={1} fit>
            {status}
          </AppText>
        </View>
        {ended ? (
          <Button title={L(T.reopen)} variant="secondary" size="sm" icon={RotateCcw} loading={busy} onPress={() => run('start')} />
        ) : null}
      </Row>
      {!ended ? (
        <Button
          title={L(started ? T.end : T.start)}
          icon={started ? Square : Play}
          loading={busy}
          onPress={started ? askEnd : () => run('start')}
          style={styles.action}
        />
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  action: { marginTop: space.md },
});
