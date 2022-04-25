-- MySQL 10.2.43-MariaDB-log-cll-lve dump

SET NAMES utf8;
SET time_zone = '+07:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE `soccerguru_bot` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `soccerguru_bot`;

DROP TABLE IF EXISTS `sg_users`;
CREATE TABLE `sg_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  `descriptions` text DEFAULT NULL,
  `timeout_claim` varchar(10) DEFAULT NULL,
  `timeout_daily` varchar(10) DEFAULT NULL,
  `next_claim` datetime DEFAULT NULL,
  `next_daily` datetime DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `teories` text DEFAULT NULL,
  `is_auth_error` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


-- 2022-04-25 17:37:05