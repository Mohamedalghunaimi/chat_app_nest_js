/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtGuard } from 'src/user/guards/jwt/jwt.guard';
import { User } from 'src/user/decorators/user.decorator';
import * as Interfaces from 'untils/Interfaces';

@Controller('messages')
@UseGuards(JwtGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
 
  @Get(":id")
  public async getAllMessages(
    @Param("id",new ParseUUIDPipe()) id:string,
    @Query("page",ParseIntPipe) page:number=1,
    @Query("limit",ParseIntPipe) limit:number=50,
    @User() user:Interfaces.UserPayload
  ) {
    const messages = await this.messageService.getMessages(id,user.id,limit,page)
    return messages
  }
    
}
