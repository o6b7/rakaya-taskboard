const PREFIXES: Record<string, string> = {
  users: "U",
  projects: "P",
  tasks: "T",
  comments: "C",
};

export function generateUniqueId(idType: keyof typeof PREFIXES): string {
  const prefix = PREFIXES[idType];
  if (!prefix) throw new Error(`Invalid ID type: ${idType}`);
  
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
}