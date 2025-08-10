// lib/api.ts
export async function fetchMarketShare(
  counties: string[],
  start: string,
  end: string
) {
  const params = new URLSearchParams();
  counties.forEach(c => params.append('counties', c)); // <-- key change
  params.set('start_month', start);
  params.set('end_month', end);

  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/market-share?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}

export async function fetchLatestMonth() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/latest-month`);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}
