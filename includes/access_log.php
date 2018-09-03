<?php 
/**
 * Access logging 
 *
 * PHP version 5.1.x+
 *  
 * @category   Dispatcher
 * @package    Mediboard
 * @subpackage Includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 * @version    SVN: $Id: access_log.php 16957 2012-10-14 17:23:53Z phenxdesign $ 
 * @link       http://www.mediboard.org
 */

if (CAppUI::conf("readonly")) {
  return;
}

global $m, $action;

// Check prerequisites
$ds = CSQLDataSource::get("std");

// $action may not defined when the module is inactive
if (!$action) { 
  return;
}

// Key initialisation
$log = new CAccessLog();
$log->module   = $m;
$log->action   = $action;
$log->period   = mbTransformTime(null, null, "%Y-%m-%d %H:00:00");;

// Probe aquisition
$rusage = getrusage();
$log->hits++;
$log->duration    += CApp::$chrono->total;
$log->processus   += floatval($rusage["ru_utime.tv_usec"]) / 1000000 + $rusage["ru_utime.tv_sec"];
$log->processor   += floatval($rusage["ru_stime.tv_usec"]) / 1000000 + $rusage["ru_stime.tv_sec"];
$log->request     += $ds->chrono->total;
$log->size        += ob_get_length();
$log->peak_memory += memory_get_peak_usage();
$log->errors      += CApp::$performance["error"];
$log->warnings    += CApp::$performance["warning"];
$log->notices     += CApp::$performance["notice"];

// Fast store
if ($msg = $log->fastStore()) {
  trigger_error($msg, E_USER_WARNING);
}
else {
  foreach (CSQLDataSource::$dataSources as $aDataSource) {
    if ($aDataSource) {
      $dsl = new CDataSourceLog();
      $dsl->datasource = $aDataSource->dsn;
      $dsl->requests   = $aDataSource->chrono->nbSteps;
      $dsl->duration   = round(floatval($aDataSource->chrono->total), 3);
      
      // In order to retrieve inserted AccessLog ID
      $log2 = new CAccessLog();
      $log2->module   = $log->module;
      $log2->action   = $log->action;
      $log2->period   = $log->period;
      $log2->loadMatchingObject();
      
      $dsl->accesslog_id = $log2->_id;
      
      if ($msg = $dsl->fastStore()) {
        trigger_error($msg, E_USER_WARNING);
      }
    }
  }
}
