/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable, Req } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/createUser.dto';
import * as bcrypt from "bcryptjs"
import { LoginDto } from './dto/loginUser.dto';
import { UserPayload } from 'untils/Interfaces';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class UserService {
    constructor(
        private readonly prisma : PrismaService,
        private readonly jwt:JwtService
    ) {
        
    }
    public async createUser({email,password,name}:CreateUserDto) {
        const user = await this.prisma.user.findUnique({where:{email}})
        if(user) {
            throw new BadRequestException("user is already exist")
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        await this.prisma.user.create({
            data:{
                name,
                email,
                password:hashedPassword
            }
        })

        return {
            message:"please go to login"
        }

    }

    public async validateUser({email,password}:LoginDto) {
        const user = await this.prisma.user.findUnique({where:{email}})
        if(!user) {
            throw new BadRequestException("invalid inputs")
        }
        const isMatch = await bcrypt.compare(password,user.password as string);
        if(!isMatch) {
            throw new BadRequestException("invalid inputs")
        }
        const {password: _, ...result} = user ;
        return result
    }

    public async signUp(user:UserPayload) {
        const accessToken = await this.jwt.signAsync(user);
        return accessToken
        

    }
    public async validateUserFromGoogle({email,name}:{email:string,name:string}) {
        const user = await this.prisma.user.findUnique({where:{email}});
        if(!user) {
            const newUser = await this.prisma.user.create({
                data:{
                    name,email
                }
            })
            return newUser
        }
        return user
    }


}
