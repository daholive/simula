<?php
/**
 * Error handlers and configuration
 * 
 * @package    Mediboard
 * @subpackage includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 * @version    $Id: errors.php 17232 2012-11-08 09:19:22Z phenxdesign $
 */

global $dPconfig;

define("PRE_LOG_PATH", $dPconfig["root_dir"]."/tmp/");
define("QUERY_LOG_PATH", PRE_LOG_PATH.'/query-log/');
define("KLOG_PATH", PRE_LOG_PATH.'/klog/');
define("LOG_PATH", $dPconfig["root_dir"]."/tmp/mb-log.html");
define("E_JS_ERROR", 0);

// Since PHP 5.2.0
if (!defined("E_RECOVERABLE_ERROR")) {
  define("E_RECOVERABLE_ERROR", 4096);
}

// Since PHP 5.3.0
if (!defined("E_DEPRECATED")) {
  define("E_DEPRECATED", 8192);
  define("E_USER_DEPRECATED", 16384);
}

// Do not set to E_STRICT as it hides fatal errors to our error handler

// Developement
//error_reporting(E_ALL | E_STRICT | E_USER_DEPRECATED | E_DEPRECATED);

// Production 
error_reporting(E_ALL);

ini_set("error_log", LOG_PATH);
ini_set("log_errors_max_len", "4M");
ini_set("log_errors", true);
ini_set("display_errors", $dPconfig["debug"]);

$divClasses = array (
  E_ERROR             => "big-error",   // 1
  E_WARNING           => "big-warning", // 2
  E_PARSE             => "big-info",    // 4
  E_NOTICE            => "big-info",    // 8
  E_CORE_ERROR        => "big-error",   // 16
  E_CORE_WARNING      => "big-warning", // 32
  E_COMPILE_ERROR     => "big-error",   // 64
  E_COMPILE_WARNING   => "big-warning", // 128
  E_USER_ERROR        => "big-error",   // 256
  E_USER_WARNING      => "big-warning", // 512
  E_USER_NOTICE       => "big-info",    // 1024
  E_STRICT            => "big-info",    // 2048
  E_RECOVERABLE_ERROR => "big-error",   // 4096
  E_DEPRECATED        => "big-info",    // 8192
  E_USER_DEPRECATED   => "big-info",    // 16384
                                        // E_ALL = 32767 (PHP 5.4)
  E_JS_ERROR => "big-warning javascript",// 0
);

// Pour BCB 
unset($divClasses[E_STRICT]);
unset($divClasses[E_DEPRECATED]);

if (!$dPconfig["debug"]) {
  unset($divClasses[E_STRICT]);
  unset($divClasses[E_RECOVERABLE_ERROR]); // Thrown by bad type hinting
}

$errorTypes = array (
  E_ERROR             => "Error",
  E_WARNING           => "Warning",
  E_PARSE             => "Parse",
  E_NOTICE            => "Notice",
  E_CORE_ERROR        => "Core error",
  E_CORE_WARNING      => "Core warning",
  E_COMPILE_ERROR     => "Compile error",
  E_COMPILE_WARNING   => "Compile warning",
  E_USER_ERROR        => "User error",
  E_USER_WARNING      => "User warning",
  E_USER_NOTICE       => "User notice",
  E_STRICT            => "Strict",
  E_RECOVERABLE_ERROR => "Recoverable error",
  E_DEPRECATED        => "Deprecated",
  E_USER_DEPRECATED   => "User deprecated",
  E_JS_ERROR          => "Javascript error",
);

$errorCategories = array (
  E_ERROR             => "error",
  E_WARNING           => "warning",
  E_PARSE             => "error",
  E_NOTICE            => "notice",
  E_CORE_ERROR        => "error",
  E_CORE_WARNING      => "warning",
  E_COMPILE_ERROR     => "error",
  E_COMPILE_WARNING   => "warning",
  E_USER_ERROR        => "error",
  E_USER_WARNING      => "warning",
  E_USER_NOTICE       => "notice",
  E_STRICT            => "notice",
  E_RECOVERABLE_ERROR => "error",
  E_DEPRECATED        => "notice",
  E_USER_DEPRECATED   => "notice",
  E_JS_ERROR          => "warning",
);

/**
 * Get the path relative to Mediboard root
 * 
 * @param string $absPath Absolute path
 * 
 * @return string Relative path
 * @todo Move to CMbPath
 */ 
function mbRelativePath($absPath) {
  global $dPconfig;
  $mbPath = $dPconfig["root_dir"];
  
  $absPath = strtr($absPath, "\\", "/");
  $mbPath = strtr($mbPath, "\\", "/");
  
  // Hack for MS Windows server
  
  $relPath = strpos($absPath, $mbPath) === 0 ? 
    substr($absPath, strlen($mbPath) + 1) :
    $absPath;
    
  return $relPath;
}

/**
 * Traces variable using preformated text prefixed with a label
 * 
 * @param mixed  $var   Data to dump
 * @param string $label Add an optional label
 * 
 * @return void 
 **/
function mbDump($var, $label = null) {
  $errorTime = date("Y-m-d H:i:s");
  $msg = "<tt>[$errorTime] $label:</tt>";
  echo $msg;
}

/**
 * Process the exported data
 * 
 * @param string $export Data
 * @param string $label  Add an optionnal label
 * @param bool   $log    Log to file or echo data
 * 
 * @return int The size of the data written in the log file
 **/
function processLog($export, $label = null, $log = false) {
  $export = mbHtmlSpecialChars($export);
  $time = date("Y-m-d H:i:s");
  $msg = "\n<pre>[$time] $label: $export</pre>";
  
  if ($log) {
    #return file_put_contents(LOG_PATH, $msg, FILE_APPEND);
  }

  echo $msg;
  return null;
}

/**
 * Traces variable using preformated text prefixed with a label
 * 
 * @param mixed  $var   Data to dump
 * @param string $label Add an optional label
 * @param bool   $log   Log to file or echo data
 * 
 * @return string|int The processed log or the size of the data written in the log file 
 **/
function mbTrace($var, $label = null, $log = false) {
  return processLog(print_r($var, true), $label, $log);
}

/**
 * Log shortcut to mbTrace
 * 
 * @param mixed  $var   Data to dump
 * @param string $label Add an optional label
 * 
 * @return int The size of the data written in the log file 
 **/
function mbLog($var, $label = null) {
  return mbTrace($var, $label, true);
}

/**
 * Traces variable using preformated text prefixed with a label
 * 
 * @param mixed  $var   Data to dump
 * @param string $label Add an optional label
 * @param bool   $log   Log to file or echo data
 * 
 * @return string|int The processed log or the size of the data written in the log file 
 **/
function mbExport($var, $label = null, $log = false) {
  return processLog(var_export($var, true), $label, $log);
}

/**
 * Hide password param in HTTP param string
 * 
 * @param string $str HTTP params
 * 
 * @return string Sanitized HTTP
 **/
function hideUrlPassword($str) {
  return preg_replace("/(.*)password=([^&]+)(.*)/", '$1password=***$3', $str);
}

/**
 * Get HTML rendered information for serveur vars
 * 
 * @param array  $var  HTTP params
 * @param string $name Optional var name
 * 
 * @return string|null HTML
 **/
function print_infos($var, $name = '') {
  if (empty($var)) {
    return null;
  }
  
  $ret = "\n<pre>";
  $ret.= "<a href='#1' onclick='return toggle_info(this)'>$name</a>";
  
  if ($name == "GET") {
    $http_query = http_build_query($var, true, "&");
    $ret.= " - <a href='?$http_query' target='_blank'>Link</a>";
  }
  
  $info = substr(print_r($var, true), 6);
  $ret.= "<span style='display:none;'>$info</span></pre>";
  return $ret;
}

/**
 * Custom error handler with backtrace
 * 
 * @param string $code      Error code
 * @param string $text      Error text
 * @param string $file      Error file path
 * @param string $line      Error line number
 * @param string $context   Error context
 * @param string $backtrace Error backtrace
 * 
 * @return void
 */
function errorHandler($code, $text, $file, $line, $context, $backtrace = null) {
  global $divClasses, $errorTypes, $errorCategories;
  
  // See ALL errors
  //  echo "<br />[$errno] : $text, $file : $line";
  
  // Handles the @ case
  if (!error_reporting() || !array_key_exists($code, $divClasses)) {
    return;
  }
  
  $time = date("Y-m-d H:i:s");
  
  // CMbArray non chargé
  $divClass = isset($divClasses[$code]) ? $divClasses[$code] : null;
  $type = isset($errorTypes[$code]) ? $errorTypes[$code] : null;
  
  // Contextes 
  $contexts = $backtrace ? $backtrace : debug_backtrace();
  foreach ($contexts as &$ctx) {
    unset($ctx['args']);
    unset($ctx['object']);
  }
  $hash = md5($code.$text.$file.$line.serialize($contexts));
  
  array_shift($contexts);
  $log = "\n\n<div class='$divClass' title='$hash'>";
  
  if (class_exists("CUser")) {
    $user = CUser::get();
    if ($user->_id) {
      $log .= "\n<strong>User: </strong>$user->_view ($user->_id)";
    }
  }

  $file = mbRelativePath($file);
  $log .= <<<HTML
<strong>Time: </strong>$time
<strong>Type: </strong>$type
<strong>Text: </strong>$text
<strong>File: </strong>$file
<strong>Line: </strong>$line
HTML;

  // Might noy be ready at the time error is thrown
  $session = isset($_SESSION) ? $_SESSION : array();
  unset($session['AppUI']);
  unset($session['dPcompteRendu']['templateManager']);

  $_all_params = array(
    "GET"     => $_GET,
    "POST"    => $_POST,
    "SESSION" => $session,
  );

  // We replace passwords with a mask
  $mask = "***";
  $pattern = "/password/i";
  foreach ($_all_params as $_type => $_params) {
    foreach ($_params as $_key => $_value) {
      if (!empty($_value) && preg_match($pattern, $_key)) {
        $_all_params[$_type][$_key] = $mask;
      }
    }

    $log .= print_infos($_all_params[$_type], $_type);
  }
  
  foreach ($contexts as $context) {
    $function = isset($context["class"]) ? $context["class"] . ":" : "";
    $function.= $context["function"] . "()";
    
    $log .= "\n<strong>Function: </strong> $function";
    
    if (isset($context["file"])) {
      $context["file"] = mbRelativePath($context["file"]);
      $log .= "\n<strong>File: </strong>" . $context["file"];      
    }
    
    if (isset($context["line"])) {
      $log .= "\n<strong>Line: </strong>" . $context["line"];
    }
    
    $log .= "<br />";
  }
  
  $log .= "</div>";
  
  // CApp might not be ready yet as of early error handling
  if (class_exists("CApp")) {
    CApp::$performance[$errorCategories[$code]]++;
  }
  
  if (ini_get("log_errors")) {
    #file_put_contents(LOG_PATH, $log, FILE_APPEND);
  }
  
  if (ini_get("display_errors")) {
    echo $log;
  }
} 

set_error_handler("errorHandler");

/**
 * Custom exception handler with backtrace
 * 
 * @param exception $exception Thrown exception
 * 
 * @return void
 */
function exceptionHandler($exception) {
  $divClass = "big-warning";
  
  // Contextes 
  $contexts = $exception->getTrace();
  foreach ($contexts as &$ctx) {
    unset($ctx['args']);
  }
  $hash = md5(serialize($contexts));
  
  $log = "\n\n<div class='$divClass' title='$hash'>";
  
  $user = CUser::get();
  if ($user->_id) {
    $log .= "\n<strong>User: </strong>$user->_view ($user->_id)";
  }
  
  // Erreur générale
  $time = date("Y-m-d H:i:s");
  $type = "Exception";
  $file = mbRelativePath($exception->getFile());
  $line = $exception->getLine();
  $text = $exception->getMessage();
  $log .= <<<HTML
<strong>Time: </strong>$time
<strong>Type: </strong>$type
<strong>Text: </strong>$text
<strong>File: </strong>$file
<strong>Line: </strong>$line
HTML;
             
  $log .= print_infos($_GET, 'GET');
  $log .= print_infos($_POST, 'POST');
  
  $session = $_SESSION;
  unset($session['AppUI']);
  unset($session['dPcompteRendu']['templateManager']);
  $log .= print_infos($session, 'SESSION');
  
  foreach ($contexts as $context) {
    $function = isset($context["class"]) ? $context["class"] . ":" : "";
    $function.= $context["function"] . "()";
    
    $log .= "\n<strong>Function: </strong> $function";
    
    if (isset($context["file"])) {
      $context["file"] = mbRelativePath($context["file"]);
      $log .= "\n<strong>File: </strong>" . $context["file"];      
    }
    
    if (isset($context["line"])) {
      $log .= "\n<strong>Line: </strong>" . $context["line"];
    }
    
    $log .= "<br />";
  }
  
  $log .= "</div>";
  
  if (ini_get("log_errors")) {
    #file_put_contents(LOG_PATH, $log, FILE_APPEND);
  }
  
  if (ini_get("display_errors")) {
    echo $log;
  }
} 

set_exception_handler("exceptionHandler");

build_error_log();
