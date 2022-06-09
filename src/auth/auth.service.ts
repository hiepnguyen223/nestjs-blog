import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash, compare } from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { SECRET_KEY } from 'src/config';
import { User as UserModel } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(private prismaService: PrismaService) {}

    async signUp(user: Prisma.UserCreateInput) {
        const hashedPassword = user.password && (await hash(user.password, 10));
        const userData = await this.prismaService.user.create({
            data: {
                ...user,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return userData;
    }

    async signIn(email: string, password: string) {
        const user = await this.prismaService.user.findUnique({
            where: {
                email,
            },
        });
        if (user) {
            return await compare(password, user.password).then((result) => {
                if (result) {
                    delete user.email;
                    delete user.password;
                    const token = this.generateJWT(user);
                    return {
                        user,
                        token,
                    };
                } else {
                    throw new HttpException('Wrong password', 400);
                }
            });
        } else {
            throw new HttpException("This account doesn't exist", 400);
        }
    }

    generateJWT(user: any) {
        return jwt.sign(
            {
                data: user,
            },
            SECRET_KEY,
            { expiresIn: '24h' }
        );
    }
}