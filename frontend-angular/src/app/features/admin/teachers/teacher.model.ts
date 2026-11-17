export interface CreateTeacherRequest {
  firstName: string;
  lastName: string;
  email: string;
  subjects: string[];
}

export interface TeacherCreatedResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'TEACHER';
  subjects: string[];
  temporaryPassword: string;
  mustChangePassword: boolean;
}
