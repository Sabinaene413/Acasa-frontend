import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Property, PropertyFilter, PagedResult } from '../models/property.model';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PropertyService {
  private apiUrl = `${environment.baseUrl}/api/properties`;
  private http = inject(HttpClient);

  getProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(this.apiUrl);
  }

  getProperty(id: number): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }

  getFilteredProperties(filter: PropertyFilter): Observable<PagedResult<Property>> {
    let params = new HttpParams();
    if (filter.minPrice !== undefined && filter.minPrice !== null) params = params.set('MinPrice', filter.minPrice.toString());
    if (filter.maxPrice !== undefined && filter.maxPrice !== null) params = params.set('MaxPrice', filter.maxPrice.toString());
    if (filter.bedrooms !== undefined && filter.bedrooms !== null) params = params.set('Bedrooms', filter.bedrooms.toString());
    if (filter.bathrooms !== undefined && filter.bathrooms !== null) params = params.set('Bathrooms', filter.bathrooms.toString());
    if (filter.cityId !== undefined && filter.cityId !== null) params = params.set('CityId', filter.cityId.toString());
    if (filter.countyId !== undefined && filter.countyId !== null) params = params.set('CountyId', filter.countyId.toString());
    if (filter.minSurfaceArea !== undefined && filter.minSurfaceArea !== null) params = params.set('MinSurfaceArea', filter.minSurfaceArea.toString());
    if (filter.maxSurfaceArea !== undefined && filter.maxSurfaceArea !== null) params = params.set('MaxSurfaceArea', filter.maxSurfaceArea.toString());
    
    if (filter.pageNumber) params = params.set('PageNumber', filter.pageNumber.toString());
    if (filter.pageSize) params = params.set('PageSize', filter.pageSize.toString());

    return this.http.get<PagedResult<Property>>(`${this.apiUrl}/filter`, { params });
  }


  getUserProperties(): Observable<Property[]> {
    return this.http.get<Property[]>(`${this.apiUrl}/my-properties`);
  }

  createProperty(formData: FormData): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, formData);
  }

  updateProperty(id: number, formData: FormData): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/${id}`, formData);
  }

  deleteProperty(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
