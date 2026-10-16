import { after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import React from "react";
import ts from "typescript";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const server = await createServer({
  root,
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: "custom",
});
after(() => server.close());
const { HeroSelectCardHeroLive } = await server.ssrLoadModule(
  "/src/features/game/components/heroSelectCard/HeroSelectCardHeroLive.tsx",
);
const { HERO_GALLERY_DATA } = await server.ssrLoadModule(
  "/src/features/game/components/heroSelectCard/heroesData.ts",
);
const { ceoBackgroundVideoFor, ceoFigureFor } = await server.ssrLoadModule(
  "/src/pages/chooseCeo/heroArt.ts",
);

// Expand the actual stateless components without a browser or media transport.
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!React.isValidElement(node)) return [];
  if (typeof node.type === "function") return elements(node.type(node.props));
  if (node.type?.$$typeof === Symbol.for("react.memo")) {
    return elements(node.type.type(node.props));
  }
  return [node, ...elements(node.props.children)];
}
const render = (hero) => elements(React.createElement(HeroSelectCardHeroLive, { hero }));
const videoIn = (nodes) => nodes.find((node) => node.type === "video");

test("every curated CEO has an eager foreground figure before video playback", () => {
  for (const hero of HERO_GALLERY_DATA) {
    const nodes = render(hero);
    const figure = nodes.find((node) => node.type === "img" && node.props.alt === hero.name);
    assert.ok(figure, hero.name);
    assert.equal(figure.props.src, hero.portraitAsset ?? ceoFigureFor(hero.name));
    assert.equal(figure.props.loading, "eager");
    assert.equal(figure.props.fetchPriority, "high");
    assert.ok(fs.existsSync(`${root}${decodeURIComponent(figure.props.src).replace(/^\//, "")}`), figure.props.src);
    const video = videoIn(nodes);
    assert.equal(video.props.style.opacity, 0);
    assert.equal(video.props.src, ceoBackgroundVideoFor(hero.name));
    assert.ok(fs.existsSync(`${root}${decodeURIComponent(video.props.src).replace(/^\//, "")}`), video.props.src);
    assert.equal(nodes.filter((node) => node.type === "video").length, 1);
    assert.equal(video.props.preload, "metadata");
    for (const flag of ["autoPlay", "loop", "muted", "playsInline"]) assert.equal(video.props[flag], true);
    assert.equal(video.props["aria-hidden"], "true");
    assert.ok(video.props.className.includes("pointer-events-none"));
    assert.ok(nodes.some((node) => node.props.className?.includes("z-0 overflow-hidden")));
    assert.ok(nodes.some((node) => node.props.className?.includes("z-10")));
  }
});

test("slow, blocked and failed media never gate the figure or controls", () => {
  const hero = HERO_GALLERY_DATA[0];
  const nodes = render(hero);
  const video = videoIn(nodes);
  const target = { style: { opacity: "0" }, hidden: false };
  // No playing event models pending media and blocked autoplay.
  assert.ok(nodes.some((node) => node.type === "img" && node.props.alt === hero.name));
  assert.ok(nodes.some((node) => node.type === "button"));
  video.props.onPlaying({ currentTarget: target });
  assert.equal(target.style.opacity, "1");
  video.props.onError({ currentTarget: target });
  assert.equal(target.hidden, true);
  assert.ok(nodes.some((node) => node.type === "img" && node.props.alt === hero.name));
  assert.ok(nodes.some((node) => node.type === "img" && node.props.src === hero.backgroundAsset));
});

test("changing CEO selects both assets and only changes the video key for a different source", () => {
  for (const hero of HERO_GALLERY_DATA) {
    const first = videoIn(render(hero));
    const repeated = videoIn(render({ ...hero }));
    assert.equal(first.key, repeated.key);
    assert.equal(first.key, ceoBackgroundVideoFor(hero.name));
  }
  const visionary = HERO_GALLERY_DATA.find((hero) => hero.name === "The Visionary");
  assert.equal(videoIn(render(visionary)).key, videoIn(render({ ...visionary, name: "The Innovator" })).key);
  assert.notEqual(videoIn(render(HERO_GALLERY_DATA[0])).key, videoIn(render(HERO_GALLERY_DATA[1])).key);
  const custom = { ...HERO_GALLERY_DATA[0], portraitAsset: "/custom-figure.png" };
  assert.ok(render(custom).some((node) => node.props.src === custom.portraitAsset));
});

// Execute the real provider and connection hook against an isolated socket.
// This tests listener/connection lifecycle, not network heartbeat or throughput.
function hookHost() {
  const slots = [];
  let cursor = 0;
  return {
    react: {
      ...React,
      useRef(value) { return slots[cursor++] ??= { current: value }; },
      useState(value) {
        const slot = slots[cursor++] ??= { value: typeof value === "function" ? value() : value };
        return [slot.value, (next) => { slot.value = typeof next === "function" ? next(slot.value) : next; }];
      },
      useEffect(callback, dependencies) {
        const index = cursor++;
        const previous = slots[index];
        if (previous && dependencies.every((value, i) => Object.is(value, previous.dependencies[i]))) return;
        previous?.cleanup?.();
        slots[index] = { dependencies, cleanup: callback() };
      },
    },
    render(callback) { cursor = 0; return callback(); },
    cleanup() { for (const slot of slots) slot?.cleanup?.(); },
  };
}
function load(file, dependencies) {
  const source = fs.readFileSync(`${root}src/${file}`, "utf8")
    .replace("import.meta.env.VITE_BASE_URL", '"https://socket.test"');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    console,
    require(name) {
      if (name in dependencies) return dependencies[name];
      throw new Error(`Unexpected runtime dependency: ${name}`);
    },
  });
  return exports;
}

test("media events and CEO changes keep one socket and one set of connection listeners", () => {
  const listeners = new Map();
  const messages = [];
  let creations = 0;
  let connections = 0;
  const socket = {
    connected: false,
    connect() { connections++; this.connected = true; },
    on(name, callback) { const set = listeners.get(name) ?? new Set(); set.add(callback); listeners.set(name, set); },
    off(name, callback) { listeners.get(name)?.delete(callback); },
  };
  const providerHost = hookHost();
  const { SocketProvider } = load("context/socketContext/socketContext.tsx", {
    react: providerHost.react,
    "react/jsx-runtime": { jsx: React.createElement },
    "socket.io-client": { io() { creations++; return socket; } },
  });
  const connectionHost = hookHost();
  const { usePerkSocketConnection } = load("features/game/hooks/heroCard/usePerkSocketConnection.ts", {
    react: connectionHost.react,
    sonner: { toast: { error: (message) => messages.push(message) } },
  });
  const mount = () => {
    providerHost.render(() => SocketProvider({ children: null }));
    connectionHost.render(() => usePerkSocketConnection({ socket, courseId: "class", studentId: "owner" }));
  };
  mount();
  const counts = [...listeners].map(([name, callbacks]) => [name, callbacks.size]);
  for (const hero of HERO_GALLERY_DATA) {
    const video = videoIn(render(hero));
    const target = { style: { opacity: "0" }, hidden: false };
    for (const callback of listeners.get("ws-error")) callback({ message: hero.name });
    video.props.onPlaying({ currentTarget: target });
    video.props.onError({ currentTarget: target });
    mount();
    assert.deepEqual([...listeners].map(([name, callbacks]) => [name, callbacks.size]), counts);
  }
  assert.equal(creations, 1);
  assert.equal(connections, 1);
  assert.equal(messages.length, HERO_GALLERY_DATA.length);
  connectionHost.cleanup();
  providerHost.cleanup();
  assert.ok([...listeners.values()].every((callbacks) => callbacks.size === 0));
});
