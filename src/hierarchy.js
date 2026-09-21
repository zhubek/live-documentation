// Ownership belongs to views; shared objects can appear at multiple levels.
export function ancestors(model, id) {
  const result = [],
    seen = new Set([id]);
  let view = model.views.find((v) => v.id === id);
  while (view?.parentViewId) {
    if (seen.has(view.parentViewId))
      throw Error("View hierarchy contains a cycle.");
    seen.add(view.parentViewId);
    view = model.views.find((v) => v.id === view.parentViewId);
    if (!view) throw Error("View parent does not exist.");
    result.unshift(view);
  }
  return result;
}
export function upgradeHierarchy(model) {
  if (model.hierarchyVersion === 1) return upgradeProductLandscape(model);
  const result = structuredClone(model);
  result.hierarchyVersion = 1;
  const byId = new Map(result.views.map((v) => [v.id, v]));
  const objects = new Set(result.objects.map((o) => o.id));
  if (byId.has("context") && objects.has("fieldwork")) {
    const id = byId.has("landscape") ? "landscape" : "service-landscape";
    if (!byId.has(id)) {
      const ids = result.objects
        .filter((o) =>
          ["system", "application", "service", "database", "external"].includes(
            o.kind,
          ),
        )
        .map((o) => o.id);
      const landscape = {
        id,
        name: "Service landscape",
        template: "C0",
        objectIds: ids,
        drillTargets: { fieldwork: "context" },
        positions: Object.fromEntries(
          ids.map((id, i) => [
            id,
            { x: (i % 3) * 380, y: Math.floor(i / 3) * 290 },
          ]),
        ),
      };
      result.views.unshift(landscape);
      byId.set(id, landscape);
    }
    const links = {
      context: [id, "fieldwork"],
      containers: ["context", "fieldwork"],
      components: ["containers", "api"],
      frontend: ["containers", "web"],
      data: ["containers", "postgres"],
      process: ["components", "usecase"],
    };
    for (const [child, [parent, owner]] of Object.entries(links)) {
      const v = byId.get(child),
        p = byId.get(parent);
      if (v && p && !v.parentViewId && p.objectIds.includes(owner))
        Object.assign(v, { parentViewId: parent, ownerObjectId: owner });
    }
  }
  return upgradeProductLandscape(result);
}
export function drillTarget(model, view, object) {
  if (view.drillTargets && Object.hasOwn(view.drillTargets, object.id))
    return view.drillTargets[object.id];
  const child = model.views.find(
    (v) => v.parentViewId === view.id && v.ownerObjectId === object.id,
  );
  return child?.id || view.drillTargets?.[object.id] || object.drillTo;
}

// One-time update of the original generated landscape; preserve lower-level views.
export function upgradeProductLandscape(model) {
  if (model.productLandscapeVersion === 1) return model;
  const result = structuredClone(model);
  result.productLandscapeVersion = 1;
  const landscape = result.views.find((v) => v.id === "service-landscape" && v.template === "C0");
  if (!landscape || !result.objects.some((o) => o.id === "fieldwork")) return result;
  const products = [
    { id: "portfolio-model-studio", name: "Model Studio", description: "Architecture diagram constructor: shared models, editable views, and drill-down.", person: "Model author", action: "Creates and explores architecture models." },
    { id: "portfolio-orders-lab", name: "Orders Lab", description: "Order workflow learning example. A comparison experience within Fieldwork, not a separately deployed service.", person: "Lab learner", action: "Explores the original order workflow example." },
  ];
  for (const p of products) {
    const contextId = `${p.id}-context`, personId = `${p.id}-user`;
    if (result.objects.some((o) => o.id === p.id) || result.views.some((v) => v.id === contextId)) continue;
    result.objects.push({ id: p.id, kind: "system", name: p.name, description: p.description },
      { id: personId, kind: "person", name: p.person, description: p.action });
    result.relations.push({ id: `${p.id}-uses`, source: personId, target: p.id, label: "Uses" });
    result.views.push({ id: contextId, name: `${p.name} context`, template: "C1", parentViewId: landscape.id,
      ownerObjectId: p.id, objectIds: [personId, p.id], positions: { [personId]: { x: 0, y: 80 }, [p.id]: { x: 400, y: 80 } } });
  }
  const removed = new Set(["web", "api", "postgres", "redis", "sentry"]);
  landscape.name = "Product landscape";
  landscape.objectIds = [...new Set([...landscape.objectIds.filter((id) => !removed.has(id)), ...products.map((p) => p.id)])];
  landscape.positions = Object.fromEntries(landscape.objectIds.map((id, i) => [id, { x: (i % 3) * 390, y: Math.floor(i / 3) * 290 }]));
  landscape.drillTargets = { ...landscape.drillTargets, fieldwork: "context" };
  for (const p of products) landscape.drillTargets[p.id] = `${p.id}-context`;
  for (const id of removed) delete landscape.drillTargets[id];
  for (const v of result.views) if (v.parentViewId === landscape.id && removed.has(v.ownerObjectId)) delete v.ownerObjectId;
  return result;
}
