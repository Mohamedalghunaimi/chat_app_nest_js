/* eslint-disable prettier/prettier */

import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { UserPayload } from "untils/Interfaces";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: (req: Request) => {
                const cookies = req.cookies as Record<string, string>;
                const token = req.headers.authorization?.split(" ")[1] || cookies?.accessToken  ;
                return token as string | null;
            },
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("jwt_secret") as string,
        });
    }

    validate(payload: UserPayload) {
        return payload;
    }
}