import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, LoaderCircle } from 'lucide-react';
import { get, post, END_POINTS } from '@/api';
import { useUserContext } from '@/context/userContext/userContext';

type Status = 'polling' | 'signing_in' | 'timeout';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;

export function PaymentSuccess() {
  const navigate = useNavigate();
  const { setIsLoggedIn, setRole, setId, setUser } = useUserContext();
  const [params] = useState(() => new URLSearchParams(window.location.search));
  // `session_id` comes from the hosted Checkout Session flow; `payment_intent`
  // is what Stripe appends when a redirect-based payment method sends the
  // user back here from the embedded PaymentElement flow — same polling path
  // either way, since stripe_events.session_id stores either kind of id.
  const sessionId = params.get('session_id') ?? params.get('payment_intent');

  const [status, setStatus] = useState<Status>(sessionId ? 'polling' : 'signing_in');
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const autoSignIn = async () => {
    const email = sessionStorage.getItem('pending_auth_email');
    const password = sessionStorage.getItem('pending_auth_password');

    sessionStorage.removeItem('pending_auth_email');
    sessionStorage.removeItem('pending_auth_password');

    if (!email || !password) {
      navigate('/auth/signin');
      return;
    }

    try {
      const response = await post(END_POINTS.SIGN_IN, { email, password });
      setIsLoggedIn(true);
      setRole(response.data.user.role);
      setId(response.data.user.id);
      setUser({
        name: response.data.user.name,
        email: response.data.user.email,
        status: response.data.user.status,
      });
      navigate('/');
    } catch {
      navigate('/auth/signin');
    }
  };

  useEffect(() => {
    if (!sessionId) {
      void autoSignIn();
      return;
    }

    const poll = async () => {
      try {
        const res = await get(`${END_POINTS.STRIPE_SESSION_STATUS}?sessionId=${sessionId}`);
        if (res.status === 'completed') {
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);
          setStatus('signing_in');
          void autoSignIn();
        }
      } catch {
        // network blip — keep polling
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setStatus('timeout');
    }, POLL_TIMEOUT_MS);

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'timeout' ? (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-yellow-900/40 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-yellow-400" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-3">Almost there!</h1>
            <p className="text-gray-400 mb-6">
              This is taking longer than usual. Your enrollment will complete shortly.
            </p>
            <button
              onClick={() => navigate('/auth/signin')}
              className="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              Go to Sign In
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <LoaderCircle className="w-12 h-12 animate-spin text-green-500" />
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-3">
              {status === 'signing_in' ? 'Logging you in…' : 'Setting up your account…'}
            </h1>
            <p className="text-gray-400 text-sm">
              {status === 'signing_in'
                ? 'Account ready. Taking you to the dashboard.'
                : 'Payment confirmed. Creating your account and enrolling you in the cohort.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
