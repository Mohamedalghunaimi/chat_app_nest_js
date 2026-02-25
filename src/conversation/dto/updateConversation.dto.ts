/* eslint-disable prettier/prettier */
import { IsOptional, IsString } from "class-validator";


export class UpdateConversationDto {




    @IsString()
    @IsOptional()
    title:string



}