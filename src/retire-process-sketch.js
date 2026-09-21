import { removeView } from './model.js';

export function retireProcessSketch(model) {
  if (model.retiredProcessSketchVersion === 1) return model;
  const next = model.views.some(view => view.id === 'process')
    ? removeView(model, 'process') : structuredClone(model);
  next.retiredProcessSketchVersion = 1;
  return next;
}
