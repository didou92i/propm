import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  PenSquare,
  MessageSquare,
  Trash2,
  Edit2,
  Settings,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { GPTConversation } from "@/types/gpt-clone";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface GPTSidebarProps {
  isOpen: boolean;
  conversations: GPTConversation[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  isLoading: boolean;
}

export function GPTSidebar({
  isOpen,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onUpdateTitle,
  isLoading,
}: GPTSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  const handleEditStart = (conv: GPTConversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleEditSave = (id: string) => {
    if (editTitle.trim()) {
      onUpdateTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDeleteClick = (id: string) => {
    setConversationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (conversationToDelete) {
      onDeleteConversation(conversationToDelete);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="w-64 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-800">
          <Button
            onClick={onNewChat}
            className="w-full justify-start gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
          >
            <PenSquare className="w-4 h-4" />
            Nouveau chat
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1 px-2">
          <div className="py-2 space-y-1">
            {isLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Chargement...
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Aucune conversation
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={cn(
                    "group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                    selectedConversationId === conv.id
                      ? "bg-gray-200 dark:bg-gray-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  )}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <MessageSquare className="w-4 h-4 flex-shrink-0 text-gray-600 dark:text-gray-400" />

                  {editingId === conv.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => handleEditSave(conv.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditSave(conv.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-6 text-sm flex-1"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm truncate flex-1 text-gray-900 dark:text-gray-100">
                      {conv.title}
                    </span>
                  )}

                  <div className="hidden group-hover:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStart(conv);
                      }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(conv.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-gray-700 dark:text-gray-300"
            onClick={() => window.location.href = "/gpt-clone/settings"}
          >
            <Settings className="w-4 h-4" />
            Paramètres & Agents
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La conversation et tous ses messages seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
