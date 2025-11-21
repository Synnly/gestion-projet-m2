import React from 'react';
import { Briefcase, Bell } from 'lucide-react';

export type NavLink = {
  label: string;
  href?: string;
  active?: boolean;
};

export interface HeaderProps {
  title?: string;
  navLinks?: NavLink[];
  avatarUrl?: string;
  showPostButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  title = 'JobConnect',
  navLinks = [
    { label: 'Dashboard', href: '#' },
    { label: 'Job Board', href: '#', active: true },
    { label: 'My Applications', href: '#' },
    { label: 'Profile', href: '#' },
  ],
  avatarUrl,
  showPostButton = true,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-base-100 border-b border-base-200 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Left: logo + title */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-primary">
              <Briefcase size={26} />
            </div>
            <span className="font-bold text-lg text-base-content">{title}</span>
          </div>

          {/* Center: nav (stays inline) */}
          <nav className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {navLinks.map((n) => (
              <a key={n.label} href={n.href} className={n.active ? 'font-bold text-base-content' : 'font-medium text-base-content/80 hover:text-base-content'}>
                {n.label}
              </a>
            ))}
          </nav>

          {/* Right: actions */}
          <div className="flex items-center gap-2 shrink-0">
            {showPostButton && (
              <button className="btn btn-primary hidden sm:inline-flex">Post a Job</button>
            )}

            <button className="btn btn-ghost btn-circle">
              <Bell size={18} />
            </button>

            {avatarUrl ? (
              <div className="avatar">
                <div className="w-10 rounded-full">
                  <img src={avatarUrl} alt="avatar" />
                </div>
              </div>
            ) : (
              <div className="avatar placeholder">
                <div className="bg-neutral-focus text-neutral-content rounded-full w-10">
                  <span>U</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
