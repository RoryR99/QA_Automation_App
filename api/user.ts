import type { MockUser } from '../src/types/app';
import { getSupabaseServerClient } from './_lib/supabase.js';
import { mapUser } from './_lib/mappers.js';
import { sendError, sendMethodNotAllowed } from './_lib/responses.js';

const fallbackUser: MockUser = {
  id: 'usr-001',
  displayName: 'SMJ QA Officer',
  userPrincipalName: 'SMJ QA Officer@plant-demo.local',
  role: 'Quality Technician',
  site: 'Bottling Line A',
};

function readBearerToken(req: { headers?: Record<string, string | string[] | undefined> }) {
  const header = req.headers?.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  return value?.startsWith('Bearer ') ? value.slice('Bearer '.length) : null;
}

export default async function handler(req: { method?: string; headers?: Record<string, string | string[] | undefined> }, res: any) {
  if (req.method !== 'GET') {
    return sendMethodNotAllowed(req, res, ['GET']);
  }

  try {
    const supabase = getSupabaseServerClient();
    const token = readBearerToken(req);

    if (token) {
      const { data: authData, error: authError } = await supabase.auth.getUser(token);

      if (authError) {
        throw authError;
      }

      const authUser = authData.user;
      const email = authUser.email ?? '';
      const displayName =
        String(authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? '').trim() || email || fallbackUser.displayName;

      return res.status(200).json({
        id: authUser.id,
        displayName,
        userPrincipalName: email || fallbackUser.userPrincipalName,
        role: String(authUser.user_metadata?.role ?? fallbackUser.role),
        site: String(authUser.user_metadata?.site ?? fallbackUser.site),
      });
    }

    const { data, error } = await supabase.from('users').select('*').limit(1).maybeSingle();

    if (error) {
      throw error;
    }

    return res.status(200).json(data ? mapUser(data) : fallbackUser);
  } catch (error) {
    return sendError(res, error);
  }
}
