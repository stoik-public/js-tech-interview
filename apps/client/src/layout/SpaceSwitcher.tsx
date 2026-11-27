import { Menu as BaseMenu } from '@base-ui/react/menu';
import {
  IconCheck,
  IconRadar2,
  IconSelector,
  IconShieldLock,
  type Icon,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';

import { useTests } from '../lib/server-state';

/** How each hiring test presents itself in the switcher. The API only knows its id and name. */
type Space = { space: string; platform: string; icon: Icon; tile: string };

const SPACES: Record<string, Space> = {
  insurance: {
    space: 'Broker Space',
    platform: 'Broker Platform',
    icon: IconShieldLock,
    tile: 'bg-linear-to-br from-blue-4 to-blue-7',
  },
  protect: {
    space: 'Protect Space',
    platform: 'Stoïk Protect',
    icon: IconRadar2,
    tile: 'bg-linear-to-br from-cyan-5 to-cyan-8',
  },
};

const FALLBACK: Space = {
  space: 'Stoïk',
  platform: 'Other tests',
  icon: IconShieldLock,
  tile: 'bg-linear-to-br from-gray-5 to-gray-8',
};

const spaceOf = (test: string | null) => (test && SPACES[test]) || FALLBACK;

function Tile({ space, size }: { space: Space; size: 'sm' | 'md' }) {
  const Icon = space.icon;
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center text-white shadow-sm ${space.tile} ${size === 'md' ? 'size-9 rounded-md' : 'size-6 rounded-sm'}`}
    >
      <Icon size={size === 'md' ? 20 : 15} stroke={1.75} />
    </span>
  );
}

/**
 * The app's name and the space of the open test, as a menu to switch to another test. Each test
 * has its own pages, tables and routes, grouped under the platform it belongs to.
 */
export function SpaceSwitcher({ current }: { current: string | null }) {
  const tests = useTests();
  const navigate = useNavigate();
  const space = spaceOf(current);

  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        aria-label={`Switch test, current: ${space.space}`}
        className="border-gray-2 hover:bg-gray-1 data-[popup-open]:bg-gray-1 flex w-full items-center gap-2.5 rounded-md border bg-white p-1.5 text-left transition-colors sm:p-2"
      >
        <Tile space={space} size="md" />
        <span className="hidden min-w-0 grow leading-tight sm:block">
          <span className="block truncate text-sm font-semibold">Stoïk</span>
          <span className="text-gray-7 block truncate text-xs">{space.space}</span>
        </span>
        <IconSelector aria-hidden size={16} stroke={1.5} className="text-gray-6 shrink-0" />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={4} align="start" className="z-50 outline-none">
          <BaseMenu.Popup className="border-gray-2 w-(--anchor-width) min-w-56 origin-(--transform-origin) overflow-hidden rounded-md border bg-white shadow-md transition-[opacity,scale] duration-100 outline-none data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            {tests.data?.map((test) => {
              const option = spaceOf(test.id);
              const selected = test.id === current;
              return (
                <BaseMenu.Group
                  key={test.id}
                  className="border-gray-2 border-t p-1 first:border-t-0"
                >
                  <BaseMenu.GroupLabel className="text-gray-6 px-2 pt-1.5 pb-1 text-xs">
                    {option.platform}
                  </BaseMenu.GroupLabel>
                  <BaseMenu.Item
                    onClick={() => navigate(`/${test.id}`)}
                    aria-current={selected ? 'page' : undefined}
                    className="data-[highlighted]:bg-gray-1 flex cursor-default items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                  >
                    <Tile space={option} size="sm" />
                    <span className="grow">{test.name}</span>
                    {selected && (
                      <IconCheck aria-hidden size={16} stroke={2} className="text-blue" />
                    )}
                  </BaseMenu.Item>
                </BaseMenu.Group>
              );
            })}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
