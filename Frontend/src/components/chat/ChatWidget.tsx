import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';
import ChatRoom from './ChatRoom';
import { chatApi } from '@/api/chat.api';
import { userApi } from '@/api/user.api';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface ChatWidgetProps {
    providerId: string;
    providerName: string;
    itemId: string;
    itemName: string;
}

export default function ChatWidget({ providerId, providerName, itemId, itemName }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await userApi.getProfile();
                setCurrentUser(user);

                if (user) {
                    const roomPath = `${user.id}_${providerId}`.replace(/\./g, '_');
                    const unreadRef = ref(database, `chats/${roomPath}/unread/${user.id}`);
                    onValue(unreadRef, (snap) => {
                        setUnreadCount(snap.val() || 0);
                    });
                }
            } catch (err) {
                console.error("Failed to fetch user for chat", err);
            }
        };
        fetchUser();
    }, [providerId]);

    const handleOpenChat = async () => {
        if (!currentUser) {
            alert("Vui lòng đăng nhập để chat với nhà cung cấp!");
            return;
        }

        if (isOpen) {
            setIsOpen(false);
            return;
        }

        try {
            setLoading(true);
            const res = await chatApi.initializeChat({
                customer_id: currentUser.id,
                provider_id: providerId,
                item_id: itemId,
                item_name: itemName,
                customer_name: currentUser.fullName
            });
            setConversationId(res.conversation_id);
            setIsOpen(true);

            if (unreadCount > 0) {
                await chatApi.markRead(res.conversation_id, currentUser.id);
            }
        } catch (err) {
            console.error("Failed to initialize chat", err);
            alert("Không thể bắt đầu chat. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && conversationId && currentUser && (
                <div className="mb-4 w-[350px] h-[500px] md:w-[400px] md:h-[600px] shadow-2xl transition-all animate-in slide-in-from-bottom-5">
                    <ChatRoom
                        conversationId={conversationId}
                        currentUser={{ id: currentUser.id, fullName: currentUser.fullName, role: currentUser.role }}
                        onClose={() => setIsOpen(false)}
                        title={`Chat với ${providerName}`}
                        itemId={itemId}
                        itemName={itemName}
                    />
                </div>
            )}

            {/* Floating Button */}
            <Button
                onClick={handleOpenChat}
                disabled={loading}
                className={`w-16 h-16 rounded-full shadow-2xl border-none transition-all duration-500 scale-100 active:scale-90 ${isOpen ? 'bg-gray-900 hover:bg-black' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
                {loading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isOpen ? (
                    <X size={28} className="text-white" />
                ) : (
                    <MessageCircle size={28} className="text-white fill-white/20" />
                )}

                {!isOpen && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 border-2 border-white text-[10px] font-black text-white items-center justify-center">
                            {unreadCount}
                        </span>
                    </span>
                )}

                {!isOpen && unreadCount === 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                    </span>
                )}
            </Button>
        </div>
    );
}
