import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export default {
    async createReply(ctx) {
        const [, token] = ctx.request.headers.authorization.split(' ')

        if (!token || ctx.request.body.text === '') {
            ctx.status = 401
            return
        }
        try {

            const payload = jwt.verify(token, process.env.JWT_SECRET)

            const verifyTweet = await prisma.tweet.findUnique({
                where: {
                    id: ctx.params.id
                }
            })

            if (verifyTweet) {
                const tweet = await prisma.tweetReply.create({
                    data: {
                        userId: payload.sub,
                        tweetId: ctx.params.id,
                        text: ctx.request.body.text.trim()
                    }
                })
                ctx.body = tweet
                return
            }

            ctx.status = 404
            ctx.body = "Esse tweet não existe"
            return

        } catch (error) {
            ctx.status = 401
            return
        }
    },
    async deleteReply(ctx) {

        try {
            const [, token] = ctx.request.headers.authorization.split(' ')
            const payload = jwt.verify(token, process.env.JWT_SECRET)

            if (!ctx.params.id || !token) {
                ctx.status = 401
                return
            }
            const reply = await prisma.tweetReply.findUnique({
                where: {
                    id: ctx.params.id
                }
            })

            if (reply.userId === payload.sub) {
                const deleteReply = await prisma.tweetReply.delete({
                    where: {
                        id: ctx.params.id
                    }
                })

                ctx.body = deleteReply
                return

            }

            ctx.status = 403
            ctx.body = ''

        } catch (error) {
            ctx.status = 500
            ctx.body = "Internal server error"
        }

    },
    async getInfoLike(ctx) {


        const [, token] = ctx.request.headers.authorization.split(' ') || []

        if (!token) {
            ctx.status = 401
            return
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET)

            const like = await prisma.tweetLikeReply.findUnique({
                where: {
                    userId_replyId: {
                        replyId: ctx.query.postId,
                        userId: payload.sub
                    }
                }
            })

            ctx.body = like

        } catch (error) {
            if (typeof error === 'JsonWebTokenError') {
                ctx.status = 401
                return
            }

            ctx.status = 500
            return
        }

    },
    async createLike(ctx) {

        const [, token] = ctx.request.headers.authorization.split(' ') || []

        if (!token) {
            ctx.status = 401
            return
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET)

            const like = await prisma.tweetLikeReply.create({
                data: {
                    userId: payload.sub,
                    replyId: ctx.query.postId
                }
            })

            ctx.body = like

        } catch (error) {
            if (typeof error === 'JsonWebTokenError') {
                ctx.status = 401
                return
            }

            ctx.status = 500
            return
        }

    },
    async deleteLike(ctx) {

        const [, token] = ctx.request.headers.authorization.split(' ') || []

        if (!token) {
            ctx.status = 401
            return
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET)

            const like = await prisma.tweetLikeReply.delete({
                where: {
                    userId_replyId: {
                        replyId: ctx.query.postId,
                        userId: payload.sub
                    }
                }
            })

            ctx.body = like

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