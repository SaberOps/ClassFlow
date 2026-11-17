import { validateUploadFile } from './file-upload.validation';

describe('validateUploadFile', () => {
  it('accepts supported document and image files below the 10 MiB limit', () => {
    expect(validateUploadFile(new File(['lesson'], 'lesson.PDF'))).toBeNull();
    expect(validateUploadFile(new File(['image'], 'portrait.png'))).toBeNull();
  });

  it('rejects empty, unsupported, or oversized files before upload', () => {
    expect(validateUploadFile(new File([], 'empty.pdf'))).toContain('vide');
    expect(validateUploadFile(new File(['x'], 'notes.txt'))).toContain('PDF');
    expect(validateUploadFile(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.pdf')))
      .toContain('10 MiB');
  });
});
