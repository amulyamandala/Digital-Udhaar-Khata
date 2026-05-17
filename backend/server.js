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
const connectionDb=async()=>{
    try{
        await connect(process.env.DB_URL);
        console.log("connected ");
        app.listen(port,()=>console.log(`server is started on ${port}`))
    }catch(err){
        console.log(err)
    }
 }
 connectionDb()
 
app.use((req,res,next)=>{
    console.log(req.url);
    res.status(404).json({message:"invald path"})
})

//error handling
app.use((err,req,res,next)=>{
    //res.json({message:"error has occured",error:err.message}) this is very basic 
    console.log(err.name)
    console.log(err.message)
    
    //validation error
    if(err.name==='ValidationError'){
        return res.status(400).json({messsage:"the validations is failed "})
    }
     //casterror
      if(err.name==='CastError'){
        return res.status(400).json({messsage:"the validations is failed "})
    }
    //send server side errors
    res.status(500).json({message:"this is from server side"})
})
