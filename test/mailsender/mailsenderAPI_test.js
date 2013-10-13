"use strict";

var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();
var beans = require('../configureForTest').get('beans');
var conf = require('../configureForTest');
var Member = conf.get('beans').get('member');
var Message = conf.get('beans').get('message');

var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var activitiesAPI = beans.get('activitiesCoreAPI');
//var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');

var api = beans.get('mailsenderAPI');

function newTestSender() {
  return new Member({
    firstname: 'Andy',
    nickname: 'me',
    lastname: 'Sender',
    email: 'geruhn@hotmail.com'
  });
}

function newTestRecipient() {
  return new Member({
    firstname: 'Andy',
    nickname: 'me',
    lastname: 'Empfänger',
    email: 'der.geruhn@gmail.com'
  });
}

describe('MailsenderAPI', function () {
  var activityURL = 'acti_vi_ty';
  var nickname = 'nickyNamy';

  beforeEach(function (done) {
    var availableGroups = [];
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, availableGroups); });
    sinon.stub(activitiesAPI, 'getActivity', function (activityURL, callback) {
      callback(null, {markdown: function () {} });
    });
    sinon.stub(membersAPI, 'getMember',
      function (nickname, callback) {
        callback(null, newTestRecipient());
      });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });


  it('collects data for showing the edit form for an activity', function (done) {
    api.dataForShowingMessageForActivity(activityURL, function (err, result) {
      expect(!!result.message).to.be.true;
      expect(!!result.regionalgroups).to.be.true;
      expect(!!result.themegroups).to.be.true;
      expect(result.successURL).to.contain(activityURL);
      done();
    });
  });

  it('collects data for showing the edit form for a member', function (done) {
    api.dataForShowingMessageToMember(nickname, function (err, result) {
      expect(!!result.message).to.be.true;
      expect(!!result.regionalgroups).to.be.false;
      expect(!!result.themegroups).to.be.false;
      expect(result.successURL).to.contain(nickname);
      done();
    });
  });

  it('sends a mail', function (done) {
    this.timeout(50000);
    var member = newTestSender();
    var message = new Message({
      subject: 'Betreff',
      markdown: 'Juchuh!',
      htmlAddOn: ''
    }, member);
    api.sendMailToMember('*andy', message, function () {
      console.log('Callback of sending mail called');
      done();
    });
  });

  it('sends a mail to an adress list', function (done) {
    this.timeout(500000);
    var robot = new Member({
      firstname: 'I,',
      nickname: '',
      lastname: 'Robot',
      email: conf.get('sender-address')
    });
    var message = new Message({
      subject: 'Rundmail an Adressliste',
      markdown: 'asdf Blabla, \n Whatever, dude.',
      htmlAddOn: ''
    }, robot);
    var adressList = ['der.geruhn@gmail.com', 'geruhn@hotmail.com'];
    api.sendMailToAdressList(adressList, message, function () {
      console.log('Callback of sending adress list called');
      done();
    });
  });

  it('sends a mail to the adminList because we got a new member', function (done) {
    this.timeout(500000);
    api.sendMailForNewMember(newTestSender(), function () {
      console.log('Mail to Adminlist is done.');
      done();
    });
  });
});

