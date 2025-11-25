/**
 * React hooks for agent management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AgentService } from '../services/agentService';
import { AgentCreateInput, AgentUpdateInput } from '../types/agent';

/**
 * Hook to fetch all agents
 */
export function useAgents(organizationId: string) {
  return useQuery({
    queryKey: ['agents', organizationId],
    queryFn: () => AgentService.listAgents(organizationId),
    enabled: !!organizationId,
  });
}

/**
 * Hook to fetch single agent
 */
export function useAgent(agentId?: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => AgentService.getAgent(agentId!),
    enabled: !!agentId,
  });
}

/**
 * Hook to create agent
 */
export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AgentCreateInput) => AgentService.createAgent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

/**
 * Hook to update agent
 */
export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AgentUpdateInput }) =>
      AgentService.updateAgent(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', variables.id] });
    },
  });
}

/**
 * Hook to delete agent
 */
export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => AgentService.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

/**
 * Hook to publish agent
 */
export function usePublishAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => AgentService.publishAgent(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    },
  });
}
