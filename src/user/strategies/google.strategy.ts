/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Global } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { UserService } from "../user.service";

@Global()
export class GoogleStrategy extends PassportStrategy(Strategy) {

        constructor(private readonly userService:UserService) {
            super({
                clientID: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string ,
                callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
                scope: ['profile', 'email'],
            });
        }
        async validate(accessToken: string, refreshToken: string, profile: any) {
            const { name, emails } = profile;

            const dataFromGoogle = {name : name?.givenName as string ,email:emails?.[0]?.value as string};
            const user = await this.userService.validateUserFromGoogle(dataFromGoogle);
            return user 

        }

}