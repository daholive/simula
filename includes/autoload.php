<?php 
/**
 * Autoload strategies
 *
 * PHP version 5.1.x+
 *  
 * @category   Dispatcher
 * @package    Mediboard
 * @subpackage Includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 * @version    SVN: $Id: autoload.php 16731 2012-09-25 08:46:05Z phenxdesign $ 
 * @link       http://www.mediboard.org
 */

CApp::$performance["autoloadCount"] = 0;
CApp::$performance["autoload"] = array();

CApp::$classPaths = SHM::get("class-paths");

/**
 * Mediboard class autoloader
 * 
 * @param string $class Class to be loaded
 * 
 * @return bool
 */
function mbAutoload($class) {
  $file_exists = false;
  $time = microtime(true);
  
  // Entry already in cache
  if (isset(CApp::$classPaths[$class])) {
    // The class is known to not be in MB
    if (CApp::$classPaths[$class] === false) {
      return false;
    }
    
    // Load it if we can
    if ($file_exists = file_exists(CApp::$classPaths[$class])) {
      CApp::$performance["autoloadCount"]++;
      return include_once CApp::$classPaths[$class];
    }
  }
  
  // File moved ?
  if (!$file_exists) {
    unset(CApp::$classPaths[$class]);
  }
  
  // CSetup* class
  if (preg_match('/^CSetup(.+)$/', $class, $matches)) {
    $dirs = array(
      "modules/$matches[1]/setup.php",
    );
  }
  
  // Other class
  else {
    $dirs = array(
      "classes/$class.class.php", 
      "classes/*/$class.class.php",
      "mobile/*/$class.class.php",
      "modules/*/classes/$class.class.php",
      "modules/*/classes/*/$class.class.php",
      "modules/*/classes/*/*/$class.class.php",
      "install/classes/$class.class.php", 
    );
  }
  
  $rootDir = CAppUI::conf("root_dir");
  
  $class_path = false;
  
  foreach ($dirs as $dir) {
    $files = glob("$rootDir/$dir");
    
    foreach ($files as $filename) {
      include_once $filename;
  
      // The class was found
      if (class_exists($class, false) || interface_exists($class, false)) {
        $class_path = $filename;
        break 2;
      }
    }
  }
  
  // Class not found, it is not in MB
  CApp::$classPaths[$class] = $class_path;
  
  SHM::put("class-paths", CApp::$classPaths);
  
  CApp::$performance["autoload"][$class] = microtime(true) - $time;
  
  return $class_path !== false;
}

if (function_exists("spl_autoload_register")) {
  spl_autoload_register("mbAutoload");
}
else {
  /**
   * Autoload magic function redefinition
   * 
   * @param string $class Class to be loaded
   * 
   * @return bool
   */
  function __autoload($class) {
    return mbAutoload($class);
  }
}
