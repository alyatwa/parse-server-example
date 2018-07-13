
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});
Parse.Cloud.afterDelete('Records', (request) => {
    // code here
    console.log('url: ', request)
    var file = request.get("file").url();
    Parse.Cloud.httpRequest({
                method: 'DELETE',
                url: file.substring(file.lastIndexOf("/") + 1),
                headers: {
                    "X-Parse-Application-Id": "${process.env.APP_ID}",
                    "X-Parse-REST-API-Key": "${process.env.MASTER_KEY}"
                }
                });
})
