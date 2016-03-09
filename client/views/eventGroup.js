Template.eventGroup.created = function() {
	Session.set('addEvent', false);
	Session.set('addItem', false);
	Session.set('events', '');
};
Template.eventGroup.helpers({
  equals: function (a, b) {
    return a == b;
  },
	addEvent: function () {
    return Session.get('addEvent');
  },
  events: function () {
    return Events.findOne({name: this.toString()});
  },
 	addItem: function () {
    return Session.get('addItem');
  },
  menu: function() {
    return Events.findOne({name: Session.get('events')}) && Events.findOne({name: Session.get('events')})
      .group.users.filter(function(d) {return d.name == (Meteor.user().username || Meteor.user().profile.name)})[0].order.menu;
  },
  isMenu: function () {
    return Session.get('events');
  },
  menuGroup: function() {
    var group = Events.findOne({name: Session.get('events')}) && Events.findOne({name: Session.get('events')}).group;
    var menu = Events.findOne({name: Session.get('events')}) && Events.findOne({name: Session.get('events')}).menu || [];
    menu = menu.map(function (d) {
      d.count = 0;
      return d;
    });
    group.users.forEach(function (d) {
      d.order.menu.forEach(function (a) {
        var fl = 0;
        for (var i = 0; i < menu.length; i++) {
          if (menu[i] && menu[i].name == a.name) {
            menu[i].count += a.count;
            fl = 1;
            break;
          }
        }
        if (fl == 0) menu.push(a);
      });
    });
    menu = menu.filter(function (d) {
      return d.count != 0;
    });
    Events.update({_id: Events.findOne({name: Session.get('events')})._id}, {$set: {menu:menu}});
    return menu;
  },
  ifConfirmed: function () {
    var name = (Users.findOne({username: this.name}) || Users.findOne({"profile.name": this.name})) ? this.name : Meteor.user().username || Meteor.user().profile.name;
    var user = Session.get('events') && Events.findOne({name: Session.get('events')}).group.users
      .filter(function(d) {return d.name == name});
    return user && user[0] && user[0].confirmed;
  },
  addUser: function() {
    var users = Groups.findOne({_id: this._id}).users.map(function(d) {return d.name});
  	return Users.find({$and: [{username:{$nin: users}},  {"profile.name":{$nin: users}}]}).fetch();
  },
  ifCreated: function() {
    return Groups.findOne({$and: [{_id: Template.instance().data._id},{users: {name: Meteor.user().username || Meteor.user().profile.name, created: true}}]});
  },
});
Template.eventGroup.events({
  'click #addEvent': function(e, t) {
    Session.set('addEvent', true);
    if ($('#newEvent').val()) {
      $(".existEvent").get(0).innerHTML = "";
      if (!Events.findOne({$and: [{name: $('#newEvent').val()}, {"group._id": Template.instance().data._id}]})) {
        var users = Template.instance().data.users.map(function(d) {
          return {name: d.name, confirmed: false, order: {order: false, menu: []} };
        });
      	Events.insert({
      		date: Date.now(),
      		status: "ordering",
      		group: {
            _id: Template.instance().data._id,
            users: users,
          },
          menu: [],
      		name: $('#newEvent').val(),
      	});
      	Groups.update({_id: Template.instance().data._id},
          {$push: {events: $('#newEvent').val()}
        });
        Session.set('addEvent', false);
      } else {
        $(".existEvent").get(0).innerHTML = "Event name already exists";
      }
    } else {
      $(".existEvent").get(0).innerHTML = "Enter event name";
    }
  },
  'click #eventsName > a': function(e, t) {
  	Session.set('events', e.target.innerHTML);
  },
  'click #confirm': function(e, t) {
    var users = Events.findOne({name: Session.get('events')}).group.users
      .map(function(d) {return d.name == (Meteor.user().username || Meteor.user().profile.name) ? {name: d.name, confirmed: true, order: d.order } : d});
    Events.update({_id: Events.findOne({name:Session.get('events')})._id}, {$set: {"group.users": users}});
  },
  'click #addItem': function(e, t) {
  	Session.set('addItem', true);
    var menu = Events.findOne({name: Session.get("events")}).menu;
  	if ($('#newItem').val() && $('#newPrice').val()) {
      $(".existItem").get(0).innerHTML = "";

      menu.forEach(function (item) {
        if (item.name == $('#newItem').val()) {
          $('#newPrice').val(item.price);
        }
      });
      var users = Events.findOne({name: Session.get('events')})
        .group.users.map(function(d) {
          if (d.name == (Meteor.user().username || Meteor.user().profile.name)) {
            if (d.order.menu.every(function(item) {return item.name != $('#newItem').val()})) {
              d.order.menu.push({
                name: $('#newItem').val(), 
                price: $('#newPrice').val(), 
                count: 1,
              });
              Session.set('addItem', false);
            } else {
              $(".existItem").get(0).innerHTML = "Item name already exists";
            }
          }
          return d;
        });
      Events.update({_id: Events.findOne({name:Session.get('events')})._id },
        {$set: {"group.users": users}});
    } else {
      $(".existItem").get(0).innerHTML = "Enter name and price";
    }
  },
  'click #username': function(e, t) {
    Groups.findOne({_id: Template.instance().data._id}).events
      .forEach(function(d) {
        Events.update({_id: Events.findOne({name:d})._id },
          {$push: {"group.users": {name: e.target.innerHTML, confirmed: false, order: {order: false, menu: []}}}});
      });
  	Groups.update({_id: Template.instance().data._id},
      {$push: {users: {name: e.target.innerHTML, created: false}}}
    );
  },
  'click .removeUser': function(e, t) {
  	var name = e.target.id || e.target.parentNode.id;
  	if (name) {
  		Groups.update({_id: Template.instance().data._id},
        {$pull: {users: {name: name, created: false}}}
      );
      var events = Events.find({"group._id": Template.instance().data._id }).fetch();
      events.forEach(function (d) {
        var group = Events.findOne({_id: d._id}).group;
        group.users = group.users
          .filter(function(d) {
            return d.name != name;
          });
        Events.update({_id: d._id},
          {$set: {group: group}});
      });
  	}
  },
  'change .count': function(e, t) {
    var group = Events.findOne({name: Session.get("events")}).group;
    group.users.forEach(function (d) {
      if (d.name == (Meteor.user().username || Meteor.user().profile.name)) {
        d.order.menu.map(function(d) {
          if (d.name == e.target.id) {
            d.count = parseInt(e.target.value);
          }
          return d;
        });
      }
    });
    Events.update({_id: Events.findOne({name: Session.get("events")})._id}, {$set: {group: group}});
  },
  'click #order': function(e, t) {
    var group = Events.findOne({name: Session.get("events")}).group,
      menu = Events.findOne({name: Session.get("events")}).menu;
    group.users.forEach(function (d) {
      if (d.name == (Meteor.user().username || Meteor.user().profile.name)) {
        d.order.order = true;
      }
    });
    Events.update({_id: Events.findOne({name: Session.get("events")})._id}, {$set: {group: group}});
    if (group.users.every(function(d) {return d.order.order})) {
      Events.update({_id: Events.findOne({name: Session.get("events")})._id}, {$set: {status: "ordered"}});
      group.users.forEach(function (d) {
        var html = '',
          total = 0,
          discount = 0;
        if (Groups.findOne({$and: [{_id: Template.instance().data._id},{users: {name: d.name, created: true}}]})) {
          html += 'Order Total: <br>';
          menu.forEach(function (item) {
            html += item.name + " - " + item.count + " - " + item.price + "$<br>";
            if (item.discount) {
              total += (item.count - 1) * item.price;
              discount += parseInt(item.price);
            } else {
              total += item.count * item.price;
            }
          });
          html += "Discount: " + discount + "$<br>";
          html += "Total: " + total + "$<br>";
        } else {
          menu.forEach(function (item) {
            if (item.discount) {
              discount += parseInt(item.price);
            }
          });
        }
        html += 'Your order: <br>';
        total = 0;
        discount /= group.users.length;
        d.order.menu.forEach(function (e) {
          html += e.name + " - " + e.count + " - " + e.price + "$<br>";
          total += e.count * e.price;
        });
        html += "Your Discount: " + discount + "$<br>";
        html += "Total: " + total + "$<br>";
        Meteor.call('sendEmail',
            d.name,
            'Hello from Pizza Day!',
            html);
      });
    }
  },
  'click .eventStatus': function(e, t) {
    Events.update({_id: Events.findOne({name: e.target.id})._id}, {$set: {status: e.target.innerHTML}});
  },
  'click .removeItem': function(e, t) {
    var name = e.target.id || e.target.parentNode.id;
    if (name) {
      var group = Events.findOne({name: Session.get('events')}).group;
      group.users = group.users.map(function(d) {
        if (d.name == (Meteor.user().username || Meteor.user().profile.name)) {
          d.order.menu = d.order.menu.filter(function(d) {
            return d.name != name;
          })
        }
        return d;
      })
      Events.update({_id: Events.findOne({name: Session.get("events")})._id}, {$set: {group: group}});
    }
  },
  'change .discount': function(e, t) {
    var name = e.target.id;
    if (name) {
      var menu = Events.findOne({name: Session.get('events')}).menu.map(function(d) {
        if (d.name == name) {
          d.discount = e.target.checked;
        }
        return d;
      });
      Events.update({_id: Events.findOne({name: Session.get("events")})._id}, {$set: {menu: menu}});
    }
  },
});