'use client';

import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  UserIcon,
  EyeIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  CpuChipIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { USER_ROLES } from '@/lib/appwrite';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ children }) {
  const { user, organization, logout, isSuperAdmin, isOrgAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      router.push('/login');
    }
  };


  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, current: false },
    ...(isSuperAdmin && isSuperAdmin() ? [
      { name: 'Organizations', href: '/organizations', icon: BuildingOfficeIcon, current: false },
      { name: 'System Analytics', href: '/analytics', icon: ChartBarIcon, current: false }
    ] : []),
    ...((isOrgAdmin && isOrgAdmin()) || (isSuperAdmin && isSuperAdmin()) ? [
      { name: 'Live View', href: '/live-view', icon: PlayIcon, current: false },
      { name: 'Cameras', href: '/cameras', icon: VideoCameraIcon, current: false },
      { name: 'Detection Events', href: '/detection-events', icon: EyeIcon, current: false },
      { name: 'AI Detection', href: '/ai-detection', icon: CpuChipIcon, current: false },
      { name: 'Known Persons', href: '/known-persons', icon: UserIcon, current: false },
      { name: 'Users', href: '/users', icon: UserGroupIcon, current: false },
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, current: false }
    ] : []),
    { name: 'Alerts', href: '/alerts', icon: ExclamationTriangleIcon, current: false },
    { name: 'Notifications', href: '/notifications', icon: BellIcon, current: false }
  ];

  if (!user) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black">
      <Toaster position="top-right" />
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px] opacity-20"></div>
      
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar component */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-r border-gray-700/50 px-6 pb-2">
                  <div className="flex shrink-0 items-center justify-center px-6 py-5">
                    <img
                      className="h-16 w-auto"
                      src="https://fra.cloud.appwrite.io/v1/storage/buckets/faces/files/690c871d003cfffb38af/view?project=690c7785003337dac829&mode=admin"
                      alt="UMA AEye Logo"
                    />
                    <h1 className="ml-4 text-xl font-light text-white tracking-wide self-center">aEye</h1>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className={classNames(
                                  item.current
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-300 hover:text-white hover:bg-white/5',
                                  'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200'
                                )}
                              >
                                <item.icon
                                  className={classNames(
                                    item.current ? 'text-white' : 'text-gray-400 group-hover:text-white',
                                    'h-5 w-5 shrink-0'
                                  )}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-r border-gray-700/50 px-6">
          <div className="flex shrink-0 items-center justify-center px-6 py-5">
            <img
              className="h-16 w-auto"
              src="https://fra.cloud.appwrite.io/v1/storage/buckets/faces/files/690c871d003cfffb38af/view?project=690c7785003337dac829&mode=admin"
              alt="UMA AEye Logo"
            />
            <h1 className="ml-4 text-xl font-light text-white tracking-wide self-center">aEye</h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={classNames(
                          item.current
                            ? 'bg-white/10 text-white'
                            : 'text-gray-300 hover:text-white hover:bg-white/5',
                          'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200'
                        )}
                      >
                        <item.icon
                          className={classNames(
                            item.current ? 'text-white' : 'text-gray-400 group-hover:text-white',
                            'h-5 w-5 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <div className="flex items-center gap-x-4 px-6 py-4 border-t border-gray-700/50">
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-sm font-medium text-white">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white block">{user?.name || 'User'}</span>
                    <span className="text-xs text-gray-400">{user?.profile?.role || 'User'}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-slate-900/95 backdrop-blur-xl border-b border-gray-700/50 px-4 py-4 lg:hidden">
        <button type="button" className="-m-2.5 p-2.5 text-gray-300 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-medium leading-6 text-white">Dashboard</div>
        <div className="flex items-center gap-x-4">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <span className="text-sm font-medium text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <main className="py-8 lg:pl-72 relative z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
