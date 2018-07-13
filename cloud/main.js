
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});
Parse.Cloud.afterDelete('Records', (request) => {
    // code here
    

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
    console.log('[userid]: ' + record.receiverID);
    if (!req.object.existed()) {
        var record = req.object;
        var acl = new Parse.ACL();
        acl.setPublicReadAccess(false);
        acl.setPublicWriteAccess(false);
        acl.setReadAccess(record.receiverID, true);
        acl.setWriteAccess(record.receiverID, true);
        record.setACL(acl);
        record.save(null).then(function (s) {
            console.log('[afterSave succeeded]: ' + JSON.stringify(s));
        }, function (e) {
            console.log('[afterSave failed]: ' + JSON.stringify(e));
        })
    }
});
