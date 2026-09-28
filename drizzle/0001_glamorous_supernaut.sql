CREATE TABLE `profiles` (
	`userId` integer PRIMARY KEY NOT NULL,
	`preferredLanguage` text DEFAULT 'en_US' NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
