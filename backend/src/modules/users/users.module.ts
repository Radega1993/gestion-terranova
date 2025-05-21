import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './controllers/users.controller';
import { SociosController } from './controllers/socios.controller';
import { UsersService } from './services/users.service';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { InitService } from './services/init.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema }
        ]),
        forwardRef(() => AuthModule)
    ],
    controllers: [UsersController, SociosController],
    providers: [UsersService, InitService],
    exports: [UsersService]
})
export class UsersModule {
    constructor(private readonly usersService: UsersService) { }

    getUsersService(): UsersService {
        return this.usersService;
    }
} 