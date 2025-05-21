import { Component, OnInit } from '@angular/core';
import { ServiciosService } from '../../services/servicios.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-servicios',
    templateUrl: './servicios.component.html',
    styleUrls: ['./servicios.component.scss']
})
export class ServiciosComponent implements OnInit {
    servicios: any[] = [];
    suplementos: any[] = [];
    loading = false;
    error: string | null = null;

    constructor(
        private serviciosService: ServiciosService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        console.log('Inicializando componente de servicios');
        this.cargarServicios();
        this.cargarSuplementos();
    }

    cargarServicios(): void {
        console.log('Cargando servicios');
        this.loading = true;
        this.error = null;

        this.serviciosService.getServicios().subscribe({
            next: (data) => {
                console.log('Servicios cargados exitosamente:', data);
                this.servicios = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error al cargar servicios:', error);
                this.error = 'Error al cargar los servicios';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    cargarSuplementos(): void {
        console.log('Cargando suplementos');
        this.loading = true;
        this.error = null;

        this.serviciosService.getSuplementos().subscribe({
            next: (data) => {
                console.log('Suplementos cargados exitosamente:', data);
                this.suplementos = data;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error al cargar suplementos:', error);
                this.error = 'Error al cargar los suplementos';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    crearServicio(servicio: any): void {
        console.log('Intentando crear nuevo servicio:', servicio);
        this.loading = true;
        this.error = null;

        this.serviciosService.createServicio(servicio).subscribe({
            next: (data) => {
                console.log('Servicio creado exitosamente:', data);
                this.servicios.push(data);
                this.loading = false;
                this.snackBar.open('Servicio creado exitosamente', 'Cerrar', { duration: 5000 });
            },
            error: (error) => {
                console.error('Error al crear servicio:', error);
                this.error = 'Error al crear el servicio';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    actualizarServicio(id: string, servicio: any): void {
        console.log('Intentando actualizar servicio:', { id, servicio });
        this.loading = true;
        this.error = null;

        this.serviciosService.updateServicio(id, servicio).subscribe({
            next: (data) => {
                console.log('Servicio actualizado exitosamente:', data);
                const index = this.servicios.findIndex(s => s.id === id);
                if (index !== -1) {
                    this.servicios[index] = data;
                }
                this.loading = false;
                this.snackBar.open('Servicio actualizado exitosamente', 'Cerrar', { duration: 5000 });
            },
            error: (error) => {
                console.error('Error al actualizar servicio:', error);
                this.error = 'Error al actualizar el servicio';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    eliminarServicio(id: string): void {
        console.log('Intentando eliminar servicio con ID:', id);
        this.loading = true;
        this.error = null;

        this.serviciosService.deleteServicio(id).subscribe({
            next: () => {
                console.log('Servicio eliminado exitosamente');
                this.servicios = this.servicios.filter(s => s.id !== id);
                this.loading = false;
                this.snackBar.open('Servicio eliminado exitosamente', 'Cerrar', { duration: 5000 });
            },
            error: (error) => {
                console.error('Error al eliminar servicio:', error);
                this.error = 'Error al eliminar el servicio';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    crearSuplemento(suplemento: any): void {
        console.log('Intentando crear nuevo suplemento:', suplemento);
        this.loading = true;
        this.error = null;

        this.serviciosService.createSuplemento(suplemento).subscribe({
            next: (data) => {
                console.log('Suplemento creado exitosamente:', data);
                this.suplementos.push(data);
                this.loading = false;
                this.snackBar.open('Suplemento creado exitosamente', 'Cerrar', { duration: 5000 });
            },
            error: (error) => {
                console.error('Error al crear suplemento:', error);
                this.error = 'Error al crear el suplemento';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    actualizarSuplemento(id: string, suplemento: any): void {
        console.log('Intentando actualizar suplemento:', { id, suplemento });
        this.loading = true;
        this.error = null;

        this.serviciosService.updateSuplemento(id, suplemento).subscribe({
            next: (data) => {
                console.log('Suplemento actualizado exitosamente:', data);
                const index = this.suplementos.findIndex(s => s.id === id);
                if (index !== -1) {
                    this.suplementos[index] = data;
                }
                this.loading = false;
                this.snackBar.open('Suplemento actualizado exitosamente', 'Cerrar', { duration: 5000 });
            },
            error: (error) => {
                console.error('Error al actualizar suplemento:', error);
                this.error = 'Error al actualizar el suplemento';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }

    eliminarSuplemento(id: string): void {
        console.log('Intentando eliminar suplemento con ID:', id);
        this.loading = true;
        this.error = null;

        this.serviciosService.deleteSuplemento(id).subscribe({
            next: () => {
                console.log('Suplemento eliminado exitosamente');
                this.suplementos = this.suplementos.filter(s => s.id !== id);
                this.loading = false;
                this.snackBar.open('Suplemento eliminado exitosamente', 'Cerrar', { duration: 5000 });
            },
            error: (error) => {
                console.error('Error al eliminar suplemento:', error);
                this.error = 'Error al eliminar el suplemento';
                this.loading = false;
                this.snackBar.open(this.error, 'Cerrar', { duration: 5000 });
            }
        });
    }
} 