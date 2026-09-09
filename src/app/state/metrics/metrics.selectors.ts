import { createSelector } from '@ngrx/store';

import { selectHistory } from './metrics.reducer';

export { selectHistory };

export const selectAvgTotalMs = createSelector(selectHistory, history => {
  if (history.length === 0) return null;
  return Math.round(history.reduce((sum, h) => sum + h.totalMs, 0) / history.length);
});

export const selectTotalTokens = createSelector(selectHistory, history =>
  history.reduce((sum, h) => sum + h.tokens, 0),
);

export const selectAvgKqmlTurns = createSelector(selectHistory, history => {
  const withTurns = history.filter(h => h.kqmlTurns !== null);
  if (withTurns.length === 0) return null;
  return withTurns.reduce((sum, h) => sum + (h.kqmlTurns as number), 0) / withTurns.length;
});

export const selectAvgCompleteness = createSelector(selectHistory, history => {
  const withCompleteness = history.filter(h => h.completenessPct !== null);
  if (withCompleteness.length === 0) return null;
  return (
    withCompleteness.reduce((sum, h) => sum + (h.completenessPct as number), 0) /
    withCompleteness.length
  );
});
