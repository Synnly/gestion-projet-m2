import React from 'react';
import { Bell } from 'lucide-react';
import Logo from '../icons/Logo';

export type NavLink = {
  label: string;
  href?: string;
  active?: boolean;
};

export interface HeaderProps {
  navLinks?: NavLink[];
  showPostButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  navLinks = [
    { label: 'Dashboard', href: '/company/dashboard' },
    { label: 'Internship', href: '', active: true },
    { label: 'Profile', href: '#' },
  ],
  showPostButton = true,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-base-100 border-b border-base-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-4 shrink-0">
              <div className="text-primary">
                <Logo className="text-primary" />
          </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {navLinks.map((n) => (
              <a key={n.label} href={n.href} className={n.active ? 'font-bold text-base-content' : 'font-medium text-base-content/80 hover:text-base-content'}>
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {showPostButton && (
              <button className="btn btn-primary hidden sm:inline-flex">Post a Job</button>
            )}

            <button className="btn btn-ghost btn-circle">
              <Bell size={18} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
