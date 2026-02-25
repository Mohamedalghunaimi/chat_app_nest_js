/* eslint-disable prettier/prettier */
import { BadRequestException, ForbiddenException, Injectable, UseGuards } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtGuard } from 'src/user/guards/jwt/jwt.guard';
import { CreateConversationDto } from './dto/createConversation.dto';
import { UpdateConversationDto } from './dto/updateConversation.dto';
@UseGuards(JwtGuard)
@Injectable()
export class ConversationService {

    constructor(private readonly prisma:PrismaService) {}

    public async createConversation(
        {isGroup,title,friendId}:CreateConversationDto,
        userId:string
    ) {

        const user = await this.prisma.user.findUnique({where:{id:userId}})
            

        if(!user) {
            throw new BadRequestException("user is not exist");
        }

        if(!isGroup) {
            const friend = await this.prisma.user.findUnique({where:{id:friendId||""}});
            if(!friend) {
                throw new BadRequestException("user is not exist");
            }
            const conversation = await this.prisma.conversation.findFirst({
                where:{
                    AND:[
                        {conversationMembers: { some: { userId} }},
                        {conversationMembers: { some: { userId: friendId } }}
                    ],
                    isGroup:false
                },
                include:{
                    conversationMembers:true
                }
            })
            const totalMemmbers = conversation?.conversationMembers.length || 0  ;
            if(conversation && totalMemmbers === 2 ) {
                throw new BadRequestException("coversation is exist")
            }
            await this.prisma.conversation.create({
                data:{
                    conversationMembers:{
                        create:[
                            {
                                userId
                            },
                            {
                                userId:friendId
                            },
                        ],
                    }
                    
                }
            })
        }else {

        await this.prisma.conversation.create({
            data:{
                isGroup,
                title,
                conversationMembers:{
                    create:{
                        userId,
                        role:"ADMIN"
                    }
                }
            }
        })
        }
        return {
            message:"conversation is created"
        }
    }

    public async getAllConverstions(userId:string) {
        const user = await this.prisma.user.findUnique({where:{id:userId}});
        if(!user) {
            throw new ForbiddenException("forbidden")
        }
        const converstions = await this.prisma.conversation.findMany({
            where:{
                conversationMembers:{
                    some:{userId}
                }
            },
            include:{
                conversationMembers:{
                    select:{
                        user:{
                            select:{
                                id:true,
                                name:true
                            }
                        }
                    }
                },
                messages:{
                    orderBy:{
                        createdAt:"desc"
                    },
                    select:{
                        type:true,
                        content:true,
                        
                    }
                }
            },
            
            orderBy :{
                updatedAt:"desc"
            }
        })
        const modifiedConversations = converstions.map((conversation)=>{
            return {
                ...conversation,
                lastMessage:conversation.messages[0]
            }
        })
        return modifiedConversations
    }

    public async getSingleConversation(id:string,userId:string) {

        const conservation = await this.prisma.conversation.findFirst({
            where:{
                id,
                conversationMembers:{
                    some:{
                        userId
                    }
                }
            },
            include:{
                messages:{
                    orderBy:{
                        createdAt:"asc"
                    },
                    where:{
                        messageHiddens:{
                            none:{
                                userId
                            }
                        }
                    },
                    select:{
                        id:true
                    }
                    
                },
                conversationMembers:{
                    select:{
                        user :{
                            select:{
                                name:true,
                                id:true
                            }
                        }
                    }
                }
            }
        })
        if(!conservation) {
            throw new BadRequestException("invalid infos")
        }
        const messagesIds = conservation.messages.map((message)=> message.id);
            await this.prisma.messageStatus.updateMany({
                where:{
                    messageId:{
                        in:messagesIds
                    },
                    status:{
                        not:"SEEN"
                    }
                },
                data:{
                    status:"SEEN"
                }
            })
        return conservation

    }
    public async updateConversationTitle(id:string,{title}:UpdateConversationDto,userId:string,) {
        const [conversation,user] = await Promise.all([
            this.prisma.conversation.findUnique({where:{id},select:{conversationMembers:{select:{id:true,role:true,userId:true}}}}),
            this.prisma.user.findUnique({where:{id:userId}})
        ])
        if(!user) {
            throw new BadRequestException("user is not exists")
        }
        if(!conversation) {
            throw new BadRequestException("conversation is not exists")
        }
        const member = conversation.conversationMembers.find((member)=>member.userId===userId)
        if(!member) {
            throw new ForbiddenException("forbidden");
        }
        if(member.role==='MEMBER') {
            throw new ForbiddenException("forbidden");
        }

        await this.prisma.conversation.update({
            where:{id,isGroup:true},
            data:{
                title
            }
        })
        return {
            message:"conversation is updated successfully!"
        }

    }

    public async addMemmber(id:string,userId:string,memmberId:string) {
        const [conversation,user,memmber] = await Promise.all([
            this.prisma.conversation.findFirst({where:{id,isGroup:true},select:{conversationMembers:{select:{id:true,role:true,userId:true}}}}),
            this.prisma.user.findUnique({where:{id:userId}}),
            this.prisma.user.findUnique({where:{id:memmberId}})

        ])
        if(!user) {
            throw new BadRequestException("user is not exists")
        }
        if(!conversation) {
            throw new BadRequestException("conversation is not exists")
        }
        if(!memmber) {
            throw new BadRequestException("new member is not exists")
        }
        const {conversationMembers} = conversation ;
        const memmberWhoAdd = conversationMembers.find((member)=>member.userId===userId);
        if(!memmberWhoAdd) {
            throw new ForbiddenException("forbidden")
        }
        if(memmberWhoAdd.role!=='ADMIN') {
            throw new ForbiddenException("forbidden")
        }
        const isAlreadyMemmber = conversationMembers.find((member)=>member.userId===memmberId)
        if(isAlreadyMemmber) {
            throw new BadRequestException("new member is already exist")
        }

        await this.prisma.conversationMember.create({
            data:{
                userId:memmberId,
                conversationId:id
            }
        })
        return {
            message:"new memmber is added"
        }
    }

    public async deleteMemmber(id:string,userId:string,memmberId:string) {
        const [conversation,user,memmber] = await Promise.all([
            this.prisma.conversation.findFirst({where:{id,isGroup:true},select:{conversationMembers:{select:{id:true,role:true,userId:true}}}}),
            this.prisma.user.findUnique({where:{id:userId}}),
            this.prisma.user.findUnique({where:{id:memmberId}})

        ])
        if(!user) {
            throw new BadRequestException("user is not exists")
        }
        if(!conversation) {
            throw new BadRequestException("conversation is not exists")
        }
        if(!memmber) {
            throw new BadRequestException("new member is not exists")
        }
        const {conversationMembers} = conversation ;
        const memmberWhoAdd = conversationMembers.find((member)=>member.userId===userId);
        if(!memmberWhoAdd) {
            throw new ForbiddenException("forbidden")
        }
        if(memmberWhoAdd.role!=='ADMIN') {
            throw new ForbiddenException("forbidden")
        }
        const isAlreadyMemmber = conversationMembers.find((member)=>member.userId===memmberId)
        if(!isAlreadyMemmber) {
            throw new BadRequestException("new member is already not exist")
        }
        if (userId === memmberId) {
            throw new BadRequestException("admin cannot remove himself");
        }
        await this.prisma.conversationMember.delete({
            where:{
                conversationId_userId:{
                    userId:memmberId,
                    conversationId:id
                }
            }
        })
        return {
            message:"member removed successfully"
        }
    }
    








}
