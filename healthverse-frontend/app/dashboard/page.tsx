'use client';

import React from 'react';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Dashboard
                        </h1>
                        <p className="text-gray-400 mt-2">Welcome to your health command center</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors hidden sm:block">
                            Sync Data
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Steps', value: '8,432', change: '+12%', color: 'emerald' },
                        { label: 'Calories', value: '1,840', change: '-5%', color: 'orange' },
                        { label: 'Sleep', value: '7h 12m', change: '+2%', color: 'blue' },
                    ].map((stat) => (
                        <div key={stat.label} className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-400">{stat.label}</p>
                                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full bg-${stat.color}-500/10 text-${stat.color}-400`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State / PlaceholderContent */}
                <div className="mt-8 p-12 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 text-center">
                    <h3 className="text-xl font-medium text-white mb-2">Connect Your Devices</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-6">
                        Link your wearables and health apps to see detailed analytics and blockchain-verified health records.
                    </p>
                    <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-full font-medium transition-colors shadow-lg shadow-emerald-900/20">
                        Connect Device
                    </button>
                </div>
            </div>
        </div>
    );
}
