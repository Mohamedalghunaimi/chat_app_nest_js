/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Transform } from "class-transformer";
import {  IsEmail,  IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";


export class CreateUserDto {
    
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    @Transform(({value}): string => (value as string).trim())
    email:string
    
    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(15)
    @Matches(/^[a-zA-Z\s]+$/, {
        message: 'Name must contain only letters',
    })
    name:string
    
    @IsString()
    @IsNotEmpty()
    @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/, {
        message:
        'Password must contain at least one letter and one number',
    })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
        {
        message:
            'Password must contain uppercase, lowercase, number and special character',
        },
    )
    @MinLength(8)
    password:string
}