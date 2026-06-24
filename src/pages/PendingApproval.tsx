import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../data/AuthContext';
import { Button } from '../components/Button';

export function PendingApproval() {
  const navigate = useNavigate();
  const { session, profile, signOut } = useAuth();

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="text-center">
          <p className="text-sm text-gray-500">You need to be signed in to view this page.</p>
          <Link to="/login" className="text-brand-600 hover:text-brand-700 text-sm font-medium mt-2 inline-block">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const roleLabel =
    profile?.role === 'clinic' ? 'Clinic Staff' :
    profile?.role === 'vendor' ? 'Transport Vendor' :
    profile?.role === 'admin' ? 'Admin' :
    profile?.role ?? 'user';

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 32 32" stroke="currentColor">
                <path strokeLinecap="round" strokeWidth={3} d="M6.5 19.5C9 19.5 11 17.5 13.5 15.5S18 13.5 20 15s3.5 4 6 4" />
                <circle cx="6.5" cy="19.5" r="2.5" fill="currentColor" stroke="none" />
                <circle cx="26" cy="19" r="2.5" fill="#34d399" stroke="none" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Renal Ride</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Account Pending Approval
          </h1>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-sm mx-auto">
            Your account has been created, but your <strong>{roleLabel}</strong> role requires
            admin approval before you can access the dashboard.
          </p>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed max-w-sm mx-auto">
            You'll receive an email notification once your access has been approved.
            This typically takes 1–2 business days.
          </p>

          <div className="mt-8 space-y-3 max-w-xs mx-auto">
            <Link to="/demo" className="block">
              <Button className="w-full">Explore the Demo</Button>
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer h-9 px-4 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
