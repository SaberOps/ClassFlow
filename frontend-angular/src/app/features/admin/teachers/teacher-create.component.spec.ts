import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AcademicAdminService } from '../academic/academic-admin.service';
import { AdminTeacherService } from './admin-teacher.service';
import { TeacherCreateComponent } from './teacher-create.component';

describe('TeacherCreateComponent', () => {
  let component: TeacherCreateComponent;
  let teachers: jasmine.SpyObj<AdminTeacherService>;
  let academic: jasmine.SpyObj<AcademicAdminService>;

  beforeEach(() => {
    teachers = jasmine.createSpyObj<AdminTeacherService>('AdminTeacherService', ['createTeacher']);
    academic = jasmine.createSpyObj<AcademicAdminService>('AcademicAdminService', ['list', 'createStudent']);
    academic.list.and.returnValue(of([{
      id: 1,
      name: 'Informatique',
      classes: [{ id: 42, name: 'Groupe A', students: [] }],
    }]));
    academic.createStudent.and.returnValue(of({
      id: 100,
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      nationalId: 'ID-42',
    }));

    TestBed.configureTestingModule({
      imports: [TeacherCreateComponent],
      providers: [
        { provide: AdminTeacherService, useValue: teachers },
        { provide: AcademicAdminService, useValue: academic },
      ],
    });
    component = TestBed.createComponent(TeacherCreateComponent).componentInstance;
    component.ngOnInit();
  });

  it('routes student selection to the existing class-specific student API', () => {
    component.setRole('STUDENT');
    component.studentForm.setValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.test',
      nationalId: 'ID-42',
      classId: 42,
    });

    component.createStudent();

    expect(academic.createStudent).toHaveBeenCalledWith(42, 'Ada', 'Lovelace', 'ada@example.test', 'ID-42');
    expect(teachers.createTeacher).not.toHaveBeenCalled();
  });

  it('routes teacher selection to the existing teacher API and does not offer admin creation', () => {
    component.teacherForm.setValue({
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.test',
      subjects: 'Computer science',
    });
    teachers.createTeacher.and.returnValue(of({
      id: 11,
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.test',
      role: 'TEACHER',
      subjects: ['Computer science'],
      temporaryPassword: 'one-time',
      mustChangePassword: true,
    }));

    component.createTeacher();

    expect(teachers.createTeacher).toHaveBeenCalledWith(jasmine.objectContaining({
      firstName: 'Grace',
      subjects: ['Computer science'],
    }));
    expect(academic.createStudent).not.toHaveBeenCalled();
  });
});
