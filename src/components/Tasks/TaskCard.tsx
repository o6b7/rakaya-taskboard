"use client";

import React, { useState, useRef } from "react";
import { useDrag } from "react-dnd";
import {
  Paperclip,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  Upload,
  X,
  Send,
} from "lucide-react";
import type { Task } from "../../types";
import {
  useGetCommentsByTaskQuery,
  useCreateCommentMutation,
} from "../../api/comments.api";
import { useUpdateTaskMutation } from "../../api/tasks.api";
import {
  confirmRemoveAttachment,
  showWarning,
  showSuccess,
} from "../../utils/sweetAlerts";

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
  const [updateTask] = useUpdateTaskMutation();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data: comments = [], refetch } = useGetCommentsByTaskQuery(task.id);
  const [createComment] = useCreateCommentMutation();

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TASK",
    item: { id: task.id },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const priorityStyle = priorityConfig[task.priority];
  const assignees = task.assigneeIds?.map((id) => `User ${id}`) || [
    "Alex",
    "Sara",
    "John",
  ];

  const showToggle = task.column === "needreview" || task.column === "done";
  const isDone = task.column === "done";
  const attachments = task.attachments || [];

  // ✅ Toggle Done / Needs Review
  const handleToggleStatus = async () => {
    const newColumn = task.column === "needreview" ? "done" : "needreview";
    await updateTask({ id: task.id, updates: { column: newColumn } });
  };

  // ✅ Add Comment
  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    await createComment({
      taskId: task.id,
      userId: "1",
      content: commentText,
      createdAt: new Date().toISOString(),
    });
    setCommentText("");
    refetch();
  };

  // ✅ Convert file → Base64 string
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  // ✅ Upload file (Base64 simulation)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (attachments.length >= 3) {
      showWarning("Maximum 3 pictures allowed");
      return;
    }

    const base64 = await fileToBase64(file);
    const updated = [...attachments, base64];
    await updateTask({ id: task.id, updates: { attachments: updated } });
  };

  // ✅ Remove Attachment with confirmation
  const handleRemoveAttachment = async (name: string) => {
    const confirmed = await confirmRemoveAttachment();
    if (!confirmed) return;

    const updated = attachments.filter((a) => a !== name);
    await updateTask({ id: task.id, updates: { attachments: updated } });
    showSuccess("Removed!");
  };

  const handlePreview = (src: string) => setPreviewImage(src);
  const closePreview = () => setPreviewImage(null);

  return (
    <div
      className={`w-full rounded-md border shadow-sm
        bg-white dark:bg-dark-card
        border-gray-200 dark:border-dark-border
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        ${isDragging ? "opacity-50 rotate-2 scale-95" : "opacity-100"}
        ${isDone ? "border-2 border-green-500 dark:border-green-500" : ""}`}
    >
      {/* Draggable area */}
      <div ref={drag} className="p-4 cursor-grab active:cursor-grabbing">
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
                <CheckCircle2 size={16} />
              </button>
            )}
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical size={16} />
            </button>
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((a, i) => (
              <img
                key={a}
                src={`https://ui-avatars.com/api/?name=${a}&background=random&size=32`}
                className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                alt={a}
                style={{ zIndex: 3 - i }}
              />
            ))}
            {assignees.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-dark-surface border-2 border-white flex items-center justify-center">
                <span className="text-xs text-gray-600 dark:text-dark-muted font-medium">
                  +{assignees.length - 3}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-gray-400 dark:text-dark-muted">
            <button
              onClick={() => setIsAttachmentOpen((p) => !p)}
              className="flex items-center gap-1 text-xs hover:text-blue-500"
            >
              <Paperclip size={14} />
              <span>{attachments.length}</span>
            </button>
            <button
              onClick={() => setIsCommentOpen((p) => !p)}
              className="flex items-center gap-1 text-xs hover:text-blue-500"
            >
              <MessageSquare size={14} />
              <span>{comments.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Attachments */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${
          isAttachmentOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-gray-50 dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border p-3 space-y-3">
          <div className="flex flex-wrap gap-3">
            {attachments.length > 0 ? (
              attachments.map((a, idx) => (
                <div
                  key={idx}
                  className="relative w-28 h-28 border border-gray-300 dark:border-dark-border rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                >
                  <img
                    src={a}
                    alt={`attachment-${idx}`}
                    className="object-cover w-full h-full"
                    onClick={() => handlePreview(a)}
                  />
                  <button
                    onClick={() => handleRemoveAttachment(a)}
                    className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-red-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 dark:text-dark-muted italic">
                No attachments yet.
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= 3}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${
                attachments.length >= 3
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Upload size={16} />
              <span>Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {/* Comments */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${
          isCommentOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-gray-50 dark:bg-dark-surface border-t border-gray-200 dark:border-dark-border p-3 space-y-2">
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-dark-muted text-center">
              No comments yet.
            </p>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              className="p-2 bg-white dark:bg-dark-card border rounded-md text-xs text-gray-700 dark:text-dark-text"
            >
              {c.content}
            </div>
          ))}
          <div className="flex items-center gap-2 mt-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-xs border rounded-md p-2 outline-none focus:ring-1 focus:ring-blue-400 dark:bg-dark-card dark:text-dark-text dark:border-dark-border"
            />
            <button
              onClick={handleAddComment}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Send size={14} />
            </button>
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
            <img
              src={previewImage}
              alt="Preview"
              className="object-contain rounded-lg shadow-xl"
            />
            <button
              onClick={closePreview}
              className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
