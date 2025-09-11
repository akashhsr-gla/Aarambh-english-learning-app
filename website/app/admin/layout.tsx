'use client';

import {
  BarChart3,
  Calendar,
  CreditCard,
  Gamepad2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  X
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Allow the login route to render without auth/layout chrome
  if (pathname === '/admin/login') {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (!token || !user) {
      router.push('/admin/login');
      return;
    }

    // Validate token with backend; if invalid, force login
    const validate = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const resp = await fetch(`${apiBase}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          router.push('/admin/login');
          return;
        }
        setAdminUser(JSON.parse(user));
      } catch {
        // On network error, keep minimal guard by using stored user
        setAdminUser(JSON.parse(user));
      }
    };
    validate();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      current: pathname === '/admin/dashboard'
    },
    {
      name: 'Games Management',
      href: '/admin/games',
      icon: Gamepad2,
      current: pathname.startsWith('/admin/games')
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      current: pathname.startsWith('/admin/users')
    },
    {
      name: 'Payment Management',
      href: '/admin/payments',
      icon: CreditCard,
      current: pathname.startsWith('/admin/payments')
    },
    {
      name: 'Session Management',
      href: '/admin/sessions',
      icon: Calendar,
      current: pathname.startsWith('/admin/sessions')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: pathname.startsWith('/admin/analytics')
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      current: pathname.startsWith('/admin/settings')
    }
  ];

  if (!adminUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-auto lg:h-screen lg:sticky lg:top-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Aarambh Admin</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Sidebar body */}
        <div className="flex flex-col h-[calc(100%-4rem)]">
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = item.current;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`group flex items-center rounded-md transition-colors border-l-4 ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-transparent'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="inline-flex items-center px-3 py-2 text-sm font-medium w-full">
                      <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? 'text-indigo-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      <span className="truncate">{item.name}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info and logout */}
          <div className="mt-auto p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {(adminUser?.name || 'A').charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminUser?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {adminUser?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="min-h-screen lg:col-start-2 lg:col-end-3">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome back, <span className="font-medium text-gray-900">{adminUser?.name || 'Admin'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
