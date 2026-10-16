type CheckoutStorage = Pick<Storage, "getItem" | "setItem">;
type CheckoutLock = (key: string, work: () => string) => Promise<string>;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Persist only the anonymous key. Never put a card or client secret in storage.
export const getCheckoutId = async (
  storage: CheckoutStorage,
  cohortId: string,
  email: string,
  lock?: CheckoutLock,
  createId: () => string = () => crypto.randomUUID(),
): Promise<string> => {
  const storageKey = `commerceclash:checkout:${JSON.stringify([
    cohortId,
    email.trim().toLowerCase(),
  ])}`;
  const getOrCreate = () => {
    const existing = storage.getItem(storageKey);
    if (existing && UUID_V4.test(existing)) return existing;
    const checkoutId = createId();
    storage.setItem(storageKey, checkoutId);
    return checkoutId;
  };
  // Web Locks keep simultaneous tabs from selecting different keys.
  return lock ? lock(storageKey, getOrCreate) : getOrCreate();
};

export const isPaymentSubmitted = (status: string) =>
  ["processing", "succeeded", "requires_capture"].includes(status);
