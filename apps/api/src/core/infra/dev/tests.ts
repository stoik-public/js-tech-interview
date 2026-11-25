/**
 * The hiring tests this repository hosts, and the bounded contexts each one is about. The client
 * shows a test's pages, and the toolbox its tables and routes only, so a candidate sees one test.
 * Development tooling only: no bounded context reads it.
 */
export type Test = { id: string; name: string; contexts: readonly string[] };

export const TESTS: readonly Test[] = [
  { id: 'insurance', name: 'Insurance', contexts: ['distribution', 'pricing'] },
];
