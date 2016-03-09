Template.groupsList.helpers({
  groups: function () {
    return Groups.find({'users.name': Meteor.user().username || Meteor.user().profile.name}).fetch();
  },
  addGroup: function () {
    return Session.get('addGroup');
  },
});

Template.groupsList.events({
  'click #addGroup': function(e, t) {
    Session.set('addGroup', true);
    if ($('#addName').val()) {
      $(".existGroup").get(0).innerHTML = "";
      if (Groups.findOne({name: $('#addName').val()})) {
        $(".existGroup").get(0).innerHTML = "Group name already exists";
      } else {
        var name = Meteor.user().username ? Meteor.user().username : Meteor.user().profile.name;
        Groups.insert({name: $('#addName').val(), users: [{name: name, created: true}], menu: [], events: []});
        Session.set('addGroup', false);
      }
    } else {
      $(".existGroup").get(0).innerHTML = "Enter group name";
    }
  },
});