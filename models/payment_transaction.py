import requests
import logging
import pprint
_logger = logging.getLogger(__name__)
from odoo import models, fields, api
# from odoo.addons.payment.models.payment_acquirer import ValidationError


class PaymentPagoPlux(models.Model):
    _inherit = 'payment.transaction'

    date = fields.Datetime()
    ppx_card_info = fields.Char()
    ppx_card_issuer = fields.Char()
    ppx_card_type = fields.Char()
    ppx_client_id = fields.Char()
    ppx_client_name = fields.Char()
    ppx_fecha = fields.Char()
    ppx_id_transaccion = fields.Char()
    ppx_token = fields.Char()
    ppx_state = fields.Char()   

    # --------------------------------------------------
    # FORM RELATED METHODS
    # --------------------------------------------------

    @api.model
    def _pagoplux_form_get_tx_from_data(self, data):
        """
        Permite obtener los valores de la transacción de acuerdo a nuestros propios métodos
        acá debemos aumentar los datos del voucher y lo demás, ya que este es llamado por el mpetodo feedback    
        """
        _logger.info('_pagoplux_values generated: Values received:\n%s', pprint.pformat(data))
        reference = data.get('reference')
        tx = self.search([('reference', '=', reference)])
        _logger.info('_pagoplux_values generated: Values transaction:\n%s', pprint.pformat(tx))
        return tx

    """
    Permite realizar las validaciones posteriores para determinar a que estado de transacción se adjuntará
    """
    def _process_notification_data(self, data):
        _logger.info('_form_validate generated: Values received:\n%s', pprint.pformat(data))
        # setea la transacción a realizada
        super()._process_notification_data(data)
        self._set_done()
        res = {
            'provider_reference': data.get('reference'),
            'date': fields.Datetime.now(),
            'ppx_card_info': data.get('cardInfo'),
            'ppx_card_issuer': data.get('cardIssuer'),
            'ppx_card_type': data.get('cardType'),
            'ppx_client_id': data.get('clientID'),
            'ppx_client_name': data.get('clientName'),
            'ppx_fecha': data.get('fecha'),
            'ppx_id_transaccion': data.get('id_transaccion'),
            'ppx_token': data.get('token'),
            'ppx_state': data.get('state')            
        }
        _logger.info('Validated Pagoplux payment for tx %s: set as done' % (self.reference))
        return self.write(res)

    def _pagoplux_form_get_invalid_parameters(self, data):
        invalid_parameters = []
        _logger.info('_invalid_form_parameters generated: Values received:\n%s', pprint.pformat(data))
        return invalid_parameters