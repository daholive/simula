<?php
/**
 * Global system and modules
 * WARNING: no config documentation in those files
 * Use instead locales for UI documentation 
 * 
 * @package    Mediboard
 * @subpackage includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 * @version    $Id: config_dist.php 16957 2012-10-14 17:23:53Z phenxdesign $
 */
  
// Needed for module config file inclusions 
// Beginning of this file or installer will fail on config loading.
global $dPconfig; 

// No trailing slash, no backslashes for Win users (use slashes instead)
$dPconfig["root_dir"]          = "/var/www/mediboard";  
$dPconfig["company_name"]      = "Ministério da Saúde de Angola";
$dPconfig["page_title"]        = "SIIGHOSP";
$dPconfig["base_url"]          = "http://localhost/";

$dPconfig["offline"]           = "0";     
$dPconfig["instance_role"]     = "qualif";
$dPconfig["http_redirections"] = "0";      
$dPconfig["mb_id"]             = "";
$dPconfig["minify_javascript"] = "1";
$dPconfig["minify_css"]        = "1";
$dPconfig["currency_symbol"]   = "Kz";
$dPconfig["ref_pays"]          = "3";
$dPconfig["hide_confidential"] = "0";
$dPconfig["locale_warn"]       = "0";
$dPconfig["locale_alert"]      = "^";
$dPconfig["debug"]             = "0";
$dPconfig["sistema_central"]   = "0";

$dPconfig["readonly"]          = "0";
$dPconfig["shared_memory"]     = "none";
$dPconfig["session_handler"]   = "files";
$dPconfig["log_js_errors"]     = "1";
$dPconfig["weinre_debug_host"] = "";
$dPconfig["issue_tracker_url"] = "";
$dPconfig["help_page_url"]     = "";

// Object merge
$dPconfig["alternative_mode"]  = "1";
$dPconfig["merge_prevent_base_without_idex"]  = "1";

$dPconfig["browser_compat"]    = array(
  'firefox' => '3.0',
  'msie'    => '8.0',
  'opera'   => '9.6',
  'chrome'  => '5.0',
  'safari'  => '525.26', // 3.2
);
$dPconfig["browser_enable_ie9"]  = "0";

// Object handlers
$dPconfig["object_handlers"]   = array (
//  "CMyObjectHandler" => "1",
);

// Index handlers
$dPconfig["index_handlers"]   = array (
//  "CMyIndexHandler" => "1",
);

// Template placehodlers
$dPconfig["template_placeholders"]   = array (
//  "CMyTemplatePlaceholder" => "1",
);

// Mode migration
$dPconfig["migration"]["active"] = "0";
$dPconfig["migration"]["intranet_url"] = "http://intranet_server/mediboard/";
$dPconfig["migration"]["extranet_url"] = "http://extranet_server/mediboard/";
$dPconfig["migration"]["limit_date"] = "1970-01-01";

// Time format
$dPconfig["date"]     = "%d/%m/%Y";
$dPconfig["time"]     = "%Hh%M";
$dPconfig["datetime"] = "%d/%m/%Y %Hh%M";
$dPconfig["longdate"] = "%A %d %B %Y";
$dPconfig["longtime"] = "%H horas %M minutos";
$dPconfig["timezone"] = "Africa/Luanda";
$dPconfig["date_dash"]     = "%Y-%m-%d";

// PHP config
$dPconfig["php"] = array(
//  "memory_limit" => "128M"
);

// Standard database config
$dPconfig["db"]["std"] = array(
  "dbtype" => "mysqli",     // Change to use another dbms
  "dbhost" => "localhost", // Change to connect to a distant Database
  "dbname" => "", // Change to match your Mediboard Database Name
  "dbuser" => "", // Change to match your Username
  "dbpass" => "", // Change to match your Password
);

// Compatibility mode
$dPconfig["interop"]["mode_compat"] = "default";

// File parsers to return indexing information about uploaded files
$dPconfig["ft"] = array(
  "default"            => "/usr/bin/strings",
  "application/msword" => "/usr/bin/strings",
  "text/html"          => "/usr/bin/strings",
  "application/pdf"    => "/usr/bin/pdftotext",
);

// Module config file inclusion
$config_files = glob("./modules/*/config.php");
foreach ($config_files as $file) {
  include_once $file;
}
