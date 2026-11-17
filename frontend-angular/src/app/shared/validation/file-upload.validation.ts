const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_EXTENSION = /\.(pdf|docx|pptx|jpg|png)$/i;

export function validateUploadFile(file: File): string | null {
  if (file.size === 0) return 'Le fichier est vide.';
  if (file.size > MAX_FILE_BYTES) return 'La taille maximale autorisée est de 10 MiB.';
  if (!ALLOWED_FILE_EXTENSION.test(file.name)) {
    return 'Seuls les fichiers PDF, DOCX, PPTX, JPG et PNG sont acceptés.';
  }
  return null;
}
