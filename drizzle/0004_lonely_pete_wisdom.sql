DROP TABLE `users`;
--> statement-breakpoint
DROP TABLE `profiles`;
--> statement-breakpoint
CREATE TABLE `users` (
	`userId` text PRIMARY KEY NOT NULL,
	`passwordHash` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`userId` text PRIMARY KEY NOT NULL,
	`preferredLanguage` text DEFAULT 'en_US' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`realm` text NOT NULL,
	`userId` text,
	`signedOn` integer DEFAULT false NOT NULL,
	`originalUrl` text,
	`lastSeenAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "sessions_realm_check" CHECK("sessions"."realm" IN ('storefront', 'admin', 'supplier'))
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`userId` text PRIMARY KEY NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cartLines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sessionId` text NOT NULL,
	`itemId` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`addedAt` integer NOT NULL,
	FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cartLines_session_item_unique` ON `cartLines` (`sessionId`,`itemId`);
--> statement-breakpoint
CREATE TABLE `roleAssignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`realm` text NOT NULL,
	`role` text NOT NULL,
	`principalType` text NOT NULL,
	`principal` text NOT NULL,
	CONSTRAINT "roleAssignments_realm_check" CHECK("roleAssignments"."realm" IN ('admin', 'supplier')),
	CONSTRAINT "roleAssignments_principalType_check" CHECK("roleAssignments"."principalType" IN ('user', 'group'))
);
--> statement-breakpoint
CREATE TABLE `groupMembers` (
	`groupName` text NOT NULL,
	`userId` text NOT NULL,
	PRIMARY KEY(`groupName`, `userId`),
	FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON UPDATE no action ON DELETE no action
);
