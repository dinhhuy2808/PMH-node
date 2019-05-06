var md5 = require('MD5');
var fs=require('fs');
exports.checkEmail=function(req,res){
	var input = JSON.parse(JSON.stringify(req.body));
	console.log(input);
			var data={
			email:input.email
		};
	req.models.user.find(data, function(err, rows,next) {
					if (err){
				data={status:'error',code:'200'};
			}
			else{
					if(rows.length>0){
						data={status:'exist',code:'300'};
						}
					else{
						data={status:'success',code:'400'};
						}	
			}
							res.json(data);
		});
};
exports.checkProduct=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    var data={
        name:input.name
    };

    var sql = 'select * from product where name = \''+input.name+'\';';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if (err){
            data={status:'error',code:'200'};
        }
        else{
            if(rows.length>0){
                data={status:'exist',code:'300'};

            }
            else{
                data={status:'success',code:'400'};

            }
            res.json(data);
        }
    });

};

exports.checkPhone=function(req,res){

        var input = JSON.parse(JSON.stringify(req.body));
        console.log(input);
        var data={
            name:input.name
        };

        var sql = 'select u.user_id,u.firstname,u.email,u.phone,p.address,u.checked from user u join places p on u.user_id = p.user_id where u.phone = \''+input.phone+'\' and password <> \'akfgbksjdahfkljdash\';';
        var con = req.db.driver.db;
        con.query(sql, function (err, rows) {
            if (err){
                data={status:'error',code:'400'};
            }
            else{
                if(rows.length>0){
                    sql = 'select count(payment_id) as fail from payment where user_id = '+rows[0].user_id+' and status_id in (4,5,6);';
                    con.query(sql, function (err, rowsfail) {
                        sql = 'select count(payment_id) as success from payment where user_id = '+rows[0].user_id+' and status_id in (3);';
                        con.query(sql, function (err, rowssuccess) {
                            data={status:'success',code:'200',detail: rows,fail: rowsfail[0].fail, success: rowssuccess[0].success};
                            res.json(data);
                        });
                    });


                }
                else{
                    data={status:'not exist',code:'400'};
                    res.json(data);

                }

            }
        });



};

exports.checkCode=function(req,res){
    if(req.session.type == 1){
        var date = new Date();
        var month = date.getMonth() + 1;
        month = (month < 10 ? "0" : "") + month;
        var day  = date.getDate();
        day = (day < 10 ? "0" : "") + day;
        var year = date.getUTCFullYear();

        var today = year+''+month+day;
        var input = JSON.parse(JSON.stringify(req.body));
        console.log(input);
        var data={
            name:input.name
        };

        var sql = 'select p.size,p.name,p.price,p.product_id, ' +
            '(select disct_price from discount where product_id = p.product_id and effective_date <= '+year+''+month+day+' and '+year+''+month+''+day+'<=expired_date) as disct_price' +
            ' from product p where code = \''+input.code+'\';';
        var con = req.db.driver.db;
        con.query(sql, function (err, rows) {
            if (err){
                data={status:'error',code:'400'};
            }
            else{
                if(rows.length>0){
                    data={status:'success',code:'200',detail: rows};

                }
                else{
                    data={status:'not exist',code:'400'};

                }
                res.json(data);
            }
        });
    } else{
        var data={
            status:'fail',code:'400'
        };
        res.json(data);
    }


};
exports.checkeduser=function(req,res){
    if(req.session.type == 1){
        var con = req.db.driver.db;
        var sql = 'select checked from user where user_id = '+req.query.id+';'
        con.query(sql, function (err, rows) {
            if(err){
                console.log(err);
            }
            else{
                if(rows[0].checked!= null && rows[0].checked.trim() == 'Y'){
                    var sql = 'update user set checked = \'N\' where user_id = '+req.query.id+';'
                    con.query(sql);
                } else {
                    var sql = 'update user set checked = \'Y\' where user_id = '+req.query.id+';'
                    con.query(sql);
                }

            }
        });


    } else{
        var data={
            status:'fail',code:'400'
        };

    }
    var data={
        status:'success',code:'200'
    };
    res.json(data);
};
exports.updateSizeId=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);

    var sql = 'update cart set amount = '+input.quantity+' where product_id = '+input.sizeId+' and payment_id = '+input.paymentId+';';
    var con = req.db.driver.db;
    con.query(sql, function (err, row5s) {
        if(err){
            console.log(err);
        }
        else{
            //re-calculate payment
            var sql = 'select * \n' +
                'from cart c where payment_id = '+input.paymentId+';';
            var Sum = 0;
            var promotion = 0;
            var totalAfterPromot = 0;
            con.query(sql, function (err, rows) {
                if(err){
                    var data = {status: 'error', code: '300',error: err};
                    res.json(data);
                }else{
                    if(rows.length > 0){
                        rows.forEach(function(element) {
                            Sum += (parseFloat(element.amount) * parseFloat(element.price));
                            if(parseFloat(element.disct_price) != 0){
                                promotion = parseFloat(promotion) + ( ( parseFloat(element.price) -  parseFloat(element.disct_price))*parseFloat(element.amount));
                            }
                        });

                        totalAfterPromot = parseFloat(Sum) - parseFloat(promotion);
                        var sqlIns = 'update payment set sum = '+Sum+', promotion = '+promotion+', total = '+totalAfterPromot+'  where payment_id = '+input.paymentId+' ;';
                        con.query(sqlIns, function (err, row1s) {
                            if(err){
                                var data = {status: 'error', code: '300',error: err};
                                res.json(data);
                            }else{
                                var data={status:"success"};
                                res.json(data);
                            }
                        });

                    }else{
                        var data = {status: 'Empty', code: '400',description:"There is no products in cart !!!"};
                        res.json(data);
                    }

                }

            });



        }
    });
};
exports.deleteSizeId=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);

    var sql = 'delete from cart where product_id = '+input.sizeId+' and payment_id = '+input.paymentId+';';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
        }
        else{
            //re-calculate payment
            var sql = 'select * \n' +
                'from cart c where payment_id = '+input.paymentId+';';
            var Sum = 0;
            var promotion = 0;
            var totalAfterPromot = 0;
            con.query(sql, function (err, rows) {
                if(err){
                    var data = {status: 'error', code: '300',error: err};
                    res.json(data);
                }else{
                    if(rows.length > 0){
                        rows.forEach(function(element) {
                            Sum += (parseFloat(element.amount) * parseFloat(element.price));
                            if(parseFloat(element.disct_price) != 0){
                                promotion = parseFloat(promotion) + ( ( parseFloat(element.price) -  parseFloat(element.disct_price))*parseFloat(element.amount));
                            }
                        });

                        totalAfterPromot = parseFloat(Sum) - parseFloat(promotion);
                        var sqlIns = 'update payment set sum = '+Sum+', promotion = '+promotion+', total = '+totalAfterPromot+'  where payment_id = '+input.paymentId+' ;';
                        con.query(sqlIns, function (err, row1s) {
                            if(err){
                                var data = {status: 'error', code: '300',error: err};
                                res.json(data);
                            }else{
                                var data={status:"success"};
                                res.json(data);
                            }
                        });

                    }else{
                        var data = {status: 'Empty', code: '400',description:"There is no products in cart !!!"};
                        res.json(data);
                    }

                }

            });
        }
    });
};

exports.updateProductEntity=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    var con = req.db.driver.db;

    sql = 'select * from product where  product_id = ' +  input.id +';' ;
    con.query(sql, function (err, rows) {
        var sum = parseInt(rows[0].entity) + parseInt(input.entity);
        sql = 'update product set entity = '+sum+' where product_id = '+input.id+';';
        con.query(sql);
        var data={
           status:'success'
        };
        res.json(data)
    });

};
exports.updateProduct=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    var con = req.db.driver.db;
    var sql = '';
    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    //add new product
    sql = 'select * from product where  product_id = ' +  input.OldIds.split(",")[0] +';' ;
    con.query(sql, function (err, rows) {
        if(input.Sizes.trim() != ''){
            for(var i = 0;i < input.Sizes.split(",").length ; i++){
                var data={
                    cat_id:rows[0].cat_id,
                    create_time:parseInt(year+''+month+''+day),
                    name:rows[0].name,
                    price:input.Prices.split(',')[i]!=''?input.Prices.split(',')[i].trim():0,
                    disct_price:0,
                    size:input.Sizes.split(',')[i],
                    image:'',
                    code:input.Codes.split(',')[i],
                    description : rows[0].description,
                    information : input.Infos.split(',')[i],
                    entity:input.Entities.split(',')[i]!=''?input.Entities.split(',')[i].trim():0,
                };
                var j=0;
                req.models.product.create(data,function(err,row1s){
                    sql = 'INSERT INTO `lhc`.`discount`\n' +
                        '(`product_id`,\n' +
                        '`effective_date`,\n' +
                        '`expired_date`,\n' +
                        '`disct_price`)\n' +
                        'VALUES\n' +
                        '('+row1s.product_id+',\n' +
                        ''+year+''+month+''+day+',\n' +
                        ''+input.expired_date+',\n' +
                        ''+input.Discounts.split(',')[j]+');'
                    j++;
                    con.query(sql);
                });
            }
        }




    });

    //end add new

    for(var i = 0;i < input.OldIds.split(",").length ; i++){
        sql = 'update product set';
        if (input.OldPrices.split(",")[i]!=''){
            sql = sql + ' price = '+input.OldPrices.split(",")[i] + ' ';
        }
        if (input.OldCodes.split(",")[i]!=''){
            sql = sql + ', code = \''+input.OldCodes.split(",")[i]+'\'';
        }
        if (input.OldInfos.split(",")[i]!=''){
            sql = sql + ', information = \''+ input.OldInfos.split(",")[i] + '\'';
        }
        if (input.OldEntities.split(",")[i]!=''){
            sql =sql + ', entity = \''+input.OldEntities.split(",")[i]+'\'';
        }
        if (input.OldSizes.split(",")[i]!=''){
            sql = sql + ' , validFlag = \'1\' , size = \''+input.OldSizes.split(",")[i]+'\'';
        } else{
            sql = sql + ' , validFlag = \'2\', size = \'\'';
        }
        sql = sql +' where product_id = ' +  input.OldIds.split(",")[i] +';';
        con.query(sql);
        if(input.OldDiscounts.split(",")[i] != ''){
            sql = 'update discount set disct_price = '+input.OldDiscounts.split(",")[i]+' , expired_date ='+input.expired_date+' where product_id = ' +  input.OldIds.split(",")[i] +';'
        } else{
            sql = 'update discount set disct_price = '+input.OldDiscounts.split(",")[i]+' where product_id = ' +  input.OldIds.split(",")[i] +';'

        }


        con.query(sql);
        sql = 'update product set name = \''+input.name+'\'' +
            ' where product_id = ' +  input.OldIds.split(",")[i] +';'
        con.query(sql);
    }

     sql = 'update thuoctinh set menh = \''+input.Menh+'\'' +
         ', mau =\''+input.Mau+'\'' +
         ', tuoi =\''+input.Tuoi+'\'' +
         ' where product_id = ' +  input.OldIds.split(",")[0] +';'
    con.query(sql);

    sql = 'update product set name = \''+input.name+'\'' +
        ' where product_id = ' +  input.OldIds.split(",")[0] +';'
    con.query(sql);

    var formidable = require('formidable');
    var form = new formidable.IncomingForm({
        keepExtensions: true
    });

    form.parse(req);
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    var prdId = '';
    var avas = '';
    var path = '';
    if(req.files.upfiles != undefined){
        if(__dirname.split('\\').length > 1){
            if(req.files.upfiles.length == undefined){
                path = req.files.upfiles.path;
                avas = req.files.upfiles.path.split("\\")[ req.files.upfiles.path.split("\\").length-1];
            } else{
                for(j = 0 ; j < req.files.upfiles.length ; j++){
                    if(path == ''){
                        path = req.files.upfiles[j].path;
                        avas = req.files.upfiles[j].path.split("\\")[ req.files.upfiles[j].path.split("\\").length-1];
                    }else{
                        path += ';' +  req.files.upfiles[j].path;
                        avas += ';' +  req.files.upfiles[j].path.split("\\")[ req.files.upfiles[j].path.split("\\").length-1];
                    }
                }
            }
        }else{
            if(req.files.upfiles.length == undefined){
                path = req.files.upfiles.path;
                avas = req.files.upfiles.path.split("/")[ req.files.upfiles.path.split("/").length-1];
            } else{
                for(j = 0 ; j < req.files.upfiles.length ; j++){
                    if(path == ''){
                        path = req.files.upfiles[j].path;
                        avas = req.files.upfiles[j].path.split("/")[ req.files.upfiles[j].path.split("/").length-1];
                    }else{
                        path += ';' +  req.files.upfiles[j].path;
                        avas += ';' +  req.files.upfiles[j].path.split("/")[ req.files.upfiles[j].path.split("/").length-1];
                    }
                }
            }
        }
    }

    if(path.trim()!=''){
        sql = 'select * from image where product_id = '+input.OldIds.split(",")[0]+';';
        con.query(sql, function (err, element) {
            /*var newpath = '';
            for( var k = 0 ; k < element.length ; k++){
                for( var h = 0 ; h < element[k].url.split(";").length ; h++){
                    var oldpath = element[k].url.split(';')[h];
                    if(__dirname.split('/').length <= 1){
                        newpath = __dirname.replace(__dirname.split('\\')[__dirname.split('\\').length-1],'public\\assets\\img\\'+oldpath.split("\\")[ oldpath.split("\\").length-1]);
                    }else{
                        newpath = __dirname.replace(__dirname.split('/')[__dirname.split('/').length-1],'public/assets/img/'+oldpath.split("/")[ oldpath.split("/").length-1]);
                    }
                    fs.unlink(newpath,function(err){
                        if(err) console.log('file deleted fail');
                    });
                }
            }*/

           /* sql = 'delete from image where product_id = '+input.OldIds.split(",")[0];
            con.query(sql);*/
            if(avas.split(";").length >9){
                var newAvas = '';
                for(var k = 0 ; k < avas.split(";").length ; k++){

                    newAvas += avas.split(";")[k]+';';
                    if((k%8==0 || k == avas.split(";").length-1) && (k!=0)){
                        sql = 'INSERT INTO `lhc`.`image`\n' +
                            '(`product_id`,\n' +
                            '`url`,\n' +
                            '`type`)\n' +
                            'VALUES\n' +
                            '('+input.OldIds.split(",")[0]+',\n' +
                            '\''+newAvas.toString().substring(0,newAvas.length-1)+'\',\n' +
                            '\'1\');\n';
                        con.query(sql);
                        newAvas = '';
                    }
                }


            } else {
                sql = 'INSERT INTO `lhc`.`image`\n' +
                    '(`product_id`,\n' +
                    '`url`,\n' +
                    '`type`)\n' +
                    'VALUES\n' +
                    '('+input.OldIds.split(",")[0]+',\n' +
                    '\''+avas+'\',\n' +
                    '\'1\');\n';
                con.query(sql);
            }
        });

    }

    sql = 'select description from product ' +
        ' where product_id = '+input.OldIds.split(",")[0]+' ;';
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
        } else{
            sql = 'update description set description = \''+input.description.replace(/(\r\n|\n|\r)/gm,"")+'\'' +
                ' where description_id = ' +  rows[0].description +';'
            con.query(sql);
        }
    });

    data={status:'success',code:'400',path:path};
    res.json(data)
};

exports.updateProductDV=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    var con = req.db.driver.db;
    var sql = '';
    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();

        sql = 'update product set code = \''+input.code+'\''+
            ' where product_id = ' +  input.product_id +';'
        con.query(sql);
        sql = 'update product set name = \''+input.name+'\'' +
            ' where product_id = ' +  input.product_id +';'
        con.query(sql);

    var formidable = require('formidable');
    var form = new formidable.IncomingForm({
        keepExtensions: true
    });

    form.parse(req);
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    var prdId = '';
    var avas = '';
    var path = '';
    if(req.files.upfiles != undefined){
        if(__dirname.split('\\').length > 1){
            if(req.files.upfiles.length == undefined){
                path = req.files.upfiles.path;
                avas = req.files.upfiles.path.split("\\")[ req.files.upfiles.path.split("\\").length-1];
            } else{
                for(j = 0 ; j < req.files.upfiles.length ; j++){
                    if(path == ''){
                        path = req.files.upfiles[j].path;
                        avas = req.files.upfiles[j].path.split("\\")[ req.files.upfiles[j].path.split("\\").length-1];
                    }else{
                        path += ';' +  req.files.upfiles[j].path;
                        avas += ';' +  req.files.upfiles[j].path.split("\\")[ req.files.upfiles[j].path.split("\\").length-1];
                    }
                }
            }
        }else{
            if(req.files.upfiles.length == undefined){
                path = req.files.upfiles.path;
                avas = req.files.upfiles.path.split("/")[ req.files.upfiles.path.split("/").length-1];
            } else{
                for(j = 0 ; j < req.files.upfiles.length ; j++){
                    if(path == ''){
                        path = req.files.upfiles[j].path;
                        avas = req.files.upfiles[j].path.split("/")[ req.files.upfiles[j].path.split("/").length-1];
                    }else{
                        path += ';' +  req.files.upfiles[j].path;
                        avas += ';' +  req.files.upfiles[j].path.split("/")[ req.files.upfiles[j].path.split("/").length-1];
                    }
                }
            }
        }
    }

    if(path.trim()!=''){

        sql = 'select * from image where product_id = '+input.product_id+';';
        con.query(sql, function (err, element) {
            /*var newpath = '';
            for( var k = 0 ; k < element.length ; k++){
                for( var h = 0 ; h < element[k].url.split(";").length ; h++){
                    var oldpath = element[k].url.split(';')[h];
                    if(__dirname.split('/').length <= 1){
                        newpath = __dirname.replace(__dirname.split('\\')[__dirname.split('\\').length-1],'public\\assets\\img\\'+oldpath.split("\\")[ oldpath.split("\\").length-1]);
                    }else{
                        newpath = __dirname.replace(__dirname.split('/')[__dirname.split('/').length-1],'public/assets/img/'+oldpath.split("/")[ oldpath.split("/").length-1]);
                    }
                    fs.unlink(newpath,function(err){
                        if(err) console.log('file deleted fail');
                    });
                }
            }*/

           /* var sql = 'delete from  image where  product_id = '+input.product_id+';';
            con.query(sql);*/

            if(avas.split(";").length >9){
                var newAvas = '';
                for(var k = 0 ; k < avas.split(";").length ; k++){

                    newAvas += avas.split(";")[k]+';';
                    if((k%8==0 || k == avas.split(";").length-1) && (k!=0)){
                        sql = 'INSERT INTO `lhc`.`image`\n' +
                            '(`product_id`,\n' +
                            '`url`,\n' +
                            '`type`)\n' +
                            'VALUES\n' +
                            '('+input.product_id+',\n' +
                            '\''+newAvas.toString().substring(0,newAvas.length-1)+'\',\n' +
                            '\'1\');\n';
                        con.query(sql);
                        newAvas = '';
                    }
                }


            } else {
                sql = 'INSERT INTO `lhc`.`image`\n' +
                    '(`product_id`,\n' +
                    '`url`,\n' +
                    '`type`)\n' +
                    'VALUES\n' +
                    '('+input.product_id+',\n' +
                    '\''+avas+'\',\n' +
                    '\'1\');\n';
                con.query(sql);
            }
        });


    }

    sql = 'select description from product ' +
        ' where product_id = '+input.product_id+' ;';
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
        } else{
            sql = 'update description set description = \''+input.description.replace(/(\r\n|\n|\r)/gm,"")+'\'' +
                ' where description_id = ' +  rows[0].description +';'
            con.query(sql);
        }
    });

    data={status:'success',code:'400',path:path};
    res.json(data)
};
exports.updateProductImage=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    var con = req.db.driver.db;

    if(input.type == 1){
        var sql = 'select * from image where product_id = '+input.product_id+' and type = 1;'
        con.query(sql, function (err, rows) {
            if(err){
                console.log(err);
            }
            else{
                if(rows.length > 0){
                    sql = 'update image set url = \''+input.url+'\' where product_id = '+input.product_id+' and type = '+1+'' +
                        ' and url = \''+rows[0].url+'\';';
                    con.query(sql, function (err, row1s) {
                        if(err){
                            console.log(err);
                        }
                    });
                }else{
                    var sql = 'insert into image values ('+input.product_id+',\''+input.url+'\',\''+input.type+'\');';
                    con.query(sql, function (err, rows) {
                        if(err){
                            console.log(err);
                        }
                    });
                }
            }
        });
        data={status:'success',code:'400'};
        res.json(data);

    }else{
        var sql = 'insert into image values ('+input.product_id+',\''+input.url+'\',\''+input.type+'\');';
        con.query(sql, function (err, rows) {
            if(err){
                console.log(err);
            }
        });
        data={status:'success',code:'400'};
        res.json(data);
    }

};
exports.updateProductOk=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    var data={
        cat_id:input.category,
        create_time:parseInt(year+''+month+''+day),
        name:input.name,
        price:input.price,
        disct_price:input.discount,
        size:input.size,
        image:'',
        code:input.code,
        description : input.descriptionId,
    };
    req.models.product.create(data,function(err,row1s){
        if(err){
            var data={status:'fail',code:'300',description:err.message};
            res.json(data);
        }
        else{

        }
    });
    data={status:'success',code:'400'};
    res.json(data);
};
exports.addProduct=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    var con = req.db.driver.db;
    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var formidable = require('formidable');
    var form = new formidable.IncomingForm({
        keepExtensions: true
    });
    form.parse(req);
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    var prdId = '';
    var avas = '';
    var path = '';
    if(__dirname.split('\\').length > 1){
        if(req.files.upfiles.length == undefined){
            path = req.files.upfiles.path;
            avas = req.files.upfiles.path.split("\\")[ req.files.upfiles.path.split("\\").length-1];
        } else{
            for(j = 0 ; j < req.files.upfiles.length ; j++){
                if(path == ''){
                    path = req.files.upfiles[j].path;
                    avas = req.files.upfiles[j].path.split("\\")[ req.files.upfiles[j].path.split("\\").length-1];
                }else{
                    path += ';' +  req.files.upfiles[j].path;
                    avas += ';' +  req.files.upfiles[j].path.split("\\")[ req.files.upfiles[j].path.split("\\").length-1];
                }
            }
        }
    }else{
        if(req.files.upfiles.length == undefined){
            path = req.files.upfiles.path;
            avas = req.files.upfiles.path.split("/")[ req.files.upfiles.path.split("/").length-1];
        } else{
            for(j = 0 ; j < req.files.upfiles.length ; j++){
                if(path == ''){
                    path = req.files.upfiles[j].path;
                    avas = req.files.upfiles[j].path.split("/")[ req.files.upfiles[j].path.split("/").length-1];
                }else{
                    path += ';' +  req.files.upfiles[j].path;
                    avas += ';' +  req.files.upfiles[j].path.split("/")[ req.files.upfiles[j].path.split("/").length-1];
                }
            }
        }
    }

        var desc = input.description.replace(/(\r\n|\n|\r)/gm,"");
        var k = 0;
        while (desc.length > 2000){
            k++;
            var sql = 'insert into description(description) value (\''+desc.substring(0,2000)+'\');';
            con.query(sql);
            desc = desc.substring(2000,desc.length);
        }
        var sql = 'insert into description(description) value (\''+desc+'\');';
        con.query(sql, function (err, rows) {
            if(err){
                console.log(err);
            }else{
                var i = 0;
                var descTemp = rows.insertId;
                var current = parseInt(rows.insertId);
                while(k>0){
                    descTemp = current-1+','+descTemp;
                    current = current-1;
                    k--;
                }
                    if(input.mode == 'dv'){
                        var data={
                            cat_id:input.category,
                            create_time:parseInt(year+''+month+''+day),
                            name:input.name,
                            price:0,
                            disct_price:0,
                            size:0,
                            image:'',
                            code:input.Codes.split(',')[i],
                            description : descTemp,
                            information :'',
                            entity:0,
                        };
                        var j=0;
                        req.models.product.create(data,function(err,row1s){
                            if(err){
                                var data={status:'fail',code:'300',description:err.message};
                                res.json(data);
                            } else {
                                var sql = 'update image set product_id = '+row1s.product_id+' where product_id = 0 ;';
                                con.query(sql);
                                sql = 'INSERT INTO `lhc`.`image`\n' +
                                    '(`product_id`,\n' +
                                    '`url`,\n' +
                                    '`type`)\n' +
                                    'VALUES\n' +
                                    '('+row1s.product_id+',\n' +
                                    '\''+avas+'\',\n' +
                                    '\'1\');\n';
                                con.query(sql);
                                sql = 'INSERT INTO `lhc`.`thuoctinh`\n' +
                                    '(`product_id`,\n' +
                                    '`mau`,\n' +
                                    '`tuoi`,\n' +
                                    '`menh`,`sizefrom`,`sizeto`)\n' +
                                    'VALUES\n' +
                                    '('+row1s.product_id+',\n' +
                                    '\'\',\n' +
                                    '\'\',\n' +
                                    '\'\',0,0);\n'
                                con.query(sql);
                            }
                        });
                    } else {
                        for (var i=0; i < input.Sizes.split(',').length ;i++){
                            if(input.Sizes.split(',')[i].trim() != ''){
                                var img = path.split(";")[0];

                                var data={
                                    cat_id:input.category,
                                    create_time:parseInt(year+''+month+''+day),
                                    name:input.name,
                                    price:input.Prices.split(',')[i]!=''?input.Prices.split(',')[i].trim():0,
                                    disct_price:0,
                                    size:input.Sizes.split(',')[i],
                                    image:'',
                                    code:input.Codes.split(',')[i],
                                    description : descTemp,
                                    information : input.Infos.split(',')[i],
                                    entity:input.Entities.split(',')[i]!=''?input.Entities.split(',')[i].trim():0,
                                };
                                var j=0;
                                req.models.product.create(data,function(err,row1s){
                                    if(err){
                                        var data={status:'fail',code:'300',description:err.message};
                                        res.json(data);
                                    }
                                    else{

                                        if(prdId == ''){

                                            var sql = 'update image set product_id = '+row1s.product_id+' where product_id = 0 ;';
                                            con.query(sql);
                                            var splitImg = new Array();

                                            if(avas.split(";").length >9){
                                                var newAvas = '';
                                                for(var k = 0 ; k < avas.split(";").length ; k++){

                                                    newAvas += avas.split(";")[k]+';';
                                                    if((k%8==0 || k == avas.split(";").length-1) && (k!=0)){
                                                       /* splitImg.push(newAvas.toString().substring(0,newAvas.length-1));
                                                        newAvas = '';
*/
                                                        sql = 'INSERT INTO `lhc`.`image`\n' +
                                                            '(`product_id`,\n' +
                                                            '`url`,\n' +
                                                            '`type`)\n' +
                                                            'VALUES\n' +
                                                            '('+row1s.product_id+',\n' +
                                                            '\''+newAvas.toString().substring(0,newAvas.length-1)+'\',\n' +
                                                            '\'1\');\n';
                                                        con.query(sql);
                                                        newAvas = '';
                                                    }
                                                }


                                            } else {
                                                sql = 'INSERT INTO `lhc`.`image`\n' +
                                                    '(`product_id`,\n' +
                                                    '`url`,\n' +
                                                    '`type`)\n' +
                                                    'VALUES\n' +
                                                    '('+row1s.product_id+',\n' +
                                                    '\''+avas+'\',\n' +
                                                    '\'1\');\n';
                                                con.query(sql);
                                            }

                                            sql = 'INSERT INTO `lhc`.`thuoctinh`\n' +
                                                '(`product_id`,\n' +
                                                '`mau`,\n' +
                                                '`tuoi`,\n' +
                                                '`menh`,`sizefrom`,`sizeto`)\n' +
                                                'VALUES\n' +
                                                '('+row1s.product_id+',\n' +
                                                '\''+input.Mau+'\',\n' +
                                                '\''+input.Tuoi+'\',\n' +
                                                '\''+input.Menh+'\','+input.SizeFrom+','+input.SizeTo+');\n'
                                            con.query(sql);
                                        }
                                        prdId += row1s.product_id;
                                        sql = 'INSERT INTO `lhc`.`discount`\n' +
                                            '(`product_id`,\n' +
                                            '`effective_date`,\n' +
                                            '`expired_date`,\n' +
                                            '`disct_price`)\n' +
                                            'VALUES\n' +
                                            '('+row1s.product_id+',\n' +
                                            ''+year+''+month+''+day+',\n' +
                                            ''+input.expired_date+',\n' +
                                            ''+input.Discounts.split(',')[j]+');'
                                        j++;
                                        con.query(sql);

                                    }

                                });
                            }
                        }
                        i = 0;
                        prdId.split(',').forEach(function (element){
                            if(input.Discounts.split(',')[i]!=''){

                                i++;
                            }
                        });
                    }





            }
        });

        var data={status:'success',code:'400',path:path};
        res.json(data);


};

exports.addProductImages=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    var con = req.db.driver.db;
    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var formidable = require('formidable');
    var form = new formidable.IncomingForm({
        keepExtensions: true
    });
    form.parse(req);
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    var prdId = '';

    var path = req.files.images.path;
        var img = '';

    if(__dirname.split('/').length <= 1){
        img=req.files.images.path.split("\\")[ req.files.images.path.split("\\").length-1];
    }else{
        img=req.files.images.path.split("/")[ req.files.images.path.split("/").length-1];
    }

        var data={status:'success',code:'400',path:path,image:img};
        res.json(data);

};
exports.addSizeToCart=function(req,res){
    var input=JSON.parse(JSON.stringify(req.body));
    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    var userid;
    var sql = 'select user_id from user where user_id = \''+input.userId +'\';';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            var data = {status: 'error', code: '300',error: err};
            res.json(data);
        }else{

            if(rows.length > 0){
                var i = 0;

                    console.log(input.size_id);
                    userid = rows[0].user_id;
                    var getAmount = 'select * from cart where product_id = '+input.size_id+' and user_id = '+userid+' and payment_id = '+input.payment_id+';';
                    var dataCart ={
                        product_id:input.size_id,
                        user_id:userid,
                        payment_id : input.payment_id
                    };
                    con.query(getAmount, function (err, row2s) {
                        if(err){
                            var data = {status: 'error', code: '300',error: err};
                            res.json(data);
                        }else{
                            if(row2s.length>0){
                                var sqlUpdate = 'update cart set amount = '+(parseInt(input.quantity[i])+parseInt(row2s[0].amount))+' where product_id = '+input.size_id+' and user_id = '+userid+';';
                                con.query(sqlUpdate,function(err,row1s) {
                                    if (err) {
                                        var data = {status: 'fail', code: '300', description : err.message};
                                        res.json(data);
                                    } else {

                                    }
                                });
                            }else{
                                var data={
                                    user_id: parseInt(userid),
                                    product_id:parseInt(input.size_id),
                                    amount:parseInt(input.quantity),
                                    payment_id:parseInt(input.payment_id),
                                    create_time:parseInt(year+''+month+''+day),
                                    status_id:0
                                };
                                req.models.cart.create(data,function(err,row1s) {
                                    if (err) {
                                        var data = {status: 'fail', code: '300', description : err.message};
                                        res.json(data);
                                    } else {
                                        var updatePrice = 'update cart set disct_price = (select disct_price from product where product_id = '+input.size_id+'), price = (select price from product where product_id = '+input.size_id+')' +
                                            ' where product_id = '+input.size_id+' and user_id = '+userid+' and payment_id = '+input.payment_id+'  ;';
                                        con.query(updatePrice, function (err, row4s) {
                                            if(!err){
                                                //re-calculate payment
                                                var sql = 'select * \n' +
                                                    'from cart c where payment_id = '+input.payment_id+';';
                                                var Sum = 0;
                                                var promotion = 0;
                                                var totalAfterPromot = 0;
                                                con.query(sql, function (err, row5s) {
                                                    if(err){
                                                        var data = {status: 'error', code: '300',error: err};
                                                        res.json(data);
                                                    }else{
                                                        if(row5s.length > 0){
                                                            row5s.forEach(function(element) {
                                                                Sum += (parseFloat(element.amount) * parseFloat(element.price));
                                                                if(parseFloat(element.disct_price) != 0){
                                                                    promotion = parseFloat(promotion) + ( ( parseFloat(element.price) -  parseFloat(element.disct_price))*parseFloat(element.amount));
                                                                }
                                                            });

                                                            totalAfterPromot = parseFloat(Sum) - parseFloat(promotion);
                                                            var sqlIns = 'update payment set sum = '+Sum+', promotion = '+promotion+', total = '+totalAfterPromot+'  where payment_id = '+input.payment_id+' ;';
                                                            con.query(sqlIns, function (err, row1s) {
                                                                if(err){
                                                                    var data = {status: 'error', code: '300',error: err};
                                                                    res.json(data);
                                                                }else{
                                                                    var data = {status: 'success', code: '200'};
                                                                    res.json(data);
                                                                }
                                                            });

                                                        }else{
                                                            var data = {status: 'Empty', code: '400',description:"There is no products in cart !!!"};
                                                            res.json(data);
                                                        }

                                                    }

                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            i++;
                        }
                    });

            }else{
                var data = {status: 'error', code: '300',error: "User not found!!!"};
                res.json(data);
            }
        }

    });
};
exports.add_to_payment_now=function(req,res){
    var input=JSON.parse(JSON.stringify(req.body));
    var date = new Date();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var year = date.getUTCFullYear();
    var today = year+''+month+''+day;
    var user = '';
    if(input.user == undefined){
        user=req.session.user_id;
    }else{
        user=input.user;
    }
    var sql = 'select \n' +
        '(select title from payment order by title desc limit 1\n) as title' +
        ',(select price from product where product_id = c.product_id) as price';
    if((input.voucher != undefined)&&(input.voucher.trim != "")){
        sql += ',(select percent from voucher where code = \''+input.voucher+'\' and effective_date<='+today+' and '+today+'<=expired_date) as percent \n';

    }

    sql+='from product c where product_id in ( '+input.size_id.toString()+');';
    var Sum = 0;
    var promotion = 0;
    var totalAfterPromot = 0
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            var data = {status: 'error', code: '300',error: err};
            res.json(data);
        }else{
            if(rows.length > 0){
                Sum = input.total;
                if((input.voucher != undefined)&&(input.voucher.trim() != "")){
                    if(rows[0].percent!='NULL')
                        if(parseInt(rows[0].percent) > 100){
                            promotion =  rows[0].percent;
                        } else {
                            promotion = Sum*rows[0].percent/100;
                        }

                }

                totalAfterPromot = Sum-promotion;
                var padStart = require('pad-start');
                var title = rows[0].title.substring(3);
                var newtitle = parseInt(title) + 1;
                newtitle = 'LHC' + padStart(newtitle.toString(),6,'0');
                var sqlIns = 'INSERT INTO `lhc`.`payment`\n' +
                '(`user_id`,\n' +
                '`sum`,\n' +
                '`status_id`,`create_time`,`title`,`pay_type`,`promotion`,`total`,`seen_flag`,`ship`,`voucher`,`shipfee`,`note`,`address`,`name`,`phone`)\n';

                sqlIns += ' VALUES ('+user+','+Sum+',0,'+parseInt(year+''+month+''+day)+',\''+newtitle+'\',\''+input.type+'\','+promotion+','+totalAfterPromot+',\'N\'' +
                    ',\''+input.ship+'\',\''+input.voucher+'\','+input.shipfee+',\''+input.note+'\',\''+input.address+'\',\''+input.name+'\',\''+input.phone+'\')';
                con.query(sqlIns, function (err, row1s) {
                    if(err){
                        var data = {status: 'error', code: '300',error: err};
                        res.json(data);
                    }else{
                        for(var i = 0 ; i < rows.length ; i++){
                            var data={
                                user_id: input.userId,
                                product_id:input.size_id[i],
                                amount:input.quantity[i],
                                payment_id:parseInt(row1s.insertId),
                                create_time:parseInt(year+''+month+''+day),
                                status_id:0,
                                price : rows[i].price
                            };

                            req.models.cart.create(data,function(err,row2s) {
                                var sqlGet = 'select * from cart where user_id = '+input.userId+' and payment_id = '+row1s.insertId+';'
                                con.query(sqlGet, function (err, rowsCart) {
                                    if(err){
                                        var data = {status: 'error', code: '300',error: err};
                                        res.json(data);
                                    }else{
                                        for(var i = 0 ; i < rowsCart.length ; i++){
                                            var sqlUpdate = 'update cart set disct_price = (select disct_price from discount where product_id = '+rowsCart[i].product_id+' and effective_date<='+today+' and '+today+'<=expired_date)' +
                                                ', price = (select price from product where product_id = '+rowsCart[i].product_id+') ' +
                                                ', name = (select name from product where product_id = '+rowsCart[i].product_id+') ' +
                                                ', size = (select size from product where product_id = '+rowsCart[i].product_id+') ' +
                                                ', code = (select code from product where product_id = '+rowsCart[i].product_id+') ' +
                                                'where user_id = '+input.userId+' and payment_id = '+row1s.insertId+' and product_id = '+rowsCart[i].product_id+';';
                                            con.query(sqlUpdate);
                                        }


                                    }
                                });
                            });
                        }
                        var data = {status: 'success', code: '200',user_id:input.userId,Sum:Sum, payment_id:row1s.insertId};
                        res.json(data);

                    }
                });

            }else{
                var data = {status: 'Empty', code: '400',description:"There is no products in cart !!!"};
                res.json(data);
            }

        }

    });
};
exports.checkEmailAddProject=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    var data={
        email:input.email
    };
    req.models.user.find(data, function(err, rows,next) {
        if (err){
            data={status:'error',code:'200'};
        }
        else{
            if(rows.length>0){
                data={status:'exist',code:'300',name: rows[0].firstname +' '+ rows[0].lastname, user_id:rows[0].user_id};
            }
            else{
                data={status:'success',code:'400'};
            }
        }
        res.json(data);
    });
};
exports.update_folder=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    var sql = 'update treefolder t set t.index = '+input.index+', t.folder_name =\''+input.name+'\'  where folder_id = '+req.params.id+';';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
        }
        else{
           res.redirect('/maintenance-cat');
        }
    });
};
exports.checkProjectCode=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    var data={
        code:input.code
    };
    req.models.project.find(data, function(err, rows,next) {
        if (err){
            data={status:'error',code:'200'};
        }
        else{
            if(rows.length>0){
                data={status:'exist',code:'300'};
            }
            else{
                data={status:'success',code:'400'};
            }
        }
        res.json(data);
    });
};

exports.getName=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    var data={
        user_id:input.id
    };
    req.models.user.find(data, function(err, rows,next) {
        if (err){
            data={status:'error',code:'200'};
        }
        else{
            if(rows.length>0){
                data={status:'exist',code:'300',name:rows[0].firstname+' '+rows[0].lastname + '('+rows[0].email+')'};
            }
            else{
                data={status:'success',code:'400'};
            }
        }
        res.json(data);
    });
};


exports.getEmail=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);

    var sql = 'select * from user where firstname like \'%' + input.string + '%\';';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
        }
        else{
            var data;
            if(rows.length>0){
                data={names: rows};
            }
            res.json(data);
        }
    });

};
exports.count=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));


    var sql = 'select \n' +
        't.task_code,\n' +
        't.estimate,\n' +
        't.assignee_id,\n' +
        '(select firstname from user u where u.user_id = t.assignee_id) as firstname,\n' +
        '(select lastname from user u where u.user_id = t.assignee_id) as lastname,\n' +
        '(select email from user u where u.user_id = t.assignee_id) as email,\n' +
        '(select salary from user u where u.user_id = t.assignee_id) as salary,\n' +
        '(select description from status s where s.status_id = t.status_id) as status,\n' +
        '(select code from project p where p.project_id = t.project_id) as project\n' +
        'from employee.task t where status_id =  ';

    if(parseInt(input.statusflt) == 1){
        sql += '5 ';
    }else{
        sql += '6 ';
    }
    if(input.assigneeflt != '' && input.assigneeflt != undefined){
        sql += 'and `assignee_id` = (select user_id from user where email = \''+input.assigneeflt+'\') ';
    }
    if(input.projectflt != '' && input.projectflt != undefined){
        sql += 'and `project_id` = (select project_id from project where code = \''+input.projectflt+'\' ) ';
    }
    if(input.taskflt != '' && input.taskflt != undefined){
        sql += 'and `task_code` = \''+input.taskflt+'\' ';
    }
    if(input.fromflt != '' && input.fromflt != undefined){
        console.log(input.fromflt);
        var from = input.fromflt.split("-");
        var newDOB = from[2]+from[1]+from[0];
        sql += 'and `close_time` >= '+newDOB+' ';
    }
    if(input.toflt != '' && input.toflt != undefined){
        var to = input.toflt.split("-");
        var newDOB = to[2]+to[1]+to[0];
        sql += 'and `close_time` <= '+newDOB+' ';
    }

    sql+= ' order by assignee_id;'

    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
            res.redirect('/');
        }
        else{
            var data;
            if(rows.length >0){

                var temp = 0;
                var total = 0;
                for(i=0;i<rows.length;i++){
                    total += (parseFloat(rows[i].estimate) * parseFloat(rows[i].salary));

                }
                data={status:'exist',code:'300',total: total , detail:rows};
            }
            res.json(data);

        }
    });

};
exports.getCat=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);

    var sql = 'select cat_name from category where cat_name like \'%' + input.string + '%\';';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
        }
        else{
            var data;
            if(rows.length>0){
                data={names: rows};
            }
            res.json(data);
        }
    });

};
exports.getPrd=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);

    var sql = 'select name from product where name like \'%' + input.string + '%\' group by name;';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
        }
        else{
            var data;
            if(rows.length>0){
                data={names: rows};
            }
            res.json(data);
        }
    });

};
exports.check_pass=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    var passwd=md5(input.char);
    var sql = 'select user_id from user where password = \'' + passwd + '\';';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            console.log(err);
        }
        else{
            var data;
            if(rows.length > 0){
                if(parseInt(rows[0].user_id) == parseInt(req.session.user_id)){
                    data={status:'exist',code:'300' , detail:rows};
                }

            }else{
                data={status:'not',code:'400',};
            }

            res.json(data);
        }
    });

};
exports.checkUser=function(req,res){
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    if(input.mode == 'check_phone'){
        var data={
            phone:input.username
        };
    } else {
        var data={
            username:input.username
        };
    }

    req.models.user.find(data, function(err, rows,next) {
        if (err){
            data={status:'error',code:'200'};
        }
        else{
            if(rows.length>0){
                data={status:'exist',code:'300'};
            }
            else{
                data={status:'success',code:'400'};
            }
        }
        res.json(data);
    });
};
exports.updateSettingShop=function(req,res) {
    var input = JSON.parse(JSON.stringify(req.body));
    console.log(input);
    var sql = 'update lhc.settingshop set transportMethod = \''+ input.vanchuyen
        + '\', paymentMethod = \'' + input.thanhtoan
        + '\', freeShip = ' + input.freeship
        + ', defaultShip = ' + input.shipdefault
        + ' where id=0;';
    var con = req.db.driver.db;
    con.query(sql, function (err, rows) {
        if(err){
            var data = {status: 'error', code: '300',error: err};
            res.json(data);
        }else{
            var data={status:"success", code:'400'};
            res.json(data);
        }
    });
}