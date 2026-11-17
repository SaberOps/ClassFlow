
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { AcademicAdminService } from '../academic/academic-admin.service';
import { AcademicClass, AcademicStudent } from '../academic/academic.model';
import { AdminTeacherService } from './admin-teacher.service';
import { TeacherCreatedResponse } from './teacher.model';
import { teacherApiErrorMessage } from './admin-teacher.service';

@Component({
  selector: 'app-teacher-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './teacher-create.component.html',
  styleUrl: './teacher-create.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teacherService = inject(AdminTeacherService);
  private readonly academicService = inject(AcademicAdminService);

  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly createdTeacher = signal<TeacherCreatedResponse | null>(null);
  readonly createdStudent = signal<AcademicStudent | null>(null);
  readonly role = signal<'TEACHER' | 'STUDENT'>('TEACHER');
  readonly classes = signal<Array<AcademicClass & { filiereName: string }>>([]);

  readonly teacherForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    subjects: ['', Validators.required],
  });

  readonly studentForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    nationalId: ['', [Validators.required, Validators.maxLength(40)]],
    classId: [null as number | null, Validators.required],
  });

  ngOnInit(): void {
    this.academicService.list().subscribe({
      next: (filieres) => this.classes.set(filieres.flatMap((filiere) =>
        filiere.classes.map((academicClass) => ({ ...academicClass, filiereName: filiere.name })))),
      error: () => this.errorMessage.set('Impossible de charger les classes. Réessayez plus tard.'),
    });
  }

  setRole(role: 'TEACHER' | 'STUDENT'): void {
    this.role.set(role);
    this.errorMessage.set('');
    this.createdTeacher.set(null);
    this.createdStudent.set(null);
  }

  createTeacher(): void {
    if (this.teacherForm.invalid) {
      this.teacherForm.markAllAsTouched();
      return;
    }

    const values = this.teacherForm.getRawValue();

    const subjects = [
      ...new Set(
        (values.subjects ?? '')
          .split(',')
          .map((subject) => subject.trim())
          .filter((subject) => subject.length > 0)
      ),
    ];

    if (subjects.length === 0) {
      this.errorMessage.set('Veuillez saisir au moins une matière.');
      return;
    }

    this.errorMessage.set('');
    this.createdTeacher.set(null);
    this.createdStudent.set(null);
    this.saving.set(true);

    this.teacherService.createTeacher({
      firstName: values.firstName!.trim(),
      lastName: values.lastName!.trim(),
      email: values.email!.trim(),
      subjects,
    }).subscribe({
      next: (response) => {
        this.createdTeacher.set(response);
        this.teacherForm.reset();
        this.saving.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(teacherApiErrorMessage(error));
        this.saving.set(false);
      },
    });
  }

  createStudent(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }
    const values = this.studentForm.getRawValue();
    if (!values.classId) return;
    this.errorMessage.set('');
    this.createdTeacher.set(null);
    this.createdStudent.set(null);
    this.saving.set(true);
    this.academicService.createStudent(
      values.classId,
      values.firstName!.trim(),
      values.lastName!.trim(),
      values.email!.trim(),
      values.nationalId!.trim(),
    ).subscribe({
      next: (student) => {
        this.createdStudent.set(student);
        this.studentForm.reset();
        this.saving.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(teacherApiErrorMessage(error));
        this.saving.set(false);
      },
    });
  }
}
