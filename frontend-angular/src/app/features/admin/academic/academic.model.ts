export interface AcademicStudent {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  nationalId: string | null;
}

export interface AcademicClass {
  id: number;
  name: string;
  students: AcademicStudent[];
}

export interface Filiere {
  id: number;
  name: string;
  classes: AcademicClass[];
}
