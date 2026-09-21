import { stateRows } from './page-state.js';

// Collect once into the project model; page references describe usage, not ownership.
export function upgradeProjectState(model) {
  if (model.projectStateVersion === 1) return model;
  const next = structuredClone(model);
  const entries = new Map();
  for (const view of next.views.filter(v => v.template === 'NEXT' && v.pageSpec)) {
    for (const row of stateRows(view.pageSpec)) {
      const key = JSON.stringify([row.name, row.table, row.detail]);
      const existing = entries.get(key);
      if (existing) {
        existing.viewIds.push(view.id);
        for (const source of row.sources || []) if (!existing.sources.some(s => s.path === source.path && s.symbol === source.symbol)) existing.sources.push(source);
      } else entries.set(key, { ...row, id: `state-${entries.size + 1}`, sources: row.sources || [], viewIds: [view.id], example: view.id === 'next-tanstack-example' });
    }
  }
  next.projectState = next.projectState || { entries: [...entries.values()] };
  next.projectStateVersion = 1;
  return next;
}
