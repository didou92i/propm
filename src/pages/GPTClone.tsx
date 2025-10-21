import { useState } from "react";
import { GPTSidebar } from "@/components/gpt-clone/GPTSidebar";
import { GPTChatArea } from "@/components/gpt-clone/GPTChatArea";
import { GPTHeader } from "@/components/gpt-clone/GPTHeader";
import { useGPTConversations } from "@/hooks/gpt-clone/useGPTConversations";
import { useGPTChat } from "@/hooks/gpt-clone/useGPTChat";

export default function GPTClone() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("gpt-4");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    conversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    isLoading: conversationsLoading,
  } = useGPTConversations();

  const {
    messages,
    isStreaming,
    sendMessage,
    clearMessages,
  } = useGPTChat(selectedConversationId, selectedAgentId);

  const handleNewChat = async () => {
    const newConv = await createConversation(selectedAgentId);
    if (newConv) {
      setSelectedConversationId(newConv.id);
      clearMessages();
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <GPTSidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={deleteConversation}
        onUpdateTitle={updateConversationTitle}
        isLoading={conversationsLoading}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <GPTHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedAgentId={selectedAgentId}
          onAgentChange={setSelectedAgentId}
        />

        <GPTChatArea
          messages={messages}
          isStreaming={isStreaming}
          onSendMessage={sendMessage}
          selectedAgentId={selectedAgentId}
        />
      </div>
    </div>
  );
}
