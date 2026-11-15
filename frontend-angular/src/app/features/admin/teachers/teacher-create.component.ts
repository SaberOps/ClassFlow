
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

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
export class TeacherCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly teacherService = inject(AdminTeacherService);

  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly createdTeacher = signal<TeacherCreatedResponse | null>(null);

  readonly teacherForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    subjects: ['', Validators.required],
  });

  createTeacher(): void {
	console.log('Statut du formulaire :', this.teacherForm.status);
	console.log('Erreurs e-mail :', this.teacherForm.controls.email.errors);

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
}
