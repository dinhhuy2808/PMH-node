var dateFormat = require('dateformat');
module.exports.check = function(req, res ,next){

    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    var sql = '';


    var con = req.db.driver.db;

    if(req.session.treefolder == undefined){
        sql = 'select image, \n' +
            'GROUP_CONCAT(c.cat_id SEPARATOR \'; \') as cat_ids,\n' +
            'GROUP_CONCAT(c.folder_id SEPARATOR \'; \') as folder_ids,\n' +
            'GROUP_CONCAT(c.cat_name SEPARATOR \'; \') as cat_names,\n' +
            '(select folder_name from treefolder t where t.folder_id = c.folder_id ) as folder_name,' +
            '(select t.index from treefolder t where t.folder_id = c.folder_id ) as folder_index from category  c group by folder_name order by folder_index asc;\n'
        con.query(sql, function (err, rows) {
            if(!err){
                req.session.treefolder = rows;
                next();
            }
        });
    } else {
        next();
    }


};
