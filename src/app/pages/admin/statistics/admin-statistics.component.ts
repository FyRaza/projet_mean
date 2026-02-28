import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, DashboardStats } from '../../../shared/services/admin.service';

@Component({
  selector: 'app-admin-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Statistiques</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Analysez les performances de votre centre commercial</p>
        </div>
      </div>

      @if (stats) {
        <!-- Main Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                </svg>
              </div>
              <span class="text-white/80 text-sm">+{{ stats.boutiquesChange }}%</span>
            </div>
            <div class="mt-4">
              <h3 class="text-4xl font-bold">{{ stats.activeBoutiques }}</h3>
              <p class="text-white/80 mt-1">Boutiques actives</p>
            </div>
          </div>

          <div class="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-white/80 text-sm">{{ stats.totalBoutiques }} total</span>
            </div>
            <div class="mt-4">
              <h3 class="text-4xl font-bold">{{ stats.pendingBoutiques }}</h3>
              <p class="text-white/80 mt-1">En attente de validation</p>
            </div>
          </div>

          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
              </div>
              <span class="text-white/80 text-sm">{{ occupancyRate }}%</span>
            </div>
            <div class="mt-4">
              <h3 class="text-4xl font-bold">{{ stats.occupiedBoxes }}/{{ stats.totalBoxes }}</h3>
              <p class="text-white/80 mt-1">Taux d'occupation</p>
            </div>
          </div>

          <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
            <div class="flex items-center justify-between">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
            </div>
            <div class="mt-4">
              <h3 class="text-4xl font-bold">{{ stats.totalCategories }}</h3>
              <p class="text-white/80 mt-1">Catégories</p>
            </div>
          </div>
        </div>

        <!-- Zone Stats & Performance -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Zone Distribution -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Répartition par zone</h2>
            <div class="space-y-6">
              @for (zone of zoneStats; track zone.name) {
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white" [class]="zone.bgColor">
                        {{ zone.name }}
                      </div>
                      <span class="font-medium text-gray-900 dark:text-white">Zone {{ zone.name }}</span>
                    </div>
                    <span class="text-gray-500 dark:text-gray-400">{{ zone.occupied }}/{{ zone.total }} occupés</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div class="h-3 rounded-full transition-all duration-500" [class]="zone.barColor" [style.width.%]="zone.total ? (zone.occupied / zone.total) * 100 : 0"></div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Performance Metrics -->
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Indicateurs de performance</h2>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">Croissance boutiques</span>
                </div>
                <span class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{{ stats.boutiquesChange }}%</span>
              </div>
              <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/>
                    </svg>
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">Boutiques par zone</span>
                </div>
                <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ boutiquesPerZone }}</span>
              </div>
              <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    </svg>
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">Emplacements libres</span>
                </div>
                <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.availableBoxes }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Occupation Details -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Détails d'occupation</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg class="w-8 h-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{{ stats.occupiedBoxes }}</p>
              <p class="text-gray-600 dark:text-gray-400 mt-1">Emplacements occupés</p>
            </div>
            <div class="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p class="text-3xl font-bold text-gray-600 dark:text-gray-400">{{ stats.availableBoxes }}</p>
              <p class="text-gray-600 dark:text-gray-400 mt-1">Emplacements disponibles</p>
            </div>
            <div class="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg class="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">{{ occupancyRate }}%</p>
              <p class="text-gray-600 dark:text-gray-400 mt-1">Taux d'occupation global</p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminStatisticsComponent implements OnInit {
  private adminService = inject(AdminService);

  stats: DashboardStats | null = null;

  zoneStats: { name: string; occupied: number; total: number; bgColor: string; barColor: string }[] = [];

  get occupancyRate(): number {
    return this.stats ? Math.round((this.stats.occupiedBoxes / this.stats.totalBoxes) * 100) : 0;
  }

  get boutiquesPerZone(): number {
    const zones = this.zoneStats.length || 1;
    return this.stats ? Math.round(this.stats.activeBoutiques / zones) : 0;
  }

  ngOnInit(): void {
    this.adminService.getDashboardStats().subscribe(stats => this.stats = stats);
    this.adminService.getBoxStats().subscribe((boxStats) => {
      const zoneColors = [
        { bgColor: 'bg-blue-500', barColor: 'bg-blue-500' },
        { bgColor: 'bg-purple-500', barColor: 'bg-purple-500' },
        { bgColor: 'bg-emerald-500', barColor: 'bg-emerald-500' },
        { bgColor: 'bg-amber-500', barColor: 'bg-amber-500' }
      ];
      this.zoneStats = (boxStats.byZone || []).map((zone, index) => {
        const color = zoneColors[index % zoneColors.length];
        return {
          name: zone._id || `Zone ${index + 1}`,
          occupied: zone.occupied || 0,
          total: zone.total || 0,
          bgColor: color.bgColor,
          barColor: color.barColor
        };
      });
    });
  }
}
