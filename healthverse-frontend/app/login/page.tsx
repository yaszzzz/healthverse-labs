'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '../../src/components/AuthForm';

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [pageError, setPageError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setPageError(params.get('error'));
    }, []);

    const handleLogin = async (data: { email: string; password: string }) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || 'Login failed');
            }

            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F8F4EC] pt-28 lg:pt-32">
            <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 lg:grid-cols-[1fr_440px_22%]">
                <section className="flex items-center px-6 py-12 lg:px-20">
                    <div className="max-w-2xl text-[#241F29]">
                        <p className="text-xs uppercase tracking-[0.28em] text-[#43334C]/70">
                            Connected health records
                        </p>
                        <h1 className="mt-5 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
                            Health data, synced and protected.
                        </h1>
                        <p className="mt-6 max-w-lg text-base leading-7 text-[#43334C]/80">
                            Login dengan email atau Google. Saat memakai Google, izin Google Fit langsung diminta agar dashboard bisa membaca ringkasan aktivitas.
                        </p>
                        {pageError && (
                            <div className="mt-6 rounded-2xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {pageError}
                            </div>
                        )}
                    </div>
                </section>
                <section className="flex items-center justify-center px-6 py-12">
                    <AuthForm type="login" onSubmit={handleLogin} isLoading={isLoading} />
                </section>
                <div
                    className="hidden bg-[#43334C] bg-cover bg-right bg-no-repeat lg:block"
                    style={{ backgroundImage: 'url("/assets/background/backgroundHome.png")' }}
                />
            </div>
        </main>
    );
}
