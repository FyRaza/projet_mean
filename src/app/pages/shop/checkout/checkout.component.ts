import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CartService, CartByBoutique } from '../../../shared/services/cart.service';
import { AuthService } from '../../../shared/services/auth.service';
import { CartSummary } from '../../../core/models/cart.model';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  landmark?: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

type PaymentMethod = 'cash' | 'mobile_money' | 'card' | 'cash_on_pickup';
type DeliveryMethod = 'delivery' | 'pickup';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">Finaliser la commande</h1>

      @if ((cartByBoutique$ | async)?.length === 0) {
        <!-- Empty Cart -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div class="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">Votre panier est vide</h2>
          <p class="text-gray-500 dark:text-gray-400 mb-6">Ajoutez des produits avant de passer commande</p>
          <a
            routerLink="/products"
            class="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            Decouvrir les produits
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Checkout Form -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Step 1: Fulfillment Method -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">1</div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Mode de reception</h2>
                </div>
              </div>
              <div class="p-6 space-y-3">
                <label
                  class="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors"
                  [class]="selectedDeliveryMethod() === 'delivery'
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600'"
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    [checked]="selectedDeliveryMethod() === 'delivery'"
                    (change)="selectDeliveryMethod('delivery')"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">Livraison</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Le livreur apporte la commande a votre adresse.</p>
                  </div>
                </label>
                <label
                  class="flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors"
                  [class]="selectedDeliveryMethod() === 'pickup'
                    ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600'"
                >
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    [checked]="selectedDeliveryMethod() === 'pickup'"
                    (change)="selectDeliveryMethod('pickup')"
                  />
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">Retrait en boutique</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Vous recuperez la commande directement au point de vente.</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Step 2: Delivery Address -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">2</div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Adresse de livraison</h2>
                </div>
              </div>
              <div class="p-6">
                @if (!isDeliverySelected()) {
                  <div class="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-sm text-green-700 dark:text-green-300">
                    Le retrait en boutique est selectionne. Aucune adresse de livraison n'est requise.
                  </div>
                } @else {
                @if (addresses().length > 0) {
                  <div class="space-y-3">
                    @for (address of addresses(); track address.id) {
                      <label
                        class="flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors"
                        [class]="selectedAddressId() === address.id
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600'"
                      >
                        <input
                          type="radio"
                          name="address"
                          [value]="address.id"
                          [checked]="selectedAddressId() === address.id"
                          (change)="selectAddress(address.id)"
                          class="mt-1"
                        />
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <span class="font-medium text-gray-900 dark:text-white">{{ address.label }}</span>
                            @if (address.isDefault) {
                              <span class="px-2 py-0.5 text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded">
                                Par defaut
                              </span>
                            }
                          </div>
                          <p class="text-sm text-gray-600 dark:text-gray-400">{{ address.fullName }}</p>
                          <p class="text-sm text-gray-600 dark:text-gray-400">{{ address.street }}</p>
                          <p class="text-sm text-gray-600 dark:text-gray-400">{{ address.postalCode }} {{ address.city }}, {{ address.country }}</p>
                          <p class="text-sm text-gray-600 dark:text-gray-400">Tel: {{ address.phone }}</p>
                        </div>
                      </label>
                    }
                  </div>
                  <button
                    type="button"
                    (click)="showNewAddressForm.set(true)"
                    class="mt-4 text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter une nouvelle adresse
                  </button>
                } @else {
                  <p class="text-gray-500 dark:text-gray-400 mb-4">Aucune adresse enregistree</p>
                }

                @if (showNewAddressForm() || addresses().length === 0) {
                  <div class="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4">
                    <h3 class="font-medium text-gray-900 dark:text-white">Nouvelle adresse</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom complet</label>
                        <input
                          type="text"
                          [(ngModel)]="newAddress.fullName"
                          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Votre nom"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telephone</label>
                        <input
                          type="tel"
                          [(ngModel)]="newAddress.phone"
                          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="+261 34 00 000 00"
                        />
                      </div>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse / Rue</label>
                      <input
                        type="text"
                        [(ngModel)]="newAddress.street"
                        class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Rue, numero, quartier"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quartier / Repere (optionnel)</label>
                      <input
                        type="text"
                        [(ngModel)]="newAddress.landmark"
                        class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ex: pres de la pharmacie..."
                      />
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                        <input
                          type="text"
                          [(ngModel)]="newAddress.city"
                          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Antananarivo"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code postal</label>
                        <input
                          type="text"
                          [(ngModel)]="newAddress.postalCode"
                          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="101"
                        />
                      </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Latitude (optionnel)</label>
                        <input
                          type="number"
                          step="any"
                          [(ngModel)]="newAddress.latitude"
                          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="-18.8792"
                        />
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Longitude (optionnel)</label>
                        <input
                          type="number"
                          step="any"
                          [(ngModel)]="newAddress.longitude"
                          class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="47.5079"
                        />
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <button
                        type="button"
                        (click)="useCurrentLocation()"
                        [disabled]="isLocating()"
                        class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        @if (isLocating()) {
                          Localisation...
                        } @else {
                          Utiliser ma position actuelle
                        }
                      </button>
                      @if (locationError()) {
                        <span class="text-sm text-red-600 dark:text-red-400">{{ locationError() }}</span>
                      }
                    </div>
                    <div class="flex items-center gap-3">
                      <button
                        type="button"
                        (click)="saveNewAddress()"
                        class="px-4 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
                      >
                        Enregistrer
                      </button>
                      @if (addresses().length > 0) {
                        <button
                          type="button"
                          (click)="showNewAddressForm.set(false)"
                          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          Annuler
                        </button>
                      }
                    </div>
                  </div>
                }
                }
              </div>
            </div>

            <!-- Step 3: Payment Method -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">3</div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Mode de paiement</h2>
                </div>
              </div>
              <div class="p-6">
                <div class="space-y-3">
                  @for (method of getAvailablePaymentMethods(); track method.id) {
                    <label
                      class="flex items-center gap-4 p-4 border rounded-lg transition-colors relative"
                      [class]="method.available && ((selectedDeliveryMethod() === 'pickup' && method.id === 'cash_on_pickup') || (selectedDeliveryMethod() === 'delivery' && selectedPaymentMethod() === method.id))
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/20 cursor-pointer'
                        : method.available
                        ? 'border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 cursor-pointer'
                        : 'border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'"
                    >
                      <input
                        type="radio"
                        name="payment"
                        [value]="method.id"
                        [checked]="(selectedDeliveryMethod() === 'pickup' && method.id === 'cash_on_pickup') || (selectedDeliveryMethod() === 'delivery' && selectedPaymentMethod() === method.id)"
                        [disabled]="!method.available"
                        (change)="selectPaymentMethod(method.id)"
                        class="disabled:cursor-not-allowed"
                      />
                      <div class="w-10 h-10 rounded-lg flex items-center justify-center" [class]="method.bgColor">
                        <svg class="w-5 h-5" [class]="method.iconColor" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="method.icon" />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <div class="flex items-center gap-2">
                          <p class="font-medium text-gray-900 dark:text-white">{{ method.name }}</p>
                          @if (!method.available) {
                            <span class="px-2 py-0.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                              Pas encore disponible
                            </span>
                          }
                        </div>
                        <p class="text-sm text-gray-500 dark:text-gray-400">{{ method.description }}</p>
                      </div>
                    </label>
                  }
                </div>
                
                @if (selectedDeliveryMethod() === 'pickup') {
                  <div class="mt-4 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                    <div class="flex items-start gap-3">
                      <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div class="text-sm text-blue-700 dark:text-blue-300">
                        <p class="font-medium mb-1">Important :</p>
                        <p class="mb-2">La commande s'annulera automatiquement si vous ne la récupérez pas après 24 heures.</p>
                        <p class="text-xs text-blue-600 dark:text-blue-400">Note : Si vous payez directement le produit via paiement en ligne (pas encore disponible pour le moment), vous pourrez le récupérer à tout moment.</p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Step 4: Order Summary by Boutique -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm">4</div>
                  <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Resume des articles</h2>
                </div>
              </div>
              <div class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (boutique of (cartByBoutique$ | async); track boutique.boutiqueId) {
                  <div class="p-6">
                    <div class="flex items-center gap-2 mb-4">
                      <div class="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                        <svg class="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <span class="font-medium text-gray-900 dark:text-white">{{ boutique.boutiqueName }}</span>
                    </div>
                    <div class="space-y-3">
                      @for (item of boutique.items; track item.id) {
                        <div class="flex items-center gap-4">
                          <div class="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                            @if (item.product.images?.[0]?.url) {
                              <img [src]="item.product.images[0].url" [alt]="item.product.name" class="w-full h-full object-cover" />
                            }
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-900 dark:text-white truncate">{{ item.product.name }}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">Qte: {{ item.quantity }} x {{ item.unitPrice | number:'1.0-0' }} Ar</p>
                          </div>
                          <p class="font-medium text-gray-900 dark:text-white">{{ item.totalPrice | number:'1.0-0' }} Ar</p>
                        </div>
                      }
                    </div>
                    <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm">
                      <span class="text-gray-500 dark:text-gray-400">Sous-total boutique</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ boutique.subtotal | number:'1.0-0' }} Ar</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Notes -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes de commande (optionnel)</label>
              <textarea
                [(ngModel)]="orderNotes"
                rows="3"
                class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Instructions speciales (livraison ou retrait)..."
              ></textarea>
            </div>
          </div>

          <!-- Order Summary Sidebar -->
          <div>
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Total de la commande</h2>

              @if (cartSummary$ | async; as summary) {
                <div class="space-y-3 mb-4">
                  <div class="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Articles ({{ summary.itemCount }})</span>
                    <span>{{ summary.subtotal | number:'1.0-0' }} Ar</span>
                  </div>
                  <div class="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>{{ selectedDeliveryMethod() === 'pickup' ? 'Retrait' : 'Livraison' }}</span>
                    <span class="text-green-600 dark:text-green-400">{{ selectedDeliveryMethod() === 'pickup' ? 'Boutique' : 'Gratuite' }}</span>
                  </div>
                  <div class="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>TVA (20%)</span>
                    <span>{{ summary.tax | number:'1.0-0' }} Ar</span>
                  </div>
                </div>

                <div class="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <span>Total</span>
                  <span>{{ summary.total | number:'1.0-0' }} Ar</span>
                </div>
              }

              <button
                type="button"
                (click)="placeOrder()"
                [disabled]="!canPlaceOrder() || isPlacingOrder()"
                class="w-full px-6 py-4 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                @if (isPlacingOrder()) {
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Traitement en cours...
                } @else {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmer la commande
                }
              </button>

              @if (!canPlaceOrder()) {
                <p class="mt-3 text-sm text-center text-red-600 dark:text-red-400">
                  {{ getCheckoutValidationMessage() }}
                </p>
              }

              <p class="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
                En confirmant, vous acceptez nos
                <a href="#" class="text-brand-600 dark:text-brand-400 hover:underline">conditions generales</a>
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Order Success Modal -->
      @if (showOrderSuccess()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
            <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Commande confirmee !</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-2">Votre commande a ete passee avec succes.</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Numero de commande: <span class="font-mono font-bold">{{ orderNumber() }}</span></p>
            <div class="flex flex-col gap-3">
              <a
                routerLink="/account/orders"
                class="px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
              >
                Voir mes commandes
              </a>
              <a
                routerLink="/"
                class="px-6 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Retour a l'accueil
              </a>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private router = inject(Router);

  cartByBoutique$ = this.cartService.cartByBoutique$;
  cartSummary$ = this.cartService.cartSummary$;

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  selectedDeliveryMethod = signal<DeliveryMethod>('delivery');
  selectedPaymentMethod = signal<PaymentMethod | null>(null);
  showNewAddressForm = signal<boolean>(false);
  isPlacingOrder = signal<boolean>(false);
  showOrderSuccess = signal<boolean>(false);
  orderNumber = signal<string>('');
  orderNotes = '';
  isLocating = signal<boolean>(false);
  locationError = signal<string>('');

  newAddress = {
    fullName: '',
    phone: '',
    street: '',
    landmark: '',
    city: '',
    postalCode: '',
    country: 'Madagascar',
    latitude: '',
    longitude: ''
  };

  paymentMethods = [
    {
      id: 'cash' as PaymentMethod,
      name: 'Paiement a la livraison',
      description: 'Payez en especes lors de la reception',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      available: true
    },
    {
      id: 'cash_on_pickup' as PaymentMethod,
      name: 'Paiement au retrait',
      description: 'Payez en especes lors du retrait en boutique',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      available: true
    },
    {
      id: 'mobile_money' as PaymentMethod,
      name: 'Mobile Money',
      description: 'Orange Money, Mvola, Airtel Money',
      icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      available: false
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Carte bancaire / Paiement en ligne',
      description: 'Visa, Mastercard',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      available: false
    }
  ];

  ngOnInit(): void {
    this.loadAddresses();
    // Pre-fill new address with user info
    const user = this.authService.currentUser;
    if (user) {
      this.newAddress.fullName = `${user.firstName} ${user.lastName}`;
      this.newAddress.phone = user.phone || '';
    }
  }

  private loadAddresses(): void {
    this.authService.getMyAddresses().subscribe({
      next: (addresses) => {
        const mappedAddresses: Address[] = (addresses || []).map((address: any) => ({
          id: address.id,
          label: address.label || 'Adresse',
          fullName: address.fullName || `${this.authService.currentUser?.firstName || ''} ${this.authService.currentUser?.lastName || ''}`.trim(),
          phone: address.phone || this.authService.currentUser?.phone || '',
          street: address.street || '',
          landmark: address.landmark || '',
          city: address.city || '',
          postalCode: address.postalCode || '',
          country: address.country || 'Madagascar',
          latitude: address.latitude,
          longitude: address.longitude,
          isDefault: !!address.isDefault
        }));

        this.addresses.set(mappedAddresses);
        const defaultAddress = mappedAddresses.find(a => a.isDefault) || mappedAddresses[0];
        if (defaultAddress) this.selectedAddressId.set(defaultAddress.id);
      },
      error: () => this.addresses.set([])
    });
  }

  selectAddress(id: string): void {
    this.selectedAddressId.set(id);
  }

  selectPaymentMethod(method: PaymentMethod): void {
    const methodObj = this.paymentMethods.find(m => m.id === method);
    if (methodObj && methodObj.available) {
      this.selectedPaymentMethod.set(method);
    }
  }

  selectDeliveryMethod(method: DeliveryMethod): void {
    this.selectedDeliveryMethod.set(method);
    // Si retrait sélectionné, forcer le paiement au retrait
    if (method === 'pickup') {
      this.selectedPaymentMethod.set('cash_on_pickup');
    } else if (method === 'delivery') {
      // Si on revient à livraison et que c'était cash_on_pickup, passer à cash
      if (this.selectedPaymentMethod() === 'cash_on_pickup') {
        this.selectedPaymentMethod.set('cash');
      }
    }
  }

  isDeliverySelected(): boolean {
    return this.selectedDeliveryMethod() === 'delivery';
  }

  getAvailablePaymentMethods() {
    if (this.selectedDeliveryMethod() === 'pickup') {
      // Pour retrait, on affiche uniquement cash_on_pickup
      return this.paymentMethods.filter(m => m.id === 'cash_on_pickup');
    } else {
      // Pour livraison, on affiche tous sauf cash_on_pickup
      return this.paymentMethods.filter(m => m.id !== 'cash_on_pickup');
    }
  }

  saveNewAddress(): void {
    if (!this.newAddress.fullName || !this.newAddress.phone || (!this.newAddress.street && !this.newAddress.landmark)) {
      return;
    }

    this.authService.addAddress({
      label: 'Nouvelle adresse',
      fullName: this.newAddress.fullName,
      phone: this.newAddress.phone,
      street: this.newAddress.street,
      landmark: this.newAddress.landmark,
      city: this.newAddress.city,
      postalCode: this.newAddress.postalCode || '',
      country: this.newAddress.country,
      latitude: this.parseCoordinate(this.newAddress.latitude),
      longitude: this.parseCoordinate(this.newAddress.longitude),
      isDefault: this.addresses().length === 0
    }).subscribe({
      next: (created) => {
        this.addresses.update(addrs => [...addrs, created as Address]);
        this.selectedAddressId.set((created as Address).id);
        this.showNewAddressForm.set(false);

        this.newAddress = {
          fullName: '',
          phone: '',
          street: '',
          landmark: '',
          city: '',
          postalCode: '',
          country: 'Madagascar',
          latitude: '',
          longitude: ''
        };
      }
    });
  }

  canPlaceOrder(): boolean {
    const hasAddress = this.isDeliverySelected() ? !!this.selectedAddressId() : true;
    // Pour pickup, cash_on_pickup est automatiquement sélectionné
    const hasPayment = this.isDeliverySelected() ? !!this.selectedPaymentMethod() : true;
    return hasAddress && hasPayment;
  }

  getCheckoutValidationMessage(): string {
    if (this.isDeliverySelected() && !this.selectedAddressId()) {
      return 'Veuillez selectionner une adresse de livraison';
    }
    if (!this.selectedPaymentMethod()) {
      return 'Veuillez selectionner un mode de paiement';
    }
    return '';
  }

  placeOrder(): void {
    if (!this.canPlaceOrder()) return;

    this.isPlacingOrder.set(true);

    const addrId = this.selectedAddressId();
    const addr = this.addresses().find(a => a.id === addrId);

    // Convert address to expected params format
    const shippingAddress = this.isDeliverySelected() && addr ? {
      street: addr.street,
      landmark: addr.landmark,
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country,
      latitude: addr.latitude,
      longitude: addr.longitude
    } : undefined;

    // Déterminer le paymentMethod à envoyer
    let paymentMethodToSend: string = this.selectedPaymentMethod() || 'cash';
    if (this.selectedDeliveryMethod() === 'pickup') {
      paymentMethodToSend = 'cash_on_pickup';
    } else if (paymentMethodToSend === 'cash_on_pickup') {
      paymentMethodToSend = 'cash';
    }

    this.cartService.checkout({
      fulfillmentType: this.selectedDeliveryMethod(),
      shippingAddress,
      notes: this.orderNotes || undefined,
      paymentMethod: paymentMethodToSend
    }).subscribe({
      next: (orderIds) => {
        // orderIds is an array of created order IDs from the backend
        const orderNum = orderIds && orderIds.length > 0 ? orderIds[0].slice(-8).toUpperCase() : 'CMD-XXXX';
        this.orderNumber.set(orderNum);
        this.isPlacingOrder.set(false);
        this.showOrderSuccess.set(true);
      },
      error: (err) => {
        console.error('Erreur lors de la création de la commande', err);
        alert('Une erreur est survenue lors de la validation de la commande. Veuillez réessayer.');
        this.isPlacingOrder.set(false);
      }
    });
  }

  private parseCoordinate(value: string): number | undefined {
    if (!value?.trim()) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  useCurrentLocation(): void {
    this.locationError.set('');
    if (!('geolocation' in navigator)) {
      this.locationError.set('La geolocalisation n est pas supportee par ce navigateur.');
      return;
    }

    this.isLocating.set(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.newAddress.latitude = position.coords.latitude.toString();
        this.newAddress.longitude = position.coords.longitude.toString();
        this.isLocating.set(false);
      },
      (error) => {
        const messageMap: Record<number, string> = {
          1: 'Permission de localisation refusee.',
          2: 'Position indisponible.',
          3: 'Delai depasse pour obtenir la position.'
        };
        this.locationError.set(messageMap[error.code] || 'Impossible de recuperer la position.');
        this.isLocating.set(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
}
