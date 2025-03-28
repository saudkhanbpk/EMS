import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Image, FileImage } from 'lucide-react';

interface Screenshot {
  id: string;
  timestamp: string;
  path: string;
}

interface ScreenshotGalleryProps {
  screenshots: Screenshot[];
  isLoading: boolean;
}

export default function ScreenshotGallery({ screenshots, isLoading }: ScreenshotGalleryProps) {
  const formatTimestamp = (timestamp: string) => {
    try {
      // Parse ISO string to Date object
      const date = parseISO(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown time';
    }
  };

  const formatTimeString = (timestamp: string) => {
    try {
      const date = parseISO(timestamp);
      return date.toLocaleTimeString();
    } catch (error) {
      console.error('Error formatting time string:', error);
      return 'Unknown time';
    }
  };

  return (
    <Card className="w-full h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image size={20} />
          Recent Screenshots
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <div className="animate-spin mb-2">
              <FileImage size={24} />
            </div>
            <p>Loading screenshots...</p>
          </div>
        ) : screenshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FileImage size={48} className="mb-2 opacity-50" />
            <p>No screenshots taken yet</p>
            <p className="text-sm mt-1">Screenshots will appear here once tracking begins</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid grid-cols-2 gap-4 auto-rows-fr">
              {screenshots.map((screenshot) => (
                <div key={screenshot.id} className="group relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={screenshot.path}
                    alt={`Screenshot from ${formatTimeString(screenshot.timestamp)}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = ''; // Clear the broken image
                      target.className = 'hidden';
                      target.parentElement!.classList.add('flex', 'items-center', 'justify-center');
                      const placeholder = document.createElement('div');
                      placeholder.className = 'text-muted-foreground flex items-center justify-center';
                      placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-image"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M4 14l4-4 8 8"/><path d="M14 14v-3l3 3"/></svg>';
                      target.parentElement!.appendChild(placeholder);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-center opacity-0 group-hover:opacity-100">
                    {/* <div className="text-white text-xs p-2 mb-2 bg-black/70 rounded-md">
                      {formatTimestamp(screenshot.timestamp)}
                    </div> */}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
