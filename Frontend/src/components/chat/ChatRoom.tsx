import React, { useState, useEffect, useRef } from 'react';
import { database, auth } from '@/lib/firebase';
import { ref, onValue, push, set, serverTimestamp } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { chatApi } from '@/api/chat.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, X, User, Store, Clock, MessageCircle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Message {
    id: string;
    sender_id: string;
    sender_name: string;
    content: string;
    timestamp: any;
    is_auto_reply?: boolean;
}

interface ChatRoomProps {
    conversationId: string;
    currentUser: { id: string; fullName: string; role: string };
    onClose?: () => void;
    title?: string;
    itemId?: string;
    itemName?: string;
}

export default function ChatRoom({ conversationId, currentUser, onClose, title, itemId, itemName }: ChatRoomProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [showContextBanner, setShowContextBanner] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!conversationId) return;

        const initChat = async () => {
            try {
                await signInAnonymously(auth);
                const messagesRef = ref(database, `chats/${conversationId}/messages`);

                onValue(messagesRef, (snapshot) => {
                    const data = snapshot.val();
                    if (data) {
                        const msgs: Message[] = Object.keys(data).map((key) => ({
                            id: key,
                            ...data[key],
                        }));
                        msgs.sort((a, b) => {
                            const timeA = typeof a.timestamp === 'number' ? a.timestamp : 0;
                            const timeB = typeof b.timestamp === 'number' ? b.timestamp : 0;
                            return timeA - timeB;
                        });
                        setMessages(msgs);
                    } else {
                        setMessages([]);
                    }
                    setLoading(false);
                }, (err) => {
                    console.error("Firebase Read Error:", err);
                    setError("Bạn không có quyền xem cuộc trò chuyện này.");
                    setLoading(false);
                });
            } catch (err) {
                console.error("Auth Error:", err);
                setError("Không thể kết nối máy chủ chat.");
                setLoading(false);
            }
        };

        initChat();
    }, [conversationId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim() || loading) return;

        const msgContent = input.trim();
        setInput('');

        try {
            const messagesRef = ref(database, `chats/${conversationId}/messages`);
            const newMessageRef = push(messagesRef);
            const ts = serverTimestamp();

            await set(newMessageRef, {
                sender_id: currentUser.id,
                sender_name: currentUser.fullName,
                content: msgContent,
                timestamp: ts,
            });

            // Update only necessary per-message metadata
            await set(ref(database, `chats/${conversationId}/last_message`), msgContent);
            await set(ref(database, `chats/${conversationId}/updated_at`), ts);
            await set(ref(database, `chats/${conversationId}/last_sender_id`), currentUser.id);

            // Sync with SQL database for dashboard listings
            const [cust_id, prov_id] = conversationId.split('_');
            await chatApi.trackActivity({
                conversation_id: conversationId,
                customer_id: cust_id,
                provider_id: prov_id,
                customer_name: (currentUser.role === 'customer') ? (currentUser.fullName) : (title || 'Khách hàng'),
                item_name: itemName || 'Dịch vụ',
                last_message: msgContent,
                sender_id: currentUser.id
            });
        } catch (err) {
            console.error("Send Error:", err);
            alert("Lỗi gửi tin nhắn!");
        }
    };

    const formatMessageTime = (ts: any) => {
        if (!ts) return '';
        try {
            const date = typeof ts === 'number' ? new Date(ts) : new Date();
            return format(date, "HH:mm, EEEE, d 'tháng' M, yyyy", { locale: vi });
        } catch (e) {
            return '';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8f9fa] rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200">
            {/* Header - Shopee Style (Orange/Blue gradient or Premium Dark) */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-600 p-4 flex items-center justify-between text-white shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                            {currentUser.role === 'customer' ? <Store size={22} className="text-blue-100" /> : <User size={22} className="text-blue-100" />}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-[15px] leading-tight tracking-tight truncate max-w-[200px]">{title || 'Hỗ trợ khách hàng'}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-bold opacity-90 uppercase tracking-[0.1em]">Trực tuyến</span>
                        </div>
                    </div>
                </div>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-8 w-8 transition-colors">
                        <X size={18} />
                    </Button>
                )}
            </div>

            {/* Messages Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth custom-scrollbar relative">
                {/* Contextual Action Banner for Customers */}
                {currentUser.role === 'customer' && itemName && showContextBanner && (
                    <div className="sticky top-0 z-20 mb-4 animate-in slide-in-from-top-4 duration-500">
                        <div className="bg-white/95 backdrop-blur-md border border-blue-100 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3 overflow-hidden group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                    <MessageCircle size={20} className="text-blue-600 animate-pulse" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Yêu cầu tư vấn</p>
                                    <p className="text-[13px] font-bold text-gray-800 truncate">Tìm hiểu về <span className="text-blue-700">"{itemName}"</span>?</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 px-1">
                                <Button
                                    onClick={() => {
                                        setInput(`Tôi đang quan tâm đến dịch vụ "${itemName}", vui lòng tư vấn kỹ hơn cho tôi về lịch trình và giá cả nhé!`);
                                        setShowContextBanner(false);
                                        setTimeout(() => handleSendMessage(), 100);
                                    }}
                                    className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-100 p-0"
                                >
                                    <Check size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowContextBanner(false)}
                                    className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl p-0"
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full" />
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                            <X size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-600">{error}</p>
                        <p className="text-[10px] text-gray-400 uppercase font-black">Hãy mở Project Settings &gt; Authentication &gt; Sign-in method và Bật "Anonymous" trên Firebase Console.</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40">
                        <MessageCircle size={48} className="text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Bắt đầu trò chuyện</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUser.id;
                        const showName = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group transition-all duration-300`}>
                                <div className={`max-w-[88%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    {showName && (
                                        <span className="text-[11px] font-black text-gray-500 uppercase tracking-tighter mb-1.5 ml-1">
                                            {msg.sender_name}
                                        </span>
                                    )}
                                    <div className={`
                                        relative px-4 py-3 rounded-[1.25rem] text-[14px] leading-relaxed shadow-sm transition-all
                                        ${isMe
                                            ? 'bg-blue-600 text-white rounded-tr-[2px] shadow-blue-100 hover:shadow-md'
                                            : msg.is_auto_reply
                                                ? 'bg-orange-50 text-orange-900 border border-orange-100 rounded-tl-[2px] italic font-medium'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-[2px] hover:shadow-md'
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                    <div className={`flex items-center gap-1.5 mt-1.5 font-bold text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end pr-1' : 'pl-1'}`}>
                                        <Clock size={10} className="text-gray-300" />
                                        <span>{formatMessageTime(msg.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Bar - Premium Shadow & Focus */}
            <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
                    <div className="relative flex-1 group">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Nhập tin nhắn..."
                            className="bg-gray-50/80 border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 text-sm font-semibold h-11 px-4 rounded-2xl transition-all duration-200"
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        className="rounded-2xl h-12 w-12 bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white shadow-xl shadow-blue-200 shrink-0 transition-all duration-300 active:scale-90"
                    >
                        <Send size={22} strokeWidth={3} className="text-white drop-shadow-sm" />
                    </Button>
                </form>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}} />
        </div>
    );
}
