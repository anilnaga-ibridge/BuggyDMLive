import { prisma } from "@/lib/prisma";
import type { FestivalTheme, FestivalAsset } from "./types";
import { createEmptyFestivalTheme } from "./types";
import { festivalThemeSchema, sanitizeSvgContent, validateAssetUpload } from "./schema";

const FESTIVAL_THEME_TOKEN_PREFIX = "sys.festival.theme.";
const FESTIVAL_ACTIVE_KEY = "sys.festival.active_id";

export class FestivalThemeService {
  /**
   * List all saved festival themes
   */
  static async listFestivalThemes(): Promise<FestivalTheme[]> {
    try {
      const tokens = await prisma.qcos_design_tokens.findMany({
        where: {
          token_key: { startsWith: FESTIVAL_THEME_TOKEN_PREFIX },
        },
      });

      const list: FestivalTheme[] = [];
      for (const tok of tokens) {
        try {
          const parsed = JSON.parse(tok.token_value);
          const validated = festivalThemeSchema.safeParse(parsed);
          if (validated.success) {
            list.push(validated.data as FestivalTheme);
          }
        } catch {
          // ignore corrupted single entry
        }
      }

      if (!list.some((t) => t.id === "festival_diwali_2026")) {
        const { createDiwali2026FestivalTheme } = await import("./types");
        const defaultDiwali = createDiwali2026FestivalTheme();
        await this.saveFestivalTheme(defaultDiwali);
        list.unshift(defaultDiwali);
      }

      return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } catch {
      const { createDiwali2026FestivalTheme } = await import("./types");
      return [createDiwali2026FestivalTheme()];
    }
  }

  /**
   * Get a specific festival theme by ID
   */
  static async getFestivalTheme(id: string): Promise<FestivalTheme | null> {
    try {
      const tok = await prisma.qcos_design_tokens.findFirst({
        where: { token_key: `${FESTIVAL_THEME_TOKEN_PREFIX}${id}` },
      });
      if (!tok) return null;
      const parsed = JSON.parse(tok.token_value);
      const val = festivalThemeSchema.safeParse(parsed);
      return val.success ? (val.data as FestivalTheme) : null;
    } catch {
      return null;
    }
  }

  /**
   * Save or update a festival theme
   */
  static async saveFestivalTheme(theme: FestivalTheme): Promise<{ success: boolean; error?: string }> {
    const validated = festivalThemeSchema.safeParse(theme);
    if (!validated.success) {
      return {
        success: false,
        error: `Validation failed: ${validated.error.issues.map((e: any) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      };
    }

    try {
      const activeTheme = await prisma.qcos_themes.findFirst({ where: { is_active: true } });
      const themeId = activeTheme?.id || 1;
      const tokenKey = `${FESTIVAL_THEME_TOKEN_PREFIX}${theme.id}`;

      await prisma.qcos_design_tokens.deleteMany({
        where: { token_key: tokenKey },
      });

      await prisma.qcos_design_tokens.create({
        data: {
          theme_id: themeId,
          token_key: tokenKey,
          token_value: JSON.stringify(theme),
          category: "festival_theme",
        },
      });

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to save festival theme to database" };
    }
  }

  /**
   * Find the currently active published festival campaign based on server clock / target time
   */
  static async findActiveFestival(evaluationTime?: string | Date): Promise<FestivalTheme | null> {
    try {
      const all = await this.listFestivalThemes();
      const published = all.filter((t) => t.status === "published");
      const { isFestivalScheduleActive } = await import("./resolver");

      const activeCandidates = published.filter((theme) =>
        isFestivalScheduleActive(theme.schedule, theme.status, evaluationTime)
      );

      if (activeCandidates.length === 0) return null;

      // Sort by priority (default: 1) descending, then by updatedAt descending
      activeCandidates.sort((a, b) => {
        const pA = a.schedule.priority ?? 1;
        const pB = b.schedule.priority ?? 1;
        if (pB !== pA) return pB - pA;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      return activeCandidates[0];
    } catch {
      return null;
    }
  }

  /**
   * Publish a festival theme campaign
   */
  static async publishFestivalTheme(id: string): Promise<{ success: boolean; error?: string }> {
    const theme = await this.getFestivalTheme(id);
    if (!theme) return { success: false, error: "Festival campaign not found" };

    theme.status = "published";
    theme.schedule.status = "active";
    theme.updatedAt = new Date().toISOString();

    return await this.saveFestivalTheme(theme);
  }

  /**
   * Unpublish / Revert a festival theme campaign back to draft
   */
  static async unpublishFestivalTheme(id: string): Promise<{ success: boolean }> {
    const theme = await this.getFestivalTheme(id);
    if (!theme) return { success: false };

    theme.status = "draft";
    theme.schedule.status = "draft";
    theme.updatedAt = new Date().toISOString();

    const res = await this.saveFestivalTheme(theme);
    return { success: res.success };
  }

  /**
   * Delete a festival theme
   */
  static async deleteFestivalTheme(id: string): Promise<{ success: boolean }> {
    try {
      await prisma.qcos_design_tokens.deleteMany({
        where: { token_key: `${FESTIVAL_THEME_TOKEN_PREFIX}${id}` },
      });
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}
