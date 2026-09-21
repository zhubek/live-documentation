import { structureFor } from './structured-page.js';

export function upgradeComponentTree(model) {
  if (model.componentTreeVersion === 1) return model;
  const next = structuredClone(model);
  next.layouts = next.layouts || [];
  if (!next.layouts.some(l => l.id === 'root-layout')) next.layouts.push({
    id: 'root-layout', name: 'RootLayout', boundary: 'Server',
    structure: { props: [['children', 'React.ReactNode', 'Nested layout or page']] },
    detail: 'Shared HTML/body wrapper and global styles.',
    sources: [{ path: 'apps/web/src/app/layout.tsx', symbol: 'RootLayout' }],
  });
  const relationships = {
    'Page → Workspace': ['workspace', null, 'Workspace', 'Client'],
    'Workspace → WorkspaceSession': ['session', 'workspace', 'WorkspaceSession', 'Client'],
    'WorkspaceSession → AssignmentDetail': ['detail', 'session', 'AssignmentDetail', 'Client'],
    'WorkspaceSession → CreateAssignment': ['create', 'session', 'CreateAssignment', 'Client'],
    'Page → OrdersLab': ['orders', null, 'OrdersLab', 'Client'],
    'Guide → static content + navigation': ['guide', null, 'Guide content', 'Server'],
  };
  for (const view of next.views.filter(v => ['next-workspace-page','next-orders-page','next-guide-page'].includes(v.id))) {
    view.pageSpec.layoutIds ??= ['root-layout'];
    view.pageSpec.sections.Components = (view.pageSpec.sections.Components || []).map((item, i) => {
      const [id, parentId, componentName, boundary] = relationships[item.name] || [`component-${i}`, null, item.name, 'Not documented'];
      return { ...item, componentId: item.componentId || id, parentComponentId: item.parentComponentId ?? parentId, componentName: item.componentName || componentName, boundary: item.boundary || boundary, structure: item.structure || structureFor({ ...item, section: 'Components' }) };
    });
  }
  next.componentTreeVersion = 1;
  return next;
}
