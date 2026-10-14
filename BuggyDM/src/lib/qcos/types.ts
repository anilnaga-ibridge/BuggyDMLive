export type SduiIdentifier = string | number | bigint;

export interface CompiledDesignToken {
  id: SduiIdentifier;
  theme_id: SduiIdentifier;
  token_key: string;
  token_value: string;
  category: string;
  created_at: Date | string | null;
}

export interface CompiledTheme {
  id: SduiIdentifier;
  name: string;
  tokens: CompiledDesignToken[];
}

export interface CompiledSection {
  id: SduiIdentifier;
  name: string;
  display_order: number;
  visibility_rules: string | null;
  constraints_json: string | null;
  widgets: unknown[];
}

export interface CompiledLayoutTree {
  layoutId: SduiIdentifier;
  layoutName: string;
  pageName: string;
  versionNumber: number;
  theme: CompiledTheme | null;
  sections: CompiledSection[];
}

export type LayoutPatch =
  | { op: "remove"; sectionId: SduiIdentifier }
  | { op: "add"; section: CompiledSection }
  | ({ op: "update"; sectionId: SduiIdentifier } & Omit<
      CompiledSection,
      "id"
    >);

export function isCompiledLayoutTree(
  value: unknown,
): value is CompiledLayoutTree {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<CompiledLayoutTree>;
  return (
    typeof candidate.layoutName === "string" &&
    typeof candidate.pageName === "string" &&
    typeof candidate.versionNumber === "number" &&
    Array.isArray(candidate.sections) &&
    candidate.sections.every(
      (section) =>
        typeof section === "object" &&
        section !== null &&
        typeof section.name === "string" &&
        typeof section.display_order === "number" &&
        Array.isArray(section.widgets),
    )
  );
}
