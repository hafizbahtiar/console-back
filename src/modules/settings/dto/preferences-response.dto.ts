export class PreferencesResponseDto {
    id: string;
    userId: string;
    // Appearance
    theme: string;
    language: string;
    // Date & Time
    dateFormat: string;
    timeFormat: string;
    timezone: string;
    // Dashboard
    defaultDashboardView: string;
    itemsPerPage: string;
    showWidgets: boolean;
    // Editor
    editorTheme: string;
    editorFontSize: number;
    editorLineHeight: number;
    editorTabSize: number;
    createdAt: Date;
    updatedAt: Date;
}

