
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});
Parse.Cloud.afterDelete('Records', (request) => {
    var file = request.object.get("file").url();
    console.log('*******id: ', file)
        Parse.Cloud.httpRequest({
            method: 'DELETE',
            url: file.substring(file.lastIndexOf("/") + 1),
            headers: {
                "X-Parse-Application-Id": "${process.env.APP_ID}",
                "X-Parse-REST-API-Key": "${process.env.MASTER_KEY}"
            }
        });
});

Parse.Cloud.afterSave('Records', function (req) {
    console.log('[afterSave called]: ' + JSON.stringify(req.object));
    console.log('[userid]: ' + req.object.get('receiverID'));
    if (!req.object.existed()) {
        var record = req.object;
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        acl.setReadAccess(record.get('receiverID'), true);
        acl.setWriteAccess(record.get('receiverID'), true);
        record.setACL(acl);
        record.save(null).then(function (s) {
            console.log('[afterSave succeeded]: ' + JSON.stringify(s));
        }, function (e) {
            console.log('[afterSave failed]: ' + JSON.stringify(e));
        })
    }
});
Parse.Cloud.afterSave(Parse.User, function(request) {
  if (!request.object.existed()) {
  var user = request.object;
  var acl = new Parse.ACL(user);
  acl.setPublicReadAccess(false);
  user.setACL(acl);
    user.save({}, { useMasterKey: true }).then(function(s) {
      console.log('[===afterSave succeeded]: ' + user.id);
    
    //console.log('#User after save#');
    var publicUser = Parse.Object.extend("PublicUser");
    var PublicUser = new publicUser();
    var acel = new Parse.ACL();
    acel.setPublicReadAccess(true);
    acel.setPublicWriteAccess(false);
    acel.setWriteAccess(user.id,true);
    acel.setReadAccess(user.id,true);
    PublicUser.setACL(acel);
      var userid = user.id;
    PublicUser.set({
      'username': s.get('username'),
      'id': userid,
      'iduser': userid
    })
      PublicUser.save().then(function(s) {
      console.log('user saved public')
      }, function(e) {
      console.log('@@error'+ JSON.stringify(e));
    });
      
      
    }, function(e) {
      console.log('[===afterSave failed]: '+ JSON.stringify(e));
    })
  }
})
