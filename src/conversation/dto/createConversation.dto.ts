/* eslint-disable prettier/prettier */
import { IsBoolean, IsOptional, IsString } from "class-validator";


export class CreateConversationDto {
    @IsBoolean()
    @IsOptional()
    isGroup?:boolean



    @IsString()
    @IsOptional()
    title?:string

    @IsString()
    @IsOptional()
    friendId?:string

}