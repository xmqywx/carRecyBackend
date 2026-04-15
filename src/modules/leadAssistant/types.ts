export interface LeadAssistantSession {
  id: string;
  departmentId: number;
  status: string;
  intakeText?: string;
  extractedDraft?: Record<string, any>;
  customerResolution?: Record<string, any>;
  vehicleResolution?: Record<string, any>;
  duplicateCheck?: Record<string, any>;
  scheduleResolution?: Record<string, any>;
  commitPreview?: Record<string, any>;
  expiresAt: number;
}
