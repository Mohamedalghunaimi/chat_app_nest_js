/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/createUser.dto';
import { LocalGuard } from './guards/local/local.guard';
import { User } from './decorators/user.decorator';
import * as Interfaces from 'untils/Interfaces';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from './guards/jwt/jwt.guard';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly config:ConfigService
  ) {}

  @Post("auth/register")
  public async register(
    @Body() dto:CreateUserDto
  ) {
    const result = await this.userService.createUser(dto);
    return result
    
  }
  @Post("auth/login")
  @UseGuards(LocalGuard)
  public async login(
    @User() user:Interfaces.UserPayload,
    @Req() req:Request,
    @Res() res:Response
  ) {
    const accessToken = await this.userService.signUp(user);
    res.cookie("accessToken",accessToken,{
      httpOnly:true,
      secure: process.env.NODE_ENV === 'production',
      sameSite:"lax",
      maxAge: 1000 * 60 * 60 * 24, // يوم
      path: '/',
    })

    
    return {
      message:"logged in successfully"
    }
  }
  @Get("/auth/google")
  @UseGuards(AuthGuard("google"))
  public async loginWithGoogle() {

  }

  @Get("auth/google/callback")
  @UseGuards(AuthGuard("google"))
  public async  googleAuthRedirect(@User() user:Interfaces.UserPayload,@Res() res:Response) {
    const accessToken = await this.userService.signUp(user);
    res.cookie('accessToken',accessToken,
      {
          httpOnly: true,
          secure: process.env.NODE_ENV ==='production',
          sameSite: 'lax',
          maxAge: 1000 * 60 * 60 * 24, 
          path: '/',
      }
      
    )
    return res.redirect(this.config.get<string>("CLIENT_URL") as string)
  

  }

  @Get("auth/logout")
  @UseGuards(JwtGuard)
  public  logout(@Req() req:Request,@Res({passthrough:true}) res:Response,)  {
    const { accessToken } = req.cookies as Record<string,string> ;
    if(accessToken) {
      res.clearCookie('accessToken');
      
    }
    return {
      message:"logged out successfully"
    }
  }


}
