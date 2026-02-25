/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { UserPayload } from "untils/Interfaces";


export const User = createParamDecorator(
    (data:any,context: ExecutionContext)=> {
        const request = context.switchToHttp().getRequest<Request & { user: UserPayload }>();
        const user:UserPayload = {
            id:request.user.id,
            name:request.user.name
        }
        return user ;

    }
)