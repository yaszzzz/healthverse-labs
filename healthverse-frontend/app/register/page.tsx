'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '../../src/components/AuthForm';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (data: { email: string; password: string }) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error?.message || 'Registration failed');
            }

            router.push('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F8F4EC] pt-28 lg:pt-32">
            <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 lg:grid-cols-[22%_440px_1fr]">
                <div
                    className="hidden bg-[#43334C] bg-cover bg-right bg-no-repeat lg:block"
                    style={{ backgroundImage: 'url("/assets/background/backgroundHome.png")' }}
                />
                <section className="flex items-center justify-center px-6 py-12">
                    <AuthForm type="register" onSubmit={handleRegister} isLoading={isLoading} />
                </section>
                <section className="flex items-center px-6 py-12 lg:px-20">
                    <div className="max-w-2xl text-[#241F29]">
                        <p className="text-xs uppercase tracking-[0.28em] text-[#43334C]/70">
                            HealthVerse Foundation
                        </p>
                        <h1 className="mt-5 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
                            Build your private health profile.
                        </h1>
                        <p className="mt-6 max-w-lg text-base leading-7 text-[#43334C]/80">
                            Akun baru langsung masuk ke dashboard. Untuk sinkronisasi aktivitas, lanjutkan dengan tombol Google agar HealthVerse terhubung ke Google Fit.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
