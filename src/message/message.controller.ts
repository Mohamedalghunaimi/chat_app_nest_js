/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
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
    @User() user:Interfaces.UserPayload
  ) {
    const messages = await this.messageService.getMessages(id,user.id)
    return messages
  }
    
}
