import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';

export function RequestDemo() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production, submit to a backend endpoint or Supabase table
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 32 32" stroke="currentColor">
                <path d="M12 9C12 7 10 6 8 6C5.5 6 4 9.5 4 16C4 22.5 5.5 26 8 26C10 26 12 25 12 23C12 21 10 19 10 16C10 13 12 11 12 9Z" fill="currentColor" stroke="none" />
                <path d="M20 9C20 7 22 6 24 6C26.5 6 28 9.5 28 16C28 22.5 26.5 26 24 26C22 26 20 25 20 23C20 21 22 19 22 16C22 13 20 11 20 9Z" fill="currentColor" stroke="none" />
                <line x1="12" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Renal Ride</span>
          </Link>
          <Link to="/login" className="text-xs text-gray-500 hover:text-gray-700">
            Sign In
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Request Submitted</h1>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                Thank you, {name}! We'll review your request and get back to you
                at <strong>{email}</strong>.
              </p>
              <div className="mt-6 space-y-3">
                <Link to="/demo">
                  <Button className="w-full">Try the Interactive Demo</Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" className="w-full">Back to Home</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                  Request Clinic Access
                </h1>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  Interested in using Renal Ride for your clinic or transportation company?
                  Tell us about your organization and we'll set you up.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="req-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name
                  </label>
                  <input
                    id="req-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#e2e2e2] px-3 py-2 text-[13px] text-[#171717] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                    placeholder="Jane Smith"
                  />
                </div>

                <div>
                  <label htmlFor="req-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="req-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#e2e2e2] px-3 py-2 text-[13px] text-[#171717] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                    placeholder="you@clinic.org"
                  />
                </div>

                <div>
                  <label htmlFor="req-org" className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <input
                    id="req-org"
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#e2e2e2] px-3 py-2 text-[13px] text-[#171717] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                    placeholder="Fresenius Kidney Care"
                  />
                </div>

                <div>
                  <label htmlFor="req-phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="req-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#e2e2e2] px-3 py-2 text-[13px] text-[#171717] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0e7490] focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="req-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="req-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-[#e2e2e2] px-3 py-2 text-[13px] text-[#171717] placeholder-[#a3a3a3] focus:outline-none focus:ring-2 focus:ring-[#0e7490] focus:border-transparent resize-none"
                    placeholder="Tell us about your transportation needs..."
                  />
                </div>

                <Button type="submit" className="w-full">Submit Request</Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500">
                Want to explore first?{' '}
                <Link to="/demo" className="text-brand-600 hover:text-brand-700 font-medium">
                  Try the demo
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
