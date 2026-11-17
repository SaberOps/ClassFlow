import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { StudentApiService } from '../../../core/services/student-api.service';
import { RequestDocumentsComponent } from './request-documents.component';

describe('RequestDocumentsComponent', () => {
  let fixture: ComponentFixture<RequestDocumentsComponent>;
  let api: jasmine.SpyObj<StudentApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<StudentApiService>('StudentApiService', ['resources']);
    api.resources.and.returnValue(of([{
      id: 1,
      courseId: 7,
      courseTitle: 'Mathématiques',
      courseCode: 'MAT-1',
      title: 'Notes du chapitre',
      resourceType: 'FILE',
      fileName: 'chapitre.pdf',
      fileUrl: '/api/files/1',
      publishedAt: '2026-11-17T10:00:00Z'
    }]));
    TestBed.configureTestingModule({
      imports: [RequestDocumentsComponent],
      providers: [
        { provide: StudentApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ q: 'chapitre' })) } }
      ]
    });
    fixture = TestBed.createComponent(RequestDocumentsComponent);
    fixture.detectChanges();
  });

  it('searches and labels documents from enrolled courses', () => {
    expect(api.resources).toHaveBeenCalledWith('chapitre');
    expect(fixture.nativeElement.textContent).toContain('MAT-1 · Mathématiques');
    expect(fixture.nativeElement.textContent).toContain('Seuls les documents de vos cours inscrits sont affichés.');
  });
});
