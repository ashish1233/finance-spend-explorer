import { AppShell, LoginPanel, useAuth } from '@insights-platform/ui-kit';
import {
  APP_DESCRIPTION,
  APP_NAME,
  IDENTITY_BASE_URL,
  SCOPES,
  TENANT_ID,
} from './config';
import SpendExplorer from './SpendExplorer';

/**
 * Standalone mode only. The shell never loads this file — it imports
 * `SpendExplorer` directly and supplies its own chrome and session.
 *
 * Keeping standalone working is a requirement, not a convenience: ADR-2 accepts
 * that the shell sits on the critical path of every tenant's UX, on the
 * condition that every app stays reachable at its own URL when the shell is
 * down.
 */
export function App() {
  const auth = useAuth({ identityUrl: IDENTITY_BASE_URL, scopes: SCOPES });

  if (!auth.isAuthenticated) {
    return (
      <LoginPanel
        appName={APP_NAME}
        description={APP_DESCRIPTION}
        onSubmit={auth.login}
        busy={auth.status === 'signing-in'}
        defaultTenantId={TENANT_ID}
        errorTitle={auth.expired ? 'Session expired' : 'Could not sign in'}
        error={
          auth.expired
            ? 'Your session timed out. Sign in again to continue.'
            : auth.error
        }
      />
    );
  }

  return (
    <AppShell
      appName={APP_NAME}
      tenantId={auth.session?.tenantId ?? TENANT_ID}
      tier="standard"
      subject={auth.session?.subject}
      onSignOut={() => auth.logout()}
    >
      <SpendExplorer
        token={auth.token}
        tenantId={auth.session?.tenantId ?? TENANT_ID}
        subject={auth.session?.subject ?? ''}
      />
    </AppShell>
  );
}
