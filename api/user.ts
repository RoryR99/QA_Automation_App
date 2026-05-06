import type { MockUser } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase';
import { mapUser } from './_lib/mappers';
import { sendError, sendMethodNotAllowed } from './_lib/responses';

const fallbackUser: MockUser = {
  id: 'usr-001',
  displayName: 'Jamie Alvarez',
  userPrincipalName: 'jamie.alvarez@plant-demo.local',
  role: 'Quality Technician',
  site: 'Bottling Line A',
};

export default async function handler(req: { method?: string }, res: any) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(req, res, ['GET']);
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from('users').select('*').limit(1).maybeSingle();

    if (error) {
      throw error;
    }

    return res.status(200).json(data ? mapUser(data) : fallbackUser);
  } catch (error) {
    return sendError(res, error);
  }
}
