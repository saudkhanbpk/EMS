import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

function AddColumnDialog({
  onAddColumn,
}: {
  onAddColumn: (title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');

  const handleAdd = () => {
    const newTitle = newColumnTitle.trim();
    if (!newTitle) return;
    onAddColumn(newTitle);
    setNewColumnTitle('');
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button className="flex items-center relative left-[2.3rem] whitespace-nowrap mt-9 rotate-90 w-fit gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow transition-all duration-200 font-semibold text-sm">
          Add Column
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add a new column</AlertDialogTitle>
        </AlertDialogHeader>
        <input
          type="text"
          className="w-full border rounded px-3 py-2 mt-4"
          placeholder="Column name"
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setNewColumnTitle('')}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={!newColumnTitle.trim()}
            onClick={handleAdd}
          >
            Add
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AddColumnDialog;
