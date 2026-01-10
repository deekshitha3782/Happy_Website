import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Message, type InsertMessage } from "@shared/routes";

export function useMessages() {
  return useQuery({
    queryKey: [api.messages.list.path],
    queryFn: async () => {
      try {
        const res = await fetch(api.messages.list.path);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
          throw new Error(errorData.error || errorData.message || `Failed to fetch messages: ${res.status}`);
        }
        return api.messages.list.responses[200].parse(await res.json());
      } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }
    },
    retry: 1, // Retry once on failure
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: InsertMessage) => {
      try {
        const res = await fetch(api.messages.create.path, {
          method: api.messages.create.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
          const errorMessage = errorData.error || errorData.message || `Server error: ${res.status}`;
          console.error("API error:", errorMessage, res.status);
          throw new Error(errorMessage);
        }
        
        return api.messages.create.responses[201].parse(await res.json());
      } catch (error) {
        console.error("Fetch error:", error);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Network error: Failed to connect to server");
      }
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
