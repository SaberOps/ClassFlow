import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'currentUser', 'logout']);
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates each role to its own page after login', () => {
    const navigate = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    const paths = [
      { role: 'ADMIN' as const, path: '/admin/home' },
      { role: 'TEACHER' as const, path: '/teacher/home' },
      { role: 'STUDENT' as const, path: '/student/dashboard' },
    ];

    for (const { role, path } of paths) {
      auth.login.and.returnValue(of({ email: 'user@classflow.test', role }));
      component.isSubmitting = false;
      component.handleSubmit(new SubmitEvent('submit'));
      expect(navigate).toHaveBeenCalledWith(path);
    }
  });
});
