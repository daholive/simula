/* $Id: usermessage.js 17075 2012-10-25 14:53:18Z rhum1 $ */

/**
 * @package Mediboard
 * @subpackage includes
 * @version $Revision: 17075 $
 * @author SARL OpenXtrem
 * @license GNU General Public License, see http://www.gnu.org/licenses/gpl.html 
 */

var UserMessage = {
  edit: function(usermessage_id) {
    var url = new Url("messagerie", "write_usermessage");
    url.addParam("usermessage_id", usermessage_id);
    url.modal(800, 500);
    url.modalObject.observe('afterClose', UserMessage.refresh);
  },
  
  create: function(to_id, subject) {
    var url = new Url("messagerie", "write_usermessage");
    url.addParam("usermessage_id", 0);
    if(to_id) {
      url.addParam("to", to_id);
    }
    if (subject) {
      url.addParam("subject", subject);
    }
    url.modal(800, 800);
    url.modalObject.observe('afterClose', UserMessage.refresh);
  },
  
  refresh: function() {}
};