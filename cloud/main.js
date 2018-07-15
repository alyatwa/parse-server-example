
Parse.Cloud.define('hello', function (req, res) {
    res.success('Hi');
});
Parse.Cloud.afterDelete('Records', (request) => {
        var record = request.object;
        //console.log('record.id *******************', record.id);
          
        var query = new Parse.Query('PrivateRecord');
        query.equalTo('recordId',record.id);
        query.find({ useMasterKey: true}).then(function (res) {
                var data = res[0];
                //console.log('private record found  *******************', record.id);
                //console.log('data of found obj', res[0]);
                res[0].destroy({
                    useMasterKey: true
                }).then(function (s) {
                  //  console.log('[afterDelete succeeded]: ' + JSON.stringify(s));
                }, function (e) {
                  //  console.log('[afterDelete failed]: ' + JSON.stringify(e));
                });
            });
   
    var file = request.object.get("file").url();
    var real = process.env.SERVER_URL+"/files/"+file.substring(file.lastIndexOf("/") + 1);
    Parse.Cloud.httpRequest({
        method: 'DELETE',
        url: real,
        headers: {
            "X-Parse-Application-Id": process.env.APP_ID,
            "X-Parse-Master-Key": process.env.MASTER_KEY
        }
    }).then(function(httpResponse) {
      console.log('del file success ');
        /****************************/
        /****************************/
      res.end(httpResponse.text);
    }, function(err) {
      console.log('error to del file ',err);
      res.end(err);
    });
    
});


Parse.Cloud.afterSave('Records', function (req, response) {
    //console.log('===afterSave called: ===' + JSON.stringify(req.object));
    //console.log('[userid]: ' + req.object.get('receiverID'));
    if (!req.object.existed()) {
        var record = req.object;
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        acl.setRoleWriteAccess('app', true);
        acl.setRoleReadAccess('app', true);
        acl.setReadAccess(record.get('receiverID'), true);
        acl.setWriteAccess(record.get('receiverID'), true);
        record.setACL(acl);
        record.save(null, {
                useMasterKey: true
            }).then(function (recordset) {
            /****increment new for user****/
            let receiver = req.object.get('receiverID');
            let query = new Parse.Query('_User');
             console.log('receiver ###', receiver);
            query.equalTo('objectId',receiver);
            query.find({ useMasterKey: true}).then(function (res) {
                 console.log('target user found ###', res);
            var user = res[0];
            user.increment("new", 1);
            user.save({}, { useMasterKey: true }).then(function (s) {
                console.log('######dum test', user.get('FCM'));
                
      Parse.Cloud.httpRequest({
        method: 'POST',
        url: 'https://fcm.googleapis.com/fcm/send',
        headers: {
            "Content-Type": "application/json",
            "Authorization": "key="+process.env.FCM,
        },
         body: {
  "notification": {
    "title": "Background Message Title",
    "body": "Background message body",
    "click_action" : "https://dummypage.com"
  },
  "to" : user.get('FCM')
             
  }
    }).then(function(httpResponse) {
      console.log('push send success ');
      res.end(httpResponse.text);
    }, function(err) {
      console.log('error push send',err);
      res.end(err);
    });
                
                
                
                response.success();
            },function (e) {
                console.log('error increment', e);
                response.error();
            });
            });
            
            /****************************/
            // save sender data in private class
            let privaterecord = Parse.Object.extend("PrivateRecord");
            let PrivateRecord = new privaterecord();
            let acel = new Parse.ACL();
            acel.setPublicReadAccess(false);
            acel.setPublicWriteAccess(false);
            acel.setRoleWriteAccess('app', true);
            acel.setRoleReadAccess('app', true);
            PrivateRecord.setACL(acel);
            let username;
            if (req.user) {
                username = req.user.get('username')
            } else {
                username = 'Anonymous'
            }
            PrivateRecord.set({
                'receiverId': req.object.get('receiverID'),
                'sender': username,
                'recordId': req.object.id,
                'file': req.object.get('file'),
                'recordid': {
                    "__type": "Pointer",
                    "className": "Records",
                    "objectId": req.object.id
                },
            });

            PrivateRecord.save({}, { useMasterKey: true }).then(function (s) {
                console.log('private record saved: ' + s.get('recordId'));
                //console.log('[afterSave succeeded]: ' + JSON.stringify(s));
            }, function (e) {
                //console.log('[afterSave failed]: ' + JSON.stringify(e));
            });
        })
    }
});
Parse.Cloud.afterSave(Parse.User, function (request) {
    // console.log('====== before if ---------');
    if (!request.object.existed()) {
        // console.log('======  in if ---------');
        var user = request.object;
        var acl = new Parse.ACL(user);
        acl.setPublicReadAccess(false);
        user.setACL(acl);
        user.set('new', 0);
        user.save({}, { useMasterKey: true }).then(function (s) {
            let publicUser = Parse.Object.extend("PublicUser");
            let PublicUser = new publicUser();
            let acel = new Parse.ACL();
            acel.setPublicReadAccess(true);
            acel.setPublicWriteAccess(false);
            acel.setWriteAccess(user.id, true);
            acel.setReadAccess(user.id, true);
            PublicUser.setACL(acel);
            PublicUser.set({
                'userId': user.id,
                'username': s.get('username')
            })
            PublicUser.save({}, { useMasterKey: true }).then(function (s) {
                //console.log('user saved public')
            }, function (e) {
                //  console.log('@@error'+ JSON.stringify(e));
            });


        }, function (e) {
            // console.log('[===afterSave failed]: '+ JSON.stringify(e));
        })
    } else {
        // console.log('======  in else ---------',  request.object.id);
        var query = new Parse.Query('PublicUser');
        query.equalTo('userId', request.object.id);
        query.first({
            success: function (data) {
                var object = data;
                //console.log('find--->',JSON.stringify(object));
                if (request.object.get('img')) {
                    object.set('img', request.object.get('img'))
                }
                object.set('username', request.object.get('username'));
                object.save({}, { useMasterKey: true }).then(function (s) {
                    //console.log('user updated public', s)
                }, function (e) {
                    // console.log('@@error update'+ JSON.stringify(e));
                });
            },
            error: function (error) {
                // alert("Error query: " + error.code + " " + error.message);
            }
        });

    }
})


// remove user public data when user deleted
Parse.Cloud.afterDelete(Parse.User, (request) => {
    var user = request.object.id;
    var query = new Parse.Query('PublicUser');
    query.equalTo('userId', user);
    query.first({
        success: function (data) {
            data.destroy({ useMasterKey: true });
        }
    });

    if (request.object.get("img")) {
        var file = request.object.get("img").url();
        var real = process.env.SERVER_URL+"/files/"+file.substring(file.lastIndexOf("/") + 1);
       
        //console.log('profile img link for delete ', file)
        Parse.Cloud.httpRequest({
            method: 'DELETE',
            url: real,
            headers: {
                "X-Parse-Application-Id": process.env.APP_ID,
            "X-Parse-Master-Key": process.env.MASTER_KEY
            }
        }).then(function(httpResponse) {
      console.log('del img profile success ');
        /****************************/
        /****************************/
      res.end(httpResponse.text);
    }, function(err) {
      console.log('error to del img profile ',err);
      res.end(err);
    });;
    }

})
