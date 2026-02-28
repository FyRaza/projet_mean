import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP Interceptor that automatically injects the JWT token
 * into all outgoing requests and handles authentication errors.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    // Get token from localStorage
    const token = localStorage.getItem('auth_token');

    // Clone the request and add the Authorization header if token exists
    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // Token expired or invalid — clear and redirect to login
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                router.navigate(['/signin'], {
                    queryParams: { returnUrl: router.url, expired: 'true' }
                });
            }

            if (error.status === 403) {
                // Access denied — redirect to home
                router.navigate(['/']);
            }

            return throwError(() => error);
        })
    );
};
