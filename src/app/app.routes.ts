import { Routes } from '@angular/router';
import { HomeComponent, EventSearchComponent } from './app';
import { RegisterComponent } from './app';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'etkinlikler', component: EventSearchComponent },
  { path: 'kayit', component: RegisterComponent },
];
