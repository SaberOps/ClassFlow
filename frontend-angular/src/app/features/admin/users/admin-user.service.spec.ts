import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminUserService } from './admin-user.service';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminUserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the detailed profile for an account', () => {
    service.profile(17).subscribe();

    const request = http.expectOne('/api/admin/users/17/profile');
    expect(request.request.method).toBe('GET');
    request.flush({ id: 17, email: 'student@fst.utm.tn', role: 'STUDENT' });
  });

  it('requests a one-time temporary password for an account', () => {
    service.resetTemporaryPassword(21).subscribe();

    const request = http.expectOne('/api/admin/users/21/temporary-password');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({
      userId: 21,
      email: 'teacher@fst.utm.tn',
      temporaryPassword: 'a-one-time-password',
      mustChangePassword: true,
    });
  });
});
