import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { LandingPageComponent } from './features/landing-page/landing-page.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AddPropertyComponent } from './features/properties/add-property/add-property.component';
import { EditPropertyComponent } from './features/properties/edit-property/edit-property.component';
import { authGuard } from './core/guards/auth.guard';
import { ProfileComponent } from './features/auth/profile/profile.component';
import { PropertyDetailsComponent } from './features/properties/property-details/property-details.component';
import { PropertiesMapComponent } from './features/properties/properties-map/properties-map.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingPageComponent,
  },
  {
    path: 'map',
    component: PropertiesMapComponent,
  },
  {
    path: 'property/:id',
    component: PropertyDetailsComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'contul-meu',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'add-property',
    component: AddPropertyComponent,
    canActivate: [authGuard],
  },
  {
    path: 'edit-property/:id',
    component: EditPropertyComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
