DROP table if EXISTS profile;
DROP table if EXISTS creds;

CREATE TABLE profile (id BIGSERIAL NOT NULL PRIMARY KEY, name varchar(16) UNIQUE, description varchar(255), email varchar(128) UNIQUE, status smallint not null);
create table creds (profile bigint not null primary KEY, passwd varchar(32));
create table setting (id BIGSERIAL NOT null primary key, name varchar(64) UNIQUE);
create table player (setting bigint not null, profile bigint not null, role smallint not null, primary key (game, profile));



insert into profile (name, description) values ('NomProfTest', 'DescProfTest');
insert into creds (profile, passwd) values (1, 'aaa');
