import { httpClient } from './http';

export const chatApi = {
    initializeChat: async (data: {
        customer_id: string;
        item_id: string;
        item_name: string;
        customer_name: string;
    }) => {
        return httpClient.post<{ conversation_id: string; is_new: boolean; owner_id: string }>('/chat/initialize', data);
    },

    listMyChats: async () => {
        return httpClient.get<any[]>('/chat/my-chats');
    },

    trackActivity: async (data: any) => {
        return httpClient.post('/chat/track-activity', data);
    },

    markRead: async (conversation_id: string, user_id: string) => {
        return httpClient.post('/chat/mark-read', { conversation_id, user_id });
    },

    deleteChat: async (conversation_id: string) => {
        return httpClient.delete(`/chat/${conversation_id}`);
    },

    getProviderInfo: async () => {
        return httpClient.get<{ id_provider: string }>('/chat/provider-info');
    }
};
