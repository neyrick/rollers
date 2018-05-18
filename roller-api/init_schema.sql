DROP table if EXISTS profile;
DROP table if EXISTS creds;
DROP table if EXISTS setting;
DROP table if EXISTS player;
DROP table if EXISTS apikey;
DROP table if EXISTS secure_action;


CREATE TABLE profile (id BIGSERIAL NOT NULL PRIMARY KEY, name varchar(32) UNIQUE, description varchar(255), email varchar(128) UNIQUE, status smallint not null);
create table creds (profile bigint not null primary KEY, password char(40));
create table setting (id BIGSERIAL NOT null primary key, name varchar(64) UNIQUE);
create table player (setting bigint not null, profile bigint not null, role smallint not null, primary key (setting, profile));
create table apikey (key char(53) not null primary key, idprofile bigint not null);
create table secure_action (id BIGSERIAL NOT null primary key, created timestamp not null default (now() at time zone 'utc'), status smallint not null default 0, action varchar(16) not null, params varchar (255), profile bigint, code char(56));


insert into profile (name, description, email, status) values ('NomProfTest', 'DescProfTest', 'a@b.com', 3);
insert into creds (profile, password) values (1, '7e240de74fb1ed08fa08d38063f6a6a91462a815');

insert into setting (name) values ('Eclipse Phase'), ('Ars Magica'), ('Donjons et Dragons'), ('Légende des 5 Anneaux');
insert into apikey (key, idprofile) VALUES ('26211bbdf2fb73f009a9548219a76eb994b820e61526653358316', 1);
