"use client"
import { MessagesContext } from '@/context/MessagesContext';
import { Loader2Icon, Send, Bot, User } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import { useParams } from 'next/navigation';
import { useContext, useEffect, useState, useCallback, memo, useRef } from 'react';
import { useMutation } from 'convex/react';
import Prompt from '@/data/Prompt';
import ReactMarkdown from 'react-markdown';

const MessageItem = memo(({ msg }) => (
    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
            msg.role === 'user'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-purple-500/20 text-purple-400'
        }`}>
            {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>
        <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${
            msg.role === 'user' ? 'items-end' : 'items-start'
        }`}>
            <div className={`px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                    ? 'bg-blue-600/20 border border-blue-500/30 rounded-tr-sm'
                    : 'bg-gray-800/50 border border-gray-700 rounded-tl-sm'
            }`}>
                <ReactMarkdown className="prose prose-invert prose-sm max-w-none break-words">
                    {msg.content}
                </ReactMarkdown>
            </div>
            <span className="text-[10px] text-gray-500 mt-1 px-1">
                {msg.role === 'user' ? 'You' : 'AI'}
            </span>
        </div>
    </div>
));

MessageItem.displayName = 'MessageItem';

function ChatView() {
    const { id } = useParams();
    const convex = useConvex();
    const { messages, setMessages } = useContext(MessagesContext);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const UpdateMessages = useMutation(api.workspace.UpdateWorkspace);
    const chatEndRef = useRef(null);
    const streamingRef = useRef(false);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    }, []);

    const GetWorkSpaceData = useCallback(async () => {
        const result = await convex.query(api.workspace.GetWorkspace, {
            workspaceId: id
        });
        setMessages(result?.messages);
    }, [id, convex, setMessages]);

    useEffect(() => {
        id && GetWorkSpaceData();
    }, [id, GetWorkSpaceData]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const GetAiResponse = useCallback(async () => {
        if (streamingRef.current) return;
        streamingRef.current = true;
        setLoading(true);

        const PROMPT = JSON.stringify(messages) + Prompt.CHAT_PROMPT;

        try {
            setMessages(prev => [...prev, { role: 'ai', content: '' }]);

            const response = await fetch('/website-builder/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: PROMPT }),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.chunk) {
                                fullText += data.chunk;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    const lastMsg = updated[updated.length - 1];
                                    if (lastMsg && lastMsg.role === 'ai') {
                                        lastMsg.content = fullText;
                                    }
                                    return updated;
                                });
                            }
                            if (data.done && data.result) {
                                fullText = data.result;
                                setMessages(prev => {
                                    const updated = [...prev];
                                    const lastMsg = updated[updated.length - 1];
                                    if (lastMsg && lastMsg.role === 'ai') {
                                        lastMsg.content = fullText;
                                    }
                                    return updated;
                                });
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }

            await UpdateMessages({
                messages: [...messages, { role: 'ai', content: fullText }],
                workspaceId: id
            });
        } catch (error) {
            console.error('Error getting AI response:', error);
        } finally {
            setLoading(false);
            streamingRef.current = false;
        }
    }, [messages, id, UpdateMessages, setMessages]);

    useEffect(() => {
        if (messages?.length > 0) {
            const role = messages[messages?.length - 1].role;
            if (role === 'user') {
                GetAiResponse();
            }
        }
    }, [messages, GetAiResponse]);

    const onGenerate = useCallback((input) => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, {
            role: 'user',
            content: input
        }]);
        setUserInput('');
    }, [setMessages]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onGenerate(userInput);
        }
    }, [onGenerate, userInput]);

    return (
        <div className="relative h-[80vh] md:h-[85vh] flex flex-col bg-gray-900 rounded-xl border border-gray-800">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800 bg-gray-900/50">
                <h2 className="text-sm font-semibold text-gray-300">AI Chat</h2>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                <div className="max-w-4xl mx-auto space-y-4">
                    {Array.isArray(messages) && messages.map((msg, index) => (
                        <MessageItem key={index} msg={msg} />
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-purple-400" />
                            </div>
                            <div className="flex flex-col">
                                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-800/30 border border-gray-700">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Loader2Icon className="animate-spin h-4 w-4" />
                                        <span className="text-sm">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Section */}
            <div className="flex-shrink-0 border-t border-gray-800 bg-gray-900/50 p-3 md:p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-2 md:gap-3">
                        <textarea
                            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={2}
                            className="flex-1 bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 resize-none text-sm"
                        />
                        <button
                            onClick={() => onGenerate(userInput)}
                            disabled={!userInput.trim() || loading}
                            className={`flex items-center justify-center rounded-xl px-4 transition-all duration-200 shrink-0 ${
                                userInput.trim() && !loading
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            <Send className={`h-5 w-5 ${!userInput.trim() || loading ? '' : 'text-white'}`} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatView;
