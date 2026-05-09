const SUPABASE_FLAG_VALUE =
  process.env.EXPO_PUBLIC_USE_SUPABASE ||
  process.env.USE_SUPABASE ||
  'false';

const SUPABASE_URL_VALUE =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const SUPABASE_ANON_KEY_VALUE =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

export const DEMO_USER_KEY = 'demo-user-fiankimubox';

export const supabaseConfig = {
  enabled: /^(1|true|yes|on)$/i.test(String(SUPABASE_FLAG_VALUE || '').trim()),
  url: String(SUPABASE_URL_VALUE || '').trim().replace(/\/+$/, ''),
  anonKey: String(SUPABASE_ANON_KEY_VALUE || '').trim(),
};

export function isSupabasePersistenceReady() {
  return (
    supabaseConfig.enabled &&
    supabaseConfig.url.length > 0 &&
    supabaseConfig.anonKey.length > 0
  );
}

function buildSupabaseHeaders(prefer) {
  return {
    apikey: supabaseConfig.anonKey,
    Authorization: `Bearer ${supabaseConfig.anonKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function supabaseRestRequest({
  table,
  method = 'GET',
  query = '',
  body,
  prefer,
}) {
  if (!isSupabasePersistenceReady()) {
    return {
      ok: false,
      disabled: true,
      status: 0,
      data: null,
    };
  }

  const normalizedQuery = query.startsWith('?') || query.length === 0 ? query : `?${query}`;

  try {
    const response = await fetch(
      `${supabaseConfig.url}/rest/v1/${table}${normalizedQuery}`,
      {
        method,
        headers: buildSupabaseHeaders(prefer),
        body: body == null ? undefined : JSON.stringify(body),
      }
    );

    const rawText = await response.text();
    let parsedData = null;

    if (rawText) {
      try {
        parsedData = JSON.parse(rawText);
      } catch {
        parsedData = rawText;
      }
    }

    return {
      ok: response.ok,
      disabled: false,
      status: response.status,
      data: parsedData,
    };
  } catch {
    return {
      ok: false,
      disabled: false,
      status: 0,
      data: null,
    };
  }
}
