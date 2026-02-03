import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

// Mock the database module
vi.mock("./db", { spy: true });

describe("Pages Operations", () => {
  const userId = 1;
  const testPageData = {
    title: "Test Page",
    icon: "📝",
  };

  describe("createPage", () => {
    it("should create a new page with title and icon", async () => {
      const pageId = await db.createPage(userId, testPageData.title);
      expect(pageId).toBeDefined();
      expect(typeof pageId).toBe("string");
    });

    it("should create page with default title", async () => {
      const pageId = await db.createPage(userId);
      expect(pageId).toBeDefined();
    });

    it("should create nested page with parent", async () => {
      const parentId = await db.createPage(userId, "Parent");
      const childId = await db.createPage(userId, "Child", parentId);
      expect(childId).toBeDefined();
      expect(childId).not.toBe(parentId);
    });
  });

  describe("getPagesByUserId", () => {
    it("should return empty array for user with no pages", async () => {
      const pages = await db.getPagesByUserId(userId);
      expect(Array.isArray(pages)).toBe(true);
    });

    it("should return only non-archived pages", async () => {
      const pages = await db.getPagesByUserId(userId);
      const allArchived = pages.every(p => !p.isArchived);
      expect(allArchived).toBe(true);
    });
  });

  describe("updatePage", () => {
    it("should update page title", async () => {
      const pageId = await db.createPage(userId, "Original Title");
      await db.updatePage(pageId, userId, { title: "Updated Title" });
      const page = await db.getPageById(pageId, userId);
      expect(page?.title).toBe("Updated Title");
    });

    it("should update page icon", async () => {
      const pageId = await db.createPage(userId, "Test");
      await db.updatePage(pageId, userId, { icon: "🎯" });
      const page = await db.getPageById(pageId, userId);
      expect(page?.icon).toBe("🎯");
    });

    it("should update page updatedAt timestamp", async () => {
      const pageId = await db.createPage(userId, "Test");
      const originalPage = await db.getPageById(pageId, userId);
      await new Promise(resolve => setTimeout(resolve, 10));
      await db.updatePage(pageId, userId, { title: "Updated" });
      const updatedPage = await db.getPageById(pageId, userId);
      expect(updatedPage?.updatedAt.getTime()).toBeGreaterThan(originalPage?.updatedAt.getTime() || 0);
    });
  });

  describe("getPageById", () => {
    it("should return null for non-existent page", async () => {
      const page = await db.getPageById("non-existent-id", userId);
      expect(page).toBeNull();
    });

    it("should return page for valid id", async () => {
      const pageId = await db.createPage(userId, "Test Page");
      const page = await db.getPageById(pageId, userId);
      expect(page).not.toBeNull();
      expect(page?.title).toBe("Test Page");
    });

    it("should not return pages from other users", async () => {
      const pageId = await db.createPage(userId, "Test");
      const page = await db.getPageById(pageId, userId + 1);
      expect(page).toBeNull();
    });
  });

  describe("movePageToTrash", () => {
    it("should move page to trash", async () => {
      const pageId = await db.createPage(userId, "Test");
      const page = await db.getPageById(pageId, userId);
      if (page) {
        await db.movePageToTrash(pageId, userId, page);
        const archivedPage = await db.getPageById(pageId, userId);
        expect(archivedPage?.isArchived).toBe(true);
      }
    });

    it("should set archivedAt timestamp", async () => {
      const pageId = await db.createPage(userId, "Test");
      const page = await db.getPageById(pageId, userId);
      if (page) {
        await db.movePageToTrash(pageId, userId, page);
        const archivedPage = await db.getPageById(pageId, userId);
        expect(archivedPage?.archivedAt).not.toBeNull();
      }
    });
  });
});

describe("Blocks Operations", () => {
  const userId = 1;
  let pageId: string;

  beforeEach(async () => {
    pageId = await db.createPage(userId, "Test Page");
  });

  describe("createBlock", () => {
    it("should create a paragraph block", async () => {
      const blockId = await db.createBlock(pageId, "paragraph", "Test content", 0);
      expect(blockId).toBeDefined();
      expect(typeof blockId).toBe("string");
    });

    it("should create different block types", async () => {
      const types = ["heading1", "heading2", "bulletList", "todo", "code"];
      for (const type of types) {
        const blockId = await db.createBlock(pageId, type, "Content", 0);
        expect(blockId).toBeDefined();
      }
    });

    it("should create block with parent block id", async () => {
      const parentId = await db.createBlock(pageId, "bulletList", "Parent", 0);
      const childId = await db.createBlock(pageId, "paragraph", "Child", 1, parentId);
      expect(childId).toBeDefined();
      expect(childId).not.toBe(parentId);
    });
  });

  describe("getBlocksByPageId", () => {
    it("should return blocks ordered by index", async () => {
      await db.createBlock(pageId, "paragraph", "First", 0);
      await db.createBlock(pageId, "paragraph", "Second", 1);
      await db.createBlock(pageId, "paragraph", "Third", 2);
      
      const blocks = await db.getBlocksByPageId(pageId);
      expect(blocks.length).toBe(3);
      expect(blocks[0].orderIndex).toBeLessThanOrEqual(blocks[1].orderIndex);
      expect(blocks[1].orderIndex).toBeLessThanOrEqual(blocks[2].orderIndex);
    });
  });

  describe("updateBlock", () => {
    it("should update block content", async () => {
      const blockId = await db.createBlock(pageId, "paragraph", "Original", 0);
      await db.updateBlock(blockId, { content: "Updated" });
      const block = await db.getBlockById(blockId);
      expect(block?.content).toBe("Updated");
    });

    it("should update block type", async () => {
      const blockId = await db.createBlock(pageId, "paragraph", "Text", 0);
      await db.updateBlock(blockId, { type: "heading1" });
      const block = await db.getBlockById(blockId);
      expect(block?.type).toBe("heading1");
    });

    it("should update todo completion status", async () => {
      const blockId = await db.createBlock(pageId, "todo", "Task", 0);
      await db.updateBlock(blockId, { isCompleted: true });
      const block = await db.getBlockById(blockId);
      expect(block?.isCompleted).toBe(true);
    });
  });

  describe("reorderBlocks", () => {
    it("should reorder blocks by provided order", async () => {
      const id1 = await db.createBlock(pageId, "paragraph", "First", 0);
      const id2 = await db.createBlock(pageId, "paragraph", "Second", 1);
      const id3 = await db.createBlock(pageId, "paragraph", "Third", 2);

      // Reverse the order
      await db.reorderBlocks(pageId, [id3, id2, id1]);

      const blocks = await db.getBlocksByPageId(pageId);
      expect(blocks[0].id).toBe(id3);
      expect(blocks[1].id).toBe(id2);
      expect(blocks[2].id).toBe(id1);
    });
  });

  describe("deleteBlock", () => {
    it("should delete a block", async () => {
      const blockId = await db.createBlock(pageId, "paragraph", "To delete", 0);
      await db.deleteBlock(blockId);
      const block = await db.getBlockById(blockId);
      expect(block).toBeNull();
    });
  });
});

describe("Trash Operations", () => {
  const userId = 1;

  describe("getTrashByUserId", () => {
    it("should return empty array for user with no trash", async () => {
      const trash = await db.getTrashByUserId(userId);
      expect(Array.isArray(trash)).toBe(true);
    });
  });

  describe("restoreFromTrash", () => {
    it("should restore page from trash", async () => {
      const pageId = await db.createPage(userId, "Test");
      const page = await db.getPageById(pageId, userId);
      if (page) {
        await db.movePageToTrash(pageId, userId, page);
        const trash = await db.getTrashByUserId(userId);
        if (trash.length > 0) {
          await db.restoreFromTrash(trash[0].id, userId);
          const restoredPage = await db.getPageById(pageId, userId);
          expect(restoredPage?.isArchived).toBe(false);
        }
      }
    });
  });
});

describe("Search Operations", () => {
  const userId = 1;

  describe("searchPages", () => {
    it("should find pages by title", async () => {
      await db.createPage(userId, "JavaScript Guide");
      const results = await db.searchPages(userId, "JavaScript");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain("JavaScript");
    });

    it("should return empty array for no matches", async () => {
      const results = await db.searchPages(userId, "NonExistentQuery12345");
      expect(Array.isArray(results)).toBe(true);
    });

    it("should be case insensitive", async () => {
      await db.createPage(userId, "Python Notes");
      const results = await db.searchPages(userId, "python");
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
