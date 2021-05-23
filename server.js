'use strict';
require('dotenv').config();

const express=require ('express');

const superagent=require('superagent');

const cors=require('cors');

const pg=require('pg');

const methodOverride=require('method-override');

const PORT=process.env.PORT || 3000;

const server=express();

server.use(cors());

server.use(express.static('./public'));

server.use(express.urlencoded({extended:true}));

server.use(methodOverride('_method'));

server.set('view engine','ejs');

let client= new pg.Client(process.env.DATABASE_URL);

// let client =new pg.Client({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});

function homepageHan(req,res){
  let apiUrl=`https://jobs.github.com/positions.json?location=usa`;
  superagent.get(apiUrl)
    .then(result=>{
      let data=result.body;
      let newUsajobs=data.map(item=>{
        return new Usajobs(item);
      });
      res.render('pages/index',{newUsajobs:newUsajobs});
    })
    .catch(()=>{
      res.render('pages/error');
    });
}

function searchResultHan(req,res){
  let description=req.body.description;
  let apiUrl=`https://jobs.github.com/positions.json?description=${description}&location=usa`;
  superagent.get(apiUrl)
    .then(result=>{
      let data=result.body;
      let desUsajobs=data.map(item=>{
        return new Usajobs(item);
      });
      res.render('pages/searchResult',{desUsajobs:desUsajobs});
    })
    .catch(()=>{
      res.render('pages/error');
    });
}

function addtomylistHan(req,res){
  let data=Object.values(req.body);
  let sql=`insert into usajobs (title,company,location,url,description) values($1,$2,$3,$4,$5);`;
  client.query(sql,data)
    .then(()=>{
      res.redirect('/mylist');
    })
    .catch(()=>{
      res.render('pages/error');
    });
}

function mylistHan(req,res){
  let sql=`select * from usajobs;`;
  client.query(sql)
    .then(result=>{
      res.render('pages/mylist',{mylist:result.rows});
    })
    .catch(()=>{
      res.render('pages/error');
    });
}

function detailsHan(req,res){
  let id=[req.params.id];
  let sql=`select * from usajobs where id=$1;`;
  client.query(sql,id)
    .then(result=>{
      res.render('pages/details',{details:result.rows[0]});
    })
    .catch(()=>{
      res.render('pages/error');
    });

}

function deleteHan(req,res){
  let id=[req.params.id];
  let sql=`delete from usajobs where id=$1;`;
  client.query(sql,id)
    .then(()=>{
      res.redirect('/mylist');
    })
    .catch(()=>{
      res.render('pages/error');
    });
}

function updateHan(req,res){
  let data=Object.values(req.body);
  let sql=`update usajobs set  title=$2, company=$3, location=$4, url=$5, description=$6 where id=$1 returning *;`;
  client.query(sql,data)
    .then((result)=>{
      res.redirect(`/details/${result.rows[0].id}`);
    })
    .catch(()=>{
      res.render('pages/error');
    });
}
server.get('/',homepageHan);
server.get('/search',(req,res)=>{
  res.render('pages/search');
});
server.post('/searchResult',searchResultHan);
server.post('/addtomylist',addtomylistHan);
server.get('/mylist',mylistHan);
server.get('/details/:id',detailsHan);
server.delete('/delete/:id',deleteHan);
server.put('/update/:id',updateHan);
server.get('*',(req,res)=>{
  res.render('pages/error');
});


function Usajobs(value){
  this.title=value.title || 'Not Found';
  this.company=value.company || 'Not Found';
  this.location=value.location || 'Not Found';
  this.url=value.url || 'Not Found';
  this.description=value.description || 'Not Found';
}

client.connect()

  .then(()=>{

    server.listen(PORT,()=>{

      console.log(`PORT: ${PORT}`);

    });

  });
