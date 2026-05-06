import { apiRequest } from '@/services/api-client';
import { mockDb, wait } from '@/services/mock-db';
import type { ProductionRun, StartRunInput } from '@/types/app';

function createFallbackRun(input: StartRunInput): ProductionRun {
  const now = new Date();
  const dateStamp = input.mfgDate || now.toISOString().slice(0, 10);
  const timeStamp = now.toTimeString().slice(0, 5).replace(':', '');

  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `run-${Date.now()}`,
    productioncode: `${input.brand}-${dateStamp}-${timeStamp}`.replace(/\s+/g, '-').toUpperCase(),
    brand: input.brand,
    flavour: input.flavour,
    packageType: input.packageType,
    line: input.line,
    shift: input.shift,
    createdAt: now.toISOString(),
    mfgDate: input.mfgDate,
    bbdate: input.bbdate,
    linenumber: input.linenumber,
    shiftKey: input.shiftKey,
    productionsupervisor: input.productionsupervisor,
    qashiftsupervisor: input.qashiftsupervisor,
    qatechnician: input.qatechnician,
    shrinkwrapoperator: input.shrinkwrapoperator,
    filleroperator: input.filleroperator,
    labeloperator: input.labeloperator,
    epicorproduction: input.epicorproduction,
    epicorsyrup: input.epicorsyrup,
    description: input.description,
    planner: input.planner,
    uniqueinspectorid: input.uniqueinspectorid,
    mes: input.mes,
    jobtransfer: input.jobtransfer,
    local: input.local,
    export: input.export,
    labelsamplephoto: input.labelsamplephoto,
    codeverificationphoto: input.codeverificationphoto,
  };
}

export async function createProductionRun(input: StartRunInput) {
  try {
    return await apiRequest<ProductionRun>('/production-runs', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  } catch {
    await wait(250);
    const fallbackRun = createFallbackRun(input);
    const existingRuns = mockDb.runs.read<ProductionRun>();
    mockDb.runs.write([fallbackRun, ...existingRuns.filter((run) => run.id !== fallbackRun.id)]);
    return fallbackRun;
  }
}

export async function listRecentRuns() {
  try {
    return await apiRequest<ProductionRun[]>('/production-runs');
  } catch {
    await wait(150);
    return mockDb.runs.read<ProductionRun>();
  }
}
