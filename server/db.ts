import { eq, and, desc, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, pages, blocks, trash } from "../drizzle/schema";
import { ENV } from './_core/env';
import { v4 as uuidv4 } from 'uuid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// PAGE OPERATIONS

export async function createPage(userId: number, title: string = "Untitled", parentPageId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const pageId = uuidv4();
  await db.insert(pages).values({
    id: pageId,
    userId,
    title,
    parentPageId: parentPageId || null,
    isArchived: false,
  });

  return pageId;
}

export async function getPagesByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(pages)
    .where(and(eq(pages.userId, userId), eq(pages.isArchived, false)))
    .orderBy(desc(pages.updatedAt));
}

export async function getPageById(pageId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updatePage(pageId: string, userId: number, data: Partial<typeof pages.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(pages)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(pages.id, pageId), eq(pages.userId, userId)));
}

export async function getPageHierarchy(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(pages)
    .where(and(eq(pages.userId, userId), eq(pages.isArchived, false)))
    .orderBy(desc(pages.updatedAt));
}

// BLOCK OPERATIONS

export async function createBlock(pageId: string, type: string, content: string = "", orderIndex: number, parentBlockId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const blockId = uuidv4();
  await db.insert(blocks).values({
    id: blockId,
    pageId,
    parentBlockId: parentBlockId || null,
    type: type as any,
    content,
    orderIndex,
  });

  return blockId;
}

export async function getBlocksByPageId(pageId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(blocks)
    .where(eq(blocks.pageId, pageId))
    .orderBy(blocks.orderIndex);
}

export async function getBlockById(blockId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(blocks).where(eq(blocks.id, blockId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateBlock(blockId: string, data: Partial<typeof blocks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(blocks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(blocks.id, blockId));
}

export async function deleteBlock(blockId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(blocks).where(eq(blocks.id, blockId));
}

export async function reorderBlocks(pageId: string, blockIds: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (let i = 0; i < blockIds.length; i++) {
    await db
      .update(blocks)
      .set({ orderIndex: i, updatedAt: new Date() })
      .where(eq(blocks.id, blockIds[i]));
  }
}

// TRASH OPERATIONS

export async function movePageToTrash(pageId: string, userId: number, pageData: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const trashId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days retention

  await db.insert(trash).values({
    id: trashId,
    userId,
    pageId,
    pageData,
    expiresAt,
  });

  // Archive the page
  await updatePage(pageId, userId, { isArchived: true, archivedAt: new Date() });
}

export async function getTrashByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(trash)
    .where(eq(trash.userId, userId))
    .orderBy(desc(trash.deletedAt));
}

export async function restoreFromTrash(trashId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const trashItem = await db
    .select()
    .from(trash)
    .where(and(eq(trash.id, trashId), eq(trash.userId, userId)))
    .limit(1);

  if (trashItem.length === 0) throw new Error("Trash item not found");

  const item = trashItem[0];
  
  // Restore page
  await updatePage(item.pageId, userId, { 
    isArchived: false, 
    archivedAt: null 
  });

  // Remove from trash
  await db.delete(trash).where(eq(trash.id, trashId));
}

export async function permanentlyDeleteTrashItem(trashId: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const trashItem = await db
    .select()
    .from(trash)
    .where(and(eq(trash.id, trashId), eq(trash.userId, userId)))
    .limit(1);

  if (trashItem.length === 0) throw new Error("Trash item not found");

  const item = trashItem[0];

  // Delete all blocks for this page
  await db.delete(blocks).where(eq(blocks.pageId, item.pageId));

  // Delete the page
  await db.delete(pages).where(eq(pages.id, item.pageId));

  // Remove from trash
  await db.delete(trash).where(eq(trash.id, trashId));
}

// SEARCH OPERATIONS

export async function searchPages(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const searchQuery = `%${query}%`;
  
  // Search in page titles
  const pageResults = await db
    .select()
    .from(pages)
    .where(
      and(
        eq(pages.userId, userId),
        eq(pages.isArchived, false)
      )
    );

  return pageResults.filter(p => p.title.toLowerCase().includes(query.toLowerCase()));
}

export async function searchBlocks(userId: number, query: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const searchQuery = `%${query}%`;
  
  // Get all user's pages
  const userPages = await db
    .select()
    .from(pages)
    .where(and(eq(pages.userId, userId), eq(pages.isArchived, false)));

  const pageIds = userPages.map(p => p.id);
  
  if (pageIds.length === 0) return [];

  // Search blocks in those pages
  const blockResults = await db
    .select()
    .from(blocks)
    .where(eq(blocks.pageId, pageIds[0])); // Placeholder - would need IN operator

  return blockResults.filter(b => 
    b.content && b.content.toLowerCase().includes(query.toLowerCase())
  );
}
