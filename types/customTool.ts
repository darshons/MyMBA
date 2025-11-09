export type CustomToolAuthType = 'none' | 'bearer' | 'apikey';

export interface CustomToolDefinition {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  authType?: CustomToolAuthType;
  authValue?: string;
}
