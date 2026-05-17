import exp from 'express'
import { connect } from 'mongoose'
import { config } from 'dotenv'
import cookieParser from "cookie-parser"
import cors from 'cors'
config()
const app= exp()
app.use(cors({
origin:['http://localhost:5000'],
credentials:true
}
))
app.use(exp.json())
app.use(cookieParser())


const port=process.env.PORT||5000

