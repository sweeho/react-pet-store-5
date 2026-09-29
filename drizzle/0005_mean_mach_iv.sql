PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_itemDetails` (
	`itemId` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`listPrice` integer NOT NULL,
	`unitCost` integer NOT NULL,
	`attr1` text,
	`attr2` text,
	`attr3` text,
	`attr4` text,
	`attr5` text,
	PRIMARY KEY(`itemId`, `locale`),
	FOREIGN KEY (`itemId`) REFERENCES `item`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "itemDetails_name_length_check" CHECK(length("__new_itemDetails"."name") <= 80),
	CONSTRAINT "itemDetails_description_length_check" CHECK(length("__new_itemDetails"."description") <= 255),
	CONSTRAINT "itemDetails_attr1_length_check" CHECK("__new_itemDetails"."attr1" IS NULL OR length("__new_itemDetails"."attr1") <= 80),
	CONSTRAINT "itemDetails_attr2_length_check" CHECK("__new_itemDetails"."attr2" IS NULL OR length("__new_itemDetails"."attr2") <= 80),
	CONSTRAINT "itemDetails_attr3_length_check" CHECK("__new_itemDetails"."attr3" IS NULL OR length("__new_itemDetails"."attr3") <= 80),
	CONSTRAINT "itemDetails_attr4_length_check" CHECK("__new_itemDetails"."attr4" IS NULL OR length("__new_itemDetails"."attr4") <= 80),
	CONSTRAINT "itemDetails_attr5_length_check" CHECK("__new_itemDetails"."attr5" IS NULL OR length("__new_itemDetails"."attr5") <= 80)
);
--> statement-breakpoint
INSERT INTO `__new_itemDetails`("itemId", "locale", "name", "description", "image", "listPrice", "unitCost", "attr1", "attr2", "attr3", "attr4", "attr5") SELECT "itemId", "locale", "name", "description", "image", "listPrice", "unitCost", "attr1", "attr2", "attr3", "attr4", "attr5" FROM `itemDetails`;--> statement-breakpoint
DROP TABLE `itemDetails`;--> statement-breakpoint
ALTER TABLE `__new_itemDetails` RENAME TO `itemDetails`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_category` (
	`id` text PRIMARY KEY NOT NULL,
	CONSTRAINT "category_id_length_check" CHECK(length("__new_category"."id") <= 10)
);
--> statement-breakpoint
INSERT INTO `__new_category`("id") SELECT "id" FROM `category`;--> statement-breakpoint
DROP TABLE `category`;--> statement-breakpoint
ALTER TABLE `__new_category` RENAME TO `category`;--> statement-breakpoint
CREATE TABLE `__new_categoryDetails` (
	`categoryId` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`description` text,
	PRIMARY KEY(`categoryId`, `locale`),
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "categoryDetails_name_length_check" CHECK(length("__new_categoryDetails"."name") <= 80),
	CONSTRAINT "categoryDetails_image_length_check" CHECK("__new_categoryDetails"."image" IS NULL OR length("__new_categoryDetails"."image") <= 255),
	CONSTRAINT "categoryDetails_description_length_check" CHECK("__new_categoryDetails"."description" IS NULL OR length("__new_categoryDetails"."description") <= 255)
);
--> statement-breakpoint
INSERT INTO `__new_categoryDetails`("categoryId", "locale", "name", "image", "description") SELECT "categoryId", "locale", "name", "image", "description" FROM `categoryDetails`;--> statement-breakpoint
DROP TABLE `categoryDetails`;--> statement-breakpoint
ALTER TABLE `__new_categoryDetails` RENAME TO `categoryDetails`;--> statement-breakpoint
CREATE TABLE `__new_item` (
	`id` text PRIMARY KEY NOT NULL,
	`productId` text NOT NULL,
	FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "item_id_length_check" CHECK(length("__new_item"."id") <= 10)
);
--> statement-breakpoint
INSERT INTO `__new_item`("id", "productId") SELECT "id", "productId" FROM `item`;--> statement-breakpoint
DROP TABLE `item`;--> statement-breakpoint
ALTER TABLE `__new_item` RENAME TO `item`;--> statement-breakpoint
CREATE TABLE `__new_product` (
	`id` text PRIMARY KEY NOT NULL,
	`categoryId` text NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "product_id_length_check" CHECK(length("__new_product"."id") <= 10)
);
--> statement-breakpoint
INSERT INTO `__new_product`("id", "categoryId") SELECT "id", "categoryId" FROM `product`;--> statement-breakpoint
DROP TABLE `product`;--> statement-breakpoint
ALTER TABLE `__new_product` RENAME TO `product`;--> statement-breakpoint
CREATE TABLE `__new_productDetails` (
	`productId` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`image` text,
	`description` text,
	PRIMARY KEY(`productId`, `locale`),
	FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "productDetails_name_length_check" CHECK(length("__new_productDetails"."name") <= 80)
);
--> statement-breakpoint
INSERT INTO `__new_productDetails`("productId", "locale", "name", "image", "description") SELECT "productId", "locale", "name", "image", "description" FROM `productDetails`;--> statement-breakpoint
DROP TABLE `productDetails`;--> statement-breakpoint
ALTER TABLE `__new_productDetails` RENAME TO `productDetails`;