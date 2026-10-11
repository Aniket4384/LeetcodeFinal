import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Copy, Check, AlertCircle } from 'lucide-react';

function ChatAi({ problem }) {
    console.log(problem)
    const [messages, setMessages] = useState([
        {
            role: 'model',
            parts: [{ text: `Hi! I'm your AI coding assistant. I'll help you solve **${problem?.title || 'this problem'}**. Ask me anything!` }],
            timestamp: new Date()
        }
    ]);
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [streamingText, setStreamingText] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading, streamingText]);

    const onSubmit = async (data) => {
        const userMessage = data.message?.trim();
        if (!userMessage) return;

        setMessages(prev => [...prev, {
            role: 'user',
            parts: [{ text: userMessage }],
            timestamp: new Date()
        }]);
        reset();
        setLoading(true);
        setStreamingText('');

        try {
            const response = await fetch("https://backend-1-55n9.onrender.com/ai/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    messages: userMessage,
                    title: problem?.title,
                    description: problem?.description,
                    testCases: problem?.visibleTestCases,
                    startCode: problem?.startCode
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                fullText += chunk;
                setStreamingText(fullText);
            }

            setMessages(prev => [...prev, {
                role: 'model',
                parts: [{ text: fullText || "No response received." }],
                timestamp: new Date()
            }]);
            setStreamingText('');

        } catch (error) {
            console.error("API Error:", error);
            setMessages(prev => [...prev, {
                role: 'model',
                parts: [{ text: "Sorry, I'm having trouble connecting. Please try again." }],
                timestamp: new Date(),
                isError: true
            }]);
            setStreamingText('');
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'model',
                parts: [{ text: `Chat cleared! How can I help you with **${problem?.title || 'this problem'}**?` }],
                timestamp: new Date()
            }
        ]);
        setStreamingText('');
    };

    const copyToClipboard = async (text, index) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (error) {
            console.error("Copy failed:", error);
        }
    };

    const formatMessage = (text) => {
        const parts = text.split(/(```[\s\S]*?```)/g);

        return parts.map((part, idx) => {
            if (part.startsWith('```') && part.endsWith('```')) {
                const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
                const language = match?.[1] || 'code';
                const code = match?.[2]?.trim() || part.slice(3, -3).trim();

                return (
                    <div key={idx} className="my-2 rounded-lg overflow-hidden border border-slate-600">
                        <div className="flex items-center justify-between bg-slate-700 px-3 py-1.5">
                            <span className="text-xs font-mono text-gray-300">{language}</span>
                            <button
                                onClick={() => copyToClipboard(code, `${idx}-code`)}
                                className="text-xs text-gray-300 hover:text-white flex items-center gap-1"
                            >
                                {copiedIndex === `${idx}-code` ? (
                                    <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3 h-3" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="bg-slate-800 p-3 overflow-x-auto text-xs font-mono text-gray-200">
                            <code>{code}</code>
                        </pre>
                    </div>
                );
            }

            const formattedText = part.split('\n').map((line, i) => {
                const boldFormatted = line.split(/(\*\*.*?\*\*)/g).map((segment, j) => {
                    if (segment.startsWith('**') && segment.endsWith('**')) {
                        return <strong key={j} className="font-semibold text-white">{segment.slice(2, -2)}</strong>;
                    }
                    return <span key={j}>{segment}</span>;
                });
                return <div key={i}>{boldFormatted}</div>;
            });

            return <div key={idx}>{formattedText}</div>;
        });
    };

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800"></div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                            AI Assistant
                            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                        </h3>
                        <p className="text-xs text-gray-400">Online • Ready to help</p>
                    </div>
                </div>
                <button
                    onClick={clearChat}
                    className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    >
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            msg.role === "user"
                                ? "bg-blue-600"
                                : msg.isError
                                ? "bg-red-600"
                                : "bg-gradient-to-br from-purple-500 to-pink-500"
                        }`}>
                            {msg.role === "user" ? (
                                <User className="w-4 h-4 text-white" />
                            ) : msg.isError ? (
                                <AlertCircle className="w-4 h-4 text-white" />
                            ) : (
                                <Bot className="w-4 h-4 text-white" />
                            )}
                        </div>

                        <div className={`flex flex-col max-w-[85%] ${
                            msg.role === "user" ? "items-end" : "items-start"
                        }`}>
                            <div className={`relative px-4 py-2.5 rounded-2xl ${
                                msg.role === "user"
                                    ? "bg-blue-600 text-white rounded-tr-sm"
                                    : msg.isError
                                    ? "bg-red-500/10 text-red-200 border border-red-500/30 rounded-tl-sm"
                                    : "bg-slate-800 text-gray-200 border border-slate-700 rounded-tl-sm"
                            }`}>
                                <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {formatMessage(msg.parts[0]?.text || "")}
                                </div>

                                {msg.role === "model" && !msg.isError && (
                                    <button
                                        onClick={() => copyToClipboard(msg.parts[0]?.text, index)}
                                        className="absolute -right-1 -top-1 p-1.5 bg-slate-700 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                                    >
                                        {copiedIndex === index ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                            <Copy className="w-3 h-3 text-gray-300" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Streaming message in real-time */}
                {loading && streamingText && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-slate-800 text-gray-200 border border-slate-700">
                            <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {formatMessage(streamingText)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading dots */}
                {loading && !streamingText && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                <span className="text-sm text-gray-400">AI is thinking...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="p-4 bg-slate-800/80 border-t border-slate-700"
            >
                <div className="flex items-end gap-2">
                    <input
                        placeholder="Ask me anything about this problem..."
                        className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                        {...register("message", {
                            required: true,
                            minLength: { value: 2, message: "Message too short" }
                        })}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={errors.message || loading}
                        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                            !errors.message && !loading
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500 hover:shadow-lg text-white'
                                : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 text-center">
                    AI can make mistakes. Please verify important information.
                </p>
            </form>
        </div>
    );
}

export default ChatAi;