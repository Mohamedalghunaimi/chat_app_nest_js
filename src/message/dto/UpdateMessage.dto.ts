/* eslint-disable prettier/prettier */
import {    IsOptional,   IsString, } from "class-validator";


export class UpdateMessageDto {
    @IsString()
    @IsOptional()
    content?:string


}
