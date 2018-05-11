DROP table if EXISTS profile;
DROP table if EXISTS creds;
DROP table if EXISTS setting;
DROP table if EXISTS player;
DROP table if EXISTS apikey;

CREATE TABLE profile (id BIGSERIAL NOT NULL PRIMARY KEY, name varchar(16) UNIQUE, description varchar(255), email varchar(128) UNIQUE, status smallint not null);
create table creds (profile bigint not null primary KEY, passwd varchar(32));
create table setting (id BIGSERIAL NOT null primary key, name varchar(64) UNIQUE);
create table player (setting bigint not null, profile bigint not null, role smallint not null, primary key (setting, profile));
create table apikey (key char(32) not null primary key, idprofile bigint not null);


insert into profile (name, description, status) values ('NomProfTest', 'DescProfTest', 3);
insert into creds (profile, passwd) values (1, 'aaa');
