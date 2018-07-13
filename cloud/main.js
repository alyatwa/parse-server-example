
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});
Parse.Cloud.afterDelete('Records', (request) => {
    // code here
    console.log('*******: ', request)

    var record = new Parse.Query('Records');
    var id = request.ParseObject.id;
    record.equalTo("objectId", id).first().then(function (record) {
        var file = record.get("file").url();
        Parse.Cloud.httpRequest({
            method: 'DELETE',
            url: file.substring(file.lastIndexOf("/") + 1),
            headers: {
                "X-Parse-Application-Id": "${process.env.APP_ID}",
                "X-Parse-REST-API-Key": "${process.env.MASTER_KEY}"
            }
        });
    });

})
