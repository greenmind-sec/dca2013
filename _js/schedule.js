(function ($) {
  var App = Ember.Application.create({
    LOG_TRANSITIONS: true,
    rootElement: '#ember-container'
  });
  window.App = App;

  //-------------------------
  // Models
  //-------------------------
  App.SessionModel = Ember.Object.extend({
    title: '',
    room: '',
    presenters: '',
    track: '',
    start: '',
    difficulty: '',
    day: '',
    content: '',
    showContent: false
  });

  App.ScheduleModel = Ember.Object.extend({
    allSessions: [],
    allTracks: [],
    allDifficulties: [],
    track: null,
    difficulty: null,

    selectedSessions: function() {
      var track = this.get('track');
      var difficulty = this.get('difficulty');

      return this.get('allSessions').filter(function(item, index, enumerable) {
        if (track && item.get('track') !== track) {
          return false;
        }
        if (difficulty && item.get('difficulty') !== difficulty) {
          return false;
        }
        return true;
      });
    }.property('allSessions', 'track', 'difficulty'),

    displayDays: null,
    displayRooms: null,
    displayStarts: null,

    organizedSessions: function() {
      var selected = this.get('selectedSessions');
      var matrix = {};
      var days = [];
      var rooms = [];
      var starts = [];

      selected.forEach(function(item, index, enumerable) {
        days.push(item.day);
        rooms.push(item.room);
        starts.push(item.start);

        if (!matrix.hasOwnProperty(item.day)) {
          matrix[item.day] = {};
        }
        if (!matrix[item.day].hasOwnProperty(item.start)) {
          matrix[item.day][item.start] = {};
        }
        if (!matrix[item.day][item.start].hasOwnProperty(item.room)) {
          matrix[item.day][item.start][item.room] = [];
        }

        matrix[item.day][item.start][item.room].push(item);
      });

      this.set('displayDays', days.uniq().toArray());
      this.set('displayRooms', rooms.uniq().toArray());
      this.set('displayStarts', starts.uniq().toArray());

      return matrix;
    }.property('selectedSessions'),

    resetScheduleInfo: function() {
      var self = this;
      var request = $.ajax('/sessions.json');

      request.done(function(data, textStatus, jqXHR) {
        if (jqXHR.status === 200) {
          // We have to add 'false' to the end of our Jekyll-produced JSON otherwise
          // we have a dangling comma. So strip out the false.
          data = data.slice(0, data.length-1);
          var allTracks = [null];
          var allDifficulties = [null];
          self.set('allSessions', data.map(function(session) {
            allTracks.push(session.track);
            allDifficulties.push(session.difficulty);
            return App.SessionModel.create(session);
          }));
          self.set('allTracks', allTracks.uniq().toArray());
          self.set('allDifficulties', allDifficulties.uniq().toArray());
        }
      });

      request.fail(function(jqXHR, textStatus, errorThrown) {
        throw new Error('Unable to load session information: ' + textStatus);
      });
    }
  });

  //-------------------------
  // Views
  //-------------------------
  App.SessionView = Ember.View.extend({
    templateName: 'session',
    expand: function(session) {
      session.set('showContent', true);
    }
  });

  App.ScheduleView = Ember.View.extend({
    templateName: 'schedule'
  });

  //-------------------------
  // Controllers
  //-------------------------
  App.ScheduleController = Ember.ObjectController.extend({
  });

  App.SessionController = Ember.ObjectController.extend({
  });

  //-------------------------
  // Router
  //-------------------------
  App.ScheduleRoute = Ember.Route.extend({
    model: function() {
      App.scheduleModel = App.ScheduleModel.create();
      App.scheduleModel.resetScheduleInfo();
      return App.scheduleModel;
    }
  });

  App.Router.map(function() {
    this.route('schedule', { path: '/' });
  });

})(jQuery);
