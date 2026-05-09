import { useEffect, useState } from 'react';

const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';

// Module-level cache: normalized query → photoUrl (string) | null
const cache = new Map();
// Deduplicates concurrent requests for the same query
const inflight = new Map();

function normalizeQuery(query) {
  return String(query || '').toLowerCase().trim();
}

async function fetchPhoto(query) {
  const key = normalizeQuery(query);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key);
  if (inflight.has(key)) return inflight.get(key);

  const apiKey = process.env.EXPO_PUBLIC_PEXELS_API_KEY;
  if (!apiKey) {
    cache.set(key, null);
    return null;
  }

  const promise = (async () => {
    try {
      const searchQuery = encodeURIComponent(`${key} haircut hairstyle`);
      const url = `${PEXELS_SEARCH_URL}?query=${searchQuery}&per_page=5&orientation=portrait`;
      const res = await fetch(url, { headers: { Authorization: apiKey } });
      if (!res.ok) {
        cache.set(key, null);
        return null;
      }
      const json = await res.json();
      const photo = Array.isArray(json?.photos) ? json.photos[0] : null;
      const photoUrl = photo?.src?.portrait || photo?.src?.medium || null;
      cache.set(key, photoUrl);
      return photoUrl;
    } catch {
      cache.set(key, null);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export function usePexelsPhoto(query) {
  const key = normalizeQuery(query);

  const [photoUrl, setPhotoUrl] = useState(() =>
    cache.has(key) ? cache.get(key) : null
  );

  useEffect(() => {
    if (!key) {
      setPhotoUrl(null);
      return;
    }
    if (cache.has(key)) {
      setPhotoUrl(cache.get(key));
      return;
    }
    let cancelled = false;
    fetchPhoto(key).then((url) => {
      if (!cancelled) setPhotoUrl(url ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return photoUrl;
}
