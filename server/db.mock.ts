import { v4 as uuidv4 } from 'uuid';

// In-memory storage for testing
let users: any[] = [];
let pages: any[] = [];
let blocks: any[] = [];
let trash: any[] = [];

export async function getDb() {
  return true; // Just to satisfy the check
}

export async function upsertUser(user: any) {
  const existing = users.find(u => u.openId === user.openId);
  if (existing) {
    Object.assign(existing, user);
  } else {
    users.push({ ...user, id: users.length + 1 });
  }
}

export async function getUserByOpenId(openId: string) {
  return users.find(u => u.openId === openId);
}

export async function createPage(userId: number, title: string = "Untitled", parentPageId?: string) {
  const pageId = uuidv4();
  pages.push({
    id: pageId,
    userId,
    title,
    parentPageId: parentPageId || null,
    isArchived: false,
    updatedAt: new Date(),
    createdAt: new Date(),
    icon: null
  });
  return pageId;
}

export async function getPagesByUserId(userId: number) {
  return pages
    .filter(p => p.userId === userId && !p.isArchived)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getPageById(pageId: string, userId: number) {
  const page = pages.find(p => p.id === pageId && p.userId === userId);
  return page || null;
}

export async function updatePage(pageId: string, userId: number, data: any) {
  const page = pages.find(p => p.id === pageId && p.userId === userId);
  if (page) {
    // Ensure we create a NEW Date object to avoid reference issues
    Object.assign(page, { ...data, updatedAt: new Date() });
  }
}

export async function createBlock(pageId: string, type: string, content: string = "", orderIndex: number, parentBlockId?: string) {
  const blockId = uuidv4();
  blocks.push({
    id: blockId,
    pageId,
    parentBlockId: parentBlockId || null,
    type,
    content,
    orderIndex,
    updatedAt: new Date()
  });
  return blockId;
}

export async function getBlocksByPageId(pageId: string) {
  return blocks
    .filter(b => b.pageId === pageId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getBlockById(blockId: string) {
  return blocks.find(b => b.id === blockId) || null;
}

export async function updateBlock(blockId: string, data: any) {
  const block = blocks.find(b => b.id === blockId);
  if (block) {
    Object.assign(block, { ...data, updatedAt: new Date() });
  }
}

export async function deleteBlock(blockId: string) {
  blocks = blocks.filter(b => b.id !== blockId);
}

export async function reorderBlocks(pageId: string, blockIds: string[]) {
  blockIds.forEach((id, index) => {
    const block = blocks.find(b => b.id === id);
    if (block) {
      block.orderIndex = index;
      block.updatedAt = new Date();
    }
  });
}

export async function movePageToTrash(pageId: string, userId: number, pageData: any) {
  const trashId = uuidv4();
  trash.push({
    id: trashId,
    userId,
    pageId,
    pageData,
    deletedAt: new Date()
  });
  await updatePage(pageId, userId, { isArchived: true, archivedAt: new Date() });
}

export async function getTrashByUserId(userId: number) {
  return trash
    .filter(t => t.userId === userId)
    .sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
}

export async function restoreFromTrash(trashId: string, userId: number) {
  const index = trash.findIndex(t => t.id === trashId && t.userId === userId);
  if (index !== -1) {
    const item = trash[index];
    await updatePage(item.pageId, userId, { isArchived: false, archivedAt: null });
    trash.splice(index, 1);
  }
}

export async function searchPages(userId: number, query: string) {
  return pages.filter(p => 
    p.userId === userId && 
    !p.isArchived && 
    p.title.toLowerCase().includes(query.toLowerCase())
  );
}
