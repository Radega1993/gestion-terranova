import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { InitService } from './services/init.service';

@Module({
    imports: [
        ConfigModule,
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema }
        ]),
        forwardRef(() => AuthModule)
    ],
    controllers: [UsersController],
    providers: [UsersService, InitService],
    exports: [UsersService]
})
export class UsersModule {
    constructor(private readonly usersService: UsersService) { }

    getUsersService(): UsersService {
        return this.usersService;
    }
} 