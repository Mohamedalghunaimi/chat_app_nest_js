/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { ChatModule } from './socket/chatModule';


@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath:".env"
    }),
    UserModule,
    JwtModule.registerAsync({
      inject:[ConfigService],
      global:true,
      useFactory:(config:ConfigService)=>{
        return {
          secret:config.get<string>('jwt_secret'),
          signOptions:{
            expiresIn:"1d"
          }

        }
      }
    }),
    ConversationModule,
    MessageModule,
    ChatModule

  ],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
