/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMessageDto } from './dto/create_message.dto';
import { UpdateMessageDto } from './dto/UpdateMessage.dto';

@Injectable()
export class MessageService {
    constructor(private readonly prisma:PrismaService){}

    public async createMessage({content,type,url,attachmentType,size,conversationId}:CreateMessageDto,senderId:string) {
        const conversation = await this.prisma.conversation.findUnique({where:{id:conversationId},select:{conversationMembers:{select:{userId:true}}}})
        

        if(!conversation) {
            throw new BadRequestException("conversation is not exists")
        }

        const member = await this.prisma.conversationMember.findFirst({
            where:{conversationId,userId:senderId}
        })
        if(!member) {
            throw new ForbiddenException("forbidden")
        }

        if(type!=='TEXT') {
            if(!url || !attachmentType || !size) {
                throw new BadRequestException("missing details")
            }
            const newMessage = await this.prisma.message.create({
                data:{
                    type,
                    attachments:{
                        create:[{
                            url,
                            type:attachmentType ,
                            size
                        }]
                    },
                    senderId,
                    conversationId
                }
            })
            return newMessage
        } else {
            if(!content?.trim()) {
                throw new BadRequestException("content of message is required")
            }
            const newMessage = await this.prisma.message.create({
                data:{
                    content,
                    senderId,
                    conversationId,
                    type
                }
            })
            return newMessage
        }


    }

    public async messageSeen(id:string,userId:string) {
        const message = await this.prisma.message.findUnique({
            where:{
                id
            },
            select:{
                conversation:{
                    select:{
                        id:true,
                    }
                }
            }
        })
        if(!message) {
            throw new BadRequestException("message is not exists")
        }
        const member = await this.prisma.conversationMember.findUnique({
            where:{
                conversationId_userId:{
                    userId,
                    conversationId:message.conversation?.id as string
                }
            }
        })
        if(!member) {
            throw new BadRequestException("member is not exists")
        }
        const updatedMessage = await this.prisma.messageStatus.update({
            where:{
                messageId_userId:{
                    messageId:id,
                    userId
                }
            },
            data:{
                status:"SEEN"
            }
        })
        return updatedMessage
    }
    
    public async updateMessage(id:string,userId:string,{content="message is deleted for everyone"}:UpdateMessageDto) {
        
        const [message,user] = await Promise.all([
            this.prisma.message.findFirst({where:{id,type:"TEXT"},select:{id:true,senderId:true,conversationId:true,content:true,isDeletedForEveryOne:true}}),
            this.prisma.user.findUnique({where:{id:userId}})
        ])
        if(!user) {
            throw new BadRequestException("user is not exists")
        }
        if(!message) {
            throw new BadRequestException("message is not exists")
        }
        const member = await this.prisma.conversationMember.findUnique({
            where:{
                conversationId_userId:{
                    userId,
                    conversationId:message.conversationId as string
                }
            }
        })
        if(!member) {
            throw new ForbiddenException("forbidden")
        }
        if((message.senderId!==userId)&&(member.role!=='ADMIN')) {
            throw new ForbiddenException("forbidden")
        }
        if (message.isDeletedForEveryOne) {
            throw new BadRequestException("message already deleted for everyone");
        }


        await this.prisma.message.update({
            where:{
                id:message.id 
            },
            data:{
                content,
                isDeletedForEveryOne:content==="message is deleted for everyone"
            }
        })
        return {
            message:'message is updated successfully!'
        }

    }
    
    

    public async deleteMessage(id:string,userId:string) {
        const message = await this.prisma.message.findUnique(
                {where:{id},
                select:{id:true,senderId:true,conversationId:true}
        })
        if(!message) {
            throw new BadRequestException("message is not exists")
        }
        const conversationMember = await this.prisma.conversationMember.findUnique({
            where:{
                conversationId_userId:{
                    userId,
                    conversationId:message.conversationId as string
                }
                
            }
        })
        if(!conversationMember) {
            throw new ForbiddenException("forbbiden")
        }
        const messageIsDeleted = await this.prisma.messageHidden.findUnique({
            where:{
                userId_messageId:{
                    userId,
                    messageId:id
                }
            }
        })
        if(messageIsDeleted) {
            throw new BadRequestException("message is already deleted")
        }
        await this.prisma.messageHidden.create({
            data:{
                userId,
                messageId:id
            }
        })
        

        return {
            message:"message is deleted successfully!"
        }
    }

    public async getMessages(conversationId:string,userId:string,limit:number,page:number) {
        const skip = (page-1)*limit ;
        
        const conversation = await this.prisma.conversation.findUnique({
            where:{
                id:conversationId
            },
            select:{
                id:true,
            }
        })
        if(!conversation) {
            throw new BadRequestException("conversation is not exist")
        }
        const member = await this.prisma.conversationMember.findUnique({
            where:{
                conversationId_userId:{
                    conversationId,
                    userId
                }
            }
        })
        if(!member) {
            throw new BadRequestException("user is not member")
        }
        const messages  = await this.prisma.message.findMany({
            skip,
            take:limit,
            where:{
                conversationId,
                messageHiddens:{
                    none:{
                        userId
                    }
                }
            },
            orderBy:{
                createdAt:"asc"
            }
        })
        return messages




    }
        
}
