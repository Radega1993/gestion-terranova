import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ServiciosService {
    private apiUrl = `${environment.apiUrl}/servicios`;

    constructor(private http: HttpClient) { }

    // Servicios
    createServicio(servicio: any): Observable<any> {
        return this.http.post(this.apiUrl, servicio).pipe(
            catchError(error => {
                console.error('Error al crear servicio:', error);
                return throwError(() => error);
            })
        );
    }

    getServicios(): Observable<any[]> {
        return this.http.get<any[]>(this.apiUrl).pipe(
            catchError(error => {
                console.error('Error al obtener servicios:', error);
                return throwError(() => error);
            })
        );
    }

    getServicio(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error(`Error al obtener servicio con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    updateServicio(id: string, servicio: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}`, servicio).pipe(
            catchError(error => {
                console.error(`Error al actualizar servicio con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    deleteServicio(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            catchError(error => {
                console.error(`Error al eliminar servicio con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    // Suplementos
    createSuplemento(suplemento: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/suplementos`, suplemento).pipe(
            catchError(error => {
                console.error('Error al crear suplemento:', error);
                return throwError(() => error);
            })
        );
    }

    getSuplementos(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/suplementos`).pipe(
            catchError(error => {
                console.error('Error al obtener suplementos:', error);
                return throwError(() => error);
            })
        );
    }

    getSuplemento(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/suplementos/${id}`).pipe(
            catchError(error => {
                console.error(`Error al obtener suplemento con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    updateSuplemento(id: string, suplemento: any): Observable<any> {
        return this.http.patch(`${this.apiUrl}/suplementos/${id}`, suplemento).pipe(
            catchError(error => {
                console.error(`Error al actualizar suplemento con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    deleteSuplemento(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/suplementos/${id}`).pipe(
            catchError(error => {
                console.error(`Error al eliminar suplemento con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }
} 