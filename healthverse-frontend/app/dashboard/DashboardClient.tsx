'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type SummaryMetric = {
    total?: number;
    average?: number;
    min?: number;
    max?: number;
    daysWithData?: number;
};

type FitSummary = {
    period?: string;
    summary?: {
        steps?: SummaryMetric | null;
        calories?: SummaryMetric | null;
        distance?: SummaryMetric | null;
        activeMinutes?: SummaryMetric | null;
        heartRate?: {
            average?: number;
            min?: number;
            max?: number;
            readings?: number;
        } | null;
    };
    message?: string;
};

type AuthStatus = {
    authenticated: boolean;
    oauthConnected: boolean;
};

function formatNumber(value?: number, maximumFractionDigits = 0) {
    if (value === undefined || Number.isNaN(value)) return '--';

    return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value);
}

export default function DashboardClient({ email }: { email?: string }) {
    const router = useRouter();
    const [status, setStatus] = useState<AuthStatus | null>(null);
    const [summary, setSummary] = useState<FitSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboard = async () => {
        setError(null);
        setSyncing(true);

        try {
            const statusResponse = await fetch('/api/auth/status', { cache: 'no-store' });
            const statusResult = await statusResponse.json();

            if (!statusResponse.ok || !statusResult.data?.authenticated) {
                router.push('/login');
                return;
            }

            setStatus(statusResult.data);

            if (statusResult.data.oauthConnected) {
                const summaryResponse = await fetch('/api/fitdata/summary?days=7', { cache: 'no-store' });
                const summaryResult = await summaryResponse.json();

                if (!summaryResponse.ok) {
                    throw new Error(summaryResult.error?.message || 'Failed to load Google Fit data');
                }

                setSummary(summaryResult.data);
            } else {
                setSummary(null);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const stats = useMemo(() => {
        const data = summary?.summary;

        return [
            {
                label: 'Steps',
                value: formatNumber(data?.steps?.total),
                detail: '7 day total',
            },
            {
                label: 'Calories',
                value: formatNumber(data?.calories?.total, 0),
                detail: 'kcal burned',
            },
            {
                label: 'Active Minutes',
                value: formatNumber(data?.activeMinutes?.total),
                detail: 'movement time',
            },
            {
                label: 'Heart Rate',
                value: data?.heartRate?.average ? `${formatNumber(data.heartRate.average)} bpm` : '--',
                detail: 'average',
            },
        ];
    }, [summary]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    return (
        <main className="min-h-screen bg-[#F8F4EC] pt-28 text-[#241F29] lg:pt-32">
            <section className="grid min-h-[calc(100vh-8rem)] grid-cols-1 lg:grid-cols-[1fr_5%_28%]">
                <div className="px-6 py-10 lg:px-20">
                    <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-[#43334C]/70">
                                HealthVerse Foundation
                            </p>
                            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
                                Dashboard
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-[#43334C]/80">
                                {email || 'Signed in user'} dapat melihat ringkasan aktivitas Google Fit setelah koneksi Google berhasil.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={fetchDashboard}
                                disabled={syncing}
                                className="rounded-full bg-[#241F29] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#43334C] disabled:opacity-60"
                            >
                                {syncing ? 'Syncing...' : 'Sync Data'}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="rounded-full border border-[#241F29]/20 px-5 py-3 text-sm font-semibold text-[#241F29] transition-colors hover:bg-white"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-8 rounded-2xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {stats.map((stat) => (
                            <article
                                key={stat.label}
                                className="rounded-[24px] border border-[#241F29]/10 bg-white/65 p-5 shadow-[0_18px_55px_rgba(36,31,41,0.08)]"
                            >
                                <p className="text-sm text-[#43334C]/70">{stat.label}</p>
                                <p className="mt-3 text-3xl font-semibold tracking-tight">{loading ? '...' : stat.value}</p>
                                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#43334C]/55">{stat.detail}</p>
                            </article>
                        ))}
                    </div>

                    <div className="mt-8 rounded-[28px] bg-[#241F29] p-6 text-white sm:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[#D8CDE1]/60">
                                    Google Fit
                                </p>
                                <h2 className="mt-3 text-2xl font-semibold">
                                    {status?.oauthConnected ? 'Connected and ready' : 'Connect Google Fit'}
                                </h2>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#E8E3EE]/72">
                                    {status?.oauthConnected
                                        ? summary?.message || `Showing data for ${summary?.period || 'the last 7 days'}.`
                                        : 'Gunakan Google authentication untuk login sekaligus memberi akses Google Fit.'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    window.location.href = '/api/auth/google';
                                }}
                                className="w-full rounded-full bg-[#F8F4EC] px-5 py-3 text-sm font-semibold text-[#241F29] transition-colors hover:bg-white md:w-auto"
                            >
                                {status?.oauthConnected ? 'Reconnect Google Fit' : 'Connect Google Fit'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="hidden bg-[#241F29] lg:block" />
                <aside
                    className="min-h-[300px] bg-[#43334C] bg-cover bg-right bg-no-repeat p-6 text-white lg:min-h-0"
                    style={{ backgroundImage: 'url("/assets/background/backgroundHome.png")' }}
                >
                    <div className="mt-8 rounded-[24px] bg-[#241F29]/80 p-5 backdrop-blur">
                        <p className="text-xs uppercase tracking-[0.24em] text-[#D8CDE1]/65">Access barrier</p>
                        <p className="mt-3 text-sm leading-6 text-[#E8E3EE]/80">
                            Dashboard ini hanya terbuka setelah login/register berhasil. Session disimpan di cookie HTTP-only.
                        </p>
                    </div>
                </aside>
            </section>
        </main>
    );
}
