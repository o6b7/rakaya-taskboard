import React, { useState, useRef } from "react";
import { useDrag } from "react-dnd";
import type { Task, User } from "../../types";
import { useGetCommentsByTaskQuery } from "../../api/comments.api";
import { useGetAllUsersQuery, useGetUserByIdQuery } from "../../api/users.api";
import { useGetProjectByIdQuery } from "../../api/projects.api";
import { getLucideIcon } from "../../lib/getLucideIcon";
import { Button } from "../ui/Button";
import Avatar from "../Common/Avatar";
import { useTaskOperations } from "../../utils/taskHandlers";

const priorityConfig = {
  High: {
    bgColor: "bg-red-100 dark:bg-red-900",
    textColor: "text-red-700 dark:text-red-300",
    borderColor: "border-red-200 dark:border-red-800",
    dotColor: "bg-red-500",
  },
  Medium: {
    bgColor: "bg-orange-100 dark:bg-orange-900",
    textColor: "text-orange-700 dark:text-orange-300",
    borderColor: "border-orange-200 dark:border-orange-800",
    dotColor: "bg-orange-400",
  },
  Low: {
    bgColor: "bg-green-100 dark:bg-green-900",
    textColor: "text-green-700 dark:text-green-300",
    borderColor: "border-green-200 dark:border-green-800",
    dotColor: "bg-green-500",
  },
};

export default function TaskCard({ task }: { task: Task }) {
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showNotMemberMsg, setShowNotMemberMsg] = useState(false);
  const [shake, setShake] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const storedUser = localStorage.getItem("authUser");
  const authUser = storedUser ? JSON.parse(storedUser) : null;

  const { data: comments = [], refetch: refetchComments } = useGetCommentsByTaskQuery(task.id);
  const { data: allUsers } = useGetAllUsersQuery();
  const { data: project } = useGetProjectByIdQuery(task.projectId || "");
  const assigneeQueries = task.assigneeIds?.map((id) => useGetUserByIdQuery(id)) || [];
  const assignees = assigneeQueries.map(q => q.data).filter(Boolean) as User[];

  const isProjectOwner = authUser?.id === project?.ownerId || false;
  const isProjectMember = isProjectOwner || project?.members?.includes(authUser?.id) || false;
  const canDrag = isProjectMember;
  const canDeleteTask = authUser?.id === task.creatorId || isProjectOwner;

  const {
    handleUpdate,
    deleteTaskHandler,
    handleUpload,
    handleRemoveAttachment,
    handleAddComment,
    handleDeleteComment,
  } = useTaskOperations(task, authUser, isProjectOwner, isProjectMember);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TASK",
    item: { id: task.id },
    canDrag,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const priorityStyle = priorityConfig[task.priority];
  const showToggle = task.column === "needreview" || task.column === "done";
  const isDone = task.column === "done";
  const attachments = task.attachments || [];
  const hasAttachments = attachments.length > 0;
  const inlineImage = hasAttachments ? attachments[0] : null;
  const extraAttachments = hasAttachments ? attachments.slice(1) : [];

  const handleDragStart = () => {
    if (!canDrag) {
      setShowNotMemberMsg(true);
      setShake(true);
      setTimeout(() => {
        setShowNotMemberMsg(false);
        setShake(false);
      }, 600);
    }
  };

  const handleToggleStatus = async () => {
    const newColumn = task.column === "needreview" ? "done" : "needreview";
    await handleUpdate({ column: newColumn });
  };

  const handlePinTask = async () => {
    await handleUpdate({ pinned: !task.pinned });
    setShowMenu(false);
  };

  const handlePreview = (src: string) => setPreviewImage(src);
  const closePreview = () => setPreviewImage(null);

  const handleAddCommentWrapper = async () => {
    if (!commentText.trim()) return;
    await handleAddComment(commentText, setCommentText);
    refetchComments();
  };

  return (
    <div className="relative w-full">
      {/* Not Member Warning */}
      {showNotMemberMsg && (
        <div className="absolute top-20 right-5 z-50 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded shadow text-xs font-medium animate-fadeIn">
          You are not a member of this project
        </div>
      )}

      {/* Task Card */}
      <div
        className={`relative w-full rounded-md border
          bg-white dark:bg-dark-card
          border-gray-200 dark:border-dark-border
          hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
          ${isDragging ? "opacity-50 scale-95 rotate-2" : "opacity-100"}
          ${shake ? "shadow-2xl scale-105 animate-shake filter blur-sm" : ""}
          ${isDone ? "border-2 border-green-500 dark:border-green-500" : ""}`}
      >
        {/* Pinned Indicator */}
        {task.pinned && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-dark-card dark:bg-white rounded-full p-1 shadow-md">
              {getLucideIcon("Pin", { className: "w-[16px] h-[16px] text-white dark:text-black rotate-45" })}
            </div>
          </div>
        )}
        {/* Draggable Area */}
        <div ref={drag} onMouseDown={handleDragStart} className="p-4 cursor-grab active:cursor-grabbing">
          {/* Inline Attachment (First Image Always Visible) */}
          {inlineImage && (
            <div className="mb-3 -mx-4 px-4">
              <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-surface">
                <img
                  src={inlineImage}
                  alt="Inline attachment"
                  className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition"
                  onClick={() => handlePreview(inlineImage)}
                />
                {isProjectMember && (
                  <button
                    onClick={() => handleRemoveAttachment(inlineImage)}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                  >
                    {getLucideIcon("X", { className: "w-4 h-4" })}
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${priorityStyle.bgColor} ${priorityStyle.textColor} ${priorityStyle.borderColor} font-medium`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityStyle.dotColor}`} />
              {task.priority}
            </div>
            <div className="flex items-center gap-1">
              {showToggle && (
                <button
                  onClick={handleToggleStatus}
                  className={`p-1.5 rounded-full transition-colors ${
                    isDone
                      ? "text-green-600 hover:bg-green-50 dark:hover:bg-green-800"
                      : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={isDone ? "Mark as Needs Review" : "Mark as Done"}
                >
                  {getLucideIcon("CheckCircle2", { className: "w-[16px] h-[16px]" })}
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {getLucideIcon("MoreVertical", { className: "w-[15px] h-[15px]" })}
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-md shadow-md z-20 animate-fadeIn">
                    <button
                      onClick={handlePinTask}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      {task.pinned ? "Unpin Task" : "Pin Task"}
                    </button>
                    {canDeleteTask && (
                      <button
                        onClick={deleteTaskHandler}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 transition"
                      >
                        Delete Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-dark-text text-sm mb-2 line-clamp-2">
              {task.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-dark-muted line-clamp-2">
              {task.description}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Due: {new Date(task.deadline).toLocaleDateString("en-GB")}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {assignees.slice(0, 5).map((user) => (
                <Avatar key={user.id} name={user.name} avatar={user.avatar} size={25} />
              ))}
              {assignees.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-dark-surface border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600 dark:text-dark-muted font-medium">
                    +{assignees.length - 5}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-gray-400 dark:text-dark-muted">
              <button
                onClick={() => setIsAttachmentOpen((p) => !p)}
                className="flex items-center gap-1 text-xs hover:text-blue-500"
                title={`View ${extraAttachments.length} more attachment${extraAttachments.length !== 1 ? 's' : ''}`}
              >
                {getLucideIcon("Paperclip", { className: "w-[15px] h-[15px]" })}
                <span>{attachments.length}</span>
              </button>
              <button
                onClick={() => setIsCommentOpen((p) => !p)}
                className="flex items-center gap-1 text-xs hover:text-blue-500"
              >
                {getLucideIcon("MessageSquare", { className: "w-[15px] h-[15px]" })}
                <span>{comments.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Extra Attachments Dropdown */}
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out border-t border-gray-200 dark:border-dark-border ${
            isAttachmentOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-gray-50 dark:bg-dark-surface p-3 space-y-3">
            {extraAttachments.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {extraAttachments.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative w-28 h-28 border border-gray-300 dark:border-dark-border rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                  >
                    <img
                      src={src}
                      alt={`extra-attachment-${idx}`}
                      className="object-cover w-full h-full"
                      onClick={() => handlePreview(src)}
                    />
                    {isProjectMember && (
                      <button
                        onClick={() => handleRemoveAttachment(src)}
                        className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-600 transition"
                      >
                        {getLucideIcon("X", { className: "w-[16px] h-[16px]" })}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-dark-muted italic">
                No additional attachments.
              </p>
            )}
            {isProjectMember && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attachments.length >= 3}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${
                    attachments.length >= 3
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {getLucideIcon("Upload", { className: "w-[16px] h-[16px]" })}
                  <span>Upload</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${
            isCommentOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-gray-50 dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border p-3 space-y-2">
            {comments.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-dark-muted italic">No comments yet.</p>
            ) : (
              comments.map((c) => {
                const user = allUsers?.find((u) => u.id === c.userId);
                const canDelete = c.userId === authUser?.id || isProjectOwner;
                return (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 p-2 bg-white dark:bg-dark-card border rounded-md text-xs text-gray-700 dark:text-dark-text"
                  >
                    <Avatar name={user?.name || "Unknown"} avatar={user?.avatar} size={25} />
                    <div className="flex-1">
                      <p className="text-[11px] text-gray-500 dark:text-dark-muted">
                        {user?.name || "Unknown"}
                      </p>
                      <p className="text-xs text-gray-700 dark:text-dark-text">{c.content}</p>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(c.id, c.userId)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })
            )}
            <div className="flex items-center gap-2 mt-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddCommentWrapper()}
                placeholder="Add a comment..."
                className="flex-1 text-xs border rounded-md p-2 outline-none focus:ring-1 focus:ring-blue-400 dark:bg-dark-card dark:text-dark-text dark:border-dark-border"
              />
              <Button onClick={handleAddCommentWrapper} className="p-2">
                {getLucideIcon("Send", { className: "w-[14px] h-[14px]" })}
              </Button>
            </div>
          </div>
        </div>

        {/* Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={closePreview}
          >
            <div
              className="relative max-w-[95vw] max-h-[90vh] animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={previewImage} alt="Preview" className="object-contain rounded-lg shadow-xl" />
              <button
                onClick={closePreview}
                className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition"
              >
                {getLucideIcon("X", { className: "w-[20px] h-[20px]" })}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}