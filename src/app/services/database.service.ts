import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.databaseUrl.replace(/\/+$/, '');
  private readonly schema = environment.databaseSchema || 'public';

  private getHeaders(options?: { write?: boolean }): HttpHeaders {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Accept-Profile': this.schema,
    };

    if (options?.write) {
      headers['Content-Profile'] = this.schema;
      headers['Prefer'] = 'return=representation';
      headers['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(headers);
  }

  async select<T>(
    table: string,
    options?: {
      filters?: Record<string, string>;
      order?: string;
      limit?: number;
    }
  ): Promise<T[]> {
    const params = new URLSearchParams();
    if (options?.order) params.set('order', options.order);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
    }

    const query = params.toString();
    const url = `${this.baseUrl}/${table}${query ? '?' + query : ''}`;

    return firstValueFrom(
      this.http.get<T[]>(url, { headers: this.getHeaders() })
    );
  }

  async selectOne<T>(
    table: string,
    options?: { filters?: Record<string, string> }
  ): Promise<T | undefined> {
    const results = await this.select<T>(table, { ...options, limit: 1 });
    return results[0];
  }

  async insert<T>(table: string, data: Partial<T>): Promise<T> {
    const url = `${this.baseUrl}/${table}`;
    const results = await firstValueFrom(
      this.http.post<T[]>(url, data, { headers: this.getHeaders({ write: true }) })
    );
    return results[0];
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const url = `${this.baseUrl}/${table}?id=eq.${id}`;
    const results = await firstValueFrom(
      this.http.patch<T[]>(url, data, { headers: this.getHeaders({ write: true }) })
    );
    return results[0];
  }

  async delete(table: string, id: string): Promise<void> {
    const url = `${this.baseUrl}/${table}?id=eq.${id}`;
    await firstValueFrom(
      this.http.delete(url, { headers: this.getHeaders({ write: true }) })
    );
  }
}
