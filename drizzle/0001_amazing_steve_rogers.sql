CREATE TABLE `blocks` (
	`id` varchar(36) NOT NULL,
	`pageId` varchar(36) NOT NULL,
	`parentBlockId` varchar(36),
	`type` enum('paragraph','heading1','heading2','heading3','bulletList','numberedList','todo','code','quote','divider','image') NOT NULL DEFAULT 'paragraph',
	`content` text,
	`isCompleted` boolean DEFAULT false,
	`codeLanguage` varchar(50),
	`imageUrl` text,
	`imageCaption` text,
	`orderIndex` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`title` text NOT NULL,
	`icon` varchar(2),
	`bannerUrl` text,
	`bannerType` enum('image','gradient'),
	`parentPageId` varchar(36),
	`isArchived` boolean NOT NULL DEFAULT false,
	`archivedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trash` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`pageId` varchar(36) NOT NULL,
	`pageData` json NOT NULL,
	`deletedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `trash_id` PRIMARY KEY(`id`)
);
