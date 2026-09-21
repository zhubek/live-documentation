import { templates } from './model.js';
export const architectureTypes = ['C0', 'C1', 'C2', 'C3', 'INTERNAL'];
export const explorerGroup = template => architectureTypes.includes(template) ? 'ARCH' : template;
export const explorerGroups = Object.fromEntries([
  ['NEXT', templates.NEXT],
  ['ARCH', { name: 'Architecture' }],
  ...Object.entries(templates).filter(([key]) => key !== 'NEXT' && !architectureTypes.includes(key)),
]);
export function architectureFolders(model, view) {
  const names = [];
  const seen = new Set();
  let current = view;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const owner = model.objects.find(o => o.id === current.ownerObjectId);
    if (current.template === 'C1') names.unshift(`${owner?.name || current.name} · C1`);
    else if (current.template === 'C2') names.unshift(`${current.name} · C2`);
    else if (owner) names.unshift(owner.name);
    current = model.views.find(v => v.id === current.parentViewId);
  }
  return names.filter((name, i) => i === 0 || name !== names[i - 1]);
}
