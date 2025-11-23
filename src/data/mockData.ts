import { AnalyticsData } from '../../types';

export const MOCK_HISTORY = [
    { id: 'sess_01', user: 'Visitor #8821', lastMsg: 'How do I upload a PDF?', time: '2 mins ago', status: 'active' },
    { id: 'sess_02', user: 'Visitor #9942', lastMsg: 'What are the pricing tiers?', time: '1 hour ago', status: 'completed' },
    { id: 'sess_03', user: 'Visitor #1123', lastMsg: 'Is there an API?', time: '3 hours ago', status: 'completed' },
    { id: 'sess_04', user: 'Visitor #5512', lastMsg: 'Connection issues.', time: '5 hours ago', status: 'failed' },
    { id: 'sess_05', user: 'Visitor #3311', lastMsg: 'Thanks for the help!', time: '1 day ago', status: 'completed' },
];

export const ANALYTICS_DATA: AnalyticsData[] = [
    { name: 'Mon', conversations: 12, tokens: 4500 },
    { name: 'Tue', conversations: 19, tokens: 8200 },
    { name: 'Wed', conversations: 15, tokens: 6100 },
    { name: 'Thu', conversations: 25, tokens: 11200 },
    { name: 'Fri', conversations: 32, tokens: 15400 },
    { name: 'Sat', conversations: 18, tokens: 7800 },
    { name: 'Sun', conversations: 10, tokens: 3200 },
];
