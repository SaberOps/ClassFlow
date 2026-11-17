import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { AcademicAdminService, apiErrorMessage } from './academic-admin.service';
import { AcademicClass, Filiere } from './academic.model';
import { CourseAssignmentClass, CourseAssignmentCourse, CourseAssignmentTeacher } from './academic-admin.service';

type DeleteAction =
  | { kind: 'filiere'; id: number; name: string; classCount: number; studentCount: number }
  | { kind: 'class'; id: number; name: string; studentCount: number }
  | { kind: 'student'; id: number; name: string };

@Component({
  selector: 'app-filiere-management',
  imports: [FormsModule, RouterLink, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './filiere-management.component.html',
  styleUrl: './filiere-management.component.scss',
})
export class FiliereManagementComponent implements OnInit {
  private readonly api = inject(AcademicAdminService);

  protected readonly filieres = signal<Filiere[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly message = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  protected readonly pending = signal<DeleteAction | null>(null);
  protected readonly assignmentTeachers = signal<CourseAssignmentTeacher[]>([]);
  protected readonly assignmentClasses = signal<CourseAssignmentClass[]>([]);
  protected assignmentTeacherId: number | null = null;
  protected assignmentCourseId: number | null = null;
  protected assignmentClassId: number | null = null;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.api.courseAssignmentOptions().subscribe({
      next: (options) => {
        this.assignmentTeachers.set(options.teachers);
        this.assignmentClasses.set(options.classes);
      },
      error: (error: unknown) => this.showError(error),
    });
    this.api.list().subscribe({
      next: (filieres) => {
        this.filieres.set(filieres);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.showError(error);
      },
    });
  }

  protected coursesForTeacher(teacherId: number | null): CourseAssignmentTeacher['courses'] {
    return this.assignmentTeachers().find((teacher) => teacher.id === Number(teacherId))?.courses ?? [];
  }

  protected assignedClassLabel(course: CourseAssignmentCourse): string {
    return course.assignedClasses.length
      ? ` · attribué à ${course.assignedClasses.map(item => `${item.filiereName} / ${item.name}`).join(', ')}`
      : '';
  }

  protected unassignCourse(courseId: number, classId: number): void {
    if (this.saving()) return;
    this.runMutation(
      this.api.unassignCourse(courseId, classId),
      'Cours retiré de la classe. Les inscriptions déjà enregistrées sont conservées.',
    );
  }

  protected selectAssignmentTeacher(teacherId: number | null): void {
    this.assignmentTeacherId = teacherId;
    this.assignmentCourseId = null;
  }

  protected assignCourse(): void {
    if (!this.assignmentTeacherId || !this.assignmentCourseId || !this.assignmentClassId || this.saving()) return;
    this.runMutation(
      this.api.assignCourse(this.assignmentTeacherId, this.assignmentCourseId, this.assignmentClassId),
      'Course assigned to the selected class. Its current and future students will be enrolled.',
      () => {
        this.assignmentTeacherId = null;
        this.assignmentCourseId = null;
        this.assignmentClassId = null;
      },
    );
  }

  protected createFiliere(input: HTMLInputElement): void {
    const name = input.value.trim();
    if (!name || this.saving()) return;
    this.runMutation(this.api.createFiliere(name), 'Filiere created.', () => (input.value = ''));
  }

  protected createClass(filiereId: number, input: HTMLInputElement): void {
    const name = input.value.trim();
    if (!name || this.saving()) return;
    this.runMutation(this.api.createClass(filiereId, name), 'Class created.', () => (input.value = ''));
  }

  protected createStudent(
    classId: number,
    firstNameInput: HTMLInputElement,
    lastNameInput: HTMLInputElement,
    emailInput: HTMLInputElement,
    nationalIdInput: HTMLInputElement,
  ): void {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const nationalId = nationalIdInput.value.trim();
    if (!firstName || !lastName || !email || !nationalId || this.saving()) return;
    this.runMutation(
      this.api.createStudent(classId, firstName, lastName, email, nationalId),
      'Student account created. The student can sign in with their email and national ID.',
      () => {
        firstNameInput.value = '';
        lastNameInput.value = '';
        emailInput.value = '';
        nationalIdInput.value = '';
      },
    );
  }

  protected saveStudentLogin(
    studentId: number,
    emailInput: HTMLInputElement,
    nationalIdInput: HTMLInputElement,
  ): void {
    const email = emailInput.value.trim();
    const nationalId = nationalIdInput.value.trim();
    if (!email || !nationalId || this.saving()) return;

    this.runMutation(
      this.api.updateStudentAccount(studentId, email, nationalId),
      'Student login details saved. The national ID is the password.',
      () => {
        emailInput.value = '';
        nationalIdInput.value = '';
      },
    );
  }

  protected maskNationalId(nationalId: string | null): string {
    if (!nationalId) return '—';
    const visibleLength = Math.ceil(nationalId.length / 2);
    return nationalId.slice(0, visibleLength) + '*'.repeat(nationalId.length - visibleLength);
  }

  protected askDeleteFiliere(filiere: Filiere): void {
    this.pending.set({
      kind: 'filiere',
      id: filiere.id,
      name: filiere.name,
      classCount: filiere.classes.length,
      studentCount: filiere.classes.reduce((sum, item) => sum + item.students.length, 0),
    });
  }

  protected askDeleteClass(academicClass: AcademicClass): void {
    this.pending.set({
      kind: 'class',
      id: academicClass.id,
      name: academicClass.name,
      studentCount: academicClass.students.length,
    });
  }

  protected askDeleteStudent(id: number, name: string): void {
    this.pending.set({ kind: 'student', id, name });
  }

  protected confirmDelete(): void {
    const action = this.pending();
    if (!action || this.saving()) return;

    const request =
      action.kind === 'filiere'
        ? this.api.deleteFiliere(action.id)
        : action.kind === 'class'
          ? this.api.deleteClass(action.id)
          : this.api.deleteStudent(action.id);

    this.runMutation(request, `${this.deleteLabel(action)} deleted.`);
  }

  protected cancelDelete(): void {
    if (!this.saving()) this.pending.set(null);
  }

  protected deleteTitle(): string {
    const action = this.pending();
    return action ? `Delete ${action.kind}?` : '';
  }

  protected deleteMessage(): string {
    const action = this.pending();
    if (!action) return '';
    if (action.kind === 'filiere') {
      return `Delete "${action.name}" and its ${action.classCount} class(es) and ${action.studentCount} student(s)? This cannot be undone.`;
    }
    if (action.kind === 'class') {
      return `Delete "${action.name}" and its ${action.studentCount} student(s)? This cannot be undone.`;
    }
    return `Delete student "${action.name}"? This cannot be undone.`;
  }

  protected dismissMessage(): void {
    this.message.set(null);
  }

  private deleteLabel(action: DeleteAction): string {
    if (action.kind === 'filiere') return 'Filiere';
    if (action.kind === 'class') return 'Class';
    return 'Student';
  }

  private runMutation(
    request: Observable<unknown>,
    successText: string,
    onSuccess?: () => void,
  ): void {
    this.saving.set(true);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.pending.set(null);
        onSuccess?.();
        this.message.set({ type: 'success', text: successText });
        this.load();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.pending.set(null);
        this.showError(error);
      },
    });
  }

  private showError(error: unknown): void {
    this.message.set({ type: 'error', text: apiErrorMessage(error) });
  }
}
