import { ancestors, upgradeHierarchy, drillTarget } from "./src/hierarchy.js";
import test from "node:test";
import assert from "node:assert/strict";
import { seed } from "./src/seed.js";
test("all four attachment sides round-trip; old models retain compatibility", () => {
  validateModel(structuredClone(seed));
  for (const sourceHandle of ["top", "right", "bottom", "left"]) {
    for (const targetHandle of ["top", "right", "bottom", "left"]) {
      const m = structuredClone(seed);
      Object.assign(m.relations[0], { sourceHandle, targetHandle });
      assert.deepEqual(validateModel(JSON.parse(JSON.stringify(m))), m);
    }
  }
  const m = structuredClone(seed);
  m.relations[0].targetHandle = "invalid";
  assert.throws(() => validateModel(m), /attachment side/);
});
test("arrow options round-trip and invalid appearance is rejected", () => {
  const m = structuredClone(seed);
  Object.assign(m.relations[0], {
    lineType: "straight",
    startArrow: "open",
    endArrow: "none",
    color: "#ff6600",
    width: 4,
    dashed: true,
    animated: true,
  });
  assert.deepEqual(validateModel(JSON.parse(JSON.stringify(m))), m);
  for (const patch of [
    { width: -1 },
    { color: "bad" },
    { lineType: "unknown" },
    { startArrow: "bad" },
    { animated: "yes" },
  ]) {
    const invalid = structuredClone(m);
    Object.assign(invalid.relations[0], patch);
    assert.throws(() => validateModel(invalid), /appearance/);
  }
});
import {
  templates,
  validateModel,
  instantiate,
  removeFromView,
  removeView,
} from "./src/model.js";
test("seed JSON round-trips with all drill targets and shared references intact", () => {
  const m = validateModel(JSON.parse(JSON.stringify(seed)));
  assert.equal(
    m.objects.find((o) => o.id === "fieldwork").drillTo,
    "containers",
  );
  assert.equal(m.objects.find((o) => o.id === "api").drillTo, "components");
  assert.equal(
    m.views.filter((v) => v.objectIds.includes("capabilities")).length,
    2,
  );
});
test("every template creates independently identified editable objects", () => {
  let m = structuredClone(seed);
  for (const key of Object.keys(templates))
    for (let i = 0; i < 2; i++) {
      const result = instantiate(m, key, "Example");
      m = validateModel(result.model);
      assert.equal(m.views.at(-1).template, key);
    }
  assert.equal(
    m.views.length,
    seed.views.length + 2 * Object.keys(templates).length,
  );
});
test("removing a reference preserves shared objects and other views", () => {
  const m = removeFromView(seed, "components", ["capabilities"]);
  assert.ok(m.objects.find((o) => o.id === "capabilities"));
  assert.ok(
    m.views.find((v) => v.id === "frontend").objectIds.includes("capabilities"),
  );
  assert.ok(
    !m.views
      .find((v) => v.id === "components")
      .objectIds.includes("capabilities"),
  );
  validateModel(m);
});
test("removing a view clears inbound drill links without removing shared objects", () => {
  const m = validateModel(removeView(seed, "containers"));
  assert.equal(m.views.length, seed.views.length - 1);
  assert.equal(m.objects.length, seed.objects.length);
  assert.equal(m.objects.find((o) => o.id === "fieldwork").drillTo, undefined);
});
test("import rejects broken endpoints, drill targets, duplicate IDs and invalid coordinates", () => {
  for (const mutate of [
    (m) => (m.relations[0].source = "missing"),
    (m) => (m.objects[0].drillTo = "missing"),
    (m) => m.objects.push(m.objects[0]),
    (m) => (m.views[0].positions.member.x = "oops"),
    (m) => (m.views[0].template = "unknown"),
  ]) {
    const m = structuredClone(seed);
    mutate(m);
    assert.throws(() => validateModel(m));
  }
});

test("hierarchy migration preserves existing diagrams and creates ownership paths once", () => {
  const old = structuredClone(seed);
  old.views[0].positions.member = { x: 123, y: 456 };
  old.relations[0].color = "#123456";
  const model = validateModel(upgradeHierarchy(old));
  assert.deepEqual(model.objects.slice(0, old.objects.length), old.objects);
  assert.deepEqual(model.relations.slice(0, old.relations.length), old.relations);
  assert.deepEqual(model.views[0].objectIds, ["fieldwork", "portfolio-model-studio", "portfolio-orders-lab"]);
  for (const view of old.views)
    assert.deepEqual(
      model.views.find((v) => v.id === view.id).positions,
      view.positions,
    );
  assert.deepEqual(
    ancestors(model, "process").map((v) => v.id),
    ["service-landscape", "context", "containers", "components"],
  );
  assert.equal(
    model.views.find((v) => v.id === "components").ownerObjectId,
    "api",
  );
  assert.equal(
    model.views.find((v) => v.id === "frontend").ownerObjectId,
    "web",
  );
  assert.deepEqual(upgradeHierarchy(model), model);
  assert.equal(
    drillTarget(
      model,
      model.views[0],
      model.objects.find((o) => o.id === "fieldwork"),
    ),
    "context",
  );
});
test("hierarchy rejects cycles and owners outside the parent; deletion retains descendants", () => {
  const model = upgradeHierarchy(seed);
  const cycle = structuredClone(model);
  cycle.views[0].parentViewId = "components";
  assert.throws(() => validateModel(cycle), /cycle/);
  const invalid = structuredClone(model);
  invalid.views.find((v) => v.id === "components").ownerObjectId = "member";
  assert.throws(() => validateModel(invalid), /owner/);
  const removed = validateModel(removeView(model, "containers"));
  assert.equal(
    removed.views.find((v) => v.id === "components").parentViewId,
    "context",
  );
  assert.equal(
    removed.views.find((v) => v.id === "components").ownerObjectId,
    undefined,
  );
  validateModel(removeFromView(model, "containers", ["api"]));
});


import { upgradeFrontend } from './src/next-page.js';
test('Next.js page migration preserves diagrams and links source-backed behavior', () => {
  const original = upgradeHierarchy(structuredClone(seed));
  const model = validateModel(upgradeFrontend(original));
  const page = model.views.find(v => v.template === 'NEXT');
  assert.equal(page.pageSpec.route, '/');
  assert.equal(model.views.find(v => v.id === 'containers').drillTargets.web, page.id);
  assert.deepEqual(model.views.find(v => v.id === 'frontend'), original.views.find(v => v.id === 'frontend'));
  assert.deepEqual(model.objects, original.objects);
  assert.deepEqual(upgradeFrontend(model), model);
  assert.deepEqual(validateModel(JSON.parse(JSON.stringify(model))), model);
  for (const rows of Object.values(page.pageSpec.sections)) for (const row of rows) for (const source of row.sources) {
    assert.ok(source.path.startsWith('apps/web/src/'));
    assert.ok(source.symbol);
  }
});

import { upgradePageExamples } from './src/next-page.js';
test('page examples add distinct routes and preserve edited page metadata', () => {
  const model=upgradeFrontend(upgradeHierarchy(structuredClone(seed)));
  model.views.find(v=>v.id==='next-workspace-page').pageSpec.rendering='User rendering note';
  const updated=validateModel(upgradePageExamples(model));
  const pages=updated.views.filter(v=>v.template==='NEXT');
  assert.equal(pages.length,3);
  assert.equal(pages[0].pageSpec.rendering,'User rendering note');
  assert.equal(pages.find(v=>v.pageSpec.route==='/guide').pageSpec.sections.Realtime.length,0);
  assert.equal(pages.find(v=>v.pageSpec.route==='/orders-lab').pageSpec.sections['API & triggers'].length,3);
  assert.ok(pages.every(v=>v.pageSpec.sections['Browser storage'].length===1));
  assert.deepEqual(upgradePageExamples(updated),updated);
});

import { contractsFor } from './src/contracts.js';
import { pageSpec, extraPages } from './src/next-page.js';
test('documented API entries expose request and response contracts', () => {
  for(const spec of [pageSpec,...extraPages.map(p=>p.spec)]) for(const item of spec.sections['API & triggers']) {
    const contracts=contractsFor(item);
    assert.ok(contracts.length, item.name);
    for(const contract of contracts) { assert.ok(contract.request); assert.ok(contract.response); }
  }
  const subscription=contractsFor(pageSpec.sections.Realtime[0])[0];
  assert.match(subscription.response,/entityId: string/);
});

import { compactPageRows } from './src/compact-page.js';
test('network cards split operations and merge one subscription lifecycle', () => {
  const rows=compactPageRows(pageSpec.sections);
  assert.equal(rows.filter(r=>r.section==='API').length,6);
  assert.equal(rows.filter(r=>r.section==='Realtime').length,1);
  assert.ok(rows.filter(r=>r.contract).every(r=>r.related.length===0));
  const custom=compactPageRows({'API & triggers':[{name:'Fetch',detail:'',contracts:[{name:'Fetch',request:'{}',response:'{}'}],tanstackQuery:{queryKey:['items'],staleTime:30000}}]});
  assert.deepEqual(custom[0].tanstackQuery.queryKey,['items']);
});

import { upgradeProjectState } from './src/project-state.js';
import { pageTabs } from './src/compact-page.js';
test('project state migration combines storage references and preserves existing edits', () => {
 const original=upgradePageExamples(upgradeFrontend(upgradeHierarchy(structuredClone(seed))));
 const updated=validateModel(upgradeProjectState(original));
 assert.equal(original.projectState, undefined);
 const storage=updated.projectState.entries.filter(e=>e.name==='Browser storage');
 assert.equal(storage.length,1);
 assert.equal(storage[0].viewIds.length,3);
 assert.ok(updated.projectState.entries.some(e=>e.table.values.some(r=>r[0]==='actor')));
 storage[0].detail='Edited registry note';
 assert.equal(upgradeProjectState(updated).projectState.entries.find(e=>e.id===storage[0].id).detail,'Edited registry note');
 assert.deepEqual(pageTabs,['Components','API & realtime']);
 assert.deepEqual(validateModel(JSON.parse(JSON.stringify(updated))).projectState,updated.projectState);
});
