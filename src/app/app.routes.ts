import { Routes } from '@angular/router';

// Existing pages
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';

// Layouts
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { AdminLayoutComponent } from './shared/layout/admin-layout/admin-layout.component';
import { BoutiqueLayoutComponent } from './shared/layout/boutique-layout/boutique-layout.component';
import { ShopLayoutComponent } from './shared/layout/shop-layout/shop-layout.component';

// Guards
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // ============================================
  // SHOP ROUTES - Customer facing (public + auth)
  // ============================================
  {
    path: '',
    component: ShopLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/shop/home/shop-home.component').then(m => m.ShopHomeComponent),
        pathMatch: 'full',
        title: 'Accueil | IAVOKO Centre Commercial'
      },
      {
        path: 'boutiques',
        loadComponent: () => import('./pages/shop/boutiques/boutique-listing/boutique-listing.component').then(m => m.BoutiqueListingComponent),
        title: 'Boutiques | IAVOKO Centre Commercial'
      },
      {
        path: 'boutiques/:slug',
        loadComponent: () => import('./pages/shop/boutiques/boutique-page/boutique-page.component').then(m => m.BoutiquePageComponent),
        title: 'Boutique | IAVOKO Centre Commercial'
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/shop/products/product-listing/product-listing.component').then(m => m.ProductListingComponent),
        title: 'Produits | IAVOKO Centre Commercial'
      },
      {
        path: 'product/:boutiqueSlug/:productSlug',
        loadComponent: () => import('./pages/shop/products/product-details/product-details.component').then(m => m.ProductDetailsComponent),
        title: 'Produit | IAVOKO Centre Commercial'
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/shop/categories/category-listing/category-listing.component').then(m => m.CategoryListingComponent),
        title: 'Categories | IAVOKO Centre Commercial'
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/shop/cart/cart.component').then(m => m.CartComponent),
        title: 'Panier | IAVOKO Centre Commercial'
      },
      {
        path: 'checkout',
        loadComponent: () => import('./pages/shop/checkout/checkout.component').then(m => m.CheckoutComponent),
        canActivate: [AuthGuard],
        title: 'Paiement | IAVOKO Centre Commercial'
      },
      {
        path: 'account',
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: ['acheteur'] },
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full'
          },
          {
            path: 'profile',
            loadComponent: () => import('./pages/shop/account/account-profile/account-profile.component').then(m => m.AccountProfileComponent),
            title: 'Mon Profil | IAVOKO Centre Commercial'
          },
          {
            path: 'orders',
            loadComponent: () => import('./pages/shop/account/account-orders/account-orders.component').then(m => m.AccountOrdersComponent),
            title: 'Mes Commandes | IAVOKO Centre Commercial'
          }
        ]
      }
    ]
  },

  // ============================================
  // AUTH ROUTES
  // ============================================
  {
    path: 'signin',
    component: SignInComponent,
    title: 'Connexion | IAVOKO Centre Commercial'
  },
  {
    path: 'signup',
    component: SignUpComponent,
    title: 'Inscription | IAVOKO Centre Commercial'
  },
  {
    path: 'signup/boutique',
    loadComponent: () => import('./pages/auth-pages/sign-up-boutique/sign-up-boutique.component').then(m => m.SignUpBoutiqueComponent),
    title: 'Inscription Boutique | IAVOKO Centre Commercial'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/auth-pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    title: 'Réinitialisation de mot de passe | IAVOKO Centre Commercial'
  },

  // ============================================
  // ADMIN ROUTES - IAVOKO Centre Commercial Admin
  // ============================================
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
        title: 'Tableau de bord | Admin'
      },
      {
        path: 'boutiques',
        loadComponent: () => import('./pages/admin/boutiques/boutique-list/boutique-list.component').then(m => m.AdminBoutiqueListComponent),
        title: 'Boutiques | Admin'
      },
      {
        path: 'boutiques/create',
        loadComponent: () => import('./pages/admin/boutiques/boutique-create/boutique-create.component').then(m => m.BoutiqueCreateComponent),
        title: 'Créer Boutique | Admin'
      },
      {
        path: 'boutiques/pending',
        loadComponent: () => import('./pages/admin/boutiques/boutique-validation/boutique-validation.component').then(m => m.BoutiqueValidationComponent),
        title: 'Validation Boutiques | Admin'
      },
      {
        path: 'boutiques/:id',
        loadComponent: () => import('./pages/admin/boutiques/boutique-details/boutique-details.component').then(m => m.AdminBoutiqueDetailsComponent),
        title: 'Details Boutique | Admin'
      },
      {
        path: 'boxes',
        loadComponent: () => import('./pages/admin/boxes/box-list/box-list.component').then(m => m.BoxListComponent),
        title: 'Emplacements | Admin'
      },
      {
        path: 'boxes/assignment',
        loadComponent: () => import('./pages/admin/boxes/box-assignment/box-assignment.component').then(m => m.BoxAssignmentComponent),
        title: 'Attribution Emplacements | Admin'
      },
      {
        path: 'categories',
        loadComponent: () => import('./pages/admin/categories/category-list/category-list.component').then(m => m.AdminCategoryListComponent),
        title: 'Categories | Admin'
      },
      {
        path: 'categories/new',
        loadComponent: () => import('./pages/admin/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
        title: 'Nouvelle Categorie | Admin'
      },
      {
        path: 'categories/:id/edit',
        loadComponent: () => import('./pages/admin/categories/category-form/category-form.component').then(m => m.CategoryFormComponent),
        title: 'Modifier Categorie | Admin'
      },
      {
        path: 'statistics',
        loadComponent: () => import('./pages/admin/statistics/admin-statistics.component').then(m => m.AdminStatisticsComponent),
        title: 'Statistiques | Admin'
      }
    ]
  },

  // ============================================
  // BOUTIQUE ROUTES - Store owner dashboard
  // ============================================
  {
    path: 'boutique',
    component: BoutiqueLayoutComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['boutique'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/boutique/dashboard/boutique-dashboard.component').then(m => m.BoutiqueDashboardComponent),
        title: 'Tableau de bord | Ma Boutique'
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/boutique/profile/boutique-profile.component').then(m => m.BoutiqueProfileComponent),
        title: 'Mon Profil | Ma Boutique'
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/boutique/products/product-list/product-list.component').then(m => m.BoutiqueProductListComponent),
        title: 'Produits | Ma Boutique'
      },
      {
        path: 'products/new',
        loadComponent: () => import('./pages/boutique/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        title: 'Nouveau Produit | Ma Boutique'
      },
      {
        path: 'products/:id/edit',
        loadComponent: () => import('./pages/boutique/products/product-form/product-form.component').then(m => m.ProductFormComponent),
        title: 'Modifier Produit | Ma Boutique'
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/boutique/orders/order-list/order-list.component').then(m => m.BoutiqueOrderListComponent),
        title: 'Commandes | Ma Boutique'
      },
      {
        path: 'orders/history',
        loadComponent: () => import('./pages/boutique/orders/order-history/order-history.component').then(m => m.OrderHistoryComponent),
        title: 'Historique | Ma Boutique'
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/boutique/orders/order-details/order-details.component').then(m => m.BoutiqueOrderDetailsComponent),
        title: 'Details Commande | Ma Boutique'
      },
      {
        path: 'statistics',
        loadComponent: () => import('./pages/boutique/statistics/boutique-statistics.component').then(m => m.BoutiqueStatisticsComponent),
        title: 'Statistiques | Ma Boutique'
      },
      // ── POS (Caisse) ──
      {
        path: 'pos',
        loadComponent: () => import('./pages/boutique/pos/pos-cashier.component').then(m => m.PosCashierComponent),
        title: 'Caisse | Ma Boutique'
      },
      {
        path: 'pos/history',
        loadComponent: () => import('./pages/boutique/pos/pos-history.component').then(m => m.PosHistoryComponent),
        title: 'Historique Ventes | Ma Boutique'
      }
    ]
  },

  // ============================================
  // LEGACY DASHBOARD ROUTES (for existing template demo)
  // ============================================
  {
    path: 'demo',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Demo Dashboard | TailAdmin'
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Calendar | TailAdmin'
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Profile | TailAdmin'
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Form Elements | TailAdmin'
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Basic Tables | TailAdmin'
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Blank Page | TailAdmin'
      },
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Invoice | TailAdmin'
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Line Chart | TailAdmin'
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Bar Chart | TailAdmin'
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Alerts | TailAdmin'
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Avatars | TailAdmin'
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Badges | TailAdmin'
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Buttons | TailAdmin'
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Images | TailAdmin'
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Videos | TailAdmin'
      }
    ]
  },

  // ============================================
  // ERROR ROUTES
  // ============================================
  {
    path: '**',
    component: NotFoundComponent,
    title: '404 | IAVOKO Centre Commercial'
  }
];
