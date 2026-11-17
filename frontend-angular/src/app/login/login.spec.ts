import { fakeAsync, tick, ComponentFixture, TestBed } from '@angular/core/testing';
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
  let matchMedia: jasmine.Spy;

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

    matchMedia = spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rotates to a different original quote every 12 seconds', fakeAsync(() => {
    fixture.destroy();
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const initialQuote = component.currentQuote;

    tick(12_000);
    fixture.detectChanges();

    expect(component.currentQuote).not.toBe(initialQuote);
    expect(fixture.nativeElement.querySelector('.education-quote p').textContent)
      .toContain(component.currentQuote);
  }));

  it('stops rotating when the component is destroyed', fakeAsync(() => {
    fixture.destroy();
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const quoteBeforeDestroy = component.currentQuote;

    fixture.destroy();
    tick(24_000);

    expect(component.currentQuote).toBe(quoteBeforeDestroy);
  }));

  it('does not rotate quotes when reduced motion is preferred', fakeAsync(() => {
    fixture.destroy();
    matchMedia.and.returnValue({ matches: true } as MediaQueryList);
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const initialQuote = component.currentQuote;

    tick(24_000);

    expect(component.currentQuote).toBe(initialQuote);
  }));

  it('navigates each role to its own page after login', () => {
    const navigate = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    const paths = [
      { role: 'ADMIN' as const, path: '/admin/home' },
      { role: 'TEACHER' as const, path: '/teacher/dashboard' },
      { role: 'STUDENT' as const, path: '/student/dashboard' },
    ];

    for (const { role, path } of paths) {
      auth.login.and.returnValue(of({ email: 'user@classflow.test', role }));
      component.isSubmitting = false;
      component.handleSubmit(new SubmitEvent('submit'));
      expect(navigate).toHaveBeenCalledWith(path);
    }
  });

  it('forces a teacher to change a temporary password before opening the workspace', () => {
    const navigate = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    auth.login.and.returnValue(of({
      email: 'teacher@classflow.test', role: 'TEACHER', mustChangePassword: true
    }));

    component.handleSubmit(new SubmitEvent('submit'));

    expect(navigate).toHaveBeenCalledWith('/teacher/change-password');
  });

  it('forces a student to change a temporary password before opening the workspace', () => {
    const navigate = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    auth.login.and.returnValue(of({
      email: 'student@classflow.test', role: 'STUDENT', mustChangePassword: true
    }));

    component.handleSubmit(new SubmitEvent('submit'));

    expect(navigate).toHaveBeenCalledWith('/student/change-password');
  });
});
