import { useLocation } from 'react-router';

/** The hiring test of the open page: the first segment of its path, such as `insurance`. */
export function useCurrentTest(): string | null {
  return useLocation().pathname.split('/')[1] || null;
}
