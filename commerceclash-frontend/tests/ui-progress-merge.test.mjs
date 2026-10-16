import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { fileURLToPath } from "node:url";

const src = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src");
// Execute real component code with isolated React/timer adapters. These tests
// cover presentation/state integration, not browser layout or screenshots.
function mount(name, props) {
  let cursor = 0;
  let sequence = 0;
  let dirty = false;
  const slots = [];
  const timers = new Map();
  const frames = new Map();
  const react = {
    useState(initial) {
      const index = cursor++;
      const slot = slots[index] ??= { value: initial };
      return [slot.value, value => { const next = typeof value === "function" ? value(slot.value) : value; dirty ||= !Object.is(next, slot.value); slot.value = next; }];
    },
    useRef(initial) { return slots[cursor++] ??= { current: initial }; },
    useEffect(callback, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && deps.every((value, i) => Object.is(value, previous.deps[i]))) return;
      previous?.cleanup?.();
      slots[index] = { deps, cleanup: callback() };
    },
  };
  const constants = {
    COLOR: {muted: "muted", warning: "warning", info: "info"},
    TEXT_COLOR: {locked: "locked", unlocked: "unlocked", accentRed: "red"},
    SPACING: {tapTarget: "tap"}, IMG: {contain: "contain"},
    CHROME_TEXT: "chrome", DISPLAY_FONT: "font", TYPE_SCALE: {caption: "caption"},
  };
  const jsx = (type, props) => ({type, props});
  function load(file) {
    const exports = {};
    const compiled = ts.transpileModule(fs.readFileSync(path.join(src, file), "utf8"), {
      compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX},
    }).outputText;
    vm.runInNewContext(compiled, {
      exports,
      require(module) {
        if (module === "react") return react;
        if (module === "react/jsx-runtime") return {jsx, jsxs: jsx};
        if (module === "@/lib/utils") return {cn: (...parts) => parts.filter(Boolean).join(" ")};
        if (module === "@/assets") return {images: {lockKeyhole: "lock.png"}};
        if (module === "@/utils/helper") return {
          scoreXpCeoImage: () => "score.png",
          normalizeCharacterTitle: (title) => title?.toLowerCase().replace(/^the\s+/, "") ?? "",
          studentCeoAssets: () => ({color: "#f80"}),
        };
        // Gallery visuals do not participate in the animation under test.
        if (module === "./heroesData") return {HERO_GALLERY_DATA: []};
        if (module === "./constants") return constants;
        if (module === "./perkControlColors") return {getPerkControlColors: () => ({border: "#f80", gradient: "gradient", ring: "#f80"})};
        if (module.startsWith(".")) return load(path.join(path.dirname(file), `${module}.ts`));
        throw new Error(`Unexpected import: ${module}`);
      },
      setTimeout(callback) { const id = ++sequence; timers.set(id, callback); return id; },
      clearTimeout(id) { timers.delete(id); },
      requestAnimationFrame(callback) { const id = ++sequence; frames.set(id, callback); return id; },
      cancelAnimationFrame(id) { frames.delete(id); },
    });
    return exports;
  }
  const component = load(`features/game/components/heroSelectCard/${name}.tsx`)[name];
  const h = {
    render(next = props) { props = next; let passes = 0; do { dirty = false; cursor = 0; this.tree = component(next); } while (dirty && ++passes < 10); return this.tree; },
    timer() { const [id, callback] = timers.entries().next().value; timers.delete(id); callback(); },
    frame() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback()); },
    cleanup() { slots.forEach(slot => slot.cleanup?.()); },
    timers, frames,
  };
  h.render();
  return h;
}
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
function width(h) { return nodes(h.tree).find(node => node.props?.style?.width)?.props.style.width; }

for (const [unlocked, isUsed, perkStatus, label, disabled] of [
  [false, false, null, "LOCKED", true],
  [true, false, "requesting", "REQUESTING", true],
  [true, false, "pending", "REQUESTED", true],
  [true, false, "approved", "APPROVED", true],
  [true, true, "used", "USED", true],
  [true, false, null, "ACTIVATE", false],
]) {
  test(`merged action button preserves ${label} semantics and activation guard`, () => {
    let calls = 0;
    const h = mount("HeroSelectCardLiveActionButton", {unlocked, isUsed, perkStatus, perkName: "Danger Zone", themeId: "maverick", onActivate: () => { calls++; }});
    assert.equal(h.tree.props.disabled, disabled);
    assert.equal(nodes(h.tree).find(node => node.type === "span").props.children, label);
    assert.equal(h.tree.props.style["--perk-active-color"], "#f80");
    if (disabled) assert.equal(h.tree.props.onClick, undefined);
    else { h.tree.props.onClick(); assert.equal(calls, 1); }
    if (perkStatus === "approved") assert.match(h.tree.props.title, /waiting for its effect or selection/);
    h.cleanup();
  });
}

test("merged progress uses server XP, theme accent and bounded fill", () => {
  for (const [currentXP, nextLevelXP, expected] of [[0,5,"0%"], [3,5,"60%"], [5,5,"100%"], [99,5,"100%"], [-1,5,"0%"], [3,0,"0%"]]) {
    const h = mount("HeroSelectCardProgress", {currentXP, nextLevelXP, levelProgress: 3, accentColor: "#f80"});
    assert.equal(width(h), expected);
    assert.equal(nodes(h.tree).find(node => node.props?.style?.borderColor).props.style.borderColor, "#f80");
    h.cleanup();
  }
});

test("level-up presentation fills, resets and settles at server XP without changing business state", () => {
  const h = mount("HeroSelectCardProgress", {currentXP: 4, nextLevelXP: 5, levelProgress: 3});
  const updated = {currentXP: 3, nextLevelXP: 5, levelProgress: 4};
  h.render(updated); assert.equal(width(h), "100%");
  h.timer(); h.render(updated); assert.equal(width(h), "0%");
  h.frame(); h.frame(); h.render(updated); assert.equal(width(h), "60%");
  h.timer(); h.cleanup();
  assert.equal(h.timers.size, 0); assert.equal(h.frames.size, 0);
});

test("new server XP cancels stale animation frames; unmount cleans pending work", () => {
  const h = mount("HeroSelectCardProgress", {currentXP: 4, nextLevelXP: 5, levelProgress: 3});
  h.render({currentXP: 3, nextLevelXP: 5, levelProgress: 4});
  h.timer(); assert.equal(h.frames.size, 1);
  h.render({currentXP: 4, nextLevelXP: 5, levelProgress: 4});
  assert.equal(h.frames.size, 0); assert.equal(width(h), "80%");
  h.cleanup(); assert.equal(h.timers.size, 0); assert.equal(h.frames.size, 0);
});

test("XP 0 through 10 updates continuously in the same level with CSS transitions", () => {
  const h = mount("HeroSelectCardProgress", {currentXP: 0, nextLevelXP: 10, levelProgress: 2});
  for (let xp = 0; xp <= 10; xp++) {
    const props = {currentXP: xp, nextLevelXP: 10, levelProgress: 2};
    h.render(props);
    const fill = nodes(h.tree).find(node => node.props?.style?.width);
    assert.equal(width(h), `${xp * 10}%`);
    assert.equal(fill.props.style.transition, "width 400ms ease-out");
    const label = nodes(h.tree).find(node => node.props?.className?.includes("pointer-events-none"));
    assert.equal(label.props.children.join(""), `${xp} / 10 XP`);
    assert.equal(h.timers.size, 0);
    assert.equal(h.frames.size, 0);
    h.render(props);
    assert.equal(width(h), `${xp * 10}%`);
    assert.equal(h.timers.size, 0);
  }
  h.cleanup();
});

test("score image fills the progress region instead of stopping at its intrinsic width", () => {
  for (const xp of [1, 5, 6, 9, 10]) {
    const h = mount("HeroSelectCardProgress", {currentXP: xp, nextLevelXP: 10, levelProgress: 2});
    const fill = nodes(h.tree).find(node => node.props?.style?.width);
    const image = nodes(fill).find(node => node.type === "img");
    assert.equal(width(h), `${xp * 10}%`);
    assert.equal(image.props.src, "score.png");
    assert.ok(image.props.className.split(" ").includes("w-full"));
    assert.ok(!image.props.className.split(" ").includes("w-auto"));
    h.cleanup();
  }
});

test("10 XP resets at the next level and same-level XP resumes through 6 to 10", () => {
  const h = mount("HeroSelectCardProgress", {currentXP: 9, nextLevelXP: 10, levelProgress: 2});
  h.render({currentXP: 0, nextLevelXP: 10, levelProgress: 3});
  assert.equal(width(h), "100%");
  h.timer(); h.render();
  assert.equal(width(h), "0%");
  h.frame(); h.frame(); h.render();
  assert.equal(width(h), "0%");
  h.timer(); h.render();
  for (const xp of [1, 5, 6, 9, 10]) {
    h.render({currentXP: xp, nextLevelXP: 10, levelProgress: 3});
    assert.equal(width(h), `${xp * 10}%`);
  }
  assert.equal(h.timers.size, 0);
  assert.equal(h.frames.size, 0);
  h.cleanup();
});
