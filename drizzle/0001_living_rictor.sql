CREATE TABLE `body_paragraphs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`orderIndex` int NOT NULL,
	`topicSentence` text,
	`supportingDetails` text,
	`relevantInfoScore` int,
	`transitionScore` int,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `body_paragraphs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `section_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`sectionType` enum('hook','body','conclusion') NOT NULL,
	`paragraphId` int,
	`previousContent` text,
	`newContent` text,
	`previousScore` int,
	`newScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `section_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `writing_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topic` varchar(255),
	`title` varchar(255),
	`currentStep` int NOT NULL DEFAULT 1,
	`status` enum('in_progress','completed','reviewed') NOT NULL DEFAULT 'in_progress',
	`hook` text,
	`conclusion` text,
	`overallScores` json,
	`lowScoreCount` int NOT NULL DEFAULT 0,
	`scaffoldingTriggered` int NOT NULL DEFAULT 0,
	`aiFeedback` text,
	`strengthsAndGrowth` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `writing_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','teacher') NOT NULL DEFAULT 'user';