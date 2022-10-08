import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()


export const UserController = {
    async createUser(ctx) {

        const saltRounds = 10
        const password = bcrypt.hashSync(ctx.request.body.password, saltRounds)

        try {
            const user = await prisma.user.create({
                data: {
                    name: ctx.request.body.name,
                    avatar: '/src/avatar.png',
                    username: ctx.request.body.username,
                    email: ctx.request.body.email,
                    password,
                }
            })
            const accessToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' })

            ctx.body = {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                accessToken
            }

        } catch (error) {
            if (error.meta || error.meta.target) {
                console.log(error)
                ctx.status = 422
                ctx.body = "Email ou nome de usário já em uso"
                return
            }
            ctx.status = 500
            ctx.body = "Internal error"
        }
    },
    async login(ctx) {

        const [, token] = ctx.request.headers.authorization.split(' ')
        const [email, plainTextPassword] = Buffer.from(token, 'base64').toString().split(':')

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: email },
                    { email: email }

                ]
            }
        })

        if (!user) {
            ctx.status = 404
            ctx.body = "Usário não encontrado"
            return
        }

        const passwordMatch = bcrypt.compareSync(plainTextPassword, user.password)

        if (passwordMatch) {
            const accessToken = jwt.sign({
                sub: user.id
            }, process.env.JWT_SECRET, { expiresIn: '24h' })

            ctx.body = {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                accessToken
            }
            return
        }

        ctx.status = 404
        return
    },
    async updateUser(ctx) {

        try {
            const [, token] = ctx.request.headers.authorization.split(' ') || []

            if (!token) {
                ctx.status = 401
                return
            }

            const payload = jwt.verify(token, process.env.JWT_SECRET)

            const findUser = await prisma.user.findUnique({
                where: {
                    id: payload.sub
                }
            })

            if (!findUser) {
            ctx.status = 404
                return
            }
            
            const updateProfile = await prisma.user.update({
                where: {
                    id: payload.sub
                },
                data: {
                    username: ctx.request.body.username,
                    name: ctx.request.body.name,
                    avatar: ctx.request.body.avatar
                }
            })

            ctx.body = {
                id: updateProfile.id,
                name: updateProfile.name,
                username: updateProfile.username,
                email: updateProfile.email,
                avatar: updateProfile.avatar
            }
            
        } catch (error) {
            if (typeof error === 'JsonWebTokenError') {
                ctx.status = 401
                return
            }

            ctx.status = 500
            console.log(error)
            return
        }
    },
    async findUser(ctx){

            const [, token] = ctx.request.headers?.authorization?.split(' ') || []
    
            if (!token) {
                ctx.status = 401
                return
            }
    
            try {
                const payload  =  jwt.verify(token, process.env.JWT_SECRET)
    
                const user = await prisma.user.findUnique({
                    where: {
                        id: payload.sub
                    }, select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true
                    }
                })
                ctx.body = user
            }catch(error){
                console.log(error)
            }
    },
    async findUserInfo(ctx) {

        const [, token] = ctx.request.headers?.authorization?.split(' ') || []

        if (!token) {
            ctx.status = 401
            return
        }

        try {
          jwt.verify(token, process.env.JWT_SECRET)

            const user = await prisma.user.findUnique({
                where: {
                    username: ctx.params.username
                }, select: {
                    id: true,
                    name: true,
                    username: true,
                    avatar: true
                }
            })

            if (user) {
                const tweets = await prisma.tweet.findMany({
                    take: 15,
                    where: {
                        userId: user.id
                    },
                    include: {
                        _count: {
                            select: {
                                TweetReply: true,
                                TweetLike: true,
                            }
                        },
                        user: {
                            select: {
                                name: true,
                                username: true,
                                avatar: true
                            }
                        },
                        TweetReply: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }, orderBy: {
                        created_at: 'desc'
                    }
                })
                const tweetsTotal = await prisma.tweet.count({
                    where: {
                        userId: user.id
                    }
                })
                ctx.body = { ...user, tweets, tweetsTotal }
                return
            }

            return;

        } catch (error) {
            if (typeof error === 'JsonWebTokenError') {
                ctx.status = 401
                return
            }

            ctx.status = 500
            return
        }
    }
}
