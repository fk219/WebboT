import React, { useState, useEffect } from 'react';
import { Plus, Phone, Trash2, Edit2, Search } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

interface PhoneNumber {
    id: string;
    phone_number: string;
    agent_id: string | null;
    status: string;
    provider: string;
}

interface Agent {
    id: string;
    name: string;
}

export default function PhoneNumbersPage() {
    const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newNumber, setNewNumber] = useState('');
    const [selectedAgent, setSelectedAgent] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            // Fetch numbers (Mocking for now as table might not exist in Supabase JS types yet)
            // const { data: numbersData } = await supabaseService.client.from('phone_numbers').select('*');
            // const { data: agentsData } = await supabaseService.client.from('agents').select('id, name');

            // Mock Data
            setNumbers([
                { id: '1', phone_number: '+14155550100', agent_id: 'agent-1', status: 'active', provider: 'twilio' },
                { id: '2', phone_number: '+14155550101', agent_id: null, status: 'active', provider: 'twilio' }
            ]);
            setAgents([
                { id: 'agent-1', name: 'Sales Bot' },
                { id: 'agent-2', name: 'Support Bot' }
            ]);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNumber = async () => {
        // Logic to add number (e.g., buy from Twilio or just insert into DB)
        console.log('Adding number:', newNumber, selectedAgent);
        setIsAdding(false);
        setNewNumber('');
    };

    const handleAssignAgent = async (numberId: string, agentId: string) => {
        console.log('Assigning agent', agentId, 'to number', numberId);
        // await supabaseService.client.from('phone_numbers').update({ agent_id: agentId }).eq('id', numberId);
        setNumbers(numbers.map(n => n.id === numberId ? { ...n, agent_id: agentId } : n));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Phone Numbers</h1>
                    <p className="mt-2 text-gray-600">Manage your SIP numbers and assign them to agents.</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Number
                </button>
            </div>

            {/* Add Number Modal/Form */}
            {isAdding && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-medium mb-4">Add New Number</h3>
                    <div className="flex gap-4">
                        <input
                            type="text"
                            placeholder="+1..."
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                            value={selectedAgent}
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select Agent (Optional)</option>
                            {agents.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAddNumber}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Numbers List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Agent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {numbers.map((number) => (
                            <tr key={number.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                                        <span className="text-sm font-medium text-gray-900">{number.phone_number}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={number.agent_id || ''}
                                        onChange={(e) => handleAssignAgent(number.id, e.target.value)}
                                        className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer hover:text-blue-600"
                                    >
                                        <option value="">Unassigned</option>
                                        {agents.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${number.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {number.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {number.provider}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-red-600 hover:text-red-900 ml-4">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
