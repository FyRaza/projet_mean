import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutiqueOwnerService } from '../../../shared/services/boutique-owner.service';
import { AdminService } from '../../../shared/services/admin.service';
import { UploadService } from '../../../shared/services/upload.service';

interface OpeningHour {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

interface BoutiqueProfile {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  category: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  postalCode: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  openingHours: OpeningHour[];
}

@Component({
  selector: 'app-boutique-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Profil de la boutique</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Gerez les informations de votre boutique</p>
        </div>
        <button
          (click)="saveProfile()"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Enregistrer
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex gap-8">
          @for (tab of tabs; track tab.id) {
            <button
              (click)="activeTab.set(tab.id)"
              [class]="activeTab() === tab.id
                ? 'pb-4 border-b-2 border-brand-600 text-brand-600 dark:text-brand-400 font-medium'
                : 'pb-4 border-b-2 border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            >
              {{ tab.label }}
            </button>
          }
        </nav>
      </div>

      <!-- General Info Tab -->
      @if (activeTab() === 'general') {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <!-- Basic Info -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations generales</h2>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom de la boutique <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="profile.name"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    URL personnalisee
                  </label>
                  <div class="flex">
                    <span class="inline-flex items-center px-4 py-2.5 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm">
                      votresite.com/boutiques/
                    </span>
                    <input
                      type="text"
                      [(ngModel)]="profile.slug"
                      class="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-r-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categorie
                  </label>
                  <select
                    [(ngModel)]="profile.category"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                    <option value="Mode & Accessoires">Mode & Accessoires</option>
                    <option value="Electronique">Electronique</option>
                    <option value="Maison & Jardin">Maison & Jardin</option>
                    <option value="Beaute & Sante">Beaute & Sante</option>
                    <option value="Sport & Loisirs">Sport & Loisirs</option>
                    <option value="Alimentation">Alimentation</option>
                    <option value="Services">Services</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    [(ngModel)]="profile.description"
                    rows="4"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  ></textarea>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ profile.description?.length || 0 }}/500 caracteres
                  </p>
                </div>
              </div>
            </div>

            <!-- Contact Info -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coordonnees</h2>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email de contact <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    [(ngModel)]="profile.contactEmail"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Telephone
                  </label>
                  <input
                    type="tel"
                    [(ngModel)]="profile.contactPhone"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="profile.address"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="profile.city"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code postal
                  </label>
                  <input
                    type="text"
                    [(ngModel)]="profile.postalCode"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <!-- Social Links -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reseaux sociaux</h2>

              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Site web
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </span>
                    <input
                      type="url"
                      [(ngModel)]="profile.website"
                      placeholder="https://votresite.com"
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Facebook
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </span>
                    <input
                      type="url"
                      [(ngModel)]="profile.facebook"
                      placeholder="https://facebook.com/votreboutique"
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Instagram
                  </label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </span>
                    <input
                      type="url"
                      [(ngModel)]="profile.instagram"
                      placeholder="https://instagram.com/votreboutique"
                      class="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Logo -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logo</h2>

              <div class="text-center">
                <div class="w-32 h-32 mx-auto bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-4">
                  @if (profile.logo) {
                    <img [src]="profile.logo" alt="Logo" class="w-full h-full object-cover" />
                  } @else {
                    <div class="w-full h-full flex items-center justify-center">
                      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  }
                </div>
                <button
                  (click)="logoInput.click()"
                  [disabled]="isUploadingLogo()"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                  @if (isUploadingLogo()) {
                    Upload en cours...
                  } @else {
                    Changer le logo
                  }
                </button>
                <input
                  #logoInput
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  (change)="onLogoSelected($event)"
                  class="hidden"
                />
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, WebP. Max 5 Mo. 400x400px recommande.
                </p>
              </div>
            </div>

            <!-- Banner -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Banniere</h2>

              <div class="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4">
                @if (profile.banner) {
                  <img [src]="profile.banner" alt="Banniere" class="w-full h-full object-cover" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center">
                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                }
              </div>
              <button
                (click)="bannerInput.click()"
                [disabled]="isUploadingBanner()"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
                @if (isUploadingBanner()) {
                  Upload en cours...
                } @else {
                  Changer la banniere
                }
              </button>
              <input
                #bannerInput
                type="file"
                accept="image/jpeg,image/png,image/webp"
                (change)="onBannerSelected($event)"
                class="hidden"
              />
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                JPG, PNG, WebP. Max 5 Mo. 1200x400px recommande.
              </p>
            </div>

            <!-- Preview Card -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Apercu</h2>

              <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div class="h-20 bg-gradient-to-br from-brand-500 to-brand-600">
                  @if (profile.banner) {
                    <img [src]="profile.banner" alt="Banniere" class="w-full h-full object-cover" />
                  }
                </div>
                <div class="p-4 -mt-8 relative">
                  <div class="w-16 h-16 bg-white dark:bg-gray-800 rounded-lg border-4 border-white dark:border-gray-800 overflow-hidden">
                    @if (profile.logo) {
                      <img [src]="profile.logo" alt="Logo" class="w-full h-full object-cover" />
                    } @else {
                      <div class="w-full h-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                        <span class="text-xl font-bold text-brand-600 dark:text-brand-400">
                          {{ profile.name?.charAt(0) || 'B' }}
                        </span>
                      </div>
                    }
                  </div>
                  <h3 class="font-medium text-gray-900 dark:text-white mt-2">{{ profile.name || 'Nom de la boutique' }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ profile.category }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Opening Hours Tab -->
      @if (activeTab() === 'hours') {
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Horaires d'ouverture</h2>

          <div class="space-y-4">
            @for (hour of profile.openingHours; track hour.day) {
              <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div class="w-32">
                  <span class="font-medium text-gray-900 dark:text-white">{{ hour.day }}</span>
                </div>

                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="hour.isOpen"
                    class="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span class="text-sm text-gray-600 dark:text-gray-400">Ouvert</span>
                </label>

                @if (hour.isOpen) {
                  <div class="flex-1 flex items-center gap-2">
                    <input
                      type="time"
                      [(ngModel)]="hour.openTime"
                      class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <span class="text-gray-500">-</span>
                    <input
                      type="time"
                      [(ngModel)]="hour.closeTime"
                      class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                } @else {
                  <span class="flex-1 text-sm text-gray-500 dark:text-gray-400">Ferme</span>
                }
              </div>
            }
          </div>

          <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm text-blue-700 dark:text-blue-300">
                  Ces horaires seront affiches sur votre page boutique pour informer vos clients de vos heures d'ouverture.
                </p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Success Toast -->
      @if (showSuccess()) {
        <div class="fixed bottom-6 right-6 px-6 py-4 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-3 z-50">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Profil mis a jour avec succes!</span>
        </div>
      }
    </div>
  `
})
export class BoutiqueProfileComponent implements OnInit {
  private boutiqueOwnerService = inject(BoutiqueOwnerService);
  private adminService = inject(AdminService);
  private uploadService = inject(UploadService);
  private boutiqueId: string | null = null;
  private categoryMap: Record<string, string> = {};
  private categoryNameToId: Record<string, string> = {};

  activeTab = signal<'general' | 'hours'>('general');
  showSuccess = signal(false);
  isUploadingLogo = signal(false);
  isUploadingBanner = signal(false);

  tabs = [
    { id: 'general' as const, label: 'Informations generales' },
    { id: 'hours' as const, label: 'Horaires d\'ouverture' }
  ];

  profile: BoutiqueProfile = {
    id: '',
    name: '',
    slug: '',
    description: '',
    logo: '',
    banner: '',
    category: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    postalCode: '',
    website: '',
    facebook: '',
    instagram: '',
    openingHours: this.getDefaultOpeningHours()
  };

  ngOnInit(): void {
    this.adminService.getCategories().subscribe({
      next: (categories) => {
        this.categoryMap = categories.reduce<Record<string, string>>((acc, c) => {
          acc[c.id] = c.name;
          return acc;
        }, {});
        this.categoryNameToId = categories.reduce<Record<string, string>>((acc, c) => {
          acc[c.name] = c.id;
          return acc;
        }, {});
        this.loadProfile();
      },
      error: () => this.loadProfile()
    });
  }

  private loadProfile(): void {
    this.boutiqueOwnerService.getMyBoutique().subscribe({
      next: (boutique) => {
        if (!boutique) return;
        this.boutiqueId = boutique.id;
        this.profile = {
          ...this.profile,
          id: boutique.id,
          name: boutique.name || '',
          slug: boutique.slug || '',
          description: boutique.description || '',
          logo: boutique.logo || '',
          banner: boutique.coverImage || '',
          category: this.categoryMap[boutique.categoryId || ''] || '',
          contactEmail: boutique.contactEmail || '',
          contactPhone: boutique.contactPhone || '',
          openingHours: boutique.openingHours?.length ? boutique.openingHours as any : this.getDefaultOpeningHours()
        };
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingLogo.set(true);

    this.uploadService.uploadImage(file, 'logo').subscribe({
      next: (result) => {
        this.profile.logo = result.url;
        this.isUploadingLogo.set(false);
      },
      error: (err) => {
        this.isUploadingLogo.set(false);
        alert('Erreur upload logo: ' + (err.error?.message || 'Erreur inconnue'));
      }
    });

    input.value = '';
  }

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.isUploadingBanner.set(true);

    this.uploadService.uploadImage(file, 'banner').subscribe({
      next: (result) => {
        this.profile.banner = result.url;
        this.isUploadingBanner.set(false);
      },
      error: (err) => {
        this.isUploadingBanner.set(false);
        alert('Erreur upload bannière: ' + (err.error?.message || 'Erreur inconnue'));
      }
    });

    input.value = '';
  }

  saveProfile(): void {
    if (!this.boutiqueId) return;
    const categoryId = this.categoryNameToId[this.profile.category] || undefined;
    this.boutiqueOwnerService.updateBoutiqueProfile(this.boutiqueId, {
      name: this.profile.name,
      description: this.profile.description,
      contactEmail: this.profile.contactEmail,
      contactPhone: this.profile.contactPhone,
      logo: this.profile.logo,
      coverImage: this.profile.banner,
      categoryId
    }).subscribe({
      next: () => {
        this.showSuccess.set(true);
        setTimeout(() => this.showSuccess.set(false), 3000);
      }
    });
  }

  private getDefaultOpeningHours(): OpeningHour[] {
    return [
      { day: 'Lundi', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'Mardi', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'Mercredi', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'Jeudi', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'Vendredi', isOpen: true, openTime: '09:00', closeTime: '18:00' },
      { day: 'Samedi', isOpen: true, openTime: '09:00', closeTime: '13:00' },
      { day: 'Dimanche', isOpen: false, openTime: '09:00', closeTime: '18:00' }
    ];
  }
}
