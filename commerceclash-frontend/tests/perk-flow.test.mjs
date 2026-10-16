import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import path from "node:path";
import { fileURLToPath } from "node:url";
const testDirectory = path.dirname(fileURLToPath(import.meta.url));

// Execute the real hook listeners with isolated transport/timer/React adapters.
// This checks event routing and effects, not browser layout or React rendering.
function harness(file, hook, overrides = {}) {
  const calls = [];
  const listeners = new Map();
  const cleanups = [];
  const timers = new Map();
  const spy =
    (name) =>
    (...args) =>
      calls.push({ name, args });
  const socket = {
    connected: true,
    on(name, callback) {
      const callbacks = listeners.get(name) || [];
      callbacks.push(callback);
      listeners.set(name, callbacks);
    },
    off(name, callback) {
      listeners.set(
        name,
        (listeners.get(name) || []).filter((item) => item !== callback),
      );
    },
    emit: spy("emit"),
    receive(name, data) {
      for (const callback of listeners.get(name) || []) callback(data);
    },
  };
  const queryClient = { invalidateQueries: spy("invalidateQueries") };
  let cursor = 0;
  const slots = [];
  const react = {
    useEffect(callback, dependencies) {
      const index = cursor++;
      const previous = slots[index];
      if (previous && dependencies?.every((value, i) => Object.is(value, previous.dependencies?.[i]))) return;
      previous?.cleanup?.();
      const cleanup = callback();
      slots[index] = { dependencies, cleanup };
      if (cleanup) cleanups.push(cleanup);
    },
    useCallback(callback) {
      return callback;
    },
    useRef(value) {
      const index = cursor++;
      return slots[index] ??= { current: value };
    },
    useState(value) {
      const index = cursor++;
      const slot = slots[index] ??= { value };
      return [
        slot.value,
        (next) => {
          slot.value = typeof next === "function" ? next(slot.value) : next;
          calls.push({ name: "state", args: [slot.value] });
        },
      ];
    },
  };
  function load(file) {
  const source = fs.readFileSync(
    path.join(testDirectory, "../src/features/game/hooks/heroCard", file),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name.startsWith(".")) return load(`${path.join(path.dirname(file), name)}.ts`);
      if (name === "react") return react;
      if (name === "@tanstack/react-query") return { useQueryClient: () => queryClient };
      if (name === "sonner")
        return {
          toast: {
            warning: spy("warning"),
            info: spy("info"),
            success: spy("success"),
            error: spy("error"),
          },
        };
      throw new Error(`Unexpected runtime dependency: ${name}`);
    },
    setTimeout(callback) {
      const id = timers.size + 1;
      timers.set(id, () => { timers.delete(id); callback(); });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    window: {
      addEventListener: spy("window-on"),
      removeEventListener: spy("window-off"),
      dispatchEvent: spy("window-event"),
    },
    localStorage: {
      setItem: spy("storage"),
      removeItem: spy("storage-remove"),
    },
    CustomEvent: class {
      constructor(name, options) {
        this.type = name;
        this.detail = options?.detail;
      }
    },
  });
  return exports;
  }
  const exports = load(file);
  const options = new Proxy(
    {
      socket,
      studentId: "owner",
      courseId: "class",
      isConnected: true,
      studentLevel: 3,
      perks: [{ id: "perk", key: "danger_zone", title: "Danger Zone" }],
      perkId: "perk",
      character: {
        perks: [
          {
            id: "perk",
            is_unlocked: true,
            used: false,
            approved: false,
            status: null,
          },
        ],
      },
      trailblazerPerkId: null,
      sabotagePerkId: null,
      trendsetterPerkId: null,
      dangerZonePerkId: "perk",
      dangerZoneModalOpen: true,
      targetRivalModalData: null,
      ...overrides,
    },
    {
      get(target, key) {
        if (!(key in target))
          target[key] =
            !String(key).startsWith("set") && String(key).endsWith("Open")
              ? false
              : spy(key);
        return target[key];
      },
    },
  );
  const result = exports[hook](options);
  return {
    calls,
    socket,
    options,
    result,
    timers,
    listenerCount: (name) => (listeners.get(name) || []).length,
    rerender() { cursor = 0; this.result = exports[hook](options); },
    count: (name) => calls.filter((call) => call.name === name).length,
    cleanup: () => cleanups.forEach((callback) => callback()),
  };
}
const request = () =>
  harness("usePerkOptimisticStatus.ts", "usePerkOptimisticStatus");
const dispatcher = () =>
  harness("usePerkActivatedDispatcher.ts", "usePerkActivatedDispatcher");
const lifecycle = () =>
  harness("usePerkLifecycleEvents.ts", "usePerkLifecycleEvents");
const event = (effects, status = "used", studentId = "owner") => ({
  success: true,
  message: "Server result",
  data: {
    studentId,
    perkId: "perk",
    perkTitle: "Danger Zone",
    perk_status: status,
    effects,
  },
});

test("request emits once and waits for a successful server acknowledgement before pending", () => {
  const h = request();
  h.result.approvePerk("perk", "Danger Zone");
  h.result.approvePerk("perk", "Danger Zone");
  assert.equal(h.count("emit"), 1);
  assert.equal(h.count("onPerkUpdate"), 0);
  h.socket.receive("perk-request-sent", {
    success: true,
    data: { perkId: "perk" },
  });
  assert.equal(h.count("onPerkUpdate"), 1);
  assert.equal(
    h.calls.find((call) => call.name === "onPerkUpdate").args[1].status,
    "pending",
  );
  assert.equal(h.timers.size, 0);
  h.cleanup();
});
test("denied acknowledgement and disconnected transport never create fake pending/success", () => {
  const h = request();
  h.result.approvePerk("perk", "Perk");
  h.socket.receive("perk-request-sent", {
    success: false,
    message: "Locked",
    data: { perkId: "perk" },
  });
  assert.equal(h.count("onPerkUpdate"), 0);
  assert.equal(h.count("error"), 1);
  h.socket.connected = false;
  h.result.approvePerk("perk", "Perk");
  assert.equal(h.count("emit"), 1);
  h.cleanup();
});
test("timeout clears transport loading and refetches server state", () => {
  const h = request();
  h.result.approvePerk("perk", "Perk");
  [...h.timers.values()][0]();
  assert.equal(h.count("onPerkUpdate"), 0);
  assert.equal(h.count("onRefresh"), 1);
  assert.equal(h.timers.size, 0);
  h.cleanup();
});
test("locked perks cannot emit an approval request", () => {
  const h = request();
  h.options.character.perks[0].is_unlocked = false;
  h.result.approvePerk("perk", "Perk");
  assert.equal(h.count("emit"), 0);
  h.cleanup();
});

test("required-level business errors retain the backend message instead of a connection error", () => {
  const h = harness("usePerkSocketConnection.ts", "usePerkSocketConnection");
  const message = "The student has not unlocked this CEO perk at the required level.";
  h.socket.receive("ws-error", { success: false, message });
  assert.equal(h.count("error"), 1);
  assert.equal(h.calls.find((call) => call.name === "error").args[0], message);
  h.cleanup();
});

for (const [key, type, required] of [
  ["danger_zone", "CORE", 3], ["fan_the_flames", "CORE", 3],
  ["prophecy", "CORE", 3], ["star_power", "CORE", 3], ["extortion", "ULTRA", 5],
]) {
  test(`${key} uses the backend type threshold even when the teacher unlock flag is true`, () => {
    const h = request();
    Object.assign(h.options.character.perks[0], { key, perk_type: type });
    h.options.studentLevel = required - 1;
    h.rerender();
    h.result.approvePerk("perk", key);
    assert.equal(h.count("emit"), 0);
    h.options.studentLevel = required;
    h.rerender();
    h.result.approvePerk("perk", key);
    assert.equal(h.count("emit"), 1);
    assert.equal(h.calls.find((call) => call.name === "emit").args[0], "perk-approve-request");
    h.cleanup();
  });
}

for (const [title, effects, key] of [
  ["Star Power", { msToSteal: 1 }, "star_power"],
  ["Extortion", { skillPointsToSteal: 2, effectType: "extortion" }, "extortion"],
]) {
  test(`${title} selection opens TargetRival with the correct owner, options and action`, () => {
    const h = dispatcher();
    const response = event({ ...effects, requiresSelection: true, pendingCompletion: true,
      rivals: [{ id: "rival", name: "Rival" }] }, "approved");
    response.data.perkTitle = title;
    h.options.perks = [{ id: "perk", key, title }];
    h.rerender();
    h.socket.receive("perk-activated", response);
    const modal = h.calls.find((call) => call.name === "setTargetRivalModalData").args[0];
    assert.equal(modal.title, title);
    assert.equal(modal.perkKey, key);
    assert.equal(modal.perkId, "perk");
    assert.equal(modal.rivals[0].id, "rival");
    assert.equal(h.calls.find((call) => call.name === "setTargetRivalModalOpen").args[0], true);
    assert.equal(h.count("setDangerZoneModalOpen"), 0);
    assert.equal(h.count("emit"), 0);
    h.cleanup();
  });
}

test("Danger Zone cancel clears picker data and uses the backend cancel contract", () => {
  const h = harness("useDangerZoneFlow.ts", "useDangerZoneFlow");
  h.result.setDangerZonePerkId("perk");
  h.result.setDangerZoneModalOpen(true);
  h.result.setDangerZonePhaseData({ pointsToRemove: 2, rivals: [], skillTree: [] });
  h.rerender();
  h.result.handleCloseDangerZoneModal();
  h.rerender();
  assert.equal(h.result.dangerZoneModalOpen, false);
  h.socket.receive("perk-cancel-confirmed", {success: true, data: {perkId: "perk"}});
  h.rerender();
  assert.equal(h.result.dangerZonePhaseData, null);
  assert.equal(h.result.dangerZonePerkId, null);
  assert.equal(JSON.stringify(h.calls.find((call) => call.name === "emit").args), JSON.stringify([
    "perk-cancel", { classId: "class", studentId: "owner", perkId: "perk", perkKey: "danger_zone" },
  ]));
  h.result.setDangerZonePerkId("new-perk");
  h.result.setDangerZonePhaseData({ pointsToRemove: 2, rivals: [{ id: "new-rival" }], skillTree: [] });
  h.result.setDangerZoneModalOpen(true);
  h.rerender();
  assert.equal(h.result.dangerZoneModalOpen, true);
  assert.equal(h.result.dangerZonePerkId, "new-perk");
  h.cleanup();
});

test("Target Rival close and reopen preserves the pending backend choice without emitting a mutation", () => {
  const h = harness("useTargetRivalFlow.ts", "useTargetRivalFlow");
  h.result.setTargetRivalModalData({ perkId: "perk", rivals: [{ id: "rival" }], perkKey: "star_power" });
  h.result.setTargetRivalModalOpen(true);
  h.rerender();
  h.result.handleCloseTargetRivalModal();
  h.rerender();
  assert.equal(h.result.targetRivalModalOpen, false);
  assert.equal(h.result.targetRivalModalData.perkId, "perk");
  h.result.setTargetRivalModalOpen(true);
  h.rerender();
  assert.equal(h.result.targetRivalModalOpen, true);
  assert.equal(h.count("emit"), 0);
  h.cleanup();
});

test("instructor reset refetches authoritative cooldown state and clears consumed approval", () => {
  const h = lifecycle();
  h.socket.receive("perk-status-changed", {
    data: { perkId: "perk", perk_status: "reset" },
  });
  assert.equal(h.count("onRefresh"), 1);
  const patch = h.calls.find((call) => call.name === "onPerkUpdate").args[1];
  assert.equal(patch.used, false);
  assert.equal(patch.approved, false);
  assert.equal(patch.status, null);
  assert.equal(h.count("emit"), 0);
  h.cleanup();
  h.socket.receive("perk-status-changed", { data: { perk_status: "reset" } });
  assert.equal(h.count("onRefresh"), 1);
});

test("instructor unlock refetches backend state without inventing approval or an effect", () => {
  const h = lifecycle();
  h.socket.receive("perk-unlocked", { data: { perkId: "perk" } });
  assert.equal(h.count("onRefresh"), 1);
  const patch = h.calls.find((call) => call.name === "onPerkUpdate").args[1];
  assert.equal(patch.is_unlocked, true);
  assert.equal(Object.keys(patch).length, 1);
  assert.equal(h.count("success"), 0);
});
test("another owner cannot open a modal or update this perk; an affected rival refreshes", () => {
  const h = dispatcher();
  h.socket.receive(
    "perk-activated",
    event(
      { requiresSelection: true, rivals: [], msToSteal: 1 },
      "approved",
      "other",
    ),
  );
  assert.equal(h.count("onPerkUpdate"), 0);
  assert.equal(h.count("setTargetRivalModalOpen"), 0);
  h.socket.receive(
    "perk-activated",
    event({ affectedStudentIds: ["owner"] }, "used", "other"),
  );
  assert.equal(h.count("onRefresh"), 1);
  h.cleanup();
});
test("approved reactive perk waits without claiming an applied effect", () => {
  const h = dispatcher();
  h.socket.receive(
    "perk-activated",
    event({ waitingForTrigger: true, pendingCompletion: true }, "approved"),
  );
  assert.equal(h.count("success"), 0);
  assert.equal(h.count("info"), 1);
  assert.equal(h.count("setDangerZoneModalOpen"), 0);
  h.cleanup();
});
test("Danger Zone opens only with backend selection requirements and quantities", () => {
  const h = dispatcher();
  h.socket.receive(
    "perk-activated",
    event(
      {
        requiresSelection: true,
        pendingCompletion: true,
        skillTree: [],
        rivals: [],
        pointsToRemove: 2,
        msToSteal: 2,
      },
      "approved",
    ),
  );
  assert.equal(h.count("setDangerZoneModalOpen"), 1);
  assert.equal(
    h.calls.find((call) => call.name === "setDangerZonePhaseData").args[0]
      .pointsToRemove,
    2,
  );
  h.cleanup();
});
test("Danger Zone completion closes the picker and never reopens it based on its title", () => {
  const h = dispatcher();
  h.socket.receive("perk-activated", event({ msStolen: 2 }));
  const updates = h.calls.filter(
    (call) => call.name === "setDangerZoneModalOpen",
  );
  assert.equal(updates.length, 1);
  assert.equal(updates[0].args[0], false);
  assert.equal(h.count("onRefresh"), 1);
  h.cleanup();
});
test("a different completed perk does not close the current selection", () => {
  const h = dispatcher();
  const response = event({});
  response.data.perkId = "different";
  h.socket.receive("perk-activated", response);
  assert.equal(h.count("setDangerZoneModalOpen"), 0);
  h.cleanup();
});
test("business failure refreshes without success, state mutation or modal opening", () => {
  const h = dispatcher();
  h.socket.receive("perk-activated", {
    ...event({}),
    success: false,
    message: "No capacity",
  });
  assert.equal(h.count("error"), 1);
  assert.equal(h.count("success"), 0);
  assert.equal(h.count("onPerkUpdate"), 0);
  assert.equal(h.count("onRefresh"), 1);
  h.cleanup();
});


test("Prophecy disconnect clears submission loading and offline prediction is not queued", () => {
  const h = harness("useScenarioPredictionFlow.ts", "useScenarioPredictionFlow");
  h.result.handleScenarioPrediction("market");
  assert.equal(h.count("emit"), 1);
  h.socket.receive("disconnect");
  assert.equal(h.calls.filter((call) => call.name === "state").at(-1).args[0], false);
  h.socket.connected = false;
  h.result.handleScenarioPrediction("market");
  assert.equal(h.count("emit"), 1);
  h.cleanup();
});
test("Fan disconnect drops the stale offer and clears loading without claiming an effect", () => {
  const h = harness("useFanTheFlamesFlow.ts", "useFanTheFlamesFlow");
  h.socket.receive("disconnect");
  assert.deepEqual(h.calls.filter((call) => call.name === "state").map((call) => call.args[0]), [false, false, null]);
  assert.equal(h.count("success"), 0);
  h.cleanup();
});

test("Prophecy double-click emits one exact payload and failure releases the lock", () => {
  const h = harness("useScenarioPredictionFlow.ts", "useScenarioPredictionFlow");
  h.result.handleScenarioPrediction("crisis");
  h.result.handleScenarioPrediction("crisis");
  assert.equal(h.count("emit"), 1);
  assert.equal(JSON.stringify(h.calls.find((call) => call.name === "emit").args), JSON.stringify([
    "scenario-prediction-submitted", { classId: "class", studentId: "owner", predictedType: "crisis" },
  ]));
  h.socket.receive("scenario-prediction-result", { success: false, message: "Teacher approval required" });
  assert.equal(h.count("error"), 1);
  assert.equal(h.count("success"), 0);
  assert.equal(h.timers.size, 0);
  h.cleanup();
});

test("Danger Zone validates own points and rival, blocks duplicates and cancellation in flight", () => {
  const h = harness("useDangerZoneFlow.ts", "useDangerZoneFlow");
  h.result.setDangerZonePerkId("perk");
  h.result.setDangerZonePhaseData({ pointsToRemove: 2, msToSteal: 2,
    rivals: [{ id: "rival" }], skillTree: [{ skillId: "skill", currentValue: 2 }] });
  h.rerender();
  h.result.handleSubmitDangerZone("other", [{ skillId: "skill", amount: 2 }]);
  h.result.handleSubmitDangerZone("rival", [{ skillId: "skill", amount: 3 }]);
  assert.equal(h.count("emit"), 0);
  h.result.handleSubmitDangerZone("rival", [{ skillId: "skill", amount: 2 }]);
  h.result.handleSubmitDangerZone("rival", [{ skillId: "skill", amount: 2 }]);
  h.result.handleCloseDangerZoneModal();
  assert.equal(h.count("emit"), 1);
  h.socket.receive("perk-activation-error", { data: { perkId: "perk" } });
  assert.equal(h.timers.size, 0);
  h.socket.connected = false;
  h.result.handleSubmitDangerZone("rival", [{ skillId: "skill", amount: 2 }]);
  assert.equal(h.count("emit"), 1);
  h.cleanup();
});

test("Target Rival rejects non-options, deduplicates, correlates errors and expires with scenario", () => {
  const h = harness("useTargetRivalFlow.ts", "useTargetRivalFlow");
  h.result.setTargetRivalModalData({ perkId: "perk", rivals: [{ id: "rival" }], perkKey: "extortion" });
  h.rerender();
  h.result.handleSelectTargetRival("owner");
  assert.equal(h.count("emit"), 0);
  h.result.handleSelectTargetRival("rival");
  h.result.handleSelectTargetRival("rival");
  assert.equal(h.count("emit"), 1);
  h.socket.receive("perk-activation-error", { data: { perkId: "other" } });
  assert.equal(h.timers.size, 1);
  h.socket.receive("perk-activation-error", { data: { perkId: "perk" } });
  assert.equal(h.timers.size, 0);
  h.socket.receive("scenario-temporary-effects-ended", { success: true });
  h.rerender();
  assert.equal(h.result.targetRivalModalData, null);
  h.cleanup();
});

const offer = (key) => ({ pendingKey: `class:owner:${key}`, amount: 2, sourcePerkTitle: "Danger Zone", attackerName: "Rival",
  rivals: [{ id: "rival" }], decisionWindowMs: 10000, expiresAt: Date.now() + 10000 });
test("Fan queues overlapping offers, ignores unrelated expiry and deduplicates redirect", () => {
  const h = harness("useFanTheFlamesFlow.ts", "useFanTheFlamesFlow");
  h.socket.receive("fan-the-flames-offer", { success: true, data: offer("first") });
  h.socket.receive("fan-the-flames-offer", { success: true, data: offer("second") });
  h.socket.receive("fan-the-flames-expired", { data: { pendingKey: "unrelated" } });
  h.result.handleFanTheFlamesRedirect("owner");
  assert.equal(h.count("emit"), 0);
  h.result.handleFanTheFlamesRedirect("rival");
  h.result.handleFanTheFlamesRedirect("rival");
  assert.equal(h.count("emit"), 1);
  assert.equal(h.calls.find((call) => call.name === "emit").args[1].pendingKey, "class:owner:first");
  h.socket.receive("fan-the-flames-redirect-result", { success: true, data: { redirectedTo: "rival", amount: 2 } });
  h.rerender();
  assert.equal(h.result.fanTheFlamesOffer.pendingKey, "class:owner:second");
  assert.equal(h.count("success"), 0);
  h.cleanup();
});

test("timeout reports uncertainty, refetches and cleans up on unmount", () => {
  const h = harness("useScenarioPredictionFlow.ts", "useScenarioPredictionFlow");
  h.result.handleScenarioPrediction("market");
  [...h.timers.values()][0]();
  assert.equal(h.count("onRefresh"), 1);
  assert.equal(h.count("error"), 1);
  assert.equal(h.count("success"), 0);
  h.cleanup();
  assert.equal(h.timers.size, 0);
  const count = h.count("state");
  h.socket.receive("scenario-prediction-result", { success: true, data: { correct: true } });
  assert.equal(h.count("state"), count);
});

test("dispatcher uses owned stable key, rejects unknown private IDs and used picker payloads", () => {
  const h = dispatcher();
  const response = event({ requiresSelection: true, pendingCompletion: true, rivals: [{id: "rival"}], msToSteal: 1 }, "approved");
  h.options.perks = [{id: "other", key: "danger_zone", title: "Danger Zone"}, {id: "perk", key: "star_power", title: "Star Power"}];
  h.rerender();
  response.data.perkTitle = "Danger Zone";
  delete response.data.studentId;
  h.socket.receive("perk-activated", response);
  assert.equal(h.calls.find(c => c.name === "setTargetRivalModalData").args[0].perkKey, "star_power");
  assert.equal(h.count("setDangerZoneModalOpen"), 0);
  response.data.perkId = "foreign";
  h.socket.receive("perk-activated", response);
  response.data.perkId = "perk";
  response.data.perk_status = "used";
  h.socket.receive("perk-activated", response);
  assert.equal(h.calls.filter(c => c.name === "setTargetRivalModalOpen" && c.args[0] === true).length, 1);
  h.cleanup();
});

test("production hooks do not subscribe to orphan manual prediction or Danger Zone events", () => {
  for (const [file, hook] of [["usePerkActivatedDispatcher.ts", "usePerkActivatedDispatcher"], ["useDangerZoneFlow.ts", "useDangerZoneFlow"], ["useScenarioPredictionFlow.ts", "useScenarioPredictionFlow"]]) {
    const h = harness(file, hook);
    assert.equal(h.count("window-on"), 0);
    assert.equal(h.listenerCount("scenario-prediction-prompt"), 0);
    h.cleanup();
  }
});

test("uncertain prediction submission stays locked until its result, not an unrelated ws-error", () => {
  const h = harness("useScenarioPredictionFlow.ts", "useScenarioPredictionFlow");
  h.result.handleScenarioPrediction("market");
  [...h.timers.values()][0]();
  h.socket.receive("ws-error", {success: false, message: "Unrelated operation"});
  h.result.handleScenarioPrediction("crisis");
  assert.equal(h.count("emit"), 1);
  h.socket.receive("scenario-prediction-result", {success: false, message: "Prediction rejected"});
  h.result.handleScenarioPrediction("crisis");
  assert.equal(h.count("emit"), 2);
  h.cleanup();
});

test("teacher reset invalidates only its current Target Rival selection", () => {
  const h = harness("useTargetRivalFlow.ts", "useTargetRivalFlow");
  h.result.setTargetRivalModalData({perkId: "perk", perkKey: "star_power", rivals: [{id: "rival"}]});
  h.result.setTargetRivalModalOpen(true);
  h.rerender();
  h.socket.receive("perk-updated", {success: true, data: {perkId: "other", action: "reset"}});
  h.rerender();
  assert.equal(h.result.targetRivalModalOpen, true);
  h.socket.receive("perk-updated", {success: true, data: {perkId: "perk", action: "reset"}});
  h.rerender();
  assert.equal(h.result.targetRivalModalOpen, false);
  assert.equal(h.result.targetRivalModalData, null);
  h.result.handleSelectTargetRival("rival");
  assert.equal(h.count("emit"), 0);
  h.cleanup();
});

test("Fan serializes expired in-flight offers so late unkeyed result cannot consume next offer", () => {
  const h = harness("useFanTheFlamesFlow.ts", "useFanTheFlamesFlow");
  h.socket.receive("fan-the-flames-offer", {success: true, data: {...offer("foreign"), pendingKey: "other:owner:foreign"}});
  h.rerender();
  assert.equal(h.result.fanTheFlamesOffer, null);
  h.socket.receive("fan-the-flames-offer", {success: true, data: offer("first")});
  h.result.handleFanTheFlamesRedirect("rival");
  h.socket.receive("fan-the-flames-expired", {data: {pendingKey: "class:owner:first"}});
  h.socket.receive("fan-the-flames-offer", {success: true, data: offer("second")});
  h.result.handleFanTheFlamesRedirect("rival");
  assert.equal(h.count("emit"), 1);
  h.rerender();
  assert.equal(h.result.fanTheFlamesOffer, null);
  h.socket.receive("fan-the-flames-redirect-result", {success: true, data: {redirectedTo: "rival", amount: 2}});
  h.rerender();
  assert.equal(h.result.fanTheFlamesOffer.pendingKey, "class:owner:second");
  h.result.handleFanTheFlamesRedirect("rival");
  assert.equal(h.count("emit"), 2);
  h.socket.receive("fan-the-flames-redirect-result", {success: false, message: "Try another rival"});
  h.result.handleFanTheFlamesRedirect("rival");
  assert.equal(h.count("emit"), 3);
  h.cleanup();
});

test("teacher listener cleanup preserves other subscribers and rerender does not duplicate", () => {
  const h = harness("../../../teacher/hooks/useClassSocket.ts", "useClassSocket", {classId: "class", teacherId: "teacher", pendingPerkActionsRef: {current: new Map()}});
  let externalCalls = 0;
  h.socket.on("perk-used", () => { externalCalls++; });
  h.rerender();
  assert.equal(h.listenerCount("perk-used"), 2);
  h.cleanup();
  assert.equal(h.listenerCount("perk-used"), 1);
  h.socket.receive("perk-used", {success: true});
  assert.equal(externalCalls, 1);
});

test("Danger Zone rejected cancellation restores picker and permits retry without duplicate cancel", () => {
  const h = harness("useDangerZoneFlow.ts", "useDangerZoneFlow");
  h.result.setDangerZonePerkId("perk");
  h.result.setDangerZonePhaseData({pointsToRemove: 2, rivals: [{id: "rival"}], skillTree: [{skillId: "skill", currentValue: 2}]});
  h.result.setDangerZoneModalOpen(true);
  h.rerender();
  h.result.handleCloseDangerZoneModal();
  h.result.handleCloseDangerZoneModal();
  assert.equal(h.count("emit"), 1);
  h.socket.receive("perk-cancel-confirmed", {success: false, message: "Cannot cancel yet", data: {perkId: "perk"}});
  h.rerender();
  assert.equal(h.result.dangerZoneModalOpen, true);
  assert.equal(h.result.dangerZonePerkId, "perk");
  assert.equal(h.result.dangerZonePhaseData.rivals[0].id, "rival");
  h.result.handleSubmitDangerZone("rival", [{skillId: "skill", amount: 2}]);
  assert.equal(h.count("emit"), 2);
  assert.equal(h.calls.filter(c => c.name === "emit")[1].args[0], "perk-complete-with-target");
  h.cleanup();
});

test("teacher failed cancellation refreshes and preserves perk state", () => {
  const h = harness("../../../teacher/hooks/useClassSocket.ts", "useClassSocket", {classId: "class", teacherId: "teacher", pendingPerkActionsRef: {current: new Map()}});
  h.socket.receive("perk-cancel-confirmed", {success: false, message: "Cancel rejected", data: {perkId: "perk"}});
  assert.equal(h.count("dispatch"), 0);
  assert.equal(h.count("fetchStudents"), 1);
  assert.equal(h.calls.find(c => c.name === "error").args[0], "Cancel rejected");
  h.cleanup();
});

const masterpiece = () => harness("useMasterpieceFlow.ts", "useMasterpieceFlow", {
  perks: [{id: "perk", key: "masterpiece", title: "Masterpiece"}],
});
const masterpieceEvent = (pillar = "Leadership", before = 2) => event({
  maxedSkillName: pillar, pointsGained: 1, pointsBefore: before,
  pointsAfter: before + 1, available_points: before + 1,
});

test("Masterpiece real completion opens reward and refetches committed pool without emitting an action", () => {
  const h = masterpiece();
  h.socket.receive("perk-activated", masterpieceEvent());
  h.rerender();
  assert.equal(h.result.masterpieceReward.pillar, "Leadership");
  assert.equal(h.result.masterpieceReward.pointsGained, 1);
  assert.equal(h.result.masterpieceReward.poolAfterReward, 3);
  assert.equal(h.count("emit"), 0);
  assert.deepEqual(h.calls.filter(c => c.name === "invalidateQueries").map(c => JSON.stringify(c.args[0].queryKey)), [JSON.stringify(["skills", "owner", "class"]), JSON.stringify(["assigned-ceo", "class", "owner"])]);
  h.result.closeMasterpieceReward();
  h.rerender();
  assert.equal(h.result.masterpieceReward, null);
  h.cleanup();
});

test("Masterpiece rejects another owner, unknown perk, approval-only, failed and malformed rewards", () => {
  const h = masterpiece();
  const other = masterpieceEvent(); other.data.studentId = "other";
  const foreign = masterpieceEvent(); foreign.data.perkId = "foreign";
  const failed = masterpieceEvent(); failed.success = false;
  const approved = masterpieceEvent(); approved.data.perk_status = "approved";
  const invalidPool = masterpieceEvent(); invalidPool.data.effects.available_points = 99;
  for (const response of [other, foreign, failed, approved, invalidPool, event({waitingForTrigger: true}, "approved")]) h.socket.receive("perk-activated", response);
  h.rerender();
  assert.equal(h.result.masterpieceReward, null);
  assert.equal(h.count("invalidateQueries"), 0);
  h.cleanup();
});

test("Masterpiece deduplicates delivery, queues different pillars and cleans up only its listener", () => {
  const h = masterpiece();
  h.socket.receive("perk-activated", masterpieceEvent());
  h.rerender();
  h.socket.receive("perk-activated", masterpieceEvent());
  h.socket.receive("perk-activated", masterpieceEvent("Strategy", 3));
  h.rerender();
  assert.equal(h.listenerCount("perk-activated"), 1);
  h.result.closeMasterpieceReward(); h.rerender();
  assert.equal(h.result.masterpieceReward.pillar, "Strategy");
  h.result.closeMasterpieceReward(); h.rerender();
  assert.equal(h.result.masterpieceReward, null);
  assert.equal(h.count("invalidateQueries"), 4);
  let externalCalls = 0;
  h.socket.on("perk-activated", () => { externalCalls++; });
  h.cleanup();
  h.socket.receive("perk-activated", masterpieceEvent());
  assert.equal(externalCalls, 1);
  assert.equal(h.listenerCount("perk-activated"), 1);
});

test("Masterpiece session change clears a previous reward", () => {
  const h = masterpiece();
  h.socket.receive("perk-activated", masterpieceEvent());
  h.rerender();
  h.options.courseId = "new-class";
  h.options.perks = [];
  h.rerender(); h.rerender();
  assert.equal(h.result.masterpieceReward, null);
  h.socket.receive("perk-activated", masterpieceEvent());
  h.rerender();
  assert.equal(h.result.masterpieceReward, null);
  h.cleanup();
});

test("Masterpiece reward presentation replaces the generic completion toast without opening another perk", () => {
  const h = dispatcher();
  h.options.perks = [{id: "perk", key: "masterpiece", title: "Masterpiece"}];
  h.options.dangerZonePerkId = null;
  h.rerender();
  h.socket.receive("perk-activated", masterpieceEvent());
  assert.equal(h.count("success"), 0);
  assert.equal(h.count("setDangerZoneModalOpen"), 0);
  assert.equal(h.count("setTargetRivalModalOpen"), 0);
  assert.equal(h.count("onPerkUpdate"), 1);
  h.cleanup();
});
