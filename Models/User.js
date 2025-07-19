const mongoose = require("mongoose")


const UserSchema = mongoose.Schema({
    username:String,
    email:String,
    password:String,
    date:String
})

module.exports = mongoose.model("User",UserSchema);