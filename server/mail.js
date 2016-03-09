Meteor.startup(function () {
	process.env.MAIL_URL="smtp://viktoriiagridasova%40gmail.com:abveirbyf@smtp.gmail.com:465"
});
 
Meteor.methods({
  sendEmail: function (name, subject, html) {
  	var email = Users.findOne({username: name}) ? Users.findOne({username: name}).emails[0].address : Users.findOne({"profile.name": name}).services.google.email;
    Email.send({
      to: email,
      from: email,
      subject: subject,
      html: html
    });
    console.log(Users.find().fetch());
  }
});