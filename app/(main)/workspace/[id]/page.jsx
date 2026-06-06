"use client";

import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { MessageSquare, Code2 } from 'lucide-react';

const ChatView = dynamic(() => import('@/components/custom/ChatView'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-full" />
});

const CodeView = dynamic(() => import('@/components/custom/CodeView'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-full" />
});

const BackgroundPattern = React.memo(() => (
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-1/2 top-0 h-[500px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(circle_400px_at_50%_300px,#3b82f625,transparent)]" />
    </div>
));

BackgroundPattern.displayName = 'BackgroundPattern';

const Workspace = () => {
    const [mobileTab, setMobileTab] = useState('chat');

    return (
        <div className="min-h-screen bg-gray-950 relative overflow-hidden">
            <BackgroundPattern />
            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm relative z-20">
                <button
                    onClick={() => setMobileTab('chat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                        mobileTab === 'chat'
                            ? 'text-blue-400 border-b-2 border-blue-500'
                            : 'text-gray-500'
                    }`}
                >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                </button>
                <button
                    onClick={() => setMobileTab('code')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                        mobileTab === 'code'
                            ? 'text-blue-400 border-b-2 border-blue-500'
                            : 'text-gray-500'
                    }`}
                >
                    <Code2 className="h-4 w-4" />
                    Code
                </button>
            </div>
            <div className='relative z-10 p-4 md:p-10'>
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-10'>
                    <div className={`${mobileTab === 'code' ? 'hidden' : 'block'} md:block`}>
                        <ChatView />
                    </div>
                    <div className={`${mobileTab === 'chat' ? 'hidden' : 'block'} md:block md:col-span-3`}>
                        <CodeView />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Workspace;
