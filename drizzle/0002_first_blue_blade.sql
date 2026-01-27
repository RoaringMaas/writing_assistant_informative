CREATE TABLE `saved_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`saveCode` varchar(10) NOT NULL,
	`sessionData` json NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `saved_sessions_saveCode_unique` UNIQUE(`saveCode`)
);
