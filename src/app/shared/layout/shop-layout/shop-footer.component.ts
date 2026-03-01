import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shop-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <footer class="bg-gray-900 text-gray-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-center">
          <p class="text-sm text-gray-500">
            &copy; {{ currentYear }} RAKOTONIRINA Mirantsoa Fanyah et RAZAKANARY Fitahiantsoa Finaritra
          </p>
        </div>
      </div>
    </footer>
  `
})
export class ShopFooterComponent {
  currentYear = new Date().getFullYear();
}
