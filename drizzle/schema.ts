import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pages table - represents individual notes/pages in the workspace.
 * Pages can be nested (parent_page_id creates hierarchy).
 * Deleted pages are moved to trash, not permanently deleted.
 */
export const pages = mysqlTable("pages", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: int("userId").notNull(),
  title: text("title").notNull(),
  icon: varchar("icon", { length: 2 }), // Single emoji character
  bannerUrl: text("bannerUrl"), // URL to banner image in S3
  bannerType: mysqlEnum("bannerType", ["image", "gradient"]), // Type of banner
  parentPageId: varchar("parentPageId", { length: 36 }), // For nested pages/folders
  isArchived: boolean("isArchived").notNull().default(false),
  archivedAt: timestamp("archivedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

/**
 * Blocks table - represents individual content blocks within a page.
 * Supports multiple block types with flexible content storage.
 * Parent block ID enables nested lists and indentation.
 */
export const blocks = mysqlTable("blocks", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  pageId: varchar("pageId", { length: 36 }).notNull(),
  parentBlockId: varchar("parentBlockId", { length: 36 }), // For nested blocks (lists, indentation)
  type: mysqlEnum("type", [
    "paragraph",
    "heading1",
    "heading2",
    "heading3",
    "bulletList",
    "numberedList",
    "todo",
    "code",
    "quote",
    "divider",
    "image",
  ]).notNull(),
  content: text("content"), // Main text content
  isCompleted: boolean("isCompleted").default(false), // For todo blocks
  codeLanguage: varchar("codeLanguage", { length: 50 }), // For code blocks
  imageUrl: text("imageUrl"), // For image blocks
  imageCaption: text("imageCaption"), // Caption for image blocks
  orderIndex: int("orderIndex").notNull(), // Position within parent or page
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = typeof blocks.$inferInsert;

/**
 * Trash table - stores deleted pages for recovery.
 * Pages remain in trash for a configurable period before permanent deletion.
 */
export const trash = mysqlTable("trash", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: int("userId").notNull(),
  pageId: varchar("pageId", { length: 36 }).notNull(),
  pageData: json("pageData").notNull(), // Snapshot of page data for recovery
  deletedAt: timestamp("deletedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // Auto-delete after 30 days
});

export type Trash = typeof trash.$inferSelect;
export type InsertTrash = typeof trash.$inferInsert;
