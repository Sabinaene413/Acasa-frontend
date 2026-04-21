import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SavedSearch, SavedSearchCreate } from '../models/saved-search.model';

@Injectable({
  providedIn: 'root'
})
export class SavedSearchService {
  private apiUrl = 'https://localhost:7102/api/savedsearches';
  private http = inject(HttpClient);

  getSavedSearches(): Observable<SavedSearch[]> {
    return this.http.get<SavedSearch[]>(this.apiUrl);
  }

  saveSearch(data: SavedSearchCreate): Observable<SavedSearch> {
    return this.http.post<SavedSearch>(this.apiUrl, data);
  }

  deleteSearch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}