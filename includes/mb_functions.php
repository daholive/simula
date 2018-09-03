<?php
/**
 * General purpose functions that haven't been namespaced (yet).
 *
 * @package    Mediboard
 * @subpackage includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html
 * @version    $Id: mb_functions.php 17248 2012-11-09 11:26:22Z phenxdesign $
 */

/**
 * Returns the CMbObject with given GET params keys, if it doesn't exist, a redirect is made
 *
 * @param string $class_key The class name of the object
 * @param string $id_key    The object ID
 * @param string $guid_key  The object GUID (classname-id)
 *
 * @return CMbObject The object loaded or nothing
 **/
function mbGetObjectFromGet($class_key, $id_key, $guid_key = null) {
	$object_class = CValue::get($class_key);
	$object_id    = CValue::get($id_key);
	$object_guid  = "$object_class-$object_id";

	if ($guid_key) {
		$object_guid = CValue::get($guid_key, $object_guid);
	}

	$object = CMbObject::loadFromGuid($object_guid);

	// Redirection
	if (!$object || !$object->_id) {
		global $ajax;
		CAppUI::redirect(
      "ajax=$ajax" . 
      "&suppressHeaders=1".
      "&m=system".
      "&a=object_not_found".
      "&object_guid=$object_guid"
		);
	}

	return $object;
}

/**
 * Returns the CMbObject with given GET or SESSION params keys,
 * if it doesn't exist, a redirect is made
 *
 * @param string $class_key The class name of the object
 * @param string $id_key    The object ID
 * @param string $guid_key  The object GUID (classname-id)
 *
 * @return CMbObject The object loaded or nothing
 **/
function mbGetObjectFromGetOrSession($class_key, $id_key, $guid_key = null) {
	$object_class = CValue::getOrSession($class_key);
	$object_id    = CValue::getOrSession($id_key);
	$object_guid  = "$object_class-$object_id";

	if ($guid_key) {
		$object_guid = CValue::getOrSession($guid_key, $object_guid);
	}

	$object = CMbObject::loadFromGuid($object_guid);

	// Redirection
	if (!$object || !$object->_id) {
		global $ajax;
		CAppUI::redirect(
      "ajax=$ajax".
      "&suppressHeaders=1".
      "&m=system".
      "&a=object_not_found".
      "&object_guid=$object_guid"
		);
	}

	return $object;
}

/**
 * String to bool swiss knife
 *
 * @param mixed $value Any value, preferably string
 *
 * @return bool
 */
function toBool($value) {
	if (!$value) {
		return false;
	}

	return $value === true || preg_match('/^on|1|true|yes$/i', $value);
}

/**
 * Calculate the bank holidays in France
 *
 * @param date $date The relative date, used to calculate the bank holidays of a specific year
 *
 * @return array List of bank holidays as dates
 **/
function mbBankHolidays($date = null) {
	if (!$date) {
		$date = mbDate();
	}

	$year = mbTransformTime("+0 DAY", $date, "%Y");

	// Calcul du Dimanche de Pâques : http://fr.wikipedia.org/wiki/Computus
	$n = $year - 1900;
	$a = $n % 19;
	$b = intval((7 * $a + 1) / 19);
	$c = ((11 * $a) - $b + 4) % 29;
	$d = intval($n / 4);
	$e = ($n - $c + $d + 31) % 7;
	$P = 25 - $c - $e;
	if ($P > 0) {
		$P = "+".$P;
	}
	$paques = mbDate("$P DAYS", "$year-03-31");

	$freeDays = array(
	//    "$year-01-01",               // Jour de l'an
	//    mbDate("+1 DAY", $paques),   // Lundi de paques
	//    "$year-05-01",               // Fête du travail
	//    "$year-05-08",               // Victoire de 1945
	//    mbDate("+39 DAYS", $paques), // Jeudi de l'ascension
	//    mbDate("+50 DAYS", $paques), // Lundi de pentecôte
	//    "$year-07-14",               // Fête nationnale
	//    "$year-08-15",               // Assomption
	//    "$year-09-13",               // Fête do Pedro Couto
	//    "$year-11-11",               // Armistice 1918
	//    "$year-12-25"                // Noël
	);

	return $freeDays;
}

/**
 * Calculate the number of work days in the given month date
 *
 * @param date $date The relative date of the months to get work days
 *
 * @return integer Number of work days
 **/
function mbWorkDaysInMonth($date = null) {
	$result = 0;
	if (!$date) {
		$date = mbDate();
	}

	$debut = $date;
	$rectif = mbTransformTime("+0 DAY", $debut, "%d")-1;
	$debut = mbDate("-$rectif DAYS", $debut);
	$fin   = $date;
	$rectif = mbTransformTime("+0 DAY", $fin, "%d")-1;
	$fin = mbDate("-$rectif DAYS", $fin);
	$fin = mbDate("+ 1 MONTH", $fin);
	$fin = mbDate("-1 DAY", $fin);
	$freeDays = mbBankHolidays($date);
	for ($i = $debut; $i <= $fin; $i = mbDate("+1 DAY", $i)) {
		$day = mbTransformTime("+0 DAY", $i, "%u");
		if ($day == 6 && !in_array($i, $freeDays)) {
			$result += 0.5;
		}
		elseif ($day != 7 and !in_array($i, $freeDays)) {
			$result += 1;
		}
	}
	return $result;
}

/**
 * Transforms absolute or relative time into a given format
 *
 * @param string $relative A relative time
 * @param string $ref      An absolute time to transform
 * @param string $format   The data in which the date will be returned
 *
 * @return string The transformed date
 **/
function mbTransformTime($relative, $ref, $format) {
	if ($relative === "last sunday") {
		$relative .= " 12:00:00";
	}

	$timestamp = $ref ? strtotime($ref) : time();
	if ($relative) {
		$timestamp = strtotime($relative, $timestamp);
	}
	return strftime($format, $timestamp);
}

/**
 * Transforms absolute or relative time into DB friendly DATETIME format
 *
 * @param string   $relative Modifies the time (eg '+1 DAY')
 * @param datetime $ref      The reference date time fo transforms
 *
 * @return string The transformed time
 **/
function mbDateTime($relative = null, $ref = null) {
	return mbTransformTime($relative, $ref, "%Y-%m-%d %H:%M:%S");
}

/**
 * Transforms absolute or relative time into XML DATETIME format
 *
 * @param string   $relative Modifies the time (eg '+1 DAY')
 * @param datetime $ref      The reference date time fo transforms
 *
 * @return string The transformed time
 **/
function mbXMLDateTime($relative = null, $ref = null) {
	return mbTransformTime($relative, $ref, CMbDate::$xmlDateTime);
}

/**
 * Converts an xs;duration XML duration into a DB friendly DATETIME
 *
 * @param string $duration Duration with format P1Y2M3DT10H30M0S
 *
 * @return string The DATETIME, null if failed
 **/
function mbDateTimeFromXMLDuration($duration) {
	$regexp = "/P((\d+)Y)?((\d+)M)?((\d+)D)?T((\d+)H)?((\d+)M)?((\d+)S)?/";
	if (!preg_match($regexp, $duration, $matches)) {
		return null;
	}

	return sprintf(
    "%d-%d-%d %d:%d:%d", 
	$matches[ 2], $matches[ 4], $matches[ 6],
	$matches[ 8], $matches[10], $matches[12]
	);
}


/**
 * Transforms absolute or relative time into DB friendly DATE format
 *
 * @param String $relative The relative time vs the $ref (ex: "-1 MONTH")
 * @param Date   $ref      The reference date
 *
 * @return Date The transformed time
 **/
function mbDate($relative = null, $ref = null) {
	return mbTransformTime($relative, $ref, "%Y-%m-%d");
}

/**
 * Transforms absolute or relative time into DB friendly TIME format
 *
 * @param string   $relative The relative time vs the $ref (ex: "-1 MONTH")
 * @param datetime $ref      The reference date
 *
 * @return time The transformed time
 **/
function mbTime($relative = null, $ref = null) {
	return mbTransformTime($relative, $ref, "%H:%M:%S");
}

/**
 * Counts the number of intervals between reference and relative
 *
 * @param time $from     From time
 * @param time $to       To time
 * @param time $interval Interval time
 *
 * @return int Number of intervals
 **/
function mbTimeCountIntervals($from, $to, $interval) {
	$zero     = strtotime("0:00:00");
	$from     = strtotime($from    ) - $zero;
	$to       = strtotime($to      ) - $zero;
	$interval = strtotime($interval) - $zero;
	return intval(($to - $from) / $interval);
}

/**
 * Retrieve nearest time (Dirac-like) with intervals
 *
 * @param time $reference     Reference time
 * @param time $mins_interval Minutes count
 *
 * @return time Nearest time
 **/
function mbTimeGetNearestMinsWithInterval($reference, $mins_interval) {
	$min_reference = mbTransformTime(null, $reference, "%M");
	$div = intval($min_reference / $mins_interval);
	$borne_inf = $mins_interval * $div;
	$borne_sup = $mins_interval * ($div + 1);
	$mins_replace = ($min_reference - $borne_inf) < ($borne_sup - $min_reference) ?
	$borne_inf :
	$borne_sup;

	$reference = ($mins_replace == 60) ?
	sprintf('%02d:00:00',   mbTransformTime(null, $reference, "%H")+1) :
	sprintf('%02d:%02d:00', mbTransformTime(null, $reference, "%H"), $mins_replace);

	return $reference;
}

/**
 * Add a relative time to a reference time
 *
 * @param time $relative The relative time to add
 * @param time $ref      The reference time
 *
 * @return string: the resulting time
 **/
function mbAddTime($relative, $ref = null) {
	$fragments = explode(":", $relative);
	$hours   = isset($fragments[0]) ? $fragments[0] : '00';
	$minutes = isset($fragments[1]) ? $fragments[1] : '00';
	$seconds = isset($fragments[2]) ? $fragments[2] : '00';
	return mbTime("+$hours hours $minutes minutes $seconds seconds", $ref);
}

/**
 * Substract a relative time to a reference time
 *
 * @param time $relative The relative time to substract
 * @param time $ref      The reference time
 *
 * @return string: the resulting time
 **/
function mbSubTime($relative, $ref = null) {
	$fragments = explode(":", $relative);
	$hours   = isset($fragments[0]) ? $fragments[0] : '00';
	$minutes = isset($fragments[1]) ? $fragments[1] : '00';
	$seconds = isset($fragments[2]) ? $fragments[2] : '00';
	return mbTime("-$hours hours -$minutes minutes -$seconds seconds", $ref);
}

/**
 * Generates a random string
 * @param length   string size, default value 5
 * @return string: random string
 */
function generateRandomString($length = 5){
	if ($length == null)
	$length = 5;
	$i = 0;
	$key = "";
	while($i < $length){
		$generated = 0;
		$upper = rand(1,100000) % 2 == 0 ? false : true;
		if ($upper)
		$generated = rand(65,90);
		else
		$generated = rand(97,122);

		$key = $key . chr($generated);
		$i++;
	}
	return $key;
}
/**
 * Add a relative time to a reference datetime
 *
 * @param time     $relative The relative time to add
 * @param datetime $ref      The reference datetime
 *
 * @return string: the resulting time
 **/
function mbAddDateTime($relative, $ref = null) {
	$fragments = explode(":", $relative);
	$hours   = isset($fragments[0]) ? $fragments[0] : '00';
	$minutes = isset($fragments[1]) ? $fragments[1] : '00';
	$seconds = isset($fragments[2]) ? $fragments[2] : '00';
	return mbDateTime("+$hours hours $minutes minutes $seconds seconds", $ref);
}

/**
 * Count days between two datetimes
 *
 * @param datetime $from From datetime
 * @param datetime $to   To datetime
 *
 * @return int Days count
 **/
function mbDaysRelative($from, $to) {
	if (!$from || !$to) {
		return null;
	}

	$from = intval(strtotime($from) / 86400);
	$to   = intval(strtotime($to  ) / 86400);
	return intval($to - $from);
}

/**
 * Count hours between two datetimes
 *
 * @param datetime $from From datetime
 * @param datetime $to   To datetime
 *
 * @return int Days count
 **/
function mbHoursRelative($from, $to) {
	if (!$from || !$to) {
		return null;
	}

	$from = intval(strtotime($from) / 3600);
	$to   = intval(strtotime($to  ) / 3600);
	return intval($to - $from);
}

/**
 * Count minutes between two datetimes
 *
 * @param datetime $from From datetime
 * @param datetime $to   To datetime
 *
 * @return int Days count
 **/
function mbMinutesRelative($from, $to) {
	if (!$from || !$to) {
		return null;
	}
	$from = intval(strtotime($from) / 60);
	$to   = intval(strtotime($to  ) / 60);
	return intval($to - $from);
}

/**
 * Compute time duration between two datetimes
 *
 * @param datetime $from   From date
 * @param datetime $to     To date
 * @param string   $format Format for time (sprintf syntax)
 *
 * @return string hh:mm:ss diff duration
 **/
function mbTimeRelative($from, $to, $format = "%02d:%02d:%02d") {
	$diff = strtotime($to) - strtotime($from);
	$hours = intval($diff / 3600);
	$mins = intval(($diff % 3600) / 60);
	$secs = intval($diff % 60);
	return sprintf($format, $hours, $mins, $secs);
}

/**
 * Tell whether date is lunar
 *
 * @param date $date Date to check
 *
 * @return boolean
 **/
function isLunarDate($date) {
	$fragments = explode("-", $date);

	return ($fragments[2] > 31) || ($fragments[1] > 12);
}

/**
 * Date utility class
 */
class CMbDate {
	static $secs_per = array (
    "year"   => 31536000, // 60 * 60 * 24 * 365
    "month"  =>  2592000, // 60 * 60 * 24 * 30
    "week"   =>   604800, // 60 * 60 * 24 * 7
    "day"    =>    86400, // 60 * 60 * 24
    "hour"   =>     3600, // 60 * 60
    "minute" =>       60, // 60 
    "second" =>        1, // 1 
	);

	static $xmlDate     = "%Y-%m-%d";
	static $xmlTime     = "%H:%M:%S";
	static $xmlDateTime = "%Y-%m-%dT%H:%M:%S";
	 
	/**
	 * Compute real relative achieved gregorian durations in years and months
	 *
	 * @param date $from Starting time
	 * @param date $to   Ending time, now if null
	 *
	 * @return array[int] Number of years and months
	 */
	static function achievedDurations($from, $to = null) {
		$achieved = array(
      "year"  => "??",
      "month" => "??",
		);

		if ($from == "0000-00-00" || !$from) {
			return $achieved;
		}

		if (!$to) {
			$to = mbDate();
		}

		list($yf, $mf, $df) = explode("-", $from);
		list($yt, $mt, $dt) = explode("-", $to);

		$achieved["month"] = 12*($yt-$yf) + ($mt-$mf);
		if ($mt == $mf && $dt < $df) {
			$achieved["month"]--;
		}

		$achieved["year"] = intval($achieved["month"] / 12);
		return $achieved;
	}

	/**
	 * Compute user friendly approximative duration between two date time
	 *
	 * @param datetime $from      From time
	 * @param datetime $to        To time, now if null
	 * @param int      $min_count The minimum count to reach the upper unit, 2 if undefined
	 *
	 * @return array("unit" => string, "count" => int)
	 */
	static function relative($from, $to = null, $min_count = 2) {
		if (!$from) {
			return null;
		}

		if (!$to) {
			$to = mbDateTime();
		}

		// Compute diff in seconds
		$diff = strtotime($to) - strtotime($from);

		// Find the best unit
		foreach (self::$secs_per as $unit => $secs) {
			if (abs($diff / $secs) > $min_count) {
				break;
			}
		}

		return array (
      "unit" => $unit, 
      "count" => intval($diff / $secs)
		);
	}

	/**
	 * Get the month number for a given datetime
	 *
	 * @param datetime $date Datetime
	 *
	 * @return int The month number
	 * @FIXME Useful ??
	 */
	static function monthNumber($date) {
		return intval(mbTransformTime(null, $date, "%m"));
	}

	/**
	 * Get the week number in the month
	 *
	 * @param datetime $date Date
	 *
	 * @return int The week number
	 */
	static function weekNumberInMonth($date) {
		$month = self::monthNumber($date);
		$week_number = 0;

		do {
			$date = mbDate("-1 WEEK", $date);
			$_month = self::monthNumber($date);
			$week_number++;
		} while ($_month == $month);

		return $week_number;
	}

	/**
	 * Give a Dirac hash of given datetime
	 *
	 * @param string   $period   One of minute, hour, day, week, month or year
	 * @param datetime $datetime Datetime
	 *
	 * @return datetime Hash
	 */
	static function dirac($period, $datetime) {
		switch ($period) {
			case "min":
				return mbTransformTime(null, $datetime, "%Y-%m-%d %H:%M:00");
			case "hour":
				return mbTransformTime(null, $datetime, "%Y-%m-%d %H:00:00");
			case "day":
				return mbTransformTime(null, $datetime, "%Y-%m-%d 00:00:00");
			case "week":
				return mbTransformTime("last sunday +1 day", $datetime, "%Y-%m-%d 00:00:00");
			case "month":
				return mbTransformTime(null, $datetime, "%Y-%m-01 00:00:00");
			case "year":
				return mbTransformTime(null, $datetime, "%Y-01-01 00:00:00");
			default:
				trigger_error("Can't make a Dirac hash for unknown '$period' period", E_USER_WARNING);
		}
	}

	/**
	 * Give a position to a datetime relative to a reference
	 *
	 * @param dateTime $datetime  Datetime
	 * @param dateTime $reference Reference
	 * @param string   $period    One of 1hour, 6hours, 1day
	 *
	 * @return float
	 */
	static function position($datetime, $reference, $period) {
		$diff = strtotime($datetime) - strtotime($reference);
		switch ($period) {
			case "1hour":
				return $diff / CMbDate::$secs_per["hour"];
			case "6hours":
				return $diff / (CMbDate::$secs_per["hour"] * 6);
			case "1day":
				return $diff / CMbDate::$secs_per["day"];
			default:
				trigger_error("Can't proceed for unknown '$period' period", E_USER_WARNING);
		}
	}

	/**
	 * Turn a datetime to its UTC timestamp equivalent
	 *
	 * @param dateTime $datetime Datetime
	 *
	 * @return int
	 */
	static function toUTCTimestamp($datetime) {
		static $default_timezone;
		if (!$default_timezone) {
			$default_timezone = date_default_timezone_get();
		}

		// Temporary change timezone to UTC
		date_default_timezone_set("UTC");
		$datetime = strtotime($datetime) * 1000; // in ms;
		date_default_timezone_set($default_timezone);

		return $datetime;
	}
}

/**
 * URL to the mediboard.org documentation page
 *
 * @param string $module Module name
 * @param string $action Action name
 *
 * @return string The URL to the requested page
 */
function mbPortalURL($module, $action = null) {
	if ($module == "tracker") {
		return CAppUI::conf("issue_tracker_url");
	}

	$url = CAppUI::conf("help_page_url");
	if (!$url || strpos($url, "%m") === false || strpos($url, "%a") === false) {
		return;
	}

	$pairs = array(
    "%m" => $module,
    "%a" => $action,
	);

	return strtr($url, $pairs);
}

/**
 * Check whether a string is NOT empty, to be used as a filter callback
 *
 * @param string $string String to check
 *
 * @return bool
 * @deprecated cf. CMbArray
 */
function stringNotEmpty($string){
	return $string !== "";
}

/**
 * Get a string containing loaded Dojo components for storage purposes
 *
 * @return string
 */
function mbLoadScriptsStorage(){
	$scripts = "";
	$scripts .= CJSLoader::loadFile("lib/dojo/dojo.js");
	$scripts .= CJSLoader::loadFile("lib/dojo/src/io/__package__.js");
	$scripts .= CJSLoader::loadFile("lib/dojo/src/html/__package__.js");
	$scripts .= CJSLoader::loadFile("lib/dojo/src/lfx/__package__.js");
	$scripts .= CJSLoader::loadFile("includes/javascript/storage.js");
	return $scripts;
}

/**
 * Set memory limit alternative with a minimal value approach
 * Shoud *always* be used
 *
 * @param string $limit Memory limit with ini_set() syntax
 *
 * @return string The old value on success, false on failure
 * @todo Should me moved to CApp::memoryLimit()
 */
function set_min_memory_limit($limit) {
	$actual = CMbString::fromDecaBinary(ini_get('memory_limit'));
	$new    = CMbString::fromDecaBinary($limit);
	if ($new > $actual) {
		return ini_set('memory_limit', $limit);
	}

	return ini_get('memory_limit');
}

/**
 * Check whether a method is overridden in a given class
 *
 * @param mixed  $class  The class or object
 * @param string $method The method name
 *
 * @return bool
 */
function is_method_overridden($class, $method) {
	$reflection = new ReflectionMethod($class, $method);
	return $reflection->getDeclaringClass()->getName() == $class;
}

/**
 * Strip slashes recursively if value is an array
 *
 * @param mixed $value The value to be stripped
 *
 * @return mixed the stripped value
 **/
function stripslashes_deep($value) {
    if(isset($value)) {
        $value = is_array($value) ?
            array_map('stripslashes_deep', $value) :
            stripslashes($value);
    }
    return $value;
}

/**
 * Copy the hash array content into the object as properties
 * Only existing properties of are filled, when defined in hash
 *
 * @param array  $hash    The input hash
 * @param object &$object The object to feed
 *
 * @return void
 **/
function bindHashToObject($hash, &$object) {

	// @TODO use property_exists() which is a bit faster
	// BUT requires PHP >= 5.1

	$vars = get_object_vars($object);
	foreach ($hash as $k => $v) {
		if (array_key_exists($k, $vars)) {
			$object->$k = $hash[$k];
		}
	}
}

/**
 * Convert a date from ISO to locale format
 *
 * @param string $date Date in ISO format
 *
 * @return string Date in locale format
 */
function mbDateToLocale($date) {
	return preg_replace("/(\d{4})-(\d{2})-(\d{2})/", '$3/$2/$1', $date);
}

/**
 * Convert a date from locale to ISO format
 *
 * @param string $date Date in locale format
 *
 * @return string Date in ISO format
 */
function mbDateFromLocale($date) {
	return preg_replace("/(\d{2})\/(\d{2})\/(\d{2,4})/", '$3-$2-$1', $date);
}

/**
 * Convert a datetime from LDAP to ISO format
 *
 * @param string $dateLargeInt nano seconds (yes, nano seconds) since jan 1st 1601
 *
 * @return string DateTime in ISO format
 */
function mbDateTimeFromLDAP($dateLargeInt) {
	// seconds since jan 1st 1601
	$secsAfterADEpoch = $dateLargeInt / (10000000);
	// unix epoch - AD epoch * number of tropical days * seconds in a day
	$ADToUnixConvertor = ((1970-1601) * 365.242190) * 86400;
	// unix Timestamp version of AD timestamp
	$unixTsLastLogon = intval($secsAfterADEpoch-$ADToUnixConvertor);

	return date("d-m-Y H:i:s", $unixTsLastLogon);
}

/**
 * Convert a datetime from ActiveDirecetory to ISO format
 *
 * @param string $dateAD Datetime from AD since jan 1st 1601
 *
 * @return string DateTime in ISO format
 */
function mbDateTimeFromAD($dateAD) {
	return preg_replace("/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.0Z/", '$1-$2-$3 $4:$5:$6', $dateAD);
}

/**
 * Check if a number is a valid Luhn number
 * see http://en.wikipedia.org/wiki/Luhn
 *
 * @param string $code String representing a potential Luhn number
 *
 * @return bool
 */
function luhn ($code) {
	$code = preg_replace('/\D|\s/', '', $code);
	$code_length = strlen($code);
	$sum = 0;

	$parity = $code_length % 2;

	for ($i = $code_length - 1; $i >= 0; $i--) {
		$digit = $code{$i};

		if ($i % 2 == $parity) {
			$digit *= 2;

			if ($digit > 9) {
				$digit -= 9;
			}
		}

		$sum += $digit;
	}

	return (($sum % 10) == 0);
}

/**
 * Check wether a URL exists (200 HTTP Header)
 *
 * @param string $url    URL to check
 * @param string $method HTTP method (GET, POST, HEAD, PUT, ...)
 *
 * @return bool
 */
function url_exists($url, $method = null) {
	$old = ini_set('default_socket_timeout', 5);

	if ($method) {
		// By default get_headers uses a GET request to fetch the headers.
		// If you want to send a HEAD request instead,
		// you can change method with a stream context
		stream_context_set_default(
		array(
        'http' => array(
          'method' => $method
		)
		)
		);
	}

	$headers = @get_headers($url);
	ini_set('default_socket_timeout', $old);
	return (preg_match("|200|", $headers[0]));
}

/**
 * Forge an HTTP POST query
 *
 * @param string $url  Destination URL
 * @param mixed  $data Array or object containing properties
 *
 * @return bool
 */
function http_request_post($url, $data) {
	$data_url = http_build_query($data);
	$data_length = strlen($data_url);
	$options = array(
    "https" => array(
      "method" => "POST",
      "header"=> array(
        "Content-Type: application/x-www-form-urlencoded",
        "Content-Length: $data_length", 
        "User-Agent: ".$_SERVER["HTTP_USER_AGENT"]
	),
      "content" => $data_url
	)
	);

	$context = stream_context_create($options);
	$content = file_get_contents($url, false, $context);
	return $content;
}

/**
 * Check response time from a web server
 *
 * @param string $url  Server URL
 * @param string $port Server port
 *
 * @return int Response time in milliseconds
 */
function url_response_time($url, $port) {
	$parse_url = parse_url($url);
	if (isset($parse_url["port"])) {
		$port = $parse_url["port"];
	}

	$url = isset($parse_url["host"]) ? $parse_url["host"] : $url;

	$starttime     = microtime(true);
	$file          = @fsockopen($url, $port, $errno, $errstr, 5);
	$stoptime      = microtime(true);

	if (!$file) {
		$response_time = -1;  // Site is down
	}
	else {
		fclose($file);
		$response_time = ($stoptime - $starttime) * 1000;
		$response_time = floor($response_time);
	}

	return $response_time;
}

/**
 * Build a url string based on components in an array
 * (see PHP parse_url() documentation)
 *
 * @param array $components Components, as of parse_url
 *
 * @return string
 */
function make_url($components) {
	$url = $components["scheme"] . "://";

	if (isset($components["user"])) {
		$url .= $components["user"] . ":" . $components["pass"] . "@";
	}

	$url .=  $components["host"];

	if (isset($components["port"])) {
		$url .=  ":" . $components["port"];
	}

	$url .=  $components["path"];

	if (isset($components["query"])) {
		$url .=  "?" . $components["query"];
	}

	if (isset($components["fragment"])) {
		$url .=  "#" . $components["fragment"];
	}

	return $url;
}

/**
 * Check wether a IP address is in intranet-like form
 *
 * @param string $ip IP address to check
 *
 * @return bool
 */
function is_intranet_ip($ip) {
	// ipv6 en local
	if ($ip === '::1' || $ip === '0:0:0:0:0:0:0:1') {
		return true;
	}

	$ip = explode('.', $ip);

	return
	($ip[0] == 127) ||
	($ip[0] == 10) ||
	($ip[0] == 172 && $ip[1] >= 16 && $ip[1] < 32) ||
	($ip[0] == 192 && $ip[1] == 168);
}

/**
 * Retrieve a server value from multiple sources
 *
 * @param string $key Value key
 *
 * @return string
 */
function get_server_var($key) {
	if (isset($_SERVER[$key])) {
		return $_SERVER[$key];
	}

	if (isset($_ENV[$key])) {
		return $_ENV[$key];
	}

	if (getenv($key)) {
		return getenv($key);
	}

	if (function_exists('apache_getenv') && apache_getenv($key, true)) {
		return apache_getenv($key, true);
	}
}

/**
 * Get browser remote IPs using most of available methods
 *
 * @return array Array with proxy, client and remote keys as IP adresses
 */
function get_remote_address() {
	$address = array(
    "proxy" => null, 
    "client" => null, 
    "remote" => null,
	);

	$address["client"] = ($client = get_server_var("HTTP_CLIENT_IP")) ? $client : get_server_var("REMOTE_ADDR");
	$address["remote"] = $address["client"];

	$forwarded = array(
    "HTTP_X_FORWARDED_FOR",
    "HTTP_FORWARDED_FOR",
    "HTTP_X_FORWARDED",
    "HTTP_FORWARDED",
    "HTTP_FORWARDED_FOR_IP",
    "X_FORWARDED_FOR",
    "FORWARDED_FOR",
    "X_FORWARDED",
    "FORWARDED",
    "FORWARDED_FOR_IP",
	);

	$client = null;

	foreach ($forwarded as $name) {
		if ($client = get_server_var($name)) {
			break;
		}
	}

	if ($client) {
		$address["proxy"]  = $address["client"];
		$address["client"] = $client;
	}

	// To handle weird IPs sent by iPhones, in the form "10.10.10.10, 10.10.10.10"
	$proxy  = explode(",", $address["proxy"]);
	$client = explode(",", $address["client"]);
	$remote = explode(",", $address["remote"]);

	$address["proxy"]  = reset($proxy);
	$address["client"] = reset($client);
	$address["remote"] = reset($remote);

	return $address;
}

/**
 * CRC32 alternative handling 32bit platform limitations
 *
 * @param string $data The data
 *
 * @return int CRC32 checksum
 */
function mb_crc32($data) {
	$crc = crc32($data);

	// if 32bit platform
	if (PHP_INT_MAX <= pow(2, 31)-1 && $crc < 0) {
		$crc += pow(2, 32);
	}

	return $crc;
}

/**
 * Initialize custom error handler
 *
 * @return void
 */
function build_error_log() {
	if (!is_file(LOG_PATH)) {
		$initTime = date("Y-m-d às H:i:s");
		$logInit = "<h2>Log de erros inicíado em $initTime</h2>
      <script>
        function toggle_info(anchor) {
          var style = anchor.parentNode.getElementsByTagName('span')[0].style;
          style.display = style.display == 'none' ? '' : 'none';
          return false;
        }
       </script>
    ";
		file_put_contents(LOG_PATH, $logInit);
	}
}



/*Função que retorna um array com as horas configuradas no sistema*/
function getListPeriodConfigured()
{
	$arr = array();
	for ($i = 1; $i <= 2; $i++) {
		$period = CAppUI::conf("pharmacie periode_$i heure");

		if($period)
		$arr[] = $period.":00";
		else
		$arr[] = "23:59";
	}
	return $arr;
}

/**
 * Função para retornar a primeira hora de dispensação configurada, sendo que é a que está mais perto da hora actual do sistema
 * @return string|Hora mais perto da actual <string>
 */
function getFirstClosestTimeConfig($array_period_configured = null)
{
	if(!$array_period_configured)
	$array_period_configured = getListPeriodConfigured();
	if(sizeof($array_period_configured)<=0)
	return "23:59";
	if(sizeof($array_period_configured)==1)
	return $array_period_configured[0];


	$currentHour = date('H:i');

	/*se o currentHour for de um dia que nao existe preparaçao, mete-se 00:00*/
	$conf = array_flip(str_split(CAppUI::conf('pharmacie dispensation_schedule')));
	$currentDayOfWeek = date('N')-1;
	if($conf && sizeof($conf)>0)
	{
		if(!array_key_exists($currentDayOfWeek, $conf))
		$currentHour = "00:00";
	}


	foreach ($array_period_configured as $period) {
		if( strtotime($period)>=strtotime($currentHour) )//Se o periodo é maior
		{
			return $period;
		}
	}
	return $array_period_configured[0];
}

/*Método para retornar a hora configurada para preparação de encomendas de serviços*/
function getPharmacieHourPrepareServiceOrders($date = null)
{
	$wday = $date ? Date('N',strtotime($date)) : Date('N');
	$list_days_schedule = CAppUI::conf("pharmacie jours_semaine");
	//0 < $wday < 8
	for ($closedCount = 0, $idx = ($wday+1)%8; $idx != $wday; $idx = ($idx+1)%8) {
		//salta elemento dummy, idx=0
		if($idx == 0) continue;
		if($list_days_schedule[$idx]['active'] == '0') {
			$closedCount++;
		}
		else
			break;
	}

	return array(
		'active'=> $list_days_schedule[$wday]['active'] != '0',
		'heure' 	=> $list_days_schedule[$wday]['heure_service'].":00",
		'next_closed_days' => $closedCount
	);
}

/*Método para retornar a hora configurada para preparação de encomendas de serviços*/
function getPharmacieHourPrepareUnidose($date = null)
{
	$wday = $date ? Date('N',strtotime($date)) : Date('N');
	$list_days_schedule = CAppUI::conf("pharmacie jours_semaine");
	//0 < $wday < 8
	for ($closedCount = 1, $idx = ($wday+1)%8; $idx != $wday; $idx = ($idx+1)%8) {
		//salta elemento dummy, idx=0
		if($idx == 0) continue;
		if($list_days_schedule[$idx]['active'] == '0') {
			$closedCount++;
		}
		else
			break;
	}

	return array(
		'active'=> $list_days_schedule[$wday]['active'] != '0',
		'heure'	=> $list_days_schedule[$wday]['heure_unidose'].":00",
		'next_closed_days' => $closedCount
	);
}



/**
 * Método para retornar o proximo período até ao qual a preparaçao de medicamentos tem de ser realizada
 */
function getClosestDateConfig()
{

	$arrayConfig = array();
	$currentDayOfWeek = date('N')-1; //-1 porque em php segunda é 1 e no mediboard está 0
	$arrayConfig = fillDatesConfig($currentDayOfWeek);

	$periodo1 = getFirstClosestTimeConfig();
	$periodo2 = getSecondClosestTimeConfig();
	$currentHour = date('H:i');
	if($currentHour<$periodo1 && $periodo1<$periodo2){
		$p1 = getNextDate(mbDate(),$arrayConfig,1);
		return date('Y-m-d'.' '.$periodo2,$p1);
	}
	else
	{
		$count = 1;
		$p1 = null;
		$p2 = null;

		if($periodo1<$currentHour)//Se o primeiro periodo for inferior à hora actual, aumenta um no contador
		$count++;

		$p1 = getNextDate(mbDate(),$arrayConfig,$count);
		$count++;



		$p2 = getNextDate(mbDate(),$arrayConfig,$count);

		return date('Y-m-d'.' '.$periodo2,$p2);

	}


}



function fillDatesConfig($currentDayOfWeek)
{
	$conf = array_flip(str_split(CAppUI::conf('pharmacie dispensation_schedule'))); // Array configurado no mediboard
	/*
	* MEDIBOARD:
	0 => string 'lundi' (length=5) 	-- segunda
	1 => string 'mardi' (length=5) 		-- terça
	2 => string 'mercredi' (length=8) 	-- quarta
	3 => string 'jeudi' (length=5)  	-- quinta
	4 => string 'vendredi' (length=8)  	-- sexta
	5 => string 'samedi' (length=6) 	-- sabado
	6 => string 'dimanche' (length=8) 	-- domingo

	* PHP:
	* 1 - Segunda
	* 2 - Terça
	* 3 - Quarta
	* 4 - Quinta
	* 5 - Sexta
	* 6 - Sabado
	* 7 - Domingo
	*
	*/
	/****************Preenchimento com as configurações***********/
	for ($i = 0; $i <= 6; $i++) {
		$t = $i+$currentDayOfWeek+1;
		if($t>6)
		$t=$t-7;
		if(isset($conf[$i]))
		{
			$arrayConfig[$t] = true;
			$arrayConfig[$t+7] = true;
			$true = true;
		}
		else
		{
			$arrayConfig[$t] = false;
			$arrayConfig[$t+7] = false;
		}
	}
	/*************************************************************/
	return $arrayConfig;
}




function getNextDate($date, $arr_dates_config,$count = 1)
{
	$founded = 0;
	for ($i = 0; $i <= sizeof($arr_dates_config)-1; $i++)
	{
		if($arr_dates_config[$i] == true){
			$founded++;
			if($founded==$count)
			{
				$x = strtotime("+$i day", strtotime($date));
				if($x>strtotime(mbDate()))
				{
						
					return strtotime("+$i day", strtotime($date));
				}
			}
		}

	}
	return strtotime("+1 day", strtotime($date));
}




/**
 * Função para retornar a SEGUNDA hora de dispensação configurada, sendo que é a segunda que está mais perto da hora actual do sistema
 * @return string|Segunda hora mais perto da actual <string>|unknown
 */
function getSecondClosestTimeConfig()
{
	$array_period_configured = getListPeriodConfigured();

	if(sizeof($array_period_configured)<=0)
	return "23:59";
	if(sizeof($array_period_configured)==1)
	return $array_period_configured[0];
	$firstClosestDate = getFirstClosestTimeConfig();
	if(($key = array_search($firstClosestDate, $array_period_configured)) !== false) {
		unset($array_period_configured[$key]);
		$array_period_configured = array_values($array_period_configured);
	}
	return getFirstClosestTimeConfig($array_period_configured);

}


/**
 * function which calculates date diff between two given dates and returns it according to given formats ()
 * @param string $date1
 * @param string $ref
 * @param string $format
 * @param string $format_d
 * @param string $format_m
 * @param string $format_y
 * @return date <string, string:, time>
 * @author Marco Lopes
 * @version Marco Silva
 */
function mbDiffDatesFormat($date1 , $ref =null, $format = null, $format_d = null, $format_m = null, $format_y = null) {
	if(!$ref) $ref = mbDateTime();
	if(!$format)   $format   = '%H'.CAppUI::tr('crpu_diff_heures').CAppUI::tr('crpu_diff_et').'%i'.CAppUI::tr('crpu_diff_min');
	if(!$format_d) $format_d = '%d'.CAppUI::tr('crpu_diff_days')  .' '.$format;
	if(!$format_m) $format_m = '%m'.CAppUI::tr('crpu_diff_months').' '.$format_d;
	if(!$format_y) $format_y = '%Y'.CAppUI::tr('crpu_diff_years') .' '.$format_m;

	$end   = new DateTime($date1);
	$start = new DateTime($ref);
	$date  = date_diff($end, $start);

	if($date->y) {
		$date = $date->format($format_y);
	} else if($date->m) {
		$date = $date->format($format_m);
	} else if($date->d) {
		$date = $date->format($format_d);
	} else {
		$date = $date->format($format);
	}

	return $date;
}

/**
 * Get the value of a property from object
 * @param unknown $object
 * @param string $field
 * @return property value
 */
function mb_get_property_value($object, $field) {
	if(property_exists($object, $field))
	return $object->$field;
	else
	return null;
}

//retorna o próximo
function getLaboNextWorkDay($date = null) {
	$wday = $date ? Date('N',strtotime($date)) : Date('N'); 
	$list_days_schedule = CAppUI::conf("dPlabo jours_semaine");
	
	$closedCount = 1;
	for ($idx = $wday+1; $idx != $wday; $idx = ($idx+1)%8) {
		//salta elemento dummy, idx=0
		if($idx == 0) continue;
		if($list_days_schedule[$idx]['active'] == '0') {
			$closedCount++;
		}
		else
			break;
	}
	return mbDate("+$closedCount DAYS", $date);
}

/**
 * Convert special characters to HTML entities.<p>
 * Uses as default encoding UTF-8 
 * @param String $string <p>
 * The string being converted.
 * @param int[optional] $flag <p>
 * A bitmask of one or more of the following flags, which specify how to handle quotes,
 * invalid code unit sequences and the used document type. The default is ENT_COMPAT
 * @return string The converted string.
 */
function mbHtmlSpecialChars($string,$flags = ENT_COMPAT) {
	if (defined('PHP_VERSION_ID') && PHP_VERSION_ID > 50400) {
		return htmlspecialchars($string,$flags,'UTF-8');
	} else {
		return htmlspecialchars($string,$flags);
	}
}

function startsWith($haystack, $needle)
{
    return $needle === "" || strpos($haystack, $needle) === 0;
}
function endsWith($haystack, $needle)
{
    return $needle === "" || substr($haystack, -strlen($needle)) === $needle;
}