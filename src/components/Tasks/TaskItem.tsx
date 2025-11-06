import React, { useRef, useState, useEffect, memo } from "react";
import { useGetCommentsByTaskQuery } from "../../api/comments.api";
import { useGetAllUsersQuery } from "../../api/users.api";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { Button } from "../ui/Button";
import Avatar from "../Common/Avatar";
import { useTaskOperations } from "../../utils/taskHandlers";
import type { Task, User } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

type ViewMode = "list" | "table";

interface TaskItemProps {
  task: Task;
  authUser: User | null;
  isProjectOwner: boolean;
  isProjectMember: boolean;
  viewMode: ViewMode;
  isOpen: boolean;
  isAttachmentOpen: boolean;
  onToggleComments: () => void;
  onToggleAttachments: () => void;
  onPreviewImage: (src: string) => void;
  getUserById: (id: string) => User | undefined;
}

const priorityConfig = {
  High: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300", dot: "bg-red-500", label: "High", border: "border-red-200 dark:border-red-800" },
  Medium: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500", label: "Medium", border: "border-amber-200 dark:border-amber-800" },
  Low: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", dot: "bg-green-500", label: "Low", border: "border-green-200 dark:border-green-800" },
} as const;

const statusConfig = {
  backlog: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", label: "Backlog", icon: "Circle", border: "border-gray-200 dark:border-gray-700" },
  todo: { bg: "bg-blue-100 dark:bg-blue-900", text: "text-blue-700 dark:text-blue-300", label: "To Do", icon: "Circle", border: "border-blue-200 dark:border-blue-800" },
  inprogress: { bg: "bg-amber-100 dark:bg-amber-900", text: "text-amber-700 dark:text-amber-300", label: "In Progress", icon: "Loader2", border: "border-amber-200 dark:border-amber-800" },
  needreview: { bg: "bg-purple-100 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-300", label: "Need Review", icon: "Eye", border: "border-purple-200 dark:border-purple-800" },
  done: { bg: "bg-emerald-100 dark:bg-emerald-900", text: "text-emerald-700 dark:text-emerald-300", label: "Done", icon: "CheckCircle", border: "border-emerald-200 dark:border-emerald-800" },
} as const;

const statusOptions = Object.entries(statusConfig).map(([value, { label }]) => ({ value, label }));

// === MEMOIZED COMMENT ITEM ===
const CommentItem = memo(({ comment, authUser, isProjectOwner, getUserById, handleDeleteComment }: any) => {
  const commenter = getUserById(comment.userId);
  const canDelete = comment.userId === authUser?.id || isProjectOwner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-3 p-3 bg-card border border-border rounded-xl text-sm shadow-sm hover:shadow transition-shadow"
    >
      <Avatar name={commenter?.name} avatar={commenter?.avatar} size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-sm">{commenter?.name || "User"}</p>
          <span className="text-xs text-muted-foreground">
            {format(new Date(comment.createdAt), "MMM dd, h:mm a5")}
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
      {canDelete && (
        <button
          onClick={() => handleDeleteComment(comment.id, comment.userId)}
          className="text-red-600 hover:text-red-700 p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {getLucideIcon("Trash2", { size: 14 })}
        </button>
      )}
    </motion.div>
  );
});

// === SEPARATE COMMENT INPUT COMPONENT (isolated re-renders) ===
const CommentInput = ({ onAddComment }: { onAddComment: (text: string) => Promise<void> }) => {
  const [commentText, setCommentText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize with minimal re-render impact
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(textarea);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    await onAddComment(trimmed);
    setCommentText("");
    textareaRef.current && (textareaRef.current.style.height = "auto");
  };

  return (
    <div className="flex gap-2 pt-3">
      <textarea
        ref={textareaRef}
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Write a comment... (Shift+Enter for new line)"
        className="flex-1 min-h-10 max-h-32 text-sm resize-none border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all overflow-hidden field-sizing-content"
        style={{ fieldSizing: "content" }}
        rows={1}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!commentText.trim()}
        className="self-end gap-2 hover:scale-105 transition-all"
      >
        {getLucideIcon("Send", { size: 16 })}
      </Button>
    </div>
  );
};

export default function TaskItem({
  task,
  authUser,
  isProjectOwner,
  isProjectMember,
  viewMode,
  isOpen,
  isAttachmentOpen,
  onToggleComments,
  onToggleAttachments,
  onPreviewImage,
  getUserById,
}: TaskItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: comments = [], isLoading: loadingComments } = useGetCommentsByTaskQuery(task.id);
  const { data: allUsers } = useGetAllUsersQuery();
  const {
    handleUpdate,
    deleteTaskHandler,
    handleUpload,
    handleRemoveAttachment,
    handleAddComment,
    handleDeleteComment,
  } = useTaskOperations(task, authUser, isProjectOwner, isProjectMember);

  const attachments = task.attachments || [];
  const creator = getUserById(task.creatorId);
  const priority = priorityConfig[task.priority] || priorityConfig.Medium;
  const status = statusConfig[task.column] || statusConfig.backlog;

  const handleAddCommentWrapper = async (text: string) => {
    await handleAddComment(text, () => {});
    // No need to refetch — RTK Query should auto-refetch on mutation
  };

  const PriorityBadge = () => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${priority.bg} ${priority.text} ${priority.border} shadow-xs`}>
      <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
      {priority.label}
    </span>
  );

  const ActionButtons = () => (
    <div className="flex items-center gap-1.5">
      {(authUser?.id === task.creatorId || isProjectOwner) && (
        <button
          onClick={deleteTaskHandler}
          className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110"
          title="Delete task"
        >
          {getLucideIcon("Trash2", { size: 16 })}
        </button>
      )}
      <button
        onClick={() => handleUpdate({ pinned: !task.pinned })}
        className={`p-2 rounded-lg transition-all hover:scale-110 ${
          task.pinned ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "text-muted-foreground hover:bg-muted"
        }`}
        title={task.pinned ? "Unpin" : "Pin"}
      >
        {getLucideIcon(task.pinned ? "Pin" : "PinOff", { size: 16 })}
      </button>
      <button
        onClick={onToggleComments}
        className={`relative p-2 rounded-lg transition-all hover:scale-110 ${
          isOpen ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-muted-foreground hover:bg-muted"
        }`}
        title={`${comments.length} comments`}
      >
        {getLucideIcon("MessageSquare", { size: 16 })}
        {comments.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
            {comments.length}
          </span>
        )}
      </button>
      <button
        onClick={onToggleAttachments}
        className={`relative p-2 rounded-lg transition-all hover:scale-110 ${
          isAttachmentOpen ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-muted-foreground hover:bg-muted"
        }`}
        title={`${attachments.length} attachments`}
      >
        {getLucideIcon("Paperclip", { size: 16 })}
        {attachments.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
            {attachments.length}
          </span>
        )}
      </button>
    </div>
  );

  const AttachmentsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {getLucideIcon("Paperclip", { className: "h-4 w-4 text-muted-foreground" })}
        <h4 className="text-sm font-semibold">Attachments ({attachments.length})</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {attachments.length > 0 ? (
          attachments.map((src, i) => (
            <div
              key={i}
              className="group relative aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md bg-muted/50"
              onClick={() => onPreviewImage(src)}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              {isProjectMember && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAttachment(src);
                  }}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-black"
                >
                  {getLucideIcon("X", { size: 14 })}
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="col-span-full text-sm text-muted-foreground italic text-center py-4">No attachments yet.</p>
        )}
      </div>
      {isProjectMember && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachments.length >= 3}
            className="gap-2 text-sm hover:scale-105 transition-all"
          >
            {getLucideIcon("Upload", { size: 16 })} Upload
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} multiple />
          {attachments.length >= 3 && (
            <span className="text-xs text-muted-foreground">Max 3 files</span>
          )}
        </div>
      )}
    </div>
  );

  const CommentsSection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {getLucideIcon("MessageSquare", { className: "h-4 w-4 text-muted-foreground" })}
        <h4 className="text-sm font-semibold">Comments ({comments.length})</h4>
      </div>

      {loadingComments ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
          {getLucideIcon("Loader2", { className: "h-4 w-4 animate-spin" })}
          Loading comments...
        </div>
      ) : comments.length > 0 ? (
        <div className="max-h-64 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
          <AnimatePresence>
            {comments.map((c: any) => (
              <CommentItem
                key={c.id}
                comment={c}
                authUser={authUser}
                isProjectOwner={isProjectOwner}
                getUserById={getUserById}
                handleDeleteComment={handleDeleteComment}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic py-3 text-center">No comments yet. Be the first!</p>
      )}

      {/* Isolated Input */}
      {isProjectMember && <CommentInput onAddComment={handleAddCommentWrapper} />}
    </div>
  );

  if (viewMode === "list") {
    return (
      <motion.article
        layout
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-2">
                {task.pinned && (
                  <span className="text-amber-500 animate-pulse" title="Pinned">
                    {getLucideIcon("Pin", { className: "h-4 w-4 rotate-45" })}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {task.title}
                </h3>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <PriorityBadge />
                <button
                  onClick={() => {
                    const options = Object.keys(statusConfig);
                    const next = options[(options.indexOf(task.column) + 1) % options.length];
                    handleUpdate({ column: next });
                  }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all hover:scale-105 shadow-xs ${status.bg} ${status.text} ${status.border}`}
                >
                  {getLucideIcon(status.icon, { size: 14 })}
                  {status.label}
                </button>
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1.5">
                    {getLucideIcon("Calendar", { size: 14 })}
                    Due {format(new Date(task.deadline), "MMM dd")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {getLucideIcon("Clock", { size: 14 })}
                    {format(new Date(task.createdAt), "MMM dd")}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden lg:flex transition-opacity duration-300">
              <ActionButtons />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 pt-4 border-t border-border">
            <Avatar name={creator?.name} avatar={creator?.avatar} size={28} />
            <span className="text-xs text-muted-foreground">
              Created by <span className="font-semibold text-foreground">{creator?.name || "Unknown"}</span>
            </span>
          </div>
        </div>
        <div className="lg:hidden border-t border-border bg-muted/30 backdrop-blur-sm">
          <div className="flex justify-center p-3">
            <ActionButtons />
          </div>
        </div>
        <AnimatePresence>
          {isAttachmentOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-muted/20 px-6 py-5"
            >
              <AttachmentsSection />
            </motion.div>
          )}
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-muted/20 px-6 py-5"
            >
              <CommentsSection />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    );
  }

  // TABLE VIEW
  return (
    <>
      <tr className="group hover:bg-muted/50 transition-colors duration-200">
        <td className="px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 flex items-center justify-center mt-0.5">
              {task.pinned ? getLucideIcon("Pin", { className: "w-4 h-4 rotate-45 text-amber-500" }) : <div className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                {task.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Avatar name={creator?.name} avatar={creator?.avatar} size={20} />
                <span className="text-xs text-muted-foreground">by {creator?.name}</span>
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-center"><PriorityBadge /></td>
        <td className="px-6 py-4 text-center">
          <select
            value={task.column}
            onChange={(e) => handleUpdate({ column: e.target.value })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 outline-none cursor-pointer transition-all hover:scale-105 ${status.bg} ${status.text}`}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </td>
        <td className="px-6 py-4 text-center text-sm">
          {task.deadline ? format(new Date(task.deadline), "MMM dd, yyyy") : "-"}
        </td>
        <td className="px-6 py-4 text-center text-sm text-muted-foreground">
          {format(new Date(task.createdAt), "MMM dd, yyyy")}
        </td>
        <td className="px-6 py-4">
          <div className="flex justify-center"><ActionButtons /></div>
        </td>
      </tr>
      <AnimatePresence>
        {isAttachmentOpen && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <td colSpan={6} className="bg-muted/20 px-6 py-5"><AttachmentsSection /></td>
          </motion.tr>
        )}
        {isOpen && (
          <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <td colSpan={6} className="bg-muted/20 px-6 py-5"><CommentsSection /></td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}