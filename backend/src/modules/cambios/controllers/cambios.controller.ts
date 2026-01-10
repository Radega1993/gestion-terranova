import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    Logger,
    Patch
} from '@nestjs/common';
import { CambiosService } from '../services/cambios.service';
import { CreateCambioDto } from '../dto/create-cambio.dto';
import { FiltrosCambiosDto } from '../dto/filtros-cambios.dto';
import { ProcesarPagoCambioDto } from '../dto/procesar-pago-cambio.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/types/user-roles.enum';
import { RolesGuard } from '../../auth/guards/roles.guard';

@Controller('cambios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CambiosController {
    private readonly logger = new Logger(CambiosController.name);

    constructor(private readonly cambiosService: CambiosService) { }

    @Post()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async create(@Body() createCambioDto: CreateCambioDto, @Request() req) {
        this.logger.debug('Creando cambio de producto');
        return this.cambiosService.create(createCambioDto, req.user._id, req.user.role);
    }

    // IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
    @Get('ventas-del-dia')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async getVentasDelDia() {
        this.logger.debug('Obteniendo ventas del día');
        return this.cambiosService.getVentasDelDia();
    }

    @Get()
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA)
    async findAll(@Query() filtros: FiltrosCambiosDto) {
        this.logger.debug('Obteniendo cambios');
        return this.cambiosService.findAll(filtros);
    }

    @Patch(':id/procesar-pago')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async procesarPagoCambio(
        @Param('id') id: string,
        @Body() procesarPagoDto: ProcesarPagoCambioDto,
        @Request() req
    ) {
        this.logger.debug(`Procesando pago/devolución para cambio con ID: ${id}`);
        return this.cambiosService.procesarPagoCambio(id, procesarPagoDto, req.user._id, req.user.role);
    }

    @Get(':id')
    @Roles(UserRole.ADMINISTRADOR, UserRole.JUNTA, UserRole.TRABAJADOR, UserRole.TIENDA)
    async findOne(@Param('id') id: string) {
        this.logger.debug(`Obteniendo cambio con ID: ${id}`);
        return this.cambiosService.findOne(id);
    }
}

