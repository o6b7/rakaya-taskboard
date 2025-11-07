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

// MEMOIZED COMMENT ITEM
const CommentItem = memo(({ comment, authUser, isProjectOwner, getUserById, handleDeleteComment }: any) => {
  const commenter = getUserById(comment.userId);
  const canDelete = comment.userId === authUser?.id || isProjectOwner;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="flex gap-3 p-3 bg-card border border-border rounded-xl text-sm shadow-sm hover:shadow transition-shadow"
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 500 }}
      >
        <Avatar name={commenter?.name} avatar={commenter?.avatar} size={36} />
      </motion.div>
      <div className="flex-1 min-w-0 dark:text-white">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-sm">{commenter?.name || "User"}</p>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-muted-foreground"
          >
            {format(new Date(comment.createdAt), "MMM dd, h:mm a")}
          </motion.span>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-foreground leading-relaxed whitespace-pre-wrap"
        >
          {comment.content}
        </motion.p>
      </div>
      {canDelete && (
        <motion.button
          whileHover={{ scale: 1.2, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleDeleteComment(comment.id, comment.userId)}
          className="text-red-600 hover:text-red-700 p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          {getLucideIcon("Trash2", { size: 14 })}
        </motion.button>
      )}
    </motion.div>
  );
});

// SEPARATE COMMENT INPUT COMPONENT
const CommentInput = ({ onAddComment }: { onAddComment: (text: string) => Promise<void> }) => {
  const [commentText, setCommentText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2 pt-3"
    >
      <motion.textarea
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
        className="flex-1 min-h-10 max-h-32 text-sm resize-none dark:bg-dark-border border border-input rounded-xl px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all overflow-hidden field-sizing-content"
        style={{ fieldSizing: "content" }}
        rows={1}
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300 }}
      />
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!commentText.trim()}
          className="self-end gap-2 hover:scale-105 transition-all"
        >
          {getLucideIcon("Send", { size: 16 })}
        </Button>
      </motion.div>
    </motion.div>
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
  };

  const PriorityBadge = () => (
    <motion.span
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${priority.bg} ${priority.text} ${priority.border} shadow-xs`}
    >
      <span className={`w-2 h-2 rounded-full ${priority.dot}`} />
      {priority.label}
    </motion.span>
  );

  const ActionButtons = () => (
    <div className="flex items-center gap-1.5 dark:text-white">
      {(authUser?.id === task.creatorId || isProjectOwner) && (
        <motion.button
          whileHover={{ scale: 1.2, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={deleteTaskHandler}
          className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          title="Delete task"
        >
          {getLucideIcon("Trash2", { size: 16 })}
        </motion.button>
      )}
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => handleUpdate({ pinned: !task.pinned })}
        className={`p-2 rounded-lg transition-all ${
          task.pinned ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "text-muted-foreground hover:bg-muted"
        }`}
        title={task.pinned ? "Unpin" : "Pin"}
      >
        {getLucideIcon(task.pinned ? "Pin" : "PinOff", { size: 16 })}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleComments}
        className={`relative p-2 rounded-lg transition-all ${
          isOpen ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20" : "text-muted-foreground hover:bg-muted"
        }`}
        title={`${comments.length} comments`}
      >
        {getLucideIcon("MessageSquare", { size: 16 })}
        <AnimatePresence>
          {comments.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm"
            >
              {comments.length}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggleAttachments}
        className={`relative p-2 rounded-lg transition-all ${
          isAttachmentOpen ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-muted-foreground hover:bg-muted"
        }`}
        title={`${attachments.length} attachments`}
      >
        {getLucideIcon("Paperclip", { size: 16 })}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm"
            >
              {attachments.length}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );

  const AttachmentsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 dark:text-white"
    >
      <motion.div
        initial={{ x: -10 }}
        animate={{ x: 0 }}
        className="flex items-center gap-2"
      >
        {getLucideIcon("Paperclip", { className: "h-4 w-4 text-muted-foreground" })}
        <h4 className="text-sm font-semibold">Attachments ({attachments.length})</h4>
      </motion.div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <AnimatePresence>
          {attachments.length > 0 ? (
            attachments.map((src, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="group relative aspect-square rounded-xl border-2 border-dashed border-muted-foreground/20 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md bg-muted/50"
                onClick={() => onPreviewImage(src)}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
                {isProjectMember && (
                  <motion.button
                    whileHover={{ scale: 1.2, rotate: 90 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAttachment(src);
                    }}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-black"
                  >
                    {getLucideIcon("X", { size: 14 })}
                  </motion.button>
                )}
              </motion.div>
            ))
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full text-sm text-muted-foreground italic text-center py-4"
            >
              No attachments yet.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      {isProjectMember && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 pt-2"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= 3}
              className="gap-2 text-sm hover:scale-105 transition-all"
            >
              {getLucideIcon("Upload", { size: 16 })} Upload
            </Button>
          </motion.div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} multiple />
          {attachments.length >= 3 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground"
            >
              Max 3 files
            </motion.span>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  const CommentsSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 dark:text-white"
    >
      <motion.div
        initial={{ x: -10 }}
        animate={{ x: 0 }}
        className="flex items-center gap-2"
      >
        {getLucideIcon("MessageSquare", { className: "h-4 w-4 text-muted-foreground" })}
        <h4 className="text-sm font-semibold">Comments ({comments.length})</h4>
      </motion.div>

      {loadingComments ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-muted-foreground py-3"
        >
          {getLucideIcon("Loader2", { className: "h-4 w-4 animate-spin" })}
          Loading comments...
        </motion.div>
      ) : comments.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-h-64 space-y-3 overflow-y-auto pr-1 custom-scrollbar"
        >
          <AnimatePresence mode="popLayout">
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
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-sm text-muted-foreground italic py-3 text-center"
        >
          No comments yet. Be the first!
        </motion.p>
      )}

      {isProjectMember && <CommentInput onAddComment={handleAddCommentWrapper} />}
    </motion.div>
  );

  if (viewMode === "list") {
    return (
      <motion.article
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="p-6 pb-4 dark:text-white"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-4">
              <motion.div
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                className="flex items-center gap-2"
              >
                {task.pinned && (
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-amber-500"
                    title="Pinned"
                  >
                    {getLucideIcon("Pin", { className: "h-4 w-4 rotate-45" })}
                  </motion.span>
                )}
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {task.title}
                </h3>
              </motion.div>
              {task.description && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-sm text-muted-foreground leading-relaxed line-clamp-2"
                >
                  {task.description}
                </motion.p>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center gap-3 text-sm"
              >
                <PriorityBadge />
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const options = Object.keys(statusConfig);
                    const next = options[(options.indexOf(task.column) + 1) % options.length];
                    handleUpdate({ column: next });
                  }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all hover:scale-105 shadow-xs ${status.bg} ${status.text} ${status.border}`}
                >
                  {getLucideIcon(status.icon, { size: 14 })}
                  {status.label}
                </motion.button>
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center gap-1.5"
                  >
                    {getLucideIcon("Calendar", { size: 14 })}
                    Due {format(new Date(task.deadline), "MMM dd")}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-1.5"
                  >
                    {getLucideIcon("Clock", { size: 14 })}
                    {format(new Date(task.createdAt), "MMM dd")}
                  </motion.span>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="hidden lg:flex transition-opacity duration-300"
            >
              <ActionButtons />
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 flex items-center gap-3 pt-4 border-t border-border"
          >
            <Avatar name={creator?.name} avatar={creator?.avatar} size={28} />
            <span className="text-xs text-muted-foreground">
              Created by <span className="font-semibold text-foreground">{creator?.name || "Unknown"}</span>
            </span>
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="lg:hidden border-t border-border bg-muted/30 backdrop-blur-sm"
        >
          <div className="flex justify-center p-3">
            <ActionButtons />
          </div>
        </motion.div>
        <AnimatePresence>
          {isAttachmentOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
      <motion.tr
        layout
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        className="group hover:bg-muted/50 transition-colors duration-200 dark:text-white"
      >
        <td className="px-6 py-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-start gap-3"
          >
            <div className="w-6 h-6 flex items-center justify-center mt-0.5">
              {task.pinned ? (
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {getLucideIcon("Pin", { className: "w-4 h-4 rotate-45 text-amber-500" })}
                </motion.div>
              ) : (
                <div className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                {task.title}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-2 mt-2"
              >
                <Avatar name={creator?.name} avatar={creator?.avatar} size={20} />
                <span className="text-xs text-muted-foreground">by {creator?.name}</span>
              </motion.div>
            </div>
          </motion.div>
        </td>
        <td className="px-6 py-4 text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <PriorityBadge />
          </motion.div>
        </td>
        <td className="px-6 py-4 text-center">
          <motion.select
            whileHover={{ scale: 1.05 }}
            value={task.column}
            onChange={(e) => handleUpdate({ column: e.target.value })}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 outline-none cursor-pointer transition-all hover:scale-105 ${status.bg} ${status.text}`}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </motion.select>
        </td>
        <td className="px-6 py-4 text-center text-sm">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            {task.deadline ? format(new Date(task.deadline), "MMM dd, yyyy") : "-"}
          </motion.span>
        </td>
        <td className="px-6 py-4 text-center text-sm text-muted-foreground">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {format(new Date(task.createdAt), "MMM dd, yyyy")}
          </motion.span>
        </td>
        <td className="px-6 py-4">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="flex justify-center"
          >
            <ActionButtons />
          </motion.div>
        </td>
      </motion.tr>
      <AnimatePresence>
        {isAttachmentOpen && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <td colSpan={6} className="bg-muted/20 px-6 py-5">
              <AttachmentsSection />
            </td>
          </motion.tr>
        )}
        {isOpen && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <td colSpan={6} className="bg-muted/20 px-6 py-5">
              <CommentsSection />
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}