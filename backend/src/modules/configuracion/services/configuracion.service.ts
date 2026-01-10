import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Normativa, NormativaDocument } from '../schemas/normativa.schema';
import { UpdateNormativaDto } from '../dto/update-normativa.dto';

@Injectable()
export class ConfiguracionService {
    private readonly logger = new Logger(ConfiguracionService.name);

    constructor(
        @InjectModel(Normativa.name) private normativaModel: Model<NormativaDocument>,
    ) {}

    async obtenerNormativa(): Promise<string> {
        try {
            let normativa = await this.normativaModel.findOne({ clave: 'normativa-reservas' }).exec();
            
            // Si no existe, crear una con el texto por defecto
            if (!normativa) {
                const textoPorDefecto = `__**Extracto/resumen de las Normas, resto normas debe el socio conocerlas, cumplirlas y hacerlas cumplir a sus invitados.**__

**1.** Esta Asociación se **RESERVA EL DERECHO DE ADMISIÓN.**
**2. NO se permite invitados y acompañantes sin estar presente el socio. En caso de que el socio abandone las instalaciones, los acompañantes deberan abandonar las instalaciones tambien.**
**3,No** se permite la utilización de vasos u otros recipientes de **cristal** en todas las instalaciones. 
**4. No** se permite cocinar comidas en ningún espacio que no sea el de la barbacoa ni utilizar ningún elemento que no sea ésta (solo paelleros y en la zona de la barbacoa. No se permiten **hacer brasas en el suelo.**
**5. Es obligatorio dejar todo limpio y recogido antes de marchar y avisar a Recepción para su comprobación y visto bueno.** 
**6. En caso de desear disponer de personal, deberá avisarse en el momento de la reserva para poder organizar los horarios con el personal con tiempo suficiente.** Sino, la Asociación se reserva el derecho de negar dicha opción. En caso de mediodía, el importe del suplemento se debe abonar por la mañana. 
**7.** Para usar la piscina los acompañantes o invitados de la reserva es necesario el **USO DE INVITACIONES o ENTRADAS.** 
**8.** No se permite la entrada al recinto e instalaciones de animales de compañía. 
**9.** Hablar en tono adecuado y **evitar gritos y exclamaciones malsonantes y fuera de lugar**, tanto en el interior como en el exterior. No está permitido el uso de objetos ruidosos y molestos en las instalaciones, así como el lanzamiento de petardos y otros objetos. **Mantener volumen músico sin molestar a vecinos.** 
**10.** No entrar ni permanecer en **las dependencias interiores sin camiseta, con el bañador mojado, ni descalzo.** 
**11.** **No se permite jugar ni dejar enseres (bicicletas, patinetes, patines, etc.)** en las escaleras y pasillos de acceso a las instalaciones de la Asociación ni **en todas las instalaciones interiores**. No se permite la práctica de juegos violentos (jugar a la pelota, saltar, ir sobre ruedas, patines, patinetes etc.) en las dependencias del interior. 
**12.** Rogamos que los vestuarios, lavabos y duchas se usen con coherencia y pensando en que es un bien de todos los socios. También se ruega no dejar objetos de valor en los mismos. Se deben dejar recogidos y limpios. 
**13.No está permitido tirar ningún tipo de papel, tabaco o desperdicio fuera de los contenedores  dispuestas a su efecto. **

RGPD. Le informamos que los datos que nos ha facilitado y que se recogen en el presente documento, no serán cedidos bajo ningún concepto sin su expresa autorización. Sin perjuicio de lo anterior, Vd. autoriza expresamente la cesión de dichos datos a terceras empresas u organizaciones públicas con las que colaboramos. Puede encontrar toda la información en www.associacioesportivaterranova.com.Los datos serán tratados dentro de la normativa vigente en materia de protección de datos, esta es, el Reglamento UE 2016/679 del Parlamento Europeo y del Consejo relativo a la protección de las personas físicas en lo que respecta al tratamiento de datos personales y a la libre circulación de estos datos, así como la Ley Orgánica 3/2018 de 5 de diciembre de Protección de Datos Personales y garantía de los derechos digitales. La función de haber recabado estos datos ha sido con la finalidad de mantener la relación de socios y finalidades legítimas de la asociación. Al firmar este documento está aceptando y consintiendo expresa, inequívoca e irrevocablemente el tratamiento de sus datos para las finalidades anteriores. El responsable de sus datos personales será: ASSOCIACIÓ ESPORTIVA TERRANOVA, con domicilio en calle Handbol, nº 1-9, 08191 de Rubí y N.I.F. nº G60559564. Usted tiene derecho a recibir respuesta de cualquier pregunta, consulta o aclaración que le surja derivada del presente documento. Usted tiene derecho al acceso, oposición, olvido, rectificación, portabilidad, decisiones individuales automatizadas y cancelación, de sus datos de carácter personal, mediante escrito, a la dirección associacioesportivaterranova@gmail.com o mediante escrito al domicilio antes indicado, concretando su solicitud y al que acompañe fotocopia de su Documento Nacional de Identidad.  Todos sus datos serán dados de baja y destruidos definitivamente de nuestra base de datos por los siguientes motivos: 1º- a petición suya; 2º- cuando hayan dejado de ser necesarios para los fines que motivaron su recogida.`;

                normativa = new this.normativaModel({
                    clave: 'normativa-reservas',
                    texto: textoPorDefecto,
                    ultimaActualizacion: new Date()
                });
                await normativa.save();
                this.logger.log('Normativa por defecto creada');
            }

            return normativa.texto;
        } catch (error) {
            this.logger.error(`Error al obtener normativa: ${error.message}`, error.stack);
            throw error;
        }
    }

    async actualizarNormativa(updateNormativaDto: UpdateNormativaDto): Promise<Normativa> {
        try {
            let normativa = await this.normativaModel.findOne({ clave: 'normativa-reservas' }).exec();
            
            if (!normativa) {
                // Si no existe, crear una nueva
                normativa = new this.normativaModel({
                    clave: 'normativa-reservas',
                    texto: updateNormativaDto.texto,
                    ultimaActualizacion: new Date()
                });
            } else {
                // Actualizar la existente
                normativa.texto = updateNormativaDto.texto;
                normativa.ultimaActualizacion = new Date();
            }

            const normativaActualizada = await normativa.save();
            this.logger.log('Normativa actualizada correctamente');
            return normativaActualizada;
        } catch (error) {
            this.logger.error(`Error al actualizar normativa: ${error.message}`, error.stack);
            throw error;
        }
    }
}




