INSERT INTO `orderWorkflow`(`orderId`, `status`) SELECT `orderId`, `status` FROM `purchaseOrders`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_purchaseOrders` (
	`orderId` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`emailId` text NOT NULL,
	`orderDate` integer NOT NULL,
	`locale` text NOT NULL,
	`totalValue` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_purchaseOrders`("orderId", "userId", "emailId", "orderDate", "locale", "totalValue", "createdAt") SELECT "orderId", "userId", "emailId", "orderDate", "locale", "totalValue", "createdAt" FROM `purchaseOrders`;--> statement-breakpoint
DROP TABLE `purchaseOrders`;--> statement-breakpoint
ALTER TABLE `__new_purchaseOrders` RENAME TO `purchaseOrders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;