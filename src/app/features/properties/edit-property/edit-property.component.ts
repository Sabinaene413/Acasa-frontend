import { Component, inject, signal, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PropertyService } from '../services/property.service';
import { CityService } from '../services/city.service';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/auth.service';
import { NavbarComponent } from '../../../core/components/navbar/navbar.component';
import { City } from '../models/city.model';
import { PropertyImage } from '../models/property.model';
import { map, Subject, switchMap, takeUntil } from 'rxjs';
import * as L from 'leaflet';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-edit-property',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NavbarComponent, SelectModule],
  templateUrl: './edit-property.component.html',
})
export class EditPropertyComponent implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private propertyService = inject(PropertyService);
  private cityService = inject(CityService);
  private geocodingService = inject(GeocodingService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();

  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map?: L.Map;
  private marker?: L.Marker;

  propertyForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(20)]],
    price: [0, [Validators.required, Validators.min(1)]],
    address: ['', [Validators.required]],
    cityId: ['', [Validators.required]],
    bedrooms: [0, [Validators.required, Validators.min(0)]],
    bathrooms: [0, [Validators.required, Validators.min(0)]],
    surfaceArea: [0, [Validators.required, Validators.min(1)]],
  });

  propertyId?: number;
  cities = signal<City[]>([]);
  existingImages = signal<PropertyImage[]>([]);
  newFiles = signal<File[]>([]);
  newPreviews = signal<string[]>([]);
  imagesToDelete = signal<number[]>([]);
  isSubmitting = signal<boolean>(false);
  isLoading = signal<boolean>(true);
  isGeocoding = signal<boolean>(false);
  locationConfirmed = signal<boolean>(false);
  confirmedLat = signal<number | null>(null);
  confirmedLng = signal<number | null>(null);

  ngOnInit() {
    this.loadCities();
    this.loadProperty();

    this.propertyForm.get('address')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.locationConfirmed.set(false));

    this.propertyForm.get('cityId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.locationConfirmed.set(false));
  }

  ngAfterViewInit() {
  }

  private initMap(existingLat?: number | null, existingLng?: number | null) {
    if (!this.mapContainer) return;
    if (this.map) {
    this.map.remove();
  }

    const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
    const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

    L.Marker.prototype.options.icon = L.icon({
      iconRetinaUrl, iconUrl, shadowUrl,
      iconSize: [25, 41], iconAnchor: [12, 41],
      popupAnchor: [1, -34], shadowSize: [41, 41],
    });

    const defaultView: [number, number] = existingLat && existingLng
      ? [existingLat, existingLng]
      : [45.9432, 24.9668];
    const defaultZoom = existingLat && existingLng ? 15 : 7;

    this.map = L.map(this.mapContainer.nativeElement).setView(defaultView, defaultZoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18
    }).addTo(this.map);

    setTimeout(() => {
    if (this.map) {
      this.map.invalidateSize();
    }
  }, 200);

    if (existingLat && existingLng) {
      this.placeMarker(existingLat, existingLng);
      this.locationConfirmed.set(true);
      this.confirmedLat.set(existingLat);
      this.confirmedLng.set(existingLng);
    }
  }

  private loadCities() {
    this.cityService.getCities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => this.cities.set(data),
        error: (err) => console.error('Error loading cities:', err),
      });
  }

  private loadProperty() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.propertyId = +id;

    this.authService.getCurrentUser().pipe(
      switchMap((me) =>
        this.propertyService.getProperty(this.propertyId!)
          .pipe(map((property) => ({ property, me })))
      ),
      takeUntil(this.destroy$),
    ).subscribe({
      next: ({ property, me }) => {
        if (property.userId !== me.userId) {
          this.toastService.error('Eroare', 'Nu ai permisiunea să editezi această proprietate.');
          this.router.navigate(['/']);
          return;
        }

        this.propertyForm.patchValue({
          title: property.title,
          description: property.description,
          price: property.price,
          address: property.address,
          cityId: property.city?.id,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          surfaceArea: property.surfaceArea,
        });

        this.existingImages.set(property.images || []);
        this.isLoading.set(false);

        setTimeout(() => this.initMap(property.latitude, property.longitude), 200);
      },
      error: () => {
        this.toastService.error('Eroare', 'Nu s-a putut încărca proprietatea.');
        this.router.navigate(['/contul-meu']);
      },
    });
  }

  onVerifyLocation() {
    const address = this.propertyForm.get('address')?.value;
    const cityId = this.propertyForm.get('cityId')?.value;
    const city = this.cities().find(c => c.id == cityId);

    if (!address || !city) {
      this.toastService.error('Eroare', 'Completează adresa și orașul înainte de a verifica locația.');
      return;
    }

    this.isGeocoding.set(true);

    this.geocodingService.geocode(address, city.name).subscribe({
      next: (result) => {
        this.isGeocoding.set(false);
        this.placeMarker(result.latitude, result.longitude);
        this.locationConfirmed.set(true);
        this.confirmedLat.set(result.latitude);
        this.confirmedLng.set(result.longitude);
      },
      error: () => {
        this.isGeocoding.set(false);
        this.toastService.error('Eroare', 'Nu s-a putut găsi locația. Verifică adresa.');
      }
    });
  }

  private placeMarker(lat: number, lng: number) {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true })
        .addTo(this.map)
        .bindPopup('Trage pinul pentru a ajusta locația')
        .openPopup();

      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.confirmedLat.set(pos.lat);
        this.confirmedLng.set(pos.lng);
      });
    }

    this.map.setView([lat, lng], 15);
  }

  onFileChange(event: any) {
    const files = Array.from(event.target.files as FileList);
    if (files.length > 0) {
      this.newFiles.update(current => [...current, ...files]);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.newPreviews.update(current => [...current, e.target.result]);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeExistingImage(imageId: number) {
    this.imagesToDelete.update(current => [...current, imageId]);
    this.existingImages.update(current => current.filter(img => img.id !== imageId));
  }

  removeNewImage(index: number) {
    this.newFiles.update(current => current.filter((_, i) => i !== index));
    this.newPreviews.update(current => current.filter((_, i) => i !== index));
  }

  onSubmit() {
    if (this.propertyForm.invalid) {
      this.propertyForm.markAllAsTouched();
      return;
    }
    if (!this.propertyId) return;

    this.isSubmitting.set(true);
    const formData = new FormData();

    Object.entries(this.propertyForm.getRawValue()).forEach(([key, val]) => {
      formData.append(key, String(val));
    });

    if (this.confirmedLat() !== null) formData.append('latitude', String(this.confirmedLat()));
    if (this.confirmedLng() !== null) formData.append('longitude', String(this.confirmedLng()));

    this.newFiles().forEach(file => formData.append('newImages', file));
    this.imagesToDelete().forEach(id => formData.append('imagesToDelete', String(id)));

    this.propertyService.updateProperty(this.propertyId, formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.success('Succes', 'Anunțul a fost actualizat!');
        this.router.navigate(['/contul-meu']);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.error('Eroare', 'A apărut o eroare');
      },
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.remove();
  }
}