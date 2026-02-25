/* eslint-disable @typescript-eslint/await-thenable */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable prettier/prettier */
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Prisma } from "@prisma/client";
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from "src/message/dto/create_message.dto";
import { MessageService } from "src/message/message.service";
import { PrismaService } from "src/prisma/prisma.service";
import * as cookie from 'cookie';
import { JwtService } from "@nestjs/jwt";
import { UserPayload } from "untils/Interfaces";

@WebSocketGateway(
    {
        cors:{
            origin:"*",
            credentials: true
        },
    }

)
export class ChatGetway implements OnGatewayConnection,OnGatewayInit,OnGatewayDisconnect {
    private onLineUsers :Record<string, boolean>
    constructor(
        private readonly messageService:MessageService,
        private readonly prisma:PrismaService,
        private readonly jwt:JwtService
    ){}
    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {
        console.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: Socket, ...args: any[]) {
        try {
            const rawCookie = client.handshake.headers.cookie  ;
            if(!rawCookie) {
                client.disconnect()
                return
            }
            const {accessToken} = cookie.parse(rawCookie)
            if(!accessToken) {
                client.disconnect()
                return
            }
            const payload = await this.jwt.verifyAsync(accessToken) as UserPayload
            const userId = payload.id ;

            const user = await this.prisma.user.findUnique({where:{id:userId},
                select:{conversationMembers:{
                    select:{conversationId:true}}
                }});
            if(!user) {
                client.disconnect()
                return
            }
            client.data.userId = userId ;
            const conversationMembers = user?.conversationMembers;
            conversationMembers?.forEach((member)=> {
                if(member.conversationId) client.join(member.conversationId);
            })
            this.onLineUsers[userId] = true;
            this.server?.emit('onlineUsers', Object.keys(this.onLineUsers));
        } catch (error) {
            console.error(error)
            client.disconnect()
        }
    }

    handleDisconnect(client: Socket) {
        const userId = client.data.userId as  string ;
        if(userId) {
            delete this.onLineUsers[userId]
            this.server?.emit('onlineUsers', Object.keys(this.onLineUsers));

        }
    }

    @SubscribeMessage("message:new")
    public async sendMessage(@MessageBody() payload:CreateMessageDto, @ConnectedSocket() client: Socket) {
        const userId = client.data.userId as string
        const message = await this.messageService.createMessage(payload,userId)
        if(message) {
            const members = await this.prisma.conversationMember.findMany({
                where:{
                    conversationId:message.conversationId
                },
                select:{
                    userId:true
                }
            })
            await Promise.all([
                    members.
                    filter((member)=>this.onLineUsers[member.userId as string])
                    .map((member)=>{
                            return this.prisma.messageStatus.update({
                            where: {
                            messageId_userId: {
                                messageId: message.id,
                                userId: member.userId as string,
                            },
                            },
                            data: { status: "DELIVERED" },
                            });
                        
                        
                    })
            ])
            this.server.to(payload.conversationId).emit("message:send",message)
        }
        
    }
    @SubscribeMessage("message:seen")
    public async updateMessageToSeen(@MessageBody() {id}:{id:string}, @ConnectedSocket() client: Socket) {
        const userId = client.data.userId as string;
        const updatedMessage = await this.messageService.messageSeen(id,userId)


        
        client.emit("message:send:seenMessage",updatedMessage)


        
    }
    @SubscribeMessage("message:updateOrDelete")
    public async updateMessage(
        @MessageBody() {id,content}:{id:string,content:string} ,
        @ConnectedSocket() client: Socket
    ) {
        const userId = client.data.userId as string;
        const updatedMessage = await this.messageService.updateMessage(id,userId,{content});
        client.emit("message:update:new",updatedMessage)
    }
    
    @SubscribeMessage("message:Delete")
    public async deleteMessage(
        @MessageBody() {id}:{id:string} ,
        @ConnectedSocket() client: Socket
    ) {
        const userId = client.data.userId as string;
        const result = await this.messageService.deleteMessage(id,userId);
        client.emit("message:delete:backMessage",result)
    }





}