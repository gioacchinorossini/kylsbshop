-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2026 at 06:00 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sizgrillpos`
--

-- --------------------------------------------------------

--
-- Table structure for table `masterlist`
--

CREATE TABLE `masterlist` (
  `P_code` int(11) NOT NULL,
  `Product_code` varchar(100) NOT NULL,
  `P_name` varchar(100) NOT NULL,
  `P_Category` varchar(100) NOT NULL,
  `P_S_P` int(11) NOT NULL,
  `P_P_P` int(11) NOT NULL,
  `P_image` varchar(255) DEFAULT NULL,
  `Date_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `masterlist`
--

INSERT INTO `masterlist` (`P_code`, `Product_code`, `P_name`, `P_Category`, `P_S_P`, `P_P_P`, `P_image`, `Date_time`) VALUES
(1, 'KM01', 'PAa', 'inasal', 30, 10, '1781092151_6a294f37c90d0.jpeg', '2026-06-10 11:49:11'),
(2, 'KM02', 'PAA With Rice', 'inasal', 50, 20, 'KM02_PAA_With_Rice.jpg', '2026-06-10 13:53:46'),
(3, 'DK01', 'Coke 8oz', 'Drinks', 25, 10, 'DK01_Coke_8oz.jpg', '2026-06-10 13:54:13');

-- --------------------------------------------------------

--
-- Table structure for table `ortb`
--

CREATE TABLE `ortb` (
  `OR_ID` int(11) NOT NULL,
  `Order_No` varchar(50) NOT NULL,
  `P_Code` varchar(50) NOT NULL,
  `Product_Name` varchar(255) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `Price` decimal(10,2) NOT NULL,
  `SubTotal` decimal(10,2) NOT NULL,
  `Order_Type` varchar(50) DEFAULT NULL,
  `Payment_Method` varchar(50) DEFAULT NULL,
  `Ref_Code` varchar(100) DEFAULT NULL,
  `Cash` decimal(10,2) DEFAULT NULL,
  `Change` decimal(10,2) DEFAULT NULL,
  `Date_Time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stockin`
--

CREATE TABLE `stockin` (
  `Sin_ID` int(11) NOT NULL,
  `Product_code` varchar(100) NOT NULL,
  `P_name` varchar(100) NOT NULL,
  `P_Category` varchar(100) NOT NULL,
  `P_S_P` int(11) NOT NULL,
  `Quantity` int(11) NOT NULL,
  `Date_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stockin`
--

INSERT INTO `stockin` (`Sin_ID`, `Product_code`, `P_name`, `P_Category`, `P_S_P`, `Quantity`, `Date_time`) VALUES
(1, 'KM01', 'PAa', 'inasal', 30, 40, '2026-06-10 13:46:12'),
(2, 'KM02', 'PAA With Rice', 'inasal', 50, 50, '2026-06-10 13:54:30'),
(3, 'DK01', 'Coke 8oz', 'Drinks', 25, 50, '2026-06-10 13:54:46');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `masterlist`
--
ALTER TABLE `masterlist`
  ADD PRIMARY KEY (`P_code`);

--
-- Indexes for table `ortb`
--
ALTER TABLE `ortb`
  ADD PRIMARY KEY (`OR_ID`);

--
-- Indexes for table `stockin`
--
ALTER TABLE `stockin`
  ADD PRIMARY KEY (`Sin_ID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `masterlist`
--
ALTER TABLE `masterlist`
  MODIFY `P_code` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ortb`
--
ALTER TABLE `ortb`
  MODIFY `OR_ID` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stockin`
--
ALTER TABLE `stockin`
  MODIFY `Sin_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
