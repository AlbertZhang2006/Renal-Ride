import { NavLink, useLocation } from 'react-router-dom';
import { useRole } from '../data/RoleContext';
import { roleNavItems, roleLabels, roleColors } from '../data/roles';
import { NavIcon } from '../components/NavIcon';
import { cn } from '../utils/cn';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { role } = useRole();
  const location = useLocation();
  const isDemo = location.pathname.startsWith('/demo');

  if (!role) return null;

  const navItems = roleNavItems[role].map((item) => ({
    ...item,
    path: isDemo ? item.path.replace('/app', '/demo') : item.path,
  }));

  const sidebar = (
    <aside className="flex flex-col w-56 bg-white border-r border-gray-200 shrink-0 h-full">
      <div className="px-3 pt-5 pb-2">
        <div className="px-3 flex items-center gap-2">
          <span className={cn('h-1.5 w-1.5 rounded-full', roleColors[role].dot)} />
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
            {roleLabels[role]}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              )
            }
          >
            <NavIcon name={item.icon} className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400">
          Renal Ride v0.1
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-full">
        {sidebar}
      </div>

      {/* Mobile overlay */}
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
