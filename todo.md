# Notion-Style Note Taking App - TODO

## Database & Backend
- [x] Create database schema for pages, blocks, and trash
- [x] Implement page CRUD procedures
- [x] Implement block CRUD procedures
- [x] Implement trash/archive system
- [ ] Add real-time auto-save debouncing
- [x] Implement search procedure
- [x] Add data validation and error handling

## Frontend Layout & Components
- [x] Design elegant color palette and typography system
- [x] Create DashboardLayout with sidebar navigation
- [x] Implement responsive sidebar (collapsible on mobile)
- [x] Create page list with emoji icons and titles
- [x] Build page header with title, emoji picker, and banner
- [x] Create block components for each type
- [x] Implement block rendering system

## Block Editor & Interactions
- [x] Implement markdown shortcuts (# for heading, - for bullet, [] for todo, etc.)
- [x] Add block creation on Enter key
- [x] Implement Tab/Shift+Tab for indentation
- [x] Add Shift+Enter for soft line breaks
- [x] Create block content editing with cursor management
- [x] Implement block deletion and merging

## Drag & Drop & Advanced Features
- [ ] Implement drag-and-drop block reordering
- [ ] Add visual drop indicators
- [ ] Implement search modal with instant results
- [x] Create trash/archive page
- [x] Add restore functionality
- [x] Implement page hierarchy (nested pages as folders)

## UI Polish & Testing
- [x] Add loading states and skeletons
- [x] Implement error boundaries and error handling
- [ ] Add animations and transitions
- [x] Test all keyboard shortcuts
- [ ] Test responsive design on mobile
- [ ] Optimize performance and bundle size
- [x] Write vitest tests for critical features

## Deployment
- [ ] Create checkpoint for deployment
- [ ] Verify all features working
- [ ] Final polish and bug fixes


## Critical Bug Fixes (PRIORITY)
- [x] Fix text appearing backwards in block editor
- [x] Fix cursor position desync and deletion issues
- [x] Fix Enter key delay for new block creation
- [x] Fix cursor auto-focus into new blocks
- [x] Fix page title editing (input not accepting text)
- [x] Fix icon update not rendering live in sidebar
- [x] Prevent editor re-mounting on typing/block creation

## Sidebar Layout Fixes
- [x] Add Account/Settings/Search buttons to top
- [x] Restructure sidebar into three zones: top fixed, middle scrollable, bottom fixed
- [x] Fix button overlap when many pages exist
- [x] Ensure only pages list is scrollable
- [x] Fix Trash/New Page button positioning

## Drag-and-Drop Implementation
- [x] Implement block drag-and-drop reordering
- [ ] Add visual drop indicators
- [ ] Add nested block support

## Dark Mode Feature
- [x] Add dark mode toggle in top-left corner
- [x] Persist theme preference in localStorage
- [x] Apply theme to all components (sidebar, editor, modals, inputs)
- [x] Ensure smooth toggle without cursor/state loss


## PRIORITY ZERO — CRITICAL STRUCTURAL FAILURES
- [x] Fix block editor focus + typing disappearing (block-local state)
- [x] Fix page title input - typing does nothing
- [x] Fix emoji picker size, stability, and live updates
- [x] Restructure sidebar: Account section at top (non-clickable)
- [x] Remove "Navigation" header from sidebar
- [x] Move sidebar collapse button to bottom-right corner
- [x] Implement functional search modal (pages + blocks)
- [x] Move dark mode toggle to Settings panel only
