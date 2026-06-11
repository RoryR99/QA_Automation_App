import type {
  CreateInspectionInput,
  InspectionKind,
  InspectionRecord,
  MockUser,
  ProductionRunBatch,
  ProductionRun,
  ProductionRunStatus,
} from '../../src/types/app';

type PayloadRow = {
  id: string;
  created_at: string;
  payload_json: unknown;
};

type InspectionRow = PayloadRow & {
  inspection_type: InspectionKind;
  primary_packaging_inspections?: unknown[] | null;
  secondary_packaging_inspections?: unknown[] | null;
  product_spec_inspections?: unknown[] | null;
};

export function mapUser(row: Record<string, unknown>): MockUser {
  return {
    id: String(row.id ?? ''),
    displayName: String(row.display_name ?? ''),
    userPrincipalName: String(row.user_principal_name ?? ''),
    role: String(row.role ?? ''),
    site: String(row.site ?? ''),
  };
}

export function mapProductionRun(row: Record<string, unknown>): ProductionRun {
  const payload = parsePayload<Partial<ProductionRun>>(row.payload_json ?? {});
  const batchRows = Array.isArray(row.production_run_batches) ? row.production_run_batches : [];

  return {
    ...payload,
    id: String(row.id ?? ''),
    productioncode: String(row.productioncode ?? ''),
    brand: String(row.brand ?? ''),
    flavour: String(row.flavour ?? ''),
    packageType: String(row.package_type ?? ''),
    line: String(row.line ?? ''),
    shift: String(row.shift ?? ''),
    createdAt: String(row.created_at ?? ''),
    status: (row.status === 'closed' ? 'closed' : 'active') satisfies ProductionRunStatus,
    closedAt: typeof row.closed_at === 'string' ? row.closed_at : undefined,
    batchNumbers: batchRows.map((batch) => mapProductionRunBatch(batch as Record<string, unknown>)),
  };
}

export function mapProductionRunBatch(row: Record<string, unknown>): ProductionRunBatch {
  return {
    id: String(row.id ?? ''),
    productionRunId: String(row.production_run_id ?? ''),
    batchNumber: String(row.batch_number ?? ''),
    createdAt: String(row.created_at ?? ''),
  };
}

function parsePayload<T>(value: unknown): T {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
}

export function mapInspection(row: InspectionRow): InspectionRecord {
  const typedDetails =
    row.primary_packaging_inspections?.[0] ??
    row.secondary_packaging_inspections?.[0] ??
    row.product_spec_inspections?.[0];

  const record: InspectionRecord = {
    id: row.id,
    inspectionType: row.inspection_type,
    createdAt: row.created_at,
    payload: parsePayload<CreateInspectionInput>(row.payload_json),
  };

  if (typedDetails) {
    record.typedDetails = typedDetails;
  }

  return record;
}
