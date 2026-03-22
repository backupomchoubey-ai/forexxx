import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'

dotenv.config()

async function createUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const email = 'test@gmail.com'
    const password = 'test@gmail.com'

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists! Updating password...')
      existingUser.password = password
      await existingUser.save()
      console.log('✅ User updated successfully!')
      process.exit(0)
    }

    // Create new user
    await User.create({
      firstName: 'Test',
      email: email,
      password: password,
      walletBalance: 10000 // give them some dummy balance
    })

    console.log('✅ User created successfully!')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}`)
    process.exit(0)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

createUser()
