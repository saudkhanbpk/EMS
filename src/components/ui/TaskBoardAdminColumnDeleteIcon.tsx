import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2Icon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';

function TaskBoardAdminColumnDeleteIcon({
  columnTitle,
  prevColumnTitle,
  prevColumnId,
  onDeleteColumn,
}: {
  columnTitle: string;
  prevColumnTitle?: string | null;
  prevColumnId?: string | null;
  onDeleteColumn: (moveTasks: boolean) => void;
}) {
  const [moveChecked, setMoveChecked] = useState(false);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700"
        >
          <Trash2Icon className="h-5 w-5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            <span className="font-bold text-black"> {columnTitle} </span>column.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {prevColumnTitle && (
          <div className="flex items-center space-x-2 text-sm text-gray-500 ">
            <Checkbox checked={moveChecked} onCheckedChange={setMoveChecked} />
            <span>
              Do you want to move all tasks to{' '}
              <span className="font-semibold text-black">
                {prevColumnTitle}
              </span>
              .
            </span>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDeleteColumn(moveChecked)}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default TaskBoardAdminColumnDeleteIcon;
