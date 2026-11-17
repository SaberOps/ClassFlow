import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TeacherApiService, TeacherCourse, TeacherResource } from '../../../core/services/teacher-api.service';
import { TeacherCoursesComponent } from './teacher-courses.component';

describe('TeacherCoursesComponent', () => {
  let fixture: ComponentFixture<TeacherCoursesComponent>;
  let component: TeacherCoursesComponent;
  let api: jasmine.SpyObj<TeacherApiService>;

  const courses: TeacherCourse[] = [
    { id: 101, code: 'MAT-1', title: 'Algèbre', className: 'Classe 2A' },
    { id: 202, code: 'PHY-1', title: 'Mécanique', className: 'Classe 3B' },
    { id: 103, code: 'MAT-2', title: 'Géométrie', className: 'Classe 2A' }
  ];

  beforeEach(() => {
    api = jasmine.createSpyObj<TeacherApiService>('TeacherApiService', [
      'courses', 'resources', 'createResource', 'updateResource', 'deleteResource', 'uploadFile'
    ]);
    api.courses.and.returnValue(of(courses));
    api.resources.and.returnValue(of([]));
    api.createResource.and.returnValue(of({} as TeacherResource));
    api.updateResource.and.returnValue(of({} as TeacherResource));
    api.deleteResource.and.returnValue(of(void 0));
    api.uploadFile.and.returnValue(of({ id: 1, fileName: 'cours.pdf', url: '/api/files/1' }));

    TestBed.configureTestingModule({
      imports: [TeacherCoursesComponent],
      providers: [{ provide: TeacherApiService, useValue: api }]
    });
    fixture = TestBed.createComponent(TeacherCoursesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('groups courses into distinct class spaces and scopes the course selector', () => {
    expect(component.classSpaces().map(space => space.name)).toEqual(['Classe 2A', 'Classe 3B']);
    expect(component.visibleCourses().map(course => course.id)).toEqual([101, 103]);

    component.selectClass('Classe 3B');

    expect(component.visibleCourses().map(course => course.id)).toEqual([202]);
    expect(component.selectedCourseId()).toBe(202);
    expect(api.resources).toHaveBeenCalledWith(202);
  });

  it('creates content against the explicitly selected destination course', () => {
    component.newResource();
    component.selectFormClass('Classe 3B');
    component.title = 'Notes de mécanique';
    component.resourceType = 'LINK';
    component.fileUrl = 'https://example.test/lesson';

    component.saveResource();

    expect(api.createResource).toHaveBeenCalledWith(202, jasmine.objectContaining({
      title: 'Notes de mécanique',
      resourceType: 'LINK',
      fileUrl: 'https://example.test/lesson'
    }));
    expect(component.selectedClassName()).toBe('Classe 3B');
    expect(component.notice()).toContain('cours sélectionné');
  });
});
