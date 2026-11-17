import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { StudentApiService } from '../../../core/services/student-api.service';
import { CoursesComponent } from './courses.component';

describe('CoursesComponent', () => {
  let fixture: ComponentFixture<CoursesComponent>;
  let api: jasmine.SpyObj<StudentApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<StudentApiService>('StudentApiService', ['courses']);
    api.courses.and.returnValue(of([
      { id: 1, code: 'MAT-1', title: 'Algèbre', teacherName: 'Ada Lovelace', teacherEmail: 'ada@example.test' }
    ]));
    TestBed.configureTestingModule({
      imports: [CoursesComponent],
      providers: [
        provideRouter([]),
        { provide: StudentApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ q: 'algèbre' })) } }
      ]
    });
    fixture = TestBed.createComponent(CoursesComponent);
    fixture.detectChanges();
  });

  it('hydrates search from the route and renders only the returned enrolled courses', () => {
    expect(api.courses).toHaveBeenCalledWith('algèbre');
    expect(fixture.nativeElement.textContent).toContain('Algèbre');
    expect(fixture.nativeElement.textContent).toContain('La recherche porte uniquement sur les cours auxquels vous êtes inscrit·e.');
  });

  it('debounces course search input', fakeAsync(() => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#course-search');
    input.value = 'math';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(api.courses).not.toHaveBeenCalledWith('math');
    fixture.componentInstance.searchChanged('math');
    tick(220);

    expect(api.courses).toHaveBeenCalledWith('math');
  }));
});
