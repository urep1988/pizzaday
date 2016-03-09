Router.configure({
  layoutTemplate: 'layout',
  //waitOn: function() { return Meteor.subscribe('groups'); }
});

Router.route('/', {name: 'groupsList'});
Router.route('/groupsList/:_id', {
  name: 'groupPage',
  data: function() {
  	return Groups.findOne(this.params._id);
	},
});
Router.onBeforeAction(function () {
  if (!Meteor.user() && !Meteor.loggingIn()) {
    this.redirect('/');
  } else {
    this.next();
  }
})