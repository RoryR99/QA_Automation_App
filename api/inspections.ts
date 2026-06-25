import type { CreateInspectionInput } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase.js';
import { mapInspection } from './_lib/mappers.js';
import { readJsonBody, sendError, sendMethodNotAllowed } from './_lib/responses.js';

type SupabaseClient = ReturnType<typeof getSupabaseServerClient>;

function statusFromKey(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  if (value.endsWith('0')) {
    return 'acceptable';
  }

  if (value.endsWith('1')) {
    return 'non-acceptable';
  }

  return undefined;
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function optionalNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined;
}

function requiredStatus(input: CreateInspectionInput, key: string) {
  const status = statusFromKey(input[key]);

  if (!status) {
    throw new Error(`Missing required inspection status: ${key}`);
  }

  return status;
}

async function findBeverageQualityMeasurementId(supabase: SupabaseClient, input: CreateInspectionInput) {
  const brand = optionalString(input.brand);
  const flavor = optionalString(input.flavor);
  const packageSize = optionalNumber(input.packsize);

  if (!brand || !flavor || packageSize === undefined) {
    return undefined;
  }

  const { data, error } = await supabase
    .from('beverage_quality_measurements')
    .select('beveragequalitymeasurementid')
    .eq('brand', brand)
    .eq('flavor', flavor)
    .eq('packagesizeml', packageSize)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.beveragequalitymeasurementid;
}

async function insertPrimaryPackagingInspection(
  supabase: SupabaseClient,
  inspectionId: string,
  input: CreateInspectionInput,
) {
  const { error } = await supabase.from('primary_packaging_inspections').insert({
    inspection_id: inspectionId,
    product_temp_f: optionalNumber(input.producttempf),
    condensation_after_warmer: statusFromKey(input.condensationKey),
    cap_status: requiredStatus(input, 'capKey'),
    cap_image_url: optionalString(input.capimageurl),
    filtec_status: requiredStatus(input, 'filtecKey'),
    filtec_image_url: optionalString(input.filtecimageurl),
    dry_after_warmer_status: requiredStatus(input, 'dryafterwarmerKey'),
    dry_after_warmer_image_url: optionalString(input.dryafterwarmerimageurl),
    label_alignment_status: requiredStatus(input, 'labelalignmentKey'),
    label_alignment_image_url: optionalString(input.labelalignmentimageurl),
    secure_seal_test_status: requiredStatus(input, 'securesealtestKey'),
    secure_seal_test_image_url: optionalString(input.securesealtestimageurl),
    date_code_status: requiredStatus(input, 'datecodeKey'),
    date_code_image_url: optionalString(input.datecodeimageurl),
  });

  if (error) {
    throw error;
  }
}

async function insertSecondaryPackagingInspection(
  supabase: SupabaseClient,
  inspectionId: string,
  input: CreateInspectionInput,
) {
  const { error } = await supabase.from('secondary_packaging_inspections').insert({
    inspection_id: inspectionId,
    stretch_wrap_quality_status: requiredStatus(input, 'stretchwrapqualityKey'),
    stretch_ratio: optionalNumber(input.stretchratio),
    layer_pad_status: requiredStatus(input, 'layerpadKey'),
    layer_pads_per_pallet_status: requiredStatus(input, 'amtKey'),
    pallet_tags_status: requiredStatus(input, 'pallettagsKey'),
    pallet_tag_info: optionalString(input.pallettaginfo),
    pallet_tag_photo_url: optionalString(input.pallettagphotourl),
    stickers_status: requiredStatus(input, 'stickersKey'),
    sticker_info: optionalString(input.stickerinfo),
    sticker_photo_url: optionalString(input.stickerphotourl),
    containment_force_top_kg: optionalNumber(input.containmentforcetopkg),
    containment_force_middle_kg: optionalNumber(input.containmentforcemiddlekg),
    containment_force_bottom_kg: optionalNumber(input.containmentforcebottomkg),
    non_conformance_status: optionalString(input.nonconformancestatus),
    non_conformance_photo_url: optionalString(input.nonconformancephotourl),
    observations: optionalString(input.observations),
  });

  if (error) {
    throw error;
  }
}

async function insertProductSpecInspection(
  supabase: SupabaseClient,
  inspectionId: string,
  input: CreateInspectionInput,
) {
  const beverageQualityMeasurementId = await findBeverageQualityMeasurementId(supabase, input);
  const brand = optionalString(input.brand);
  const flavor = optionalString(input.flavor);

  if (!brand || !flavor) {
    throw new Error('Missing required product spec brand or flavor.');
  }

  const { error } = await supabase.from('product_spec_inspections').insert({
    inspection_id: inspectionId,
    beverage_quality_measurement_id: beverageQualityMeasurementId,
    brand,
    flavor,
    package_size_ml: optionalNumber(input.packsize),
    fillheight: optionalNumber(input.fillheight),
    brix: optionalNumber(input.brix),
    co2_pressure: optionalNumber(input.co2pressure),
    co2_temperature: optionalNumber(input.co2temperature),
    co2_volume: optionalNumber(input.co2),
    ph: optionalNumber(input.ph),
    titratable_acidity: optionalNumber(input.ta),
    vitamin_c: optionalNumber(input.vitaminc),
    closure_supplier: optionalString(input.closuresupplier),
    net_completed: optionalBoolean(input.netcompletion) ?? false,
    cp_and_cpk_completed: optionalBoolean(input.cpandcpkcompletion) ?? false,
  });

  if (error) {
    throw error;
  }

  if (!Array.isArray(input.closureMeasurements) || input.closureMeasurements.length === 0) {
    return;
  }

  const closureRows = input.closureMeasurements.map((measurement) => {
    const item = measurement as Record<string, unknown>;

    return {
      id: crypto.randomUUID(),
      inspection_id: inspectionId,
      measurement_number: optionalNumber(item.measurementnumber),
      application_angle: optionalNumber(item.applicationangle),
      removal_torque: optionalNumber(item.removaltorque),
    };
  });

  const { error: closureError } = await supabase.from('product_spec_closure_measurements').insert(closureRows);

  if (closureError) {
    throw closureError;
  }
}

async function insertInspectionDetails(supabase: SupabaseClient, inspectionId: string, input: CreateInspectionInput) {
  switch (input.inspectionType) {
    case 'primary-packaging':
      await insertPrimaryPackagingInspection(supabase, inspectionId, input);
      break;
    case 'secondary-packaging':
      await insertSecondaryPackagingInspection(supabase, inspectionId, input);
      break;
    case 'product-specs':
      await insertProductSpecInspection(supabase, inspectionId, input);
      break;
    default:
      throw new Error(`Unsupported inspection type: ${String(input.inspectionType)}`);
  }
}

export default async function handler(req: { method?: string; body?: unknown }, res: any) {
  const supabase = getSupabaseServerClient();

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('hourly_inspections')
        .select(`
          *,
          primary_packaging_inspections (*),
          secondary_packaging_inspections (*),
          product_spec_inspections (
            *,
            product_spec_closure_measurements (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json((data ?? []).map(mapInspection));
    }

    if (req.method === 'POST') {
      const input = await readJsonBody<CreateInspectionInput>(req);

      if (!input.hourlyinspectionname || !input.timestamp || !input.inspector || !input.productionrunid) {
        return res.status(400).json({ message: 'Missing required inspection fields.' });
      }

      const { data: run, error: runError } = await supabase
        .from('production_runs')
        .select('id, status')
        .eq('id', input.productionrunid.id)
        .single();

      if (runError) {
        throw runError;
      }

      if (run.status === 'closed') {
        return res.status(400).json({ message: 'This production run is closed. No new checks can be added.' });
      }

      const inspectionId = crypto.randomUUID();
      const row = {
        id: inspectionId,
        production_run_id: input.productionrunid.id,
        inspection_type: input.inspectionType,
        created_at: new Date().toISOString(),
        payload_json: input,
      };

      const { data, error } = await supabase.from('hourly_inspections').insert(row).select().single();

      if (error) {
        throw error;
      }

      try {
        await insertInspectionDetails(supabase, inspectionId, input);
      } catch (detailError) {
        await supabase.from('hourly_inspections').delete().eq('id', inspectionId);
        throw detailError;
      }

      return res.status(201).json(mapInspection(data));
    }

    return sendMethodNotAllowed(req, res, ['GET', 'POST']);
  } catch (error) {
    return sendError(res, error);
  }
}
