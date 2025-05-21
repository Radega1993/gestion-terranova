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
        console.log('Intentando crear servicio:', servicio);
        return this.http.post(this.apiUrl, servicio).pipe(
            tap(response => console.log('Servicio creado exitosamente:', response)),
            catchError(error => {
                console.error('Error al crear servicio:', error);
                return throwError(() => error);
            })
        );
    }

    getServicios(): Observable<any[]> {
        console.log('Obteniendo lista de servicios');
        return this.http.get<any[]>(this.apiUrl).pipe(
            tap(response => console.log('Servicios obtenidos:', response)),
            catchError(error => {
                console.error('Error al obtener servicios:', error);
                return throwError(() => error);
            })
        );
    }

    getServicio(id: string): Observable<any> {
        console.log('Obteniendo servicio con ID:', id);
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            tap(response => console.log('Servicio obtenido:', response)),
            catchError(error => {
                console.error(`Error al obtener servicio con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    updateServicio(id: string, servicio: any): Observable<any> {
        console.log('Actualizando servicio con ID:', id);
        console.log('Datos de actualización:', servicio);
        return this.http.patch(`${this.apiUrl}/${id}`, servicio).pipe(
            tap(response => console.log('Servicio actualizado exitosamente:', response)),
            catchError(error => {
                console.error(`Error al actualizar servicio con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    deleteServicio(id: string): Observable<any> {
        console.log('Eliminando servicio con ID:', id);
        return this.http.delete(`${this.apiUrl}/${id}`).pipe(
            tap(response => console.log('Servicio eliminado exitosamente:', response)),
            catchError(error => {
                console.error(`Error al eliminar servicio con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    // Suplementos
    createSuplemento(suplemento: any): Observable<any> {
        console.log('Intentando crear suplemento:', suplemento);
        return this.http.post(`${this.apiUrl}/suplementos`, suplemento).pipe(
            tap(response => console.log('Suplemento creado exitosamente:', response)),
            catchError(error => {
                console.error('Error al crear suplemento:', error);
                return throwError(() => error);
            })
        );
    }

    getSuplementos(): Observable<any[]> {
        console.log('Obteniendo lista de suplementos');
        return this.http.get<any[]>(`${this.apiUrl}/suplementos`).pipe(
            tap(response => console.log('Suplementos obtenidos:', response)),
            catchError(error => {
                console.error('Error al obtener suplementos:', error);
                return throwError(() => error);
            })
        );
    }

    getSuplemento(id: string): Observable<any> {
        console.log('Obteniendo suplemento con ID:', id);
        return this.http.get<any>(`${this.apiUrl}/suplementos/${id}`).pipe(
            tap(response => console.log('Suplemento obtenido:', response)),
            catchError(error => {
                console.error(`Error al obtener suplemento con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    updateSuplemento(id: string, suplemento: any): Observable<any> {
        console.log('Actualizando suplemento con ID:', id);
        console.log('Datos de actualización:', suplemento);
        return this.http.patch(`${this.apiUrl}/suplementos/${id}`, suplemento).pipe(
            tap(response => console.log('Suplemento actualizado exitosamente:', response)),
            catchError(error => {
                console.error(`Error al actualizar suplemento con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }

    deleteSuplemento(id: string): Observable<any> {
        console.log('Eliminando suplemento con ID:', id);
        return this.http.delete(`${this.apiUrl}/suplementos/${id}`).pipe(
            tap(response => console.log('Suplemento eliminado exitosamente:', response)),
            catchError(error => {
                console.error(`Error al eliminar suplemento con ID ${id}:`, error);
                return throwError(() => error);
            })
        );
    }
} 