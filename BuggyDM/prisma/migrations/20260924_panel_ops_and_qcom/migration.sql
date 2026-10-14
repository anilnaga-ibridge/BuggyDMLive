-- ==============================================================================
-- Migration: 20260924_panel_ops_and_qcom
-- Non-destructive schema migration to create BuggyDM panel, operations,
-- and qcom tables, and add required columns to core tables.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- AlterTable
ALTER TABLE `admins` ADD COLUMN `department_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `designation` VARCHAR(100) NULL,
    ADD COLUMN `device_binding_id` VARCHAR(100) NULL,
    ADD COLUMN `organization_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `shift_status` VARCHAR(50) NOT NULL DEFAULT 'Offline';

-- AlterTable
ALTER TABLE `carts` ADD COLUMN `reel_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `store_id` BIGINT UNSIGNED NULL;

-- AlterTable
ALTER TABLE `delivery_men` ADD COLUMN `last_ping_at` TIMESTAMP(0) NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL,
    ADD COLUMN `max_active_orders` INTEGER NULL DEFAULT 2,
    ADD COLUMN `max_volume_cm3` DOUBLE NULL DEFAULT 30000.0,
    ADD COLUMN `rating` DOUBLE NULL DEFAULT 5.0,
    ADD COLUMN `shift_status` VARCHAR(50) NULL DEFAULT 'Offline',
    ADD COLUMN `vehicle_type` VARCHAR(50) NULL DEFAULT 'bike',
    MODIFY `identity_image` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `email_verifications` ADD COLUMN `sub_tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `expenses` ADD COLUMN `ride_id` BIGINT UNSIGNED NULL;

-- AlterTable
ALTER TABLE `items` ADD COLUMN `is_fragile` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `store_category_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `temp_zone` VARCHAR(30) NOT NULL DEFAULT 'Ambient',
    ADD COLUMN `video` VARCHAR(191) NULL,
    ADD COLUMN `video_link` TEXT NULL,
    ADD COLUMN `volume_cm3` DOUBLE NOT NULL DEFAULT 1000.0;

-- AlterTable
ALTER TABLE `messages` MODIFY `file` TEXT NULL;

-- AlterTable
ALTER TABLE `modules` ADD COLUMN `short_description` VARCHAR(1000) NULL;

-- AlterTable
ALTER TABLE `notification_settings` MODIFY `type` ENUM('admin', 'customer', 'store', 'deliveryman', 'provider') NULL DEFAULT 'admin';

-- AlterTable
ALTER TABLE `order_transactions` ADD COLUMN `pro_delivery_discount` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `pro_discount` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `orders` ADD COLUMN `assigned_store_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `batch_id` VARCHAR(50) NULL,
    ADD COLUMN `delivery_type` VARCHAR(32) NULL,
    ADD COLUMN `delivery_type_charge` DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
    ADD COLUMN `is_hidden` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `qcom_stage` VARCHAR(50) NOT NULL DEFAULT 'Queue',
    ADD COLUMN `sla_deadline` TIMESTAMP(0) NULL,
    MODIFY `order_attachment` TEXT NULL,
    MODIFY `order_proof` TEXT NULL;

-- AlterTable
ALTER TABLE `password_resets` ADD COLUMN `sub_tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `pharmacy_item_details` ADD COLUMN `manufacturer` VARCHAR(255) NULL,
    ADD COLUMN `unit_value` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `phone_verifications` ADD COLUMN `sub_tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `store_configs` ADD COLUMN `can_edit_order` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `has_seen_verified_badge_popup` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `show_low_stock_count` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `verified_seller` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `website_builder_status` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `stores` ADD COLUMN `capacity_orders` INTEGER NULL DEFAULT 100,
    ADD COLUMN `code` VARCHAR(50) NULL,
    ADD COLUMN `geofence_json` TEXT NULL,
    ADD COLUMN `manager_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `organization_id` BIGINT UNSIGNED NULL;

-- AlterTable
ALTER TABLE `temp_products` ADD COLUMN `store_category_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `video` VARCHAR(191) NULL,
    ADD COLUMN `video_link` TEXT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `pro_status` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `sub_tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN `tenant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `zones` ADD COLUMN `is_default` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `_panel_price_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `new_price` DECIMAL(24, 2) NOT NULL,
    `old_price` DECIMAL(24, 2) NOT NULL,
    `start_time` TIMESTAMP(0) NULL,
    `end_time` TIMESTAMP(0) NULL,
    `status` VARCHAR(20) NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `item_id`(`item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `admin_id` BIGINT UNSIGNED NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `table_name` VARCHAR(100) NOT NULL,
    `record_id` BIGINT UNSIGNED NOT NULL,
    `old_value` LONGTEXT NULL,
    `new_value` LONGTEXT NULL,
    `ip_address` VARCHAR(45) NOT NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module_zone_delivery_options` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `zone_id` BIGINT UNSIGNED NOT NULL,
    `delivery_type` ENUM('standard', 'express', 'slightly_delay') NOT NULL DEFAULT 'standard',
    `extra_charge` DECIMAL(10, 4) NULL,
    `reduce_charge` DECIMAL(10, 4) NULL,
    `add_delivery_time` INTEGER NULL,
    `reduce_delivery_time` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `mzdo_module_zone_idx`(`module_id`, `zone_id`),
    UNIQUE INDEX `mzdo_module_zone_type_unique`(`module_id`, `zone_id`, `delivery_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_order_reminders` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NULL,
    `order_id` BIGINT UNSIGNED NULL,
    `module_id` INTEGER UNSIGNED NULL,
    `module_type` VARCHAR(50) NULL,
    `zone_id` VARCHAR(255) NULL,
    `remind_at` DATE NULL,
    `dispatched_at` TIMESTAMP(0) NULL,
    `notified_at` TIMESTAMP(0) NULL,
    `status` ENUM('pending', 'sent', 'cancelled') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `monthly_order_reminders_remind_at_status_index`(`remind_at`, `status`),
    INDEX `monthly_order_reminders_user_id_order_id_index`(`user_id`, `order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_edit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `log` VARCHAR(255) NULL,
    `edited_by` ENUM('customer', 'admin', 'vendor', 'delivery_man') NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `order_edit_logs_order_id_index`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_pro_discounts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NULL,
    `trip_id` BIGINT UNSIGNED NULL,
    `ride_request_id` BIGINT UNSIGNED NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `subscription_id` BIGINT UNSIGNED NULL,
    `transaction_id` BIGINT UNSIGNED NULL,
    `plan_id` BIGINT UNSIGNED NULL,
    `benefit_type` ENUM('discount', 'delivery_fee', 'coupon') NOT NULL,
    `amount_saved` DOUBLE NOT NULL DEFAULT 0,
    `discount_percentage` DOUBLE NULL,
    `max_discount_amount` DOUBLE NULL,
    `min_order_amount` DOUBLE NULL,
    `delivery_offer_type` VARCHAR(32) NULL,
    `delivery_charge_discount_percentage` DOUBLE NULL,
    `delivery_fee_reduction_amount` DOUBLE NULL,
    `original_delivery_charge` DOUBLE NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `order_pro_discounts_benefit_type_index`(`benefit_type`),
    INDEX `order_pro_discounts_order_id_index`(`order_id`),
    INDEX `order_pro_discounts_plan_id_index`(`plan_id`),
    INDEX `order_pro_discounts_ride_request_id_index`(`ride_request_id`),
    INDEX `order_pro_discounts_subscription_id_index`(`subscription_id`),
    INDEX `order_pro_discounts_transaction_id_index`(`transaction_id`),
    INDEX `order_pro_discounts_trip_id_index`(`trip_id`),
    INDEX `order_pro_discounts_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pro_customer_benefit_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `benefit_type` VARCHAR(50) NOT NULL,
    `module_type` VARCHAR(50) NULL,
    `settings` JSON NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `pro_customer_benefit_settings_benefit_type_module_type_unique`(`benefit_type`, `module_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pro_customer_faqs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(150) NOT NULL,
    `answer` TEXT NOT NULL,
    `priority` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pro_customer_subscription_plans` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `plan_name` VARCHAR(191) NOT NULL,
    `plan_type` ENUM('free_trial', 'paid') NOT NULL DEFAULT 'paid',
    `price` DOUBLE NOT NULL DEFAULT 0,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pro_customer_subscriptions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `plan_id` BIGINT UNSIGNED NULL,
    `plan_name` VARCHAR(191) NOT NULL,
    `plan_type` ENUM('free_trial', 'paid') NOT NULL DEFAULT 'paid',
    `plan_price` DOUBLE NOT NULL DEFAULT 0,
    `start_at` DATETIME(0) NOT NULL,
    `end_at` DATETIME(0) NOT NULL,
    `status` ENUM('active', 'expired', 'canceled') NOT NULL DEFAULT 'active',
    `auto_renew` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `pro_customer_subscriptions_end_at_index`(`end_at`),
    INDEX `pro_customer_subscriptions_plan_id_index`(`plan_id`),
    INDEX `pro_customer_subscriptions_user_id_status_index`(`user_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pro_customer_transactions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `subscription_id` BIGINT UNSIGNED NULL,
    `plan_id` BIGINT UNSIGNED NULL,
    `transaction_reference` VARCHAR(191) NULL,
    `plan_name` VARCHAR(191) NOT NULL,
    `plan_type` ENUM('free_trial', 'paid') NOT NULL DEFAULT 'paid',
    `plan_price` DOUBLE NOT NULL DEFAULT 0,
    `amount` DOUBLE NOT NULL DEFAULT 0,
    `payment_method` VARCHAR(100) NULL,
    `payment_status` ENUM('success', 'pending', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    `start_at` DATETIME(0) NULL,
    `end_at` DATETIME(0) NULL,
    `order_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `paid_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `pro_customer_transactions_paid_at_index`(`paid_at`),
    INDEX `pro_customer_transactions_payment_method_index`(`payment_method`),
    INDEX `pro_customer_transactions_payment_status_index`(`payment_status`),
    INDEX `pro_customer_transactions_plan_id_index`(`plan_id`),
    INDEX `pro_customer_transactions_subscription_id_index`(`subscription_id`),
    INDEX `pro_customer_transactions_transaction_reference_index`(`transaction_reference`),
    INDEX `pro_customer_transactions_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `search_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `keyword` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `guest_id` VARCHAR(255) NULL,
    `module_id` INTEGER UNSIGNED NOT NULL,
    `zone_id` VARCHAR(255) NOT NULL,
    `result_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `search_logs_keyword_module_id_zone_id_index`(`keyword`, `module_id`, `zone_id`),
    INDEX `search_logs_module_id_zone_id_created_at_index`(`module_id`, `zone_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `smart_banners` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `zone_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NULL,
    `active_days` ENUM('everyday', 'custom_date') NOT NULL DEFAULT 'custom_date',
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `start_time` TIME(0) NULL,
    `end_time` TIME(0) NULL,
    `position` VARCHAR(32) NOT NULL DEFAULT 'top',
    `redirect_type` ENUM('category', 'module_home', 'store_page', 'offer_page') NOT NULL DEFAULT 'category',
    `redirect_target_id` BIGINT UNSIGNED NULL,
    `image` VARCHAR(191) NULL,
    `status` BOOLEAN NOT NULL DEFAULT true,
    `created_by` VARCHAR(32) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `smart_banners_redirect_type_redirect_target_id_index`(`redirect_type`, `redirect_target_id`),
    INDEX `smart_banners_zone_id_position_start_date_end_date_index`(`zone_id`, `position`, `start_date`, `end_date`),
    INDEX `smart_banners_zone_id_status_index`(`zone_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `store_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NULL,
    `module_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NULL,
    `image` VARCHAR(255) NULL,
    `priority` TINYINT NOT NULL DEFAULT 0,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `store_categories_slug_unique`(`slug`),
    INDEX `store_categories_module_id_foreign`(`module_id`),
    INDEX `store_categories_store_id_foreign`(`store_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_files` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `storage` VARCHAR(255) NOT NULL DEFAULT 'public',
    `mime_type` VARCHAR(255) NULL,
    `type` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `user_files_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panel_saved_reports` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `config` TEXT NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panel_dashboard_preferences` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_id` BIGINT UNSIGNED NOT NULL,
    `layout` TEXT NOT NULL,
    `theme` VARCHAR(50) NOT NULL DEFAULT 'dark',
    `landing_pg` VARCHAR(255) NOT NULL DEFAULT '/orders',

    UNIQUE INDEX `panel_dashboard_preferences_admin_id_unique`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panel_ai_recommendations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `suggestion` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `metadata` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panel_search_trends` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `search_query` VARCHAR(255) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `last_searched` TIMESTAMP(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panel_bi_caches` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `metric_key` VARCHAR(100) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `panel_bi_caches_metric_key_unique`(`metric_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panel_dashboard_alerts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `panel_worker_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `worker` VARCHAR(100) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `error_msg` TEXT NULL,
    `duration` INTEGER NOT NULL,
    `created_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_item_racks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `rack_code` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `panel_item_racks_item_id_unique`(`item_id`),
    INDEX `_panel_item_racks_rack_code_idx`(`rack_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_pick_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `picker_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'picking',
    `started_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` TIMESTAMP(0) NULL,
    `walking_distance` FLOAT NOT NULL DEFAULT 0.0,

    INDEX `_panel_pick_sessions_order_id_idx`(`order_id`),
    INDEX `_panel_pick_sessions_picker_id_idx`(`picker_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_pick_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `pick_session_id` BIGINT UNSIGNED NOT NULL,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INTEGER NOT NULL,
    `picked_qty` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
    `replacement_item_id` BIGINT UNSIGNED NULL,
    `rack_code` VARCHAR(50) NULL,

    INDEX `_panel_pick_items_pick_session_id_idx`(`pick_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_pack_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `packer_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'packing',
    `started_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` TIMESTAMP(0) NULL,
    `packaging_type` VARCHAR(50) NOT NULL,
    `weight` FLOAT NOT NULL DEFAULT 0.0,

    INDEX `_panel_pack_sessions_order_id_idx`(`order_id`),
    INDEX `_panel_pack_sessions_packer_id_idx`(`packer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_packages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `package_id` VARCHAR(100) NOT NULL,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `pack_session_id` BIGINT UNSIGNED NOT NULL,
    `weight` FLOAT NOT NULL,
    `barcode` VARCHAR(255) NOT NULL,
    `qr_code` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'packed',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `_panel_packages_package_id_key`(`package_id`),
    INDEX `_panel_packages_order_id_idx`(`order_id`),
    INDEX `_panel_packages_pack_session_id_idx`(`pack_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_package_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `package_id` BIGINT UNSIGNED NOT NULL,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INTEGER NOT NULL,

    INDEX `_panel_package_items_package_id_idx`(`package_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_qc_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `package_id` BIGINT UNSIGNED NOT NULL,
    `checker_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `checked_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `correct_products` BOOLEAN NOT NULL DEFAULT true,
    `correct_quantity` BOOLEAN NOT NULL DEFAULT true,
    `seal_checked` BOOLEAN NOT NULL DEFAULT true,
    `label_printed` BOOLEAN NOT NULL DEFAULT true,
    `temp_items_checked` BOOLEAN NOT NULL DEFAULT true,
    `fragile_items_checked` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,

    INDEX `_panel_qc_sessions_package_id_idx`(`package_id`),
    INDEX `_panel_qc_sessions_checker_id_idx`(`checker_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_dispatch_racks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_dispatch` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `package_id` BIGINT UNSIGNED NOT NULL,
    `dispatcher_id` BIGINT UNSIGNED NOT NULL,
    `rack_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'staged',
    `dispatched_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `_panel_dispatch_package_id_idx`(`package_id`),
    INDEX `_panel_dispatch_dispatcher_id_idx`(`dispatcher_id`),
    INDEX `_panel_dispatch_rack_id_idx`(`rack_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_rider_handover` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `rider_id` BIGINT UNSIGNED NOT NULL,
    `package_id` BIGINT UNSIGNED NOT NULL,
    `handover_by` BIGINT UNSIGNED NOT NULL,
    `handed_over_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `_panel_rider_handover_rider_id_idx`(`rider_id`),
    INDEX `_panel_rider_handover_package_id_idx`(`package_id`),
    INDEX `_panel_rider_handover_handover_by_idx`(`handover_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_returns` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `package_id` BIGINT UNSIGNED NULL,
    `reason` TEXT NOT NULL,
    `images` TEXT NULL,
    `action` VARCHAR(50) NOT NULL,
    `processed_by` BIGINT UNSIGNED NOT NULL,
    `processed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `_panel_returns_order_id_idx`(`order_id`),
    INDEX `_panel_returns_package_id_idx`(`package_id`),
    INDEX `_panel_returns_processed_by_idx`(`processed_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_offline_sync` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `device_id` VARCHAR(100) NOT NULL,
    `action_type` VARCHAR(50) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `error_log` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `_panel_offline_sync_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_device_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `device_id` VARCHAR(100) NOT NULL,
    `device_info` TEXT NOT NULL,
    `log_level` VARCHAR(20) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_order_workflow` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_by` BIGINT UNSIGNED NOT NULL,
    `notes` TEXT NULL,

    INDEX `_panel_order_workflow_order_id_idx`(`order_id`),
    INDEX `_panel_order_workflow_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_station_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_id` BIGINT UNSIGNED NOT NULL,
    `station_type` VARCHAR(50) NOT NULL,
    `station_identifier` VARCHAR(100) NULL,
    `assigned_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` VARCHAR(20) NOT NULL DEFAULT 'active',

    INDEX `_panel_station_assignments_admin_id_idx`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_shift_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_id` BIGINT UNSIGNED NOT NULL,
    `shift_start` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `shift_end` TIMESTAMP(0) NULL,
    `device_id` VARCHAR(100) NOT NULL,

    INDEX `_panel_shift_logs_admin_id_idx`(`admin_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_printer_queue` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `printer_id` VARCHAR(100) NOT NULL,
    `package_id` BIGINT UNSIGNED NULL,
    `label_type` VARCHAR(50) NOT NULL,
    `raw_content` LONGTEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `printed_at` TIMESTAMP(0) NULL,

    INDEX `_panel_printer_queue_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_notification_queue` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(50) NOT NULL,
    `message` TEXT NOT NULL,
    `recipient_role` VARCHAR(50) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `_panel_notification_queue_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_scan_history` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `admin_id` BIGINT UNSIGNED NOT NULL,
    `barcode_scanned` VARCHAR(255) NOT NULL,
    `scan_type` VARCHAR(50) NOT NULL,
    `scanned_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `is_success` BOOLEAN NOT NULL DEFAULT true,
    `device_id` VARCHAR(100) NOT NULL,

    INDEX `_panel_scan_history_admin_id_idx`(`admin_id`),
    INDEX `_panel_scan_history_barcode_scanned_idx`(`barcode_scanned`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_panel_exception_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NULL,
    `package_id` BIGINT UNSIGNED NULL,
    `exception_type` VARCHAR(100) NOT NULL,
    `details` TEXT NOT NULL,
    `reported_by` BIGINT UNSIGNED NOT NULL,
    `reported_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `resolved_by` BIGINT UNSIGNED NULL,
    `resolved_at` TIMESTAMP(0) NULL,
    `resolution_action` TEXT NULL,

    INDEX `_panel_exception_logs_order_id_idx`(`order_id`),
    INDEX `_panel_exception_logs_exception_type_idx`(`exception_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ops_navigation` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `parent_id` BIGINT UNSIGNED NULL,
    `title` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `route` VARCHAR(255) NOT NULL,
    `icon` VARCHAR(100) NULL,
    `description` VARCHAR(255) NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'Operations',
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `badge_provider` VARCHAR(100) NULL,
    `badge_refresh_interval` INTEGER NOT NULL DEFAULT 30,
    `feature_flag` VARCHAR(100) NULL,
    `minimum_role` INTEGER NOT NULL DEFAULT 0,
    `permissions` TEXT NULL,
    `supports_offline` BOOLEAN NOT NULL DEFAULT true,
    `tenant_id` BIGINT UNSIGNED NULL,
    `warehouse_id` BIGINT UNSIGNED NULL,
    `platform` VARCHAR(50) NOT NULL DEFAULT 'all',
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `ops_navigation_slug_key`(`slug`),
    INDEX `ops_navigation_parent_id_idx`(`parent_id`),
    INDEX `ops_navigation_category_idx`(`category`),
    INDEX `ops_navigation_display_order_idx`(`display_order`),
    INDEX `ops_navigation_is_enabled_idx`(`is_enabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ops_navigation_roles` (
    `navigation_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`navigation_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ops_navigation_permissions` (
    `navigation_id` BIGINT UNSIGNED NOT NULL,
    `permission_key` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`navigation_id`, `permission_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ops_navigation_features` (
    `navigation_id` BIGINT UNSIGNED NOT NULL,
    `feature_key` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`navigation_id`, `feature_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qcom_organizations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `tax_id` VARCHAR(100) NULL,
    `settings` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `qcom_organizations_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qcom_organizational_hierarchy` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `level_type` VARCHAR(50) NOT NULL,
    `parent_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qcom_rbac_roles_permissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_key` VARCHAR(100) NOT NULL,
    `approval_level` INTEGER NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `qcom_rbac_roles_permissions_role_id_idx`(`role_id`),
    INDEX `qcom_rbac_roles_permissions_permission_key_idx`(`permission_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qcom_store_topology` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `zone` VARCHAR(50) NOT NULL,
    `rack_code` VARCHAR(50) NOT NULL,
    `shelf` VARCHAR(50) NOT NULL,
    `bin_code` VARCHAR(50) NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `qcom_store_topology_bin_code_key`(`bin_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qcom_store_inventory` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `store_id` BIGINT UNSIGNED NOT NULL,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `bin_code` VARCHAR(50) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `reserved_qty` INTEGER NOT NULL DEFAULT 0,
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `qcom_store_inventory_store_id_item_id_bin_code_key`(`store_id`, `item_id`, `bin_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qcom_rider_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `rider_id` BIGINT UNSIGNED NOT NULL,
    `check_in_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `check_out_at` TIMESTAMP(0) NULL,
    `orders_completed` INTEGER NOT NULL DEFAULT 0,
    `orders_accepted` INTEGER NOT NULL DEFAULT 0,
    `orders_rejected` INTEGER NOT NULL DEFAULT 0,
    `acceptance_rate` DOUBLE NOT NULL DEFAULT 100.0,
    `payout_total` DECIMAL(24, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qcom_payout_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `rider_id` BIGINT UNSIGNED NOT NULL,
    `order_id` BIGINT UNSIGNED NULL,
    `base_pay` DECIMAL(24, 2) NOT NULL DEFAULT 0.00,
    `extra_dist_pay` DECIMAL(24, 2) NOT NULL DEFAULT 0.00,
    `peak_surge` DECIMAL(24, 2) NOT NULL DEFAULT 0.00,
    `weather_surge` DECIMAL(24, 2) NOT NULL DEFAULT 0.00,
    `milestone_bonus` DECIMAL(24, 2) NOT NULL DEFAULT 0.00,
    `total_payout` DECIMAL(24, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `carts_reel_id_index` ON `carts`(`reel_id`);

-- CreateIndex
CREATE INDEX `carts_store_id_foreign` ON `carts`(`store_id`);

-- CreateIndex
CREATE INDEX `categories_name_index` ON `categories`(`name`);

-- CreateIndex
CREATE INDEX `categories_parent_id_index` ON `categories`(`parent_id`);

-- CreateIndex
CREATE INDEX `delivery_histories_delivery_man_id_index` ON `delivery_histories`(`delivery_man_id`);

-- CreateIndex
CREATE INDEX `delivery_man_wallets_delivery_man_id_index` ON `delivery_man_wallets`(`delivery_man_id`);

-- CreateIndex
CREATE INDEX `delivery_men_vehicle_id_index` ON `delivery_men`(`vehicle_id`);

-- CreateIndex
CREATE INDEX `delivery_men_zone_id_index` ON `delivery_men`(`zone_id`);

-- CreateIndex
CREATE INDEX `email_verifications_scope_index` ON `email_verifications`(`tenant_id`, `sub_tenant_id`);

-- CreateIndex
CREATE INDEX `items_avg_rating_index` ON `items`(`avg_rating`);

-- CreateIndex
CREATE INDEX `items_category_id_index` ON `items`(`category_id`);

-- CreateIndex
CREATE INDEX `items_created_at_index` ON `items`(`created_at`);

-- CreateIndex
CREATE INDEX `items_name_index` ON `items`(`name`);

-- CreateIndex
CREATE INDEX `items_order_count_index` ON `items`(`order_count`);

-- CreateIndex
CREATE INDEX `items_price_index` ON `items`(`price`);

-- CreateIndex
CREATE INDEX `items_slug_index` ON `items`(`slug`);

-- CreateIndex
CREATE INDEX `items_store_category_id_foreign` ON `items`(`store_category_id`);

-- CreateIndex
CREATE INDEX `items_store_id_index` ON `items`(`store_id`);

-- CreateIndex
CREATE INDEX `order_details_item_id_index` ON `order_details`(`item_id`);

-- CreateIndex
CREATE INDEX `order_details_order_id_index` ON `order_details`(`order_id`);

-- CreateIndex
CREATE INDEX `order_payments_order_id_index` ON `order_payments`(`order_id`);

-- CreateIndex
CREATE INDEX `order_transactions_order_id_index` ON `order_transactions`(`order_id`);

-- CreateIndex
CREATE INDEX `orders_delivery_man_id_index` ON `orders`(`delivery_man_id`);

-- CreateIndex
CREATE INDEX `orders_delivery_type_idx` ON `orders`(`delivery_type`);

-- CreateIndex
CREATE INDEX `orders_order_status_index` ON `orders`(`order_status`);

-- CreateIndex
CREATE INDEX `orders_store_id_index` ON `orders`(`store_id`);

-- CreateIndex
CREATE INDEX `orders_user_id_index` ON `orders`(`user_id`);

-- CreateIndex
CREATE INDEX `password_resets_scope_index` ON `password_resets`(`tenant_id`, `sub_tenant_id`);

-- CreateIndex
CREATE INDEX `phone_verifications_scope_index` ON `phone_verifications`(`tenant_id`, `sub_tenant_id`);

-- CreateIndex
CREATE UNIQUE INDEX `phone_verifications_phone_scope_unique` ON `phone_verifications`(`phone`, `tenant_id`, `sub_tenant_id`);

-- CreateIndex
CREATE INDEX `reviews_item_campaign_id_index` ON `reviews`(`item_campaign_id`);

-- CreateIndex
CREATE INDEX `reviews_item_id_index` ON `reviews`(`item_id`);

-- CreateIndex
CREATE INDEX `reviews_order_id_index` ON `reviews`(`order_id`);

-- CreateIndex
CREATE INDEX `reviews_review_id_index` ON `reviews`(`review_id`);

-- CreateIndex
CREATE INDEX `reviews_store_id_index` ON `reviews`(`store_id`);

-- CreateIndex
CREATE INDEX `reviews_user_id_index` ON `reviews`(`user_id`);

-- CreateIndex
CREATE INDEX `store_configs_store_id_index` ON `store_configs`(`store_id`);

-- CreateIndex
CREATE INDEX `store_notification_settings_module_type_index` ON `store_notification_settings`(`module_type`);

-- CreateIndex
CREATE INDEX `store_notification_settings_store_id_index` ON `store_notification_settings`(`store_id`);

-- CreateIndex
CREATE INDEX `store_wallets_vendor_id_index` ON `store_wallets`(`vendor_id`);

-- CreateIndex
CREATE UNIQUE INDEX `stores_code_key` ON `stores`(`code`);

-- CreateIndex
CREATE INDEX `stores_slug_index` ON `stores`(`slug`);

-- CreateIndex
CREATE INDEX `stores_store_business_model_index` ON `stores`(`store_business_model`);

-- CreateIndex
CREATE INDEX `stores_vendor_id_index` ON `stores`(`vendor_id`);

-- CreateIndex
CREATE INDEX `stores_zone_id_index` ON `stores`(`zone_id`);

-- CreateIndex
CREATE INDEX `temp_products_store_category_id_foreign` ON `temp_products`(`store_category_id`);

-- CreateIndex
CREATE INDEX `users_scope_index` ON `users`(`tenant_id`, `sub_tenant_id`);

-- CreateIndex
CREATE UNIQUE INDEX `users_email_scope_unique` ON `users`(`email`, `tenant_id`, `sub_tenant_id`);

-- CreateIndex
CREATE UNIQUE INDEX `users_phone_scope_unique` ON `users`(`phone`, `tenant_id`, `sub_tenant_id`);

-- CreateIndex
CREATE UNIQUE INDEX `users_ref_code_scope_unique` ON `users`(`ref_code`, `tenant_id`, `sub_tenant_id`);

-- CreateIndex
CREATE INDEX `wishlists_item_id_index` ON `wishlists`(`item_id`);

-- CreateIndex
CREATE INDEX `wishlists_store_id_index` ON `wishlists`(`store_id`);

-- CreateIndex
CREATE INDEX `wishlists_user_id_index` ON `wishlists`(`user_id`);

-- AddForeignKey
ALTER TABLE `carts` ADD CONSTRAINT `carts_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_store_category_id_foreign` FOREIGN KEY (`store_category_id`) REFERENCES `store_categories`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `stores` ADD CONSTRAINT `stores_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `qcom_organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `temp_products` ADD CONSTRAINT `temp_products_store_category_id_foreign` FOREIGN KEY (`store_category_id`) REFERENCES `store_categories`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_price_schedules` ADD CONSTRAINT `_panel_price_schedules_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `order_edit_logs` ADD CONSTRAINT `order_edit_logs_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `store_categories` ADD CONSTRAINT `store_categories_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `store_categories` ADD CONSTRAINT `store_categories_store_id_foreign` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_item_racks` ADD CONSTRAINT `panel_item_racks_item_id_foreign` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_pick_sessions` ADD CONSTRAINT `panel_pick_sessions_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_pick_sessions` ADD CONSTRAINT `panel_pick_sessions_picker_id_foreign` FOREIGN KEY (`picker_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_pick_items` ADD CONSTRAINT `panel_pick_items_session_id_foreign` FOREIGN KEY (`pick_session_id`) REFERENCES `_panel_pick_sessions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_pack_sessions` ADD CONSTRAINT `panel_pack_sessions_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_pack_sessions` ADD CONSTRAINT `panel_pack_sessions_packer_id_foreign` FOREIGN KEY (`packer_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_packages` ADD CONSTRAINT `panel_packages_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_packages` ADD CONSTRAINT `panel_packages_session_id_foreign` FOREIGN KEY (`pack_session_id`) REFERENCES `_panel_pack_sessions`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_package_items` ADD CONSTRAINT `panel_package_items_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `_panel_packages`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_qc_sessions` ADD CONSTRAINT `panel_qc_sessions_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `_panel_packages`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_qc_sessions` ADD CONSTRAINT `panel_qc_sessions_checker_id_foreign` FOREIGN KEY (`checker_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_dispatch` ADD CONSTRAINT `panel_dispatch_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `_panel_packages`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_dispatch` ADD CONSTRAINT `panel_dispatch_dispatcher_id_foreign` FOREIGN KEY (`dispatcher_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_dispatch` ADD CONSTRAINT `panel_dispatch_rack_id_foreign` FOREIGN KEY (`rack_id`) REFERENCES `_panel_dispatch_racks`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_rider_handover` ADD CONSTRAINT `panel_rider_handover_rider_id_foreign` FOREIGN KEY (`rider_id`) REFERENCES `delivery_men`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_rider_handover` ADD CONSTRAINT `panel_rider_handover_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `_panel_packages`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_rider_handover` ADD CONSTRAINT `panel_rider_handover_handover_by_foreign` FOREIGN KEY (`handover_by`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_returns` ADD CONSTRAINT `panel_returns_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_returns` ADD CONSTRAINT `panel_returns_package_id_foreign` FOREIGN KEY (`package_id`) REFERENCES `_panel_packages`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_returns` ADD CONSTRAINT `panel_returns_processed_by_foreign` FOREIGN KEY (`processed_by`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_order_workflow` ADD CONSTRAINT `panel_workflows_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_order_workflow` ADD CONSTRAINT `panel_workflows_operator_id_foreign` FOREIGN KEY (`updated_by`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_station_assignments` ADD CONSTRAINT `panel_stations_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_shift_logs` ADD CONSTRAINT `panel_shifts_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_scan_history` ADD CONSTRAINT `panel_scans_admin_id_foreign` FOREIGN KEY (`admin_id`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_exception_logs` ADD CONSTRAINT `panel_exceptions_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_exception_logs` ADD CONSTRAINT `panel_exceptions_reporter_foreign` FOREIGN KEY (`reported_by`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `_panel_exception_logs` ADD CONSTRAINT `panel_exceptions_resolver_foreign` FOREIGN KEY (`resolved_by`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ops_navigation` ADD CONSTRAINT `ops_navigation_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `ops_navigation`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ops_navigation_roles` ADD CONSTRAINT `ops_navigation_roles_navigation_id_fkey` FOREIGN KEY (`navigation_id`) REFERENCES `ops_navigation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ops_navigation_permissions` ADD CONSTRAINT `ops_navigation_permissions_navigation_id_fkey` FOREIGN KEY (`navigation_id`) REFERENCES `ops_navigation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ops_navigation_features` ADD CONSTRAINT `ops_navigation_features_navigation_id_fkey` FOREIGN KEY (`navigation_id`) REFERENCES `ops_navigation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcom_organizational_hierarchy` ADD CONSTRAINT `qcom_organizational_hierarchy_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `qcom_organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcom_organizational_hierarchy` ADD CONSTRAINT `qcom_organizational_hierarchy_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `qcom_organizational_hierarchy`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `qcom_store_topology` ADD CONSTRAINT `qcom_store_topology_store_id_fkey` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcom_store_inventory` ADD CONSTRAINT `qcom_store_inventory_store_id_fkey` FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcom_store_inventory` ADD CONSTRAINT `qcom_store_inventory_bin_code_fkey` FOREIGN KEY (`bin_code`) REFERENCES `qcom_store_topology`(`bin_code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcom_store_inventory` ADD CONSTRAINT `qcom_store_inventory_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcom_rider_sessions` ADD CONSTRAINT `qcom_rider_sessions_rider_id_fkey` FOREIGN KEY (`rider_id`) REFERENCES `delivery_men`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcom_payout_logs` ADD CONSTRAINT `qcom_payout_logs_rider_id_fkey` FOREIGN KEY (`rider_id`) REFERENCES `delivery_men`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcos_scheduled_publications` ADD CONSTRAINT `qcos_scheduled_publications_page_version_id_fkey` FOREIGN KEY (`page_version_id`) REFERENCES `qcos_page_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qcos_scheduled_publications` ADD CONSTRAINT `qcos_scheduled_publications_channel_id_fkey` FOREIGN KEY (`channel_id`) REFERENCES `qcos_release_channels`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `qcos_scheduled_publications` RENAME INDEX `qcos_scheduled_publications_page_channel_idx` TO `qcos_scheduled_publications_page_version_id_channel_id_idx`;

SET FOREIGN_KEY_CHECKS = 1;
