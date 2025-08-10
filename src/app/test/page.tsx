'use client';

import { useState, useEffect } from 'react';
import { fetchMarketShare, fetchLatestMonth } from '@/lib/api';
import fipsMapping from '@/data/fipsMapping.json';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface ContractSeries {
  month: string;
  enrolled: number;
  total_enrolled: number;
  market_share: number | null;
}

interface Contract {
  contract_id: string;
  org_name: string;
  series: ContractSeries[];
}

interface FipsEntry {
  fips: string;
  state: string;
  state_name: string;
  county_name: string;
}

export default function DashboardTestPage() {
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCounties, setSelectedCounties] = useState<string[]>([]);
  const [data, setData] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestMonthLoading, setLatestMonthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestMonth, setLatestMonth] = useState<{ start: string; end: string } | null>(null);

  // Unique list of states (full names)
  const states = Array.from(
    new Map(fipsMapping.map((d: FipsEntry) => [d.state, d.state_name])).entries()
  ).map(([abbr, name]) => ({ abbr, name }));

  // Filtered counties for the selected state
  const countiesForState = selectedState
    ? fipsMapping.filter((d: FipsEntry) => d.state === selectedState)
    : [];

  // Fetch latest month from API on mount
  useEffect(() => {
    fetchLatestMonth()
      .then((res) => {
        setLatestMonth({ start: res.startMonth, end: res.endMonth });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLatestMonthLoading(false));
  }, []);

  // Fetch market share whenever counties or months change
  useEffect(() => {
    if (!selectedCounties.length || !latestMonth) return;

    if (latestMonth.start > latestMonth.end) {
      setError('Start month cannot be after end month');
      return;
    }

    setLoading(true);
    setData([]);
    setError(null);

    fetchMarketShare(selectedCounties, latestMonth.start, latestMonth.end)
      .then((res) => {
        const filtered = res.contracts.filter((contract: Contract) => {
          const latest = contract.series[contract.series.length - 1];
          return latest.market_share !== null && latest.market_share >= 0.02;
        });
        setData(filtered);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedCounties, latestMonth]);

  const allCountiesSelected =
    countiesForState.length > 0 && selectedCounties.length === countiesForState.length;

  return (
    <main className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-gray-800">
            Medicare Advantage Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestMonthLoading && <p>Loading available months...</p>}

          {latestMonth && (
            <div className="mb-6 flex gap-6">
              <div>
                <label className="block mb-1 font-medium text-gray-700">Start Month</label>
                <input
                  type="month"
                  value={latestMonth.start}
                  onChange={(e) =>
                    setLatestMonth((prev) => (prev ? { ...prev, start: e.target.value } : null))
                  }
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium text-gray-700">End Month</label>
                <input
                  type="month"
                  value={latestMonth.end}
                  onChange={(e) =>
                    setLatestMonth((prev) => (prev ? { ...prev, end: e.target.value } : null))
                  }
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* State selector */}
          <label className="block mb-2 font-medium text-gray-700">Select State</label>
          <Select
            onValueChange={(value) => {
              setSelectedState(value);
              setSelectedCounties([]);
            }}
          >
            <SelectTrigger className="w-full border-gray-300">
              <SelectValue placeholder="-- Choose a state --" />
            </SelectTrigger>
            <SelectContent>
              {states.map(({ abbr, name }) => (
                <SelectItem key={abbr} value={abbr}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* County selection with checkboxes */}
          {selectedState && (
            <>
              <label className="block mt-6 mb-2 font-medium text-gray-700">Select Counties</label>

              {/* Select All option */}
              <div className="mb-2 flex items-center space-x-2">
                <Checkbox
                  checked={allCountiesSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCounties(countiesForState.map((c) => c.fips));
                    } else {
                      setSelectedCounties([]);
                    }
                  }}
                />
                <span className="text-gray-700">
                  Select all counties in{' '}
                  {states.find((s) => s.abbr === selectedState)?.name || selectedState}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded p-3 bg-white shadow-inner">
                {countiesForState.map((c) => (
                  <label key={c.fips} className="flex items-center space-x-2 mb-1">
                    <Checkbox
                      checked={selectedCounties.includes(c.fips)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCounties((prev) => [...prev, c.fips]);
                        } else {
                          setSelectedCounties((prev) => prev.filter((f) => f !== c.fips));
                        }
                      }}
                    />
                    <span className="text-gray-700">
                      {c.county_name}, {c.state_name} ({c.fips})
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Data table */}
      {loading && <p className="text-blue-600 font-medium">Loading data...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && data.length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-800">Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-200 px-4 py-2 text-left">Contract ID</th>
                    <th className="border border-gray-200 px-4 py-2 text-left">Organization</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Latest Enrollment</th>
                    <th className="border border-gray-200 px-4 py-2 text-right">Market Share (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((contract) => {
                    const latest = contract.series[contract.series.length - 1];
                    return (
                      <tr key={contract.contract_id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-2">{contract.contract_id}</td>
                        <td className="border border-gray-200 px-4 py-2">{contract.org_name}</td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {latest.enrolled.toLocaleString()}
                        </td>
                        <td className="border border-gray-200 px-4 py-2 text-right">
                          {(latest.market_share! * 100).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
