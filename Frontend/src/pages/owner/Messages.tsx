import { useState, useEffect, useRef } from 'react';
import { chatApi } from '@/api/chat.api';
import { userApi } from '@/api/user.api';
import { database, auth } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import ChatRoom from '@/components/chat/ChatRoom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Input } from '@/components/ui/input';

export default function Messages() {
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const chatsMapRef = useRef<Record<string, any>>({});
    const listenersRef = useRef<Record<string, () => void>>({});
    const selectedChatRef = useRef<any>(null); 

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        let isMounted = true;

        const attachRoomListener = (roomId: string) => {
            if (listenersRef.current[roomId]) return;

            const metaRef = ref(database, `chats/${roomId}`);
            const unsubscribe = onValue(metaRef, (metaSnap) => {
                if (!metaSnap.exists() || !isMounted) return;

                const meta = metaSnap.val();
                chatsMapRef.current[roomId] = {
                    ...chatsMapRef.current[roomId],
                    id_room: roomId,
                    ...meta
                };

                if (selectedChatRef.current?.id_room === roomId) {
                    const [custId, provId] = roomId.split('_');
                    const targetId = (currentUser?.role === 'customer') ? custId : provId;
                    const unreadCount = meta.unread?.[targetId] || 0;

                    if (unreadCount > 0) {
                        chatApi.markRead(roomId, targetId);
                        if (chatsMapRef.current[roomId].unread) {
                            chatsMapRef.current[roomId].unread[targetId] = 0;
                        }
                    }
                }

                const allChats = Object.values(chatsMapRef.current);
                allChats.sort((a, b) => {
                    const getTs = (v: any) => (typeof v === 'number' ? v : new Date(v).getTime() || 0);
                    return getTs(b.updated_at) - getTs(a.updated_at);
                });

                if (isMounted) {
                    setChats([...allChats]);
                    setLoading(false);
                }
            });
            listenersRef.current[roomId] = () => off(metaRef, 'value', unsubscribe);
        };

        const fetchData = async () => {
            try {
                const user = await userApi.getProfile();
                if (!isMounted) return;
                setCurrentUser(user);
                await signInAnonymously(auth);

                const historical = await chatApi.listMyChats();
                if (isMounted) {
                    historical.forEach(c => {
                        chatsMapRef.current[c.id_room] = c;
                        attachRoomListener(c.id_room);
                    });
                    setChats([...historical]);
                }

                let targetId = user.id;
                if (user.role === 'owner') {
                    const providerInfo = await chatApi.getProviderInfo();
                    if (providerInfo?.id_provider) {
                        targetId = providerInfo.id_provider;
                    }
                }

                const userChatsRef = ref(database, `user_chats/${targetId}`);
                onValue(userChatsRef, (snapshot) => {
                    if (!snapshot.exists()) {
                        if (isMounted && Object.keys(chatsMapRef.current).length === 0) {
                            setLoading(false);
                        }
                        return;
                    }
                    const roomIds = Object.keys(snapshot.val());
                    roomIds.forEach(roomId => attachRoomListener(roomId));
                });

                if (historical.length === 0) setLoading(false);

            } catch (err) {
                console.error(err);
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            Object.values(listenersRef.current).forEach(unsub => unsub());
            listenersRef.current = {};
        };
    }, []);

    const filteredChats = chats.filter(c =>
        c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.item_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 pt-2 pb-8 h-[calc(100vh-80px)] min-h-[600px]">
            <div className="flex flex-col md:flex-row gap-6 h-full font-sans">
                {/* Chat List */}
                <div className="w-full md:w-[380px] flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tin nhắn</h1>
                        <Badge className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold ring-4 ring-blue-50">
                            {chats.length}
                        </Badge>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <Input
                            placeholder="Tìm kiếm khách hàng hoặc dịch vụ..."
                            className="pl-12 rounded-2xl bg-gray-50 border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all h-14 font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-28 bg-gray-100 rounded-3xl animate-pulse" />
                            ))
                        ) : filteredChats.length === 0 ? (
                            <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <MessageSquare size={32} className="text-gray-200" />
                                </div>
                                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Không có hội thoại</p>
                            </div>
                        ) : (
                            filteredChats.map((chat) => {
                                const [custId, provId] = chat.id_room.split('_');
                                const targetIdForUnread = currentUser.role === 'customer' ? custId : provId;
                                const unreadCount = chat.unread?.[targetIdForUnread] || 0;

                                return (
                                    <div key={chat.id_room} className="relative group">
                                        <Card
                                            onClick={async () => {
                                                setSelectedChat(chat);
                                                if (unreadCount > 0) {
                                                    await chatApi.markRead(chat.id_room, targetIdForUnread);
                                                }
                                            }}
                                            className={`p-5 rounded-[28px] cursor-pointer transition-all duration-300 border-2 ${selectedChat?.id_room === chat.id_room ? 'border-blue-600 bg-blue-600 text-white shadow-2xl shadow-blue-200' : 'border-transparent bg-white hover:bg-gray-50 shadow-sm'}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${selectedChat?.id_room === chat.id_room ? 'bg-white/20' : 'bg-blue-50'}`}>
                                                    <User size={28} className={selectedChat?.id_room === chat.id_room ? 'text-white' : 'text-blue-500'} />
                                                    {unreadCount > 0 && selectedChat?.id_room !== chat.id_room && (
                                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                                            {unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h3 className={`font-black truncate text-sm tracking-tight ${selectedChat?.id_room === chat.id_room ? 'text-white' : 'text-gray-900'}`}>{chat.customer_name}</h3>
                                                        <span className={`text-[10px] font-bold shrink-0 ${selectedChat?.id_room === chat.id_room ? 'text-white/80' : 'text-gray-400'}`}>
                                                            {chat.updated_at ? format(new Date(typeof chat.updated_at === 'number' ? chat.updated_at : chat.updated_at), 'HH:mm', { locale: vi }) : '--:--'}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[11px] font-bold truncate mb-2 ${selectedChat?.id_room === chat.id_room ? 'text-white/90' : 'text-blue-600'}`}>#{chat.item_name}</p>
                                                    <p className={`text-xs truncate ${selectedChat?.id_room === chat.id_room ? 'text-white/70' : 'text-gray-500 font-medium'}`}>
                                                        {chat.last_message || '...'}
                                                    </p>
                                                </div>
                                            </div>
                                        </Card>

                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn cuộc hội thoại này?')) {
                                                    try {
                                                        await chatApi.deleteChat(chat.id_room);
                                                        setChats(prev => prev.filter(c => c.id_room !== chat.id_room));
                                                        if (selectedChat?.id_room === chat.id_room) setSelectedChat(null);
                                                    } catch (err) {
                                                        alert('Lỗi xóa tin nhắn');
                                                    }
                                                }
                                            }}
                                            className={`absolute -right-2 -top-2 w-8 h-8 rounded-full bg-white shadow-lg border border-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-10`}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Chat Room */}
                <div className="flex-1 h-full min-h-[600px]">
                    {selectedChat && currentUser ? (
                        <div className="h-full rounded-[40px] overflow-hidden border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white">
                            <ChatRoom
                                conversationId={selectedChat.id_room}
                                currentUser={{ id: currentUser.id, fullName: currentUser.fullName, role: currentUser.role }}
                                title={`${selectedChat.customer_name}`}
                                itemName={selectedChat.item_name}
                            />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-gray-50/30 rounded-[40px] border-2 border-dashed border-gray-200">
                            <div className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-blue-500 mb-8 animate-bounce transition-all duration-1000">
                                <MessageSquare size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Hộp thư đến</h2>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">Chọn một hội thoại để trả lời</p>
                        </div>
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}} />
        </div>
    );
}
