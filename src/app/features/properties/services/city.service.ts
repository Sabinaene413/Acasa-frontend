import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { City } from '../models/city.model';
import { County } from '../models/county.model';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CityService {
  private apiUrl = `${environment.baseUrl}/api/Cities`;
  private http = inject(HttpClient);

  getCities(): Observable<City[]> {
    return this.http.get<City[]>(this.apiUrl);
  }

  getCounties(): Observable<County[]> {
    return this.http.get<County[]>(`${environment.baseUrl}/api/Counties`);
  }

  getCitiesByCounty(countyId: number): Observable<City[]> {
    return this.http.get<City[]>(`${this.apiUrl}?countyId=${countyId}`);
  }
}
