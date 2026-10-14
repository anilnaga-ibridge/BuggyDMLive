DROP TABLE IF EXISTS `qcos_scheduled_publications`;
DROP TABLE IF EXISTS `qcos_role_permissions`;
DROP TABLE IF EXISTS `qcos_segments`;
DROP TABLE IF EXISTS `qcos_localizations`;

ALTER TABLE `qcos_publish_history`
  DROP COLUMN `publish_reason`,
  DROP COLUMN `rollout_pct`;

ALTER TABLE `qcos_media_library`
  DROP COLUMN `created_by`,
  DROP COLUMN `status`,
  DROP COLUMN `checksum_sha256`,
  DROP COLUMN `alt_text`;
