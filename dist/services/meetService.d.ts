export declare const scopes: string[];
export declare function getAuthUrl(): string;
export declare function getTokenFromCode(code: string): Promise<any>;
export declare function setCredentials(tokens: any): void;
export declare function createMeetEvent(accessToken: string, summary: string, description: string, startTime: Date, endTime: Date, attendees: string[]): Promise<{
    meetLink: string;
    eventId: string;
}>;
export declare function getUpcomingMeetings(accessToken: string): Promise<any[]>;
//# sourceMappingURL=meetService.d.ts.map