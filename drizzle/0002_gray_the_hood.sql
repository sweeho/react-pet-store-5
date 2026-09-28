CREATE TABLE `category` (
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `categoryDetails` (
	`categoryId` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`description` text,
	PRIMARY KEY(`categoryId`, `locale`),
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `item` (
	`id` text PRIMARY KEY NOT NULL,
	`productId` text NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `itemDetails` (
	`itemId` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`listPrice` integer NOT NULL,
	`unitCost` integer NOT NULL,
	PRIMARY KEY(`itemId`, `locale`),
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` text PRIMARY KEY NOT NULL,
	`categoryId` text NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `productDetails` (
	`productId` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`description` text,
	PRIMARY KEY(`productId`, `locale`),
	FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action
);
