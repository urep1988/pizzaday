Users = Meteor.users;
Users.allow({
  insert: function () {
    return false;
  },
  update: function () {
    return true;
  },
  remove: function () {
    return false;
  }
});