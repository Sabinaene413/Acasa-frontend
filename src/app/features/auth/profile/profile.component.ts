import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../../core/components/navbar/navbar.component';
import { AuthService } from '../../../core/auth.service';
import { MyPropertiesListComponent } from './components/my-properties-list/my-properties-list.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, MyPropertiesListComponent],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  protected authService = inject(AuthService);
  protected router = inject(Router);

  ngOnInit() {
    this.authService.getCurrentUser().subscribe();
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
