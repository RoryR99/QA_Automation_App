import { ChangeEvent, useRef } from 'react';
import { Camera, ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  value?: string;
  onChange: (value?: string) => void;
  helperText?: string;
  buttonLabel?: string;
  replaceLabel?: string;
  previewAlt?: string;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function PhotoUpload({
  value,
  onChange,
  helperText = 'Add photo evidence for this issue',
  buttonLabel = 'Upload photo',
  replaceLabel = 'Replace photo',
  previewAlt = 'Uploaded photo',
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Please choose an image smaller than 5 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-border bg-secondary/20 p-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Camera className="h-4 w-4" />
        {helperText}
      </div>

      {value ? (
        <div className="space-y-3">
          <img src={value} alt={previewAlt} className="h-40 w-full rounded-2xl object-cover" />
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" />
              {replaceLabel}
            </Button>
            <Button type="button" variant="ghost" onClick={() => onChange(undefined)}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          <ImagePlus className="h-4 w-4" />
          {buttonLabel}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
