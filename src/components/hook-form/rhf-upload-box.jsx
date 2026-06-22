import { Controller, useFormContext } from 'react-hook-form';

import { FileUploadPreviewBox } from '../upload/file-upload-preview-box';

export function RHFUploadBox({
  name,
  label,
  helperText,
  accept = 'image/*',
  minHeight,
  width,
  height,
  showFileNameBelow = false,
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <FileUploadPreviewBox
          value={field.value}
          onChange={field.onChange}
          accept={accept}
          helperText={helperText}
          label={label}
          error={error}
          minHeight={minHeight}
          width={width}
          height={height}
          showFileNameBelow={showFileNameBelow}
        />
      )}
    />
  );
}
