import type {
  ClosureMeasurementInput,
  ClosureMeasurementRecord,
  CreateInspectionExtensionInput,
  CreateInspectionInput,
  InspectionExtensionRecord,
  InspectionKind,
  InspectionRecord,
  MockUser,
  ProductionRun,
} from '../../src/types/app';

type PayloadRow = {
  id: string;
  created_at: string;
  payload_json: unknown;
};

type InspectionRow = PayloadRow & {
  inspection_type: InspectionKind;
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
  };
}

function parsePayload<T>(value: unknown): T {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
}

export function mapInspection(row: InspectionRow): InspectionRecord {
  return {
    id: row.id,
    inspectionType: row.inspection_type,
    createdAt: row.created_at,
    payload: parsePayload<CreateInspectionInput>(row.payload_json),
  };
}

export function mapInspectionExtension(row: PayloadRow): InspectionExtensionRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    payload: parsePayload<CreateInspectionExtensionInput>(row.payload_json),
  };
}

export function mapClosureMeasurement(row: PayloadRow): ClosureMeasurementRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    payload: parsePayload<ClosureMeasurementInput>(row.payload_json),
  };
}
