<?php
/**
 * Session handling and initialisation
 *
 * @package    Mediboard
 * @subpackage includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html
 * @version    $Id: session.php 17296 2012-11-13 17:25:24Z phenxdesign $
 */

// Load AppUI from session
global $rootName;

// Manage the session variable(s)
$session_name = preg_replace("/[^a-z0-9]/i", "", $rootName);

session_name($session_name);

if (get_cfg_var("session.auto_start") > 0) {
  session_write_close();
}

CSessionHandler::start();

// Check if the session was made via a temporary token
// and save its expiration date
if (isset($_SESSION["token_expiration"])) {
    var_dump($_SESSION["token_expiration"]);
  CAppUI::$token_expiration = $_SESSION["token_expiration"];
}

// Reset session if it expired
if (CAppUI::isTokenSessionExpired()) {
  CAppUI::$token_expiration = null;

  // Free the session data
  CSessionHandler::end(true);

  // Start it back
  CSessionHandler::start();
}

// Check if session has previously been initialised
if (empty($_SESSION["AppUI"]) || isset($_GET["logout"])) {
  $_SESSION["AppUI"] = CAppUI::init();
}

CAppUI::$instance =& $_SESSION["AppUI"];
CAppUI::$instance->session_name = $session_name;

if (!isset($_SESSION["locked"])) {
  $_SESSION["locked"] = false;
}

CAppUI::checkSessionUpdate();

if (!isset($_SESSION['browser'])) {
  /** Basic browser detection */
  $browser = array(
    'version'   => '0.0.0',
    'majorver'  => 0,
    'minorver'  => 0,
    'build'     => 0,
    'name'      => 'unknown',
    'mobile'    => false,
    'deprecated'=> false,
    'useragent' => '',
  );

  $browsers = array(
    'firefox', 'msie', 'opera', 'chrome', 'safari', 'mozilla', 'seamonkey', 'konqueror', 'netscape',
    'gecko', 'navigator', 'mosaic', 'lynx', 'amaya', 'omniweb', 'avant', 'camino', 'flock', 'aol'
  );

  $minimal_versions = CAppUI::conf("browser_compat");

  if (isset($_SERVER['HTTP_USER_AGENT'])) {
    $browser['useragent'] = $_SERVER['HTTP_USER_AGENT'];
    $user_agent = mb_strtolower($browser['useragent']);
    foreach ($browsers as $_browser) {
      if (preg_match("/($_browser)[\/ ]?([0-9.]*)/", $user_agent, $match)) {
        $browser['name'] = $match[1];
        $browser['version'] = $match[2];

        // Special case of Opera http://dev.opera.com/articles/view/opera-ua-string-changes/
        if ($browser['name'] == "opera" && preg_match("/(version)\/([0-9.]*)/", $user_agent, $match)) {
          $browser['version'] = $match[2];
        }

        @list($browser['majorver'], $browser['minorver'], $browser['build']) = explode('.', $browser['version']);
        break;
      }
    }

    $ios = preg_match("/(ipad|iphone)/", $user_agent, $matches);
    if ($ios) {
      $browser['name'] = $matches[1];
    }

    //detect if the browser is host on mobile device
    $mobile = new Mobile_Detect();
    $browser['mobile'] = ($mobile->isMobile() || $mobile->isTablet());

    $browser['tablet'] = $mobile->isTablet();
  }

  $browser['deprecated'] = isset($minimal_versions[$browser['name']]) &&
                             version_compare($browser['version'],  $minimal_versions[$browser['name']], "<") &&
                             !$browser['mobile'];

  $_SESSION['browser'] =& $browser;
}
else {
  $browser =& $_SESSION['browser'];
}
