const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const ts = require("typescript");
const compile = (file) =>
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText;
const identityModule = { exports: {} };
vm.runInNewContext(compile("src/pages/checkout/checkoutIdentity.ts"), {
  module: identityModule,
  exports: identityModule.exports,
  crypto: webcrypto,
});
const formCode = compile("src/pages/checkout/CheckoutForm.tsx");
const baseIntent = {
  success: true,
  paymentIntentId: "pi_test",
  clientSecret: "test_secret",
  status: "requires_payment_method",
  amount: 10000,
  currency: "usd",
};
const makeStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};
function fixture({
  storage = makeStorage(),
  intent = baseIntent,
  post,
  confirm,
} = {}) {
  const ctx = {
    states: [
      "Student",
      "student@example.test",
      true,
      false,
      null,
      null,
      {},
      { number: true, expiry: true, cvc: true },
      { status: "idle" },
    ],
    refs: [],
    posts: [],
    confirmations: [],
    submitted: [],
    prices: [],
  };
  const fallback = new Proxy(
    {},
    { get: (_, key) => (key === "__esModule" ? true : String(key)) },
  );
  const mocks = {
    react: {
      useState: (initial) => {
        const index = ctx.stateIndex++;
        if (!(index in ctx.states)) ctx.states[index] = initial;
        return [
          ctx.states[index],
          (value) => {
            ctx.states[index] =
              typeof value === "function" ? value(ctx.states[index]) : value;
          },
        ];
      },
      useRef: (initial) =>
        ctx.refs[ctx.refIndex++] ??
        (ctx.refs[ctx.refIndex - 1] = { current: initial }),
      useEffect: () => {},
    },
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    "@stripe/react-stripe-js": {
      ...fallback,
      useElements: () => ({ getElement: () => ({ testCard: true }) }),
      useStripe: () => ({
        confirmCardPayment: async (...args) => {
          ctx.confirmations.push(args);
          return confirm
            ? confirm(...args)
            : {
                paymentIntent: {
                  id: "pi_test",
                  status: "succeeded",
                  receipt_email: "student@example.test",
                },
              };
        },
      }),
    },
    "@/api": {
      END_POINTS: { STRIPE_PAYMENT_INTENT: "/stripe/payment-intent" },
      post: async (url, body) => {
        ctx.posts.push({ url, body });
        return post ? post(url, body) : intent;
      },
    },
    "@/pages/chooseClass/validation": {
      isValidEmail: (email) => email.includes("@"),
    },
    "@/pages/chooseClass/format": { formatDate: () => "Test date" },
    "./stripeConfig": {
      CARD_ELEMENT_OPTIONS: {},
      CHECKOUT_FORM_ID: "test-checkout",
    },
    "./utils": { formatPrice: () => "$100" },
    "./checkoutIdentity": identityModule.exports,
  };
  const module = { exports: {} };
  vm.runInNewContext(formCode, {
    module,
    exports: module.exports,
    require: (key) => mocks[key] ?? fallback,
    window: { localStorage: storage },
    navigator: {},
  });
  const props = {
    cohort: { id: "test-class", name: "Test class" },
    price: { amount: 10000, currency: "usd" },
    priceStatus: "ready",
    onRetryPrice: () => {},
    onPaymentSubmitted: (payment) => ctx.submitted.push(payment),
    onPriceResolved: (price) => ctx.prices.push(price),
  };
  const render = () => {
    ctx.stateIndex = 0;
    ctx.refIndex = 0;
    return module.exports.CheckoutForm(props);
  };
  const submit = (tree) =>
    nodes(tree ?? render())
      .find((node) => node.type === "form")
      .props.onSubmit({ preventDefault() {} });
  return { ctx, props, render, submit };
}
function nodes(node, results = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => nodes(child, results));
    return results;
  }
  if (!node || typeof node !== "object") return results;
  if (node.type) results.push(node);
  nodes(node.props?.children, results);
  return results;
}

test("two submits before a render create and confirm only one payment", async () => {
  const f = fixture();
  const tree = f.render();
  await Promise.all([f.submit(tree), f.submit(tree)]);
  assert.equal(f.ctx.posts.length, 1);
  assert.equal(f.ctx.confirmations.length, 1);
  assert.equal(f.ctx.submitted.length, 1);
});

for (const status of ["processing", "succeeded", "requires_capture"]) {
  test(`${status} returned by backend resumes enrollment without confirming again`, async () => {
    const f = fixture({
      intent: { ...baseIntent, status, clientSecret: null },
    });
    await f.submit();
    assert.equal(f.ctx.confirmations.length, 0);
    assert.equal(f.ctx.submitted[0].paymentIntentId, "pi_test");
  });
}

test("API retry after a lost response reuses the same checkout key", async () => {
  let calls = 0;
  const f = fixture({
    post: () => {
      if (++calls === 1) throw new Error("Response lost");
      return baseIntent;
    },
  });
  await f.submit();
  await f.submit();
  assert.equal(f.ctx.posts[0].body.checkoutId, f.ctx.posts[1].body.checkoutId);
  assert.equal(f.ctx.confirmations.length, 1);
});

test("refreshing checkout reuses the saved key and resumes an accepted payment", async () => {
  const storage = makeStorage();
  const original = fixture({
    storage,
    confirm: () => ({ error: { message: "Connection lost" } }),
  });
  await original.submit();
  const refreshed = fixture({
    storage,
    intent: { ...baseIntent, status: "succeeded", clientSecret: null },
  });
  await refreshed.submit();
  assert.equal(
    original.ctx.posts[0].body.checkoutId,
    refreshed.ctx.posts[0].body.checkoutId,
  );
  assert.equal(refreshed.ctx.confirmations.length, 0);
});

test("a declined payment can retry with the same checkout key", async () => {
  let calls = 0;
  const f = fixture({
    confirm: () =>
      ++calls === 1
        ? { error: { message: "Card declined" } }
        : { paymentIntent: { id: "pi_test", status: "succeeded" } },
  });
  await f.submit();
  assert.ok(nodes(f.render()).some((node) => node.props.role === "alert"));
  await f.submit();
  assert.equal(f.ctx.posts[0].body.checkoutId, f.ctx.posts[1].body.checkoutId);
  assert.equal(f.ctx.submitted.length, 1);
});

test("an already accepted intent returned with a Stripe error resumes confirmation", async () => {
  const f = fixture({
    confirm: () => ({
      error: {
        message: "Unexpected state",
        payment_intent: { id: "pi_test", status: "succeeded" },
      },
    }),
  });
  await f.submit();
  assert.equal(f.ctx.submitted.length, 1);
});

test("another-browser conflict is visible and never calls Stripe confirmation", async () => {
  const f = fixture({
    post: () => {
      throw { message: "Continue in the browser where you started it" };
    },
  });
  await f.submit();
  assert.equal(f.ctx.confirmations.length, 0);
  assert.ok(
    JSON.stringify(f.render()).includes(
      "Continue in the browser where you started it",
    ),
  );
});

test("a changed saved order price must be reviewed before confirmation", async () => {
  const f = fixture({ intent: { ...baseIntent, amount: 12000 } });
  await f.submit();
  assert.equal(f.ctx.confirmations.length, 0);
  assert.ok(
    JSON.stringify(f.render()).includes("The checkout total has changed"),
  );
  f.props.price = f.ctx.prices[0];
  await f.submit();
  assert.equal(f.ctx.confirmations.length, 1);
});

test("contact inputs are disabled while a payment request is in progress", async () => {
  let release;
  const f = fixture({
    post: () =>
      new Promise((resolve) => {
        release = resolve;
      }),
  });
  const pending = f.submit();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  const inputs = nodes(f.render()).filter(
    (node) => node.type === "CheckoutField",
  );
  assert.equal(inputs.length, 2);
  assert.ok(inputs.every((node) => node.props.disabled));
  release(baseIntent);
  await pending;
});

test("storage failure prevents any API payment request", async () => {
  const f = fixture({
    storage: {
      getItem: () => null,
      setItem: () => {
        throw new Error("Storage unavailable");
      },
    },
  });
  await f.submit();
  assert.equal(f.ctx.posts.length, 0);
  assert.equal(f.ctx.confirmations.length, 0);
  assert.ok(JSON.stringify(f.render()).includes("Storage unavailable"));
});
