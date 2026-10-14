ALTER TABLE `qcos_media_library`
  ADD COLUMN `alt_text` VARCHAR(255) NULL,
  ADD COLUMN `checksum_sha256` CHAR(64) NULL,
  ADD COLUMN `status` VARCHAR(30) NOT NULL DEFAULT 'active',
  ADD COLUMN `created_by` INT NULL;

ALTER TABLE `qcos_publish_history`
  ADD COLUMN `rollout_pct` DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  ADD COLUMN `publish_reason` VARCHAR(500) NULL;

CREATE TABLE `qcos_localizations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NOT NULL,
  `locale` VARCHAR(35) NOT NULL,
  `field_key` VARCHAR(100) NOT NULL,
  `value_text` TEXT NOT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'draft',
  `created_by` INT NOT NULL,
  `approved_by` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_localizations_entity_locale_field_unique` (`entity_type`, `entity_id`, `locale`, `field_key`),
  KEY `qcos_localizations_locale_status_idx` (`locale`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `qcos_segments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `segment_key` VARCHAR(100) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `rules_json` TEXT NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_segments_segment_key_key` (`segment_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `qcos_scheduled_publications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `page_version_id` INT NOT NULL,
  `channel_id` INT NOT NULL,
  `scheduled_for` TIMESTAMP NOT NULL,
  `rollout_pct` DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  `status` VARCHAR(30) NOT NULL DEFAULT 'scheduled',
  `reason` VARCHAR(500) NOT NULL,
  `created_by` INT NOT NULL,
  `executed_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qcos_scheduled_publications_status_scheduled_for_idx` (`status`, `scheduled_for`),
  KEY `qcos_scheduled_publications_page_channel_idx` (`page_version_id`, `channel_id`),
  CONSTRAINT `qcos_scheduled_publications_page_version_fk` FOREIGN KEY (`page_version_id`) REFERENCES `qcos_page_versions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `qcos_scheduled_publications_channel_fk` FOREIGN KEY (`channel_id`) REFERENCES `qcos_release_channels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `qcos_role_permissions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission` VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_role_permissions_role_permission_unique` (`role_id`, `permission`),
  KEY `qcos_role_permissions_permission_idx` (`permission`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
