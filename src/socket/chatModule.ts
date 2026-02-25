/* eslint-disable prettier/prettier */
import { Global, Module } from "@nestjs/common";
import { ChatGetway } from "./chatGetway";
import { MessageModule } from "src/message/message.module";
@Global()
@Module({
  providers: [ChatGetway],
  imports:[MessageModule]
})
export class ChatModule {}