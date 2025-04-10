
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { History, Clock, Camera } from 'lucide-react';
import { format, formatDistance } from 'date-fns';

interface Session {
  id: string;
  startTime: string;
  endTime?: string;
  pauseHistory?: { pausedAt: string; resumedAt?: string; reason?: string }[];
  totalDuration?: number;
  screenshots: { id: string; timestamp: string }[];
}

interface SessionHistoryProps {
  sessions: Session[];
  onViewSession: (sessionId: string) => void;
}

export default function SessionHistory({ sessions, onViewSession }: SessionHistoryProps) {
  const formatDuration = (ms?: number) => {
    if (!ms) return '00:00:00';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const format = (val: number) => (val < 10 ? `0${val}` : val);

    return `${format(hours)}:${format(minutes)}:${format(seconds)}`;
  };

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History size={20} />
          Session History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <History size={48} className="mb-2 opacity-50" />
              <p>No tracking sessions yet</p>
              <p className="text-sm mt-1">Start tracking to create a session</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...sessions].reverse().map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        {format(new Date(session.startTime), 'MMM d, yyyy')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(session.startTime), 'h:mm a')}
                        {session.endTime ? ` - ${format(new Date(session.endTime), 'h:mm a')}` : ' (In progress)'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewSession(session.id)}
                    >
                      View
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">
                        {session.totalDuration
                          ? formatDuration(session.totalDuration)
                          : 'In progress'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Camera size={16} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Screenshots:</span>
                      <span className="font-medium">{session.screenshots.length}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
