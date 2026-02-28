import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User, UserRole, AuthCredentials, RegisterData, AuthResponse, Address } from '../../core/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  token$ = this.tokenSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.loadStoredAuth();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  get userRole(): UserRole | null {
    return this.currentUser?.role ?? null;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch {
        this.clearAuth();
      }
    }
  }

  login(credentials: AuthCredentials): Observable<AuthResponse> {
    this.loadingSubject.next(true);

    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap({
        next: (response) => {
          this.setAuth(response);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.loadingSubject.next(false);
        }
      })
    );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    this.loadingSubject.next(true);

    return this.http.post<AuthResponse>(`${this.API_URL}/register`, data).pipe(
      tap({
        next: (response) => {
          this.setAuth(response);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.loadingSubject.next(false);
        }
      })
    );
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    this.loadingSubject.next(true);

    return this.http.post<AuthResponse>(`${this.API_URL}/google`, { idToken }).pipe(
      tap({
        next: (response) => {
          this.setAuth(response);
          this.loadingSubject.next(false);
        },
        error: () => {
          this.loadingSubject.next(false);
        }
      })
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/signin']);
  }

  private setAuth(response: AuthResponse): void {
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
      this.tokenSubject.next(response.token);
    }
    if (response.user) {
      const mappedUser = this.mapUser(response.user);
      localStorage.setItem('auth_user', JSON.stringify(mappedUser));
      this.currentUserSubject.next(mappedUser);
    }
    this.isAuthenticatedSubject.next(true);
  }

  private clearAuth(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  hasRole(role: UserRole | UserRole[]): boolean {
    const roles = Array.isArray(role) ? role : [role];
    return this.userRole ? roles.includes(this.userRole) : false;
  }

  getDefaultRouteForRole(): string {
    switch (this.userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'boutique':
        return '/boutique/dashboard';
      case 'acheteur':
        return '/';
      default:
        return '/signin';
    }
  }

  navigateToDefaultRoute(): void {
    const route = this.getDefaultRouteForRole();
    this.router.navigate([route]);
  }

  updateProfile(updates: Partial<User>): Observable<User> {
    return this.http.put<any>(`${this.API_URL}/me`, updates).pipe(
      map((user) => this.mapUser(user)),
      tap((mapped) => {
        this.currentUserSubject.next(mapped);
        localStorage.setItem('auth_user', JSON.stringify(mapped));
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/me/password`, {
      currentPassword,
      newPassword
    });
  }

  deleteMyAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/me`);
  }

  getMyAddresses(): Observable<Address[]> {
    return this.http.get<any[]>(`${this.API_URL}/me/addresses`).pipe(
      map((addresses) => (addresses || []).map((address) => this.mapAddress(address)))
    );
  }

  addAddress(address: Omit<Address, 'id'>): Observable<Address> {
    return this.http.post<any>(`${this.API_URL}/me/addresses`, address).pipe(
      map((created) => this.mapAddress(created))
    );
  }

  updateAddress(addressId: string, address: Partial<Omit<Address, 'id'>>): Observable<Address> {
    return this.http.put<any>(`${this.API_URL}/me/addresses/${addressId}`, address).pipe(
      map((updated) => this.mapAddress(updated))
    );
  }

  deleteAddress(addressId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/me/addresses/${addressId}`);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/reset-password`, { token, password });
  }

  private mapAddress(address: any): Address {
    return {
      id: address?.id || address?._id,
      label: address?.label || 'Adresse',
      fullName: address?.fullName,
      phone: address?.phone,
      street: address?.street || '',
      landmark: address?.landmark || '',
      city: address?.city || '',
      postalCode: address?.postalCode || '',
      country: address?.country || 'Madagascar',
      latitude: address?.latitude,
      longitude: address?.longitude,
      isDefault: !!address?.isDefault
    };
  }

  private mapUser(user: any): User {
    return {
      id: user?.id || user?._id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      role: user?.role,
      phone: user?.phone,
      isActive: user?.isActive ?? true,
      createdAt: user?.createdAt ? new Date(user.createdAt) : new Date(),
      updatedAt: user?.updatedAt ? new Date(user.updatedAt) : new Date()
    };
  }
}
