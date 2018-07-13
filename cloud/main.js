
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
