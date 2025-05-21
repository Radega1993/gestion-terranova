import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from './services/users.service';
import { User } from './schemas/user.schema';
import { UserRole } from './types/user-roles.enum';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
    let service: UsersService;
    let model: Model<User>;

    const mockUser = {
        _id: '1',
        username: 'testuser',
        password: 'hashedPassword',
        nombre: 'Test',
        apellidos: 'User',
        email: 'test@example.com',
        rol: UserRole.SOCIO,
        activo: true,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnThis(),
    };

    const mockModel = {
        find: jest.fn(),
        findOne: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
        deleteOne: jest.fn(),
        exec: jest.fn(),
        create: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('test-secret'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                {
                    provide: getModelToken(User.name),
                    useValue: mockModel,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        model = module.get<Model<User>>(getModelToken(User.name));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of users', async () => {
            const users = [mockUser];
            jest.spyOn(model, 'find').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(users),
            } as any);

            const result = await service.findAll();
            expect(result).toEqual(users);
        });
    });

    describe('findOne', () => {
        it('should return a user by id', async () => {
            jest.spyOn(model, 'findById').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(mockUser),
            } as any);

            const result = await service.findOne('1');
            expect(result).toEqual(mockUser);
        });
    });

    describe('create', () => {
        it('should create a new user', async () => {
            const createUserDto = {
                username: 'newuser',
                password: 'password123',
                nombre: 'New',
                apellidos: 'User',
                email: 'new@example.com',
                rol: UserRole.SOCIO,
            };

            jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('hashedPassword' as never);
            jest.spyOn(model, 'create').mockResolvedValueOnce(mockUser as any);

            const result = await service.create(createUserDto);
            expect(result).toEqual(mockUser);
        });
    });

    describe('update', () => {
        it('should update a user', async () => {
            const updateUserDto = {
                nombre: 'Updated',
                apellidos: 'User',
            };

            jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
                select: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValueOnce(mockUser),
            } as any);

            const result = await service.update('1', updateUserDto);
            expect(result).toEqual(mockUser);
        });
    });

    describe('remove', () => {
        it('should remove a user', async () => {
            jest.spyOn(model, 'deleteOne').mockReturnValue({
                exec: jest.fn().mockResolvedValueOnce({ deletedCount: 1 }),
            } as any);

            await expect(service.remove('1')).resolves.not.toThrow();
        });
    });

    describe('login', () => {
        it('should return token and user on successful login', async () => {
            const loginDto = {
                username: 'testuser',
                password: 'password123',
            };

            jest.spyOn(model, 'findOne').mockReturnValue({
                exec: jest.fn().mockResolvedValueOnce(mockUser),
            } as any);

            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true as never);
            jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
                exec: jest.fn().mockResolvedValueOnce(mockUser),
            } as any);

            const result = await service.login(loginDto);
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('user');
        });

        it('should throw UnauthorizedException on invalid credentials', async () => {
            const loginDto = {
                username: 'testuser',
                password: 'wrongpassword',
            };

            jest.spyOn(model, 'findOne').mockReturnValue({
                exec: jest.fn().mockResolvedValueOnce(mockUser),
            } as any);

            jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false as never);

            await expect(service.login(loginDto)).rejects.toThrow('Credenciales inválidas');
        });
    });
}); 