var mongoose = require('mongoose')
//var bcrypt = require('bcrypt')
var SALT_WORK_FACTOR = 10

var userSchema = new mongoose.Schema({
	name: {
		unique: true,
		type: String
	},
	password: String,
	meta: {
		createAt: {
			type: Date,
			default: Date.now()
		},
		updateAt: {
			type: Date,
			default: Date.now()
		}
	}
})

userSchema.pre('save', function(next){
	if(this.isNew){
		this.meta.createAt = this.meta.updateAt = Date.now()
	}else{
		this.meta.updateAt = Date.now()
	}

	// password hash 
	// bcrypt.genSalt(SALT_WORK_FACTOR,function(err, salt){
	// 	if(err) return next(err)
	// 	bcrypt.hash(user.password, salt, function(err, hash) {
	// 		user.password = hash
	// 		next()
	// 	})
	// })

	next()
})

userSchema.methods = {
	comparePassword: function(_password, cb){
		bcrypt.compare(_password, this.password, function(err, isMatch){
			if(err) return cb(err)

			cb(null, isMatche)
		})
	}
}

userSchema.statics = {
	fetch: function(cb) {
		return this
			.find({})
			.sort('meta.updateAt')
			.exec(cb)
	},
	findById: function(id, cb) {
		return this
			.findOne({_id: id})
			.exec(cb)
	}
}

module.exports = userSchema