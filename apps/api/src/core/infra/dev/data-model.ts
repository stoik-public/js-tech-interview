import { getTableName, is } from 'drizzle-orm';
import { getTableConfig, isPgEnum, PgArray } from 'drizzle-orm/pg-core';

import { DATABASE_CONTEXTS, isDatabaseContext, tablesOf } from 'src/core/infra/db/contexts';

export type DataModelColumn = {
  name: string;
  /** The SQL type, or the enum's name. */
  type: string;
  list: boolean;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  /** The values of an enum column. */
  enumValues: string[];
};

export type DataModelTable = {
  /** `schema.table` */
  id: string;
  name: string;
  context: string;
  columns: DataModelColumn[];
  foreignKeys: { columns: string[]; references: { table: string; columns: string[] } }[];
};

export type DataModel = {
  tables: DataModelTable[];
  enums: { name: string; context: string; values: string[] }[];
};

const tableId = (schema: string | undefined, name: string) => `${schema ?? 'public'}.${name}`;

// Taken from getTableConfig: drizzle-orm's CommonJS types name its column class differently.
type Column = ReturnType<typeof getTableConfig>['columns'][number];

function toColumn(column: Column, uniqueColumns: Set<string>): DataModelColumn {
  const list = is(column, PgArray);
  const base = list ? column.baseColumn : column;
  const pgEnum = 'enum' in base && isPgEnum(base.enum) ? base.enum : null;
  return {
    name: column.name,
    type: pgEnum ? pgEnum.enumName : base.getSQLType(),
    list,
    nullable: !column.notNull,
    primaryKey: column.primary,
    unique: column.isUnique || uniqueColumns.has(column.name),
    enumValues: pgEnum ? [...pgEnum.enumValues] : [],
  };
}

/** The tables of the given bounded contexts, read from their Drizzle schemas. */
export function dataModelOf(contexts: readonly string[]): DataModel {
  const owned = contexts.filter(isDatabaseContext);
  const tables = owned.flatMap((context) =>
    tablesOf(context).map((table): DataModelTable => {
      const config = getTableConfig(table);
      const uniqueColumns = new Set(
        config.uniqueConstraints
          .filter((constraint) => constraint.columns.length === 1)
          .map((constraint) => constraint.columns[0].name),
      );
      return {
        id: tableId(config.schema, config.name),
        name: config.name,
        context,
        columns: config.columns.map((column) => toColumn(column, uniqueColumns)),
        foreignKeys: config.foreignKeys.map((foreignKey) => {
          const reference = foreignKey.reference();
          return {
            columns: reference.columns.map((column) => column.name),
            references: {
              // No foreign key crosses bounded contexts: the table is in this context's schema.
              table: tableId(context, getTableName(reference.foreignTable)),
              columns: reference.foreignColumns.map((column) => column.name),
            },
          };
        }),
      };
    }),
  );
  const enums = owned.flatMap((context) =>
    Object.values(DATABASE_CONTEXTS[context])
      .filter((value) => isPgEnum(value))
      .map((value) => ({ name: value.enumName, context, values: [...value.enumValues] })),
  );
  return { tables, enums };
}
