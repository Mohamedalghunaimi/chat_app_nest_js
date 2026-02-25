/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { JwtGuard } from 'src/user/guards/jwt/jwt.guard';
import { User } from 'src/user/decorators/user.decorator';
import type { UserPayload } from 'untils/Interfaces';
import { CreateConversationDto } from './dto/createConversation.dto';
import { UpdateConversationDto } from './dto/updateConversation.dto';

@Controller('conversations')
@UseGuards(JwtGuard)
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post('')
  public async createConverstion(@User() user: UserPayload,@Body() dto:CreateConversationDto) {
    const result = await this.conversationService.createConversation(dto,user.id)
    return result;
  }

  @Get()
  public async getAllChats(
    @User() user:UserPayload
  ) {
    const chats = await this.conversationService.getAllConverstions(user.id);
    return chats
  }
    

  @Get(":id")
  public async getChat(
    @Param('id',new ParseUUIDPipe()) id:string,
    @User() user:UserPayload

  ) {
    const chat = await this.conversationService.getSingleConversation(id,user.id);
    return chat

  }

  @Patch("id")
  public async updateChat(
    @Param('id',new ParseUUIDPipe()) id:string,
    @Body() dto:UpdateConversationDto,
    @User() user:UserPayload

  ) {
    const result = await this.conversationService.updateConversationTitle(id,dto,user.id);
    return result

  }

  @Put(":id")
  public async addNewMember(
    @Param('id',new ParseUUIDPipe()) id:string,
    @Body("memberId")  memberId:string,
    @User() user:UserPayload
  ) {
    const result = await this.conversationService.addMemmber(id,user.id,memberId)
    return result
  }

  @Delete(":id")
  public async deleteMember(
    @Param('id',new ParseUUIDPipe()) id:string,
    @Body("memberId")  memberId:string,
    @User() user:UserPayload
  ) {
    const result = await this.conversationService.deleteMemmber(id,user.id,memberId)
    return result
  }
  

  
}
