<?php
/**
 * Input arrays preperations
 * 
 * @package    Mediboard
 * @subpackage includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 * @version    $Id: magic_quotes_gpc.php 14522 2012-02-02 13:40:48Z mytto $
 */

// Emulates magic quotes when disabled
if (!get_magic_quotes_gpc() || isset($_REQUEST["ajax"])) {
  $_GET     = array_map_recursive("addslashes", $_GET);
  $_POST    = array_map_recursive("addslashes", $_POST);
  $_COOKIE  = array_map_recursive("addslashes", $_COOKIE);
  $_REQUEST = array_map_recursive("addslashes", $_REQUEST);
}

