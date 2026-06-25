export type InspectionValue = 'acceptable' | 'non-acceptable' | 'not-applicable';

export interface MockUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  role: string;
  site: string;
}

export type ProductionRunShiftKey = 'Shiftkey0' | 'Shiftkey1' | 'Shiftkey2';
export type ProductionRunStatus = 'active' | 'closed';

export interface ProductionRunBatch {
  id: string;
  productionRunId: string;
  batchNumber: string;
  createdAt: string;
}

export interface ProductionRun {
  id: string;
  productioncode: string;
  brand: string;
  flavour: string;
  packageType: string;
  line: string;
  shift: string;
  createdAt: string;
  status?: ProductionRunStatus;
  closedAt?: string;
  batchNumbers?: ProductionRunBatch[];
  mfgDate?: string;
  bbdate?: string;
  linenumber?: string;
  shiftKey?: ProductionRunShiftKey;
  productionsupervisor?: string;
  qashiftsupervisor?: string;
  qatechnician?: string;
  shrinkwrapoperator?: string;
  filleroperator?: string;
  labeloperator?: string;
  epicorproduction?: string;
  epicorsyrup?: string;
  description?: string;
  planner?: string;
  uniqueinspectorid?: string;
  mes?: boolean;
  jobtransfer?: boolean;
  local?: boolean;
  export?: boolean;
  labelsamplephoto?: string;
  codeverificationphoto?: string;
  cipcompletion?: boolean;
  cipmethod?: string[];
  copcompletion?: boolean;
  copchemical?: string[];
}

export interface StartRunInput {
  brand: string;
  flavour: string;
  packageType: string;
  line: string;
  shift: string;
  mfgDate: string;
  linenumber: string;
  shiftKey: ProductionRunShiftKey;
  productionsupervisor: string;
  qashiftsupervisor?: string;
  qatechnician: string;
  shrinkwrapoperator?: string;
  filleroperator?: string;
  labeloperator?: string;
  package1?: string;
  epicorproduction?: string;
  epicorsyrup?: string;
  description?: string;
  planner?: string;
  uniqueinspectorid?: string;
  bbdate?: string;
  mes?: boolean;
  jobtransfer?: boolean;
  local?: boolean;
  export?: boolean;
  labelsamplephoto?: string;
  codeverificationphoto?: string;
  cipcompletion?: boolean;
  cipmethod?: string[];
  copcompletion?: boolean;
  copchemical?: string[];
}

export interface BeverageQualityMeasurement {
  id: string;
  brand: string;
  flavor: string;
  packsize: string;
  frequency: string;
  fillheightll?: number;
  fillheightul?: number;
  brixll?: number;
  brixul?: number;
  co2ll?: number;
  co2ul?: number;
  phll?: number;
  phul?: number;
  tall?: number;
  taul?: number;
  vitamincll?: number;
  vitamincul?: number;
}

export type InspectionKind = 'primary-packaging' | 'secondary-packaging' | 'product-specs';

export interface InspectionReference {
  id: string;
  productioncode: string;
}

export interface CreateInspectionInput {
  hourlyinspectionname: string;
  timestamp: string;
  inspector: string;
  inspectionType: InspectionKind;
  productionrunid: InspectionReference;
  [key: string]: unknown;
}

export interface InspectionRecord {
  id: string;
  createdAt: string;
  inspectionType: InspectionKind;
  payload: CreateInspectionInput;
  typedDetails?: unknown;
}
