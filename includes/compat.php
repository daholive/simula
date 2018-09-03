<?php
/**
 * Compat functions emulations
 *
 * PHP version 5.1.x+
 *  
 * @category   Dispatcher
 * @package    Mediboard
 * @subpackage Includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 * @version    SVN: $Id: compat.php 16957 2012-10-14 17:23:53Z phenxdesign $ 
 * @link       http://www.mediboard.org
 */


if (!function_exists('array_diff_key')) {
  /**
   * Computes the difference of arrays using keys for comparison 
   * (PHP 5 >= 5.1.0)
   * 
   * @return array The difference array, false on error
   * @link http://php.net/array_diff_key
   */
  function array_diff_key() {
    $argCount  = func_num_args();

    if ($argCount < 2) {
      return false;
    }
    
    $argValues  = func_get_args();
    foreach ($argValues as $argParam) {
      if (!is_array($argParam)) {
        return false;
      }
    }
    
    $valuesDiff = array();
    foreach ($argValues[0] as $valueKey => $valueData) {
      for ($i = 1; $i < $argCount; $i++) {
        if (isset($argValues[$i][$valueKey])) {
          continue 2;
        }
      }
      $valuesDiff[$valueKey] = $valueData;
    }
    
    return $valuesDiff;
  }
}

/**
 * Recursively applies a function to values of an array
 * 
 * @param string $function Callback to apply
 * @param array  $array    Array to apply callback on
 * 
 * @return array
 */
function array_map_recursive($function, $array) {
  // Recursion closure
  if (!is_array($array)) {
    return call_user_func($function, $array);
  }
  
  // Rercursive call
  $result = array();
  foreach ($array as $key => $value ) {
    $result[$key] = array_map_recursive($function, $value);
  }
  
  return $result;
}

/**
 * Checks recursively if a value exists in an array
 * 
 * @param mixed $needle   The searched value.
 * @param array $haystack The array.
 * @param bool  $strict   If true also check value types
 * 
 * @return bool true if needle is found in the array, false otherwise.
 */
function in_array_recursive($needle, $haystack, $strict = false) {
  if (in_array($needle, $haystack, $strict)) {
    return true;
  }
  
  foreach ($haystack as $v) {
    if (is_array($v) && in_array_recursive($needle, $v, $strict)) {
      return true;
    }
  }
  
  return false;
}

if (!function_exists('array_replace_recursive')) {
  /**
   * Array recursive replace recurse closure
   * 
   * @param array $array  Merge host array
   * @param array $array1 Merged array
   * 
   * @return array
   * @link  http://php.net/array_replace_recursive
   */
  function array_replace_recursive__recurse($array, $array1) {
    foreach ($array1 as $key => $value) {
      // create new key in $array, if it is empty or not an array
      if (!isset($array[$key]) || (isset($array[$key]) && !is_array($array[$key]))) {
        $array[$key] = array();
      }

      // overwrite the value in the base array
      if (is_array($value)) {
        $value = array_replace_recursive__recurse($array[$key], $value);
      }
      $array[$key] = $value;
    }
    return $array;
  }
  
  /**
   * Replaces elements from passed arrays into the first array recursively
   * (PHP 5 >= 5.3.0)
   * 
   * @param object $array Merge host array
   * 
   * @return array
   * @link   http://php.net/array_replace_recursive
   */
  function array_replace_recursive($array) {
    // handle the arguments, merge one by one
    $args = func_get_args();
    $array = $args[0];
    if (!is_array($array)) {
      return $array;
    }
    for ($i = 1; $i < count($args); $i++) {
      if (is_array($args[$i])) {
        $array = array_replace_recursive__recurse($array, $args[$i]);
      }
    }
    return $array;
  }
}

if (!function_exists('array_fill_keys')) {
  /**
   * Fill an array with values, specifying keys
   * 
   * @param array $keys  Keys to fill values
   * @param mixed $value Filling value
   * 
   * @return array Filled array
   * @link   http://php.net/array_fill_keys
   */
  function array_fill_keys($keys, $value) {
    return array_combine($keys, array_fill(0, count($keys), $value));
  }
}

if (!function_exists('property_exists')) {
  /**
   * property_exists Computes the difference of arrays using keys for comparison 
   * (PHP 5 >= 5.1.0)
   * 
   * @param mixed  $context  Object or class name to inspect
   * @param string $property Name of property
   * 
   * @return boolean
   * @link http://php.net/property_exists
   */
  function property_exists($context, $property) {
    $vars = is_object($context) ? 
      get_object_vars($context) : 
      get_class_vars($context);
    return array_key_exists($property, $vars);
  }
} 

if (!function_exists('memory_get_usage')) {
  /**
   * Returns the amount of memory allocated to PHP, 
   * (PHP 4 >= 4.3.2, PHP 5)
   * requires compiling with --enable-memory-limit before 5.2.1
   * 
   * @param bool $real_usage Real memory if true, emalloc() if false
   * 
   * @return int Number of bytes
   * @link http://php.net/memory_get_usage
   */
  function memory_get_usage($real_usage = false) {
    return -1;
  }
}

if (!function_exists('memory_get_peak_usage')) {
  /**
   * Returns the peak of memory allocated by PHP
   * (PHP 5 >= 5.2.0)
   * requires compiling with --enable-memory-limit before 5.2.1
   * 
   * @param bool $real_usage Real memory if true, emalloc() if false
   * 
   * @return int Number of bytes
   * @link http://php.net/memory_get_peak_usage
   */
  function memory_get_peak_usage($real_usage = false) {
    return memory_get_usage($real_usage);
  }
}

if (!function_exists('getrusage')) {
  /**
   * Gets the current resource usages
   * 
   * @param bool $who If who is 1, getrusage will be called with RUSAGE_CHILDREN
   * 
   * @return array Results
   * @link http://php.net/memory_get_peak_usage
   */
  function getrusage($who = 0) {
    return array(
      "ru_utime.tv_usec" => -1,
      "ru_utime.tv_sec"  => -1,
      "ru_stime.tv_usec" => -1,
      "ru_stime.tv_sec"  => -1,
    );
  }
}

if (!function_exists('timezone_identifiers_list')) {
  /**
   * Returns numerically index array with all timezone identifiers
   * (PHP 5 >= 5.1.0)
   * 
   * @param int    $what    One of DateTimeZone class constants
   * @param string $country A two-letter ISO 3166-1 compatible country code. 
   * 
   * @return array The identifiers
   */
  function timezone_identifiers_list($what = null, $country = null) {
    return include "timezones.php";
  }
}

if (!function_exists('mb_strtoupper')) {
  /**
   * Make a string uppercase
   * Multi-byte graceful fallback
   * 
   * @param string $string Input string
   * 
   * @return string the uppercased string
   * @link http://php.net/manual/en/function.strtoupper.php
   */
  function mb_strtoupper($string) {
    return strtoupper($string);
  }
}

if (!function_exists('mb_strtolower')) {
  /**
   * Make a string lowecase
   * Multi-byte graceful fallback
   * 
   * @param string $string Input string
   * 
   * @return string the lowercased string
   * @link http://php.net/manual/en/function.strtolower.php
   */
  function mb_strtolower($string) {
    return mb_strtolower($string);
  }
}

if (!function_exists('mb_convert_case')) {
  /**
   * Make a string with uppercased words
   * Multi-byte graceful fallback
   * 
   * @param string $string Input string
   * 
   * @return string The word uppercased string
   * @link http://php.net/manual/en/function.ucwords.php
   */
  function mb_ucwords($string) {
    return ucwords($string);
  }
}
else {
  /**
   * Make a string with uppercased words
   * Multi-byte graceful fallback
   * 
   * @param string $string Input string
   * 
   * @return string the word uppercased string
   * @link http://php.net/manual/en/function.ucwords.php
   */
  function mb_ucwords($string) {
    return mb_convert_case($string, MB_CASE_TITLE, CApp::$encoding);
  }
}

if (!defined('PHP_INT_MAX')) {
  define('PHP_INT_MAX', pow(2, 31)-1);
}

if (!function_exists('bcmod')) {
  /**
   * (PHP 4, PHP 5)
   * Get modulus of an arbitrary precision number
   * 
   * @param string $left_operand Any precision integer value
   * @param int    $modulus      Integer modulus
   * 
   * @return int Rest of modulus
   * @link http://php.net/bcmod
   */
  function bcmod($left_operand, $modulus) {
    // how many numbers to take at once? carefull not to exceed (int)
    $take = 5;    
    $mod = '';
    do {
      $a = (int) $mod.substr($left_operand, 0, $take);
      $left_operand = substr($left_operand, $take);
      $mod = $a % $modulus;   
    } while (strlen($left_operand));
    return (int) $mod;
  }
}

if (!function_exists("date_default_timezone_set")) {
  /**
   * (PHP 5 >= 5.1.0)
   * Sets the default timezone used by all date/time functions in a script 
   * Void fallback
   * 
   * @param object $timezone_identifier Timezone identifier
   * 
   * @return void
   */
  function date_default_timezone_set($timezone_identifier) {
    // void
  }
}

if (!function_exists("inet_pton")) {
  /**
   * (PHP 5 >= 5.1.0)
   * Converts a human readable IP address to its packed in_addr representation
   * 
   * @param string $address Readable IP address
   * 
   * @return string Packed IP address
   */
  function inet_pton($address) {
    // void
  }
}

if (!function_exists("inet_ntop")) {
  /**
   * (PHP 5 >= 5.1.0)
   * Converts a packed in_addr IP address to a human readable IP address
   * 
   * @param string $in_addr Packed IP address
   * 
   * @return string Readable IP address
   */
  function inet_ntop($in_addr) {
    return "";
  }
}
