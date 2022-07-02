import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export default {
    async getAllTweets(ctx) {
        const [, token] = ctx.request.headers?.authorization?.split(' ') || []

        if (!token) {
            ctx.status = 401
            return
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET)

            const tweets = await prisma.tweet.findMany({
                include: {
                    _count: {
                        select: {
                            TweetLike: true,
                            TweetReply: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true
                        },
                    },
                    TweetReply: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    username: true,
                                    avatar: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    created_at: 'desc'
                }
            })

            ctx.body = tweets

        } catch (error) {
            if (typeof error === 'JsonWebTokenError') {
                ctx.status = 401
                return
            }

            ctx.status = 500
            return
        }
    },
    async createTweet(ctx) {
        const [, token] = ctx.request.headers.authorization.split(' ')

        if (!token || ctx.request.body.text === '') {
            ctx.status = 401
            return
        }
        try {

            const payload = jwt.verify(token, process.env.JWT_SECRET)
            const tweet = await prisma.tweet.create({
                data: {
                    userId: payload.sub,
                    text: ctx.request.body.text.trim()
                }
            })
            ctx.body = tweet
            return

        } catch (error) {
            ctx.status = 401
            return
        }


    },
    async deleteTweet(ctx) {
        try {
            const [, token] = ctx.request.headers.authorization.split(' ')
            const payload = jwt.verify(token, process.env.JWT_SECRET)

            if (!ctx.params.id || !token) {
                ctx.status = 401
                return
            }
            const tweet = await prisma.tweet.findUnique({
                where: {
                    id: ctx.params.id
                }
            })

            if (tweet.userId === payload.sub) {
                const deleteTweet = await prisma.tweet.delete({
                    where: {
                        id: ctx.params.id
                    }
                })

                ctx.body = deleteTweet
                return

            }

            ctx.status = 403
            ctx.body = ''

        } catch (error) {
            ctx.status = 500
            ctx.body = "Internal server error"
        }
    },
    async insertLike(ctx) {

        const [, token] = ctx.request.headers.authorization.split(' ') || []

        if (!token) {
            ctx.status = 401
            return
        }

        try {
            const payload = jwt.verify(token, process.env.JWT_SECRET)

            const like = await prisma.tweetLike.create({
                data: {
                    userId: payload.sub,
                    tweetId: ctx.query.postId
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
    async getAllLikes(ctx){
        

    const [, token] = ctx.request.headers.authorization.split(' ') || []

    if (!token) {
        ctx.status = 401
        return
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)

        const like = await prisma.tweetLike.findUnique({
            where: {
                userId_tweetId: {
                    tweetId: ctx.query.postId,
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
    async deleteLike(ctx){
        
    const [, token] = ctx.request.headers.authorization.split(' ') || []

    if (!token) {
        ctx.status = 401
        return
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET)

        const like = await prisma.tweetLike.delete({
            where: {
                userId_tweetId: {
                    tweetId: ctx.query.postId,
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