import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { OrderService } from '../../../../shared/services/order.service';
import { Order, OrderStatus } from '../../../../core/models/order.model';

interface StatusHistory {
  status: OrderStatus;
  date: Date;
  note?: string;
}

@Component({
  selector: 'app-boutique-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="space-y-6">
      @if (order(); as ord) {
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <a routerLink="/boutique/orders" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </a>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ ord.orderNumber }}</h1>
              <span [class]="getStatusBadgeClass(ord.status)">{{ getStatusLabel(ord.status) }}</span>
            </div>
            <p class="text-gray-500 dark:text-gray-400">
              Commande passee le {{ ord.createdAt | date:'dd MMMM yyyy' }} a {{ ord.createdAt | date:'HH:mm' }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              (click)="printOrder()"
              class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimer
            </button>
            @if (ord.status !== 'delivered' && ord.status !== 'cancelled') {
              <button
                (click)="advanceStatus()"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {{ getNextStatusAction() }}
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Content -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Order Items -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Articles commandes</h2>
              </div>
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (item of ord.items; track item.id) {
                  <div class="p-4 flex items-center gap-4">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                      <img [src]="item.productImage" [alt]="item.productName" class="w-full h-full object-cover" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-gray-900 dark:text-white">{{ item.productName }}</h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">SKU: {{ item.productId }}</p>
                    </div>
                    <div class="text-center">
                      <p class="text-sm text-gray-500 dark:text-gray-400">Quantite</p>
                      <p class="font-medium text-gray-900 dark:text-white">{{ item.quantity }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm text-gray-500 dark:text-gray-400">Prix unitaire</p>
                      <p class="font-medium text-gray-900 dark:text-white">{{ item.unitPrice | number:'1.0-0' }} Ar</p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm text-gray-500 dark:text-gray-400">Total</p>
                      <p class="font-medium text-gray-900 dark:text-white">{{ item.totalPrice | number:'1.0-0' }} Ar</p>
                    </div>
                  </div>
                }
              </div>
              <div class="p-4 bg-gray-50 dark:bg-gray-900">
                <div class="flex justify-end">
                  <div class="w-64 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500 dark:text-gray-400">Sous-total</span>
                      <span class="text-gray-900 dark:text-white">{{ ord.subtotal | number:'1.0-0' }} Ar</span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500 dark:text-gray-400">Livraison (Taxe)</span>
                      <span class="text-gray-900 dark:text-white">{{ ord.tax | number:'1.0-0' }} Ar</span>
                    </div>
                    <hr class="border-gray-200 dark:border-gray-700" />
                    <div class="flex justify-between font-semibold">
                      <span class="text-gray-900 dark:text-white">Total</span>
                      <span class="text-brand-600 dark:text-brand-400 text-lg">{{ ord.total | number:'1.0-0' }} Ar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-6">Historique de la commande</h2>

              <div class="relative">
                <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                <div class="space-y-6">
                  @for (history of statusHistory(); track history.status) {
                    <div class="relative flex gap-4 pl-10">
                      <div class="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center"
                           [class]="isStatusComplete(history.status) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'">
                        @if (isStatusComplete(history.status)) {
                          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                        } @else {
                          <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                        }
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center justify-between">
                          <h3 class="font-medium text-gray-900 dark:text-white">{{ getStatusLabel(history.status) }}</h3>
                          <span class="text-sm text-gray-500 dark:text-gray-400">
                            {{ history.date | date:'dd/MM/yyyy HH:mm' }}
                          </span>
                        </div>
                        @if (history.note) {
                          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ history.note }}</p>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes internes</h2>
              <textarea
                [(ngModel)]="internalNote"
                rows="3"
                placeholder="Ajouter une note interne..."
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              ></textarea>
              <div class="flex justify-end mt-3">
                <button
                  (click)="addNote()"
                  class="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  Ajouter une note
                </button>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Customer Info -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations client</h2>

              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                    <span class="text-lg font-bold text-brand-600 dark:text-brand-400">
                      {{ ord.customerName.charAt(0) }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">{{ ord.customerName }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Client</p>
                  </div>
                </div>

                <hr class="border-gray-200 dark:border-gray-700" />

                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a [href]="'mailto:' + ord.customerEmail" class="text-brand-600 dark:text-brand-400 hover:underline">
                      {{ ord.customerEmail }}
                    </a>
                  </div>
                  <div class="flex items-center gap-3">
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <!-- Phone property is missing on standard user model directly accessible here without populating. Leaving generically for now -->
                    <span class="text-gray-600 dark:text-gray-300">
                      Non defini
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Shipping Address -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {{ ord.fulfillmentType === 'pickup' ? 'Retrait en boutique' : 'Adresse de livraison' }}
              </h2>

              @if (ord.fulfillmentType === 'pickup') {
                <p class="text-gray-600 dark:text-gray-300">Le client recuperera la commande au point de vente.</p>
              } @else {
                <div class="space-y-1 text-gray-600 dark:text-gray-300">
                  <p>{{ ord.shippingAddress?.street || ord.shippingAddress?.landmark || 'N/A' }}</p>
                  @if (ord.shippingAddress?.landmark) {
                    <p>Repere: {{ ord.shippingAddress?.landmark }}</p>
                  }
                  <p>{{ ord.shippingAddress?.postalCode || '' }} {{ ord.shippingAddress?.city || '' }}</p>
                  <p>{{ ord.shippingAddress?.country || '' }}</p>
                </div>
              }

              @if (ord.fulfillmentType !== 'pickup' && hasMapCoordinates(ord)) {
                <button
                  (click)="openMap()"
                  class="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Voir sur la carte
                </button>
              }
            </div>

            <!-- Payment Info -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Paiement</h2>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Paiement</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ ord.paymentStatus }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Statut</span>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Paye
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Montant</span>
                  <span class="font-bold text-brand-600 dark:text-brand-400">{{ ord.total | number:'1.0-0' }} Ar</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      } @else {
        <!-- Loading State -->
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
        </div>
      }

      <!-- Success Toast -->
      @if (showToast()) {
        <div class="fixed bottom-6 right-6 px-6 py-4 bg-green-600 text-white rounded-lg shadow-lg flex items-center gap-3 z-50">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ toastMessage() }}</span>
        </div>
      }
    </div>
  `
})
export class BoutiqueOrderDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderId = '';
  order = signal<Order | null>(null);
  statusHistory = signal<StatusHistory[]>([]);
  internalNote = '';
  showToast = signal(false);
  toastMessage = signal('');

  statusOrder: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    this.loadOrder();
  }

  private loadOrder(): void {
    this.orderService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loadStatusHistory(order);
      },
      error: (err) => {
        console.error('Order not found', err);
        this.router.navigate(['/boutique/orders']);
      }
    });
  }

  private loadStatusHistory(order: Order): void {
    const history: StatusHistory[] = [];
    const baseDate = new Date(order.createdAt);

    // Add history based on current status
    const currentStatusIndex = this.statusOrder.indexOf(order.status);

    for (let i = 0; i <= currentStatusIndex; i++) {
      history.push({
        status: this.statusOrder[i],
        date: new Date(baseDate.getTime() + i * 3600000), // Add 1 hour for each status
        note: this.getStatusNote(this.statusOrder[i])
      });
    }

    this.statusHistory.set(history);
  }

  private getStatusNote(status: OrderStatus): string {
    const notes: Record<string, string> = {
      'pending': "Commande reçue et en attente de confirmation",
      'confirmed': "Commande confirmée par la boutique",
      'shipped': "Commande en cours d'expédition",
      'delivered': "Commande livrée avec succès",
      'cancelled': "Commande annulée",
      'refunded': "Commande remboursée"
    };
    return notes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'confirmed': 'Confirmée',
      'shipped': 'Expédiée',
      'delivered': 'Livrée',
      'cancelled': 'Annulée',
      'refunded': 'Remboursée'
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'confirmed': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'shipped': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'delivered': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'cancelled': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'refunded': 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    };
    return classes[status] || '';
  }

  isStatusComplete(status: OrderStatus): boolean {
    const ord = this.order();
    if (!ord) return false;
    const currentIndex = this.statusOrder.indexOf(ord.status);
    const checkIndex = this.statusOrder.indexOf(status);
    return checkIndex <= currentIndex;
  }

  getNextStatusAction(): string {
    const ord = this.order();
    if (!ord) return '';
    const actions: Record<string, string> = {
      'pending': 'Confirmer',
      'confirmed': 'Expédier',
      'shipped': 'Marquer livré'
    };
    return actions[ord.status] || '';
  }

  advanceStatus(): void {
    const ord = this.order();
    if (!ord) return;

    const currentIndex = this.statusOrder.indexOf(ord.status);
    if (currentIndex < this.statusOrder.length - 1) {
      const newStatus = this.statusOrder[currentIndex + 1];

      this.orderService.updateOrderStatus(ord.id, newStatus).subscribe({
        next: (updatedOrder) => {
          this.order.set(updatedOrder);
          this.loadStatusHistory(updatedOrder);
          this.showNotification(`Commande ${this.getStatusLabel(newStatus).toLowerCase()}`);
        },
        error: (err) => {
          console.error('Erreur', err);
          alert('Impossible de mettre à jour la commande.');
        }
      });
    }
  }

  cancelOrder(): void {
    const ord = this.order();
    if (!ord) return;

    if (confirm('Êtes-vous sûr de vouloir annuler cette commande?')) {
      this.orderService.updateOrderStatus(ord.id, 'cancelled').subscribe({
        next: (updatedOrder) => {
          this.order.set(updatedOrder);
          this.loadStatusHistory(updatedOrder);
          this.showNotification('Commande annulée');
        },
        error: (err) => {
          console.error('Erreur', err);
          alert("Impossible d'annuler la commande.");
        }
      });
    }
  }

  addNote(): void {
    if (this.internalNote.trim()) {
      // In real app, save note to backend
      this.showNotification('Note ajoutee');
      this.internalNote = '';
    }
  }

  openMap(): void {
    const ord = this.order();
    const latitude = ord?.shippingAddress?.latitude;
    const longitude = ord?.shippingAddress?.longitude;
    if (latitude === undefined || longitude === undefined) {
      this.showNotification("Coordonnées GPS indisponibles");
      return;
    }
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    window.open(mapUrl, '_blank', 'noopener,noreferrer');
  }

  hasMapCoordinates(order: Order): boolean {
    return order?.shippingAddress?.latitude !== undefined && order?.shippingAddress?.longitude !== undefined;
  }

  printOrder(): void {
    const ord = this.order();
    if (!ord) return;
    this.printHtml(this.buildPrintableHtml(ord, 'Impression commande'));
  }

  private buildPrintableHtml(ord: Order, title: string): string {
    const itemsRows = ord.items.map((item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>${item.unitPrice.toLocaleString('fr-FR')} Ar</td>
        <td>${item.totalPrice.toLocaleString('fr-FR')} Ar</td>
      </tr>
    `).join('');
    const address = ord.shippingAddress
      ? `${ord.shippingAddress.street || ''}, ${ord.shippingAddress.postalCode || ''} ${ord.shippingAddress.city || ''}, ${ord.shippingAddress.country || ''}`
      : 'N/A';
    return `
      <html>
        <head>
          <title>${title} - ${ord.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin: 0 0 8px; }
            .meta { margin-bottom: 16px; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f3f4f6; }
            .total { margin-top: 16px; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>Commande ${ord.orderNumber}</h1>
          <div class="meta"><strong>Boutique:</strong> ${ord.boutiqueName || 'N/A'}</div>
          <div class="meta">Client: ${ord.customerName} (${ord.customerEmail})</div>
          <div class="meta">Date: ${new Date(ord.createdAt).toLocaleString('fr-FR')}</div>
          <div class="meta">Adresse: ${address}</div>
          <table>
            <thead>
              <tr><th>Produit</th><th>Qté</th><th>Prix unitaire</th><th>Total</th></tr>
            </thead>
            <tbody>${itemsRows}</tbody>
          </table>
          <div class="total">Montant total: ${ord.total.toLocaleString('fr-FR')} Ar</div>
        </body>
      </html>
    `;
  }

  private printHtml(html: string): void {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!frameDoc) {
      document.body.removeChild(iframe);
      this.showNotification("Impossible de preparer l'aperçu d'impression");
      return;
    }

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    };
  }

  showNotification(message: string): void {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
