import { atom } from 'jotai';

import type { ProductionRun } from '@/types/app';

export const currentProductionRunAtom = atom<ProductionRun | null>(null);
export const lastSubmittedInspectionAtom = atom<string | null>(null);
