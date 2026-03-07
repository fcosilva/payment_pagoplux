from odoo import http
from odoo import api
from odoo.http import request, Response
from ..models.payment_provider import AcquirerPagoplux
import werkzeug
import logging
import pprint
_logger = logging.getLogger(__name__)

class PaymentPagoPlux(http.Controller): 

    _success_url = '/payment/pagoplux/success'
    _cancel_url = '/payment/pagoplux/cancel'

    @http.route(['/payment/pagoplux/success', '/payment/pagoplux/cancel'], type='http', auth='public', csrf=False, method=['POST'])
    def pagoplux_success(self, **kwargs):
        _logger.info('Pagoplux Success Beginning form_feedback with post data %s', pprint.pformat(kwargs))  # debug
        tx_sudo = request.env['payment.transaction'].sudo().search([('reference', '=', kwargs.get('reference'))])
        tx_sudo._handle_notification_data('pagoplux', kwargs)
        #return werkzeug.utils.redirect('/payment/process'
        return '/payment/status'
    
    @http.route(['/payment/pagoplux/get_provider_info'], type='json', auth='public')
    def getInfoAcquierer(self, provider_id):
        """
        Devuelve la información del acquierer para cargar el respectivo archivo
        """
        _logger.info('Get info provider Beginning form_feedback with post data %s', pprint.pformat(provider_id))
        provider_sudo = request.env['payment.provider'].sudo().browse(provider_id).exists()
        # acquierer_ppx = request.env['payment.provider'].sudo().search([('provider', '=', 'pagoplux')])
        return AcquirerPagoplux._get_pagoplux_urls(self, provider_sudo)

