import '@xyflow/react/dist/style.css';
import dagre from '@dagrejs/dagre';
import { IconLayoutGrid } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Handle,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
  type OnNodeDrag,
  type XYPosition,
} from '@xyflow/react';
import { useCallback, useMemo, useState } from 'react';

import { useCurrentTest } from '../layout/current-test';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { PageLoader } from '../ui/Loader';
import { Tooltip } from '../ui/Tooltip';
import { load, save } from './storage';

/** Shape returned by GET /api/dev/data-model/:test (apps/api/src/core/infra/dev/data-model.ts). */
type DataModelResponse = {
  tables: {
    /** `schema.table` */
    id: string;
    name: string;
    context: string;
    columns: {
      name: string;
      type: string;
      list: boolean;
      nullable: boolean;
      primaryKey: boolean;
      unique: boolean;
      enumValues: string[];
    }[];
    foreignKeys: { columns: string[]; references: { table: string; columns: string[] } }[];
  }[];
  enums: Enum[];
};
type Enum = { name: string; context: string; values: string[] };

/** Positions of the tables the user moved, for each test. */
const storageKey = (test: string) => `stoik-lite.toolbox.data-model.${test}.layout`;
type SavedLayout = Record<string, XYPosition>;

const NODE_WIDTH = 264;
const HEADER_HEIGHT = 40;
const ROW_HEIGHT = 28;

type Key = 'PK' | 'FK' | 'UK';
type Column = { name: string; type: string; keys: Key[]; values: string[] };
type Table = { id: string; name: string; columns: Column[] };
/** A foreign key: `child.childField` references `parent.parentField`. */
type Relation = {
  id: string;
  parent: string;
  parentField: string;
  child: string;
  childField: string;
  optional: boolean;
  oneToOne: boolean;
};

type TableData = { table: Table; highlighted: ReadonlySet<string>; dimmed: boolean };
type TableNode = Node<TableData, 'table'>;
type RelationData = { relation: Relation; state: 'idle' | 'active' | 'dimmed' };
type RelationEdge = Edge<RelationData, 'relation'>;

const nodeTypes = { table: TableNodeView };
const edgeTypes = { relation: RelationEdgeView };
const NONE: ReadonlySet<string> = new Set();

async function fetchDataModel(test: string): Promise<DataModelResponse> {
  const response = await fetch(`/api/dev/data-model/${test}`);
  if (!response.ok) throw new Error(`Could not read the data model (${response.status}).`);
  return response.json();
}

/** The tables of the open test, drawn from the API's Drizzle schemas as they are now. */
export function DataModelPanel() {
  const test = useCurrentTest() ?? 'insurance';
  const model = useQuery({
    queryKey: ['dev-data-model', test],
    queryFn: () => fetchDataModel(test),
  });
  if (model.isPending) return <PageLoader />;
  if (model.error) {
    return (
      <div className="p-4">
        <Alert tone="red">{model.error.message}</Alert>
      </div>
    );
  }
  return (
    <ReactFlowProvider>
      <DataModel key={test} test={test} model={model.data} />
    </ReactFlowProvider>
  );
}

type Props = { test: string; model: DataModelResponse };

function DataModel({ test, model }: Props) {
  const layoutKey = storageKey(test);
  const { enums } = model;
  const { tables, relations } = useMemo(() => toDiagram(model), [model]);
  const [nodes, setNodes] = useState(() =>
    toNodes(tables, relations, load<SavedLayout>(layoutKey) ?? undefined),
  );
  const [moved, setMoved] = useState(() => Boolean(load<SavedLayout>(layoutKey)));
  const { fitView } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange<TableNode>[]) => setNodes((current) => applyNodeChanges(changes, current)),
    [],
  );

  const onNodeDragStop: OnNodeDrag<TableNode> = (_event, _node, dragged) => {
    const positions = { ...load<SavedLayout>(layoutKey) };
    for (const node of dragged) positions[node.id] = node.position;
    save(layoutKey, positions);
    setMoved(true);
  };

  function resetLayout() {
    save(layoutKey, null);
    setMoved(false);
    setNodes(toNodes(tables, relations, undefined));
    requestAnimationFrame(() => void fitView({ duration: 300 }));
  }

  // The selected tables, their relations and the tables at the other end stand out.
  const focus = new Set(nodes.filter((node) => node.selected).map((node) => node.id));
  const active = relations.filter((r) => focus.has(r.parent) || focus.has(r.child));
  const related = new Set([...focus, ...active.flatMap((r) => [r.parent, r.child])]);
  const highlighted = new Map<string, Set<string>>();
  for (const r of active) {
    for (const [table, field] of [
      [r.parent, r.parentField],
      [r.child, r.childField],
    ]) {
      highlighted.set(table, (highlighted.get(table) ?? new Set()).add(field));
    }
  }

  const shownNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      highlighted: highlighted.get(node.id) ?? NONE,
      dimmed: focus.size > 0 && !related.has(node.id),
    },
  }));

  const positions = new Map(nodes.map((node) => [node.id, node.position]));
  const edges: RelationEdge[] = relations.map((relation) => {
    const [from, to] = sides(relation, positions);
    const state = focus.size === 0 ? 'idle' : active.includes(relation) ? 'active' : 'dimmed';
    return {
      id: relation.id,
      type: 'relation',
      source: relation.parent,
      sourceHandle: handleId(relation.parentField, from, 'source'),
      target: relation.child,
      targetHandle: handleId(relation.childField, to, 'target'),
      selectable: false,
      focusable: false,
      data: { relation, state },
    };
  });

  function focusTable(name: string) {
    setNodes((current) => current.map((node) => ({ ...node, selected: node.id === name })));
    const neighbours = relations.flatMap((r) =>
      r.parent === name ? [r.child] : r.child === name ? [r.parent] : [],
    );
    void fitView({
      nodes: [name, ...neighbours].map((id) => ({ id })),
      duration: 300,
      padding: 0.15,
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="bg-gray-0 relative min-h-80 min-w-0 flex-1">
        <ReactFlow
          nodes={shownNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          nodesConnectable={false}
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.08 }}
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} color="var(--color-gray-4)" />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            nodeColor="var(--color-gray-3)"
            nodeBorderRadius={4}
            style={{ width: 160, height: 104 }}
            className="border-gray-2 rounded-sm border max-lg:hidden"
          />
          {moved && (
            <Panel position="top-left">
              <Button variant="default" size="xs" onClick={resetLayout}>
                <IconLayoutGrid aria-hidden size={16} stroke={1.5} />
                Reset layout
              </Button>
            </Panel>
          )}
        </ReactFlow>
      </div>
      <aside className="border-gray-2 shrink-0 space-y-6 overflow-y-auto p-4 max-lg:border-t lg:w-72 lg:border-l">
        <div>
          <p className="text-gray-7 text-sm">
            Drag tables to arrange them. Click one to follow its relations.
          </p>
          <p className="text-gray-6 mt-1 text-xs">
            Drawn from each bounded context&apos;s{' '}
            <code className="text-gray-8">infra/db/schema.ts</code>
          </p>
        </div>
        <section>
          <h3 className="mb-1 text-sm font-medium">Tables</h3>
          <ul className="-mx-2">
            {tables.map((table) => (
              <li key={table.id}>
                <button
                  type="button"
                  onClick={() => focusTable(table.id)}
                  aria-pressed={focus.has(table.id)}
                  className="hover:bg-gray-1 aria-pressed:bg-blue-0 aria-pressed:text-blue flex w-full items-center justify-between rounded-sm px-2 py-1 text-left text-sm"
                >
                  {table.name}
                  <span className="text-gray-6 text-xs tabular-nums">{table.columns.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-medium">Legend</h3>
          <dl className="text-gray-7 space-y-2 text-xs">
            {(
              [
                ['PK', 'Primary key'],
                ['FK', 'Foreign key'],
                ['UK', 'Unique'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2">
                <dt className="w-8">
                  <KeyBadge kind={key} />
                </dt>
                <dd>{label}</dd>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <dt className="w-8">
                <svg aria-hidden width="28" height="2" className="text-gray-5">
                  <line x1="0" y1="1" x2="28" y2="1" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </dt>
              <dd>Required relation</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="w-8">
                <svg aria-hidden width="28" height="2" className="text-gray-5">
                  <line
                    x1="0"
                    y1="1"
                    x2="28"
                    y2="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                </svg>
              </dt>
              <dd>Optional relation</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="w-8 font-medium">1 · n</dt>
              <dd>One row for many rows</dd>
            </div>
          </dl>
        </section>
        <section>
          <h3 className="mb-2 text-sm font-medium">Enums</h3>
          <ul className="space-y-3">
            {enums.map((item) => (
              <li key={item.name}>
                <p className="text-sm">{item.name}</p>
                <p className="flex flex-wrap gap-1 pt-1">
                  {item.values.map((value) => (
                    <code
                      key={value}
                      className="bg-gray-1 text-gray-8 rounded-xs px-1.5 py-0.5 text-xs"
                    >
                      {value}
                    </code>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function toDiagram({ tables: source }: DataModelResponse) {
  const tables: Table[] = source.map((table) => {
    const foreignKeys = new Set(table.foreignKeys.flatMap((foreignKey) => foreignKey.columns));
    const columns = table.columns.map((column) => ({
      name: column.name,
      type: `${column.type}${column.list ? '[]' : ''}${column.nullable ? '?' : ''}`,
      keys: (['PK', 'FK', 'UK'] as const).filter(
        (key) =>
          (key === 'PK' && column.primaryKey) ||
          (key === 'FK' && foreignKeys.has(column.name)) ||
          (key === 'UK' && column.unique),
      ),
      values: column.enumValues,
    }));
    return { id: table.id, name: table.name, columns };
  });

  const relations: Relation[] = source.flatMap((table) =>
    table.foreignKeys.flatMap(({ columns, references }) =>
      columns.map((childField, index) => {
        const column = table.columns.find((candidate) => candidate.name === childField);
        return {
          id: `${table.id}.${childField}`,
          parent: references.table,
          parentField: references.columns[index],
          child: table.id,
          childField,
          optional: column?.nullable ?? false,
          // One row of the parent for one row of the child when the foreign key is unique.
          oneToOne: column?.unique ?? false,
        };
      }),
    ),
  );
  return { tables, relations };
}

/** Parents on the left of their children, laid out by dagre, unless the user moved them. */
function toNodes(
  tables: Table[],
  relations: Relation[],
  saved: Record<string, XYPosition> | undefined,
): TableNode[] {
  const graph = new dagre.graphlib.Graph();
  graph.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 120 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const table of tables) {
    graph.setNode(table.id, { width: NODE_WIDTH, height: tableHeight(table) });
  }
  for (const r of relations) if (r.parent !== r.child) graph.setEdge(r.parent, r.child);
  dagre.layout(graph);

  return tables.map((table) => {
    const { x, y } = graph.node(table.id);
    return {
      id: table.id,
      type: 'table',
      position: saved?.[table.id] ?? {
        x: x - NODE_WIDTH / 2,
        y: y - tableHeight(table) / 2,
      },
      data: { table, highlighted: NONE, dimmed: false },
    };
  });
}

function tableHeight(table: Table) {
  return HEADER_HEIGHT + table.columns.length * ROW_HEIGHT + 2;
}

type Side = 'left' | 'right';

/** Edges leave and enter on the facing sides, or loop on the right when the tables are stacked. */
function sides(relation: Relation, positions: Map<string, XYPosition>): [Side, Side] {
  const dx = (positions.get(relation.child)?.x ?? 0) - (positions.get(relation.parent)?.x ?? 0);
  if (relation.parent === relation.child || Math.abs(dx) < NODE_WIDTH / 2) {
    return ['right', 'right'];
  }
  return dx > 0 ? ['right', 'left'] : ['left', 'right'];
}

function handleId(field: string, side: Side, type: 'source' | 'target') {
  return `${field}-${side}-${type}`;
}

function TableNodeView({ data, selected }: NodeProps<TableNode>) {
  const { table, highlighted, dimmed } = data;
  return (
    <div
      className={`rounded-md border bg-white text-[13px] shadow-sm transition-opacity ${
        selected ? 'border-blue ring-blue-1 ring-2' : 'border-gray-3'
      } ${dimmed ? 'opacity-30' : ''}`}
      style={{ width: NODE_WIDTH }}
    >
      <div className="border-gray-2 bg-gray-1 flex h-10 items-center gap-1.5 rounded-t-md border-b px-3">
        <span className="font-medium">{table.name}</span>
        <code className="text-gray-6 ml-auto text-xs">{table.id}</code>
      </div>
      {table.columns.map((column) => (
        <div
          key={column.name}
          className={`relative flex h-7 items-center gap-1.5 px-3 ${
            highlighted.has(column.name) ? 'bg-blue-0' : ''
          }`}
        >
          <span className="flex w-11 shrink-0 gap-0.5">
            {column.keys.map((key) => (
              <KeyBadge key={key} kind={key} />
            ))}
          </span>
          <span className="truncate">{column.name}</span>
          <Tooltip content={column.values.length > 0 ? column.values.join(', ') : null}>
            <span
              className={`ml-auto shrink-0 pl-2 text-xs ${column.values.length > 0 ? 'text-cyan-7' : 'text-gray-6'}`}
            >
              {column.type}
            </span>
          </Tooltip>
          {(['left', 'right'] as const).flatMap((side) =>
            (['source', 'target'] as const).map((type) => (
              <Handle
                key={`${side}-${type}`}
                id={handleId(column.name, side, type)}
                type={type}
                position={side === 'left' ? Position.Left : Position.Right}
                isConnectable={false}
                style={{ opacity: 0, minWidth: 0, minHeight: 0, width: 1, height: 1, border: 0 }}
              />
            )),
          )}
        </div>
      ))}
    </div>
  );
}

function RelationEdgeView(props: EdgeProps<RelationEdge>) {
  const { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, data } = props;
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 10,
    offset: 28,
  });
  if (!data) return null;
  const { relation, state } = data;
  return (
    <>
      <BaseEdge
        path={path}
        style={{
          stroke: state === 'active' ? 'var(--color-blue)' : 'var(--color-gray-5)',
          strokeWidth: state === 'active' ? 2 : 1.5,
          strokeDasharray: relation.optional ? '5 4' : undefined,
          opacity: state === 'dimmed' ? 0.15 : 1,
        }}
      />
      <EdgeLabelRenderer>
        <Cardinality x={sourceX} y={sourceY} position={sourcePosition} state={state} label="1" />
        <Cardinality
          x={targetX}
          y={targetY}
          position={targetPosition}
          state={state}
          label={relation.oneToOne ? '1' : 'n'}
        />
      </EdgeLabelRenderer>
    </>
  );
}

/** How many rows sit at this end of a relation, written just outside the table. */
function Cardinality(props: {
  x: number;
  y: number;
  position: Position;
  state: RelationData['state'];
  label: string;
}) {
  const offset = props.position === Position.Right ? 9 : -9;
  return (
    <div
      className={`pointer-events-none absolute text-[11px] font-medium ${
        props.state === 'active' ? 'text-blue' : 'text-gray-6'
      } ${props.state === 'dimmed' ? 'opacity-15' : ''}`}
      style={{
        transform: `translate(-50%, -100%) translate(${props.x + offset}px, ${props.y - 1}px)`,
      }}
    >
      {props.label}
    </div>
  );
}

const keyClasses: Record<Key, string> = {
  PK: 'bg-orange-0 text-orange-7',
  FK: 'bg-blue-0 text-blue-6',
  UK: 'bg-gray-1 text-gray-7',
};

function KeyBadge({ kind }: { kind: Key }) {
  return (
    <span className={`rounded-xs px-1 text-[10px] leading-4 font-medium ${keyClasses[kind]}`}>
      {kind}
    </span>
  );
}
