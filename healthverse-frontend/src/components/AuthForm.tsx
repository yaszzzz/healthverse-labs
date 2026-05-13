'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface AuthFormProps {
    type: 'login' | 'register';
    onSubmit: (data: { email: string; password: string }) => Promise<void>;
    isLoading?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit, isLoading = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            await onSubmit({ email, password });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = '/api/auth/google';
    };

    return (
        <div className="w-full max-w-[460px] bg-[#241F29] text-white border border-white/10 rounded-[28px] shadow-[0_30px_90px_rgba(36,31,41,0.28)] p-6 sm:p-8 animate-fadeIn">
            <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.24em] text-[#D8CDE1]/70">HealthVerse Foundation</p>
                <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
                    {type === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#E8E3EE]/72">
                    {type === 'login'
                        ? 'Masuk untuk membuka dashboard kesehatan dan sinkronisasi Google Fit.'
                        : 'Buat akun HealthVerse untuk menyimpan akses kesehatan secara aman.'}
                </p>
            </div>

            <div className="space-y-4">
                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full flex items-center justify-center px-4 py-3.5 border border-white/15 text-sm font-medium rounded-full text-[#241F29] bg-[#F8F4EC] hover:bg-white transition-colors"
                >
                    <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    {type === 'login' ? 'Sign in with Google Fit' : 'Sign up with Google Fit'}
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-3 bg-[#241F29] text-[#E8E3EE]/55">Or continue with</span>
                    </div>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 text-sm text-red-200 bg-red-500/15 border border-red-300/20 rounded-2xl">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[#E8E3EE]/82">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-2 block w-full px-4 py-3 bg-white/7 border border-white/12 rounded-2xl text-white placeholder-[#E8E3EE]/35 focus:outline-none focus:ring-2 focus:ring-[#B9A6C5] focus:border-[#B9A6C5] transition-colors"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#E8E3EE]/82">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={type === 'login' ? 'current-password' : 'new-password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-2 block w-full px-4 py-3 bg-white/7 border border-white/12 rounded-2xl text-white placeholder-[#E8E3EE]/35 focus:outline-none focus:ring-2 focus:ring-[#B9A6C5] focus:border-[#B9A6C5] transition-colors"
                            placeholder="Password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-full text-sm font-semibold text-[#241F29] bg-[#F8F4EC] hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#241F29] focus:ring-[#F8F4EC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : type === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-[#E8E3EE]/65">
                        {type === 'login' ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <Link
                        href={type === 'login' ? '/register' : '/login'}
                        className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white transition-colors"
                    >
                        {type === 'login' ? 'Sign up' : 'Sign in'}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AuthForm;
