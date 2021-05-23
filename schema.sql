drop table if exists usajobs;

create table if not exists usajobs(
    id serial primary key,
    title varchar(255),
    company varchar(255),
    location varchar(255),
    url text,
    description text 
)