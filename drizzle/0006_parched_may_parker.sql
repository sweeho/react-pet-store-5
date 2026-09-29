CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `customers`(`userId`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "accounts_status_check" CHECK("accounts"."status" IN ('active', 'disabled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_userId_unique` ON `accounts` (`userId`);--> statement-breakpoint
CREATE TABLE `addresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contactInfoId` integer,
	`streetName1` text DEFAULT '' NOT NULL,
	`streetName2` text,
	`city` text DEFAULT '' NOT NULL,
	`state` text DEFAULT '' NOT NULL,
	`zipCode` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`contactInfoId`) REFERENCES `contactInfos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `addresses_contactInfoId_unique` ON `addresses` (`contactInfoId`);--> statement-breakpoint
CREATE TABLE `contactInfos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer,
	`givenName` text DEFAULT '' NOT NULL,
	`familyName` text DEFAULT '' NOT NULL,
	`telephone` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `contactInfos_accountId_unique` ON `contactInfos` (`accountId`);--> statement-breakpoint
CREATE TABLE `creditCards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer,
	`cardLastFour` text DEFAULT '' NOT NULL,
	`cardType` text DEFAULT '' NOT NULL,
	`expiryDate` text,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `creditCards_accountId_unique` ON `creditCards` (`accountId`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_profiles` (
	`userId` text PRIMARY KEY NOT NULL,
	`preferredLanguage` text DEFAULT 'en_US' NOT NULL,
	`favoriteCategory` text,
	`myListPreference` integer DEFAULT true NOT NULL,
	`bannerPreference` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `customers`(`userId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_profiles`("userId", "preferredLanguage") SELECT "userId", "preferredLanguage" FROM `profiles`;--> statement-breakpoint
DROP TABLE `profiles`;--> statement-breakpoint
ALTER TABLE `__new_profiles` RENAME TO `profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;