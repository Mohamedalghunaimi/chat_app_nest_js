/* eslint-disable prettier/prettier */

import { MessageType } from "@prisma/client";
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";


export class CreateMessageDto {
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    content?:string

    @IsEnum(MessageType)
    type:MessageType



    @IsUrl()
    @IsOptional()
    url:string

    @IsOptional()
    @IsString()
    attachmentType?:string

    @IsNumber()
    @IsOptional()
    size:number
     
    @IsUUID()
    @IsString()
    @IsNotEmpty()
    conversationId:string
}
