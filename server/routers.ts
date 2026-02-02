import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // PAGE OPERATIONS
  pages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPagesByUserId(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().optional().default("Untitled"),
        parentPageId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const pageId = await db.createPage(ctx.user.id, input.title, input.parentPageId);
        return { id: pageId };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const page = await db.getPageById(input.id, ctx.user.id);
        if (!page) throw new Error("Page not found");
        return page;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        icon: z.string().optional(),
        bannerUrl: z.string().optional(),
        bannerType: z.enum(["image", "gradient"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        await db.updatePage(id, ctx.user.id, updateData);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const page = await db.getPageById(input.id, ctx.user.id);
        if (!page) throw new Error("Page not found");

        // Move to trash
        await db.movePageToTrash(input.id, ctx.user.id, page);
        return { success: true };
      }),

    getHierarchy: protectedProcedure.query(async ({ ctx }) => {
      return db.getPageHierarchy(ctx.user.id);
    }),
  }),

  // BLOCK OPERATIONS
  blocks: router({
    list: protectedProcedure
      .input(z.object({ pageId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Verify page belongs to user
        const page = await db.getPageById(input.pageId, ctx.user.id);
        if (!page) throw new Error("Page not found");

        return db.getBlocksByPageId(input.pageId);
      }),

    create: protectedProcedure
      .input(z.object({
        pageId: z.string(),
        type: z.enum(["paragraph", "heading1", "heading2", "heading3", "bulletList", "numberedList", "todo", "code", "quote", "divider", "image"]),
        content: z.string().optional().default(""),
        orderIndex: z.number(),
        parentBlockId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify page belongs to user
        const page = await db.getPageById(input.pageId, ctx.user.id);
        if (!page) throw new Error("Page not found");

        const blockId = await db.createBlock(
          input.pageId,
          input.type,
          input.content,
          input.orderIndex,
          input.parentBlockId
        );

        // Update page's updatedAt
        await db.updatePage(input.pageId, ctx.user.id, {});

        return { id: blockId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        pageId: z.string(),
        content: z.string().optional(),
        type: z.enum(["paragraph", "heading1", "heading2", "heading3", "bulletList", "numberedList", "todo", "code", "quote", "divider", "image"]).optional(),
        isCompleted: z.boolean().optional(),
        codeLanguage: z.string().optional(),
        imageUrl: z.string().optional(),
        imageCaption: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify page belongs to user
        const page = await db.getPageById(input.pageId, ctx.user.id);
        if (!page) throw new Error("Page not found");

        const { id, pageId, ...updateData } = input;
        await db.updateBlock(id, updateData as any);

        // Update page's updatedAt
        await db.updatePage(pageId, ctx.user.id, {});

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.string(),
        pageId: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify page belongs to user
        const page = await db.getPageById(input.pageId, ctx.user.id);
        if (!page) throw new Error("Page not found");

        await db.deleteBlock(input.id);

        // Update page's updatedAt
        await db.updatePage(input.pageId, ctx.user.id, {});

        return { success: true };
      }),

    reorder: protectedProcedure
      .input(z.object({
        pageId: z.string(),
        blockIds: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify page belongs to user
        const page = await db.getPageById(input.pageId, ctx.user.id);
        if (!page) throw new Error("Page not found");

        await db.reorderBlocks(input.pageId, input.blockIds);

        // Update page's updatedAt
        await db.updatePage(input.pageId, ctx.user.id, {});

        return { success: true };
      }),
  }),

  // TRASH OPERATIONS
  trash: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getTrashByUserId(ctx.user.id);
    }),

    restore: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.restoreFromTrash(input.id, ctx.user.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.permanentlyDeleteTrashItem(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // SEARCH OPERATIONS
  search: router({
    query: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ ctx, input }) => {
        const pages = await db.searchPages(ctx.user.id, input.query);
        const blocks = await db.searchBlocks(ctx.user.id, input.query);

        return {
          pages,
          blocks,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
