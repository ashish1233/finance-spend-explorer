/** Everything app-specific, in one file — the same shape as the scaffold. */

export const APP_NAME = 'Spend Explorer';

export const APP_DESCRIPTION =
  'Finance spend reporting by cost centre and period.';

export const TENANT_ID = 'finance';

/** Standard tier needs nothing beyond ordinary read access. */
export const SCOPES = ['insights:read'];

export const DATASET_LABEL = 'spend rows';

export const IDENTITY_BASE_URL =
  import.meta.env.VITE_IDENTITY_BASE_URL ?? 'http://localhost:8081';
