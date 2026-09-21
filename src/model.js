import { ancestors } from "./hierarchy.js";
import { validateShape } from './model-schema.js';
export const templates = {
  REDIS: { name: "Redis keys & channels", hint: "Key patterns, payloads, expiry and consumers.", kinds: ["database"] },
  AGENT: { name: "Agent workflow", hint: "NestJS and LangGraph workflow design, tools and run contracts.", kinds: ["service"] },
  NEXT: { name: "Next.js page", hint: "Page behavior, rendering, permissions, data, and source references.", kinds: ["component"] },
  C0: {
    name: "Product landscape",
    hint: "Products and their system contexts. Explore a product to open C1. C0 is our custom portfolio level.",
    kinds: ["system", "external"],
  },
  C1: {
    name: "System context",
    hint: "People, your system, and external systems.",
    kinds: ["person", "system", "external"],
  },
  C2: {
    name: "Containers",
    hint: "Applications, services, databases, and their connections.",
    kinds: ["application", "service", "database", "external"],
  },
  C3: {
    name: "Modules",
    hint: "Modules within one service. Hover Relations to preview connections; click to keep them visible and edit.",
    kinds: ["module"],
  },
  INTERNAL: {
    name: "Module internals",
    hint: "Selected providers and their responsibilities within a module.",
    kinds: ["component", "policy", "query", "use-case"],
  },
  ERD: {
    name: "Data model",
    hint: "Expandable domains and tables. Field references open the related table.",
    kinds: ["entity"],
  },
  BPMN: {
    name: "Process",
    hint: "Basic BPMN-style sketch: events, tasks, gateways. Not executable BPMN.",
    kinds: ["event", "task", "gateway", "policy"],
  },
};
export function uid(prefix = "item") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
export function validateModel(m) {
  if (
    !m ||
    m.version !== 1 ||
    !Array.isArray(m.objects) ||
    !Array.isArray(m.relations) ||
    !Array.isArray(m.views) ||
    !m.views.length
  )
    throw Error(
      "Expected a version 1 model with objects, relations, and views.",
    );
  if (m.name != null && typeof m.name !== "string")
    throw Error("Model name must be text.");
  const unique = (xs) =>
    xs.every((x) => x && typeof x.id === "string" && x.id.length) &&
    new Set(xs.map((x) => x.id)).size === xs.length;
  if (![m.objects, m.relations, m.views].every(unique))
    throw Error("IDs must be non-empty and unique within each collection.");
  const ids = new Set(m.objects.map((x) => x.id)),
    views = new Set(m.views.map((x) => x.id));
  for (const o of m.objects)
    if (
      typeof o.name !== "string" ||
      typeof o.kind !== "string" ||
      (o.description != null && typeof o.description !== "string") ||
      (o.fields != null && typeof o.fields !== "string") ||
      (o.technology != null && typeof o.technology !== "string") ||
      (o.drillTo && !views.has(o.drillTo))
    )
      throw Error("Invalid object properties or drill-down target.");
  for (const r of m.relations) {
    if (
      ["sourceHandle", "targetHandle"].some(
        (k) =>
          r[k] != null && !["top", "right", "bottom", "left"].includes(r[k]),
      )
    )
      throw Error("Invalid relationship attachment side.");
    if (!ids.has(r.source) || !ids.has(r.target) || typeof r.label !== "string")
      throw Error("A relationship has an invalid endpoint or label.");
    if (
      (r.lineType != null &&
        !["smoothstep", "step", "default", "straight"].includes(r.lineType)) ||
      (r.color != null &&
        (typeof r.color !== "string" || !/^#[0-9a-f]{6}$/i.test(r.color))) ||
      (r.width != null && ![1, 1.5, 2, 3, 4, 6].includes(r.width)) ||
      ["startArrow", "endArrow"].some(
        (k) => r[k] != null && !["none", "open", "closed"].includes(r[k]),
      ) ||
      ["dashed", "animated"].some(
        (k) => r[k] != null && typeof r[k] !== "boolean",
      )
    )
      throw Error("Invalid relationship appearance.");
  }
  for (const v of m.views) {
    if (v.parentViewId && !views.has(v.parentViewId))
      throw Error("View parent does not exist.");
    if (
      v.ownerObjectId &&
      (!v.parentViewId ||
        !m.views
          .find((p) => p.id === v.parentViewId)
          ?.objectIds.includes(v.ownerObjectId))
    )
      throw Error("The owner must belong to the parent view.");
    if (
      v.drillTargets &&
      Object.entries(v.drillTargets).some(
        ([id, target]) => !ids.has(id) || (target !== "" && !views.has(target)),
      )
    )
      throw Error("Invalid view drill target.");
    ancestors(m, v.id);
    if (
      !Object.hasOwn(templates, v.template) ||
      typeof v.name !== "string" ||
      !Array.isArray(v.objectIds) ||
      new Set(v.objectIds).size !== v.objectIds.length ||
      v.objectIds.some((id) => !ids.has(id))
    )
      throw Error("Invalid view template or object reference.");
    if (!v.positions || typeof v.positions !== "object")
      throw Error("View positions are missing.");
    for (const p of Object.values(v.positions))
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y))
        throw Error("Positions must contain finite x/y numbers.");
  }
  validateShape(m);
  if(m.layouts&&!unique(m.layouts))throw Error('Layout IDs must be non-empty and unique.');
  for(const view of m.views){
    if(view.pageSpec?.layoutIds?.some(id=>!m.layouts?.some(layout=>layout.id===id)))throw Error(`views/${view.id}/pageSpec/layoutIds references a missing layout.`);
    const spec=view.moduleSpec;
    if(spec){
      if(!views.has(spec.databaseViewId))throw Error(`views/${view.id}/moduleSpec/databaseViewId references a missing view.`);
      if(!unique(spec.operations)||!unique(spec.policies))throw Error(`views/${view.id}/moduleSpec IDs must be unique.`);
      const policyIds=new Set(spec.policies.map(p=>p.id));
      for(const item of [...spec.domains,...spec.operations,...spec.domains.flatMap(domain=>domain.fields.map(f=>f.capabilities).filter(Boolean))]){
        if(item.policyIds.some(id=>!policyIds.has(id)))throw Error(`views/${view.id}/moduleSpec has a missing policy reference.`);
      }
    }
  }
  return m;
}
export function removeFromView(model, viewId, ids) {
  return {
    ...model,
    views: model.views.map((v) =>
      v.id === viewId
        ? { ...v, objectIds: v.objectIds.filter((id) => !ids.includes(id)) }
        : v.parentViewId === viewId && ids.includes(v.ownerObjectId)
          ? { ...v, ownerObjectId: undefined }
          : v,
    ),
  };
}
export function removeView(model, viewId) {
  if (model.views.length < 2) return model;
  return {
    ...model,
    views: model.views
      .filter((v) => v.id !== viewId)
      .map((v) => ({
        ...v,
        ...(v.parentViewId === viewId
          ? {
              parentViewId: model.views.find((p) => p.id === viewId)
                ?.parentViewId,
              ownerObjectId: undefined,
            }
          : {}),
        ...(v.drillTargets
          ? {
              drillTargets: Object.fromEntries(
                Object.entries(v.drillTargets).filter(
                  ([, target]) => target !== viewId,
                ),
              ),
            }
          : {}),
      })),
    objects: model.objects.map((o) =>
      o.drillTo === viewId ? { ...o, drillTo: undefined } : o,
    ),
  };
}
export function instantiate(
  model,
  template,
  name,
  parentViewId,
  ownerObjectId,
) {
  const kinds = templates[template].kinds;
  const objects = kinds.map((kind, i) => ({
    id: uid(kind),
    kind,
    name: {
      person: "User",
      system: "New system",
      external: "External system",
      application: "Web app",
      service: "API service",
      database: "Database",
      component: "Entry point",
      module: "NewModule",
      policy: "Policy",
      query: "Read query",
      "use-case": "Use-case",
      entity: "Entity",
      event: "Start",
      task: "Task",
      gateway: "Decision",
    }[kind],
    description: "",
  }));
  const id = uid("view");
  return {
    model: {
      ...model,
      objects: [...model.objects, ...objects],
      views: [
        ...model.views,
        {
          id,
          name,
          template,
          parentViewId: parentViewId || undefined,
          ownerObjectId: ownerObjectId || undefined,
          objectIds: objects.map((o) => o.id),
          positions: Object.fromEntries(
            objects.map((o, i) => [o.id, { x: i * 330, y: 100 }]),
          ),
        },
      ],
    },
    id,
  };
}
