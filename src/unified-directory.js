import { removeView } from './model.js';
export function upgradeUnifiedDirectory(model) {
  if (model.unifiedDirectoryVersion === 1) return model;
  let next = structuredClone(model);
  const rootPage = next.views.find(v => v.id === 'next-workspace-page');
  if (rootPage) {
    if (next.views.some(v => v.id === 'frontend')) next = removeView(next, 'frontend');
    const frontend = next.objects.find(o => o.id === 'web');
    if (frontend) frontend.drillTo = rootPage.id;
    const containers = next.views.find(v => v.id === 'containers');
    if (containers) containers.drillTargets = { ...containers.drillTargets, web: rootPage.id };
    if (next.projectState) next.projectState.entries = next.projectState.entries.map(e => ({ ...e, viewIds: e.viewIds.map(id => id === 'frontend' ? rootPage.id : id) }));
  }
  next.unifiedDirectoryVersion = 1;
  return next;
}
