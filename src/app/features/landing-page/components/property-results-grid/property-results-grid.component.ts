import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../../properties/models/property.model';
import { PropertyCardComponent } from '../../../../shared/components/property-card-component/property-card.component';

@Component({
  selector: 'app-property-results-grid',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent],
  templateUrl: './property-results-grid.component.html',
})
export class PropertyResultsGridComponent {
  @Input() properties: Property[] = [];
  @Input() isLoading = false;
}
