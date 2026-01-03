# Funcionalidad Usuario TIENDA - Documentación de Implementación

## 📋 Resumen Ejecutivo

Esta documentación describe los cambios necesarios para implementar la funcionalidad de **Usuario TIENDA**, que permite que múltiples trabajadores utilicen el mismo terminal sin necesidad de cerrar y abrir sesión constantemente.

---

## 🎯 Objetivo

Resolver el problema de que cuando hay múltiples trabajadores pero solo un ordenador disponible, los trabajadores tienen que cerrar sesión y abrir para cada venta, lo cual es lento e ineficiente.

**Solución**: Crear un tipo de usuario **TIENDA** que:
- Puede hacer todo lo que los trabajadores
- Puede asignar "trabajadores" no logeables
- Al realizar acciones (ventas, reservas, etc.), debe seleccionar qué trabajador la realizó
- El token expira cada 24h automáticamente

---

## 🔍 Análisis del Código Actual

### Estado Actual

#### Roles Existentes
```typescript
// backend/src/modules/users/types/user-roles.enum.ts
export enum UserRole {
    ADMINISTRADOR = 'ADMINISTRADOR',
    JUNTA = 'JUNTA',
    TRABAJADOR = 'TRABAJADOR'
}
```

#### Autenticación JWT
- **Configuración actual**: Token expira en 24h (hardcodeado en `auth.module.ts`)
- **Ubicación**: `backend/src/modules/auth/auth.module.ts` línea 20
- **Estrategia**: `backend/src/modules/auth/strategies/jwt.strategy.ts`

#### Modelos que Registran Usuario

1. **Ventas** (`venta.schema.ts`):
   - Campo: `usuario: ObjectId` (ref: User)
   - Se asigna automáticamente desde `req.user._id`

2. **Reservas** (`reserva.schema.ts`):
   - Campo: `usuarioCreacion: ObjectId` (ref: User)
   - Campo: `usuarioActualizacion?: ObjectId` (ref: User)
   - Se asignan automáticamente desde `req.user._id`

3. **Invitaciones** (verificar si registran usuario)

---

## 📝 Cambios Necesarios

### 1. Backend

#### 1.1. Nuevo Rol: TIENDA

**Archivo**: `backend/src/modules/users/types/user-roles.enum.ts`

```typescript
export enum UserRole {
    ADMINISTRADOR = 'ADMINISTRADOR',
    JUNTA = 'JUNTA',
    TRABAJADOR = 'TRABAJADOR',
    TIENDA = 'TIENDA'  // NUEVO
}
```

**Archivo**: `backend/src/modules/auth/enums/user-role.enum.ts`

```typescript
export enum UserRole {
    ADMINISTRADOR = 'ADMINISTRADOR',
    JUNTA = 'JUNTA',
    TRABAJADOR = 'TRABAJADOR',
    TIENDA = 'TIENDA'  // NUEVO
}
```

#### 1.2. Schema de Trabajadores (No Logeables)

**Nuevo archivo**: `backend/src/modules/users/schemas/trabajador.schema.ts`

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TrabajadorDocument = Trabajador & Document;

@Schema({ timestamps: true })
export class Trabajador {
    _id: Types.ObjectId;

    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true, unique: true })
    identificador: string;  // Código único del trabajador

    @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
    usuarioTienda: Types.ObjectId;  // Usuario TIENDA al que pertenece

    @Prop({ required: true, default: true })
    activo: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export const TrabajadorSchema = SchemaFactory.createForClass(Trabajador);
```

**Nota**: Solo `nombre` e `identificador`. El `identificador` debe ser único.

#### 1.3. Modificar Schema de Usuario

**Archivo**: `backend/src/modules/users/schemas/user.schema.ts`

**Cambios**:
- El campo `role` ya acepta el nuevo valor TIENDA (enum se actualiza automáticamente)
- No se requieren cambios adicionales en el schema

#### 1.4. Modificar Schema de Venta

**Archivo**: `backend/src/modules/ventas/schemas/venta.schema.ts`

**Cambios necesarios**:

```typescript
@Schema({ timestamps: true })
export class Venta {
    // ... campos existentes ...
    
    @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
    usuario: MongooseSchema.Types.ObjectId;  // Usuario que creó la venta (TIENDA o TRABAJADOR)
    
    // NUEVO: Trabajador asignado (solo si usuario es TIENDA)
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Trabajador' })
    trabajador?: MongooseSchema.Types.ObjectId;
    
    // ... resto de campos ...
}
```

#### 1.5. Modificar Schema de Reserva

**Archivo**: `backend/src/modules/reservas/schemas/reserva.schema.ts`

**Cambios necesarios**:

```typescript
@Schema({ timestamps: true })
export class Reserva {
    // ... campos existentes ...
    
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    usuarioCreacion: MongooseSchema.Types.ObjectId;
    
    // NUEVO: Trabajador asignado (solo si usuarioCreacion es TIENDA)
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Trabajador' })
    trabajador?: MongooseSchema.Types.ObjectId;
    
    // ... resto de campos ...
}
```

#### 1.6. Modificar AuthService para Token de 24h para TIENDA

**Archivo**: `backend/src/modules/auth/services/auth.service.ts`

**Cambios necesarios**:

```typescript
async login(user: any) {
    // ... código existente ...
    
    const payload = {
        sub: user._doc._id,
        username: user._doc.username,
        nombre: user._doc.nombre,
        role: user._doc.role,
        isActive: user._doc.isActive
    };
    
    // NUEVO: Si el usuario es TIENDA, token expira SIEMPRE en 24h
    const expiresIn = user._doc.role === 'TIENDA' ? '24h' : process.env.JWT_EXPIRATION || '24h';
    
    // Usar signOptions directamente para permitir expiración dinámica
    const token = this.jwtService.sign(payload, { expiresIn });
    
    // ... resto del código ...
}
```

**Nota**: El token de TIENDA siempre expira en 24h independientemente de la configuración general.

#### 1.7. Nuevo Módulo de Trabajadores

**Nuevo archivo**: `backend/src/modules/trabajadores/trabajadores.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrabajadoresController } from './controllers/trabajadores.controller';
import { TrabajadoresService } from './services/trabajadores.service';
import { Trabajador, TrabajadorSchema } from '../users/schemas/trabajador.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Trabajador.name, schema: TrabajadorSchema }
        ])
    ],
    controllers: [TrabajadoresController],
    providers: [TrabajadoresService],
    exports: [TrabajadoresService]
})
export class TrabajadoresModule { }
```

**Nuevo archivo**: `backend/src/modules/trabajadores/services/trabajadores.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trabajador } from '../users/schemas/trabajador.schema';
import { CreateTrabajadorDto } from '../dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from '../dto/update-trabajador.dto';

@Injectable()
export class TrabajadoresService {
    private readonly logger = new Logger(TrabajadoresService.name);

    constructor(
        @InjectModel(Trabajador.name) private trabajadorModel: Model<Trabajador>
    ) { }

    async create(createTrabajadorDto: CreateTrabajadorDto, usuarioTiendaId: string): Promise<Trabajador> {
        // Verificar que el identificador no existe
        const existing = await this.trabajadorModel.findOne({
            identificador: createTrabajadorDto.identificador
        }).exec();
        
        if (existing) {
            throw new ConflictException('Ya existe un trabajador con este identificador');
        }
        
        const trabajador = new this.trabajadorModel({
            ...createTrabajadorDto,
            usuarioTienda: usuarioTiendaId
        });
        return trabajador.save();
    }

    async findAll(usuarioTiendaId?: string): Promise<Trabajador[]> {
        const filter = usuarioTiendaId ? { usuarioTienda: usuarioTiendaId } : {};
        return this.trabajadorModel.find(filter)
            .populate('usuarioTienda', 'username nombre')
            .exec();
    }

    async findByTienda(usuarioTiendaId: string): Promise<Trabajador[]> {
        return this.trabajadorModel.find({ 
            usuarioTienda: usuarioTiendaId,
            activo: true 
        }).exec();
    }

    async findOne(id: string): Promise<Trabajador> {
        const trabajador = await this.trabajadorModel.findById(id)
            .populate('usuarioTienda', 'username nombre')
            .exec();
        
        if (!trabajador) {
            throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
        }
        
        return trabajador;
    }

    async update(id: string, updateTrabajadorDto: UpdateTrabajadorDto): Promise<Trabajador> {
        // Si se actualiza el identificador, verificar que no existe
        if (updateTrabajadorDto.identificador) {
            const existing = await this.trabajadorModel.findOne({
                identificador: updateTrabajadorDto.identificador,
                _id: { $ne: id }
            }).exec();
            
            if (existing) {
                throw new ConflictException('Ya existe un trabajador con este identificador');
            }
        }
        
        const trabajador = await this.trabajadorModel.findByIdAndUpdate(
            id,
            updateTrabajadorDto,
            { new: true }
        ).exec();
        
        if (!trabajador) {
            throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
        }
        
        return trabajador;
    }

    async remove(id: string): Promise<void> {
        const result = await this.trabajadorModel.findByIdAndDelete(id).exec();
        
        if (!result) {
            throw new NotFoundException(`Trabajador con ID ${id} no encontrado`);
        }
    }

    async toggleActive(id: string): Promise<Trabajador> {
        const trabajador = await this.findOne(id);
        trabajador.activo = !trabajador.activo;
        return trabajador.save();
    }
}
```

**Nota**: El servicio no restringe por `usuarioTienda` porque solo ADMINISTRADOR gestiona trabajadores. Se añade método `findByTienda` para obtener trabajadores de una tienda específica.

**Nuevo archivo**: `backend/src/modules/trabajadores/controllers/trabajadores.controller.ts`

```typescript
import { Controller, Get, Post, Body, Put, Delete, Param, UseGuards, Request, Logger, Query } from '@nestjs/common';
import { TrabajadoresService } from '../services/trabajadores.service';
import { CreateTrabajadorDto } from '../dto/create-trabajador.dto';
import { UpdateTrabajadorDto } from '../dto/update-trabajador.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/enums/user-role.enum';

@Controller('trabajadores')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMINISTRADOR)  // Solo ADMINISTRADOR puede gestionar trabajadores
export class TrabajadoresController {
    private readonly logger = new Logger(TrabajadoresController.name);

    constructor(private readonly trabajadoresService: TrabajadoresService) { }

    @Post()
    async create(@Body() createTrabajadorDto: CreateTrabajadorDto, @Request() req) {
        // El usuarioTienda viene en el DTO o se puede obtener del body
        return this.trabajadoresService.create(createTrabajadorDto, createTrabajadorDto.usuarioTienda);
    }

    @Get()
    async findAll(@Query('tiendaId') tiendaId?: string) {
        if (tiendaId) {
            return this.trabajadoresService.findByTienda(tiendaId);
        }
        return this.trabajadoresService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.trabajadoresService.findOne(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateTrabajadorDto: UpdateTrabajadorDto) {
        return this.trabajadoresService.update(id, updateTrabajadorDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return this.trabajadoresService.remove(id);
    }

    @Put(':id/toggle-active')
    async toggleActive(@Param('id') id: string) {
        return this.trabajadoresService.toggleActive(id);
    }
}
```

**Nota**: Solo ADMINISTRADOR puede gestionar trabajadores. Se añade endpoint para obtener trabajadores por tienda (usado por TIENDA para seleccionar).

#### 1.8. DTOs para Trabajadores

**Nuevo archivo**: `backend/src/modules/trabajadores/dto/create-trabajador.dto.ts`

```typescript
import { IsString, IsOptional, IsBoolean, IsMongoId } from 'class-validator';

export class CreateTrabajadorDto {
    @IsString()
    nombre: string;

    @IsString()
    identificador: string;  // Código único del trabajador

    @IsMongoId()
    usuarioTienda: string;  // ID del usuario TIENDA al que pertenece

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}
```

**Nuevo archivo**: `backend/src/modules/trabajadores/dto/update-trabajador.dto.ts`

```typescript
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateTrabajadorDto {
    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    identificador?: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}
```

#### 1.9. Modificar DTO de Crear Venta

**Archivo**: `backend/src/modules/ventas/dto/create-venta.dto.ts`

**Cambios necesarios**:

```typescript
export class CreateVentaDto {
    // ... campos existentes ...
    
    // NUEVO: Trabajador asignado (opcional, solo si usuario es TIENDA)
    @IsString()
    @IsOptional()
    trabajadorId?: string;
    
    // ... resto de campos ...
}
```

#### 1.10. Modificar Servicio de Ventas

**Archivo**: `backend/src/modules/ventas/services/ventas.service.ts`

**Cambios necesarios**:

```typescript
// Añadir import
import { Trabajador } from '../../users/schemas/trabajador.schema';

// Inyectar en constructor
constructor(
    @InjectModel(Venta.name) private ventaModel: Model<Venta>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Reserva.name) private reservaModel: Model<Reserva>,
    @InjectModel(Socio.name) private socioModel: Model<Socio>,
    @InjectModel(Trabajador.name) private trabajadorModel: Model<Trabajador>  // NUEVO
) { }

async create(createVentaDto: CreateVentaDto, userId: string, userRole: string): Promise<Venta> {
    // ... validaciones existentes ...
    
    const ventaData: any = {
        ...createVentaDto,
        usuario: userId,
        estado
    };
    
    // NUEVO: Si el usuario es TIENDA, trabajadorId es OBLIGATORIO
    if (userRole === 'TIENDA') {
        if (!createVentaDto.trabajadorId) {
            throw new BadRequestException('Debe seleccionar un trabajador para realizar la venta');
        }
        
        // Validar que el trabajador pertenece al usuario TIENDA y está activo
        const trabajador = await this.trabajadorModel.findOne({
            _id: createVentaDto.trabajadorId,
            usuarioTienda: userId,
            activo: true
        }).exec();
        
        if (!trabajador) {
            throw new BadRequestException('Trabajador no válido o no pertenece a esta tienda');
        }
        
        ventaData.trabajador = createVentaDto.trabajadorId;
    }
    
    const venta = new this.ventaModel(ventaData);
    // ... resto del código ...
}
```

**Nota**: Para usuarios TIENDA, el `trabajadorId` es **obligatorio**.

#### 1.11. Modificar Controlador de Ventas

**Archivo**: `backend/src/modules/ventas/controllers/ventas.controller.ts`

**Cambios necesarios**:

```typescript
@Post()
@Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR, UserRole.JUNTA, UserRole.TIENDA)  // Añadir TIENDA
async create(@Body() createVentaDto: CreateVentaDto, @Request() req) {
    this.logger.debug('Creando nueva venta');
    return this.ventasService.create(createVentaDto, req.user._id, req.user.role);
}

// Añadir filtro por trabajador en otros endpoints si es necesario
@Get()
@Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR, UserRole.JUNTA, UserRole.TIENDA)
async findAll(@Query() filters: VentaFiltersDto) {
    // ... código existente ...
    // Añadir filtro por trabajador si viene en filters
}
```

**Nota**: Añadir TIENDA a todos los endpoints donde TRABAJADOR tiene acceso.

#### 1.12. Modificar DTO de Crear Reserva

**Archivo**: `backend/src/modules/reservas/dto/create-reserva.dto.ts`

**Cambios necesarios**:

```typescript
export class CreateReservaDto {
    // ... campos existentes ...
    
    // NUEVO: Trabajador asignado (opcional, solo si usuario es TIENDA)
    @IsString()
    @IsOptional()
    trabajadorId?: string;
    
    // ... resto de campos ...
}
```

#### 1.13. Modificar Servicio de Reservas

**Archivo**: `backend/src/modules/reservas/services/reservas.service.ts`

**Cambios similares a ventas**:

```typescript
// Añadir import
import { Trabajador } from '../../users/schemas/trabajador.schema';

// Inyectar en constructor
constructor(
    @InjectModel(Reserva.name) private reservaModel: Model<Reserva>,
    @InjectModel(Trabajador.name) private trabajadorModel: Model<Trabajador>  // NUEVO
) { }

async create(createReservaDto: CreateReservaDto, usuarioId: string, userRole: string): Promise<Reserva> {
    // ... validaciones existentes ...
    
    const reservaData: any = {
        ...createReservaDto,
        usuarioCreacion: usuarioId,
        estado: createReservaDto.estado || 'PENDIENTE'
    };
    
    // NUEVO: Si el usuario es TIENDA, trabajadorId es OBLIGATORIO
    if (userRole === 'TIENDA') {
        if (!createReservaDto.trabajadorId) {
            throw new BadRequestException('Debe seleccionar un trabajador para realizar la reserva');
        }
        
        // Validar trabajador
        const trabajador = await this.trabajadorModel.findOne({
            _id: createReservaDto.trabajadorId,
            usuarioTienda: usuarioId,
            activo: true
        }).exec();
        
        if (!trabajador) {
            throw new BadRequestException('Trabajador no válido o no pertenece a esta tienda');
        }
        
        reservaData.trabajador = createReservaDto.trabajadorId;
    }
    
    const reserva = new this.reservaModel(reservaData);
    // ... resto del código ...
}
```

**Nota**: También añadir TIENDA a otros métodos como `update`, `cancelar`, `liquidar` si aplica.

#### 1.14. Modificar Controlador de Reservas

**Archivo**: `backend/src/modules/reservas/controllers/reservas.controller.ts`

**Cambios necesarios**:

```typescript
@Post()
@Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)  // Añadir TIENDA
create(@Body() createReservaDto: CreateReservaDto, @Request() req) {
    return this.reservasService.create(createReservaDto, req.user._id, req.user.role);
}

// Añadir TIENDA a otros endpoints también
@Get()
@Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
async findAll() {
    // ...
}

@Patch(':id')
@Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TIENDA)  // Añadir TIENDA
update(@Param('id') id: string, @Body() updateReservaDto: UpdateReservaDto, @Request() req) {
    return this.reservasService.update(id, updateReservaDto, req.user._id, req.user.role);
}

// ... otros endpoints ...
```

**Nota**: Añadir TIENDA a todos los endpoints donde TRABAJADOR tiene acceso.

#### 1.15. Modificar RolesGuard

**Archivo**: `backend/src/modules/auth/guards/roles.guard.ts`

**Verificar que acepta el nuevo rol TIENDA** (debería funcionar automáticamente si el enum está actualizado).

#### 1.16. Actualizar AppModule

**Archivo**: `backend/src/app.module.ts`

**Añadir TrabajadoresModule**:

```typescript
import { TrabajadoresModule } from './modules/trabajadores/trabajadores.module';

@Module({
    imports: [
        // ... módulos existentes ...
        TrabajadoresModule
    ],
    // ...
})
```

#### 1.17. Permisos de Creación de Usuario TIENDA

**Archivo**: `backend/src/modules/users/controllers/users.controller.ts`

**Verificar que solo ADMINISTRADOR puede crear usuarios TIENDA** (ya está restringido por `@Roles(UserRole.ADMINISTRADOR)`).

#### 1.18. Añadir Filtros por Trabajador en Reportes

**Archivo**: `backend/src/modules/ventas/dto/venta-filters.dto.ts`

**Añadir filtro por trabajador**:

```typescript
export class VentaFiltersDto {
    // ... campos existentes ...
    
    @IsString()
    @IsOptional()
    trabajadorId?: string;  // NUEVO
}
```

**Archivo**: `backend/src/modules/ventas/services/ventas.service.ts`

**Modificar métodos de búsqueda para incluir filtro por trabajador**:

```typescript
async findAll(filters: VentaFiltersDto): Promise<Venta[]> {
    const dateFilter = this.buildDateFilter(filters);
    const query: any = { ...dateFilter };
    
    // NUEVO: Filtro por trabajador
    if (filters.trabajadorId) {
        query.trabajador = filters.trabajadorId;
    }
    
    return this.ventaModel.find(query)
        .populate('trabajador', 'nombre identificador')  // NUEVO: Populate trabajador
        .populate('usuario', 'username nombre')
        .sort({ createdAt: -1 })
        .exec();
}
```

**Archivo**: `backend/src/modules/ventas/services/ventas.service.ts` - Método `getRecaudaciones`

**Añadir filtro por trabajador y populate**:

```typescript
async getRecaudaciones(filtros: RecaudacionesFiltrosDto) {
    // ... código existente ...
    
    const filtroVentas: any = {};
    // ... filtros existentes ...
    
    // NUEVO: Filtro por trabajador
    if (filtros.trabajadorId) {
        filtroVentas.trabajador = new Types.ObjectId(filtros.trabajadorId);
    }
    
    const ventas = await this.ventaModel
        .find(filtroVentas)
        .populate('usuario', 'username')
        .populate('trabajador', 'nombre identificador')  // NUEVO
        .lean()
        .exec() as unknown as PopulatedVenta[];
    
    // ... resto del código ...
}
```

**Archivo**: `backend/src/modules/ventas/dto/recaudaciones-filtros.dto.ts`

**Añadir campo trabajadorId**:

```typescript
export class RecaudacionesFiltrosDto {
    // ... campos existentes ...
    
    @IsString()
    @IsOptional()
    trabajadorId?: string;  // NUEVO
}
```

#### 1.19. Modificar Inventory para Permitir TIENDA

**Archivo**: `backend/src/modules/inventory/controllers/inventory.controller.ts`

**Añadir TIENDA a los roles permitidos**:

```typescript
@Get()
@Roles(UserRole.ADMINISTRADOR, UserRole.TRABAJADOR, UserRole.JUNTA, UserRole.TIENDA)  // Añadir TIENDA
async findAll() {
    // ...
}

// Añadir TIENDA a todos los endpoints de inventario
```

#### 1.20. Endpoint para Obtener Trabajadores de una Tienda (para TIENDA)

**Archivo**: `backend/src/modules/trabajadores/controllers/trabajadores.controller.ts`

**Añadir endpoint público para TIENDA**:

```typescript
@Get('tienda/:tiendaId')
@Roles(UserRole.ADMINISTRADOR, UserRole.TIENDA)  // TIENDA puede ver sus trabajadores
async findByTienda(@Param('tiendaId') tiendaId: string, @Request() req) {
    // Si es TIENDA, solo puede ver sus propios trabajadores
    if (req.user.role === 'TIENDA' && req.user._id.toString() !== tiendaId) {
        throw new UnauthorizedException('No tiene permiso para ver estos trabajadores');
    }
    return this.trabajadoresService.findByTienda(tiendaId);
}
```

---

### 2. Frontend

#### 2.1. Actualizar Enum de Roles

**Archivo**: `frontend/src/types/user.ts`

```typescript
export enum UserRole {
    ADMINISTRADOR = 'ADMINISTRADOR',
    JUNTA = 'JUNTA',
    TRABAJADOR = 'TRABAJADOR',
    TIENDA = 'TIENDA'  // NUEVO
}
```

#### 2.2. Nuevo Servicio de Trabajadores

**Nuevo archivo**: `frontend/src/services/trabajadores.ts`

```typescript
import { api } from './api';

export interface Trabajador {
    _id: string;
    nombre: string;
    identificador: string;
    activo: boolean;
    usuarioTienda: string | {
        _id: string;
        username: string;
        nombre: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateTrabajadorDto {
    nombre: string;
    identificador: string;
    usuarioTienda: string;
    activo?: boolean;
}

export const trabajadoresService = {
    getAll: async (): Promise<Trabajador[]> => {
        const response = await api.get('/trabajadores');
        return response.data;
    },
    
    getByTienda: async (tiendaId: string): Promise<Trabajador[]> => {
        const response = await api.get(`/trabajadores/tienda/${tiendaId}`);
        return response.data;
    },
    
    getById: async (id: string): Promise<Trabajador> => {
        const response = await api.get(`/trabajadores/${id}`);
        return response.data;
    },
    
    create: async (data: CreateTrabajadorDto): Promise<Trabajador> => {
        const response = await api.post('/trabajadores', data);
        return response.data;
    },
    
    update: async (id: string, data: Partial<CreateTrabajadorDto>): Promise<Trabajador> => {
        const response = await api.put(`/trabajadores/${id}`, data);
        return response.data;
    },
    
    delete: async (id: string): Promise<void> => {
        await api.delete(`/trabajadores/${id}`);
    },
    
    toggleActive: async (id: string): Promise<Trabajador> => {
        const response = await api.put(`/trabajadores/${id}/toggle-active`);
        return response.data;
    }
};
```

#### 2.3. Componente de Gestión de Trabajadores

**Nuevo archivo**: `frontend/src/components/trabajadores/TrabajadoresList.tsx`

Componente para listar, crear, editar y eliminar trabajadores (similar a UsersList.tsx).

**Características**:
- Solo visible para ADMINISTRADOR
- Permite crear trabajadores asignados a un usuario TIENDA
- Campos: nombre e identificador (único)
- CRUD completo de trabajadores
- Selector de usuario TIENDA al crear trabajador

#### 2.4. Componente Selector de Trabajador

**Nuevo archivo**: `frontend/src/components/trabajadores/TrabajadorSelector.tsx`

Componente selector para usar en formularios de ventas/reservas cuando el usuario es TIENDA.

**Características**:
- Desplegable o botones con todos los trabajadores activos de la tienda
- Solo se muestra si `userRole === UserRole.TIENDA`
- Carga trabajadores de la tienda actual (`req.user._id`)
- Muestra nombre e identificador del trabajador
- Campo obligatorio para usuarios TIENDA

**Implementación sugerida**:
```typescript
// Opción 1: Select (desplegable)
<Select
    value={trabajadorId}
    onChange={(e) => setTrabajadorId(e.target.value)}
    required={userRole === UserRole.TIENDA}
>
    {trabajadores.map(t => (
        <MenuItem key={t._id} value={t._id}>
            {t.nombre} ({t.identificador})
        </MenuItem>
    ))}
</Select>

// Opción 2: Botones (más rápido para TPV)
<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    {trabajadores.map(t => (
        <Button
            key={t._id}
            variant={trabajadorId === t._id ? 'contained' : 'outlined'}
            onClick={() => setTrabajadorId(t._id)}
        >
            {t.nombre}
        </Button>
    ))}
</Box>
```

#### 2.5. Modificar Formulario de Ventas

**Archivo**: `frontend/src/components/ventas/VentasList.tsx` o componente de creación

**Cambios necesarios**:
- Si `userRole === UserRole.TIENDA`, mostrar selector de trabajador
- Incluir `trabajadorId` en el DTO al crear venta

#### 2.6. Modificar Formulario de Reservas

**Archivo**: `frontend/src/components/reservas/ReservaForm.tsx`

**Cambios necesarios**:
- Si `userRole === UserRole.TIENDA`, mostrar selector de trabajador
- Incluir `trabajadorId` en el DTO al crear reserva

#### 2.7. Actualizar Navbar/Dashboard

**Archivo**: `frontend/src/components/layout/Navbar.tsx`

**Añadir opción de "Trabajadores"** solo si el usuario es ADMINISTRADOR (para gestionar trabajadores).

**Archivo**: `frontend/src/components/dashboard/Dashboard.tsx`

**Añadir tarjeta de "Trabajadores"** solo si el usuario es ADMINISTRADOR.

**Nota**: Los usuarios TIENDA no gestionan trabajadores, solo los seleccionan en las acciones.

#### 2.8. Actualizar Rutas

**Archivo**: `frontend/src/App.tsx`

**Añadir ruta para trabajadores** (solo ADMINISTRADOR):

```typescript
<Route
    path="/trabajadores"
    element={
        <ProtectedRoute allowedRoles={[UserRole.ADMINISTRADOR]}>
            <TrabajadoresList />
        </ProtectedRoute>
    }
/>
```

#### 2.9. Actualizar Guards y Permisos

Verificar que los guards acepten el nuevo rol TIENDA en todas las rutas donde TRABAJADOR tiene acceso:
- Ventas
- Reservas
- Inventario
- Deudas
- Recaudaciones
- Invitaciones

#### 2.10. Añadir Filtros por Trabajador en Reportes

**Archivo**: `frontend/src/components/ventas/VentasList.tsx`

**Añadir filtro por trabajador**:
- Selector de trabajador en los filtros
- Mostrar trabajador en la tabla de ventas
- Incluir trabajador en el DTO de filtros

**Archivo**: `frontend/src/components/recaudaciones/RecaudacionesList.tsx`

**Añadir filtro por trabajador**:
- Selector de trabajador en los filtros
- Mostrar trabajador en el listado de recaudaciones
- Incluir trabajador en el DTO de filtros

#### 2.11. Modificar Formulario de Inventario

**Archivo**: `frontend/src/components/inventory/InventoryView.tsx`

**Verificar permisos**: Añadir TIENDA a los roles permitidos (si aplica).

#### 2.12. Mostrar Trabajador en Visualizaciones

**Archivos**: 
- `frontend/src/components/ventas/VentasList.tsx`
- `frontend/src/components/reservas/ReservasList.tsx`
- `frontend/src/components/recaudaciones/RecaudacionesList.tsx`

**Añadir columna "Trabajador"** en las tablas cuando corresponda:
- Mostrar nombre e identificador del trabajador
- Si no hay trabajador (usuario TRABAJADOR), mostrar "-" o el nombre del usuario

---

## 📊 Resumen de Archivos a Crear/Modificar

### Backend - Archivos Nuevos

1. `backend/src/modules/users/schemas/trabajador.schema.ts` - Schema de trabajadores
2. `backend/src/modules/trabajadores/trabajadores.module.ts` - Módulo de trabajadores
3. `backend/src/modules/trabajadores/services/trabajadores.service.ts` - Servicio CRUD
4. `backend/src/modules/trabajadores/controllers/trabajadores.controller.ts` - Controlador (solo ADMINISTRADOR)
5. `backend/src/modules/trabajadores/dto/create-trabajador.dto.ts` - DTO creación
6. `backend/src/modules/trabajadores/dto/update-trabajador.dto.ts` - DTO actualización

### Backend - Archivos a Modificar

1. `backend/src/modules/users/types/user-roles.enum.ts` - Añadir TIENDA
2. `backend/src/modules/auth/enums/user-role.enum.ts` - Añadir TIENDA
3. `backend/src/modules/auth/services/auth.service.ts` - Token 24h fijo para TIENDA
4. `backend/src/modules/ventas/schemas/venta.schema.ts` - Campo trabajador (opcional)
5. `backend/src/modules/ventas/dto/create-venta.dto.ts` - Campo trabajadorId (obligatorio para TIENDA)
6. `backend/src/modules/ventas/dto/venta-filters.dto.ts` - Filtro por trabajadorId
7. `backend/src/modules/ventas/dto/recaudaciones-filtros.dto.ts` - Filtro por trabajadorId
8. `backend/src/modules/ventas/services/ventas.service.ts` - Lógica trabajador + populate + filtros
9. `backend/src/modules/ventas/controllers/ventas.controller.ts` - Permitir TIENDA en todos los endpoints
10. `backend/src/modules/reservas/schemas/reserva.schema.ts` - Campo trabajador (opcional)
11. `backend/src/modules/reservas/dto/create-reserva.dto.ts` - Campo trabajadorId (obligatorio para TIENDA)
12. `backend/src/modules/reservas/services/reservas.service.ts` - Lógica trabajador + populate
13. `backend/src/modules/reservas/controllers/reservas.controller.ts` - Permitir TIENDA en todos los endpoints
14. `backend/src/modules/inventory/controllers/inventory.controller.ts` - Permitir TIENDA
15. `backend/src/app.module.ts` - Importar TrabajadoresModule

### Frontend - Archivos Nuevos

1. `frontend/src/services/trabajadores.ts`
2. `frontend/src/components/trabajadores/TrabajadoresList.tsx`
3. `frontend/src/components/trabajadores/TrabajadorSelector.tsx`

### Frontend - Archivos a Modificar

1. `frontend/src/types/user.ts` - Añadir TIENDA al enum
2. `frontend/src/components/ventas/VentasList.tsx` - Selector trabajador + filtro + columna
3. `frontend/src/components/ventas/components/` - Componente de creación con selector
4. `frontend/src/components/reservas/ReservaForm.tsx` - Selector trabajador obligatorio
5. `frontend/src/components/reservas/ReservasList.tsx` - Columna trabajador
6. `frontend/src/components/recaudaciones/RecaudacionesList.tsx` - Filtro + mostrar trabajador
7. `frontend/src/components/inventory/InventoryView.tsx` - Verificar permisos TIENDA
8. `frontend/src/components/layout/Navbar.tsx` - Opción trabajadores (solo ADMINISTRADOR)
9. `frontend/src/components/dashboard/Dashboard.tsx` - Tarjeta trabajadores (solo ADMINISTRADOR)
10. `frontend/src/App.tsx` - Ruta trabajadores (solo ADMINISTRADOR) + permisos TIENDA en otras rutas

---

## ✅ Especificaciones Confirmadas

### Trabajadores No Logeables
- **Campos**: Solo `nombre` e `identificador` (código único)
- **Gestión**: Solo el **ADMINISTRADOR** puede crear/gestionar trabajadores
- **Asignación**: Los trabajadores se asignan a un usuario TIENDA específico
- **Uso**: Se seleccionan en cada acción (venta, reserva, etc.) mediante desplegable o botones

### Alcance de Usuario TIENDA
- **Permisos**: Puede hacer **TODO** lo que TRABAJADOR:
  - ✅ Ventas (TPV)
  - ✅ Reservas
  - ✅ Inventario
  - ✅ Todas las funcionalidades de TRABAJADOR

### Selección de Trabajador
- **Método**: En **cada acción individual** (venta, reserva, etc.)
- **Interfaz**: Desplegable o botones con todos los trabajadores activos
- **No hay trabajador "activo" por sesión**: Se selecciona en cada acción

### Token JWT
- **Expiración**: Siempre **24h fijo** para usuarios TIENDA
- **Razón**: Las tiendas no estarán abiertas más de 24h seguidas

### Permisos de Creación
- **Usuario TIENDA**: Solo **ADMINISTRADOR** puede crear usuarios TIENDA
- **Trabajadores**: Solo **ADMINISTRADOR** puede crear/gestionar trabajadores

### Reportes y Filtros
- **Visualización**: Mostrar el trabajador asignado en todos los reportes
- **Filtros**: Permitir filtrar por trabajador en reportes de ventas y recaudaciones
- **Información**: Mostrar trabajador y fecha/hora de cada acción

---

## 🔄 Orden de Implementación Recomendado

1. **Fase 1: Backend Base**
   - Añadir rol TIENDA a enums
   - Crear schema de Trabajador
   - Crear módulo Trabajadores (CRUD básico)

2. **Fase 2: Autenticación**
   - Modificar AuthService para token 24h de TIENDA
   - Verificar permisos en guards

3. **Fase 3: Integración Ventas**
   - Modificar schema de Venta
   - Modificar DTO y servicio de Ventas
   - Actualizar controlador

4. **Fase 4: Integración Reservas**
   - Modificar schema de Reserva
   - Modificar DTO y servicio de Reservas
   - Actualizar controlador

5. **Fase 5: Frontend Base**
   - Actualizar tipos
   - Crear servicio de trabajadores
   - Crear componentes de gestión

6. **Fase 6: Integración Frontend**
   - Añadir selectores en formularios
   - Actualizar rutas y navegación
   - Actualizar dashboard

7. **Fase 7: Testing y Ajustes**
   - Probar flujo completo
   - Ajustar validaciones
   - Actualizar documentación

---

---

## 📋 Checklist de Implementación

### Fase 1: Backend Base ✅
- [ ] Añadir rol TIENDA a enums (users y auth)
- [ ] Crear schema de Trabajador (nombre, identificador, usuarioTienda)
- [ ] Crear módulo Trabajadores completo
- [ ] Crear DTOs de Trabajador
- [ ] Añadir TrabajadoresModule a AppModule

### Fase 2: Autenticación ✅
- [ ] Modificar AuthService para token 24h fijo de TIENDA
- [ ] Verificar permisos en guards

### Fase 3: Integración Ventas ✅
- [ ] Modificar schema de Venta (campo trabajador opcional)
- [ ] Modificar DTO de crear venta (trabajadorId obligatorio para TIENDA)
- [ ] Modificar servicio de Ventas (validación + populate)
- [ ] Añadir filtros por trabajador
- [ ] Actualizar controlador (permitir TIENDA)

### Fase 4: Integración Reservas ✅
- [ ] Modificar schema de Reserva (campo trabajador opcional)
- [ ] Modificar DTO de crear reserva (trabajadorId obligatorio para TIENDA)
- [ ] Modificar servicio de Reservas (validación + populate)
- [ ] Actualizar controlador (permitir TIENDA en todos los endpoints)

### Fase 5: Integración Inventario ✅
- [ ] Actualizar controlador de Inventory (permitir TIENDA)

### Fase 6: Reportes y Filtros ✅
- [ ] Añadir filtro por trabajador en DTOs de filtros
- [ ] Modificar servicio de recaudaciones (filtro + populate trabajador)
- [ ] Actualizar métodos de búsqueda de ventas (filtro + populate)

### Fase 7: Frontend Base ✅
- [ ] Actualizar tipos (añadir TIENDA)
- [ ] Crear servicio de trabajadores
- [ ] Crear componente TrabajadorSelector
- [ ] Crear componente TrabajadoresList (solo ADMINISTRADOR)

### Fase 8: Integración Frontend ✅
- [ ] Añadir selector trabajador en formulario de ventas
- [ ] Añadir selector trabajador en formulario de reservas
- [ ] Añadir columna trabajador en listados
- [ ] Añadir filtro por trabajador en reportes
- [ ] Actualizar rutas y permisos
- [ ] Actualizar Navbar y Dashboard

### Fase 9: Testing ✅
- [ ] Probar creación de usuario TIENDA
- [ ] Probar creación de trabajadores
- [ ] Probar venta con trabajador asignado
- [ ] Probar reserva con trabajador asignado
- [ ] Probar filtros por trabajador
- [ ] Probar token de 24h para TIENDA
- [ ] Verificar permisos en todos los módulos

---

*Documento completo - Listo para implementación*

