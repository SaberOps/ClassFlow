import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads a CSRF token before submitting login credentials', () => {
    let response: unknown;
    service.login('student@classflow.test', 'password').subscribe((value) => {
      response = value;
    });

    const csrfRequest = httpTesting.expectOne('/api/auth/csrf');
    expect(csrfRequest.request.method).toBe('GET');
    csrfRequest.flush({});

    const loginRequest = httpTesting.expectOne('/api/auth/login');
    expect(loginRequest.request.method).toBe('POST');
    expect(loginRequest.request.body).toEqual({
      email: 'student@classflow.test',
      password: 'password',
    });
    loginRequest.flush({ email: 'student@classflow.test', role: 'STUDENT' });

    expect(response).toEqual({ email: 'student@classflow.test', role: 'STUDENT' });
  });
});
