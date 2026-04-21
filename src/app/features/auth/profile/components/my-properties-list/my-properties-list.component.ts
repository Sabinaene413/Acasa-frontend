import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PropertyService } from '../../../../properties/services/property.service';
import { Property } from '../../../../properties/models/property.model';
import { signal } from '@angular/core';

@Component({
  selector: 'app-my-properties-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-properties-list.component.html',
})
export class MyPropertiesListComponent implements OnInit {
  private propertyService = inject(PropertyService);
  protected router = inject(Router);

  properties = signal<Property[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.loadProperties();
  }

  private loadProperties() {
    this.isLoading.set(true);
    this.propertyService.getUserProperties().subscribe({
      next: (data) => {
        this.properties.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onEdit(id: number) {
    if (!id) return;
    this.router.navigate(['/edit-property', id]);
  }

  onAdd() {
    this.router.navigate(['/add-property']);
  }
}
