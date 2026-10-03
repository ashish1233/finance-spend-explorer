import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  Text,
} from '@insights-platform/ui-kit';
import type { DataTableColumn, InsightRow } from '@insights-platform/ui-kit';
import { DATASET_LABEL } from './config';
import { reportReactInstance } from './platform/reactIdentity';

/*
 * Module scope, not a `useEffect`: this has to run as the federated chunk is
 * evaluated, before any hook in it is called, so that a second React copy is
 * visible in the shell's diagnostics even if the first render throws.
 */
reportReactInstance('finance-spend-explorer');

/**
 * The props the shell passes to a mounted remote.
 *
 * This is the whole host↔remote contract and it is deliberately tiny. The shell
 * owns the session; the remote receives it. Anything wider — callbacks into
 * shell routing, shared stores — turns the independent-deploy property ADR-1
 * bought into a distributed monolith.
 */
export interface SpendExplorerProps {
  /** The shell's session token. `null` when running standalone, signed out. */
  token: string | null;
  tenantId: string;
  /** Who the shell is signed in as — shown to make the shared session visible. */
  subject: string;
}

const columns: DataTableColumn<InsightRow>[] = [
  { key: 'metric', header: 'Cost centre' },
  { key: 'period', header: 'Period', width: '140px' },
  { key: 'value', header: 'Spend (USD)', align: 'right', width: '160px' },
];

/*
 * Fixed rows. This repository exists to be the thinnest possible standard-tier
 * remote, so it has no backend; a real one would call `useInsights` against its
 * own `/api/insights`, exactly as `templates/web/frontend` does.
 */
const ROWS: InsightRow[] = [
  { id: 'cc-1000', metric: 'Cloud infrastructure', period: '2026-Q3', value: '1,284,900' },
  { id: 'cc-1400', metric: 'Contractor services', period: '2026-Q3', value: '612,350' },
  { id: 'cc-2100', metric: 'Software licences', period: '2026-Q3', value: '488,720' },
  { id: 'cc-3300', metric: 'Travel', period: '2026-Q3', value: '97,140' },
  { id: 'cc-5000', metric: 'Facilities', period: '2026-Q3', value: '355,008' },
];

/**
 * The app's one page, and the only module exposed over federation.
 *
 * It renders page content and nothing else — no header, no sign-in, no routing.
 * Standalone mode wraps it in an `AppShell`; the shell supplies its own. A
 * remote that draws its own chrome produces two headers the moment it is
 * mounted.
 */
export default function SpendExplorer({
  token,
  tenantId,
  subject,
}: SpendExplorerProps) {
  const [period, setPeriod] = useState('2026-Q3');

  const rows = useMemo(
    () => ROWS.filter((row) => row.period === period),
    [period],
  );

  if (!token) {
    return (
      <Card title="Spend" padding="md">
        <EmptyState
          title="Not signed in"
          description={`Sign in to load ${DATASET_LABEL} for ${tenantId}.`}
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Spend by cost centre"
        description={`All ${DATASET_LABEL} available to your tenant.`}
        padding="none"
        actions={
          <>
            <Badge tone="neutral">{period}</Badge>{' '}
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                setPeriod((current) =>
                  current === '2026-Q3' ? '2026-Q2' : '2026-Q3',
                )
              }
            >
              Switch period
            </Button>
          </>
        }
      >
        <DataTable
          caption={`${DATASET_LABEL} for ${tenantId}`}
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          empty={
            <EmptyState
              title="Nothing to show yet"
              description={`No ${DATASET_LABEL} were returned for ${period}.`}
            />
          }
        />
      </Card>

      <Text size="sm" tone="muted" style={{ marginTop: 'var(--ins-space-lg)' }}>
        Session supplied by the host: <strong>{subject}</strong> on{' '}
        <strong>{tenantId}</strong>. Standalone, the same component gets the
        session from this app&rsquo;s own sign-in.
      </Text>
    </>
  );
}
