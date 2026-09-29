CREATE TABLE `counters` (
	`name` text PRIMARY KEY NOT NULL,
	`value` integer NOT NULL,
	CONSTRAINT "counters_name_check" CHECK(length("counters"."name") <= 255)
);
--> statement-breakpoint
CREATE TABLE `orderAddresses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contactId` integer NOT NULL,
	`streetName1` text NOT NULL,
	`streetName2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zipCode` text NOT NULL,
	`country` text NOT NULL,
	FOREIGN KEY (`contactId`) REFERENCES `orderContacts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orderAddresses_contactId_unique` ON `orderAddresses` (`contactId`);--> statement-breakpoint
CREATE TABLE `orderCards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orderId` text NOT NULL,
	`cardNumber` text NOT NULL,
	`cardType` text NOT NULL,
	`expiryDate` text NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `purchaseOrders`(`orderId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orderCards_orderId_unique` ON `orderCards` (`orderId`);--> statement-breakpoint
CREATE TABLE `orderContacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orderId` text NOT NULL,
	`givenName` text NOT NULL,
	`familyName` text NOT NULL,
	`telephone` text NOT NULL,
	`email` text,
	FOREIGN KEY (`orderId`) REFERENCES `purchaseOrders`(`orderId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orderContacts_orderId_unique` ON `orderContacts` (`orderId`);--> statement-breakpoint
CREATE TABLE `orderLines` (
	`orderId` text NOT NULL,
	`lineNum` integer NOT NULL,
	`categoryId` text NOT NULL,
	`productId` text NOT NULL,
	`itemId` text NOT NULL,
	`quantity` integer NOT NULL,
	`unitPrice` integer NOT NULL,
	PRIMARY KEY(`orderId`, `lineNum`),
	FOREIGN KEY (`orderId`) REFERENCES `purchaseOrders`(`orderId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`orderId` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`emailId` text NOT NULL,
	`orderDate` integer NOT NULL,
	`locale` text NOT NULL,
	`totalValue` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`createdAt` integer NOT NULL,
	CONSTRAINT "purchaseOrders_status_check" CHECK("purchaseOrders"."status" IN ('PENDING', 'APPROVED', 'DENIED', 'SHIPPED_PART', 'COMPLETED'))
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD `lastOrderId` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `lastOrderEmail` text;