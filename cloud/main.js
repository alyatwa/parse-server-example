
Parse.Cloud.define('hello', function (req, res) {
    res.success('Hi');
});
Parse.Cloud.afterDelete('Records', (request) => {
    var file = request.object.get("file").url();
    //console.log('*******id: ', file)
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
        record.save(null).then(function (recordset) {

            // save sender data in private class
            let privaterecord = Parse.Object.extend("PrivateRecord");
            let PrivateRecord = new privaterecord();
            let acel = new Parse.ACL();
            acel.setPublicReadAccess(false);
            acel.setPublicWriteAccess(false);
            acel.setRoleWriteAccess('app', true);
            acel.setRoleReadAccess('app', true);
            PrivateRecord.setACL(acel);
            PrivateRecord.set({
                'receiverId': req.object.get('receiverID'),
                'sender': req.object.get('sender'),
                'recordId': req.object.id,
                'file': req.object.get('file')
            });

            PrivateRecord.save({}, { useMasterKey: true }).then(function (s) {
                console.log('private record saved: ' + s.get('recordId'));
                let query = new Parse.Query('Records');
                query.equalTo('objectId', s.get('recordId'));
                query.first({
                    success: function (data) {
                        data.set({ 'sender': s.get('objectId') });
                        data.save({}, { useMasterKey: true });
                        console.log('#Record after save#',  data);
                    },
                    error: function (e) {
                        console.log('#error#', e);
                    }
                    });

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
        user.save({}, { useMasterKey: true }).then(function (s) {
            //console.log('[===afterSave succeeded]: ' + user.id);

            //console.log('#User after save#');
            let publicUser = Parse.Object.extend("PublicUser");
            let PublicUser = new publicUser();
            let acel = new Parse.ACL();
            acel.setPublicReadAccess(true);
            acel.setPublicWriteAccess(false);
            acel.setWriteAccess(user.id, true);
            acel.setReadAccess(user.id, true);
            PublicUser.setACL(acel);
            PublicUser.set({
                'userid': { "__type": "Pointer", "className": "_User", "objectId": user.id },
                'username': s.get('username')
            })
            PublicUser.save().then(function (s) {
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
        query.equalTo('userid', { "__type": "Pointer", "className": "_User", "objectId": request.object.id });
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
    query.equalTo('userid', { "__type": "Pointer", "className": "_User", "objectId": user });
    query.first({
        success: function (data) {
            data.destroy({ useMasterKey: true });
        }
    });

    if (request.object.get("file")) {
        var file = request.object.get("file").url();
        //console.log('profile img link for delete ', file)
        Parse.Cloud.httpRequest({
            method: 'DELETE',
            url: file.substring(file.lastIndexOf("/") + 1),
            headers: {
                "X-Parse-Application-Id": "${process.env.APP_ID}",
                "X-Parse-REST-API-Key": "${process.env.MASTER_KEY}"
            }
        });
    }

})
