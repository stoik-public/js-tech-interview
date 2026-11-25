import { Controller, Get, NotFoundException, Query, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { z } from 'zod';

import { TESTS } from 'src/core/infra/dev/tests';

export type RouteInfo = {
  method: string;
  path: string;
  /** Bounded context of the controller, from its Nest module (DistributionModule -> distribution). */
  context: string;
  controller: string;
  /** JSON schema of the request body, from the zod schema given to `@Body({ schema })`. */
  bodySchema: unknown;
};

const join = (...parts: string[]) =>
  `/${parts
    .flatMap((p) => p.split('/'))
    .filter(Boolean)
    .join('/')}`;

/**
 * Every HTTP route of the API, read from Nest's own metadata, for the toolbox's API explorer.
 * With `?test=`, only the routes of that test's bounded contexts.
 */
@Controller('dev/routes')
export class DevRoutesController {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
  ) {}

  @Get()
  list(@Query('test') testId?: string): RouteInfo[] {
    const test = testId === undefined ? undefined : TESTS.find(({ id }) => id === testId);
    if (testId !== undefined && !test) throw new NotFoundException(`Unknown test: ${testId}`);
    const contexts = test?.contexts;

    const routes = this.discovery.getControllers().flatMap(({ instance, metatype, host }) => {
      if (!instance || !metatype) return [];
      const context = (host?.metatype?.name ?? '').replace(/Module$/, '').toLowerCase();
      // The developer routes are tooling, not part of the API a candidate works on.
      if (context === 'dev' || (contexts && !contexts.includes(context))) return [];
      const prototype = Object.getPrototypeOf(instance);
      const base = [Reflect.getMetadata(PATH_METADATA, metatype) ?? ''].flat()[0];

      return this.scanner.getAllMethodNames(prototype).flatMap((name) => {
        const handler = prototype[name];
        const path = Reflect.getMetadata(PATH_METADATA, handler);
        if (path === undefined) return [];
        const args: Record<string, { schema?: z.ZodType }> =
          Reflect.getMetadata(ROUTE_ARGS_METADATA, metatype, name) ?? {};
        const schema = Object.values(args).find((arg) => arg.schema)?.schema;
        return {
          method: RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler)],
          path: join('api', base, [path].flat()[0]),
          context,
          controller: metatype.name,
          bodySchema: schema ? z.toJSONSchema(schema, { io: 'input' }) : null,
        };
      });
    });
    return routes.sort(
      (a, b) => a.context.localeCompare(b.context) || a.path.localeCompare(b.path),
    );
  }
}
