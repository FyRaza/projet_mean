import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, DashboardStats, RecentActivity } from '../../../shared/services/admin.service';
import { Boutique } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Vue d'ensemble de votre centre commercial</p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/admin/boutiques/create" class="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nouvelle boutique
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      @if (stats) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <!-- Boutiques Card -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
              </div>
              <span class="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
                +{{ stats.boutiquesChange }}%
              </span>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.activeBoutiques }}</h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Boutiques actives</p>
            </div>
            <div class="mt-4 flex items-center gap-2">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {{ stats.pendingBoutiques }} en attente
              </span>
            </div>
          </div>

          <!-- Boxes Card -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <span class="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                </svg>
                +{{ stats.occupancyChange }}%
              </span>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.occupiedBoxes }}/{{ stats.totalBoxes }}</h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Emplacements occupés</p>
            </div>
            <div class="mt-4">
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="bg-purple-600 h-2 rounded-full transition-all duration-500" [style.width.%]="(stats.occupiedBoxes / stats.totalBoxes) * 100"></div>
              </div>
            </div>
          </div>

          <!-- Categories Card -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalCategories }}</h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Catégories</p>
            </div>
            <div class="mt-4">
              <a routerLink="/admin/categories" class="text-sm text-brand-600 dark:text-brand-400 hover:underline">Gérer les catégories</a>
            </div>
          </div>

          <!-- Total Boutiques Card -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-3xl font-bold text-gray-900 dark:text-white">{{ stats.totalBoutiques }}</h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">Total boutiques</p>
            </div>
            <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span class="font-semibold text-gray-900 dark:text-white">{{ stats.availableBoxes }}</span> emplacements libres
            </div>
          </div>
        </div>
      }

      <!-- Main Content -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Zone Distribution -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Répartition par zone</h2>
          <div class="space-y-5">
            @for (zone of zoneStats; track zone.name) {
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Zone {{ zone.name }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">{{ zone.occupied }}/{{ zone.total }}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    class="h-2.5 rounded-full transition-all duration-500"
                    [class]="zone.color"
                    [style.width.%]="zone.total ? (zone.occupied / zone.total) * 100 : 0"
                  ></div>
                </div>
              </div>
            }
          </div>
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-500 dark:text-gray-400">Taux d'occupation global</span>
              <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ occupancyRate }}%</span>
            </div>
          </div>
        </div>

        <!-- Pending Boutiques -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Boutiques en attente</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Demandes à valider</p>
              </div>
              <a routerLink="/admin/boutiques/pending" class="text-sm text-brand-600 dark:text-brand-400 hover:underline font-medium">
                Voir tout
              </a>
            </div>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            @for (boutique of pendingBoutiques; track boutique.id) {
              <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div class="flex items-center gap-4">
                  <img [src]="boutique.logo" [alt]="boutique.name" class="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-700" />
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-gray-900 dark:text-white truncate">{{ boutique.name }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ boutique.contactEmail }}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      (click)="validateBoutique(boutique.id)"
                      class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                      title="Valider"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                    </button>
                    <button
                      (click)="rejectBoutique(boutique.id)"
                      class="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                      title="Refuser"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            }
            @if (pendingBoutiques.length === 0) {
              <div class="p-8 text-center text-gray-500 dark:text-gray-400">
                <svg class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p>Aucune demande en attente</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="p-6 border-b border-gray-100 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Activité récente</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">Dernières actions</p>
            </div>
          </div>
        </div>
        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          @for (activity of activities; track activity.id) {
            <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div class="flex items-start gap-4">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  [ngClass]="{
                    'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400': activity.color === 'blue',
                    'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400': activity.color === 'green',
                    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400': activity.color === 'emerald',
                    'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400': activity.color === 'purple',
                    'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400': activity.color === 'orange'
                  }"
                >
                  @switch (activity.icon) {
                    @case ('store') {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    }
                    @case ('check-circle') {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    }
                    @case ('map-pin') {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    }
                    @case ('package') {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    }
                    @default {
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    }
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white">{{ activity.title }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ activity.description }}</p>
                </div>
                <span class="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                  {{ getRelativeTime(activity.timestamp) }}
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  stats: DashboardStats | null = null;
  activities: RecentActivity[] = [];
  pendingBoutiques: Boutique[] = [];

  zoneStats: { name: string; occupied: number; total: number; color: string }[] = [];

  get occupancyRate(): number {
    if (!this.stats) return 0;
    return Math.round((this.stats.occupiedBoxes / this.stats.totalBoxes) * 100);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.adminService.getDashboardStats().subscribe(stats => {
      this.stats = stats;
    });

    this.adminService.getRecentActivity().subscribe(activities => {
      this.activities = activities;
    });

    this.adminService.getBoutiques({ status: 'pending' }).subscribe(boutiques => {
      this.pendingBoutiques = boutiques;
    });

    this.adminService.getBoxStats().subscribe((boxStats) => {
      const zoneColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'];
      this.zoneStats = (boxStats.byZone || []).map((zone, index) => ({
        name: zone._id || `Zone ${index + 1}`,
        occupied: zone.occupied || 0,
        total: zone.total || 0,
        color: zoneColors[index % zoneColors.length]
      }));
    });
  }

  validateBoutique(id: string): void {
    this.adminService.updateBoutiqueStatus(id, 'active').subscribe(() => {
      this.pendingBoutiques = this.pendingBoutiques.filter(b => b.id !== id);
      if (this.stats) {
        this.stats.pendingBoutiques--;
        this.stats.activeBoutiques++;
      }
    });
  }

  rejectBoutique(id: string): void {
    this.adminService.updateBoutiqueStatus(id, 'inactive').subscribe(() => {
      this.pendingBoutiques = this.pendingBoutiques.filter(b => b.id !== id);
      if (this.stats) {
        this.stats.pendingBoutiques--;
      }
    });
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${Math.floor(hours / 24)}j`;
  }
}
