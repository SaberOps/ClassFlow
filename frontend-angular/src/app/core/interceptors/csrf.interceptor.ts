import { HttpInterceptorFn } from '@angular/common/http';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const token = readCookie('XSRF-TOKEN');
  const safe = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
  if (token && !safe) {
    req = req.clone({
      setHeaders: { 'X-XSRF-TOKEN': token },
      withCredentials: true,
    });
  }
  return next(req);
};
