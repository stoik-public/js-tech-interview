import {
  IconAddressBook,
  IconBriefcase,
  IconBuildingSkyscraper,
  type Icon,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router';

import { useCurrentTest } from './current-test';
import { SpaceSwitcher } from './SpaceSwitcher';

/** The sidebar of each hiring test. */
const navigation: Record<string, () => ReactNode> = {
  insurance: () => (
    <>
      <SidebarItem to="/insurance/prospects" icon={IconAddressBook}>
        Prospects
      </SidebarItem>
      <p className="text-gray hidden px-3 py-2 text-xs font-medium sm:block">Portfolio</p>
      <SidebarItem to="/insurance/contracts" icon={IconBriefcase}>
        Contracts
      </SidebarItem>
    </>
  ),
  protect: () => (
    <SidebarItem to="/protect/companies" icon={IconBuildingSkyscraper}>
      Companies
    </SidebarItem>
  ),
};

/** Shell of every page: navigation, then the page in a white panel. */
export function AppShell() {
  const test = useCurrentTest();
  const Navigation = test ? navigation[test] : undefined;
  return (
    <div className="bg-gray-0 min-h-screen sm:flex sm:h-screen">
      <a
        href="#content"
        className="sr-only rounded-sm bg-white px-3 py-2 shadow-md focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to content
      </a>
      {/* A top bar on phones, a sidebar from the `sm` breakpoint. */}
      <nav
        aria-label="Main"
        className="border-gray-2 flex items-center gap-1 border-b px-2 py-1.5 sm:h-screen sm:w-[248px] sm:shrink-0 sm:flex-col sm:items-stretch sm:gap-0 sm:border-0 sm:p-0 sm:pb-2"
      >
        <div className="shrink-0 sm:px-2 sm:pt-2 sm:pb-3">
          <SpaceSwitcher current={test} />
        </div>
        <div className="flex min-w-0 grow items-center gap-1 overflow-x-auto sm:block sm:space-y-1 sm:overflow-y-auto sm:px-2 sm:pb-2">
          {Navigation && <Navigation />}
        </div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col sm:overflow-hidden sm:p-2">
        <main
          id="content"
          tabIndex={-1}
          className="relative flex-1 bg-white focus:outline-none sm:overflow-y-auto sm:rounded-md sm:shadow-lg"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: Icon;
  children: ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-1.5 rounded-sm p-2 whitespace-nowrap text-black sm:p-3 ${isActive ? 'bg-gray-2' : 'hover:bg-gray-1'}`
      }
    >
      <Icon aria-hidden size={20} stroke={1.5} />
      {children}
    </NavLink>
  );
}
