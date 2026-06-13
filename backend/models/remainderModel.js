const { Schema, model  } = require("mongoose");
const reminderSchema = new Schema(
  {
    customerId:{
      type:Schema.Types.ObjectId,
      ref:"customer",
      required:[true, "Customer ID is required"]
    },
    shopId:{
      type:Schema.Types.ObjectId,
      ref:"user",
      required:[true, "Shop ID is required"]
    },
    reminderType:{
      type:String,
      enum:["WHATSAPP", "SMS"],
      required:[true, "Reminder type is required"]
    },
    message:{
      type:String,
      required:[true, "Reminder message is required"],
      trim:true,
      maxlength:[500, "Message too long"]
    },
    dueAmount:{
      type:Number,
      required:[true, "Due amount is required"],
      min:[1, "Due amount must be greater than 0"]
    },
    sentAt:{
      type:Date,
      default:Date.now
    },
    status:{
      type:String,
      enum:["PENDING", "SENT", "FAILED"],
      default:"PENDING"
    }
  },
  {
    timestamps:true,
    versionKey:false,
    strict:"throw"
  }
);

const ReminderModel =model("reminder", reminderSchema);
module.exports = ReminderModel;
