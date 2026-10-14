import { z } from "zod";

// Design Token Validation Schema
export const designTokenSchema = z.object({
  token_key: z.string().min(1).max(100),
  token_value: z.string().min(1).max(255),
  category: z.enum(["color", "spacing", "typography", "elevation"]),
});

// Theme Validation Schema
export const themeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(false),
  tokens: z.array(designTokenSchema).optional(),
});

// Media Library Validation Schema
export const mediaLibrarySchema = z.object({
  name: z.string().min(1).max(255),
  file_type: z.enum(["image", "svg", "video", "lottie", "font", "audio"]),
  url: z.string().url().max(512),
  responsive_urls: z.string().optional().nullable(), // JSON string
  size_bytes: z.number().int().nonnegative(),
  mime_type: z.string().min(1).max(100),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
});

// Widget Validation Schema
export const widgetSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  schema_def: z.string().min(1), // JSON schema validation string
  min_version: z.string().min(1).max(20),
  max_version: z.string().max(20).optional().nullable(),
  fallback_id: z.number().int().positive().optional().nullable(),
});

// Widget Instance Validation Schema
export const widgetInstanceSchema = z.object({
  section_id: z.number().int().positive(),
  widget_id: z.number().int().positive(),
  display_order: z.number().int().nonnegative(),
  properties_json: z.string().min(2), // JSON content
  data_source_id: z.number().int().positive().optional().nullable(),
});

// Widget Action Validation Schema
export const widgetActionSchema = z.object({
  widget_instance_id: z.number().int().positive(),
  trigger: z.string().min(1).max(50), // e.g. "on_click"
  action_type: z.string().min(1).max(100), // e.g. "OPEN_PRODUCT"
  params_json: z.string().min(2), // JSON representation of arguments
});

// Experience Rules Validation Schema
export const experienceRuleSchema = z.object({
  name: z.string().min(1).max(100),
  conditions_json: z.string().min(2),
  actions_json: z.string().min(2),
  is_active: z.boolean().default(true),
});

// Experience Context Validation Schema
export const experienceContextSchema = z.object({
  user_id: z.union([z.number(), z.string(), z.bigint()]),
  city: z.string().max(100).optional().nullable(),
  timezone: z.string().max(50).default("UTC"),
  device_type: z.string().max(50).default("mobile"),
  network_speed: z.string().max(20).optional().nullable(),
  preferred_categories: z.string().optional().nullable(),
  weather_code: z.string().max(50).optional().nullable(),
});

// Feature Flag Validation Schema
export const featureFlagSchema = z.object({
  flag_key: z.string().min(1).max(100),
  description: z.string().optional().nullable(),
  is_enabled: z.boolean().default(false),
  rules_json: z.string().optional().nullable(),
});
