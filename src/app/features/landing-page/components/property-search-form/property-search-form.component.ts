import {
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { DEFAULT_FILTER, PropertyFilter } from '../../../properties/models/property.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Slider } from 'primeng/slider';
import { CityService } from '../../../properties/services/city.service';
import { AuthService } from '../../../../core/auth.service';
import { City } from '../../../properties/models/city.model';
import { County } from '../../../properties/models/county.model';
import { SelectModule } from 'primeng/select';


@Component({
  selector: 'app-property-search-form',
  standalone: true,
  imports: [FormsModule, CommonModule, Slider, SelectModule],
  templateUrl: './property-search-form.component.html',
})
export class PropertySearchFormComponent implements OnInit {
  private cityService = inject(CityService);
  protected authService = inject(AuthService);

  @Output() search = new EventEmitter<PropertyFilter>();
  @Output() saveSearch = new EventEmitter<void>();

  filter: PropertyFilter = { ...DEFAULT_FILTER };

  cities = signal<City[]>([]);
  counties = signal<County[]>([]);

  // Slider state
  readonly minPriceLimit = 0;
  readonly maxPriceLimit = 1000000;
  readonly minSurfaceLimit = 0;
  readonly maxSurfaceLimit = 500;

  rangeValues: number[] = [0, 1000000];
  surfaceRangeValues: number[] = [0, 500];

  inputs = {
    price: { lo: '', hi: '' },
    surface: { lo: '', hi: '' },
  };

  ngOnInit(): void {
    this.loadCounties();
    this.loadCities();
    this.syncInputsFromSlider('price');
    this.syncInputsFromSlider('surface');
  }

  onSubmit() {
    this.search.emit({ ...this.filter });
  }

  onSaveClick() {
    this.saveSearch.emit();
  }

  // Location
  onCountyChange() {
    this.filter.cityId = undefined;
    this.loadCities(this.filter.countyId);
  }

  private loadCounties() {
    this.cityService.getCounties().subscribe({
      next: (data) => this.counties.set(data),
      error: () => {},
    });
  }

  private loadCities(countyId?: number) {
    this.cities.set([]);
    const source$ = countyId
      ? this.cityService.getCitiesByCounty(countyId)
      : this.cityService.getCities();

    source$.subscribe({
      next: (data) => this.cities.set(data),
      error: () => {},
    });
  }

  //Slider logic
  onPriceRangeChange() {
    this.filter.minPrice = this.rangeValues[0];
    this.filter.maxPrice =
      this.rangeValues[1] === this.maxPriceLimit
        ? 999999999
        : this.rangeValues[1];
    this.syncInputsFromSlider('price');
  }

  onSurfaceRangeChange() {
    this.filter.minSurfaceArea = this.surfaceRangeValues[0];
    this.filter.maxSurfaceArea =
      this.surfaceRangeValues[1] === this.maxSurfaceLimit
        ? 999999999
        : this.surfaceRangeValues[1];
    this.syncInputsFromSlider('surface');
  }

  onInputChange(range: 'price' | 'surface', which: 'lo' | 'hi') {
    const raw = this.inputs[range][which];
    const parsed = parseInt(raw.replace(/\D/g, ''), 10);

    const config = {
      price: { min: this.minPriceLimit, max: this.maxPriceLimit, step: 1000 },
      surface: {
        min: this.minSurfaceLimit,
        max: this.maxSurfaceLimit,
        step: 1,
      },
    };
    const { min, max, step } = config[range];

    if (isNaN(parsed)) {
      this.syncInputsFromSlider(range);
      return;
    }

    const snapped =
      Math.round(Math.max(min, Math.min(max, parsed)) / step) * step;
    const values =
      range === 'price' ? this.rangeValues : this.surfaceRangeValues;
    const updated: [number, number] =
      which === 'lo'
        ? [Math.min(snapped, values[1] - step), values[1]]
        : [values[0], Math.max(snapped, values[0] + step)];

    if (range === 'price') {
      this.rangeValues = updated;
      this.onPriceRangeChange();
    } else {
      this.surfaceRangeValues = updated;
      this.onSurfaceRangeChange();
    }
  }

  private syncInputsFromSlider(range: 'price' | 'surface') {
    const values =
      range === 'price' ? this.rangeValues : this.surfaceRangeValues;
    const max = range === 'price' ? this.maxPriceLimit : this.maxSurfaceLimit;
    this.inputs[range].lo = this.formatValue(values[0], range);
    this.inputs[range].hi = this.formatValue(
      values[1],
      range,
      values[1] >= max,
    );
  }

  private formatValue(
    v: number,
    range: 'price' | 'surface',
    isMax = false,
  ): string {
    const suffix = isMax ? '+' : '';
    return range === 'price'
      ? v.toLocaleString('ro-RO') + ' €' + suffix
      : v + ' m²' + suffix;
  }
}
