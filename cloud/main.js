
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
    console.log('====== before if ---------');
  if (!request.object.existed()) {
       console.log('======  in if ---------');
  var user = request.object;
  var acl = new Parse.ACL(user);
  acl.setPublicReadAccess(false);
  user.setACL(acl);
    user.save({}, { useMasterKey: true }).then(function(s) {
      console.log('[===afterSave succeeded]: ' + user.id);
    
    //console.log('#User after save#');
    let publicUser = Parse.Object.extend("PublicUser");
    let PublicUser = new publicUser();
    let acel = new Parse.ACL();
    acel.setPublicReadAccess(true);
    acel.setPublicWriteAccess(false);
    acel.setWriteAccess(user.id,true);
    acel.setReadAccess(user.id,true);
    PublicUser.setACL(acel);
    PublicUser.set({
      'userid': { "__type": "Pointer", "className": "_User", "objectId": user.id },
      'username': s.get('username')
    })
      PublicUser.save().then(function(s) {
      console.log('user saved public')
      }, function(e) {
      console.log('@@error'+ JSON.stringify(e));
    });
      
      
    }, function(e) {
      console.log('[===afterSave failed]: '+ JSON.stringify(e));
    })
  } else {
      console.log('======  in else ---------',  request.object.id);
    var userpub = Parse.Object.extend("PublicUser");
    var query = Parse.Query(userpub);
    query.equalTo('userid', {
      __type: 'Pointer',
      className: '_User',
      objectId: request.object.id
    });
   
    query.first({
    success: function(object) {
      if (request.object.get('img')) {
    object.set('img', request.object.get('img'))
            }
    object.set('username', request.object.get('username'));
      object.save().then(function(s) {
      console.log('user updated public')
      }, function(e) {
      console.log('@@error update'+ JSON.stringify(e));
    });
  },
  error: function(error) {
    alert("Error query: " + error.code + " " + error.message);
  }
});
    
  }
})
