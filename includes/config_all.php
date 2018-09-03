<?php 
/**
 * Configuration loader
 *  
 * @category Config
 * @package  Mediboard
 * @author   SARL OpenXtrem <dev@openxtrem.com>
 * @license  GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 * @version  SVN: $Id: config_all.php 14808 2012-03-08 13:57:08Z mytto $ 
 * @link     http://www.mediboard.org
 */

$path = dirname(__FILE__);

// Distribution configuration
require "$path/config_dist.php";

// Local configuration
require "$path/config.php";

// Modules configuration 
// !!!! doesn't work when the code is here and not in config_dist.php, don't know why
//$config_files = glob("$path/../modules/*/config.php");
//foreach ($config_files as $file) {
//  require $file;
//}

// Overload configuration (for master/slave)
if (is_file("$path/config_overload.php")) {
  include "$path/config_overload.php";
}
