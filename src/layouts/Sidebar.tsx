import { NavLink, useLocation } from 'react-router-dom';
import { useRole } from '../data/RoleContext';
import { roleNavItems, roleLabels } from '../data/roles';
import { NavIcon } from '../components/NavIcon';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { role } = useRole();
  const location = useLocation();
  const isGuidedDemo = location.pathname.startsWith('/demo/guided');
  const isOpsDemo = location.pathname.startsWith('/demo/operations');
  const isDemo = isGuidedDemo || isOpsDemo;

  if (!role) return null;

  const demoPrefix = isGuidedDemo ? '/demo/guided' : isOpsDemo ? '/demo/operations' : '/demo';
  const navItems = roleNavItems[role].map((item) => ({
    ...item,
    path: isDemo ? item.path.replace('/app', demoPrefix) : item.path,
  }));

  const sidebar = (
    <aside
      className="flex flex-col shrink-0 h-full"
      style={{ width: 236, background: '#fff', borderRight: '1px solid #eaeaea' }}
    >
      <div style={{ padding: '18px 12px 10px' }}>
        <div className="flex items-center gap-2" style={{ padding: '0 10px' }}>
          <span style={{ height: 6, width: 6, borderRadius: 999, background: '#0e7490' }} />
          <p style={{ fontSize: 11, fontWeight: 600, color: '#a3a3a3', letterSpacing: '0.06em', margin: 0 }}>
            {roleLabels[role].toUpperCase()}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto" style={{ padding: '0 12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-[11px] no-underline transition-colors ${isActive ? '' : ''}`
              }
              style={({ isActive }) => ({
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: isActive ? '#0e6a82' : '#525252',
                background: isActive ? '#f0f7f9' : 'transparent',
                textDecoration: 'none',
              })}
            >
              <NavIcon name={item.icon} className="w-[17px] h-[17px]" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '1px 7px',
                    borderRadius: 999,
                    background: item.badgeColor === 'red' ? '#fef2f2' : '#fff7ed',
                    color: item.badgeColor === 'red' ? '#b91c1c' : '#b45309',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div style={{ marginTop: 'auto', padding: '12px 10px 14px', borderTop: '1px solid #f0f0f0', margin: '0 12px' }}>
        <p style={{ fontSize: 11, color: '#a3a3a3', lineHeight: 1.5, margin: 0 }}>
          Prototype build — sample data only. No live patient records.
        </p>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:flex h-full">
        {sidebar}
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-900/20" onClick={onClose} />
          <div className="relative z-50 bg-white shadow-xl">
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
