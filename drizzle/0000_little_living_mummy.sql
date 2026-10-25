CREATE TABLE `activity` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`run_id` text,
	`created_at` integer NOT NULL,
	`last_seen` integer NOT NULL,
	`last_action` integer NOT NULL,
	`sequence` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL,
	`active_seconds` integer DEFAULT 0 NOT NULL,
	`online_seconds` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`run_id` text,
	`kind` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`code_hash` text NOT NULL,
	`disabled` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`active_lease` text,
	`lease_seen` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_code_hash_unique` ON `members` (`code_hash`);--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`scenario` text NOT NULL,
	`mode` text NOT NULL,
	`state` text NOT NULL,
	`draft` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`quarter` integer DEFAULT 0 NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`score` real DEFAULT 0 NOT NULL,
	`profit` real DEFAULT 0 NOT NULL,
	`rank` integer,
	`deadline` integer,
	`last_command` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
