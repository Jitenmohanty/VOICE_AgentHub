export interface AgentConfigField {
  id: string;
  label: string;
  type: "text" | "select" | "multi-select" | "number" | "textarea" | "toggle" | "time";
  options?: string[];
  defaultValue?: string | string[] | number | boolean;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  section?: string;
}

export interface AgentDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accentColor: string;
  capabilities: string[];
  configFields: AgentConfigField[];
}

export interface AgentConfig {
  [key: string]: string | string[] | number | boolean;
}
