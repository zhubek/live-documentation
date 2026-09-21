import { contractsFor } from './contracts.js';
import { removeView } from './model.js';

function sample(name) {
  const keys = {
    Workspace: '["workspace", organizationId, actor, { projectId, status, search }]',
    Comments: '["comments", organizationId, actor, assignmentId]',
    DemoUsers: '["demoUsers"]',
    OrdersPage: '["orders", organizationId, actor, { includeTotal }]',
  };
  if (keys[name]) return {
    hook: 'useQuery', queryKey: keys[name],
    enabled: name === 'DemoUsers' ? true : name === 'Comments' ? 'Boolean(actor && assignmentId)' : 'Boolean(actor)',
    staleTime: name === 'DemoUsers' ? 300000 : 30000,
    gcTime: 300000, retry: 1, refetchOnWindowFocus: true, refetchOnReconnect: true,
  };
  if (!['Start', 'Complete', 'Create assignment', 'Add comment', 'CreateOrder', 'CancelOrder'].includes(name)) return null;
  const orders = ['CreateOrder', 'CancelOrder'].includes(name);
  return {
    hook: 'useMutation', mutationKey: JSON.stringify([name]) .replace(']', ', organizationId, actor]'),
    retry: 0,
    onSuccess: name === 'Add comment'
      ? '(_, variables) => Promise.all([queryClient.invalidateQueries({ queryKey: ["comments", organizationId, actor, variables.input.assignmentId] }), queryClient.invalidateQueries({ queryKey: ["workspace", organizationId, actor] })])'
      : `() => queryClient.invalidateQueries({ queryKey: ["${orders ? 'orders' : 'workspace'}", organizationId, actor] })`,
  };
}

export function upgradeInlineQueryExamples(model) {
  if (model.inlineQueryExamplesVersion === 1) return model;
  let next = structuredClone(model);
  const oldId = 'next-tanstack-example';
  if (next.views.some(v => v.id === oldId)) next = removeView(next, oldId);
  if (next.projectState) next.projectState.entries = next.projectState.entries
    .filter(e => !(e.example && e.viewIds.length === 1 && e.viewIds[0] === oldId))
    .map(e => ({ ...e, viewIds: e.viewIds.filter(id => id !== oldId) }));
  for (const view of next.views) {
    for (const item of view.pageSpec?.sections?.['API & triggers'] || []) {
      const contracts = contractsFor(item);
      if (contracts.length) item.contracts = contracts.map(contract => {
        const settings = sample(contract.name);
        return settings && !contract.tanstackExample ? { ...contract, tanstackExample: settings } : contract;
      });
    }
  }
  next.inlineQueryExamplesVersion = 1;
  return next;
}
