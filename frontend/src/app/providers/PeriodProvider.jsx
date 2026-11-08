import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PeriodContext = createContext(null);
function isValidRange(from, to) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '')) return false;
  const parsedFrom = new Date(`${from}T00:00:00Z`);
  const parsedTo = new Date(`${to}T00:00:00Z`);
  if (parsedFrom.toISOString().slice(0, 10) !== from || parsedTo.toISOString().slice(0, 10) !== to) return false;
  const start = parsedFrom.getTime();
  const end = parsedTo.getTime();
  return Number.isFinite(start) && Number.isFinite(end) && start <= end;
}

function daysBetween(from, to) {
  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 30;
  return Math.max(1, Math.min(365, Math.round((end - start) / 86400000) + 1));
}

export function PeriodProvider({ children }) {
  const [period, setPeriod] = useState('30d');
  const [customRange, setCustomRange] = useState({ from: '2026-10-01', to: '2026-10-31' });
  const [draftCustomRange, setDraftCustomRange] = useState(customRange);
  const customRangeValid = isValidRange(draftCustomRange.from, draftCustomRange.to);
  const customDays = daysBetween(customRange.from, customRange.to);
  const applyCustomRange = useCallback(() => {
    if (!customRangeValid) return false;
    setCustomRange(draftCustomRange);
    setPeriod('custom');
    return true;
  }, [customRangeValid, draftCustomRange]);
  const customRangeError = !customRangeValid
    ? (!draftCustomRange.from || !draftCustomRange.to ? 'Selecciona ambas fechas.' : 'La fecha inicial debe ser anterior o igual a la fecha final.')
    : '';
  const value = useMemo(() => ({
    period, setPeriod, customRange, customDays, draftCustomRange, setDraftCustomRange,
    customRangeValid, customRangeError, applyCustomRange,
  }), [period, customRange, customDays, draftCustomRange, customRangeValid, customRangeError, applyCustomRange]);
  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}
export function usePeriod() {
  const value = useContext(PeriodContext);
  if (!value) throw new Error('usePeriod debe usarse dentro de PeriodProvider');
  return value;
}
