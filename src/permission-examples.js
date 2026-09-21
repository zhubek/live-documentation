export function upgradePermissionExamples(model) {
  if (model.permissionExamplesVersion === 1) return model;
  const next = structuredClone(model);
  const items = next.views.find(v => v.id === 'next-orders-page')?.pageSpec?.sections?.Components;
  const parent = items?.find(item => item.componentId === 'orders');
  if (parent) items.push({
    name: 'OrdersLab → OrderActions (example)', componentId: 'example-order-actions',
    parentComponentId: parent.componentId, componentName: 'OrderActions', boundary: 'Client', example: true,
    detail: 'Illustrative component split, not implemented in the application. Capabilities come from server policies. This sample allows the user to see Cancel, but disables it because the order is shipped. The backend still authorizes every mutation.',
    structure: { props: [
      ['orderId', 'string', '"ord_1042"', 'Passed to onCancel when clicked.'],
      ['cancel', '{ authorized: boolean; available: boolean; reason: string | null }', '{ authorized: true, available: false, reason: "Shipped orders cannot be cancelled" }', 'Visible when cancel.authorized; disabled when busy || !cancel.available; tooltip uses cancel.reason.'],
      ['busy', 'boolean', 'false', 'Disables Cancel while a request is running.'],
      ['onCancel', '(orderId: string) => Promise<void>', 'cancelOrder', 'Called with orderId when Cancel is enabled and clicked.'],
    ] },
  }, {
    name: 'OrdersLab → CreateOrderForm (example)', componentId: 'example-create-order-form',
    parentComponentId: parent.componentId, componentName: 'CreateOrderForm', boundary: 'Client', example: true,
    detail: 'Illustrative component split, not implemented in the application. These sample values show an allowed action. With canCreate=false, the form is hidden and the reason can be displayed instead.',
    structure: { props: [
      ['canCreate', 'boolean', 'true', 'Form visible when canCreate; supplied from the server viewer capability.'],
      ['reason', 'string | null', 'null', 'Explains why creating is unavailable when canCreate is false.'],
      ['submitting', 'boolean', 'false', 'Submit disabled when submitting; permission and request state remain separate.'],
      ['onSubmit', '(input: { customerName: string; total: number }) => Promise<void>', 'createOrder', 'Receives the typed form payload on submit.'],
    ] },
  });
  next.permissionExamplesVersion = 1;
  return next;
}
