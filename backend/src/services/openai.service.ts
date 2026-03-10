import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function generateChatCompletion(prompt: string) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // or 'gpt-3.5-turbo'
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('Không thể kết nối với trí tuệ nhân tạo');
    }
}
