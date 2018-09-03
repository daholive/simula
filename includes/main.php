<?php
/**
 * Main URL dispatcher in non mobile case
 * 
 * @package    Mediboard
 * @subpackage includes
 * @author     SARL OpenXtrem <dev@openxtrem.com>
 * @license    GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 * @version    $Id: main.php 17296 2012-11-13 17:25:24Z phenxdesign $
 */

$debug = CAppUI::pref("INFOSYSTEM");

// HTTP Redirections
if (CAppUI::conf("http_redirections")) {
  if (!CAppUI::$instance->user_id || CValue::get("login")) {
    $redirection = new CHttpRedirection();
    $redirections = $redirection->loadList(null, "priority DESC");
    $passThrough = false;
    foreach ($redirections as $_redirect) {
      if (!$passThrough) {
        $passThrough = $_redirect->applyRedirection();
      }
    }
  }  
}

// Get the user's style
$uistyle = CAppUI::pref("UISTYLE");
if (!file_exists("style/$uistyle/templates/header.tpl")) {
  $uistyle = "mediboard";
}

CJSLoader::$files = array(
  CJSLoader::getLocaleFile(),
  "includes/javascript/printf.js",
  "includes/javascript/stacktrace.js",
  //"lib/dshistory/dshistory.js",
  
  "lib/scriptaculous/lib/prototype.js",
  "lib/scriptaculous/src/scriptaculous.js",
 
  "includes/javascript/console.js",

  // We force the download of the dependencies 
  "lib/scriptaculous/src/builder.js",
  "lib/scriptaculous/src/effects.js",
  "lib/scriptaculous/src/dragdrop.js",
  "lib/scriptaculous/src/controls.js",
  "lib/scriptaculous/src/slider.js",
  "lib/scriptaculous/src/sound.js",

  "includes/javascript/prototypex.js",

  // Datepicker
  "lib/datepicker/datepicker.js",
  "includes/javascript/date.js",
  "lib/datepicker/datepicker-locale-fr_FR.js",
		
   // ** @Alteração: Colocar o calendario em portugues  - @Nome: diogo.a.santos - @Data: 27-11-2012
  "lib/datepicker/datepicker-locale-pt_PT.js",

  // Livepipe UI
  "lib/livepipe/livepipe.js",
  "lib/livepipe/tabs.js",
  "lib/livepipe/window.js",
  
  // Growler
  //"lib/growler/build/Growler-compressed.js",
  
  // TreeView
  "includes/javascript/treeview.js",

  // Flotr
  "lib/flotr/flotr.js",
  "lib/flotr/lib/excanvas.js",
  "lib/flotr/lib/base64.js",
  "lib/flotr/lib/canvas2image.js",
  "lib/flotr/lib/canvastext.js",
  
  // JS Expression eval
  "lib/jsExpressionEval/parser.js",

  "includes/javascript/common.js",
  "includes/javascript/functions.js",
  "includes/javascript/tooltip.js",
  "includes/javascript/controls.js",
  "includes/javascript/cookies.js",
  "includes/javascript/url.js",
  "includes/javascript/forms.js",
  "includes/javascript/checkForms.js",
  "includes/javascript/aideSaisie.js",
  "includes/javascript/exObject.js",
  "includes/javascript/tag.js",
  "includes/javascript/mbObject.js",
  "includes/javascript/browserDetect.js",
  "includes/javascript/configuration.js",
  "includes/javascript/plugin.js",
  "includes/javascript/symfony.js",

  "includes/javascript/usermessage.js",
);

if(CAppUI::conf('dPfiles scan active'))
	CJSLoader::$files[] = 'lib/DWT/dynamsoft.webtwain.initiate.js';

$support = "modules/support/javascript/support.js";
if (file_exists($support) && CModule::getActive("support")) {
  CJSLoader::$files[] = $support;
}

// check if we are logged in
if (!CAppUI::$instance->user_id) {	
  $redirect = CValue::get("logout") ?  "" : CValue::read($_SERVER, "QUERY_STRING"); 
  $_SESSION["locked"] = null;

  // HTTP 403 Forbidden header when RAW response expected
  if ($suppressHeaders && !$ajax) {
    header("HTTP/1.0 403 Forbidden");
    CApp::rip();
  }

  // Ajax login alert
  if ($ajax) {
    $tplAjax = new CSmartyDP("modules/system");
    $tplAjax->assign("performance", CApp::$performance);
    $tplAjax->display("ajax_errors.tpl");
  }
  else {
    $tplLogin = new CSmartyDP("style/$uistyle");
    $tplLogin->assign("localeInfo"           , $locale_info);
    
    // Favicon
    $tplLogin->assign("mediboardShortIcon"   , CFaviconLoader::loadFile("style/$uistyle/images/icons/favicon.ico?123"));
    
    // CSS
    $mediboardStyle = CCSSLoader::loadFiles();
    if ($uistyle != "mediboard") {
      $mediboardStyle .= CCSSLoader::loadFiles($uistyle);
    }
    $mediboardStyle .= CCSSLoader::loadFiles("modules");
    $tplLogin->assign("mediboardStyle"       , $mediboardStyle);
    
    // JS
    $tplLogin->assign("mediboardScript"      , CJSLoader::loadFiles(!$debug));
    
    $tplLogin->assign("errorMessage"         , CAppUI::getMsg());
    $tplLogin->assign("time"                 , time());
    $tplLogin->assign("redirect"             , $redirect);
    $tplLogin->assign("uistyle"              , $uistyle);
    $tplLogin->assign("browser"              , $browser);
    $tplLogin->assign("nodebug"              , true);
    $tplLogin->assign("offline"              , false);
    $tplLogin->assign("allInOne"             , CValue::get("_aio"));
    $tplLogin->display("login.tpl");
  }
  
  // Destroy the current session and output login page
  CSessionHandler::end(true);
  CApp::rip();
}

$tab = 1;
// Set the module and action from the url
if (null == $m = CAppUI::checkFileName(CValue::get("m", 0))) {
  $m = CPermModule::getFirstVisibleModule();
  $parts = explode("-", CAppUI::pref("DEFMODULE"), 2);
  
  $pref_module = $parts[0];
  if ($pref_module && CPermModule::getViewModule(CModule::getInstalled($pref_module)->mod_id, PERM_READ)) {
    $m = $pref_module;
  }
  
  if (count($parts) == 2) {
    $tab = $parts[1];
    CValue::setSession("tab", $tab);
  }
}

// Still no target module
if (null == $m) {
  CAppUI::redirect("m=system&a=access_denied");
}

if (null == $module = CModule::getInstalled($m)) {
  // dP remover super hack
  if (null == $module = CModule::getInstalled("dP$m")) {
    CAppUI::redirect("m=system&a=module_missing&mod=$m");
  }
  $m = "dP$m";
}
if (!$ajax && !$dialog){
	CValue::setSessionAbs('_current_m', $m);
}
// Get current module permissions
// these can be further modified by the included action files
$can = $module->canDo();

$a      = CAppUI::checkFileName(CValue::get("a"      , $index));
$u      = CAppUI::checkFileName(CValue::get("u"      , ""));
$dosql  = CAppUI::checkFileName(CValue::post("dosql" , ""));
$m_post = CAppUI::checkFileName(CValue::post("m"     , $m));
$class  = CAppUI::checkFileName(CValue::post("@class", ""));

$tab = $a == "index" ? 
  CValue::getOrSession("tab", $tab) : 
  CValue::get("tab");

// Check whether the password is strong enough
if (
    CAppUI::$instance->weak_password && 
    !CAppUI::$instance->user_remote && 
    !($m      == "admin" && $tab == "chpwd") &&
    !($m_post == "admin" && $dosql == "do_chpwd_aed")
) {
  CAppUI::redirect("m=admin&tab=chpwd&forceChange=1");
}

// set the group in use, put the user group if not allowed
$g = CValue::getOrSessionAbs("g", CAppUI::$instance->user_group);
$indexGroup = new CGroups;
if ($indexGroup->load($g) && !$indexGroup->canRead()) {
  $g = CAppUI::$instance->user_group;
  CValue::setSessionAbs("g", $g);
}

// do some db work if dosql is set
if ($dosql) {
  // dP remover super hack
  if (!CModule::getInstalled($m_post)) {
    if (!CModule::getInstalled("dP$m_post")) {
      CAppUI::redirect("m=system&a=module_missing&mod=$m_post");
    }
    $m_post = "dP$m_post";
  }  
  
  // controller in controllers/ directory
  if (is_file("./modules/$m_post/controllers/$dosql.php")) {
    include "./modules/$m_post/controllers/$dosql.php";
  } 
}

if ($class) {
  $do = new CDoObjectAddEdit($class);
  $do->doIt();
}

// Checks if the current module is obsolete
$obsolete_module = false;
$user = CAppUI::$user;

// We check only when not in the "system" module, and not in an "action" (ajax, etc)
// And when user is undefined or admin
if ($m && $m != "system" && (!$a || $a == "index") && (!$user || !$user->_id || $user->isAdmin())) {
  $setupclass = "CSetup$m";
  $setup = new $setupclass;
  $module->compareToSetup($setup);
  $obsolete_module = $module->_upgradable;
}

// Feed module with tabs
require "./modules/{$module->mod_name}/index.php";
if ($tab !== null) {
  $module->addConfigureTab();
}

//Pedro Santos - Test
if($m == $module->mod_name && $module->mod_route != null)
header('Location: '. $dPconfig['system']['symfony_url'] . '/route/' .$module->mod_route);

if (!$a || $a === "index") {
  $tab = $module->getValidTab($tab);
}

if (!$suppressHeaders) {
  // Liste des Etablissements
  $etablissements = CMediusers::loadEtablissements(PERM_EDIT);

  // Messages
  $messages = new CMessage();
  $messages = $messages->loadPublications("present", $m, $g);
  
  // Mails
  $mail = new CUserMessage();
  $mails = $mail->loadVisibleList();
  
  // Load the SVN latest update info
  $svnStatus = null;
  if (CAppUI::pref("showLastUpdate") && is_readable("./tmp/svnstatus.txt")) {
    $svnInfo = file("./tmp/svnstatus.txt");
    $svnStatus = array( 
      "revision" => explode(": ", $svnInfo[0]),
      "date"     => explode(": ", $svnInfo[1]),
    );

    $svnStatus["revision"] = $svnStatus["revision"][1];
    $svnStatus["date"]     = $svnStatus["date"][1];
    $svnStatus["relative"] = CMbDate::relative($svnStatus["date"]);
  }
  
  // Creation du Template
  $tplHeader = new CSmartyDP("style/$uistyle");
  
  $tplHeader->assign("offline"              , false);
  $tplHeader->assign("nodebug"              , true);
  $tplHeader->assign("obsolete_module"      , $obsolete_module);
  $tplHeader->assign("configOffline"        , null);
  $tplHeader->assign("localeInfo"           , $locale_info);
  
  // Favicon
  $tplHeader->assign("mediboardShortIcon"   , CFaviconLoader::loadFile("style/$uistyle/images/icons/favicon.ico?123"));
  
  // CSS
  $mediboardStyle = CCSSLoader::loadFiles();
  if ($uistyle != "mediboard") {
    $mediboardStyle .= CCSSLoader::loadFiles($uistyle);
  }
  $mediboardStyle .= CCSSLoader::loadFiles("modules");
  $tplHeader->assign("mediboardStyle"       , $mediboardStyle);
  
  //JS
  $tplHeader->assign("mediboardScript"      , CJSLoader::loadFiles(!$debug));
  
  $tplHeader->assign("dialog"               , $dialog);
  $tplHeader->assign("messages"             , $messages);
  $tplHeader->assign("mails"                , $mails);
  $tplHeader->assign("uistyle"              , $uistyle);
  $tplHeader->assign("browser"              , $browser);
  $tplHeader->assign("timetolive"         	, ini_get('session.gc_maxlifetime')/60);
  $tplHeader->assign("errorMessage"         , CAppUI::getMsg());
  $tplHeader->assign("Etablissements"       , $etablissements);
  $tplHeader->assign("svnStatus"            , $svnStatus);
  $tplHeader->assign("allInOne"             , CValue::get("_aio"));
  $tplHeader->assign(
    "portal", 
    array (
      "help"    => mbPortalURL($m, $tab),
      "tracker" => mbPortalURL("tracker"),
    )
  );
  
  $tplHeader->display("header.tpl");
}

// tabBox et inclusion du fichier demandé
if ($tab !== null) {
  $module->showTabs();
}
else {
  $module->showAction();
}

CApp::$chrono->stop();
CApp::preparePerformance();

// Unlocalized strings
if (!$suppressHeaders || $ajax) {
  CAppUI::$unlocalized = array_map("utf8_encode", CAppUI::$unlocalized);
  $unloc = new CSmartyDP("modules/system");
  $unloc->display("inc_unlocalized_strings.tpl");
}

// Inclusion du footer
if (!$suppressHeaders) {
  //$address = get_remote_address();
  
  $tplFooter = new CSmartyDP("style/$uistyle");
  $tplFooter->assign("offline"       , false);
  $tplFooter->assign("debugMode"     , $debug);
  $tplFooter->assign("performance"   , CApp::$performance);
  //$tplFooter->assign("userIP"        , $address["client"]);
  $tplFooter->assign("errorMessage"  , CAppUI::getMsg());
  $tplFooter->display("footer.tpl");
}

// Ajax performance
if ($ajax) {
  $tplAjax = new CSmartyDP("modules/system");
  $tplAjax->assign("performance", CApp::$performance);
  $tplAjax->display("ajax_errors.tpl");
}
