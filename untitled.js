UserSchema.methods.coolifier = function() {
	this.username += ".. the coolest!";
	return this.username;
};
UserSchema.methods.makeCool = function()










app.post('/submit', function(req,res) {

	var user = new Exampel(req.body);

	user.coolifier();

	user.makeCool();

})