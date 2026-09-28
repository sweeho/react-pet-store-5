CREATE TABLE `outboxDeliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`messageId` text NOT NULL,
	`consumer` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`lastError` text,
	`nextAttemptAt` integer NOT NULL,
	FOREIGN KEY (`messageId`) REFERENCES `outboxMessages`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "outboxDeliveries_status_check" CHECK("outboxDeliveries"."status" IN ('pending', 'delivered', 'dead'))
);
--> statement-breakpoint
CREATE TABLE `outboxMessages` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`payload` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplierAddresses` (
	`orderId` text PRIMARY KEY NOT NULL,
	`streetName1` text NOT NULL,
	`streetName2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zipCode` text NOT NULL,
	`country` text NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `supplierOrders`(`orderId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplierContacts` (
	`orderId` text PRIMARY KEY NOT NULL,
	`familyName` text NOT NULL,
	`givenName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `supplierOrders`(`orderId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplierLineItems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orderId` text NOT NULL,
	`categoryId` text NOT NULL,
	`productId` text NOT NULL,
	`itemId` text NOT NULL,
	`lineNum` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unitPrice` integer NOT NULL,
	`quantityShipped` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `supplierOrders`(`orderId`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplierOrders` (
	`orderId` text PRIMARY KEY NOT NULL,
	`orderDate` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`createdAt` integer NOT NULL,
	CONSTRAINT "supplierOrders_status_check" CHECK("supplierOrders"."status" IN ('PENDING', 'APPROVED', 'DENIED', 'COMPLETED'))
);
