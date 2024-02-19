const mongoose = require("mongoose");
const crypto = require("crypto");
const tokenSchema=mongoose.Schema({
    token:{
        type:String,
        required:true
    },
    date_expiration:{
        type:Date,
        required:true
    },
    id_admin:{
        type:String,
        required:true
    },
    statut:{
        type:Number,
        required:true
    }
    
}, { collection:'token' });
tokenSchema.methods={
    authenticate:async function(authorization,statut){
        const Token=mongoose.model('Token',tokenSchema);
        if (!authorization) {
            console.log("Authentication tsisy");
            throw new Error('No credentials provided');
      }
      let token_hash=authorization.split(' ')[1];
      let now=new Date();
      let token= await Token.findOne({token: token_hash,date_expiration:{$gte:(now) },statut:statut});
      console.log(token_hash,token);
      if (!token || token ==null) throw new Error('No credentials provided');
      return token;
    },
   
}
tokenSchema.statics.generateToken=async function(id_admin,statut){
    let daty=new Date();
      daty.setHours(daty.getHours()+1);
      const sha1Hash = crypto.createHash('sha1');
      sha1Hash.update(id_admin+Date.now());
      let token=new Token({ date_expiration: daty,token:sha1Hash.digest('hex'),id_admin:id_admin,statut:statut }) 
      await token.save();
      return token;
}

const Token=mongoose.model('Token',tokenSchema)

module.exports=Token;