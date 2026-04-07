import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

export const scopes = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
];

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
}

export async function getTokenFromCode(code: string): Promise<any> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

export function setCredentials(tokens: any) {
  oauth2Client.setCredentials(tokens);
}

export async function createMeetEvent(
  accessToken: string,
  summary: string,
  description: string,
  startTime: Date,
  endTime: Date,
  attendees: string[]
): Promise<{ meetLink: string; eventId: string }> {
  oauth2Client.setCredentials({ access_token: accessToken });

  const event = {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'Asia/Karachi'
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'Asia/Karachi'
    },
    attendees: attendees.map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 }
      ]
    }
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all'
  });

  const meetLink = response.data.hangoutLink || 
    `https://meet.google.com/${generateMeetCode()}`;
  const eventId = response.data.id || '';

  return { meetLink, eventId };
}

function generateMeetCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segments = [];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join('-');
}

export async function getUpcomingMeetings(accessToken: string): Promise<any[]> {
  oauth2Client.setCredentials({ access_token: accessToken });

  const now = new Date().toISOString();
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now,
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime',
    q: 'meet'
  });

  return response.data.items || [];
}
