exports.index = function(req, res){
    var fileStream = fs.createReadStream(filename);
    fileStream.pipe(res);
}
