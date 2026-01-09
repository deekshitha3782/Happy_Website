import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Message, type InsertMessage } from "@shared/routes";

export function useMessages() {
  return useQuery({
    queryKey: [api.messages.list.path],
    queryFn: async () => {
      const res = await fetch(api.messages.list.path);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: InsertMessage) => {
      const res = await fetch(api.messages.create.path, {
        method: api.messages.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
      
      return api.messages.create.responses[201].parse(await res.json());
    },
    onSuccess: (newAssistantMessage, variables) => {
      // Optimistically update or invalidate. Here we invalidate to refetch full history
      // Ideally, we could append both the user's message (variables) and the response (newAssistantMessage) manually
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path] });
    },
  });
}

export function useClearChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.messages.clear.path, {
        method: api.messages.clear.method,
      });
      if (!res.ok) throw new Error("Failed to clear chat");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.messages.list.path], []);
    },
  });
}
