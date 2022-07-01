import Router from '@koa/router'

import UserController from './controllers/userController.js'
import TweetController from './controllers/TweetController.js'
import ReplyController from './controllers/ReplyController.js'

export const router = new Router()


router.get('/tweets', TweetController.getAllTweets)
router.post('/tweets', TweetController.createTweet)
router.delete('/tweet/:id', TweetController.deleteTweet)
router.post('/like', TweetController.insertLike)
router.get('/like', TweetController.getAllLikes)
router.delete('/like', TweetController.deleteLike)


router.post('/tweet/:id/reply', ReplyController.createReply)
router.delete('/tweet/reply/:id', ReplyController.deleteReply)
router.get('/like/reply', ReplyController.getInfoLike)
router.post('/like/reply', ReplyController.createLike)
router.delete('/like/reply', ReplyController.deleteLike)


router.post('/signup', UserController.createUser)
router.patch('/profile', UserController.updateUser)
router.get('/login', UserController.login)
router.get('/user/:username',UserController.findUserInfo)
router.get('/user',UserController.findUser)







