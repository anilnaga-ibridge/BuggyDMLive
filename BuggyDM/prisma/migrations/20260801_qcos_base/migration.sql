-- ==============================================================================
-- QCOS Server-Driven UI (SDUI) Base Migration
-- Migration: 20260801_qcos_base
-- Defines the 22 base QCOS tables required prior to advanced SDUI features.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. qcos_themes
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_themes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. qcos_media_library (Base)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_media_library` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `file_type` VARCHAR(50) NOT NULL,
  `url` VARCHAR(512) NOT NULL,
  `responsive_urls` TEXT NULL,
  `size_bytes` INT NOT NULL,
  `mime_type` VARCHAR(100) NOT NULL,
  `width` INT NULL,
  `height` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. qcos_page_templates
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_page_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `page_name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_page_templates_page_name_key` (`page_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. qcos_widgets
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_widgets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `schema_def` TEXT NOT NULL,
  `min_version` VARCHAR(20) NOT NULL,
  `max_version` VARCHAR(20) NULL,
  `fallback_id` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_widgets_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. qcos_data_sources
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_data_sources` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `resolver_endpoint` VARCHAR(255) NOT NULL,
  `filters_json` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_data_sources_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. qcos_experience_context
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_experience_context` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `city` VARCHAR(100) NULL,
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
  `device_type` VARCHAR(50) NOT NULL DEFAULT 'mobile',
  `network_speed` VARCHAR(20) NULL,
  `preferred_categories` TEXT NULL,
  `weather_code` VARCHAR(50) NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_experience_context_user_id_key` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. qcos_feature_flags
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_feature_flags` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `flag_key` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
  `rules_json` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_feature_flags_flag_key_key` (`flag_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. qcos_experience_rules
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_experience_rules` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `conditions_json` TEXT NOT NULL,
  `actions_json` TEXT NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. qcos_release_channels
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_release_channels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_release_channels_name_key` (`name`),
  UNIQUE KEY `qcos_release_channels_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. qcos_audit_logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_table` VARCHAR(100) NOT NULL,
  `record_id` INT NOT NULL,
  `old_value` TEXT NULL,
  `new_value` TEXT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` VARCHAR(255) NOT NULL,
  `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. qcos_design_tokens
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_design_tokens` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `theme_id` INT NOT NULL,
  `token_key` VARCHAR(100) NOT NULL,
  `token_value` VARCHAR(255) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qcos_design_tokens_theme_id_idx` (`theme_id`),
  KEY `qcos_design_tokens_token_key_idx` (`token_key`),
  CONSTRAINT `qcos_design_tokens_theme_id_fkey` FOREIGN KEY (`theme_id`) REFERENCES `qcos_themes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. qcos_page_versions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_page_versions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `template_id` INT NOT NULL,
  `version_number` INT NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
  `created_by` INT NOT NULL,
  `approved_by` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `published_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `qcos_page_versions_template_id_idx` (`template_id`),
  CONSTRAINT `qcos_page_versions_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `qcos_page_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. qcos_experiments
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_experiments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `flag_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
  `starts_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ends_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qcos_experiments_flag_id_idx` (`flag_id`),
  CONSTRAINT `qcos_experiments_flag_id_fkey` FOREIGN KEY (`flag_id`) REFERENCES `qcos_feature_flags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. qcos_layouts
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_layouts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `page_version_id` INT NOT NULL,
  `theme_id` INT NULL,
  `name` VARCHAR(100) NOT NULL,
  `is_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  KEY `qcos_layouts_page_version_id_idx` (`page_version_id`),
  KEY `qcos_layouts_theme_id_idx` (`theme_id`),
  CONSTRAINT `qcos_layouts_page_version_id_fkey` FOREIGN KEY (`page_version_id`) REFERENCES `qcos_page_versions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qcos_layouts_theme_id_fkey` FOREIGN KEY (`theme_id`) REFERENCES `qcos_themes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. qcos_publish_history (Base)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_publish_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `page_version_id` INT NOT NULL,
  `channel_id` INT NOT NULL,
  `published_by` INT NOT NULL,
  `published_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `rolled_back_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `qcos_publish_history_page_version_id_idx` (`page_version_id`),
  KEY `qcos_publish_history_channel_id_idx` (`channel_id`),
  CONSTRAINT `qcos_publish_history_page_version_id_fkey` FOREIGN KEY (`page_version_id`) REFERENCES `qcos_page_versions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qcos_publish_history_channel_id_fkey` FOREIGN KEY (`channel_id`) REFERENCES `qcos_release_channels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. qcos_diff_versions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_diff_versions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `page_version_id` INT NOT NULL,
  `version_hash` VARCHAR(64) NOT NULL,
  `diff_payload` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `qcos_diff_versions_version_hash_key` (`version_hash`),
  KEY `qcos_diff_versions_page_version_id_idx` (`page_version_id`),
  CONSTRAINT `qcos_diff_versions_page_version_id_fkey` FOREIGN KEY (`page_version_id`) REFERENCES `qcos_page_versions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 17. qcos_experiment_variants
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_experiment_variants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `experiment_id` INT NOT NULL,
  `name` VARCHAR(50) NOT NULL,
  `traffic_pct` DECIMAL(5, 2) NOT NULL,
  `properties_json` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `qcos_experiment_variants_experiment_id_idx` (`experiment_id`),
  CONSTRAINT `qcos_experiment_variants_experiment_id_fkey` FOREIGN KEY (`experiment_id`) REFERENCES `qcos_experiments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 18. qcos_sections
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_sections` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `layout_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `display_order` INT NOT NULL,
  `visibility_rules` TEXT NULL,
  `constraints_json` TEXT NULL,
  PRIMARY KEY (`id`),
  KEY `qcos_sections_layout_id_idx` (`layout_id`),
  CONSTRAINT `qcos_sections_layout_id_fkey` FOREIGN KEY (`layout_id`) REFERENCES `qcos_layouts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 19. qcos_widget_instances
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_widget_instances` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `section_id` INT NOT NULL,
  `widget_id` INT NOT NULL,
  `display_order` INT NOT NULL,
  `properties_json` TEXT NOT NULL,
  `data_source_id` INT NULL,
  PRIMARY KEY (`id`),
  KEY `qcos_widget_instances_section_id_idx` (`section_id`),
  KEY `qcos_widget_instances_widget_id_idx` (`widget_id`),
  KEY `qcos_widget_instances_data_source_id_idx` (`data_source_id`),
  CONSTRAINT `qcos_widget_instances_section_id_fkey` FOREIGN KEY (`section_id`) REFERENCES `qcos_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qcos_widget_instances_widget_id_fkey` FOREIGN KEY (`widget_id`) REFERENCES `qcos_widgets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `qcos_widget_instances_data_source_id_fkey` FOREIGN KEY (`data_source_id`) REFERENCES `qcos_data_sources` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 20. qcos_widget_actions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_widget_actions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `widget_instance_id` INT NOT NULL,
  `trigger` VARCHAR(50) NOT NULL,
  `action_type` VARCHAR(100) NOT NULL,
  `params_json` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `qcos_widget_actions_widget_instance_id_idx` (`widget_instance_id`),
  CONSTRAINT `qcos_widget_actions_widget_instance_id_fkey` FOREIGN KEY (`widget_instance_id`) REFERENCES `qcos_widget_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 21. qcos_widget_conditions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_widget_conditions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `widget_instance_id` INT NOT NULL,
  `condition_expr` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `qcos_widget_conditions_widget_instance_id_idx` (`widget_instance_id`),
  CONSTRAINT `qcos_widget_conditions_widget_instance_id_fkey` FOREIGN KEY (`widget_instance_id`) REFERENCES `qcos_widget_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 22. qcos_analytics_events
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `qcos_analytics_events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `widget_instance_id` INT NOT NULL,
  `event_name` VARCHAR(100) NOT NULL,
  `metric_key` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qcos_analytics_events_widget_instance_id_idx` (`widget_instance_id`),
  CONSTRAINT `qcos_analytics_events_widget_instance_id_fkey` FOREIGN KEY (`widget_instance_id`) REFERENCES `qcos_widget_instances` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
