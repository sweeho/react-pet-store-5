CREATE TABLE `orderWorkflow` (
	`orderId` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	CONSTRAINT "orderWorkflow_status_check" CHECK("orderWorkflow"."status" IN ('PENDING', 'APPROVED', 'DENIED', 'SHIPPED_PART', 'COMPLETED'))
);
--> statement-breakpoint
CREATE TABLE `supplierInventory` (
	`itemId` text PRIMARY KEY NOT NULL,
	`quantity` integer NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_supplierAddresses` (
	`orderId` text PRIMARY KEY NOT NULL,
	`streetName1` text NOT NULL,
	`streetName2` text,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`zipCode` text NOT NULL,
	`country` text NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `supplierOrders`(`orderId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_supplierAddresses`("orderId", "streetName1", "streetName2", "city", "state", "zipCode", "country") SELECT "orderId", "streetName1", "streetName2", "city", "state", "zipCode", "country" FROM `supplierAddresses`;--> statement-breakpoint
DROP TABLE `supplierAddresses`;--> statement-breakpoint
ALTER TABLE `__new_supplierAddresses` RENAME TO `supplierAddresses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_supplierContacts` (
	`orderId` text PRIMARY KEY NOT NULL,
	`familyName` text NOT NULL,
	`givenName` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `supplierOrders`(`orderId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_supplierContacts`("orderId", "familyName", "givenName", "email", "phone") SELECT "orderId", "familyName", "givenName", "email", "phone" FROM `supplierContacts`;--> statement-breakpoint
DROP TABLE `supplierContacts`;--> statement-breakpoint
ALTER TABLE `__new_supplierContacts` RENAME TO `supplierContacts`;--> statement-breakpoint
CREATE TABLE `__new_supplierLineItems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`orderId` text NOT NULL,
	`categoryId` text NOT NULL,
	`productId` text NOT NULL,
	`itemId` text NOT NULL,
	`lineNum` integer NOT NULL,
	`quantity` integer NOT NULL,
	`unitPrice` integer NOT NULL,
	`quantityShipped` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`orderId`) REFERENCES `supplierOrders`(`orderId`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_supplierLineItems`("id", "orderId", "categoryId", "productId", "itemId", "lineNum", "quantity", "unitPrice", "quantityShipped") SELECT "id", "orderId", "categoryId", "productId", "itemId", "lineNum", "quantity", "unitPrice", "quantityShipped" FROM `supplierLineItems`;--> statement-breakpoint
DROP TABLE `supplierLineItems`;--> statement-breakpoint
ALTER TABLE `__new_supplierLineItems` RENAME TO `supplierLineItems`;--> statement-breakpoint
ALTER TABLE `orderLines` ADD `quantityShipped` integer DEFAULT 0 NOT NULL;