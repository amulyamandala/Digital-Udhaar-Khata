import { Schema, model } from "mongoose";
const voiceCommandSchema=new Schema(
  {
    shopId:{
      type:Schema.Types.ObjectId,
      ref:"user",
      required:[true, "Shop ID is required"]
    },
    audioUrl:{
      type:String,
      required:[true, "Audio URL is required"]
    },
    transcript:{
      type:String,
      required:[true, "Transcript is required"]
    },
    parsedData:{
      customerName:{
        type:String
      },
      amount:{
        type:Number
      },
      type:{
        type:String,
        enum:["CREDIT", "DEBIT"]
      }
    },

    language:{
      type:String,
      default:"english"
    },
    status:{
      type:String,
      enum:["PENDING", "PROCESSED", "FAILED"],
      default:"PENDING"
    }
  },
  {
    timestamps:true,
    versionKey:false,
    strict:"throw"
  }
);

export const VoiceCommandModel=model("voicecommand",voiceCommandSchema);