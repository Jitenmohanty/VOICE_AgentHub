export interface AgentConfigField {
  id: string;
  label: string;
  type: "text" | "select" | "multi-select";
  options?: string[];
  defaultValue?: string | string[];
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
  [key: string]: string | string[];
}
