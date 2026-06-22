import { useLocation } from 'react-router-dom';
import { Card } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

const pageDescriptions: Record<string, string> = {
  rides: 'View and manage ride requests, schedules, and history.',
  schedule: 'Manage your dialysis appointment schedule and transportation times.',
  profile: 'Update your personal information, preferences, and notification settings.',
  patients: 'View and manage patient records, assignments, and ride coordination.',
  appointments: 'Track clinic appointments and associated transportation needs.',
  drivers: 'Manage driver assignments, availability, and performance.',
  fleet: 'Monitor vehicle status, maintenance schedules, and fleet capacity.',
  users: 'Manage user accounts, roles, and access permissions across the platform.',
  clinics: 'Configure clinic locations, hours, and transportation partnerships.',
  reports: 'View analytics, ride metrics, and generate operational reports.',
  settings: 'Configure system settings, integrations, and platform preferences.',
};

export function PlaceholderPage() {
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const slug = segments[segments.length - 1];
  const title = slug.charAt(0).toUpperCase() + slug.slice(1);
  const description = pageDescriptions[slug] ?? 'This section is under development.';

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={description}
        action={<Button variant="outline" size="sm" disabled>Coming Soon</Button>}
      />

      <Card>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Under Development</h2>
          <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
            The <span className="font-medium text-gray-700">{title}</span> page will
            be available in a future update.
          </p>
          <Badge variant="neutral" className="mt-4">Planned for v0.2</Badge>
        </div>
      </Card>
    </div>
  );
}
