import User from '../models/User'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Joi from 'joi'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const schema = Joi.object({
      firstName: Joi.string().min(3).max(30).required(),
      lastName: Joi.string().min(3).max(30).required(),
      email: Joi.string().min(3).max(30).required().email(),
      password: Joi.string().min(6).max(200).required(),
    })
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    let user = await User.findOne({ email: req.body.email })
    if (user) return res.status(400).send('User already exist...')

    const salt = bcrypt.genSaltSync(10)
    const hash = bcrypt.hashSync(req.body.password, salt)

    user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hash,
    })
    await user.save()
    return res.status(200).send('User has been created.')
  } catch (error) {
    res.status(500).json(error)
  }
})

router.post('/login', async (req, res) => {
  try {
    const schema = Joi.object({
      email: Joi.string().min(3).max(30).required().email(),
      password: Joi.string().min(6).max(200).required(),
    })
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    let user = await User.findOne({ email: req.body.email })
    if (user) return res.status(400).send('Invalid email or password')

    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    )
    if (!isPasswordCorrect)
      return res.status(400).send('Invalid email or password')

    const token = jwt.sign(
      { id: user_id, idAdmin: user.isAdmin },
      user.process.env.JWT
    )

    const { password, ...info } = user._doc

    return res.status(200).send({ info, token })
  } catch (error) {
    return res.status(500).send(error)
  }
})

export default router
