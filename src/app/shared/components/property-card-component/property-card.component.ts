import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Property } from '../../../features/properties/models/property.model';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './property-card.component.html',
})
export class PropertyCardComponent {
  @Input({ required: true }) property!: Property;

  get primaryImage(): string {
    return this.property.images?.length > 0
      ? this.property.images[0].url
      : 'assets/placeholder-property.jpg';
  }
}